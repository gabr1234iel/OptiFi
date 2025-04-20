// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import {IProtocolAdapter} from "../interfaces/IProtocolAdapter.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";

// Interface for Compound V3 Comet
interface IComet {
    function supply(address asset, uint amount) external;
    function withdraw(address asset, uint amount) external;
    function balanceOf(address account) external view returns (uint256);
    function borrowBalanceOf(address account) external view returns (uint256);
    function getSupplyRate(uint utilization) external view returns (uint);
    function getUtilization() external view returns (uint);
    function baseToken() external view returns (address);
    function getReserves() external view returns (uint);
    function totalSupply() external view returns (uint);
    function totalBorrow() external view returns (uint);
}

// Interface for Compound V3 CometRewards
interface ICometRewards {
    function getRewardOwed(address comet, address account) external returns (address token, uint owed);
    function claim(address comet, address src, bool shouldAccrue) external;
}

/**
 * @title CompoundV3Adapter
 * @notice Adapter for Compound V3 protocol
 */
contract CompoundV3Adapter is IProtocolAdapter, Ownable {
    using SafeERC20 for IERC20;
    
    // CometRewards address
    address public immutable cometRewards;
    
    // Mapping of base token to Comet market
    mapping(address => address) public cometMarkets;
    
    // Events
    event Deposited(address indexed token, uint256 amount);
    event Withdrawn(address indexed token, uint256 amount);
    event RewardsClaimed(address indexed token, address indexed rewardToken, uint256 amount);
    
    /**
     * @dev Constructor
     * @param _cometRewards Address of Compound CometRewards contract
     */
    constructor(address _cometRewards) Ownable(msg.sender) {
        cometRewards = _cometRewards;
        
        // Initialize with known Compound V3 markets from mainnet
        cometMarkets[0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48] = 0xc3d688B66703497DAA19211EEdff47f25384cdc3; // USDC -> USDC.e Comet
        cometMarkets[0x1a7E64b593a9B8796e88a7489a2CEb6d079C850d] = 0xA17581A9E3356d9A858b789D68B4d866e593aE94; // ETH -> ETH Comet
        cometMarkets[0xdAC17F958D2ee523a2206206994597C13D831ec7] = 0x3Afdc9BCA9213A35503b077a6072F3D0d5AB0840; // USDT -> USDT Comet
        // Add standard WETH as well
        cometMarkets[0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2] = 0xA17581A9E3356d9A858b789D68B4d866e593aE94; // WETH -> ETH Comet
    }
    
    /**
     * @notice Add a supported market
     * @param token The base token address
     * @param comet The corresponding Comet market address
     */
    function addSupportedMarket(address token, address comet) external onlyOwner {
        require(token != address(0), "CompoundV3Adapter: token cannot be zero address");
        require(comet != address(0), "CompoundV3Adapter: comet cannot be zero address");
        
        cometMarkets[token] = comet;
    }
    
    /**
     * @notice Deposit assets into Compound V3
     * @param underlyingToken The address of the underlying token to deposit
     * @param amount The amount to deposit
     * @return The amount actually deposited
     */
    function deposit(address underlyingToken, uint256 amount) external override returns (uint256) {
        require(amount > 0, "CompoundV3Adapter: amount must be greater than 0");
        address comet = cometMarkets[underlyingToken];
        require(comet != address(0), "CompoundV3Adapter: token not supported");
        
        // Transfer tokens from sender to this contract
        IERC20(underlyingToken).safeTransferFrom(msg.sender, address(this), amount);
        
        // Approve Comet to spend tokens
        IERC20(underlyingToken).approve(comet, 0);
        IERC20(underlyingToken).approve(comet, amount);
        
        // Supply to Compound V3
        try IComet(comet).supply(underlyingToken, amount) {
            // Supply succeeded
        } catch {
            // In case of failure, revert the whole transaction
            revert("CompoundV3Adapter: supply failed");
        }
        
        emit Deposited(underlyingToken, amount);
        
        return amount;
    }
    
    /**
     * @notice Withdraw all assets from Compound V3
     * @param underlyingToken The address of the underlying token to withdraw
     * @return The amount withdrawn
     */
    function withdraw(address underlyingToken) external override returns (uint256) {
        address comet = cometMarkets[underlyingToken];
        require(comet != address(0), "CompoundV3Adapter: token not supported");
        
        // Get balance in Comet
        uint256 balance;
        try IComet(comet).balanceOf(address(this)) returns (uint256 bal) {
            balance = bal;
        } catch {
            return 0;
        }
        
        if (balance == 0) {
            return 0;
        }
        
        // Claim any pending rewards before withdrawing
        _claimRewards(comet);
        
        // Withdraw all from Compound V3
        try IComet(comet).withdraw(underlyingToken, balance) {
            // Withdraw succeeded
        } catch {
            // In case of failure, try to continue and get what we can
        }
        
        // Get the withdrawn amount
        uint256 withdrawnAmount = IERC20(underlyingToken).balanceOf(address(this));
        
        // Transfer tokens back to sender
        IERC20(underlyingToken).safeTransfer(msg.sender, withdrawnAmount);
        
        emit Withdrawn(underlyingToken, withdrawnAmount);
        
        return withdrawnAmount;
    }
    
    /**
     * @notice Get the current APY for a specific asset
     * @param underlyingToken The address of the underlying token
     * @return The current APY in basis points (1% = 100)
     */
    function getAPY(address underlyingToken) external view override returns (uint256) {
        address comet = cometMarkets[underlyingToken];
        if (comet == address(0)) {
            return 0;
        }
        
        uint256 supplyRate;
        uint256 utilization;
        
        try IComet(comet).getUtilization() returns (uint256 util) {
            utilization = util;
            
            try IComet(comet).getSupplyRate(utilization) returns (uint256 rate) {
                supplyRate = rate;
            } catch {
                return 0;
            }
        } catch {
            return 0;
        }
        
        // Convert to APY: supplyRate is per second
        // APY = (1 + supplyRate / 1e18) ^ (secondsPerYear) - 1
        // Approximate: supplyRate * secondsPerYear / 1e18
        uint256 secondsPerYear = 365 * 24 * 60 * 60;
        uint256 apy = (supplyRate * secondsPerYear * 10000) / 1e18;
        
        return apy;
    }
    
    /**
     * @notice Get the current balance in the protocol
     * @param underlyingToken The address of the underlying token
     * @return The current balance in underlying token units
     */
    function getBalance(address underlyingToken) external view override returns (uint256) {
        address comet = cometMarkets[underlyingToken];
        if (comet == address(0)) {
            return 0;
        }
        
        // Get balance in Comet
        try IComet(comet).balanceOf(address(this)) returns (uint256 balance) {
            return balance;
        } catch {
            return 0;
        }
    }
    
    /**
     * @notice Claim rewards for a specific market
     * @param token The token address
     */
    function claimRewards(address token) external {
        address comet = cometMarkets[token];
        require(comet != address(0), "CompoundV3Adapter: token not supported");
        
        _claimRewards(comet);
    }
    
    /**
     * @notice Rescue tokens stuck in this contract
     * @param token The token to rescue
     * @param to The address to send tokens to
     * @param amount The amount to rescue
     */
    function rescue(address token, address to, uint256 amount) external onlyOwner {
        IERC20(token).safeTransfer(to, amount);
    }
    
    /**
     * @dev Internal function to claim rewards
     * @param comet The Comet market address
     */
    function _claimRewards(address comet) internal {
        if (cometRewards != address(0)) {
            try ICometRewards(cometRewards).claim(comet, address(this), true) {
                // Try to get info about claimed rewards (this is optional)
                try ICometRewards(cometRewards).getRewardOwed(comet, address(this)) returns (address token, uint256 amount) {
                    if (amount > 0) {
                        emit RewardsClaimed(IComet(comet).baseToken(), token, amount);
                    }
                } catch {}
            } catch {}
        }
    }
}