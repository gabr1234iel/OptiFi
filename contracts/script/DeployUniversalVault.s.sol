// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "forge-std/Script.sol";
import "../src/UniversalVault.sol";
import "../src/AaveVault.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

contract DeployUniversalVault is Script {
    // Uniswap Universal Router on Ethereum Mainnet
   address constant UNISWAP_UNIVERSAL_ROUTER = 0x3fC91A3afd70395Cd496C647d5a6CC9D4B2b7FAD;
    
    // Aave Pool addresses
    address constant AAVE_V2_POOL = 0x7d2768dE32b0b80b7a3454c06BdAc94A69DDc7A9;
    address constant AAVE_V3_POOL = 0x87870Bca3F3fD6335C3F4ce8392D69350B4fA4E2;
    
    // Morpho Blue main contract on Ethereum Mainnet
    address constant MORPHO_BLUE = 0xBBBBBbbBBb9cC5e90e3b3Af64bdAF62C37EEFFCb;
    
    // Token addresses
    address constant USDC = 0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48;
    address constant USDT = 0xdAC17F958D2ee523a2206206994597C13D831ec7;
    address constant DAI = 0x6B175474E89094C44Da98b954EedeAC495271d0F;
    address constant WETH = 0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2;
    address constant WBTC = 0x2260FAC5E5542a773Aa44fBCfeDf7C193bc2C599;
    address constant CBETH = 0xBe9895146f7AF43049ca1c1AE358B0541Ea49704;
    address constant ETHX = 0xA35b1B31Ce002FBF2058D22F30f95D405200A15b;
    address constant PYUSD = 0x6c3ea9036406852006290770BEdFcAbA0e23A0e8;
    address constant USDE = 0x4c9EDD5852cd905f086C759E8383e09bff1E68B3;
    address constant USDS = 0xdC035D45d973E3EC169d2276DDab16f1e407384F;
    address constant WEETH = 0xCd5fE23C85820F7B72D0926FC9b05b43E359b7ee;
    address constant WSTETH = 0x7f39C581F595B53c5cb19bD0b3f8dA6c935E2Ca0;
    address constant RETH = 0xae78736Cd615f374D3085123A210448E74Fc6393;
    
    // Aave V2 aToken addresses
    address constant aUSDC_V2 = 0xBcca60bB61934080951369a648Fb03DF4F96263C;
    address constant aWETH_V2 = 0x030bA81f1c18d280636F32af80b9AAd02Cf0854e;
    address constant aDAI_V2 = 0x028171bCA77440897B824Ca71D1c56caC55b68A3;
    address constant aUSDT_V2 = 0x3Ed3B47Dd13EC9a98b44e6204A523E766B225811;
    address constant aWBTC_V2 = 0x9ff58f4fFB29fA2266Ab25e75e2A8b3503311656;
    
    // Aave V3 aToken addresses
    address constant aUSDC_V3 = 0x98C23E9d8f34FEFb1B7BD6a91B7FF122F4e16F5c;
    address constant aWETH_V3 = 0x4d5F47FA6A74757f35C14fD3a6Ef8E3C9BC514E8;
    address constant aDAI_V3 = 0x018008bfb33d285247A21d44E50697654f754e63;
    address constant aUSDT_V3 = 0x23878914EFE38d27C4D67Ab83ed1b93A74D4086a;
    address constant aWBTC_V3 = 0x5Ee5bf7ae06D1Be5997A1A72006FE6C607eC6DE8;
    address constant aCBETH_V3 = 0x977b6fc5dE62598B08C85AC8Cf2b745874E8b78c;
    address constant aETHX_V3 = 0x1c0E06a0b1A4c160c17545FF2A951bfcA57C0002;
    address constant aPYUSD_V3 = 0x0C0d01AbF3e6aDfcA0989eBbA9d6e85dD58EaB1E;
    address constant aUSDE_V3 = 0x4F5923Fc5FD4a93352581b38B7cD26943012DECF;
    address constant aUSDS_V3 = 0x32a6268f9Ba3642Dda7892aDd74f1D34469A4259;
    address constant aWEETH_V3 = 0xBdfa7b7893081B35Fb54027489e2Bc7A38275129;
    address constant aWSTETH_V3 = 0x0B925eD163218f6662a35e0f0371Ac234f9E9371;
    address constant aRETH_V3 = 0xCc9EE9483f662091a1de4795249E24aC0aC2630f;
    function run() external {
        // Use default Anvil private key
        uint256 privateKey = 0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80;
        address deployer = vm.addr(privateKey);
        
        vm.startBroadcast(privateKey);

        // Deploy AaveVault for V2
        AaveVault aaveVaultV2 = new AaveVault(AAVE_V2_POOL, false);
        console.log("AaveVault V2 deployed at:", address(aaveVaultV2));
        
        // Deploy AaveVault for V3
        AaveVault aaveVaultV3 = new AaveVault(AAVE_V3_POOL, true);
        console.log("AaveVault V3 deployed at:", address(aaveVaultV3));
        
        // Deploy the UniversalVault
        UniversalVault universalVault = new UniversalVault(
            UNISWAP_UNIVERSAL_ROUTER,
            address(aaveVaultV2),
            address(aaveVaultV3),
            MORPHO_BLUE
        );
        
        console.log("UniversalVault deployed at:", address(universalVault));
        
        // Set up Aave V2 tokens
        setupAaveV2Tokens(aaveVaultV2);
        
        // Set up Aave V3 tokens
        setupAaveV3Tokens(aaveVaultV3);
        
        // Get some test USDC by impersonating a whale (for testing)
        if (block.chainid == 31337) { // Only on Anvil
            address usdcWhale = 0x47ac0Fb4F2D84898e4D9E7b4DaB3C24507a6D503;
            
            uint256 usdcBalance = IERC20(USDC).balanceOf(deployer);
            console.log("Initial USDC balance:", usdcBalance);
            
            if (usdcBalance == 0) {
                console.log("Getting test USDC from whale...");
                vm.prank(usdcWhale);
                IERC20(USDC).transfer(deployer, 1000000 * 10**6); // 1M USDC
                
                usdcBalance = IERC20(USDC).balanceOf(deployer);
                console.log("New USDC balance:", usdcBalance);
            }
        }

        vm.stopBroadcast();
    }
    
    function setupAaveV2Tokens(AaveVault vault) internal {
        // Add USDC to AaveVault V2
        vault.addToken(USDC, aUSDC_V2);
        console.log("Added USDC to AaveVault V2");
        
        // Add USDT to AaveVault V2
        vault.addToken(USDT, aUSDT_V2);
        console.log("Added USDT to AaveVault V2");
        
        // Add WETH to AaveVault V2
        vault.addToken(WETH, aWETH_V2);
        console.log("Added WETH to AaveVault V2");
        
        // Add DAI to AaveVault V2
        vault.addToken(DAI, aDAI_V2);
        console.log("Added DAI to AaveVault V2");
        
        // Add WBTC to AaveVault V2
        vault.addToken(WBTC, aWBTC_V2);
        console.log("Added WBTC to AaveVault V2");
    }
    
    function setupAaveV3Tokens(AaveVault vault) internal {
        // Add tokens to AaveVault V3
        vault.addToken(USDC, aUSDC_V3);
        console.log("Added USDC to AaveVault V3");
        
        vault.addToken(USDT, aUSDT_V3);
        console.log("Added USDT to AaveVault V3");
        
        vault.addToken(DAI, aDAI_V3);
        console.log("Added DAI to AaveVault V3");
        
        vault.addToken(WETH, aWETH_V3);
        console.log("Added WETH to AaveVault V3");
        
        vault.addToken(WBTC, aWBTC_V3);
        console.log("Added WBTC to AaveVault V3");
        
        vault.addToken(CBETH, aCBETH_V3);
        console.log("Added CBETH to AaveVault V3");
        
        vault.addToken(ETHX, aETHX_V3);
        console.log("Added ETHX to AaveVault V3");
        
        vault.addToken(PYUSD, aPYUSD_V3);
        console.log("Added PYUSD to AaveVault V3");
        
        vault.addToken(USDE, aUSDE_V3);
        console.log("Added USDE to AaveVault V3");
        
        vault.addToken(USDS, aUSDS_V3);
        console.log("Added USDS to AaveVault V3");
        
        vault.addToken(WEETH, aWEETH_V3);
        console.log("Added WEETH to AaveVault V3");
        
        vault.addToken(WSTETH, aWSTETH_V3);
        console.log("Added WSTETH to AaveVault V3");
        
        vault.addToken(RETH, aRETH_V3);
        console.log("Added RETH to AaveVault V3");
    }
}