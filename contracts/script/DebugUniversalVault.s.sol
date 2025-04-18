// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "forge-std/Script.sol";
import "../src/UniversalVault.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

contract DebugUniversalVault is Script {
    address constant USDC = 0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48;
    
    function run() external {
        uint256 privateKey = 0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80;
        address universalVaultAddress = 0xfC3983DE3F7cBe1Ba01084469779470AD0BbeFfa;
        
        vm.startBroadcast(privateKey);
        
        // Get the user address
        address user = vm.addr(privateKey);
        
        // Get the UniversalVault contract
        UniversalVault vault = UniversalVault(universalVaultAddress);
        
        // Check USDC balance
        uint256 usdcBalance = IERC20(USDC).balanceOf(user);
        console.log("USDC balance:", usdcBalance);
        
        // If balance is zero, we need to get some USDC
        if (usdcBalance == 0) {
            // This assumes the fork has a USDC whale we can use
            address usdcWhale = 0x47ac0Fb4F2D84898e4D9E7b4DaB3C24507a6D503;
            vm.prank(usdcWhale);
            IERC20(USDC).transfer(user, 1000000 * 10**6); // Transfer 1M USDC
            
            usdcBalance = IERC20(USDC).balanceOf(user);
            console.log("New USDC balance:", usdcBalance);
        }
        
        // Approve USDC for the vault
        IERC20(USDC).approve(universalVaultAddress, usdcBalance);
        console.log("Approved USDC for vault");
        
        // Try to deposit to MORPHO_USDC_STEAK
        try vault.depositToMorphoBlue("MORPHO_USDC_STEAK", 100 * 10**6) {
            console.log("Deposit succeeded");
        } catch Error(string memory reason) {
            console.log("Deposit failed with reason:", reason);
        }
        
        vm.stopBroadcast();
    }
}