// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import {IProtocolAdapter} from "../interfaces/IProtocolAdapter.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";

// Interface for Compound V2 cToken
interface ICToken {
    function mint(uint256 mintAmount) external returns (uint256);
    function redeem(uint256 redeemTokens) external returns (uint256);
    function redeemUnderlying(uint256 redeemAmount) external returns (uint256);
    function balanceOf(address owner) external view returns (uint256);
    function balanceOfUnderlying(address owner) external returns (uint256);
    function exchangeRateCurrent() external returns (uint256);
    function exchangeRateStored() external view returns (uint256);
    function supplyRatePerBlock() external view returns (uint256);
    function underlying() external view returns (address);
}

/**
 * @title CompoundV2Adapter
 * @notice Adapter for Compound V2 protocol
 */
contract CompoundV2Adapter is IProtocolAdapter, Ownable {
    using SafeERC20 for IERC20;
    
    // Mapping of token to cToken
    mapping(address => address) public cTokens;
    
    // Events
    event Deposited(address indexed token, uint256 amount);
    event Withdrawn(address indexed token, uint256 amount);
    
    /**
     * @dev Constructor
     */
    constructor() Ownable(msg.sender) {
        // Initialize with known Compound V2 markets from mainnet
        cTokens[0x6B175474E89094C44Da98b954EedeAC495271d0F] = 0x5d3a536E4D6DbD6114cc1Ead35777bAB948E3643; // DAI -> cDAI
        cTokens[0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48] = 0x39AA39c021dfbaE8faC545936693aC917d5E7563; // USDC -> cUSDC
        cTokens[0xdAC17F958D2ee523a2206206994597C13D831ec7] = 0xf650C3d88D12dB855b8bf7D11Be6C55A4e07dCC9; // USDT -> cUSDT
        cTokens[0x2260FAC5E5542a773Aa44fBCfeDf7C193bc2C599] = 0xccF4429DB6322D5C611ee964527D42E5d685DD6a; // WBTC -> cWBTC
        cTokens[0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2] = 0x4Ddc2D193948926D02f9B1fE9e1daa0718270ED5; // WETH -> cETH
    }
    
    /**
     * @notice Add a supported token
     * @param token The token address
     * @param cToken The corresponding cToken address
     */
    function addSupportedToken(address token, address cToken) external onlyOwner {
        require(token != address(0), "CompoundV2Adapter: token cannot be zero address");
        require(cToken != address(0), "CompoundV2Adapter: cToken cannot be zero address");
        
        cTokens[token] = cToken;
    }
    
    /**
     * @notice Deposit assets into Compound V2
     * @param underlyingToken The address of the underlying token to deposit
     * @param amount The amount to deposit
     * @return The amount actually deposited
     */
    function deposit(address underlyingToken, uint256 amount) external override returns (uint256) {
        require(amount > 0, "CompoundV2Adapter: amount must be greater than 0");
        address cToken = cTokens[underlyingToken];
        require(cToken != address(0), "CompoundV2Adapter: token not supported");
        
        // Transfer tokens from sender to this contract
        IERC20(underlyingToken).safeTransferFrom(msg.sender, address(this), amount);
        
        // Approve cToken to spend tokens
        IERC20(underlyingToken).approve(cToken, 0);
        IERC20(underlyingToken).approve(cToken, amount);
        
        // Mint cTokens (deposit into Compound)
        uint256 mintResult = ICToken(cToken).mint(amount);
        require(mintResult == 0, "CompoundV2Adapter: mint failed");
        
        emit Deposited(underlyingToken, amount);
        
        return amount;
    }
    
    /**
     * @notice Withdraw all assets from Compound V2
     * @param underlyingToken The address of the underlying token to withdraw
     * @return The amount withdrawn
     */
    function withdraw(address underlyingToken) external override returns (uint256) {
        address cToken = cTokens[underlyingToken];
        require(cToken != address(0), "CompoundV2Adapter: token not supported");
        
        // Get cToken balance
        uint256 cTokenBalance = ICToken(cToken).balanceOf(address(this));
        
        if (cTokenBalance == 0) {
            return 0;
        }
        
        // Withdraw by redeeming all cTokens
        uint256 redeemResult = ICToken(cToken).redeem(cTokenBalance);
        require(redeemResult == 0, "CompoundV2Adapter: redeem failed");
        
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
        address cToken = cTokens[underlyingToken];
        if (cToken == address(0)) {
            return 0;
        }
        
        // Get the supply rate per block
        uint256 supplyRatePerBlock;
        try ICToken(cToken).supplyRatePerBlock() returns (uint256 rate) {
            supplyRatePerBlock = rate;
        } catch {
            return 0;
        }
        
        // Convert to APY: (1 + supplyRatePerBlock / 1e18) ^ (blocksPerYear) - 1
        // Approximation: supplyRatePerBlock * blocksPerYear / 1e18
        uint256 blocksPerYear = 2102400; // ~15 sec blocks, 365 days
        uint256 apy = (supplyRatePerBlock * blocksPerYear * 10000) / 1e18;
        
        return apy;
    }
    
    /**
     * @notice Get the current balance in the protocol
     * @param underlyingToken The address of the underlying token
     * @return The current balance in underlying token units
     */
    function getBalance(address underlyingToken) external view override returns (uint256) {
        address cToken = cTokens[underlyingToken];
        if (cToken == address(0)) {
            return 0;
        }
        
        // Get cToken balance
        uint256 cTokenBalance;
        try ICToken(cToken).balanceOf(address(this)) returns (uint256 balance) {
            cTokenBalance = balance;
        } catch {
            return 0;
        }
        
        if (cTokenBalance == 0) {
            return 0;
        }
        
        // Get exchange rate
        uint256 exchangeRate;
        try ICToken(cToken).exchangeRateStored() returns (uint256 rate) {
            exchangeRate = rate;
        } catch {
            return 0;
        }
        
        // Calculate underlying amount: cTokenBalance * exchangeRate / 1e18
        uint256 underlyingBalance = (cTokenBalance * exchangeRate) / 1e18;
        
        return underlyingBalance;
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