import { ethers } from 'ethers';
import dotenv from 'dotenv';
dotenv.config();

// ABI for the Universal Vault
const UniversalVaultABI = [
  "function addPool(string memory name, address poolAddress, address underlyingToken, bytes4 depositFunctionSig, bytes4 withdrawFunctionSig, uint8 protocol) external"
];

// Protocol enum values
enum Protocol {
  AAVE_V2 = 0,
  AAVE_V3 = 1,
  MORPHO_BLUE = 2
}

// Token addresses
const TOKEN_ADDRESSES = {
  USDC: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48',
  USDT: '0xdAC17F958D2ee523a2206206994597C13D831ec7',
  DAI: '0x6B175474E89094C44Da98b954EedeAC495271d0F',
  WETH: '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2',
  WBTC: '0x2260fac5e5542a773aa44fbcfedf7c193bc2c599',
  CBETH: '0xBe9895146f7AF43049ca1c1AE358B0541Ea49704',
  STETH: '0xae7ab96520de3a18e5e111b5eaab095312d7fe84',
  WSTETH: '0x7f39c581f595b53c5cb19bd0b3f8da6c935e2ca0',
  RETH: '0xae78736Cd615f374D3085123A210448E74Fc6393',
  PYUSD: '0x6c3ea9036406852006290770bedfcaba0e23a0e8',
  USDE: '0x4c9edd5852cd905f086c759e8383e09bff1e68b3',
  USDS: '0xdc035d45d973e3ec169d2276ddab16f1e407384f',
  WEETH: '0xcd5fe23c85820f7b72d0926fc9b05b43e359b7ee',
  ETHX: '0xA35b1B31Ce002FBF2058D22F30f95D405200A15b'
};

// Pool configurations from your CSV data
const pools = [
  // AAVE V2 Pools
  {
    name: "AAVE_V2_USDC",
    poolAddress: "0x7d2768de32b0b80b7a3454c06bdac94a69ddc7a9",
    implAddress: "0x02d84abd89ee9db409572f19b6e1596c301f3c81",
    underlyingToken: TOKEN_ADDRESSES.USDC,
    depositFunction: "0xe8eda9df", // deposit function signature
    withdrawFunction: "0x69328dec", // withdraw function signature
    protocol: Protocol.AAVE_V2
  },
  {
    name: "AAVE_V2_USDT",
    poolAddress: "0x7d2768de32b0b80b7a3454c06bdac94a69ddc7a9",
    implAddress: "0x02d84abd89ee9db409572f19b6e1596c301f3c81",
    underlyingToken: TOKEN_ADDRESSES.USDT,
    depositFunction: "0xe8eda9df",
    withdrawFunction: "0x69328dec",
    protocol: Protocol.AAVE_V2
  },
  {
    name: "AAVE_V2_WBTC",
    poolAddress: "0x7d2768de32b0b80b7a3454c06bdac94a69ddc7a9",
    implAddress: "0x02d84abd89ee9db409572f19b6e1596c301f3c81",
    underlyingToken: TOKEN_ADDRESSES.WBTC,
    depositFunction: "0xe8eda9df",
    withdrawFunction: "0x69328dec",
    protocol: Protocol.AAVE_V2
  },
  
  // AAVE V3 Pools
  {
    name: "AAVE_V3_CBETH",
    poolAddress: "0x87870bca3f3fd6335c3f4ce8392d69350b4fa4e2",
    implAddress: "0x9aeb8aaa1ca38634aa8c0c8933e7fb4d61091327",
    underlyingToken: TOKEN_ADDRESSES.CBETH,
    depositFunction: "0x617ba037", // supply function signature
    withdrawFunction: "0x69328dec", // withdraw function signature
    protocol: Protocol.AAVE_V3
  },
  {
    name: "AAVE_V3_DAI",
    poolAddress: "0x87870bca3f3fd6335c3f4ce8392d69350b4fa4e2",
    implAddress: "0x9aeb8aaa1ca38634aa8c0c8933e7fb4d61091327",
    underlyingToken: TOKEN_ADDRESSES.DAI,
    depositFunction: "0x617ba037",
    withdrawFunction: "0x69328dec",
    protocol: Protocol.AAVE_V3
  },
  {
    name: "AAVE_V3_ETHX",
    poolAddress: "0x87870bca3f3fd6335c3f4ce8392d69350b4fa4e2",
    implAddress: "0x9aeb8aaa1ca38634aa8c0c8933e7fb4d61091327",
    underlyingToken: TOKEN_ADDRESSES.ETHX,
    depositFunction: "0x617ba037",
    withdrawFunction: "0x69328dec",
    protocol: Protocol.AAVE_V3
  },
  {
    name: "AAVE_V3_PYUSD",
    poolAddress: "0x87870bca3f3fd6335c3f4ce8392d69350b4fa4e2",
    implAddress: "0x9aeb8aaa1ca38634aa8c0c8933e7fb4d61091327",
    underlyingToken: TOKEN_ADDRESSES.PYUSD,
    depositFunction: "0x617ba037",
    withdrawFunction: "0x69328dec",
    protocol: Protocol.AAVE_V3
  },
  {
    name: "AAVE_V3_RETH",
    poolAddress: "0x87870bca3f3fd6335c3f4ce8392d69350b4fa4e2",
    implAddress: "0x9aeb8aaa1ca38634aa8c0c8933e7fb4d61091327",
    underlyingToken: TOKEN_ADDRESSES.RETH,
    depositFunction: "0x617ba037",
    withdrawFunction: "0x69328dec",
    protocol: Protocol.AAVE_V3
  },
  {
    name: "AAVE_V3_USDC",
    poolAddress: "0x87870bca3f3fd6335c3f4ce8392d69350b4fa4e2",
    implAddress: "0x9aeb8aaa1ca38634aa8c0c8933e7fb4d61091327",
    underlyingToken: TOKEN_ADDRESSES.USDC,
    depositFunction: "0x617ba037",
    withdrawFunction: "0x69328dec",
    protocol: Protocol.AAVE_V3
  },
  {
    name: "AAVE_V3_USDE",
    poolAddress: "0x87870bca3f3fd6335c3f4ce8392d69350b4fa4e2",
    implAddress: "0x9aeb8aaa1ca38634aa8c0c8933e7fb4d61091327",
    underlyingToken: TOKEN_ADDRESSES.USDE,
    depositFunction: "0x617ba037",
    withdrawFunction: "0x69328dec",
    protocol: Protocol.AAVE_V3
  },
  {
    name: "AAVE_V3_USDS",
    poolAddress: "0x87870bca3f3fd6335c3f4ce8392d69350b4fa4e2",
    implAddress: "0x9aeb8aaa1ca38634aa8c0c8933e7fb4d61091327",
    underlyingToken: TOKEN_ADDRESSES.USDS,
    depositFunction: "0x617ba037",
    withdrawFunction: "0x69328dec",
    protocol: Protocol.AAVE_V3
  },
  {
    name: "AAVE_V3_USDT",
    poolAddress: "0x87870bca3f3fd6335c3f4ce8392d69350b4fa4e2",
    implAddress: "0x9aeb8aaa1ca38634aa8c0c8933e7fb4d61091327",
    underlyingToken: TOKEN_ADDRESSES.USDT,
    depositFunction: "0x617ba037",
    withdrawFunction: "0x69328dec",
    protocol: Protocol.AAVE_V3
  },
  {
    name: "AAVE_V3_WBTC",
    poolAddress: "0x87870bca3f3fd6335c3f4ce8392d69350b4fa4e2",
    implAddress: "0x9aeb8aaa1ca38634aa8c0c8933e7fb4d61091327",
    underlyingToken: TOKEN_ADDRESSES.WBTC,
    depositFunction: "0x617ba037",
    withdrawFunction: "0x69328dec",
    protocol: Protocol.AAVE_V3
  },
  {
    name: "AAVE_V3_WEETH",
    poolAddress: "0x87870bca3f3fd6335c3f4ce8392d69350b4fa4e2",
    implAddress: "0x9aeb8aaa1ca38634aa8c0c8933e7fb4d61091327",
    underlyingToken: TOKEN_ADDRESSES.WEETH,
    depositFunction: "0x617ba037",
    withdrawFunction: "0x69328dec",
    protocol: Protocol.AAVE_V3
  },
  {
    name: "AAVE_V3_WETH",
    poolAddress: "0x87870bca3f3fd6335c3f4ce8392d69350b4fa4e2",
    implAddress: "0x9aeb8aaa1ca38634aa8c0c8933e7fb4d61091327",
    underlyingToken: TOKEN_ADDRESSES.WETH,
    depositFunction: "0x617ba037",
    withdrawFunction: "0x69328dec",
    protocol: Protocol.AAVE_V3
  },
  {
    name: "AAVE_V3_WSTETH",
    poolAddress: "0x87870bca3f3fd6335c3f4ce8392d69350b4fa4e2",
    implAddress: "0x9aeb8aaa1ca38634aa8c0c8933e7fb4d61091327",
    underlyingToken: TOKEN_ADDRESSES.WSTETH,
    depositFunction: "0x617ba037",
    withdrawFunction: "0x69328dec",
    protocol: Protocol.AAVE_V3
  },
  
  // Morpho Blue Pools
  {
    name: "MORPHO_USDC_BBQ",
    poolAddress: "0xBEeFFF209270748ddd194831b3fa287a5386f5bC",
    underlyingToken: TOKEN_ADDRESSES.USDC,
    depositFunction: "0x6e553f65", // deposit function signature
    withdrawFunction: "0xba087652", // redeem function signature
    protocol: Protocol.MORPHO_BLUE
  },
  {
    name: "MORPHO_USDC_GT",
    poolAddress: "0xdd0f28e19C1780eb6396170735D45153D261490d",
    underlyingToken: TOKEN_ADDRESSES.USDC,
    depositFunction: "0x6e553f65",
    withdrawFunction: "0xba087652",
    protocol: Protocol.MORPHO_BLUE
  },
  {
    name: "MORPHO_USDC_GTE",
    poolAddress: "0xc080f56504e0278828A403269DB945F6c6D6E014",
    underlyingToken: TOKEN_ADDRESSES.USDC,
    depositFunction: "0x6e553f65",
    withdrawFunction: "0xba087652",
    protocol: Protocol.MORPHO_BLUE
  },
  {
    name: "MORPHO_USDC_GTCORE",
    poolAddress: "0x8eB67A509616cd6A7c1B3c8C21D48FF57df3d458",
    underlyingToken: TOKEN_ADDRESSES.USDC,
    depositFunction: "0x6e553f65",
    withdrawFunction: "0xba087652",
    protocol: Protocol.MORPHO_BLUE
  },
  {
    name: "MORPHO_USDC_GTF",
    poolAddress: "0xc582F04d8a82795aa2Ff9c8bb4c1c889fe7b754e",
    underlyingToken: TOKEN_ADDRESSES.USDC,
    depositFunction: "0x6e553f65",
    withdrawFunction: "0xba087652",
    protocol: Protocol.MORPHO_BLUE
  },
  {
    name: "MORPHO_USDC_H",
    poolAddress: "0x974c8FBf4fd795F66B85B73ebC988A51F1A040a9",
    underlyingToken: TOKEN_ADDRESSES.USDC,
    depositFunction: "0x6e553f65",
    withdrawFunction: "0xba087652",
    protocol: Protocol.MORPHO_BLUE
  },
  {
    name: "MORPHO_USDC_HYPER",
    poolAddress: "0x777791C4d6DC2CE140D00D2828a7C93503c67777",
    underlyingToken: TOKEN_ADDRESSES.USDC,
    depositFunction: "0x6e553f65",
    withdrawFunction: "0xba087652",
    protocol: Protocol.MORPHO_BLUE
  },
  {
    name: "MORPHO_USDC_RESOLV",
    poolAddress: "0x132E6C9C33A62D7727cd359b1f51e5B566E485Eb",
    underlyingToken: TOKEN_ADDRESSES.USDC,
    depositFunction: "0x6e553f65",
    withdrawFunction: "0xba087652",
    protocol: Protocol.MORPHO_BLUE
  },
  {
    name: "MORPHO_USDC_RE",
    poolAddress: "0x0F359FD18BDa75e9c49bC027E7da59a4b01BF32a",
    underlyingToken: TOKEN_ADDRESSES.USDC,
    depositFunction: "0x6e553f65",
    withdrawFunction: "0xba087652",
    protocol: Protocol.MORPHO_BLUE
  },
  {
    name: "MORPHO_USDC_SBMORPHO",
    poolAddress: "0x4Ff4186188f8406917293A9e01A1ca16d3cf9E59",
    underlyingToken: TOKEN_ADDRESSES.USDC,
    depositFunction: "0x6e553f65",
    withdrawFunction: "0xba087652",
    protocol: Protocol.MORPHO_BLUE
  },
  {
    name: "MORPHO_USDC_STEAK",
    poolAddress: "0xBEEF01735c132Ada46AA9aA4c54623cAA92A64CB",
    underlyingToken: TOKEN_ADDRESSES.USDC,
    depositFunction: "0x6e553f65",
    withdrawFunction: "0xba087652",
    protocol: Protocol.MORPHO_BLUE
  },
  {
    name: "MORPHO_USDC_USUAL",
    poolAddress: "0xd63070114470f685b75B74D60EEc7c1113d33a3D",
    underlyingToken: TOKEN_ADDRESSES.USDC,
    depositFunction: "0x6e553f65",
    withdrawFunction: "0xba087652",
    protocol: Protocol.MORPHO_BLUE
  },
  {
    name: "MORPHO_DAI_GTCORE",
    poolAddress: "0x500331c9fF24D9d11aee6B07734Aa72343EA74a5",
    underlyingToken: TOKEN_ADDRESSES.DAI,
    depositFunction: "0x6e553f65",
    withdrawFunction: "0xba087652",
    protocol: Protocol.MORPHO_BLUE
  },
  {
    name: "MORPHO_DAI_SP",
    poolAddress: "0x73e65dbd630f90604062f6e02fab9138e713edd9",
    underlyingToken: TOKEN_ADDRESSES.DAI,
    depositFunction: "0x6e553f65",
    withdrawFunction: "0xba087652",
    protocol: Protocol.MORPHO_BLUE
  },
  {
    name: "MORPHO_USDT_GT",
    poolAddress: "0x8CB3649114051cA5119141a34C200D65dc0Faa73",
    underlyingToken: TOKEN_ADDRESSES.USDT,
    depositFunction: "0x6e553f65",
    withdrawFunction: "0xba087652",
    protocol: Protocol.MORPHO_BLUE
  },
  {
    name: "MORPHO_USDT_STEAK",
    poolAddress: "0xbEef047a543E45807105E51A8BBEFCc5950fcfBa",
    underlyingToken: TOKEN_ADDRESSES.USDT,
    depositFunction: "0x6e553f65",
    withdrawFunction: "0xba087652",
    protocol: Protocol.MORPHO_BLUE
  },
  {
    name: "MORPHO_WETH_GT",
    poolAddress: "0x4881Ef0BF6d2365D3dd6499ccd7532bcdBCE0658",
    underlyingToken: TOKEN_ADDRESSES.WETH,
    depositFunction: "0x6e553f65",
    withdrawFunction: "0xba087652",
    protocol: Protocol.MORPHO_BLUE
  },
  {
    name: "MORPHO_WETH_MC",
    poolAddress: "0x9a8bC3B04b7f3D87cfC09ba407dCED575f2d61D8",
    underlyingToken: TOKEN_ADDRESSES.WETH,
    depositFunction: "0x6e553f65",
    withdrawFunction: "0xba087652",
    protocol: Protocol.MORPHO_BLUE
  },
  {
    name: "MORPHO_WETH_RE7",
    poolAddress: "0x78Fc2c2eD1A4cDb5402365934aE5648aDAd094d0",
    underlyingToken: TOKEN_ADDRESSES.WETH,
    depositFunction: "0x6e553f65",
    withdrawFunction: "0xba087652",
    protocol: Protocol.MORPHO_BLUE
  },
  {
    name: "MORPHO_ETH_MHY",
    poolAddress: "0x701907283a57FF77E255C3f1aAD790466B8CE4ef",
    underlyingToken: TOKEN_ADDRESSES.WETH, // Using WETH as proxy for ETH
    depositFunction: "0x6e553f65",
    withdrawFunction: "0xba087652",
    protocol: Protocol.MORPHO_BLUE
  },
  {
    name: "MORPHO_ETH_STEAK",
    poolAddress: "0xBEEf050ecd6a16c4e7bfFbB52Ebba7846C4b8cD4",
    underlyingToken: TOKEN_ADDRESSES.WETH, // Using WETH as proxy for ETH
    depositFunction: "0x6e553f65",
    withdrawFunction: "0xba087652",
    protocol: Protocol.MORPHO_BLUE
  },
];

async function main() {
  // Connect to the provider
  const provider = new ethers.providers.JsonRpcProvider(process.env.RPC_URL);
  
  // Load the private key and create a wallet
  const privateKey = process.env.PRIVATE_KEY;
  if (!privateKey) {
    throw new Error("Private key not found in environment variables");
  }
  const wallet = new ethers.Wallet(privateKey, provider);
  
  // Load the Universal Vault contract
  const universalVaultAddress = process.env.UNIVERSAL_VAULT_ADDRESS;
  if (!universalVaultAddress) {
    throw new Error("Universal Vault address not found in environment variables");
  }
  const universalVault = new ethers.Contract(universalVaultAddress, UniversalVaultABI, wallet);
  
  console.log(`Starting to initialize ${pools.length} pools...`);
  
  // Add each pool to the Universal Vault
  for (const pool of pools) {
    try {
      console.log(`Adding pool ${pool.name}...`);
      const tx = await universalVault.addPool(
        pool.name,
        pool.poolAddress,
        pool.underlyingToken,
        pool.depositFunction,
        pool.withdrawFunction,
        pool.protocol
      );
      
      console.log(`Transaction sent: ${tx.hash}`);
      await tx.wait();
      console.log(`Pool ${pool.name} added successfully!`);
    } catch (error) {
      console.error(`Error adding pool ${pool.name}:`, error);
    }
  }
  
  console.log("Pool initialization completed!");
}

// Run the main function and catch any errors
main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("Error in main function:", error);
    process.exit(1);
  });