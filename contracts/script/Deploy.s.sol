// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "forge-std/Script.sol";
import "../src/AaveVault.sol";

contract DeployScript is Script {
    // Aave V3 Pool on Ethereum Mainnet
    address constant AAVE_V3_POOL = 0x87870Bca3F3fD6335C3F4ce8392D69350B4fA4E2;
    
    // Token addresses
    address constant USDC = 0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48;
    address constant WETH = 0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2;
    
    // aToken addresses
    address constant aUSDC = 0x98C23E9d8f34FEFb1B7BD6a91B7FF122F4e16F5c;
    address constant aWETH = 0x4d5F47FA6A74757f35C14fD3a6Ef8E3C9BC514E8;

    function run() external {
         uint256 privateKey = 0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80;
        vm.startBroadcast(privateKey);

        // Deploy the vault
        AaveVault vault = new AaveVault(AAVE_V3_POOL);
        
        // Add supported tokens
        vault.addToken(USDC, aUSDC);
        vault.addToken(WETH, aWETH);
        
        console.log("AaveVault deployed at:", address(vault));
        console.log("Aave Pool:", AAVE_V3_POOL);
        console.log("USDC:", USDC);
        console.log("WETH:", WETH);
        console.log("aUSDC:", aUSDC);
        console.log("aWETH:", aWETH);

        vm.stopBroadcast();
    }
}