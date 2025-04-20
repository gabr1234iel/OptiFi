// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import {ReentrancyGuard} from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {IProtocolAdapter} from "./interfaces/IProtocolAdapter.sol";

/**
 * @title UniversalVault
 * @notice A vault that can deposit funds into different DeFi protocols
 */
contract UniversalVault is Ownable, ReentrancyGuard {
    using SafeERC20 for IERC20;
    
    // Mapping of token => adapter
    mapping(address => IProtocolAdapter) public tokenAdapters;
    
    // User balances: user => token => amount
    mapping(address => mapping(address => uint256)) public userBalances;
    
    // Total vault balances: token => amount
    mapping(address => uint256) public vaultBalances;
    
    // Events
    event AdapterSet(address indexed token, address indexed adapter);
    event Deposited(address indexed user, address indexed token, uint256 amount);
    event Withdrawn(address indexed user, address indexed token, uint256 amount);
    event ProtocolDeposit(address indexed token, address indexed adapter, uint256 amount);
    event ProtocolWithdraw(address indexed token, address indexed adapter, uint256 amount);
    
    /**
     * @dev Constructor
     */
    constructor() Ownable(msg.sender) {}
    
    /**
     * @notice Set the adapter for a token
     * @param token The token address
     * @param adapter The adapter address
     */
    function setAdapter(address token, address adapter) external onlyOwner {
        require(token != address(0), "UniversalVault: token cannot be zero address");
        require(adapter != address(0), "UniversalVault: adapter cannot be zero address");
        
        // If we're changing adapters, withdraw from old adapter first
        if (address(tokenAdapters[token]) != address(0)) {
            uint256 adapterBalance = tokenAdapters[token].getBalance(token);
            if (adapterBalance > 0) {
                tokenAdapters[token].withdraw(token);
            }
        }
        
        tokenAdapters[token] = IProtocolAdapter(adapter);
        
        emit AdapterSet(token, adapter);
    }
    
    /**
     * @notice User deposits tokens into the vault
     * @param token The token address
     * @param amount The amount to deposit
     */
    function deposit(address token, uint256 amount) external nonReentrant {
        require(amount > 0, "UniversalVault: amount must be greater than 0");
        
        // Transfer tokens from user to vault
        IERC20(token).safeTransferFrom(msg.sender, address(this), amount);
        
        // Update balances
        userBalances[msg.sender][token] += amount;
        vaultBalances[token] += amount;
        
        emit Deposited(msg.sender, token, amount);
        
        // If there's an adapter for this token, deposit to protocol
        if (address(tokenAdapters[token]) != address(0)) {
            _depositToProtocol(token, amount);
        }
    }
    
    /**
     * @notice User withdraws tokens from the vault
     * @param token The token address
     * @param amount The amount to withdraw
     */
    function withdraw(address token, uint256 amount) external nonReentrant {
        require(amount > 0, "UniversalVault: amount must be greater than 0");
        require(userBalances[msg.sender][token] >= amount, "UniversalVault: insufficient balance");
        
        // Update balances
        userBalances[msg.sender][token] -= amount;
        vaultBalances[token] -= amount;
        
        // If there's an adapter for this token, we might need to withdraw from protocol
        if (address(tokenAdapters[token]) != address(0)) {
            uint256 vaultTokenBalance = IERC20(token).balanceOf(address(this));
            
            if (vaultTokenBalance < amount) {
                // Need to withdraw from protocol
                _withdrawFromProtocol(token, amount - vaultTokenBalance);
            }
        }
        
        // Transfer tokens to user
        IERC20(token).safeTransfer(msg.sender, amount);
        
        emit Withdrawn(msg.sender, token, amount);
    }
    
    /**
     * @notice Get the APY for a token across all protocols
     * @param token The token address
     * @return The APY in basis points (1% = 100)
     */
    function getAPY(address token) external view returns (uint256) {
        if (address(tokenAdapters[token]) != address(0)) {
            return tokenAdapters[token].getAPY(token);
        }
        return 0;
    }
    
    /**
     * @notice Get user balance for a specific token
     * @param user The user address
     * @param token The token address
     * @return The user's balance
     */
    function getUserBalance(address user, address token) external view returns (uint256) {
        return userBalances[user][token];
    }
    
    /**
     * @notice Get the total balance for a token (including protocol deposits)
     * @param token The token address
     * @return The total balance
     */
    function getTotalBalance(address token) external view returns (uint256) {
        uint256 vaultTokenBalance = IERC20(token).balanceOf(address(this));
        
        if (address(tokenAdapters[token]) != address(0)) {
            vaultTokenBalance += tokenAdapters[token].getBalance(token);
        }
        
        return vaultTokenBalance;
    }
    
    /**
     * @notice Rebalance a token to the adapter with the highest APY
     * @param token The token address
     * @param newAdapter The address of the new adapter with higher APY
     */
    function rebalance(address token, address newAdapter) external onlyOwner {
        require(token != address(0), "UniversalVault: token cannot be zero address");
        require(newAdapter != address(0), "UniversalVault: adapter cannot be zero address");
        require(newAdapter != address(tokenAdapters[token]), "UniversalVault: already using this adapter");
        
        // Withdraw from current adapter
        if (address(tokenAdapters[token]) != address(0)) {
            uint256 adapterBalance = tokenAdapters[token].getBalance(token);
            if (adapterBalance > 0) {
                tokenAdapters[token].withdraw(token);
            }
        }
        
        // Set new adapter
        tokenAdapters[token] = IProtocolAdapter(newAdapter);
        
        emit AdapterSet(token, newAdapter);
        
        // Deposit to new adapter
        uint256 vaultTokenBalance = IERC20(token).balanceOf(address(this));
        if (vaultTokenBalance > 0) {
            _depositToProtocol(token, vaultTokenBalance);
        }
    }
    
    /**
     * @notice Deposit tokens to protocol through adapter
     * @param token The token address
     * @param amount The amount to deposit
     */
    function _depositToProtocol(address token, uint256 amount) internal {
        require(address(tokenAdapters[token]) != address(0), "UniversalVault: no adapter set for token");
        
        // Approve the adapter to spend tokens
        IERC20(token).approve(address(tokenAdapters[token]), 0);
        IERC20(token).approve(address(tokenAdapters[token]), amount);
        
        // Deposit to adapter
        uint256 depositedAmount = tokenAdapters[token].deposit(token, amount);
        
        emit ProtocolDeposit(token, address(tokenAdapters[token]), depositedAmount);
    }
    
    /**
     * @notice Withdraw tokens from protocol through adapter
     * @param token The token address
     * @param minAmount The minimum amount needed
     */
    function _withdrawFromProtocol(address token, uint256 minAmount) internal {
        require(address(tokenAdapters[token]) != address(0), "UniversalVault: no adapter set for token");
        
        // Withdraw from adapter
        uint256 withdrawnAmount = tokenAdapters[token].withdraw(token);
        
        emit ProtocolWithdraw(token, address(tokenAdapters[token]), withdrawnAmount);
        
        // Ensure we got enough
        require(withdrawnAmount >= minAmount, "UniversalVault: insufficient funds returned from protocol");
    }
    
    /**
     * @notice Force deposit all vault's balance of a token to the protocol
     * @param token The token address
     */
    function forceDeposit(address token) external onlyOwner {
        require(address(tokenAdapters[token]) != address(0), "UniversalVault: no adapter set for token");
        
        uint256 vaultTokenBalance = IERC20(token).balanceOf(address(this));
        require(vaultTokenBalance > 0, "UniversalVault: no balance to deposit");
        
        _depositToProtocol(token, vaultTokenBalance);
    }
    
    /**
     * @notice Force withdraw all of a token from the protocol
     * @param token The token address
     */
    function forceWithdraw(address token) external onlyOwner {
        require(address(tokenAdapters[token]) != address(0), "UniversalVault: no adapter set for token");
        
        uint256 adapterBalance = tokenAdapters[token].getBalance(token);
        require(adapterBalance > 0, "UniversalVault: no balance to withdraw");
        
        _withdrawFromProtocol(token, 0);
    }
    
    /**
     * @notice Rescue tokens stuck in this contract
     * @param token The token to rescue
     * @param to The address to send tokens to
     * @param amount The amount to rescue
     */
    function rescue(address token, address to, uint256 amount) external onlyOwner {
        // Don't allow rescue of tokens that users have deposited
        require(vaultBalances[token] == 0 || IERC20(token).balanceOf(address(this)) > vaultBalances[token], 
            "UniversalVault: cannot rescue user funds");
        
        // Calculate maximum amount that can be rescued
        uint256 rescuableAmount = IERC20(token).balanceOf(address(this)) - vaultBalances[token];
        require(amount <= rescuableAmount, "UniversalVault: cannot rescue more than available");
        
        IERC20(token).safeTransfer(to, amount);
    }
}