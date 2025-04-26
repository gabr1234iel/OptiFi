// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import {IProtocolAdapter} from "../interfaces/IProtocolAdapter.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";

// Interface for SUsds
interface ISUsds {
    function deposit(uint256 assets, address receiver) external returns (uint256);
    function mint(uint256 shares, address receiver) external returns (uint256);
    function withdraw(uint256 assets, address receiver, address owner) external returns (uint256);
    function redeem(uint256 shares, address receiver, address owner) external returns (uint256);
    function balanceOf(address owner) external view returns (uint256);
    function asset() external view returns (address);
    function ssr() external view returns (uint256);
    function chi() external view returns (uint192);
    function convertToShares(uint256 assets) external view returns (uint256);
    function convertToAssets(uint256 shares) external view returns (uint256);
    function previewRedeem(uint256 shares) external view returns (uint256);
    function maxWithdraw(address owner) external view returns (uint256);
}

/**
 * @title SkyLendingAdapter
 * @notice Adapter for SUsds protocol (Sky.money)
 */
contract SkyLendingAdapter is IProtocolAdapter, Ownable {
    using SafeERC20 for IERC20;
    
    // SUsds token address
    address public immutable sUsdsToken;
    
    // USDS token address (underlying)
    address public immutable usdsToken;
    
    // RAY constant from SUsds contract
    uint256 private constant RAY = 10 ** 27;
    
    // Events
    event Deposited(address indexed token, uint256 amount);
    event Withdrawn(address indexed token, uint256 amount);
    
    /**
     * @dev Constructor
     * @param _sUsdsToken Address of SUsds token
     */
    constructor(address _sUsdsToken) Ownable(msg.sender) {
        require(_sUsdsToken != address(0), "SUsdsAdapter: sUsds cannot be zero address");
        sUsdsToken = _sUsdsToken;
        
        // Get the underlying token address
        usdsToken = ISUsds(_sUsdsToken).asset();
        require(usdsToken != address(0), "SUsdsAdapter: USDS token cannot be zero address");
    }
    
    /**
     * @notice Deposit assets into SUsds
     * @param underlyingToken The address of the underlying token to deposit
     * @param amount The amount to deposit
     * @return The amount actually deposited
     */
    function deposit(address underlyingToken, uint256 amount) external override returns (uint256) {
        require(underlyingToken == usdsToken, "SUsdsAdapter: token not supported");
        require(amount > 0, "SUsdsAdapter: amount must be greater than 0");
        
        // Transfer tokens from sender to this contract
        IERC20(usdsToken).safeTransferFrom(msg.sender, address(this), amount);
        
        // Approve sUsds to spend tokens
        IERC20(usdsToken).approve(sUsdsToken, 0);
        IERC20(usdsToken).approve(sUsdsToken, amount);
        
        // Deposit to SUsds
        uint256 sharesBefore = IERC20(sUsdsToken).balanceOf(address(this));
        
        try ISUsds(sUsdsToken).deposit(amount, address(this)) {
            // Deposit succeeded
        } catch {
            // If deposit fails, revert the transaction
            revert("SUsdsAdapter: deposit failed");
        }
        
        uint256 sharesAfter = IERC20(sUsdsToken).balanceOf(address(this));
        
        emit Deposited(underlyingToken, amount);
        
        return amount;
    }
    
    /**
     * @notice Withdraw all assets from SUsds
     * @param underlyingToken The address of the underlying token to withdraw
     * @return The amount withdrawn
     */
    function withdraw(address underlyingToken) external override returns (uint256) {
        require(underlyingToken == usdsToken, "SUsdsAdapter: token not supported");
        
        // Get sUsds balance
        uint256 sUsdsBalance = IERC20(sUsdsToken).balanceOf(address(this));
        
        if (sUsdsBalance == 0) {
            return 0;
        }
        
        // Determine how much we can withdraw
        uint256 assets;
        try ISUsds(sUsdsToken).maxWithdraw(address(this)) returns (uint256 amount) {
            assets = amount;
        } catch {
            // If maxWithdraw fails, use convertToAssets
            try ISUsds(sUsdsToken).convertToAssets(sUsdsBalance) returns (uint256 amount) {
                assets = amount;
            } catch {
                // If all else fails, revert
                revert("SUsdsAdapter: failed to calculate withdrawal amount");
            }
        }
        
        if (assets == 0) {
            return 0;
        }
        
        // Get initial USDS balance
        uint256 initialUsdsBalance = IERC20(usdsToken).balanceOf(address(this));
        
        // Try to redeem all shares first
        try ISUsds(sUsdsToken).redeem(
            sUsdsBalance,
            address(this),
            address(this)
        ) {
            // Redeem succeeded
        } catch {
            // If redeem fails, try to withdraw assets
            try ISUsds(sUsdsToken).withdraw(
                assets,
                address(this),
                address(this)
            ) {
                // Withdraw succeeded
            } catch {
                // If both methods fail, try with a reduced amount
                uint256 reducedAssets = assets * 90 / 100; // 90% of the original amount
                if (reducedAssets > 0) {
                    try ISUsds(sUsdsToken).withdraw(
                        reducedAssets,
                        address(this),
                        address(this)
                    ) {
                        // Withdraw succeeded
                    } catch {
                        // If all attempts fail, revert
                        revert("SUsdsAdapter: all withdrawal attempts failed");
                    }
                } else {
                    // If there's nothing to withdraw, return 0
                    return 0;
                }
            }
        }
        
        // Calculate withdrawn amount
        uint256 withdrawnAmount = IERC20(usdsToken).balanceOf(address(this)) - initialUsdsBalance;
        
        // Transfer tokens back to sender
        if (withdrawnAmount > 0) {
            IERC20(usdsToken).safeTransfer(msg.sender, withdrawnAmount);
        }
        
        emit Withdrawn(underlyingToken, withdrawnAmount);
        
        return withdrawnAmount;
    }
    
    /**
     * @notice Get the current APY for a specific asset
     * @param underlyingToken The address of the underlying token
     * @return The current APY in basis points (1% = 100)
     */
    function getAPY(address underlyingToken) external view override returns (uint256) {
        require(underlyingToken == usdsToken, "SUsdsAdapter: token not supported");
        
        try ISUsds(sUsdsToken).ssr() returns (uint256 ssr) {
            // Current savings rate in ray (10^27)
            // Convert from ray to basis points
            // ssr is expressed as a ray where RAY (10^27) = 100% annually
            // Basis points are 1% = 100, so we need to:
            // 1. Subtract RAY to get the APY above 100%
            // 2. Divide by 10^23 to convert from ray to basis points
            if (ssr > RAY) {
                return (ssr - RAY) / (10**23);
            }
            return 0; // No yield if ssr <= RAY
        } catch {
            return 0;
        }
    }
    
    /**
     * @notice Get the current balance in the protocol
     * @param underlyingToken The address of the underlying token
     * @return The current balance in underlying token units
     */
    function getBalance(address underlyingToken) external view override returns (uint256) {
        require(underlyingToken == usdsToken, "SUsdsAdapter: token not supported");
        
        // Get sUsds balance
        uint256 sUsdsBalance = IERC20(sUsdsToken).balanceOf(address(this));
        
        if (sUsdsBalance == 0) {
            return 0;
        }
        
        // Convert shares to assets
        try ISUsds(sUsdsToken).convertToAssets(sUsdsBalance) returns (uint256 assets) {
            return assets;
        } catch {
            // If convertToAssets fails, calculate manually
            try ISUsds(sUsdsToken).chi() returns (uint192 chi) {
                // Calculate assets = shares * chi / RAY
                return sUsdsBalance * uint256(chi) / RAY;
            } catch {
                // If all calculations fail, return 0
                return 0;
            }
        }
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
}