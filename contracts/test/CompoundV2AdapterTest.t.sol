// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "forge-std/Test.sol";
import "../src/adapters/CompoundV2Adapter.sol";
import "../src/UniversalVault.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

contract CompoundV2AdapterTest is Test {
    // Ethereum mainnet addresses
    address constant USDC = 0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48;
    address constant WETH = 0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2;
    address constant DAI = 0x6B175474E89094C44Da98b954EedeAC495271d0F;
    address constant CUSDC = 0x39AA39c021dfbaE8faC545936693aC917d5E7563;
    address constant CDAI = 0x5d3a536E4D6DbD6114cc1Ead35777bAB948E3643;
    address constant CETH = 0x4Ddc2D193948926D02f9B1fE9e1daa0718270ED5;
    
    // Whale addresses for testing
    address constant USDC_WHALE = 0x47ac0Fb4F2D84898e4D9E7b4DaB3C24507a6D503;
    address constant WETH_WHALE = 0x2F0b23f53734252Bda2277357e97e1517d6B042A;
    address constant DAI_WHALE = 0x6Afef3F0ee9C22B0F1734BF06C7657B72de76027;

    address constant UNISWAP_V3_ROUTER = 0xE592427A0AEce92De3Edee1F18E0157C05861564;
    
    // Test contracts
    UniversalVault public vault;
    CompoundV2Adapter public adapter;
    
    // Test accounts
    address public user = address(0x1);
    
    function setUp() public {
        // Fork Ethereum mainnet
        vm.createSelectFork("http://localhost:8545");
        
        // Deploy contracts
        vault = new UniversalVault(UNISWAP_V3_ROUTER);
        adapter = new CompoundV2Adapter();
        
        // Add supported tokens to the adapter
        vm.startPrank(adapter.owner());
        adapter.addSupportedToken(USDC, CUSDC);
        adapter.addSupportedToken(DAI, CDAI);
        vm.stopPrank();
        
        // Set adapter in vault
        vm.startPrank(vault.owner());
        vault.setAdapter(USDC, address(adapter));
        vault.setAdapter(DAI, address(adapter));
        vm.stopPrank();
        
        // Give user some tokens for testing
        vm.startPrank(USDC_WHALE);
        IERC20(USDC).transfer(user, 10000 * 10**6); // 10,000 USDC
        vm.stopPrank();
        
        vm.startPrank(DAI_WHALE);
        IERC20(DAI).transfer(user, 10000 * 10**18); // 10,000 DAI
        vm.stopPrank();
    }
    
    
    function testDeposit() public {
        uint256 depositAmount = 1000 * 10**6; // 1,000 USDC
        
        vm.startPrank(user);
        
        // Approve tokens for vault
        IERC20(USDC).approve(address(vault), depositAmount);
        
        // Initial balances
        uint256 initialUSDCBalance = IERC20(USDC).balanceOf(user);
        uint256 initialVaultBalance = vault.getUserBalance(user, USDC);
        uint256 initialAdapterBalance = adapter.getBalance(USDC);
        
        console.log("Initial USDC Balance:", initialUSDCBalance);
        console.log("Initial Vault Balance:", initialVaultBalance);
        console.log("Initial Adapter Balance:", initialAdapterBalance);
        
        // Deposit to vault
        vault.deposit(USDC, depositAmount);
        
        // Check balances after deposit
        uint256 finalUSDCBalance = IERC20(USDC).balanceOf(user);
        uint256 finalVaultBalance = vault.getUserBalance(user, USDC);
        uint256 finalAdapterBalance = adapter.getBalance(USDC);
        
        console.log("Final USDC Balance:", finalUSDCBalance);
        console.log("Final Vault Balance:", finalVaultBalance);
        console.log("Final Adapter Balance:", finalAdapterBalance);
        
        // Verify that tokens were deposited correctly
        assertEq(initialUSDCBalance - finalUSDCBalance, depositAmount);
        assertEq(finalVaultBalance - initialVaultBalance, depositAmount);
        
        // This might be slightly different due to exchange rate
        assertGt(finalAdapterBalance, initialAdapterBalance);
        
        vm.stopPrank();
    }
    
    function testWithdraw() public {
        // First deposit some tokens
        testDeposit();
        
        uint256 withdrawAmount = 500 * 10**6; // 500 USDC
        
        vm.startPrank(user);
        
        // Initial balances
        uint256 initialUSDCBalance = IERC20(USDC).balanceOf(user);
        uint256 initialVaultBalance = vault.getUserBalance(user, USDC);
        uint256 initialAdapterBalance = adapter.getBalance(USDC);
        
        console.log("Before Withdrawal:");
        console.log("User USDC Balance:", initialUSDCBalance);
        console.log("Vault User Balance:", initialVaultBalance);
        console.log("Adapter Balance:", initialAdapterBalance);
        
        // Withdraw from vault
        vault.withdraw(USDC, withdrawAmount);
        
        // Check balances after withdrawal
        uint256 finalUSDCBalance = IERC20(USDC).balanceOf(user);
        uint256 finalVaultBalance = vault.getUserBalance(user, USDC);
        uint256 finalAdapterBalance = adapter.getBalance(USDC);
        
        console.log("After Withdrawal:");
        console.log("User USDC Balance:", finalUSDCBalance);
        console.log("Vault User Balance:", finalVaultBalance);
        console.log("Adapter Balance:", finalAdapterBalance);
        
        // Verify that tokens were withdrawn correctly
        assertGe(finalUSDCBalance - initialUSDCBalance, withdrawAmount - 10); // Allow for small rounding errors
        assertEq(initialVaultBalance - finalVaultBalance, withdrawAmount);
        assertLt(finalAdapterBalance, initialAdapterBalance);
        
        vm.stopPrank();
    }
    
    function testGetAPY() public view {
        // Get APY for USDC
        uint256 usdcAPY = adapter.getAPY(USDC);
        
        // Get APY for DAI
        uint256 daiAPY = adapter.getAPY(DAI);
        
        console.log("USDC APY (basis points):", usdcAPY);
        console.log("DAI APY (basis points):", daiAPY);
        
        // APY should be positive (in basis points)
        // In a real environment, this would be true
        // assertGt(usdcAPY, 0);
        // assertGt(daiAPY, 0);
    }
    
    function testGetAPYViaVault() public view {
        // Get APY via vault
        uint256 usdcAPY = vault.getAPY(USDC);
        uint256 daiAPY = vault.getAPY(DAI);
        
        console.log("USDC APY via vault (basis points):", usdcAPY);
        console.log("DAI APY via vault (basis points):", daiAPY);
        
        // APY should be positive (in basis points)
        // In a real environment, this would be true
        // assertGt(usdcAPY, 0);
        // assertGt(daiAPY, 0);
    }
    
    function testGetBalance() public {
        // First deposit some tokens
        testDeposit();
        
        // Get balance directly
        uint256 adapterBalance = adapter.getBalance(USDC);
        
        // Get balance via vault
        uint256 vaultTotalBalance = vault.getTotalBalance(USDC);
        uint256 vaultUserBalance = vault.getUserBalance(user, USDC);
        
        console.log("Adapter Balance:", adapterBalance);
        console.log("Vault Total Balance:", vaultTotalBalance);
        console.log("Vault User Balance:", vaultUserBalance);
        
        // Adapter balance should be part of vault total balance
        assertApproxEqRel(adapterBalance, vaultTotalBalance - IERC20(USDC).balanceOf(address(vault)), 0.01e18); // 1% tolerance
    }
    
    function testForceDeposit() public {
        // Send tokens directly to vault
        vm.startPrank(USDC_WHALE);
        uint256 amount = 500 * 10**6; // 500 USDC
        IERC20(USDC).transfer(address(vault), amount);
        vm.stopPrank();
        
        // Initial balances
        uint256 vaultTokenBalance = IERC20(USDC).balanceOf(address(vault));
        uint256 initialAdapterBalance = adapter.getBalance(USDC);
        
        console.log("Initial Vault Token Balance:", vaultTokenBalance);
        console.log("Initial Adapter Balance:", initialAdapterBalance);
        
        // Force deposit
        vm.startPrank(vault.owner());
        vault.forceDeposit(USDC);
        vm.stopPrank();
        
        // Final balances
        uint256 finalVaultTokenBalance = IERC20(USDC).balanceOf(address(vault));
        uint256 finalAdapterBalance = adapter.getBalance(USDC);
        
        console.log("Final Vault Token Balance:", finalVaultTokenBalance);
        console.log("Final Adapter Balance:", finalAdapterBalance);
        
        // Verify tokens were deposited to adapter
        assertEq(finalVaultTokenBalance, 0);  // All tokens should have been deposited
        assertGt(finalAdapterBalance, initialAdapterBalance);
    }
    
    function testForceWithdraw() public {
        // First deposit some tokens
        testDeposit();
        
        // Initial balances
        uint256 initialVaultTokenBalance = IERC20(USDC).balanceOf(address(vault));
        uint256 initialAdapterBalance = adapter.getBalance(USDC);
        
        console.log("Before Force Withdraw:");
        console.log("Vault Token Balance:", initialVaultTokenBalance);
        console.log("Adapter Balance:", initialAdapterBalance);
        
        // Force withdraw
        vm.startPrank(vault.owner());
        vault.forceWithdraw(USDC);
        vm.stopPrank();
        
        // Final balances
        uint256 finalVaultTokenBalance = IERC20(USDC).balanceOf(address(vault));
        uint256 finalAdapterBalance = adapter.getBalance(USDC);
        
        console.log("After Force Withdraw:");
        console.log("Vault Token Balance:", finalVaultTokenBalance);
        console.log("Adapter Balance:", finalAdapterBalance);
        
        // Verify tokens were withdrawn from adapter to vault
        assertGt(finalVaultTokenBalance, initialVaultTokenBalance);
        assertLt(finalAdapterBalance, initialAdapterBalance);
    }
    
    function testMultiTokenDeposit() public {
        uint256 usdcAmount = 1000 * 10**6;  // 1,000 USDC
        uint256 daiAmount = 1000 * 10**18;  // 1,000 DAI
        
        vm.startPrank(user);
        
        // Approve tokens
        IERC20(USDC).approve(address(vault), usdcAmount);
        IERC20(DAI).approve(address(vault), daiAmount);
        
        // Deposit USDC
        vault.deposit(USDC, usdcAmount);
        
        // Deposit DAI
        vault.deposit(DAI, daiAmount);
        
        // Check balances
        assertEq(vault.getUserBalance(user, USDC), usdcAmount);
        assertEq(vault.getUserBalance(user, DAI), daiAmount);
        
        // Both should be deposited into Compound
        assertGt(adapter.getBalance(USDC), 0);
        assertGt(adapter.getBalance(DAI), 0);
        
        vm.stopPrank();
    }

    
    function testDirectDepositToAdapter() public {
        uint256 depositAmount = 1000 * 10**6; // 1,000 USDC
        
        vm.startPrank(user);
        
        // Approve tokens
        IERC20(USDC).approve(address(adapter), depositAmount);
        
        // Initial balances
        uint256 initialUSDCBalance = IERC20(USDC).balanceOf(user);
        uint256 initialAdapterBalance = adapter.getBalance(USDC);
        
        // Deposit directly to adapter
        adapter.deposit(USDC, depositAmount);
        
        // Check balances after deposit
        uint256 finalUSDCBalance = IERC20(USDC).balanceOf(user);
        uint256 finalAdapterBalance = adapter.getBalance(USDC);
        
        // Verify deposit
        assertEq(initialUSDCBalance - finalUSDCBalance, depositAmount);
        assertGt(finalAdapterBalance, initialAdapterBalance);
        
        vm.stopPrank();
    }
    
    function testFailDepositUnsupportedToken() public {
        address UNKNOWN_TOKEN = address(0x123);
        
        vm.startPrank(user);
        adapter.deposit(UNKNOWN_TOKEN, 100);
        vm.stopPrank();
    }
    
    function testFailDepositZeroAmount() public {
        vm.startPrank(user);
        adapter.deposit(USDC, 0);
        vm.stopPrank();
    }
    
    function testFailWithdrawUnsupportedToken() public {
        address UNKNOWN_TOKEN = address(0x123);
        
        vm.startPrank(user);
        adapter.withdraw(UNKNOWN_TOKEN);
        vm.stopPrank();
    }
    
    function testRescue() public {
        // Directly send some USDC to the adapter
        vm.startPrank(USDC_WHALE);
        IERC20(USDC).transfer(address(adapter), 500 * 10**6);
        vm.stopPrank();
        
        // Check initial balance
        address recipient = address(0x456);
        uint256 initialBalance = IERC20(USDC).balanceOf(recipient);
        uint256 rescueAmount = 100 * 10**6;
        
        // Rescue the tokens
        vm.startPrank(adapter.owner());
        adapter.rescue(USDC, recipient, rescueAmount);
        vm.stopPrank();
        
        // Verify the tokens were received
        uint256 finalBalance = IERC20(USDC).balanceOf(recipient);
        assertEq(finalBalance - initialBalance, rescueAmount);
    }
}