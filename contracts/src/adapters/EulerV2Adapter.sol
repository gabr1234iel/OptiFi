// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import {IProtocolAdapter} from "../interfaces/IProtocolAdapter.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";

// Interface for Euler V2 EVault (ERC4626 compatible)
interface IEVault {
    function asset() external view returns (address);
    function deposit(uint256 assets, address receiver) external returns (uint256);
    function mint(uint256 shares, address receiver) external returns (uint256);
    function withdraw(uint256 assets, address receiver, address owner) external returns (uint256);
    function redeem(uint256 shares, address receiver, address owner) external returns (uint256);
    function totalAssets() external view returns (uint256);
    function totalSupply() external view returns (uint256);
    function balanceOf(address owner) external view returns (uint256);
    function convertToAssets(uint256 shares) external view returns (uint256);
    function convertToShares(uint256 assets) external view returns (uint256);
    function previewRedeem(uint256 shares) external view returns (uint256);
    function maxWithdraw(address owner) external view returns (uint256);
    function interestRate() external view returns (uint256);
}

/**
 * @title EulerV2Adapter
 * @notice Adapter for Euler v2 protocol's EVault
 */
contract EulerV2Adapter is IProtocolAdapter, Ownable {
    using SafeERC20 for IERC20;
    
    // Mapping of token => eVault
    mapping(address => address) public eVaults;
    
    // Events
    event TokenAdded(address indexed token, address indexed eVault);
    event TokenRemoved(address indexed token);
    event Deposited(address indexed token, address indexed eVault, uint256 amount);
    event Withdrawn(address indexed token, address indexed eVault, uint256 amount);
    
    /**
     * @dev Constructor
     */
    constructor() Ownable(msg.sender) {
        // Initialize with known Euler eVaults
        eVaults[0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48] = 0x797DD80692c3b2dAdabCe8e30C07fDE5307D48a9; // USDC -> EUSDC-2
        eVaults[0x7f39C581F595B53c5cb19bD0b3f8dA6c935E2Ca0] = 0xe846ca062aB869b66aE8DcD811973f628BA82eAf; // wstETH -> EWEETH-6
        eVaults[0x2260FAC5E5542a773Aa44fBCfeDf7C193bc2C599] = 0x998D761eC1BAdaCeb064624cc3A1d37A46C88bA4; // WBTC -> EWBTC-3
        eVaults[0xe9e7CEA3DedcA5984780Bafc599bD69ADd087D56] = 0x61aAC438453d6e3513C0c8dbb69F13860E2B5028; // USDE -> EEUSDE-1
        eVaults[0xA1290d69c65A6Fe4DF752f95823fae25cB99e5A7] = 0x1924D7fab80d0623f0836Cbf5258a7fa734EE9D9; // RSETH -> ERSETH-4
        eVaults[0x35D8949372D46B7a3D5A56006AE77B215fc69bC0] = 0xF037eeEBA7729c39114B9711c75FbccCa4A343C8; // USD0 -> EUSD0-4
    }
    
    /**
     * @notice Add or update a supported token
     * @param token The token address
     * @param eVault The corresponding eVault address
     */
    function addSupportedToken(address token, address eVault) external onlyOwner {
        require(token != address(0), "EulerV2Adapter: token cannot be zero address");
        require(eVault != address(0), "EulerV2Adapter: eVault cannot be zero address");
        
        // Verify the eVault's underlying asset matches the token
        try IEVault(eVault).asset() returns (address underlying) {
            require(underlying == token, "EulerV2Adapter: token mismatch with eVault");
        } catch {
            revert("EulerV2Adapter: eVault asset check failed");
        }
        
        eVaults[token] = eVault;
        
        emit TokenAdded(token, eVault);
    }
    
    /**
     * @notice Remove a supported token
     * @param token The token address to remove
     */
    function removeSupportedToken(address token) external onlyOwner {
        require(eVaults[token] != address(0), "EulerV2Adapter: token not supported");
        
        emit TokenRemoved(token);
        delete eVaults[token];
    }
    
    /**
     * @notice Deposit assets into Euler V2
     * @param underlyingToken The address of the underlying token to deposit
     * @param amount The amount to deposit
     * @return The amount actually deposited
     */
    function deposit(address underlyingToken, uint256 amount) external override returns (uint256) {
        address eVault = eVaults[underlyingToken];
        require(eVault != address(0), "EulerV2Adapter: token not supported");
        require(amount > 0, "EulerV2Adapter: amount must be greater than 0");
        
        // Transfer tokens from sender to this contract
        IERC20(underlyingToken).safeTransferFrom(msg.sender, address(this), amount);
        
        // Approve eVault to spend tokens
        IERC20(underlyingToken).approve(eVault, 0);
        IERC20(underlyingToken).approve(eVault, amount);
        
        // Get initial share balance
        uint256 initialShares = IERC20(eVault).balanceOf(address(this));
        
        // Deposit to Euler eVault
        try IEVault(eVault).deposit(amount, address(this)) {
            // Deposit succeeded
        } catch {
            // If deposit fails, revert the transaction
            revert("EulerV2Adapter: deposit failed");
        }
        
        // Calculate shares received
        uint256 finalShares = IERC20(eVault).balanceOf(address(this));
        uint256 sharesReceived = finalShares - initialShares;
        
        emit Deposited(underlyingToken, eVault, amount);
        
        return amount;
    }
    
    /**
     * @notice Withdraw all assets from Euler V2
     * @param underlyingToken The address of the underlying token to withdraw
     * @return The amount withdrawn
     */
    function withdraw(address underlyingToken) external override returns (uint256) {
        address eVault = eVaults[underlyingToken];
        require(eVault != address(0), "EulerV2Adapter: token not supported");
        
        // Get initial underlying balance
        uint256 initialUnderlyingBalance = IERC20(underlyingToken).balanceOf(address(this));
        
        // Get share balance
        uint256 shareBalance = IERC20(eVault).balanceOf(address(this));
        
        if (shareBalance == 0) {
            return 0;
        }
        
        // Determine how much we can withdraw
        uint256 maxWithdraw;
        try IEVault(eVault).maxWithdraw(address(this)) returns (uint256 amount) {
            maxWithdraw = amount;
        } catch {
            // If maxWithdraw fails, estimate from shares
            try IEVault(eVault).convertToAssets(shareBalance) returns (uint256 assets) {
                maxWithdraw = assets * 90 / 100; // 90% as safety margin
            } catch {
                // If convertToAssets fails too, use a very conservative estimate
                maxWithdraw = 0;
            }
        }
        
        // If we can't withdraw anything, return early
        if (maxWithdraw == 0) {
            return 0;
        }
        
        // Try to withdraw using the most efficient method
        bool withdrawSuccess = false;
        
        // First try to redeem all shares if possible
        try IEVault(eVault).redeem(
            shareBalance,
            address(this),
            address(this)
        ) {
            withdrawSuccess = true;
        } catch {
            // Fall through to next method
        }
        
        // If redeem didn't work, try withdraw with maxWithdraw amount
        if (!withdrawSuccess && maxWithdraw > 0) {
            try IEVault(eVault).withdraw(
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
        if (!withdrawSuccess && maxWithdraw > 0) {
            uint256 reducedAmount = maxWithdraw * 80 / 100;
            if (reducedAmount > 0) {
                try IEVault(eVault).withdraw(
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
        
        emit Withdrawn(underlyingToken, eVault, withdrawnAmount);
        
        return withdrawnAmount;
    }
    
    /**
     * @notice Get the current APY for a specific asset
     * @param underlyingToken The address of the underlying token
     * @return The current APY in basis points (1% = 100)
     */
    function getAPY(address underlyingToken) external view override returns (uint256) {
        address eVault = eVaults[underlyingToken];
        if (eVault == address(0)) {
            return 0;
        }
        
        // Get the interest rate from the eVault
        try IEVault(eVault).interestRate() returns (uint256 rate) {
            // Convert to basis points (1% = 100)
            // Euler returns the interest rate in a fixed point format, typically in RAY (10^27)
            // We convert it to annual percentage with 2 decimal precision (basis points)
            return rate / 10**23; // Convert from RAY (10^27) to basis points (10^2)
        } catch {
            // If interestRate call fails, return a conservative estimate
            return 200; // 2% as a default value
        }
    }
    
    /**
     * @notice Get the current balance in the protocol
     * @param underlyingToken The address of the underlying token
     * @return The current balance in underlying token units
     */
    function getBalance(address underlyingToken) external view override returns (uint256) {
        address eVault = eVaults[underlyingToken];
        if (eVault == address(0)) {
            return 0;
        }
        
        // Get share balance
        uint256 shareBalance;
        try IERC20(eVault).balanceOf(address(this)) returns (uint256 balance) {
            shareBalance = balance;
        } catch {
            return 0;
        }
        
        if (shareBalance == 0) {
            return 0;
        }
        
        // Convert shares to assets
        try IEVault(eVault).convertToAssets(shareBalance) returns (uint256 assets) {
            return assets;
        } catch {
            // If conversion fails, make a conservative estimate
            try IEVault(eVault).totalAssets() returns (uint256 totalAssets) {
                try IEVault(eVault).totalSupply() returns (uint256 totalSupply) {
                    if (totalSupply > 0) {
                        return (shareBalance * totalAssets) / totalSupply;
                    }
                } catch {}
            } catch {}
            
            // If all estimations fail, return 0
            return 0;
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