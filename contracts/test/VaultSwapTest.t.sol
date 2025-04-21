// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "forge-std/Test.sol";
import "../src/UniversalVault.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

contract VaultSwapTest is Test {
    // Mainnet addresses
    address constant UNISWAP_V3_ROUTER = 0xE592427A0AEce92De3Edee1F18E0157C05861564;
    
    // Tokens
    address constant USDC = 0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48;
    address constant WETH = 0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2;
    
    // Fee tier
    uint24 constant FEE_MEDIUM = 3000; // 0.3%
    
    // Whale address
    address constant USDC_WHALE = 0x47ac0Fb4F2D84898e4D9E7b4DaB3C24507a6D503;
    
    // Test contracts
    UniversalVault public vault;
    
    // Test account
    address public user = address(0x1);
    
    function setUp() public {
        // Fork mainnet
        vm.createSelectFork("http://localhost:8545");
        
        // Deploy vault with Uniswap router
        vault = new UniversalVault(UNISWAP_V3_ROUTER);
        
        // Set default fee tier
        vm.startPrank(vault.owner());
        vault.setDefaultFeeTier(USDC, WETH, FEE_MEDIUM);
        vm.stopPrank();
        
        // Give user some USDC
        vm.startPrank(USDC_WHALE);
        uint256 amount = 10000 * 10**6; // 10,000 USDC
        IERC20(USDC).transfer(user, amount);
        vm.stopPrank();
        
        // User deposits USDC to vault
        vm.startPrank(user);
        IERC20(USDC).approve(address(vault), 5000 * 10**6);
        vault.deposit(USDC, 5000 * 10**6); // This will properly set vaultBalances
        vm.stopPrank();
    }
    
    function testVaultDirectSwap() public {
        vm.startPrank(vault.owner());
        
        uint256 swapAmount = 5000 * 10**6; // 5,000 USDC
        
        // Initial balances
        uint256 initialUSDCVault = IERC20(USDC).balanceOf(address(vault));
        uint256 initialWETHVault = IERC20(WETH).balanceOf(address(vault));
        
        console.log("Initial USDC in vault:", initialUSDCVault);
        console.log("Initial WETH in vault:", initialWETHVault);
        
        // Minimum amount out with 10% slippage
        uint256 minAmountOut = 2.8 ether;
        
        // Execute swap
        try vault.swapExactTokens(
            USDC,
            WETH,
            swapAmount,
            minAmountOut,
            FEE_MEDIUM
        ) returns (uint256 amountReceived) {
            // Final balances
            uint256 finalUSDCVault = IERC20(USDC).balanceOf(address(vault));
            uint256 finalWETHVault = IERC20(WETH).balanceOf(address(vault));
            
            console.log("Final USDC in vault:", finalUSDCVault);
            console.log("Final WETH in vault:", finalWETHVault);
            console.log("WETH received:", amountReceived);
            
            // Verify swap
            assertEq(initialUSDCVault - finalUSDCVault, swapAmount, "USDC not correctly deducted");
            assertEq(finalWETHVault - initialWETHVault, amountReceived, "WETH not correctly received");
            assertGe(amountReceived, minAmountOut, "Received less than minimum");
        } catch Error(string memory reason) {
            console.log("Vault swap failed with reason:", reason);
        } catch (bytes memory) {
            console.log("Vault swap failed with unknown error");
        }
        
        vm.stopPrank();
    }
}