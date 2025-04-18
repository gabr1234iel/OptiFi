// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "./interfaces/IAaveV2Pool.sol";
import "./interfaces/IAaveV3Pool.sol";

/**
 * @title AaveVault
 * @notice A simple vault that deposits funds into Aave V2 or V3 to generate yield
 */
contract AaveVault is Ownable {
    using SafeERC20 for IERC20;

    // Aave Pool address
    address public immutable aavePool;
    
    // Aave version
    bool public immutable isV3;
    
    // Token address => aToken address mapping
    mapping(address => address) public aTokens;
    
    // Total principal amount per token
    mapping(address => uint256) public totalPrincipal;
    
    // User deposits per token
    mapping(address => mapping(address => uint256)) public userDeposits;

    // Events
    event Deposited(address indexed user, address indexed token, uint256 amount);
    event Withdrawn(address indexed user, address indexed token, uint256 amount);
    event YieldHarvested(address indexed token, uint256 amount);

    /**
     * @dev Constructor
     * @param _aavePool Address of the Aave Pool contract
     * @param _isV3 Whether this is Aave V3 or V2
     */
    constructor(address _aavePool, bool _isV3) Ownable(msg.sender) {
        require(_aavePool != address(0), "Invalid Aave Pool address");
        aavePool = _aavePool;
        isV3 = _isV3;
    }

    /**
     * @dev Add support for a new token
     * @param token Token address
     * @param aToken Corresponding aToken address
     */
    function addToken(address token, address aToken) external onlyOwner {
        require(token != address(0), "Invalid token address");
        require(aToken != address(0), "Invalid aToken address");
        
        aTokens[token] = aToken;
    }

    /**
     * @dev Deposit tokens into Aave
     * @param token Token address
     * @param amount Amount to deposit
     */
    function deposit(address token, uint256 amount) external {
        require(aTokens[token] != address(0), "Token not supported");
        require(amount > 0, "Amount must be greater than 0");
        
        // Transfer tokens from user to vault
        IERC20(token).safeTransferFrom(msg.sender, address(this), amount);
        
        // Approve Aave to use the tokens
        IERC20(token).approve(aavePool, amount);
        
        // Deposit to Aave based on version
        if (isV3) {
            IAaveV3Pool(aavePool).supply(token, amount, address(this), 0);
        } else {
            IAaveV2Pool(aavePool).deposit(token, amount, address(this), 0);
        }
        
        // Update user deposit
        userDeposits[msg.sender][token] += amount;
        
        // Update total principal
        totalPrincipal[token] += amount;
        
        emit Deposited(msg.sender, token, amount);
    }

    /**
     * @dev Withdraw tokens from Aave
     * @param token Token address
     * @param amount Amount to withdraw
     */
    function withdraw(address token, uint256 amount) external {
        require(aTokens[token] != address(0), "Token not supported");
        require(amount > 0, "Amount must be greater than 0");
        require(userDeposits[msg.sender][token] >= amount, "Insufficient balance");
        
        // Withdraw from Aave
        uint256 withdrawn = IAaveV3Pool(aavePool).withdraw(token, amount, address(this));
        
        // Update user deposit
        userDeposits[msg.sender][token] -= amount;
        
        // Update total principal
        totalPrincipal[token] -= amount;
        
        // Transfer tokens to user
        IERC20(token).safeTransfer(msg.sender, withdrawn);
        
        emit Withdrawn(msg.sender, token, withdrawn);
    }

    /**
     * @dev Withdraw all tokens plus yield
     * @param token Token address
     */
    function withdrawAll(address token) external {
        require(aTokens[token] != address(0), "Token not supported");
        require(userDeposits[msg.sender][token] > 0, "No deposits");
        
        // Calculate user's share of total deposits
        uint256 userPrincipal = userDeposits[msg.sender][token];
        uint256 userShare = totalPrincipal[token] > 0 
            ? (userPrincipal * 1e18) / totalPrincipal[token] 
            : 0;
        
        // Get total aToken balance
        address aToken = aTokens[token];
        uint256 totalBalance = IERC20(aToken).balanceOf(address(this));
        
        // Calculate user's share of total balance
        uint256 userAmount = (totalBalance * userShare) / 1e18;
        
        // Withdraw from Aave
        uint256 withdrawn = IAaveV3Pool(aavePool).withdraw(token, userAmount, address(this));
        
        // Update user deposit
        userDeposits[msg.sender][token] = 0;
        
        // Update total principal
        totalPrincipal[token] -= userPrincipal;
        
        // Transfer tokens to user
        IERC20(token).safeTransfer(msg.sender, withdrawn);
        
        emit Withdrawn(msg.sender, token, withdrawn);
    }

    /**
     * @dev Harvest yield from Aave
     * @param token Token address
     * @return Yield amount
     */
    function harvestYield(address token) external onlyOwner returns (uint256) {
        require(aTokens[token] != address(0), "Token not supported");
        
        // Get total aToken balance
        address aToken = aTokens[token];
        uint256 totalATokenBalance = IERC20(aToken).balanceOf(address(this));
        
        // Convert aToken balance to underlying token amount
        uint256 totalUnderlyingBalance = totalATokenBalance; // 1:1 ratio in Aave v2/v3
        
        // Calculate yield
        uint256 yieldAmount = 0;
        if (totalUnderlyingBalance > totalPrincipal[token]) {
            yieldAmount = totalUnderlyingBalance - totalPrincipal[token];
        }
        
        emit YieldHarvested(token, yieldAmount);
        return yieldAmount;
    }

    /**
     * @dev Get user balance including yield
     * @param user User address
     * @param token Token address
     * @return User balance with yield
     */
    function getUserBalance(address user, address token) external view returns (uint256) {
        require(aTokens[token] != address(0), "Token not supported");
        
        // Calculate user's share of total deposits
        uint256 userPrincipal = userDeposits[user][token];
        if (userPrincipal == 0 || totalPrincipal[token] == 0) {
            return 0;
        }
        
        uint256 userShare = (userPrincipal * 1e18) / totalPrincipal[token];
        
        // Get total aToken balance
        address aToken = aTokens[token];
        uint256 totalBalance = IERC20(aToken).balanceOf(address(this));
        
        // Calculate user's share of total balance
        return (totalBalance * userShare) / 1e18;
    }

    /**
     * @dev Get current APY for a token from Aave
     * @param token Token address
     * @return Current APY in ray units (27 decimals, divide by 1e25 for percentage)
     */
    function getCurrentAPY(address token) external view returns (uint256) {
        require(aTokens[token] != address(0), "Token not supported");
        
        if (isV3) {
            DataTypes.ReserveData memory data = IAaveV3Pool(aavePool).getReserveData(token);
            return data.currentLiquidityRate;
        } else {
            IAaveV2Pool.ReserveData memory data = IAaveV2Pool(aavePool).getReserveData(token);
            return data.currentLiquidityRate;
        }
    }
}