// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import {IProtocolAdapter} from "../interfaces/IProtocolAdapter.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";

// Interface for Aave V3 Pool
interface IPool {
    function supply(
        address asset, 
        uint256 amount, 
        address onBehalfOf, 
        uint16 referralCode
    ) external;
    
    function withdraw(
        address asset,
        uint256 amount,
        address to
    ) external returns (uint256);
    
    function getReserveData(address asset) external view returns (
        ReserveData memory
    );
    
    struct ReserveData {
        //stores the reserve configuration
        ReserveConfigurationMap configuration;
        //the liquidity index. Expressed in ray
        uint128 liquidityIndex;
        //the current supply rate. Expressed in ray
        uint128 currentLiquidityRate;
        //variable borrow index. Expressed in ray
        uint128 variableBorrowIndex;
        //the current variable borrow rate. Expressed in ray
        uint128 currentVariableBorrowRate;
        //the current stable borrow rate. Expressed in ray
        uint128 currentStableBorrowRate;
        //timestamp of last update
        uint40 lastUpdateTimestamp;
        //the id of the reserve. Represents the position in the list of the active reserves
        uint16 id;
        //aToken address
        address aTokenAddress;
        //stableDebtToken address
        address stableDebtTokenAddress;
        //variableDebtToken address
        address variableDebtTokenAddress;
        //address of the interest rate strategy
        address interestRateStrategyAddress;
        //the current treasury balance, scaled
        uint128 accruedToTreasury;
        //the outstanding unbacked aTokens minted through the bridge
        uint128 unbacked;
        //the outstanding debt borrowed against this asset in isolation mode
        uint128 isolationModeTotalDebt;
    }
    
    struct ReserveConfigurationMap {
        uint256 data;
    }
}

/**
 * @title AaveV3Adapter
 * @notice Adapter for Aave V3 protocol
 */
contract AaveV3Adapter is IProtocolAdapter, Ownable {
    using SafeERC20 for IERC20;
    
    // Aave V3 Pool address
    address public immutable pool;
    
    // Mapping of token to aToken
    mapping(address => address) public aTokens;
    
    // Mapping of supported tokens
    mapping(address => bool) public supportedTokens;
    
    // Events
    event TokenAdded(address indexed token, address indexed aToken);
    event TokenRemoved(address indexed token);
    event Deposited(address indexed token, uint256 amount);
    event Withdrawn(address indexed token, uint256 amount);
    
    /**
     * @dev Constructor
     * @param _pool Address of Aave V3 Pool
     */
    constructor(address _pool) Ownable(msg.sender) {
        require(_pool != address(0), "AaveV3Adapter: pool cannot be zero address");
        pool = _pool;
    }
    
    /**
     * @notice Add a supported token
     * @param token The token address
     * @param aToken The corresponding aToken address
     */
    function addSupportedToken(address token, address aToken) external onlyOwner {
        require(token != address(0), "AaveV3Adapter: token cannot be zero address");
        require(aToken != address(0), "AaveV3Adapter: aToken cannot be zero address");
        
        supportedTokens[token] = true;
        aTokens[token] = aToken;
        
        emit TokenAdded(token, aToken);
    }
    
    /**
     * @notice Remove a supported token
     * @param token The token address to remove
     */
    function removeSupportedToken(address token) external onlyOwner {
        require(supportedTokens[token], "AaveV3Adapter: token not supported");
        
        supportedTokens[token] = false;
        delete aTokens[token];
        
        emit TokenRemoved(token);
    }
    
    /**
     * @notice Deposit assets into Aave V3
     * @param underlyingToken The address of the underlying token to deposit
     * @param amount The amount to deposit
     * @return The amount actually deposited
     */
    function deposit(address underlyingToken, uint256 amount) external override returns (uint256) {
        require(supportedTokens[underlyingToken], "AaveV3Adapter: token not supported");
        require(amount > 0, "AaveV3Adapter: amount must be greater than 0");
        
        // Transfer tokens from sender to this contract
        IERC20(underlyingToken).safeTransferFrom(msg.sender, address(this), amount);
        
        // Approve pool to spend tokens
        IERC20(underlyingToken).approve(pool, 0);
        IERC20(underlyingToken).approve(pool, amount);
        
        // Supply tokens to Aave V3
        IPool(pool).supply(
            underlyingToken,
            amount,
            address(this),
            0 // referral code (0 for none)
        );
        
        emit Deposited(underlyingToken, amount);
        
        return amount;
    }
    
    /**
     * @notice Withdraw all assets from Aave V3
     * @param underlyingToken The address of the underlying token to withdraw
     * @return The amount withdrawn
     */
    function withdraw(address underlyingToken) external override returns (uint256) {
        require(supportedTokens[underlyingToken], "AaveV3Adapter: token not supported");
        
        // Get aToken address and balance
        address aToken = aTokens[underlyingToken];
        uint256 aTokenBalance = IERC20(aToken).balanceOf(address(this));
        
        if (aTokenBalance == 0) {
            return 0;
        }
        
        // Withdraw all tokens from Aave
        uint256 withdrawnAmount = IPool(pool).withdraw(
            underlyingToken,
            type(uint256).max, // withdraw all
            address(this)
        );
        
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
        require(supportedTokens[underlyingToken], "AaveV3Adapter: token not supported");
        
        // Get reserve data from Aave
        IPool.ReserveData memory reserveData = IPool(pool).getReserveData(underlyingToken);
        
        // Convert the liquidity rate from ray (1e27) to basis points (1% = 100)
        // Formula: APY = ((1 + liquidityRate/secPerYear) ^ secPerYear) - 1
        // For simplicity, we approximate this with liquidityRate / 1e25
        uint256 liquidityRate = reserveData.currentLiquidityRate;
        return liquidityRate / 1e25;
    }
    
    /**
     * @notice Get the current balance in the protocol
     * @param underlyingToken The address of the underlying token
     * @return The current balance in underlying token units
     */
    function getBalance(address underlyingToken) external view override returns (uint256) {
        require(supportedTokens[underlyingToken], "AaveV3Adapter: token not supported");
        
        // Get aToken balance
        address aToken = aTokens[underlyingToken];
        return IERC20(aToken).balanceOf(address(this));
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