// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import {IProtocolAdapter} from "../interfaces/IProtocolAdapter.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";

// Interface for Fluid's fToken (ERC4626 compatible)
interface IFToken {
    function asset() external view returns (address);
    function deposit(uint256 assets, address receiver) external returns (uint256);
    function withdraw(uint256 assets, address receiver, address owner) external returns (uint256);
    function redeem(uint256 shares, address receiver, address owner) external returns (uint256);
    function balanceOf(address owner) external view returns (uint256);
    function convertToAssets(uint256 shares) external view returns (uint256);
    function previewRedeem(uint256 shares) external view returns (uint256);
    function maxWithdraw(address owner) external view returns (uint256);
    function getData() external view returns (
        address liquidity,
        address lendingFactory,
        address lendingRewardsRateModel,
        address permit2,
        address rebalancer,
        bool rewardsActive,
        uint256 liquidityBalance,
        uint256 liquidityExchangePrice,
        uint256 tokenExchangePrice
    );
}

/**
 * @title FluidProtocolAdapter
 * @notice Adapter for Fluid Protocol (fTokens)
 */
contract FluidProtocolAdapter is IProtocolAdapter, Ownable {
    using SafeERC20 for IERC20;
    
    // Mapping of token => fToken
    mapping(address => address) public fTokens;
    
    // Events
    event TokenAdded(address indexed token, address indexed fToken);
    event TokenRemoved(address indexed token);
    event Deposited(address indexed token, address indexed fToken, uint256 amount);
    event Withdrawn(address indexed token, address indexed fToken, uint256 amount);
    
    /**
     * @dev Constructor
     */
    constructor() Ownable(msg.sender) {
        // Initialize with known Fluid fTokens
        // Add default mappings for common tokens
        fTokens[0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48] = 0x9Fb7b4477576Fe5B32be4C1843aFB1e55F251B33; // USDC -> fUSDC
        fTokens[0xdAC17F958D2ee523a2206206994597C13D831ec7] = 0x5C20B550819128074FD538Edf79791733ccEdd18; // USDT -> fUSDT
        fTokens[0x7f39C581F595B53c5cb19bD0b3f8dA6c935E2Ca0] = 0x2411802D8BEA09be0aF8fD8D08314a63e706b29C; // wstETH -> fWSTETH
    }
    
    /**
     * @notice Add a supported token
     * @param token The token address
     * @param fToken The corresponding fToken address
     */
    function addSupportedToken(address token, address fToken) external onlyOwner {
        require(token != address(0), "FluidProtocolAdapter: token cannot be zero address");
        require(fToken != address(0), "FluidProtocolAdapter: fToken cannot be zero address");
        
        // Verify the fToken's underlying asset matches the token
        address underlying = IFToken(fToken).asset();
        require(underlying == token, "FluidProtocolAdapter: token mismatch with fToken");
        
        fTokens[token] = fToken;
        
        emit TokenAdded(token, fToken);
    }
    
    /**
     * @notice Remove a supported token
     * @param token The token address to remove
     */
    function removeSupportedToken(address token) external onlyOwner {
        require(fTokens[token] != address(0), "FluidProtocolAdapter: token not supported");
        
        emit TokenRemoved(token);
        delete fTokens[token];
    }
    
    /**
     * @notice Deposit assets into Fluid Protocol (fToken)
     * @param underlyingToken The address of the underlying token to deposit
     * @param amount The amount to deposit
     * @return The amount actually deposited
     */
    function deposit(address underlyingToken, uint256 amount) external override returns (uint256) {
        address fToken = fTokens[underlyingToken];
        require(fToken != address(0), "FluidProtocolAdapter: token not supported");
        require(amount > 0, "FluidProtocolAdapter: amount must be greater than 0");
        
        // Transfer tokens from sender to this contract
        IERC20(underlyingToken).safeTransferFrom(msg.sender, address(this), amount);
        
        // Approve fToken to spend tokens
        IERC20(underlyingToken).approve(fToken, 0);
        IERC20(underlyingToken).approve(fToken, amount);
        
        // Deposit to Fluid fToken
        uint256 sharesBefore = IERC20(fToken).balanceOf(address(this));
        
        try IFToken(fToken).deposit(amount, address(this)) {
            // Deposit succeeded
        } catch {
            // If deposit fails, revert the transaction
            revert("FluidProtocolAdapter: deposit failed");
        }
        
        uint256 sharesAfter = IERC20(fToken).balanceOf(address(this));
        
        emit Deposited(underlyingToken, fToken, amount);
        
        return amount;
    }
    
    /**
     * @notice Withdraw all assets from Fluid Protocol (fToken)
     * @param underlyingToken The address of the underlying token to withdraw
     * @return The amount withdrawn
     */
    function withdraw(address underlyingToken) external override returns (uint256) {
        address fToken = fTokens[underlyingToken];
        require(fToken != address(0), "FluidProtocolAdapter: token not supported");
        
        // Get fToken balance and initial underlying balance
        uint256 fTokenBalance = IERC20(fToken).balanceOf(address(this));
        uint256 initialUnderlyingBalance = IERC20(underlyingToken).balanceOf(address(this));
        
        if (fTokenBalance == 0) {
            return 0;
        }
        
        // Determine how much we can withdraw
        uint256 maxWithdraw;
        try IFToken(fToken).maxWithdraw(address(this)) returns (uint256 amount) {
            maxWithdraw = amount;
        } catch {
            // If maxWithdraw fails, set to a conservative estimate
            maxWithdraw = IFToken(fToken).convertToAssets(fTokenBalance) * 90 / 100; // 90% as safety margin
        }
        
        // If we can't withdraw anything, return early
        if (maxWithdraw == 0) {
            return 0;
        }
        
        // Try to withdraw using the most efficient method
        bool withdrawSuccess = false;
        
        // First try to redeem all shares if possible (most efficient)
        if (maxWithdraw >= IFToken(fToken).convertToAssets(fTokenBalance) * 90 / 100) { // If we can get at least 90% of assets
            try IFToken(fToken).redeem(
                fTokenBalance,
                address(this),
                address(this)
            ) {
                withdrawSuccess = true;
            } catch {
                // Fall through to next method
            }
        }
        
        // If redeem didn't work, try withdraw with maxWithdraw amount
        if (!withdrawSuccess) {
            try IFToken(fToken).withdraw(
                maxWithdraw,
                address(this),
                address(this)
            ) {
                withdrawSuccess = true;
            } catch {
                // Fall through to final approach
            }
        }
        
        // If both methods failed, try withdraw with a reduced amount (80% of max)
        if (!withdrawSuccess) {
            uint256 reducedAmount = maxWithdraw * 80 / 100;
            if (reducedAmount > 0) {
                try IFToken(fToken).withdraw(
                    reducedAmount,
                    address(this),
                    address(this)
                ) {
                    withdrawSuccess = true;
                } catch {
                    // If all approaches fail, return 0
                    return 0;
                }
            } else {
                return 0;
            }
        }
        
        // Calculate how much we actually withdrew
        uint256 finalUnderlyingBalance = IERC20(underlyingToken).balanceOf(address(this));
        uint256 withdrawnAmount = 0;
        
        if (finalUnderlyingBalance > initialUnderlyingBalance) {
            withdrawnAmount = finalUnderlyingBalance - initialUnderlyingBalance;
            
            // Transfer the withdrawn amount to the sender
            IERC20(underlyingToken).safeTransfer(msg.sender, withdrawnAmount);
        }
        
        emit Withdrawn(underlyingToken, fToken, withdrawnAmount);
        
        return withdrawnAmount;
    }
    
    /**
     * @notice Get the current APY for a specific asset
     * @param underlyingToken The address of the underlying token
     * @return The current APY in basis points (1% = 100)
     */
    function getAPY(address underlyingToken) external view override returns (uint256) {
        address fToken = fTokens[underlyingToken];
        if (fToken == address(0)) {
            return 0;
        }
        
        try IFToken(fToken).getData() returns (
            address liquidity,
            address lendingFactory,
            address lendingRewardsRateModel,
            address permit2,
            address rebalancer,
            bool rewardsActive,
            uint256 liquidityBalance,
            uint256 liquidityExchangePrice,
            uint256 tokenExchangePrice
        ) {
            // Fluid Protocol doesn't provide direct APY data through the contract
            // We could approximate it from the exchange price over time
            // For now, returning a conservative estimate based on if rewards are active
            if (rewardsActive) {
                return 400; // 4% APY as a conservative estimate when rewards are active
            } else {
                return 200; // 2% APY as a conservative estimate when no rewards
            }
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
        address fToken = fTokens[underlyingToken];
        if (fToken == address(0)) {
            return 0;
        }
        
        // Get fToken balance
        uint256 fTokenBalance = IERC20(fToken).balanceOf(address(this));
        
        if (fTokenBalance == 0) {
            return 0;
        }
        
        // Convert shares to assets
        return IFToken(fToken).convertToAssets(fTokenBalance);
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