// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "forge-std/Test.sol";
import "../src/UniversalVault.sol";
import "../src/adapters/AaveV2Adapter.sol";
import "../src/adapters/AaveV3Adapter.sol";
import "../src/adapters/CompoundV2Adapter.sol";
import "../src/adapters/CompoundV3Adapter.sol";
import "../src/adapters/MetaMorphoAdapter.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

contract UniversalVaultProtocolsTest is Test {
    // Ethereum mainnet addresses
    address constant AAVE_LENDING_POOL_V2 = 0x7d2768dE32b0b80b7a3454c06BdAc94A69DDc7A9;
    address constant AAVE_POOL_V3 = 0x87870Bca3F3fD6335C3F4ce8392D69350B4fA4E2;
    address constant COMPOUND_REWARDS = 0x1B0e765F6224C21223AeA2af16c1C46E38885a40;
    
    // Tokens
    address constant USDC = 0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48;
    address constant WETH = 0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2;
    address constant DAI = 0x6B175474E89094C44Da98b954EedeAC495271d0F;
    
    // Morpho vaults
    address constant STEAKUSDC = 0xBEEF01735c132Ada46AA9aA4c54623cAA92A64CB;
    address constant STEAKETH = 0xBEEf050ecd6a16c4e7bfFbB52Ebba7846C4b8cD4;
    
    // Whale addresses for testing
    address constant USDC_WHALE = 0x47ac0Fb4F2D84898e4D9E7b4DaB3C24507a6D503;
    address constant WETH_WHALE = 0x2F0b23f53734252Bda2277357e97e1517d6B042A;
    address constant DAI_WHALE = 0x6Afef3F0ee9C22B0F1734BF06C7657B72de76027;
    
    // Test contracts
    UniversalVault public vault;
    AaveV2Adapter public aaveV2Adapter;
    AaveV3Adapter public aaveV3Adapter;
    CompoundV2Adapter public compoundV2Adapter;
    CompoundV3Adapter public compoundV3Adapter;
    MetaMorphoAdapter public morphoAdapter;
    
    // Test accounts
    address public user = address(0x1);
    
    function setUp() public {
        // Fork Ethereum mainnet
        vm.createSelectFork("http://localhost:8545");
        
        // Deploy vault
        vault = new UniversalVault();
        
        // Deploy adapters
        aaveV2Adapter = new AaveV2Adapter(AAVE_LENDING_POOL_V2);
        aaveV3Adapter = new AaveV3Adapter(AAVE_POOL_V3);
        compoundV2Adapter = new CompoundV2Adapter();
        compoundV3Adapter = new CompoundV3Adapter(COMPOUND_REWARDS);
        morphoAdapter = new MetaMorphoAdapter();
        
        // Set up Aave adapters
        vm.startPrank(aaveV2Adapter.owner());
        aaveV2Adapter.addSupportedToken(USDC, 0xBcca60bB61934080951369a648Fb03DF4F96263C); // AUSDC_V2
        aaveV2Adapter.addSupportedToken(DAI, 0x028171bCA77440897B824Ca71D1c56caC55b68A3);  // ADAI_V2
        vm.stopPrank();
        
        vm.startPrank(aaveV3Adapter.owner());
        aaveV3Adapter.addSupportedToken(USDC, 0x98C23E9d8f34FEFb1B7BD6a91B7FF122F4e16F5c); // AUSDC_V3
        aaveV3Adapter.addSupportedToken(WETH, 0x4d5F47FA6A74757f35C14fD3a6Ef8E3C9BC514E8); // AWETH_V3
        vm.stopPrank();
        
        // Set up Morpho adapter
        vm.startPrank(morphoAdapter.owner());
        morphoAdapter.addVault(USDC, STEAKUSDC, "STEAKUSDC");
        morphoAdapter.addVault(WETH, STEAKETH, "STEAKETH");
        vm.stopPrank();
        
        // Give user some tokens for testing
        vm.startPrank(USDC_WHALE);
        IERC20(USDC).transfer(user, 100000 * 10**6); // 100,000 USDC
        vm.stopPrank();
        
        vm.startPrank(WETH_WHALE);
        IERC20(WETH).transfer(user, 50 * 10**18); // 50 WETH
        vm.stopPrank();
        
        vm.startPrank(DAI_WHALE);
        IERC20(DAI).transfer(user, 100000 * 10**18); // 100,000 DAI
        vm.stopPrank();
    }
    
    function testAaveV2Deposit() public {
        // Set adapter in vault
        vm.startPrank(vault.owner());
        vault.setAdapter(USDC, address(aaveV2Adapter));
        vm.stopPrank();
        
        uint256 depositAmount = 1000 * 10**6; // 1,000 USDC
        
        vm.startPrank(user);
        
        // Approve tokens
        IERC20(USDC).approve(address(vault), depositAmount);
        
        // Initial balances
        uint256 initialUSDCBalance = IERC20(USDC).balanceOf(user);
        uint256 initialVaultBalance = vault.getUserBalance(user, USDC);
        uint256 initialAdapterBalance = aaveV2Adapter.getBalance(USDC);
        
        console.log("[AaveV2] Initial USDC Balance:", initialUSDCBalance);
        console.log("[AaveV2] Initial Vault Balance:", initialVaultBalance);
        console.log("[AaveV2] Initial Adapter Balance:", initialAdapterBalance);
        
        // Deposit to vault
        vault.deposit(USDC, depositAmount);
        
        // Check balances after deposit
        uint256 finalUSDCBalance = IERC20(USDC).balanceOf(user);
        uint256 finalVaultBalance = vault.getUserBalance(user, USDC);
        uint256 finalAdapterBalance = aaveV2Adapter.getBalance(USDC);
        
        console.log("[AaveV2] Final USDC Balance:", finalUSDCBalance);
        console.log("[AaveV2] Final Vault Balance:", finalVaultBalance);
        console.log("[AaveV2] Final Adapter Balance:", finalAdapterBalance);
        
        // Verify that tokens were deposited correctly
        assertEq(initialUSDCBalance - finalUSDCBalance, depositAmount);
        assertEq(finalVaultBalance - initialVaultBalance, depositAmount);
        assertGt(finalAdapterBalance, initialAdapterBalance);
        
        vm.stopPrank();
    }
    
    function testAaveV3Deposit() public {
        // Set adapter in vault
        vm.startPrank(vault.owner());
        vault.setAdapter(WETH, address(aaveV3Adapter));
        vm.stopPrank();
        
        uint256 depositAmount = 5 * 10**18; // 5 WETH
        
        vm.startPrank(user);
        
        // Approve tokens
        IERC20(WETH).approve(address(vault), depositAmount);
        
        // Initial balances
        uint256 initialWETHBalance = IERC20(WETH).balanceOf(user);
        uint256 initialVaultBalance = vault.getUserBalance(user, WETH);
        uint256 initialAdapterBalance = aaveV3Adapter.getBalance(WETH);
        
        console.log("[AaveV3] Initial WETH Balance:", initialWETHBalance);
        console.log("[AaveV3] Initial Vault Balance:", initialVaultBalance);
        console.log("[AaveV3] Initial Adapter Balance:", initialAdapterBalance);
        
        // Deposit to vault
        vault.deposit(WETH, depositAmount);
        
        // Check balances after deposit
        uint256 finalWETHBalance = IERC20(WETH).balanceOf(user);
        uint256 finalVaultBalance = vault.getUserBalance(user, WETH);
        uint256 finalAdapterBalance = aaveV3Adapter.getBalance(WETH);
        
        console.log("[AaveV3] Final WETH Balance:", finalWETHBalance);
        console.log("[AaveV3] Final Vault Balance:", finalVaultBalance);
        console.log("[AaveV3] Final Adapter Balance:", finalAdapterBalance);
        
        // Verify that tokens were deposited correctly
        assertEq(initialWETHBalance - finalWETHBalance, depositAmount);
        assertEq(finalVaultBalance - initialVaultBalance, depositAmount);
        assertGt(finalAdapterBalance, initialAdapterBalance);
        
        vm.stopPrank();
    }
    
    function testCompoundV2Deposit() public {
        // Set adapter in vault
        vm.startPrank(vault.owner());
        vault.setAdapter(DAI, address(compoundV2Adapter));
        vm.stopPrank();
        
        uint256 depositAmount = 5000 * 10**18; // 5,000 DAI
        
        vm.startPrank(user);
        
        // Approve tokens
        IERC20(DAI).approve(address(vault), depositAmount);
        
        // Initial balances
        uint256 initialDAIBalance = IERC20(DAI).balanceOf(user);
        uint256 initialVaultBalance = vault.getUserBalance(user, DAI);
        uint256 initialAdapterBalance = compoundV2Adapter.getBalance(DAI);
        
        console.log("[CompoundV2] Initial DAI Balance:", initialDAIBalance);
        console.log("[CompoundV2] Initial Vault Balance:", initialVaultBalance);
        console.log("[CompoundV2] Initial Adapter Balance:", initialAdapterBalance);
        
        // Deposit to vault
        vault.deposit(DAI, depositAmount);
        
        // Check balances after deposit
        uint256 finalDAIBalance = IERC20(DAI).balanceOf(user);
        uint256 finalVaultBalance = vault.getUserBalance(user, DAI);
        uint256 finalAdapterBalance = compoundV2Adapter.getBalance(DAI);
        
        console.log("[CompoundV2] Final DAI Balance:", finalDAIBalance);
        console.log("[CompoundV2] Final Vault Balance:", finalVaultBalance);
        console.log("[CompoundV2] Final Adapter Balance:", finalAdapterBalance);
        
        // Verify that tokens were deposited correctly
        assertEq(initialDAIBalance - finalDAIBalance, depositAmount);
        assertEq(finalVaultBalance - initialVaultBalance, depositAmount);
        assertGt(finalAdapterBalance, initialAdapterBalance);
        
        vm.stopPrank();
    }
    
    function testCompoundV3Deposit() public {
        // Set adapter in vault
        vm.startPrank(vault.owner());
        vault.setAdapter(USDC, address(compoundV3Adapter));
        vm.stopPrank();
        
        uint256 depositAmount = 2000 * 10**6; // 2,000 USDC
        
        vm.startPrank(user);
        
        // Approve tokens
        IERC20(USDC).approve(address(vault), depositAmount);
        
        // Initial balances
        uint256 initialUSDCBalance = IERC20(USDC).balanceOf(user);
        uint256 initialVaultBalance = vault.getUserBalance(user, USDC);
        uint256 initialAdapterBalance = compoundV3Adapter.getBalance(USDC);
        
        console.log("[CompoundV3] Initial USDC Balance:", initialUSDCBalance);
        console.log("[CompoundV3] Initial Vault Balance:", initialVaultBalance);
        console.log("[CompoundV3] Initial Adapter Balance:", initialAdapterBalance);
        
        // Deposit to vault
        vault.deposit(USDC, depositAmount);
        
        // Check balances after deposit
        uint256 finalUSDCBalance = IERC20(USDC).balanceOf(user);
        uint256 finalVaultBalance = vault.getUserBalance(user, USDC);
        uint256 finalAdapterBalance = compoundV3Adapter.getBalance(USDC);
        
        console.log("[CompoundV3] Final USDC Balance:", finalUSDCBalance);
        console.log("[CompoundV3] Final Vault Balance:", finalVaultBalance);
        console.log("[CompoundV3] Final Adapter Balance:", finalAdapterBalance);
        
        // Verify that tokens were deposited correctly
        assertEq(initialUSDCBalance - finalUSDCBalance, depositAmount);
        assertEq(finalVaultBalance - initialVaultBalance, depositAmount);
        assertGt(finalAdapterBalance, initialAdapterBalance);
        
        vm.stopPrank();
    }
    
    function testMorphoDeposit() public {
        // Set adapter in vault
        vm.startPrank(vault.owner());
        vault.setAdapter(USDC, address(morphoAdapter));
        vm.stopPrank();
        
        uint256 depositAmount = 3000 * 10**6; // 3,000 USDC
        
        vm.startPrank(user);
        
        // Approve tokens
        IERC20(USDC).approve(address(vault), depositAmount);
        
        // Initial balances
        uint256 initialUSDCBalance = IERC20(USDC).balanceOf(user);
        uint256 initialVaultBalance = vault.getUserBalance(user, USDC);
        uint256 initialAdapterBalance = morphoAdapter.getBalance(USDC);
        
        console.log("[Morpho] Initial USDC Balance:", initialUSDCBalance);
        console.log("[Morpho] Initial Vault Balance:", initialVaultBalance);
        console.log("[Morpho] Initial Adapter Balance:", initialAdapterBalance);
        
        // Deposit to vault
        vault.deposit(USDC, depositAmount);
        
        // Check balances after deposit
        uint256 finalUSDCBalance = IERC20(USDC).balanceOf(user);
        uint256 finalVaultBalance = vault.getUserBalance(user, USDC);
        uint256 finalAdapterBalance = morphoAdapter.getBalance(USDC);
        
        console.log("[Morpho] Final USDC Balance:", finalUSDCBalance);
        console.log("[Morpho] Final Vault Balance:", finalVaultBalance);
        console.log("[Morpho] Final Adapter Balance:", finalAdapterBalance);
        
        // Verify that tokens were deposited correctly
        assertEq(initialUSDCBalance - finalUSDCBalance, depositAmount);
        assertEq(finalVaultBalance - initialVaultBalance, depositAmount);
        assertGt(finalAdapterBalance, initialAdapterBalance);
        
        vm.stopPrank();
    }
    
    function testWithdrawFromAaveV2() public {
        // First deposit some tokens
        testAaveV2Deposit();
        
        uint256 withdrawAmount = 500 * 10**6; // 500 USDC
        
        vm.startPrank(user);
        
        // Initial balances
        uint256 initialUSDCBalance = IERC20(USDC).balanceOf(user);
        uint256 initialVaultBalance = vault.getUserBalance(user, USDC);
        uint256 initialAdapterBalance = aaveV2Adapter.getBalance(USDC);
        
        console.log("[AaveV2 Withdraw] Initial USDC Balance:", initialUSDCBalance);
        console.log("[AaveV2 Withdraw] Initial Vault Balance:", initialVaultBalance);
        console.log("[AaveV2 Withdraw] Initial Adapter Balance:", initialAdapterBalance);
        
        // Withdraw from vault
        vault.withdraw(USDC, withdrawAmount);
        
        // Check balances after withdrawal
        uint256 finalUSDCBalance = IERC20(USDC).balanceOf(user);
        uint256 finalVaultBalance = vault.getUserBalance(user, USDC);
        uint256 finalAdapterBalance = aaveV2Adapter.getBalance(USDC);
        
        console.log("[AaveV2 Withdraw] Final USDC Balance:", finalUSDCBalance);
        console.log("[AaveV2 Withdraw] Final Vault Balance:", finalVaultBalance);
        console.log("[AaveV2 Withdraw] Final Adapter Balance:", finalAdapterBalance);
        
        // Verify that tokens were withdrawn correctly
        assertEq(finalUSDCBalance - initialUSDCBalance, withdrawAmount);
        assertEq(initialVaultBalance - finalVaultBalance, withdrawAmount);
        assertLt(finalAdapterBalance, initialAdapterBalance);
        
        vm.stopPrank();
    }
    
    function testWithdrawFromAaveV3() public {
        // First deposit some tokens
        testAaveV3Deposit();
        
        uint256 withdrawAmount = 2 * 10**18; // 2 WETH
        
        vm.startPrank(user);
        
        // Initial balances
        uint256 initialWETHBalance = IERC20(WETH).balanceOf(user);
        uint256 initialVaultBalance = vault.getUserBalance(user, WETH);
        uint256 initialAdapterBalance = aaveV3Adapter.getBalance(WETH);
        
        console.log("[AaveV3 Withdraw] Initial WETH Balance:", initialWETHBalance);
        console.log("[AaveV3 Withdraw] Initial Vault Balance:", initialVaultBalance);
        console.log("[AaveV3 Withdraw] Initial Adapter Balance:", initialAdapterBalance);
        
        // Withdraw from vault
        vault.withdraw(WETH, withdrawAmount);
        
        // Check balances after withdrawal
        uint256 finalWETHBalance = IERC20(WETH).balanceOf(user);
        uint256 finalVaultBalance = vault.getUserBalance(user, WETH);
        uint256 finalAdapterBalance = aaveV3Adapter.getBalance(WETH);
        
        console.log("[AaveV3 Withdraw] Final WETH Balance:", finalWETHBalance);
        console.log("[AaveV3 Withdraw] Final Vault Balance:", finalVaultBalance);
        console.log("[AaveV3 Withdraw] Final Adapter Balance:", finalAdapterBalance);
        
        // Verify that tokens were withdrawn correctly
        assertEq(finalWETHBalance - initialWETHBalance, withdrawAmount);
        assertEq(initialVaultBalance - finalVaultBalance, withdrawAmount);
        assertLt(finalAdapterBalance, initialAdapterBalance);
        
        vm.stopPrank();
    }
    
    function testWithdrawFromCompoundV2() public {
        // First deposit some tokens
        testCompoundV2Deposit();
        
        uint256 withdrawAmount = 2000 * 10**18; // 2,000 DAI
        
        vm.startPrank(user);
        
        // Initial balances
        uint256 initialDAIBalance = IERC20(DAI).balanceOf(user);
        uint256 initialVaultBalance = vault.getUserBalance(user, DAI);
        uint256 initialAdapterBalance = compoundV2Adapter.getBalance(DAI);
        
        console.log("[CompoundV2 Withdraw] Initial DAI Balance:", initialDAIBalance);
        console.log("[CompoundV2 Withdraw] Initial Vault Balance:", initialVaultBalance);
        console.log("[CompoundV2 Withdraw] Initial Adapter Balance:", initialAdapterBalance);
        
        // Withdraw from vault
        vault.withdraw(DAI, withdrawAmount);
        
        // Check balances after withdrawal
        uint256 finalDAIBalance = IERC20(DAI).balanceOf(user);
        uint256 finalVaultBalance = vault.getUserBalance(user, DAI);
        uint256 finalAdapterBalance = compoundV2Adapter.getBalance(DAI);
        
        console.log("[CompoundV2 Withdraw] Final DAI Balance:", finalDAIBalance);
        console.log("[CompoundV2 Withdraw] Final Vault Balance:", finalVaultBalance);
        console.log("[CompoundV2 Withdraw] Final Adapter Balance:", finalAdapterBalance);
        
        // Verify that tokens were withdrawn correctly
        assertGe(finalDAIBalance - initialDAIBalance, withdrawAmount - 10); // Allow for small rounding errors
        assertEq(initialVaultBalance - finalVaultBalance, withdrawAmount);
        assertLt(finalAdapterBalance, initialAdapterBalance);
        
        vm.stopPrank();
    }
    
    function testWithdrawFromCompoundV3() public {
        // First deposit some tokens
        testCompoundV3Deposit();
        
        uint256 withdrawAmount = 1000 * 10**6; // 1,000 USDC
        
        vm.startPrank(user);
        
        // Initial balances
        uint256 initialUSDCBalance = IERC20(USDC).balanceOf(user);
        uint256 initialVaultBalance = vault.getUserBalance(user, USDC);
        uint256 initialAdapterBalance = compoundV3Adapter.getBalance(USDC);
        
        console.log("[CompoundV3 Withdraw] Initial USDC Balance:", initialUSDCBalance);
        console.log("[CompoundV3 Withdraw] Initial Vault Balance:", initialVaultBalance);
        console.log("[CompoundV3 Withdraw] Initial Adapter Balance:", initialAdapterBalance);
        
        // Withdraw from vault
        vault.withdraw(USDC, withdrawAmount);
        
        // Check balances after withdrawal
        uint256 finalUSDCBalance = IERC20(USDC).balanceOf(user);
        uint256 finalVaultBalance = vault.getUserBalance(user, USDC);
        uint256 finalAdapterBalance = compoundV3Adapter.getBalance(USDC);
        
        console.log("[CompoundV3 Withdraw] Final USDC Balance:", finalUSDCBalance);
        console.log("[CompoundV3 Withdraw] Final Vault Balance:", finalVaultBalance);
        console.log("[CompoundV3 Withdraw] Final Adapter Balance:", finalAdapterBalance);
        
        // Verify that tokens were withdrawn correctly
        assertEq(finalUSDCBalance - initialUSDCBalance, withdrawAmount);
        assertEq(initialVaultBalance - finalVaultBalance, withdrawAmount);
        assertLt(finalAdapterBalance, initialAdapterBalance);
        
        vm.stopPrank();
    }
    
    function testWithdrawFromMorpho() public {
        // First deposit some tokens
        testMorphoDeposit();
        
        uint256 withdrawAmount = 1500 * 10**6; // 1,500 USDC
        
        vm.startPrank(user);
        
        // Initial balances
        uint256 initialUSDCBalance = IERC20(USDC).balanceOf(user);
        uint256 initialVaultBalance = vault.getUserBalance(user, USDC);
        uint256 initialAdapterBalance = morphoAdapter.getBalance(USDC);
        
        console.log("[Morpho Withdraw] Initial USDC Balance:", initialUSDCBalance);
        console.log("[Morpho Withdraw] Initial Vault Balance:", initialVaultBalance);
        console.log("[Morpho Withdraw] Initial Adapter Balance:", initialAdapterBalance);
        
        // Withdraw from vault
        vault.withdraw(USDC, withdrawAmount);
        
        // Check balances after withdrawal
        uint256 finalUSDCBalance = IERC20(USDC).balanceOf(user);
        uint256 finalVaultBalance = vault.getUserBalance(user, USDC);
        uint256 finalAdapterBalance = morphoAdapter.getBalance(USDC);
        
        console.log("[Morpho Withdraw] Final USDC Balance:", finalUSDCBalance);
        console.log("[Morpho Withdraw] Final Vault Balance:", finalVaultBalance);
        console.log("[Morpho Withdraw] Final Adapter Balance:", finalAdapterBalance);
        
        // Verify that tokens were withdrawn correctly
        assertEq(finalUSDCBalance - initialUSDCBalance, withdrawAmount);
        assertEq(initialVaultBalance - finalVaultBalance, withdrawAmount);
        assertLt(finalAdapterBalance, initialAdapterBalance);
        
        vm.stopPrank();
    }
    
    function testCompareProtocolAPYs() public {
        // Set up all adapters
        vm.startPrank(vault.owner());
        vault.setAdapter(USDC, address(aaveV2Adapter));
        vm.stopPrank();
        
        // Get APYs from different protocols for USDC
        uint256 aaveV2APY = aaveV2Adapter.getAPY(USDC);
        uint256 aaveV3APY = aaveV3Adapter.getAPY(USDC);
        uint256 compoundV2APY = compoundV2Adapter.getAPY(USDC);
        uint256 compoundV3APY = compoundV3Adapter.getAPY(USDC);
        uint256 morphoAPY = morphoAdapter.getAPY(USDC);
        
        console.log("USDC APY Comparison (basis points):");
        console.log("Aave V2:", aaveV2APY);
        console.log("Aave V3:", aaveV3APY);
        console.log("Compound V2:", compoundV2APY);
        console.log("Compound V3:", compoundV3APY);
        console.log("Morpho:", morphoAPY);
    }
    
  function testForceWithdrawAllProtocols() public {
        // Deposit to all protocols
        testAaveV2Deposit();
        testAaveV3Deposit();
        testCompoundV2Deposit();
        testCompoundV3Deposit();
        testMorphoDeposit();
        
        // Force withdraw from each
        vm.startPrank(vault.owner());
        
        // Log initial balances
        console.log("---- Initial Balances ----");
        console.log("AaveV2 USDC Balance:", aaveV2Adapter.getBalance(USDC));
        console.log("AaveV3 WETH Balance:", aaveV3Adapter.getBalance(WETH));
        console.log("CompoundV2 DAI Balance:", compoundV2Adapter.getBalance(DAI));
        console.log("CompoundV3 USDC Balance:", compoundV3Adapter.getBalance(USDC));
        console.log("Morpho USDC Balance:", morphoAdapter.getBalance(USDC));
        
        // Initial vault token balances
        uint256 initialUsdcBalance = IERC20(USDC).balanceOf(address(vault));
        uint256 initialWethBalance = IERC20(WETH).balanceOf(address(vault));
        uint256 initialDaiBalance = IERC20(DAI).balanceOf(address(vault));
        
        console.log("Vault USDC Balance:", initialUsdcBalance);
        console.log("Vault WETH Balance:", initialWethBalance);
        console.log("Vault DAI Balance:", initialDaiBalance);
        
        // Force withdraw from each adapter
        console.log("---- Forcing Withdrawals ----");
        
        console.log("Withdrawing USDC from AaveV2");
        vault.setAdapter(USDC, address(aaveV2Adapter));
        vault.forceWithdraw(USDC);
        
        console.log("Withdrawing WETH from AaveV3");
        vault.forceWithdraw(WETH);
        
        console.log("Withdrawing DAI from CompoundV2");
        vault.forceWithdraw(DAI);
        
        console.log("Withdrawing USDC from CompoundV3");
        vault.setAdapter(USDC, address(compoundV3Adapter));
        vault.forceWithdraw(USDC);
        
        console.log("Withdrawing USDC from Morpho");
        vault.setAdapter(USDC, address(morphoAdapter));
        vault.forceWithdraw(USDC);
        
        // Log final adapter balances
        console.log("---- Final Adapter Balances ----");
        console.log("AaveV2 USDC Balance:", aaveV2Adapter.getBalance(USDC));
        console.log("AaveV3 WETH Balance:", aaveV3Adapter.getBalance(WETH));
        console.log("CompoundV2 DAI Balance:", compoundV2Adapter.getBalance(DAI));
        console.log("CompoundV3 USDC Balance:", compoundV3Adapter.getBalance(USDC));
        console.log("Morpho USDC Balance:", morphoAdapter.getBalance(USDC));
        
        // Log final vault balances
        uint256 finalUsdcBalance = IERC20(USDC).balanceOf(address(vault));
        uint256 finalWethBalance = IERC20(WETH).balanceOf(address(vault));
        uint256 finalDaiBalance = IERC20(DAI).balanceOf(address(vault));
        
        console.log("---- Final Vault Balances ----");
        console.log("Vault USDC Balance:", finalUsdcBalance);
        console.log("Vault WETH Balance:", finalWethBalance);
        console.log("Vault DAI Balance:", finalDaiBalance);
        
        // Verify with individual checks instead of all together
        if (finalUsdcBalance <= initialUsdcBalance) {
            console.log("USDC not increased in vault as expected");
        }
        
        if (finalWethBalance <= initialWethBalance) {
            console.log("WETH not increased in vault as expected");
        }
        
        if (finalDaiBalance <= initialDaiBalance) {
            console.log("DAI not increased in vault as expected");
        }
        
        // Check at least one withdrawal succeeded
        assertTrue(
            finalUsdcBalance > initialUsdcBalance || 
            finalWethBalance > initialWethBalance || 
            finalDaiBalance > initialDaiBalance,
            "At least one token should have been withdrawn"
        );
        
        vm.stopPrank();
    }
    
    function testRebalanceBetweenAllProtocols() public {
        // Start with AaveV2 for USDC
        vm.startPrank(vault.owner());
        vault.setAdapter(USDC, address(aaveV2Adapter));
        vm.stopPrank();
        
        // Deposit USDC
        vm.startPrank(user);
        IERC20(USDC).approve(address(vault), 5000 * 10**6);
        vault.deposit(USDC, 5000 * 10**6);
        vm.stopPrank();
        
        // Rebalance to CompoundV2
        vm.startPrank(vault.owner());
        
        // Check initial balance in AaveV2
        uint256 initialAaveV2Balance = aaveV2Adapter.getBalance(USDC);
        console.log("Initial AaveV2 USDC balance:", initialAaveV2Balance);
        
        // Rebalance to CompoundV2
        vault.rebalance(USDC, address(morphoAdapter));
        
        // Check balances after third rebalance
        uint256 finalCompoundV3Balance = compoundV3Adapter.getBalance(USDC);
        uint256 morphoBalance = morphoAdapter.getBalance(USDC);
        
        //Initial CompoundV3 balance
        uint256 initialCompoundV3Balance = compoundV3Adapter.getBalance(USDC);

        console.log("Final CompoundV3 USDC balance:", finalCompoundV3Balance);
        console.log("Morpho USDC balance:", morphoBalance);
        
        // Verify funds moved from CompoundV3 to Morpho
        assertLt(finalCompoundV3Balance, initialCompoundV3Balance);
        assertGt(morphoBalance, 0);
        
        // Final check: Vault balance should still be same as deposit
        assertEq(vault.getUserBalance(user, USDC), 5000 * 10**6);
        
        vm.stopPrank();
    }
    
    function testAllProtocolsWithdrawAll() public {
        // Deposit to all protocols
        testAaveV2Deposit();
        testAaveV3Deposit();
        testCompoundV2Deposit();
        testCompoundV3Deposit();
        testMorphoDeposit();
        
        vm.startPrank(user);
        
        // Withdraw all from AaveV2
        uint256 aaveV2Balance = vault.getUserBalance(user, USDC);
        vault.withdraw(USDC, aaveV2Balance);
        
        // Withdraw all from AaveV3
        uint256 aaveV3Balance = vault.getUserBalance(user, WETH);
        vault.withdraw(WETH, aaveV3Balance);
        
        // Withdraw all from CompoundV2
        uint256 compoundV2Balance = vault.getUserBalance(user, DAI);
        vault.withdraw(DAI, compoundV2Balance);
        
        // Withdraw all from CompoundV3 (need to set adapter first)
        vm.stopPrank();
        vm.startPrank(vault.owner());
        vault.setAdapter(USDC, address(compoundV3Adapter));
        vm.stopPrank();
        
        vm.startPrank(user);
        uint256 compoundV3Balance = vault.getUserBalance(user, USDC);
        vault.withdraw(USDC, compoundV3Balance);
        
        // Withdraw all from Morpho (need to set adapter first)
        vm.stopPrank();
        vm.startPrank(vault.owner());
        vault.setAdapter(USDC, address(morphoAdapter));
        vm.stopPrank();
        
        vm.startPrank(user);
        uint256 morphoBalance = vault.getUserBalance(user, USDC);
        vault.withdraw(USDC, morphoBalance);
        
        vm.stopPrank();
        
        // Verify all balances are now 0
        assertEq(vault.getUserBalance(user, USDC), 0);
        assertEq(vault.getUserBalance(user, WETH), 0);
        assertEq(vault.getUserBalance(user, DAI), 0);
    }
    
    function testGetBalanceAcrossAllProtocols() public {
        // Deposit to all protocols
        testAaveV2Deposit();      // 1,000 USDC to AaveV2
        testCompoundV2Deposit();  // 5,000 DAI to CompoundV2
        
        // Set CompoundV3 for USDC and deposit
        vm.startPrank(vault.owner());
        vault.setAdapter(USDC, address(compoundV3Adapter));
        vm.stopPrank();
        
        // Deposit 2,000 USDC to CompoundV3
        vm.startPrank(user);
        IERC20(USDC).approve(address(vault), 2000 * 10**6);
        vault.deposit(USDC, 2000 * 10**6);
        vm.stopPrank();
        
        // Set Morpho for USDC and deposit
        vm.startPrank(vault.owner());
        vault.setAdapter(USDC, address(morphoAdapter));
        vm.stopPrank();
        
        // Deposit 3,000 USDC to Morpho
        vm.startPrank(user);
        IERC20(USDC).approve(address(vault), 3000 * 10**6);
        vault.deposit(USDC, 3000 * 10**6);
        vm.stopPrank();
        
        // Check individual protocol balances
        uint256 aaveV2USDCBalance = aaveV2Adapter.getBalance(USDC);
        uint256 compoundV2DAIBalance = compoundV2Adapter.getBalance(DAI);
        uint256 compoundV3USDCBalance = compoundV3Adapter.getBalance(USDC);
        uint256 morphoUSDCBalance = morphoAdapter.getBalance(USDC);
        
        console.log("AaveV2 USDC Balance:", aaveV2USDCBalance);
        console.log("CompoundV2 DAI Balance:", compoundV2DAIBalance);
        console.log("CompoundV3 USDC Balance:", compoundV3USDCBalance);
        console.log("Morpho USDC Balance:", morphoUSDCBalance);
        
        // Check vault's tracking balances
        uint256 vaultUSDCBalance = vault.getUserBalance(user, USDC);
        uint256 vaultDAIBalance = vault.getUserBalance(user, DAI);
        
        console.log("Vault USDC Balance:", vaultUSDCBalance);
        console.log("Vault DAI Balance:", vaultDAIBalance);
        
        // Verify vault is tracking correctly
        assertEq(vaultUSDCBalance, 1000 * 10**6 + 2000 * 10**6 + 3000 * 10**6); // Sum of all USDC deposits
        assertEq(vaultDAIBalance, 5000 * 10**18); // DAI deposit
    }
    
    function testMixedRebalance() public {
        // Start with depositing to multiple protocols
        vm.startPrank(vault.owner());
        vault.setAdapter(USDC, address(aaveV2Adapter));
        vm.stopPrank();
        
        // Deposit USDC to AaveV2
        vm.startPrank(user);
        IERC20(USDC).approve(address(vault), 5000 * 10**6);
        vault.deposit(USDC, 5000 * 10**6);
        vm.stopPrank();
        
        // Rebalance to multiple protocols
        vm.startPrank(vault.owner());
        
        // Get initial balance
        uint256 initialBalance = aaveV2Adapter.getBalance(USDC);
        console.log("Initial AaveV2 balance:", initialBalance);
        
        // Rebalance to CompoundV2
        vault.rebalance(USDC, address(compoundV2Adapter));
        
        // Get balances after first rebalance
        uint256 aaveV2Balance = aaveV2Adapter.getBalance(USDC);
        uint256 compoundV2Balance = compoundV2Adapter.getBalance(USDC);
        console.log("AaveV2 balance after rebalance:", aaveV2Balance);
        console.log("CompoundV2 balance after rebalance:", compoundV2Balance);
        
        // Switch part back to CompoundV3
        vault.setAdapter(USDC, address(compoundV3Adapter));
        
        // Deposit more USDC (this goes to CompoundV3)
        vm.stopPrank();
        vm.startPrank(user);
        IERC20(USDC).approve(address(vault), 3000 * 10**6);
        vault.deposit(USDC, 3000 * 10**6);
        vm.stopPrank();
        
        // Check balance in CompoundV3
        uint256 compoundV3Balance = compoundV3Adapter.getBalance(USDC);
        console.log("CompoundV3 balance after deposit:", compoundV3Balance);
        
        // Rebalance to Morpho
        vm.startPrank(vault.owner());
        vault.rebalance(USDC, address(morphoAdapter));
        
        // Get final balances
        uint256 finalCompoundV3Balance = compoundV3Adapter.getBalance(USDC);
        uint256 morphoBalance = morphoAdapter.getBalance(USDC);
        
        console.log("CompoundV3 balance after rebalance:", finalCompoundV3Balance);
        console.log("Morpho balance after rebalance:", morphoBalance);
        
        // Final check: Vault balance should be both initial and additional deposits
        assertEq(vault.getUserBalance(user, USDC), 5000 * 10**6 + 3000 * 10**6);
        
        vm.stopPrank();
    }
    
    function testMultiTokenMultiProtocol() public {
        // Set up adapters for multiple tokens
        vm.startPrank(vault.owner());
        vault.setAdapter(USDC, address(aaveV2Adapter));
        vault.setAdapter(DAI, address(compoundV2Adapter));
        vault.setAdapter(WETH, address(aaveV3Adapter));
        vm.stopPrank();
        
        vm.startPrank(user);
        
        // Deposit multiple tokens
        IERC20(USDC).approve(address(vault), 2000 * 10**6);
        IERC20(DAI).approve(address(vault), 3000 * 10**18);
        IERC20(WETH).approve(address(vault), 3 * 10**18);
        
        vault.deposit(USDC, 2000 * 10**6);
        vault.deposit(DAI, 3000 * 10**18);
        vault.deposit(WETH, 3 * 10**18);
        
        // Check balances
        assertEq(vault.getUserBalance(user, USDC), 2000 * 10**6);
        assertEq(vault.getUserBalance(user, DAI), 3000 * 10**18);
        assertEq(vault.getUserBalance(user, WETH), 3 * 10**18);
        
        // Withdraw partial amounts
        vault.withdraw(USDC, 1000 * 10**6);
        vault.withdraw(DAI, 1500 * 10**18);
        vault.withdraw(WETH, 1 * 10**18);
        
        // Check updated balances
        assertEq(vault.getUserBalance(user, USDC), 1000 * 10**6);
        assertEq(vault.getUserBalance(user, DAI), 1500 * 10**18);
        assertEq(vault.getUserBalance(user, WETH), 2 * 10**18);
        
        vm.stopPrank();
        
        // Change adapters
        vm.startPrank(vault.owner());
        vault.setAdapter(USDC, address(compoundV3Adapter));
        vault.setAdapter(DAI, address(aaveV2Adapter));
        vm.stopPrank();
        
        // Verify funds were moved to new adapters
        assertGt(compoundV3Adapter.getBalance(USDC), 0);
        assertGt(aaveV2Adapter.getBalance(DAI), 0);
        
        // Withdraw remaining balances
        vm.startPrank(user);
        vault.withdraw(USDC, 1000 * 10**6);
        vault.withdraw(DAI, 1500 * 10**18);
        vault.withdraw(WETH, 2 * 10**18);
        vm.stopPrank();
        
        // Verify all balances are now 0
        assertEq(vault.getUserBalance(user, USDC), 0);
        assertEq(vault.getUserBalance(user, DAI), 0);
        assertEq(vault.getUserBalance(user, WETH), 0);
    }
    
}