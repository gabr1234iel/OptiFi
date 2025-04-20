// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "forge-std/Test.sol";
import "../src/adapters/AaveV3Adapter.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

contract AaveV3AdapterTest is Test {
    // Ethereum mainnet addresses
    address constant AAVE_POOL = 0x87870Bca3F3fD6335C3F4ce8392D69350B4fA4E2;
    address constant USDC = 0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48;
    address constant WETH = 0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2;
    address constant AUSDC_V3 = 0x98C23E9d8f34FEFb1B7BD6a91B7FF122F4e16F5c;
    address constant AWETH_V3 = 0x4d5F47FA6A74757f35C14fD3a6Ef8E3C9BC514E8;
    
    // Whale addresses for testing
    address constant USDC_WHALE = 0x47ac0Fb4F2D84898e4D9E7b4DaB3C24507a6D503;
    address constant WETH_WHALE = 0x2F0b23f53734252Bda2277357e97e1517d6B042A;
    
    // Test contracts
    AaveV3Adapter public adapter;
    
    // Test accounts
    address public user = address(0x1);
    
    function setUp() public {
        // Fork Ethereum mainnet
        vm.createSelectFork("http://localhost:8545");
        
        // Deploy adapter
        adapter = new AaveV3Adapter(AAVE_POOL);
        
        // Add supported tokens
        vm.startPrank(adapter.owner());
        adapter.addSupportedToken(USDC, AUSDC_V3);
        adapter.addSupportedToken(WETH, AWETH_V3);
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
        
        // Test removing a token
        adapter.removeSupportedToken(USDC);
        assertFalse(adapter.supportedTokens(USDC));
        
        // Test adding it back
        adapter.addSupportedToken(USDC, AUSDC_V3);
        assertTrue(adapter.supportedTokens(USDC));
        assertEq(adapter.aTokens(USDC), AUSDC_V3);
        
        vm.stopPrank();
    }
    
    function testDeposit() public {
        uint256 depositAmount = 1000 * 10**6; // 1,000 USDC
        
        vm.startPrank(user);
        
        // Approve tokens
        IERC20(USDC).approve(address(adapter), depositAmount);
        
        // Initial balances
        uint256 initialUSDCBalance = IERC20(USDC).balanceOf(user);
        uint256 initialAdapterBalance = adapter.getBalance(USDC);
        
        // Deposit to Aave
        uint256 depositedAmount = adapter.deposit(USDC, depositAmount);
        
        // Check balances after deposit
        uint256 finalUSDCBalance = IERC20(USDC).balanceOf(user);
        uint256 finalAdapterBalance = adapter.getBalance(USDC);
        
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
        
        // Withdraw from Aave
        uint256 withdrawnAmount = adapter.withdraw(USDC);
        
        // Check balances after withdrawal
        uint256 finalUSDCBalance = IERC20(USDC).balanceOf(user);
        uint256 finalAdapterBalance = adapter.getBalance(USDC);
        
        // Verify that tokens were withdrawn correctly
        assertGt(withdrawnAmount, 0);
        assertEq(finalUSDCBalance - initialUSDCBalance, withdrawnAmount);
        assertLt(finalAdapterBalance, initialAdapterBalance);
        
        vm.stopPrank();
    }
    
    function testGetAPY() public view{
        // Get APY for USDC
        uint256 usdcAPY = adapter.getAPY(USDC);
        
        // APY should be positive (in basis points)
        assertGt(usdcAPY, 0);
        
        // Get APY for WETH
        uint256 wethAPY = adapter.getAPY(WETH);
        
        // APY should be positive (in basis points)
        assertGt(wethAPY, 0);
        
        // Log the APYs
        console.log("USDC APY (basis points):", usdcAPY);
        console.log("WETH APY (basis points):", wethAPY);
    }
    
    function testGetBalance() public {
        // Deposit some tokens first
        testDeposit();
        
        // Get balance
        uint256 balance = adapter.getBalance(USDC);
        
        // Balance should be positive
        assertGt(balance, 0);
    }
    
    function testRescue() public {
        // Send some extra tokens to the adapter (not through deposit)
        vm.startPrank(USDC_WHALE);
        uint256 amount = 100 * 10**6; // 100 USDC
        IERC20(USDC).transfer(address(adapter), amount);
        vm.stopPrank();
        
        // Initial balance of recipient
        address recipient = address(0x123);
        uint256 initialBalance = IERC20(USDC).balanceOf(recipient);
        
        // Rescue tokens
        vm.startPrank(adapter.owner());
        adapter.rescue(USDC, recipient, amount);
        vm.stopPrank();
        
        // Final balance of recipient
        uint256 finalBalance = IERC20(USDC).balanceOf(recipient);
        
        // Verify tokens were transferred
        assertEq(finalBalance - initialBalance, amount);
    }
    
    function testFailDepositNotSupportedToken() public {
        // Try to deposit a token that's not supported
        vm.startPrank(user);
        adapter.deposit(address(0x999), 1000);
        vm.stopPrank();
    }
    
    function testFailDepositZeroAmount() public {
        // Try to deposit zero amount
        vm.startPrank(user);
        adapter.deposit(USDC, 0);
        vm.stopPrank();
    }
    
    function testFailWithdrawNotSupportedToken() public {
        // Try to withdraw a token that's not supported
        vm.startPrank(user);
        adapter.withdraw(address(0x999));
        vm.stopPrank();
    }
    
    function testFailNonOwnerAddToken() public {
        // Try to add a token as non-owner
        vm.startPrank(user);
        adapter.addSupportedToken(address(0x999), address(0x888));
        vm.stopPrank();
    }
}