// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "forge-std/Script.sol";
import "forge-std/console.sol";
import "../src/UniversalVault.sol";
import "../src/adapters/AaveV2Adapter.sol";
import "../src/adapters/AaveV3Adapter.sol";
import "../src/adapters/CompoundV2Adapter.sol";
import "../src/adapters/CompoundV3Adapter.sol";
import "../src/adapters/EulerV2Adapter.sol";
import "../src/adapters/FluidProtocolAdapter.sol";
import "../src/adapters/MetaMorphoAdapter.sol";
import "../src/adapters/SkyLendingAdapter.sol";
import "../src/adapters/SparkLendAdapter.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

contract DeployProtocols is Script {
    // Ethereum mainnet addresses
    address constant UNISWAP_V3_ROUTER = 0xE592427A0AEce92De3Edee1F18E0157C05861564;
    
    // Aave addresses
    address constant AAVE_LENDING_POOL_V2 = 0x7d2768dE32b0b80b7a3454c06BdAc94A69DDc7A9;
    address constant AAVE_POOL_V3 = 0x87870Bca3F3fD6335C3F4ce8392D69350B4fA4E2;
    
    // Compound addresses
    address constant COMPOUND_REWARDS = 0x1B0e765F6224C21223AeA2af16c1C46E38885a40;

    // SparkLend addresses
    address constant SPARK_POOL = 0xC13e21B648A5Ee794902342038FF3aDAB66BE987;
    
    // Tokens
    address constant USDC = 0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48;
    address constant USDT = 0xdAC17F958D2ee523a2206206994597C13D831ec7;
    address constant WBTC = 0x2260FAC5E5542a773Aa44fBCfeDf7C193bc2C599;
    address constant DAI = 0x6B175474E89094C44Da98b954EedeAC495271d0F;
    address constant WETH = 0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2;
    address constant WSTETH = 0x7f39C581F595B53c5cb19bD0b3f8dA6c935E2Ca0;
    address constant CBETH = 0xBe9895146f7AF43049ca1c1AE358B0541Ea49704;
    address constant ETHX = 0xA35b1B31Ce002FBF2058D22F30f95D405200A15b;
    address constant PYUSD = 0x6c3ea9036406852006290770BEdFcAbA0e23A0e8;
    address constant RETH = 0xae78736Cd615f374D3085123A210448E74Fc6393;
    address constant USDE = 0x4c9EDD5852cd905f086C759E8383e09bff1E68B3;
    address constant USDS = 0xdC035D45d973E3EC169d2276DDab16f1e407384F;
    address constant WEETH = 0xCd5fE23C85820F7B72D0926FC9b05b43E359b7ee;
    address constant RSETH = 0xA1290d69c65A6Fe4DF752f95823fae25cB99e5A7;
    address constant USD0 = 0x35D8949372D46B7a3D5A56006AE77B215fc69bC0;
    address constant USDL = 0x7751E2F4b8ae93EF6B79d86419d42FE3295A4559;
    address constant RUSD = 0x09D4214C03D01F49544C0448DBE3A27f768F2b34;
    address constant EUSD = 0xA0d69E286B938e21CBf7E51D71F6A4c8918f482F; 
    address constant SUSDS = 0xa3931d71877C0E7a3148CB7Eb4463524FEc27fbD;

    
    // Aave V2 aTokens
    address constant A_USDC_V2 = 0xBcca60bB61934080951369a648Fb03DF4F96263C;
    address constant A_USDT_V2 = 0x3Ed3B47Dd13EC9a98b44e6204A523E766B225811;
    address constant A_WBTC_V2 = 0x9ff58f4fFB29fA2266Ab25e75e2A8b3503311656;
    
    // Aave V3 aTokens (for all tokens we support)
    address constant A_CBETH_V3 = 0x977b6fc5dE62598B08C85AC8Cf2b745874E8b78c;
    address constant A_DAI_V3 = 0x018008bfb33d285247A21d44E50697654f754e63;
    address constant A_ETHX_V3 = 0x1c0E06a0b1A4c160c17545FF2A951bfcA57C0002;
    address constant A_PYUSD_V3 = 0x0C0d01AbF3e6aDfcA0989eBbA9d6e85dD58EaB1E;
    address constant A_RETH_V3 = 0xCc9EE9483f662091a1de4795249E24aC0aC2630f;
    address constant A_USDC_V3 = 0x98C23E9d8f34FEFb1B7BD6a91B7FF122F4e16F5c;
    address constant A_USDE_V3 = 0x4F5923Fc5FD4a93352581b38B7cD26943012DECF;
    address constant A_USDS_V3 = 0x32a6268f9Ba3642Dda7892aDd74f1D34469A4259;
    address constant A_USDT_V3 = 0x23878914EFE38d27C4D67Ab83ed1b93A74D4086a;
    address constant A_WBTC_V3 = 0x5Ee5bf7ae06D1Be5997A1A72006FE6C607eC6DE8;
    address constant A_WEETH_V3 = 0xBdfa7b7893081B35Fb54027489e2Bc7A38275129;
    address constant A_WETH_V3 = 0x4d5F47FA6A74757f35C14fD3a6Ef8E3C9BC514E8;
    address constant A_WSTETH_V3 = 0x0B925eD163218f6662a35e0f0371Ac234f9E9371;
    
    // Compound V2 cTokens
    address constant C_DAI = 0x5d3a536E4D6DbD6114cc1Ead35777bAB948E3643;
    address constant C_USDC = 0x39AA39c021dfbaE8faC545936693aC917d5E7563;
    address constant C_USDT = 0xf650C3d88D12dB855b8bf7D11Be6C55A4e07dCC9;
    address constant C_WBTC = 0xccF4429DB6322D5C611ee964527D42E5d685DD6a;
    address constant C_ETH = 0x4Ddc2D193948926D02f9B1fE9e1daa0718270ED5;
    
    // Compound V3 markets
    address constant COMP_V3_ETH = 0xA17581A9E3356d9A858b789D68B4d866e593aE94;
    address constant COMP_V3_USDC = 0xc3d688B66703497DAA19211EEdff47f25384cdc3;
    address constant COMP_V3_USDT = 0x3Afdc9BCA9213A35503b077a6072F3D0d5AB0840;
    
    // Euler V2 markets
    address constant EEUSDE_1 = 0x61aAC438453d6e3513C0c8dbb69F13860E2B5028;
    address constant ERSETH_4 = 0x1924D7fab80d0623f0836Cbf5258a7fa734EE9D9;
    address constant EUSD0_4 = 0xF037eeEBA7729c39114B9711c75FbccCa4A343C8;
    address constant EUSDC_2 = 0x797DD80692c3b2dAdabCe8e30C07fDE5307D48a9;
    address constant EUSDC_22 = 0xe0a80d35bB6618CBA260120b279d357978c42BCE;
    address constant EWBTC_3 = 0x998D761eC1BAdaCeb064624cc3A1d37A46C88bA4;
    address constant EWEETH_6 = 0xe846ca062aB869b66aE8DcD811973f628BA82eAf;
    
    // Fluid markets (ftokens)
    address constant F_USDC = 0x9Fb7b4477576Fe5B32be4C1843aFB1e55F251B33;
    address constant F_USDT = 0x5C20B550819128074FD538Edf79791733ccEdd18;
    address constant F_WETH = 0x90551c1795392094FE6D29B758EcCD233cFAa260;
    address constant F_WSTETH = 0x2411802D8BEA09be0aF8fD8D08314a63e706b29C;
    
    // MetaMorpho vaults
    address constant MM_BBQUSDC = 0xBEeFFF209270748ddd194831b3fa287a5386f5bC;
    address constant MM_CSUSDL = 0xbEeFc011e94f43b8B7b455eBaB290C7Ab4E216f1;
    address constant MM_GTDAICORE = 0x500331c9fF24D9d11aee6B07734Aa72343EA74a5;
    address constant MM_GTEUSDC = 0xc080f56504e0278828A403269DB945F6c6D6E014;
    address constant MM_GTUSDC = 0xdd0f28e19C1780eb6396170735D45153D261490d;
    address constant MM_GTUSDCCORE = 0x8eB67A509616cd6A7c1B3c8C21D48FF57df3d458;
    address constant MM_GTUSDCF = 0xc582F04d8a82795aa2Ff9c8bb4c1c889fe7b754e;
    address constant MM_GTUSDT = 0x8CB3649114051cA5119141a34C200D65dc0Faa73;
    address constant MM_GTWETH = 0x4881Ef0BF6d2365D3dd6499ccd7532bcdBCE0658;
    address constant MM_HUSDC = 0x974c8FBf4fd795F66B85B73ebC988A51F1A040a9;
    address constant MM_HYPERUSDC = 0x777791C4d6DC2CE140D00D2828a7C93503c67777;
    address constant MM_MCWETH = 0x9a8bC3B04b7f3D87cfC09ba407dCED575f2d61D8;
    address constant MM_MHYETH = 0x701907283a57FF77E255C3f1aAD790466B8CE4ef;
    address constant MM_RE7WETH = 0x78Fc2c2eD1A4cDb5402365934aE5648aDAd094d0;
    address constant MM_RESOLVUSDC = 0x132E6C9C33A62D7727cd359b1f51e5B566E485Eb;
    address constant MM_REUSDC = 0x0F359FD18BDa75e9c49bC027E7da59a4b01BF32a;
    address constant MM_SBMORPHOUSDC = 0x4Ff4186188f8406917293A9e01A1ca16d3cf9E59;
    address constant MM_SPDAI = 0x73e65DBD630f90604062f6E02fAb9138e713edD9;
    address constant MM_STEAKETH = 0xBEEf050ecd6a16c4e7bfFbB52Ebba7846C4b8cD4;
    address constant MM_STEAKPYUSD = 0xbEEF02e5E13584ab96848af90261f0C8Ee04722a;
    address constant MM_STEAKRUSD = 0xBeEf11eCb698f4B5378685C05A210bdF71093521;
    address constant MM_STEAKUSDC = 0xBEEF01735c132Ada46AA9aA4c54623cAA92A64CB;
    address constant MM_STEAKUSDT = 0xbEef047a543E45807105E51A8BBEFCc5950fcfBa;
    address constant MM_USUALUSDC = 0xd63070114470f685b75B74D60EEc7c1113d33a3D;

    // SparkLend aTokens
    address constant SPARK_AUSDC = 0x377C3bd93f2a2984E1E7bE6A5C22c525eD4A4815; // SparkLend USDC aToken
    address constant SPARK_ADAI = 0x4DEDf26112B3Ec8eC46e7E31EA5e123490B05B8B; // SparkLend DAI aToken
    address constant SPARK_ARETH = 0x9985dF20D7e9103ECBCeb16a84956434B6f06ae8; // SparkLend rETH aToken
    address constant SPARK_AWBTC = 0x4197ba364AE6698015AE5c1468f54087602715b2; // SparkLend WBTC aToken
    address constant SPARK_AWETH = 0x59cD1C87501baa753d0B5B5Ab5D8416A45cD71DB; // SparkLend WETH aToken
    address constant SPARK_AUSDS = 0xC02aB1A5eaA8d1B114EF786D9bde108cD4364359; // SparkLend USDS aToken

    function run() external {
        
        vm.startBroadcast(); 
        console.log("Deploying protocols...");
        // Deploy UniversalVault
        UniversalVault vault = new UniversalVault(UNISWAP_V3_ROUTER);
        console.log("UniversalVault deployed at: ", address(vault));
        
        // Deploy all adapters
        AaveV2Adapter aaveV2Adapter = new AaveV2Adapter(AAVE_LENDING_POOL_V2);
        console.log("AaveV2Adapter deployed at: ", address(aaveV2Adapter));
        
        AaveV3Adapter aaveV3Adapter = new AaveV3Adapter(AAVE_POOL_V3);
        console.log("AaveV3Adapter deployed at: ", address(aaveV3Adapter));
        
        CompoundV2Adapter compoundV2Adapter = new CompoundV2Adapter();
        console.log("CompoundV2Adapter deployed at: ", address(compoundV2Adapter));
        
        CompoundV3Adapter compoundV3Adapter = new CompoundV3Adapter(COMPOUND_REWARDS);
        console.log("CompoundV3Adapter deployed at: ", address(compoundV3Adapter));
        
        EulerV2Adapter eulerV2Adapter = new EulerV2Adapter();
        console.log("EulerV2Adapter deployed at: ", address(eulerV2Adapter));
        
        FluidProtocolAdapter fluidAdapter = new FluidProtocolAdapter();
        console.log("FluidProtocolAdapter deployed at: ", address(fluidAdapter));
        
        MetaMorphoAdapter metaMorphoAdapter = new MetaMorphoAdapter();
        console.log("MetaMorphoAdapter deployed at: ", address(metaMorphoAdapter));

        SkyLendingAdapter skyLendingAdapter = new SkyLendingAdapter(SUSDS);
        console.log("SkyLendingAdapter deployed at: ", address(skyLendingAdapter));

        SparkLendAdapter sparkLendAdapter = new SparkLendAdapter(SPARK_POOL);
        console.log("SparkLendAdapter deployed at: ", address(sparkLendAdapter));
        
        // Configure Aave V2 Adapter
        console.log("Configuring AaveV2Adapter...");
        aaveV2Adapter.addSupportedToken(USDC, A_USDC_V2);
        aaveV2Adapter.addSupportedToken(USDT, A_USDT_V2);
        aaveV2Adapter.addSupportedToken(WBTC, A_WBTC_V2);
        
        // Configure Aave V3 Adapter
        console.log("Configuring AaveV3Adapter...");
        aaveV3Adapter.addSupportedToken(CBETH, A_CBETH_V3);
        aaveV3Adapter.addSupportedToken(DAI, A_DAI_V3);
        aaveV3Adapter.addSupportedToken(ETHX, A_ETHX_V3);
        aaveV3Adapter.addSupportedToken(PYUSD, A_PYUSD_V3);
        aaveV3Adapter.addSupportedToken(RETH, A_RETH_V3);
        aaveV3Adapter.addSupportedToken(USDC, A_USDC_V3);
        aaveV3Adapter.addSupportedToken(USDE, A_USDE_V3);
        aaveV3Adapter.addSupportedToken(USDS, A_USDS_V3);
        aaveV3Adapter.addSupportedToken(USDT, A_USDT_V3);
        aaveV3Adapter.addSupportedToken(WBTC, A_WBTC_V3);
        aaveV3Adapter.addSupportedToken(WEETH, A_WEETH_V3);
        aaveV3Adapter.addSupportedToken(WETH, A_WETH_V3);
        aaveV3Adapter.addSupportedToken(WSTETH, A_WSTETH_V3);
        
        // Configure Compound V2 Adapter (already initialized with default markets in constructor)
        console.log("CompoundV2Adapter configured with default markets");
        
        // Configure Compound V3 Adapter (already initialized with default markets in constructor)
        console.log("CompoundV3Adapter configured with default markets");
        
        // Configure Euler V2 Adapter
        console.log("Configuring EulerV2Adapter...");
        eulerV2Adapter.addSupportedToken(RSETH, ERSETH_4);
        eulerV2Adapter.addSupportedToken(USD0, EUSD0_4);
        eulerV2Adapter.addSupportedToken(USDC, EUSDC_2);
        eulerV2Adapter.addSupportedToken(USDC, EUSDC_22);
        eulerV2Adapter.addSupportedToken(WBTC, EWBTC_3);
        // eulerV2Adapter.addSupportedToken(WETH, EWEETH_6);
        // eulerV2Adapter.addSupportedToken(USDE, EEUSDE_1);
        
        // Configure Fluid Protocol Adapter (already initialized with default markets in constructor)
        console.log("FluidProtocolAdapter configured with default markets");
        
        // Configure MetaMorpho Adapter
        console.log("Configuring MetaMorphoAdapter...");
        metaMorphoAdapter.addVault(USDC, MM_BBQUSDC, "BBQUSDC");
        metaMorphoAdapter.addVault(USDL, MM_CSUSDL, "CSUSDL");
        metaMorphoAdapter.addVault(DAI, MM_GTDAICORE, "GTDAICORE");
        metaMorphoAdapter.addVault(USDC, MM_GTUSDC, "GTUSDC");
        metaMorphoAdapter.addVault(USDC, MM_GTUSDCCORE, "GTUSDCCORE");
        metaMorphoAdapter.addVault(USDC, MM_GTUSDCF, "GTUSDCF");
        metaMorphoAdapter.addVault(USDT, MM_GTUSDT, "GTUSDT");
        metaMorphoAdapter.addVault(WETH, MM_GTWETH, "GTWETH");
        metaMorphoAdapter.addVault(USDC, MM_HUSDC, "HUSDC");
        metaMorphoAdapter.addVault(USDC, MM_HYPERUSDC, "HYPERUSDC");
        metaMorphoAdapter.addVault(WETH, MM_MCWETH, "MCWETH");
        metaMorphoAdapter.addVault(WETH, MM_MHYETH, "MHYETH");
        metaMorphoAdapter.addVault(WETH, MM_RE7WETH, "RE7WETH");
        metaMorphoAdapter.addVault(USDC, MM_RESOLVUSDC, "RESOLVUSDC");
        metaMorphoAdapter.addVault(USDC, MM_REUSDC, "REUSDC");
        metaMorphoAdapter.addVault(USDC, MM_SBMORPHOUSDC, "SBMORPHOUSDC");
        metaMorphoAdapter.addVault(DAI, MM_SPDAI, "SPDAI");
        metaMorphoAdapter.addVault(WETH, MM_STEAKETH, "STEAKETH");
        metaMorphoAdapter.addVault(PYUSD, MM_STEAKPYUSD, "STEAKPYUSD");
        metaMorphoAdapter.addVault(RUSD, MM_STEAKRUSD, "STEAKRUSD");
        metaMorphoAdapter.addVault(USDC, MM_STEAKUSDC, "STEAKUSDC");
        metaMorphoAdapter.addVault(USDT, MM_STEAKUSDT, "STEAKUSDT");
        metaMorphoAdapter.addVault(USDC, MM_USUALUSDC, "USUALUSDC");
        metaMorphoAdapter.addVault(EUSD, MM_GTEUSDC, "GTEUSDC");


        
        // Set fee tiers for common token pairs in the vault
        console.log("Setting default fee tiers for common token pairs...");
        vault.setDefaultFeeTier(USDC, USDT, 100); // 0.01%
        vault.setDefaultFeeTier(USDC, DAI, 100);  // 0.01%
        vault.setDefaultFeeTier(USDC, WETH, 500); // 0.05%
        vault.setDefaultFeeTier(USDT, WETH, 500); // 0.05%
        vault.setDefaultFeeTier(DAI, WETH, 500);  // 0.05%
        vault.setDefaultFeeTier(WETH, WBTC, 500); // 0.05%
        vault.setDefaultFeeTier(WETH, WSTETH, 100); // 0.01%
        vault.setDefaultFeeTier(WETH, RSETH, 100); // 0.01%
        vault.setDefaultFeeTier(WETH, CBETH, 100); // 0.01%
        vault.setDefaultFeeTier(WETH, ETHX, 100); // 0.01%
        vault.setDefaultFeeTier(WETH, PYUSD, 100); // 0.01%
        vault.setDefaultFeeTier(WETH, USDE, 100); // 0.01%
        vault.setDefaultFeeTier(WETH, USDS, 100); // 0.01%
        vault.setDefaultFeeTier(WETH, USD0, 100); // 0.01%
        vault.setDefaultFeeTier(WETH, USDL, 100); // 0.01%
        vault.setDefaultFeeTier(WETH, RUSD, 100); // 0.01%
        vault.setDefaultFeeTier(WETH, EUSD, 100); // 0.01%

        
        // Set initial adapters for the vault
        console.log("Setting initial adapters in the vault...");
        
        // Aave V2 tokens
        vault.setAdapter(USDC, address(aaveV2Adapter));
        vault.setAdapter(USDT, address(aaveV2Adapter));
        vault.setAdapter(WBTC, address(aaveV2Adapter));
        vault.setAdapter(DAI, address(metaMorphoAdapter));

        
        vm.stopBroadcast();
        
        console.log("Deployment complete!");
    }
}