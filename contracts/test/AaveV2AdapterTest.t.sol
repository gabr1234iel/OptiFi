// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "forge-std/Test.sol";
import "../src/adapters/AaveV2Adapter.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

contract AaveV2AdapterTest is Test {
    // Ethereum mainnet addresses
    address constant AAVE_LENDING_POOL = 0x7d2768dE32b0b80b7a3454c06BdAc94A69DDc7A9;
    address constant USDC = 0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48;
    address constant WETH = 0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2;
    address constant AUSDC_V2 = 0xBcca60bB61934080951369a648Fb03DF4F96263C;
    address constant AWETH_V2 = 0x030bA81f1c18d280636F32af80b9AAd02Cf0854e;
    
    // Whale addresses for testing
    address constant USDC_WHALE = 0x47ac0Fb4F2D84898e4D9E7b4DaB3C24507a6D503;
    address constant WETH_WHALE = 0x2F0b23f53734252Bda2277357e97e1517d6B042A;
    
    // Test contracts
    AaveV2Adapter public adapter;
    
    // Test accounts
    address public user = address(0x1);
    
    function setUp() public {
        // Fork Ethereum mainnet
        vm.createSelectFork("http://localhost:8545");
        
        // Deploy adapter
        adapter = new AaveV2Adapter(AAVE_LENDING_POOL);
        
        // Add supported tokens
        vm.startPrank(adapter.owner());
        adapter.addSupportedToken(USDC, AUSDC_V2);
        adapter.addSupportedToken(WETH, AWETH_V2);
        vm.stopPrank();
        
        // Give user some tokens for testing
        vm.startPrank(USDC_WHALE);
        IERC20(USDC).transfer(user, 10000 * 10**6); // 10,000 USDC
        vm.stopPrank();
        
        vm.startPrank(WETH_WHALE);
        IERC20(WETH).transfer(user, 10 * 10**18); // 10 WETH
        vm.stopPrank();
    }
    
    function testAddRemoveSupportedToken() public {
        vm.startPrank(adapter.owner());
        
        console.log("Testing removeSupportedToken...");
        adapter.removeSupportedToken(USDC);
        assertFalse(adapter.supportedTokens(USDC));
        
        console.log("Testing addSupportedToken...");
        adapter.addSupportedToken(USDC, AUSDC_V2);
        assertTrue(adapter.supportedTokens(USDC));
        assertEq(adapter.aTokens(USDC), AUSDC_V2);
        
        vm.stopPrank();
    }
    
    function testDeposit() public {
        uint256 depositAmount = 1000 * 10**6; // 1,000 USDC
        
        vm.startPrank(user);
        
        console.log("Approving tokens...");
        IERC20(USDC).approve(address(adapter), depositAmount);
        
        // Initial balances
        uint256 initialUSDCBalance = IERC20(USDC).balanceOf(user);
        uint256 initialAdapterBalance = adapter.getBalance(USDC);
        console.log("Initial USDC Balance:", initialUSDCBalance);
        console.log("Initial Adapter Balance:", initialAdapterBalance);
        
        // Deposit to Aave
        console.log("Depositing tokens...");
        uint256 depositedAmount = adapter.deposit(USDC, depositAmount);
        
        // Check balances after deposit
        uint256 finalUSDCBalance = IERC20(USDC).balanceOf(user);
        uint256 finalAdapterBalance = adapter.getBalance(USDC);
        console.log("Final USDC Balance:", finalUSDCBalance);
        console.log("Final Adapter Balance:", finalAdapterBalance);
        
        // Verify that tokens were deposited correctly
        assertEq(depositedAmount, depositAmount);
        assertEq(initialUSDCBalance - finalUSDCBalance, depositAmount);
        assertGt(finalAdapterBalance, initialAdapterBalance);
        
        vm.stopPrank();
    }
    
    function testWithdraw() public {
        // First deposit some tokens
        testDeposit();
        
        vm.startPrank(user);
        
        // Initial balances
        uint256 initialUSDCBalance = IERC20(USDC).balanceOf(user);
        uint256 initialAdapterBalance = adapter.getBalance(USDC);
        console.log("Initial USDC Balance:", initialUSDCBalance);
        console.log("Initial Adapter Balance:", initialAdapterBalance);
        
        // Withdraw from Aave
        console.log("Withdrawing tokens...");
        uint256 withdrawnAmount = adapter.withdraw(USDC);
        
        // Check balances after withdrawal
        uint256 finalUSDCBalance = IERC20(USDC).balanceOf(user);
        uint256 finalAdapterBalance = adapter.getBalance(USDC);
        console.log("Final USDC Balance:", finalUSDCBalance);
        console.log("Final Adapter Balance:", finalAdapterBalance);
        
        // Verify that tokens were withdrawn correctly
        assertGt(withdrawnAmount, 0);
        assertEq(finalUSDCBalance - initialUSDCBalance, withdrawnAmount);
        assertLt(finalAdapterBalance, initialAdapterBalance);
        
        vm.stopPrank();
    }
    
    function testGetAPY() public view{
        // Get APY for USDC
        uint256 usdcAPY = adapter.getAPY(USDC);
        console.log("USDC APY (basis points):", usdcAPY);
        
        // APY should be positive (in basis points)
        assertGt(usdcAPY, 0);
        
    }
    
    function testGetBalance() public {
        // Deposit some tokens first
        testDeposit();
        
        // Get balance
        uint256 balance = adapter.getBalance(USDC);
        console.log("Adapter USDC Balance:", balance);
        
        // Balance should be positive
        assertGt(balance, 0);
    }
    
    function testRescue() public {
        // Send some extra tokens to the adapter (not through deposit)
        vm.startPrank(USDC_WHALE);
        uint256 amount = 100 * 10**6; // 100 USDC
        IERC20(USDC).transfer(address(adapter), amount);
        vm.stopPrank();
        
        console.log("Rescuing tokens...");
        // Initial balance of recipient
        address recipient = address(0x123);
        uint256 initialBalance = IERC20(USDC).balanceOf(recipient);
        console.log("Initial Recipient Balance:", initialBalance);
        
        // Rescue tokens
        vm.startPrank(adapter.owner());
        adapter.rescue(USDC, recipient, amount);
        vm.stopPrank();
        
        // Final balance of recipient
        uint256 finalBalance = IERC20(USDC).balanceOf(recipient);
        console.log("Final Recipient Balance:", finalBalance);
        
        // Verify tokens were transferred
        assertEq(finalBalance - initialBalance, amount);
    }
}
