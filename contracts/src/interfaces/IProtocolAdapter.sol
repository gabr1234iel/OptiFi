// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

/**
 * @title IProtocolAdapter
 * @notice Interface for DeFi protocol adapters
 */
interface IProtocolAdapter {
    /**
     * @notice Deposit assets into the protocol
     * @param underlyingToken The address of the underlying token to deposit
     * @param amount The amount to deposit
     * @return The amount actually deposited
     */
    function deposit(address underlyingToken, uint256 amount) external returns (uint256);
    
    /**
     * @notice Withdraw all assets from the protocol
     * @param underlyingToken The address of the underlying token to withdraw
     * @return The amount withdrawn
     */
    function withdraw(address underlyingToken) external returns (uint256);
    
    /**
     * @notice Get the current APY for a specific asset
     * @param underlyingToken The address of the underlying token
     * @return The current APY in basis points (1% = 100)
     */
    function getAPY(address underlyingToken) external view returns (uint256);
    
    /**
     * @notice Get the current balance in the protocol
     * @param underlyingToken The address of the underlying token
     * @return The current balance in underlying token units
     */
    function getBalance(address underlyingToken) external view returns (uint256);
}