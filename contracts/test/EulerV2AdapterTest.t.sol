
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "forge-std/Test.sol";
import "../src/UniversalVault.sol";
import "../src/adapters/EulerV2Adapter.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

contract EulerV2AdapterTest is Test {
    // Ethereum mainnet addresses
    address constant UNISWAP_V3_ROUTER = 0xE592427A0AEce92De3Edee1F18E0157C05861564;
    
    // Token addresses
    address constant USDC = 0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48;
    address constant WETH = 0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2;
    address constant WBTC = 0x2260FAC5E5542a773Aa44fBCfeDf7C193bc2C599;
    address constant WSTETH = 0x7f39C581F595B53c5cb19bD0b3f8dA6c935E2Ca0;
    address constant USDE = 0xe9e7CEA3DedcA5984780Bafc599bD69ADd087D56;
    address constant RSETH = 0xA1290d69c65A6Fe4DF752f95823fae25cB99e5A7;
    address constant USD0 = 0x35D8949372D46B7a3D5A56006AE77B215fc69bC0;
    
    // Euler V2 eVault addresses
    address constant EUSDC = 0x797DD80692c3b2dAdabCe8e30C07fDE5307D48a9; // EUSDC-2
    address constant EUSDC_22 = 0xe0a80d35bB6618CBA260120b279d357978c42BCE; // EUSDC-22
    address constant EWEETH = 0xe846ca062aB869b66aE8DcD811973f628BA82eAf;
    address constant EWBTC = 0x998D761eC1BAdaCeb064624cc3A1d37A46C88bA4;
    address constant EEUSDE = 0x61aAC438453d6e3513C0c8dbb69F13860E2B5028;
    address constant ERSETH = 0x1924D7fab80d0623f0836Cbf5258a7fa734EE9D9;
    address constant EUSD0 = 0xF037eeEBA7729c39114B9711c75FbccCa4A343C8;
    
    // Whale addresses for testing
    address constant USDC_WHALE = 0x37305B1cD40574E4C5Ce33f8e8306Be057fD7341;
    address constant WETH_WHALE = 0x2F0b23f53734252Bda2277357e97e1517d6B042A;
    address constant WBTC_WHALE = 0xE78388b4CE79068e89Bf8aA7f218eF6b9AB0e9d0;
    address constant WSTETH_WHALE = 0x5fEC2f34D80ED82370F733043B6A536d7e9D7f8d;
    
    // Fee tiers
    uint24 constant FEE_LOW = 500; // 0.05%
    uint24 constant FEE_MEDIUM = 3000; // 0.3%
    uint24 constant FEE_HIGH = 10000; // 1%
    
    // Test contracts
    UniversalVault public vault;
    EulerV2Adapter public eulerAdapter;
    
    // Test accounts
    address public user = address(0x1);
    
    function setUp() public {
        // Fork Ethereum mainnet
        vm.createSelectFork("http://localhost:8545");
        
        // Deploy vault
        vault = new UniversalVault(UNISWAP_V3_ROUTER);
        
        // Deploy adapter
        eulerAdapter = new EulerV2Adapter();
        
        // Set up the adapter in the vault
        vm.startPrank(vault.owner());
        vault.setAdapter(USDC, address(eulerAdapter));
        vault.setAdapter(WBTC, address(eulerAdapter));
        vault.setAdapter(WSTETH, address(eulerAdapter));
        vault.setAdapter(RSETH, address(eulerAdapter));
        vm.stopPrank();
        
        // Set up fee tiers for swaps
        vm.startPrank(vault.owner());
        vault.setDefaultFeeTier(USDC, WETH, FEE_MEDIUM); // 0.3% fee tier
        vault.setDefaultFeeTier(WETH, WBTC, FEE_MEDIUM); // 0.3% fee tier
        vault.setDefaultFeeTier(WETH, WSTETH, FEE_LOW); // 0.05% fee tier
        vault.setDefaultFeeTier(WETH, RSETH, FEE_MEDIUM); // 0.3% fee tier
        vm.stopPrank();
        
        // Give user some tokens for testing
        vm.startPrank(USDC_WHALE);
        IERC20(USDC).transfer(user, 100000 * 10**6); // 100,000 USDC
        vm.stopPrank();
        
        vm.startPrank(WETH_WHALE);
        IERC20(WETH).transfer(user, 50 * 10**18); // 50 WETH
        vm.stopPrank();
    }
    
    function testEulerVaults() public {
        // Check USDC vault
        address usdcVault = eulerAdapter.eVaults(USDC);
        console.log("USDC vault:", usdcVault);
        
        // Check WBTC vault
        address wbtcVault = eulerAdapter.eVaults(WBTC);
        console.log("WBTC vault:", wbtcVault);
        
        // Check WSTETH vault
        address wstethVault = eulerAdapter.eVaults(WSTETH);
        console.log("WSTETH vault:", wstethVault);
        
        // Check RSETH vault
        address rsethVault = eulerAdapter.eVaults(RSETH);
        console.log("RSETH vault:", rsethVault);
        
        // Check USD0 vault
        address usd0Vault = eulerAdapter.eVaults(USD0);
        console.log("USD0 vault:", usd0Vault);
        
        // Verify vault mappings are correct
        assertEq(usdcVault, EUSDC);
        assertEq(wbtcVault, EWBTC);
        assertEq(wstethVault, EWEETH);
        assertEq(rsethVault, ERSETH);
        assertEq(usd0Vault, EUSD0);
    }
    
    function testSwitchToAlternativeUSDCVault() public {
        // Check current vault for USDC
        address currentVault = eulerAdapter.eVaults(USDC);
        console.log("Current USDC vault:", currentVault);
        
        // Switch to EUSDC-22
        vm.startPrank(eulerAdapter.owner());
        eulerAdapter.addSupportedToken(USDC, EUSDC_22);
        vm.stopPrank();
        
        // Check new vault for USDC
        address newVault = eulerAdapter.eVaults(USDC);
        console.log("New USDC vault:", newVault);
        
        // Verify the switch
        assertEq(newVault, EUSDC_22);
    }
    
    function testEulerDepositUSDC() public {
        uint256 depositAmount = 1000 * 10**6; // 1,000 USDC
        
        vm.startPrank(user);
        
        // Approve tokens
        IERC20(USDC).approve(address(vault), depositAmount);
        
        // Initial balances
        uint256 initialUSDCBalance = IERC20(USDC).balanceOf(user);
        uint256 initialVaultBalance = vault.getUserBalance(user, USDC);
        uint256 initialAdapterBalance = eulerAdapter.getBalance(USDC);
        
        console.log("[Euler USDC] Initial USDC Balance:", initialUSDCBalance);
        console.log("[Euler USDC] Initial Vault Balance:", initialVaultBalance);
        console.log("[Euler USDC] Initial Adapter Balance:", initialAdapterBalance);
        
        // Deposit to vault
        vault.deposit(USDC, depositAmount);
        
        // Check balances after deposit
        uint256 finalUSDCBalance = IERC20(USDC).balanceOf(user);
        uint256 finalVaultBalance = vault.getUserBalance(user, USDC);
        uint256 finalAdapterBalance = eulerAdapter.getBalance(USDC);
        
        console.log("[Euler USDC] Final USDC Balance:", finalUSDCBalance);
        console.log("[Euler USDC] Final Vault Balance:", finalVaultBalance);
        console.log("[Euler USDC] Final Adapter Balance:", finalAdapterBalance);
        
        // Verify that tokens were deposited correctly
        assertEq(initialUSDCBalance - finalUSDCBalance, depositAmount);
        assertEq(finalVaultBalance - initialVaultBalance, depositAmount);
        assertGt(finalAdapterBalance, initialAdapterBalance);
        
        vm.stopPrank();
    }
    
    function testEulerWithdraw() public {
        // First deposit some tokens
        testEulerDepositUSDC();
        
        uint256 withdrawAmount = 500 * 10**6; // 500 USDC
        
        vm.startPrank(user);
        
        // Initial balances
        uint256 initialUSDCBalance = IERC20(USDC).balanceOf(user);
        uint256 initialVaultBalance = vault.getUserBalance(user, USDC);
        uint256 initialAdapterBalance = eulerAdapter.getBalance(USDC);
        
        console.log("[Euler Withdraw] Initial USDC Balance:", initialUSDCBalance);
        console.log("[Euler Withdraw] Initial Vault Balance:", initialVaultBalance);
        console.log("[Euler Withdraw] Initial Adapter Balance:", initialAdapterBalance);
        
        // Withdraw from vault
        vault.withdraw(USDC, withdrawAmount);
        
        // Check balances after withdrawal
        uint256 finalUSDCBalance = IERC20(USDC).balanceOf(user);
        uint256 finalVaultBalance = vault.getUserBalance(user, USDC);
        uint256 finalAdapterBalance = eulerAdapter.getBalance(USDC);
        
        console.log("[Euler Withdraw] Final USDC Balance:", finalUSDCBalance);
        console.log("[Euler Withdraw] Final Vault Balance:", finalVaultBalance);
        console.log("[Euler Withdraw] Final Adapter Balance:", finalAdapterBalance);
        
        // Verify that tokens were withdrawn correctly
        assertEq(finalUSDCBalance - initialUSDCBalance, withdrawAmount);
        assertEq(initialVaultBalance - finalVaultBalance, withdrawAmount);
        assertLt(finalAdapterBalance, initialAdapterBalance);
        
        vm.stopPrank();
    }
    
    function testGetAPY() public {
        // Get APY for each token in a vault
        uint256 usdcApy = eulerAdapter.getAPY(USDC);
        uint256 wbtcApy = eulerAdapter.getAPY(WBTC);
        uint256 wstethApy = eulerAdapter.getAPY(WSTETH);
        uint256 rsethApy = eulerAdapter.getAPY(RSETH);
        uint256 usd0Apy = eulerAdapter.getAPY(USD0);
        
        console.log("EUSDC APY (basis points):", usdcApy);
        console.log("EWBTC APY (basis points):", wbtcApy);
        console.log("EWEETH APY (basis points):", wstethApy);
        console.log("ERSETH APY (basis points):", rsethApy);
        console.log("EUSD0 APY (basis points):", usd0Apy);
        
        // Verify APYs are within reasonable range
        assertGe(usdcApy, 0);
        assertLe(usdcApy, 10000); // Max 100%
    }
    

    
    
    function testRescueTokens() public {
        // Send some tokens directly to the adapter
        uint256 rescueAmount = 100 * 10**6; // 100 USDC
        deal(USDC, address(eulerAdapter), rescueAmount);
        
        // Check initial balance
        address recipient = makeAddr("recipient");
        uint256 initialBalance = IERC20(USDC).balanceOf(recipient);
        
        // Rescue tokens
        vm.prank(eulerAdapter.owner());
        eulerAdapter.rescue(USDC, recipient, rescueAmount);
        
        // Check final balance
        uint256 finalBalance = IERC20(USDC).balanceOf(recipient);
        
        // Verify tokens were rescued
        assertEq(finalBalance - initialBalance, rescueAmount);
    }

}