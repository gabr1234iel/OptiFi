// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "forge-std/Script.sol";
import "../src/AaveVault.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

contract InteractScript is Script {
    // Token addresses
    address constant USDC = 0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48;
    address constant WETH = 0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2;
    
    // Update this with your deployed vault address
    address constant VAULT_ADDRESS = 0x...; // Replace with the actual address

    function run() external {
        uint256 privateKey = vm.envUint("PRIVATE_KEY");
        address user = vm.addr(privateKey);
        
        vm.startBroadcast(privateKey);

        AaveVault vault = AaveVault(VAULT_ADDRESS);
        
        // Deal some tokens to our account for testing
        deal(USDC, user, 10_000 * 10**6); // 10,000 USDC
        deal(WETH, user, 10 * 10**18); // 10 WETH
        
        // Approve tokens to the vault
        IERC20(USDC).approve(VAULT_ADDRESS, type(uint256).max);
        IERC20(WETH).approve(VAULT_ADDRESS, type(uint256).max);
        
        // Check initial balances
        console.log("Initial USDC balance:", IERC20(USDC).balanceOf(user));
        console.log("Initial WETH balance:", IERC20(WETH).balanceOf(user));
        
        // Deposit to the vault
        uint256 usdcAmount = 1_000 * 10**6; // 1,000 USDC
        vault.deposit(USDC, usdcAmount);
        console.log("Deposited", usdcAmount, "USDC to vault");
        
        uint256 wethAmount = 1 * 10**18; // 1 WETH
        vault.deposit(WETH, wethAmount);
        console.log("Deposited", wethAmount, "WETH to vault");
        
        // Check balances after deposit
        console.log("USDC balance after deposit:", IERC20(USDC).balanceOf(user));
        console.log("WETH balance after deposit:", IERC20(WETH).balanceOf(user));
        
        // Simulate time passing to generate yield
        vm.roll(block.number + 1000); // Advance 1000 blocks
        vm.warp(block.timestamp + 30 days); // Advance 30 days
        
        // Harvest yield
        uint256 usdcYield = vault.harvestYield(USDC);
        console.log("Harvested USDC yield:", usdcYield);
        
        uint256 wethYield = vault.harvestYield(WETH);
        console.log("Harvested WETH yield:", wethYield);
        
        // Get current APY
        uint256 usdcAPY = vault.getCurrentAPY(USDC);
        console.log("Current USDC APY (in ray):", usdcAPY);
        
        uint256 wethAPY = vault.getCurrentAPY(WETH);
        console.log("Current WETH APY (in ray):", wethAPY);
        
        // Withdraw half of deposits
        vault.withdraw(USDC, usdcAmount / 2);
        console.log("Withdrawn", usdcAmount / 2, "USDC from vault");
        
        vault.withdraw(WETH, wethAmount / 2);
        console.log("Withdrawn", wethAmount / 2, "WETH from vault");
        
        // Check balances after partial withdrawal
        console.log("USDC balance after partial withdrawal:", IERC20(USDC).balanceOf(user));
        console.log("WETH balance after partial withdrawal:", IERC20(WETH).balanceOf(user));
        
        // Withdraw all remaining funds with yield
        vault.withdrawAll(USDC);
        console.log("Withdrawn all remaining USDC from vault");
        
        vault.withdrawAll(WETH);
        console.log("Withdrawn all remaining WETH from vault");
        
        // Check final balances
        console.log("Final USDC balance:", IERC20(USDC).balanceOf(user));
        console.log("Final WETH balance:", IERC20(WETH).balanceOf(user));

        vm.stopBroadcast();
    }
}