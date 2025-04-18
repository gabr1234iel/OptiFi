// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "forge-std/Script.sol";
import "../src/UniversalVault.sol";

contract InitializeUniversalVault is Script {
    // Token addresses with proper checksums
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

    function run() external {
        // Use your Anvil private key
        uint256 privateKey = 0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80;

        // Set this to your deployed UniversalVault address
        address universalVaultAddress = 0xfC3983DE3F7cBe1Ba01084469779470AD0BbeFfa; // Replace with your deployed address

        vm.startBroadcast(privateKey);

        UniversalVault vault = UniversalVault(universalVaultAddress);

        // Add Aave V2 pools
        addAaveV2Pools(vault);

        // Add Aave V3 pools
        addAaveV3Pools(vault);

        // Add Morpho Blue pools
        // addMorphoBluePools(vault);

        vm.stopBroadcast();
    }

    function addAaveV2Pools(UniversalVault vault) internal {
        // Aave V2 Pool address
        address aaveV2Pool = 0x7d2768dE32b0b80b7a3454c06BdAc94A69DDc7A9;

        // Deposit and withdraw function signatures
        bytes4 depositFunc = 0xe8eda9df; // deposit
        bytes4 withdrawFunc = 0x69328dec; // withdraw

        // Add USDC pool
        vault.addAavePool(
            "AAVE_V2_USDC",
            aaveV2Pool,
            USDC,
            depositFunc,
            withdrawFunc,
            UniversalVault.Protocol.AAVE_V2
        );

        // Add USDT pool
        vault.addAavePool(
            "AAVE_V2_USDT",
            aaveV2Pool,
            USDT,
            depositFunc,
            withdrawFunc,
            UniversalVault.Protocol.AAVE_V2
        );

        // Add WBTC pool
        vault.addAavePool(
            "AAVE_V2_WBTC",
            aaveV2Pool,
            WBTC,
            depositFunc,
            withdrawFunc,
            UniversalVault.Protocol.AAVE_V2
        );
    }

    function addAaveV3Pools(UniversalVault vault) internal {
        // Aave V3 Pool address
        address aaveV3Pool = 0x87870Bca3F3fD6335C3F4ce8392D69350B4fA4E2;

        // Supply and withdraw function signatures
        bytes4 supplyFunc = 0x617ba037; // supply
        bytes4 withdrawFunc = 0x69328dec; // withdraw

        // Add USDC pool
        vault.addAavePool(
            "AAVE_V3_USDC",
            aaveV3Pool,
            USDC,
            supplyFunc,
            withdrawFunc,
            UniversalVault.Protocol.AAVE_V3
        );

        // Add USDT pool
        vault.addAavePool(
            "AAVE_V3_USDT",
            aaveV3Pool,
            USDT,
            supplyFunc,
            withdrawFunc,
            UniversalVault.Protocol.AAVE_V3
        );

        // Add DAI pool
        vault.addAavePool(
            "AAVE_V3_DAI",
            aaveV3Pool,
            DAI,
            supplyFunc,
            withdrawFunc,
            UniversalVault.Protocol.AAVE_V3
        );

        // Add WETH pool
        vault.addAavePool(
            "AAVE_V3_WETH",
            aaveV3Pool,
            WETH,
            supplyFunc,
            withdrawFunc,
            UniversalVault.Protocol.AAVE_V3
        );

        // Add WBTC pool
        vault.addAavePool(
            "AAVE_V3_WBTC",
            aaveV3Pool,
            WBTC,
            supplyFunc,
            withdrawFunc,
            UniversalVault.Protocol.AAVE_V3
        );

        // Add CBETH pool
        vault.addAavePool(
            "AAVE_V3_CBETH",
            aaveV3Pool,
            CBETH,
            supplyFunc,
            withdrawFunc,
            UniversalVault.Protocol.AAVE_V3
        );

        // Add other Aave V3 pools you want to support
        vault.addAavePool(
            "AAVE_V3_WSTETH",
            aaveV3Pool,
            WSTETH,
            supplyFunc,
            withdrawFunc,
            UniversalVault.Protocol.AAVE_V3
        );

        vault.addAavePool(
            "AAVE_V3_ETHX",
            aaveV3Pool,
            ETHX,
            supplyFunc,
            withdrawFunc,
            UniversalVault.Protocol.AAVE_V3
        );

        vault.addAavePool(
            "AAVE_V3_PYUSD",
            aaveV3Pool,
            PYUSD,
            supplyFunc,
            withdrawFunc,
            UniversalVault.Protocol.AAVE_V3
        );
    }

    // function addMorphoBluePools(UniversalVault vault) internal {
    //     // Function signatures for all Morpho Blue pools
    //     bytes4 depositFunc = 0x6e553f65; // deposit
    //     bytes4 redeemFunc = 0xba087652; // redeem

    //     // USDC pools
    //     vault.addMorphoBluePool(
    //         "MORPHO_USDC_BBQ",
    //         0xBEeFFF209270748ddd194831b3fa287a5386f5bC,
    //         USDC,
    //         depositFunc,
    //         redeemFunc,
    //         UniversalVault.Protocol.MORPHO_BLUE
    //     );
    //     vault.addMorphoBluePool(
    //         "MORPHO_USDC_GT",
    //         0xdd0f28e19C1780eb6396170735D45153D261490d,
    //         USDC,
    //         depositFunc,
    //         redeemFunc,
    //         UniversalVault.Protocol.MORPHO_BLUE
    //     );
    //     vault.addPool(
    //         "MORPHO_USDC_GTE",
    //         0xc080f56504e0278828A403269DB945F6c6D6E014,
    //         USDC,
    //         depositFunc,
    //         redeemFunc,
    //         UniversalVault.Protocol.MORPHO_BLUE
    //     );
    //     vault.addPool(
    //         "MORPHO_USDC_GTCORE",
    //         0x8eB67A509616cd6A7c1B3c8C21D48FF57df3d458,
    //         USDC,
    //         depositFunc,
    //         redeemFunc,
    //         UniversalVault.Protocol.MORPHO_BLUE
    //     );
    //     vault.addPool(
    //         "MORPHO_USDC_GTF",
    //         0xc582F04d8a82795aa2Ff9c8bb4c1c889fe7b754e,
    //         USDC,
    //         depositFunc,
    //         redeemFunc,
    //         UniversalVault.Protocol.MORPHO_BLUE
    //     );
    //     vault.addPool(
    //         "MORPHO_USDC_H",
    //         0x974c8FBf4fd795F66B85B73ebC988A51F1A040a9,
    //         USDC,
    //         depositFunc,
    //         redeemFunc,
    //         UniversalVault.Protocol.MORPHO_BLUE
    //     );
    //     vault.addPool(
    //         "MORPHO_USDC_HYPER",
    //         0x777791C4d6DC2CE140D00D2828a7C93503c67777,
    //         USDC,
    //         depositFunc,
    //         redeemFunc,
    //         UniversalVault.Protocol.MORPHO_BLUE
    //     );
    //     vault.addPool(
    //         "MORPHO_USDC_RESOLV",
    //         0x132E6C9C33A62D7727cd359b1f51e5B566E485Eb,
    //         USDC,
    //         depositFunc,
    //         redeemFunc,
    //         UniversalVault.Protocol.MORPHO_BLUE
    //     );
    //     vault.addPool(
    //         "MORPHO_USDC_RE",
    //         0x0F359FD18BDa75e9c49bC027E7da59a4b01BF32a,
    //         USDC,
    //         depositFunc,
    //         redeemFunc,
    //         UniversalVault.Protocol.MORPHO_BLUE
    //     );
    //     vault.addPool(
    //         "MORPHO_USDC_SBMORPHO",
    //         0x4Ff4186188f8406917293A9e01A1ca16d3cf9E59,
    //         USDC,
    //         depositFunc,
    //         redeemFunc,
    //         UniversalVault.Protocol.MORPHO_BLUE
    //     );
    //     vault.addPool(
    //         "MORPHO_USDC_STEAK",
    //         0xBEEF01735c132Ada46AA9aA4c54623cAA92A64CB,
    //         USDC,
    //         depositFunc,
    //         redeemFunc,
    //         UniversalVault.Protocol.MORPHO_BLUE
    //     );
    //     vault.addPool(
    //         "MORPHO_USDC_USUAL",
    //         0xd63070114470f685b75B74D60EEc7c1113d33a3D,
    //         USDC,
    //         depositFunc,
    //         redeemFunc,
    //         UniversalVault.Protocol.MORPHO_BLUE
    //     );

    //     // USDT pools
    //     vault.addPool(
    //         "MORPHO_USDT_GT",
    //         0x8CB3649114051cA5119141a34C200D65dc0Faa73,
    //         USDT,
    //         depositFunc,
    //         redeemFunc,
    //         UniversalVault.Protocol.MORPHO_BLUE
    //     );
    //     vault.addPool(
    //         "MORPHO_USDT_STEAK",
    //         0xbEef047a543E45807105E51A8BBEFCc5950fcfBa,
    //         USDT,
    //         depositFunc,
    //         redeemFunc,
    //         UniversalVault.Protocol.MORPHO_BLUE
    //     );

    //     // DAI pools
    //     vault.addPool(
    //         "MORPHO_DAI_GTCORE",
    //         0x500331c9fF24D9d11aee6B07734Aa72343EA74a5,
    //         DAI,
    //         depositFunc,
    //         redeemFunc,
    //         UniversalVault.Protocol.MORPHO_BLUE
    //     );
    //     vault.addPool(
    //         "MORPHO_DAI_SP",
    //         0x73e65DBD630f90604062f6E02fAb9138e713edD9,
    //         DAI,
    //         depositFunc,
    //         redeemFunc,
    //         UniversalVault.Protocol.MORPHO_BLUE
    //     );

    //     // WETH pools
    //     vault.addPool(
    //         "MORPHO_WETH_GT",
    //         0x4881Ef0BF6d2365D3dd6499ccd7532bcdBCE0658,
    //         WETH,
    //         depositFunc,
    //         redeemFunc,
    //         UniversalVault.Protocol.MORPHO_BLUE
    //     );
    //     vault.addPool(
    //         "MORPHO_WETH_MC",
    //         0x9a8bC3B04b7f3D87cfC09ba407dCED575f2d61D8,
    //         WETH,
    //         depositFunc,
    //         redeemFunc,
    //         UniversalVault.Protocol.MORPHO_BLUE
    //     );
    //     vault.addPool(
    //         "MORPHO_WETH_RE7",
    //         0x78Fc2c2eD1A4cDb5402365934aE5648aDAd094d0,
    //         WETH,
    //         depositFunc,
    //         redeemFunc,
    //         UniversalVault.Protocol.MORPHO_BLUE
    //     );
    //     vault.addPool(
    //         "MORPHO_ETH_MHY",
    //         0x701907283a57FF77E255C3f1aAD790466B8CE4ef,
    //         WETH,
    //         depositFunc,
    //         redeemFunc,
    //         UniversalVault.Protocol.MORPHO_BLUE
    //     );
    //     vault.addPool(
    //         "MORPHO_ETH_STEAK",
    //         0xBEEf050ecd6a16c4e7bfFbB52Ebba7846C4b8cD4,
    //         WETH,
    //         depositFunc,
    //         redeemFunc,
    //         UniversalVault.Protocol.MORPHO_BLUE
    //     );

    //     // PYUSD pools
    //     vault.addPool(
    //         "MORPHO_PYUSD_STEAK",
    //         0xbEEF02e5E13584ab96848af90261f0C8Ee04722a,
    //         PYUSD,
    //         depositFunc,
    //         redeemFunc,
    //         UniversalVault.Protocol.MORPHO_BLUE
    //     );

    //     // USDL pools (would need to define USDL address)
    //     // vault.addPool("MORPHO_USDL_CS", 0xbEeFc011e94f43b8B7b455eBaB290C7Ab4E216f1, USDL, depositFunc, redeemFunc, UniversalVault.Protocol.MORPHO_BLUE);

    //     // RUSD pools (would need to define RUSD address)
    //     // vault.addPool("MORPHO_RUSD_STEAK", 0xBeEf11eCb698f4B5378685C05A210bdF71093521, RUSD, depositFunc, redeemFunc, UniversalVault.Protocol.MORPHO_BLUE);
    // }
}
