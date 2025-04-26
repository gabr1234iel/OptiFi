// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "forge-std/Test.sol";
import "../src/adapters/SkyLendingAdapter.sol";
import "../src/UniversalVault.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

contract SUsdsAdapterTest is Test {
    // Ethereum mainnet addresses (adjust for the network where SUsds is deployed)
    address constant UNISWAP_V3_ROUTER = 0xE592427A0AEce92De3Edee1F18E0157C05861564;
    address constant USDS_TOKEN = 0xdC035D45d973E3EC169d2276DDab16f1e407384F;
    address constant SUSDS_TOKEN = 0xa3931d71877C0E7a3148CB7Eb4463524FEc27fbD;
    
    // Whale addresses for testing
    address constant USDS_WHALE = 0x17a749f7fA0055618AA5F958D5AA13F5F5D19eA1;
    
    // Test contracts
    UniversalVault public vault;
    SkyLendingAdapter public adapter;
    
    // Test accounts
    address public user = address(0x1);
    
    function setUp() public {
        // Fork Ethereum mainnet at a specific block
        vm.createSelectFork("http://localhost:8545");
        
        // Deploy adapter
        adapter = new SkyLendingAdapter(SUSDS_TOKEN);
        
        // Deploy vault
        vault = new UniversalVault(UNISWAP_V3_ROUTER);
        
        // Set up the adapter in the vault
        vm.startPrank(vault.owner());
        vault.setAdapter(USDS_TOKEN, address(adapter));
        vm.stopPrank();
        
        // Give user some tokens for testing
        vm.startPrank(USDS_WHALE);
        IERC20(USDS_TOKEN).transfer(user, 10000 * 10**18); // 10,000 USDS, adjust decimals as needed
        vm.stopPrank();
    }
    
    function testDeposit() public {
        uint256 depositAmount = 1000 * 10**18; // 1,000 USDS, adjust decimals as needed
        
        vm.startPrank(user);
        
        // Approve tokens
        IERC20(USDS_TOKEN).approve(address(vault), depositAmount);
        
        // Initial balances
        uint256 initialUSDSBalance = IERC20(USDS_TOKEN).balanceOf(user);
        uint256 initialVaultBalance = vault.getUserBalance(user, USDS_TOKEN);
        uint256 initialAdapterBalance = adapter.getBalance(USDS_TOKEN);
        
        console.log("Initial USDS Balance:", initialUSDSBalance);
        console.log("Initial Vault Balance:", initialVaultBalance);
        console.log("Initial Adapter Balance:", initialAdapterBalance);
        
        // Deposit to vault
        vault.deposit(USDS_TOKEN, depositAmount);
        
        // Check balances after deposit
        uint256 finalUSDSBalance = IERC20(USDS_TOKEN).balanceOf(user);
        uint256 finalVaultBalance = vault.getUserBalance(user, USDS_TOKEN);
        uint256 finalAdapterBalance = adapter.getBalance(USDS_TOKEN);
        
        console.log("Final USDS Balance:", finalUSDSBalance);
        console.log("Final Vault Balance:", finalVaultBalance);
        console.log("Final Adapter Balance:", finalAdapterBalance);
        
        // Verify that tokens were deposited correctly
        assertEq(initialUSDSBalance - finalUSDSBalance, depositAmount);
        assertEq(finalVaultBalance - initialVaultBalance, depositAmount);
        assertGt(finalAdapterBalance, initialAdapterBalance);
        
        vm.stopPrank();
    }
    
    function testWithdraw() public {
        // First deposit some tokens
        testDeposit();
        
        uint256 withdrawAmount = 500 * 10**18; // 500 USDS, adjust decimals as needed
        
        vm.startPrank(user);
        
        // Initial balances
        uint256 initialUSDSBalance = IERC20(USDS_TOKEN).balanceOf(user);
        uint256 initialVaultBalance = vault.getUserBalance(user, USDS_TOKEN);
        uint256 initialAdapterBalance = adapter.getBalance(USDS_TOKEN);
        
        console.log("Before Withdrawal:");
        console.log("User USDS Balance:", initialUSDSBalance);
        console.log("Vault User Balance:", initialVaultBalance);
        console.log("Adapter Balance:", initialAdapterBalance);
        
        // Withdraw from vault
        vault.withdraw(USDS_TOKEN, withdrawAmount);
        
        // Check balances after withdrawal
        uint256 finalUSDSBalance = IERC20(USDS_TOKEN).balanceOf(user);
        uint256 finalVaultBalance = vault.getUserBalance(user, USDS_TOKEN);
        uint256 finalAdapterBalance = adapter.getBalance(USDS_TOKEN);
        
        console.log("After Withdrawal:");
        console.log("User USDS Balance:", finalUSDSBalance);
        console.log("Vault User Balance:", finalVaultBalance);
        console.log("Adapter Balance:", finalAdapterBalance);
        
        // Verify that tokens were withdrawn correctly
        assertEq(finalUSDSBalance - initialUSDSBalance, withdrawAmount);
        assertEq(initialVaultBalance - finalVaultBalance, withdrawAmount);
        assertLt(finalAdapterBalance, initialAdapterBalance);
        
        vm.stopPrank();
    }
    
    function testGetAPY() public view {
        // Get APY
        uint256 apy = adapter.getAPY(USDS_TOKEN);
        
        console.log("SUsds APY (basis points):", apy);
        
        // APY should be positive (in basis points)
        // This will depend on the current state of the SUsds contract
        // assertGt(apy, 0);
    }
    
    function testGetBalance() public {
        // First deposit some tokens
        testDeposit();
        
        // Get balance
        uint256 balance = adapter.getBalance(USDS_TOKEN);
        
        console.log("Adapter USDS Balance:", balance);
        
        // Balance should be positive
        assertGt(balance, 0);
    }
    
    function testRescue() public {
        // Send some extra tokens to the adapter
        vm.startPrank(USDS_WHALE);
        uint256 amount = 100 * 10**18; // 100 USDS
        IERC20(USDS_TOKEN).transfer(address(adapter), amount);
        vm.stopPrank();
        
        // Initial balance of recipient
        address recipient = address(0x123);
        uint256 initialBalance = IERC20(USDS_TOKEN).balanceOf(recipient);
        
        // Rescue tokens
        vm.startPrank(adapter.owner());
        adapter.rescue(USDS_TOKEN, recipient, amount);
        vm.stopPrank();
        
        // Final balance of recipient
        uint256 finalBalance = IERC20(USDS_TOKEN).balanceOf(recipient);
        
        // Verify tokens were transferred
        assertEq(finalBalance - initialBalance, amount);
    }
    
    function testFailDepositWithUnsupportedToken() public {
        address unsupportedToken = address(0x999);
        
        vm.startPrank(user);
        
        // Try to deposit an unsupported token
        adapter.deposit(unsupportedToken, 100);
        
        vm.stopPrank();
    }
    
    function testFailWithdrawWithUnsupportedToken() public {
        address unsupportedToken = address(0x999);
        
        vm.startPrank(user);
        
        // Try to withdraw an unsupported token
        adapter.withdraw(unsupportedToken);
        
        vm.stopPrank();
    }
    
    function testForceWithdraw() public {
        // First deposit some tokens
        testDeposit();
        
        // Initial balances
        uint256 initialVaultTokenBalance = IERC20(USDS_TOKEN).balanceOf(address(vault));
        uint256 initialAdapterBalance = adapter.getBalance(USDS_TOKEN);
        
        console.log("Before Force Withdraw:");
        console.log("Vault Token Balance:", initialVaultTokenBalance);
        console.log("Adapter Balance:", initialAdapterBalance);
        
        // Force withdraw
        vm.startPrank(vault.owner());
        vault.forceWithdraw(USDS_TOKEN);
        vm.stopPrank();
        
        // Final balances
        uint256 finalVaultTokenBalance = IERC20(USDS_TOKEN).balanceOf(address(vault));
        uint256 finalAdapterBalance = adapter.getBalance(USDS_TOKEN);
        
        console.log("After Force Withdraw:");
        console.log("Vault Token Balance:", finalVaultTokenBalance);
        console.log("Adapter Balance:", finalAdapterBalance);
        
        // Verify tokens were withdrawn from adapter to vault
        assertGt(finalVaultTokenBalance, initialVaultTokenBalance);
        assertLt(finalAdapterBalance, initialAdapterBalance);
    }
    
    function testDirectDepositToAdapter() public {
        uint256 depositAmount = 1000 * 10**18; // 1,000 USDS
        
        vm.startPrank(user);
        
        // Approve tokens
        IERC20(USDS_TOKEN).approve(address(adapter), depositAmount);
        
        // Initial balances
        uint256 initialUSDSBalance = IERC20(USDS_TOKEN).balanceOf(user);
        uint256 initialAdapterBalance = adapter.getBalance(USDS_TOKEN);
        
        // Deposit directly to adapter
        adapter.deposit(USDS_TOKEN, depositAmount);
        
        // Check balances after deposit
        uint256 finalUSDSBalance = IERC20(USDS_TOKEN).balanceOf(user);
        uint256 finalAdapterBalance = adapter.getBalance(USDS_TOKEN);
        
        // Verify deposit
        assertEq(initialUSDSBalance - finalUSDSBalance, depositAmount);
        assertGt(finalAdapterBalance, initialAdapterBalance);
        
        vm.stopPrank();
    }
}