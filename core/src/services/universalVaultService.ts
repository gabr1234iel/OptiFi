import { ethers } from 'ethers';
import { getProvider } from './web3';

// Replace the simplified ABI with the imported one
// const UniversalVaultABI = [...] <- Remove/comment this line

// Import ABIs
// You can generate ABIs after contract compilation or paste them directly here
const UniversalVaultABI = [
    {
      "type": "constructor",
      "inputs": [
        {
          "name": "_swapRouter",
          "type": "address",
          "internalType": "address"
        },
        {
          "name": "_aaveVaultV2",
          "type": "address",
          "internalType": "address"
        },
        {
          "name": "_aaveVaultV3",
          "type": "address",
          "internalType": "address"
        },
        {
          "name": "_morphoBlue",
          "type": "address",
          "internalType": "address"
        }
      ],
      "stateMutability": "nonpayable"
    },
    {
      "type": "function",
      "name": "aaveVaultV2",
      "inputs": [],
      "outputs": [
        {
          "name": "",
          "type": "address",
          "internalType": "contract AaveVault"
        }
      ],
      "stateMutability": "view"
    },
    {
      "type": "function",
      "name": "aaveVaultV3",
      "inputs": [],
      "outputs": [
        {
          "name": "",
          "type": "address",
          "internalType": "contract AaveVault"
        }
      ],
      "stateMutability": "view"
    },
    {
      "type": "function",
      "name": "addAavePool",
      "inputs": [
        {
          "name": "name",
          "type": "string",
          "internalType": "string"
        },
        {
          "name": "poolAddress",
          "type": "address",
          "internalType": "address"
        },
        {
          "name": "underlyingToken",
          "type": "address",
          "internalType": "address"
        },
        {
          "name": "depositFunctionSig",
          "type": "bytes4",
          "internalType": "bytes4"
        },
        {
          "name": "withdrawFunctionSig",
          "type": "bytes4",
          "internalType": "bytes4"
        },
        {
          "name": "protocol",
          "type": "uint8",
          "internalType": "enum UniversalVault.Protocol"
        }
      ],
      "outputs": [],
      "stateMutability": "nonpayable"
    },
    {
      "type": "function",
      "name": "addMorphoBluePool",
      "inputs": [
        {
          "name": "name",
          "type": "string",
          "internalType": "string"
        },
        {
          "name": "morphoMarketParams",
          "type": "tuple",
          "internalType": "struct IMorphoBlue.MarketParams",
          "components": [
            {
              "name": "loanToken",
              "type": "address",
              "internalType": "address"
            },
            {
              "name": "collateralToken",
              "type": "address",
              "internalType": "address"
            },
            {
              "name": "oracle",
              "type": "address",
              "internalType": "address"
            },
            {
              "name": "irm",
              "type": "address",
              "internalType": "address"
            },
            {
              "name": "lltv",
              "type": "uint256",
              "internalType": "uint256"
            }
          ]
        },
        {
          "name": "underlyingToken",
          "type": "address",
          "internalType": "address"
        }
      ],
      "outputs": [],
      "stateMutability": "nonpayable"
    },
    {
      "type": "function",
      "name": "depositToAave",
      "inputs": [
        {
          "name": "token",
          "type": "address",
          "internalType": "address"
        },
        {
          "name": "amount",
          "type": "uint256",
          "internalType": "uint256"
        },
        {
          "name": "aaveVersion",
          "type": "uint8",
          "internalType": "uint8"
        }
      ],
      "outputs": [],
      "stateMutability": "nonpayable"
    },
    {
      "type": "function",
      "name": "depositToMorphoBlue",
      "inputs": [
        {
          "name": "poolName",
          "type": "string",
          "internalType": "string"
        },
        {
          "name": "amount",
          "type": "uint256",
          "internalType": "uint256"
        }
      ],
      "outputs": [],
      "stateMutability": "nonpayable"
    },
    {
      "type": "function",
      "name": "depositToPool",
      "inputs": [
        {
          "name": "poolName",
          "type": "string",
          "internalType": "string"
        },
        {
          "name": "amount",
          "type": "uint256",
          "internalType": "uint256"
        }
      ],
      "outputs": [],
      "stateMutability": "nonpayable"
    },
    {
      "type": "function",
      "name": "getAllPoolNames",
      "inputs": [],
      "outputs": [
        {
          "name": "",
          "type": "string[]",
          "internalType": "string[]"
        }
      ],
      "stateMutability": "view"
    },
    {
      "type": "function",
      "name": "getMorphoMarketParams",
      "inputs": [
        {
          "name": "poolName",
          "type": "string",
          "internalType": "string"
        }
      ],
      "outputs": [
        {
          "name": "",
          "type": "tuple",
          "internalType": "struct IMorphoBlue.MarketParams",
          "components": [
            {
              "name": "loanToken",
              "type": "address",
              "internalType": "address"
            },
            {
              "name": "collateralToken",
              "type": "address",
              "internalType": "address"
            },
            {
              "name": "oracle",
              "type": "address",
              "internalType": "address"
            },
            {
              "name": "irm",
              "type": "address",
              "internalType": "address"
            },
            {
              "name": "lltv",
              "type": "uint256",
              "internalType": "uint256"
            }
          ]
        }
      ],
      "stateMutability": "view"
    },
    {
      "type": "function",
      "name": "morphoBlue",
      "inputs": [],
      "outputs": [
        {
          "name": "",
          "type": "address",
          "internalType": "address"
        }
      ],
      "stateMutability": "view"
    },
    {
      "type": "function",
      "name": "owner",
      "inputs": [],
      "outputs": [
        {
          "name": "",
          "type": "address",
          "internalType": "address"
        }
      ],
      "stateMutability": "view"
    },
    {
      "type": "function",
      "name": "poolNames",
      "inputs": [
        {
          "name": "",
          "type": "uint256",
          "internalType": "uint256"
        }
      ],
      "outputs": [
        {
          "name": "",
          "type": "string",
          "internalType": "string"
        }
      ],
      "stateMutability": "view"
    },
    {
      "type": "function",
      "name": "pools",
      "inputs": [
        {
          "name": "",
          "type": "string",
          "internalType": "string"
        }
      ],
      "outputs": [
        {
          "name": "poolAddress",
          "type": "address",
          "internalType": "address"
        },
        {
          "name": "underlyingToken",
          "type": "address",
          "internalType": "address"
        },
        {
          "name": "depositFunction",
          "type": "bytes4",
          "internalType": "bytes4"
        },
        {
          "name": "withdrawFunction",
          "type": "bytes4",
          "internalType": "bytes4"
        },
        {
          "name": "protocol",
          "type": "uint8",
          "internalType": "enum UniversalVault.Protocol"
        },
        {
          "name": "loanToken",
          "type": "address",
          "internalType": "address"
        },
        {
          "name": "collateralToken",
          "type": "address",
          "internalType": "address"
        },
        {
          "name": "oracle",
          "type": "address",
          "internalType": "address"
        },
        {
          "name": "irm",
          "type": "address",
          "internalType": "address"
        },
        {
          "name": "lltv",
          "type": "uint256",
          "internalType": "uint256"
        }
      ],
      "stateMutability": "view"
    },
    {
      "type": "function",
      "name": "renounceOwnership",
      "inputs": [],
      "outputs": [],
      "stateMutability": "nonpayable"
    },
    {
      "type": "function",
      "name": "swapAndDeposit",
      "inputs": [
        {
          "name": "fromToken",
          "type": "address",
          "internalType": "address"
        },
        {
          "name": "poolName",
          "type": "string",
          "internalType": "string"
        },
        {
          "name": "amountIn",
          "type": "uint256",
          "internalType": "uint256"
        },
        {
          "name": "minAmountOut",
          "type": "uint256",
          "internalType": "uint256"
        },
        {
          "name": "deadline",
          "type": "uint256",
          "internalType": "uint256"
        }
      ],
      "outputs": [],
      "stateMutability": "nonpayable"
    },
    {
      "type": "function",
      "name": "swapMultihopAndDeposit",
      "inputs": [
        {
          "name": "path",
          "type": "bytes",
          "internalType": "bytes"
        },
        {
          "name": "poolName",
          "type": "string",
          "internalType": "string"
        },
        {
          "name": "amountIn",
          "type": "uint256",
          "internalType": "uint256"
        },
        {
          "name": "minAmountOut",
          "type": "uint256",
          "internalType": "uint256"
        },
        {
          "name": "deadline",
          "type": "uint256",
          "internalType": "uint256"
        }
      ],
      "outputs": [],
      "stateMutability": "nonpayable"
    },
    {
      "type": "function",
      "name": "swapRouter",
      "inputs": [],
      "outputs": [
        {
          "name": "",
          "type": "address",
          "internalType": "address"
        }
      ],
      "stateMutability": "view"
    },
    {
      "type": "function",
      "name": "swapTokens",
      "inputs": [
        {
          "name": "fromToken",
          "type": "address",
          "internalType": "address"
        },
        {
          "name": "toToken",
          "type": "address",
          "internalType": "address"
        },
        {
          "name": "amountIn",
          "type": "uint256",
          "internalType": "uint256"
        },
        {
          "name": "minAmountOut",
          "type": "uint256",
          "internalType": "uint256"
        },
        {
          "name": "deadline",
          "type": "uint256",
          "internalType": "uint256"
        }
      ],
      "outputs": [
        {
          "name": "amountOut",
          "type": "uint256",
          "internalType": "uint256"
        }
      ],
      "stateMutability": "nonpayable"
    },
    {
      "type": "function",
      "name": "swapTokensMultihop",
      "inputs": [
        {
          "name": "path",
          "type": "bytes",
          "internalType": "bytes"
        },
        {
          "name": "amountIn",
          "type": "uint256",
          "internalType": "uint256"
        },
        {
          "name": "minAmountOut",
          "type": "uint256",
          "internalType": "uint256"
        },
        {
          "name": "deadline",
          "type": "uint256",
          "internalType": "uint256"
        }
      ],
      "outputs": [
        {
          "name": "amountOut",
          "type": "uint256",
          "internalType": "uint256"
        }
      ],
      "stateMutability": "nonpayable"
    },
    {
      "type": "function",
      "name": "transferOwnership",
      "inputs": [
        {
          "name": "newOwner",
          "type": "address",
          "internalType": "address"
        }
      ],
      "outputs": [],
      "stateMutability": "nonpayable"
    },
    {
      "type": "function",
      "name": "withdrawFromAave",
      "inputs": [
        {
          "name": "token",
          "type": "address",
          "internalType": "address"
        },
        {
          "name": "amount",
          "type": "uint256",
          "internalType": "uint256"
        },
        {
          "name": "aaveVersion",
          "type": "uint8",
          "internalType": "uint8"
        }
      ],
      "outputs": [],
      "stateMutability": "nonpayable"
    },
    {
      "type": "function",
      "name": "withdrawFromMorphoBlue",
      "inputs": [
        {
          "name": "poolName",
          "type": "string",
          "internalType": "string"
        },
        {
          "name": "amount",
          "type": "uint256",
          "internalType": "uint256"
        }
      ],
      "outputs": [],
      "stateMutability": "nonpayable"
    },
    {
      "type": "function",
      "name": "withdrawFromPool",
      "inputs": [
        {
          "name": "poolName",
          "type": "string",
          "internalType": "string"
        },
        {
          "name": "amount",
          "type": "uint256",
          "internalType": "uint256"
        }
      ],
      "outputs": [],
      "stateMutability": "nonpayable"
    },
    {
      "type": "event",
      "name": "DebugInfo",
      "inputs": [
        {
          "name": "poolName",
          "type": "string",
          "indexed": false,
          "internalType": "string"
        },
        {
          "name": "poolAddress",
          "type": "address",
          "indexed": false,
          "internalType": "address"
        },
        {
          "name": "token",
          "type": "address",
          "indexed": false,
          "internalType": "address"
        },
        {
          "name": "amount",
          "type": "uint256",
          "indexed": false,
          "internalType": "uint256"
        }
      ],
      "anonymous": false
    },
    {
      "type": "event",
      "name": "Deposited",
      "inputs": [
        {
          "name": "poolName",
          "type": "string",
          "indexed": false,
          "internalType": "string"
        },
        {
          "name": "token",
          "type": "address",
          "indexed": false,
          "internalType": "address"
        },
        {
          "name": "amount",
          "type": "uint256",
          "indexed": false,
          "internalType": "uint256"
        },
        {
          "name": "user",
          "type": "address",
          "indexed": false,
          "internalType": "address"
        }
      ],
      "anonymous": false
    },
    {
      "type": "event",
      "name": "OwnershipTransferred",
      "inputs": [
        {
          "name": "previousOwner",
          "type": "address",
          "indexed": true,
          "internalType": "address"
        },
        {
          "name": "newOwner",
          "type": "address",
          "indexed": true,
          "internalType": "address"
        }
      ],
      "anonymous": false
    },
    {
      "type": "event",
      "name": "PoolAdded",
      "inputs": [
        {
          "name": "name",
          "type": "string",
          "indexed": false,
          "internalType": "string"
        },
        {
          "name": "poolAddress",
          "type": "address",
          "indexed": false,
          "internalType": "address"
        },
        {
          "name": "underlyingToken",
          "type": "address",
          "indexed": false,
          "internalType": "address"
        },
        {
          "name": "protocol",
          "type": "uint8",
          "indexed": false,
          "internalType": "enum UniversalVault.Protocol"
        }
      ],
      "anonymous": false
    },
    {
      "type": "event",
      "name": "TokenSwapped",
      "inputs": [
        {
          "name": "fromToken",
          "type": "address",
          "indexed": false,
          "internalType": "address"
        },
        {
          "name": "toToken",
          "type": "address",
          "indexed": false,
          "internalType": "address"
        },
        {
          "name": "amountIn",
          "type": "uint256",
          "indexed": false,
          "internalType": "uint256"
        },
        {
          "name": "amountOut",
          "type": "uint256",
          "indexed": false,
          "internalType": "uint256"
        }
      ],
      "anonymous": false
    },
    {
      "type": "event",
      "name": "Withdrawn",
      "inputs": [
        {
          "name": "poolName",
          "type": "string",
          "indexed": false,
          "internalType": "string"
        },
        {
          "name": "token",
          "type": "address",
          "indexed": false,
          "internalType": "address"
        },
        {
          "name": "amount",
          "type": "uint256",
          "indexed": false,
          "internalType": "uint256"
        },
        {
          "name": "user",
          "type": "address",
          "indexed": false,
          "internalType": "address"
        }
      ],
      "anonymous": false
    },
    {
      "type": "error",
      "name": "OwnableInvalidOwner",
      "inputs": [
        {
          "name": "owner",
          "type": "address",
          "internalType": "address"
        }
      ]
    },
    {
      "type": "error",
      "name": "OwnableUnauthorizedAccount",
      "inputs": [
        {
          "name": "account",
          "type": "address",
          "internalType": "address"
        }
      ]
    },
    {
      "type": "error",
      "name": "SafeERC20FailedOperation",
      "inputs": [
        {
          "name": "token",
          "type": "address",
          "internalType": "address"
        }
      ]
    }
  ]
  
  

// ERC20 Token ABI - minimal for approvals
const ERC20ABI = [
  "function approve(address spender, uint256 amount) returns (bool)",
  "function allowance(address owner, address spender) view returns (uint256)",
  "function balanceOf(address account) view returns (uint256)",
  "function decimals() view returns (uint8)"
];

// Universal Vault Contract address - replace with your deployed address
const UNIVERSAL_VAULT_ADDRESS = "0xEd3AAE51d33138ef67555AE0925A38E77Df5B7e0"; // Example

// Token addresses
const TOKEN_ADDRESSES = {
  // Stablecoins
  USDC: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48',
  USDT: '0xdAC17F958D2ee523a2206206994597C13D831ec7',
  DAI: '0x6B175474E89094C44Da98b954EedeAC495271d0F',
  PYUSD: '0x6c3ea9036406852006290770bedfcaba0e23a0e8',
  USDE: '0x4c9edd5852cd905f086c759e8383e09bff1e68b3',
  USDS: '0xdc035d45d973e3ec169d2276ddab16f1e407384f',
  
  // Ethereum derivatives
  WETH: '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2',
  CBETH: '0xBe9895146f7AF43049ca1c1AE358B0541Ea49704',
  STETH: '0xae7ab96520de3a18e5e111b5eaab095312d7fe84',
  WSTETH: '0x7f39c581f595b53c5cb19bd0b3f8da6c935e2ca0',
  RETH: '0xae78736Cd615f374D3085123A210448E74Fc6393',
  WEETH: '0xcd5fe23c85820f7b72d0926fc9b05b43e359b7ee',
  ETHX: '0xA35b1B31Ce002FBF2058D22F30f95D405200A15b',
  
  // Bitcoin derivatives
  WBTC: '0x2260fac5e5542a773aa44fbcfedf7c193bc2c599'
};

// Create vault contract instance
export const getUniversalVaultContract = () => {
  const provider = getProvider();
  if (!provider) return null;
  
  const signer = provider.getSigner();
  return new ethers.Contract(UNIVERSAL_VAULT_ADDRESS, UniversalVaultABI, signer);
};

// Format amounts with proper decimals
const formatAmount = async (token: string, amount: string): Promise<ethers.BigNumber> => {
  const provider = getProvider();
  if (!provider) throw new Error('Provider not available');
  
  const tokenAddress = TOKEN_ADDRESSES[token as keyof typeof TOKEN_ADDRESSES];
  if (!tokenAddress) throw new Error('Unsupported token');
  
  const tokenContract = new ethers.Contract(tokenAddress, ERC20ABI, provider);
  const decimals = await tokenContract.decimals();
  
  return ethers.utils.parseUnits(amount, decimals);
};

// Approve token spending
const approveToken = async (token: string, amount: string, spender: string): Promise<string> => {
  const provider = getProvider();
  if (!provider) throw new Error('Provider not available');
  
  const tokenAddress = TOKEN_ADDRESSES[token as keyof typeof TOKEN_ADDRESSES];
  if (!tokenAddress) throw new Error('Unsupported token');
  
  const signer = provider.getSigner();
  const tokenContract = new ethers.Contract(tokenAddress, ERC20ABI, signer);
  
  const parsedAmount = await formatAmount(token, amount);
  
  const tx = await tokenContract.approve(spender, parsedAmount);
  await tx.wait();
  
  return tx.hash;
};

// Get available pools
export const getAvailablePools = async (): Promise<string[]> => {
  const vaultContract = getUniversalVaultContract();
  if (!vaultContract) throw new Error('Vault contract not available');
  
  return await vaultContract.getAllPoolNames();
};

// Get pool details
export const getPoolDetails = async (poolName: string) => {
  const vaultContract = getUniversalVaultContract();
  if (!vaultContract) throw new Error('Vault contract not available');
  
  const poolInfo = await vaultContract.pools(poolName);
  return {
    poolAddress: poolInfo.poolAddress,
    underlyingToken: poolInfo.underlyingToken,
    protocol: ['AAVE_V2', 'AAVE_V3', 'MORPHO_BLUE'][poolInfo.protocol] // Convert number to string name
  };
};

// Swap tokens
export const swapTokens = async (
  fromToken: string,
  toToken: string,
  amount: string,
  slippagePercent: number = 0.5 // Default 0.5% slippage
): Promise<string> => {
  const vaultContract = getUniversalVaultContract();
  if (!vaultContract) throw new Error('Vault contract not available');
  
  const fromTokenAddress = TOKEN_ADDRESSES[fromToken as keyof typeof TOKEN_ADDRESSES];
  const toTokenAddress = TOKEN_ADDRESSES[toToken as keyof typeof TOKEN_ADDRESSES];
  
  if (!fromTokenAddress) throw new Error('Unsupported source token');
  if (!toTokenAddress) throw new Error('Unsupported destination token');
  
  // Format amount with correct decimals
  const parsedAmount = await formatAmount(fromToken, amount);
  
  // Calculate minimum output amount based on slippage
  // Note: In a real implementation, you would get the expected output from a price oracle or quote
  const minAmountOut = parsedAmount.mul(100 - Math.floor(slippagePercent * 100)).div(100);
  
  // Set deadline to 20 minutes from now
  const deadline = Math.floor(Date.now() / 1000) + 1200;
  
  // Approve the vault to spend tokens
  await approveToken(fromToken, amount, UNIVERSAL_VAULT_ADDRESS);
  
  // Execute the swap
  const tx = await vaultContract.swapTokens(
    fromTokenAddress,
    toTokenAddress,
    parsedAmount,
    minAmountOut,
    deadline
  );
  
  await tx.wait();
  return tx.hash;
};

// Swap tokens with multi-hop
export const swapTokensMultihop = async (
  path: string[], // Array of token symbols in order of the path
  fees: number[], // Array of pool fees (e.g., [3000, 500] for 0.3%, 0.05%)
  amount: string,
  slippagePercent: number = 0.5
): Promise<string> => {
  const vaultContract = getUniversalVaultContract();
  if (!vaultContract) throw new Error('Vault contract not available');
  
  if (path.length < 2) throw new Error('Path must contain at least 2 tokens');
  if (fees.length !== path.length - 1) throw new Error('Number of fees must be one less than number of tokens');
  
  // Get token addresses
  const tokenAddresses = path.map(symbol => {
    const address = TOKEN_ADDRESSES[symbol as keyof typeof TOKEN_ADDRESSES];
    if (!address) throw new Error(`Unsupported token: ${symbol}`);
    return address;
  });
  
  // Format amount with correct decimals
  const parsedAmount = await formatAmount(path[0], amount);
  
  // Calculate minimum output amount based on slippage
  const minAmountOut = parsedAmount.mul(100 - Math.floor(slippagePercent * 100)).div(100);
  
  // Set deadline to 20 minutes from now
  const deadline = Math.floor(Date.now() / 1000) + 1200;
  
  // Encode the path
  let encodedPath = '0x';
  for (let i = 0; i < tokenAddresses.length - 1; i++) {
    encodedPath += tokenAddresses[i].slice(2); // Remove '0x' prefix except for the first element
    encodedPath += fees[i].toString(16).padStart(6, '0'); // Encode fee as 3 bytes
  }
  encodedPath += tokenAddresses[tokenAddresses.length - 1].slice(2);
  
  // Approve the vault to spend tokens
  await approveToken(path[0], amount, UNIVERSAL_VAULT_ADDRESS);
  
  // Execute the multi-hop swap
  const tx = await vaultContract.swapTokensMultihop(
    encodedPath,
    parsedAmount,
    minAmountOut,
    deadline
  );
  
  await tx.wait();
  return tx.hash;
};

// Deposit to Aave
export const depositToAave = async (token: string, amount: string): Promise<string> => {
  const vaultContract = getUniversalVaultContract();
  if (!vaultContract) throw new Error('Vault contract not available');
  
  const tokenAddress = TOKEN_ADDRESSES[token as keyof typeof TOKEN_ADDRESSES];
  if (!tokenAddress) throw new Error('Unsupported token');
  
  // Format amount with correct decimals
  const parsedAmount = await formatAmount(token, amount);
  
  // Approve the vault to spend tokens
  await approveToken(token, amount, UNIVERSAL_VAULT_ADDRESS);
  
  // Execute the deposit
  const tx = await vaultContract.depositToAave(tokenAddress, parsedAmount);
  
  await tx.wait();
  return tx.hash;
};

// Withdraw from Aave
export const withdrawFromAave = async (token: string, amount: string): Promise<string> => {
  const vaultContract = getUniversalVaultContract();
  if (!vaultContract) throw new Error('Vault contract not available');
  
  const tokenAddress = TOKEN_ADDRESSES[token as keyof typeof TOKEN_ADDRESSES];
  if (!tokenAddress) throw new Error('Unsupported token');
  
  // Format amount with correct decimals
  const parsedAmount = await formatAmount(token, amount);
  
  // Execute the withdrawal
  const tx = await vaultContract.withdrawFromAave(tokenAddress, parsedAmount);
  
  await tx.wait();
  return tx.hash;
};

// Deposit to Morpho Blue
export const depositToMorphoBlue = async (poolName: string, amount: string): Promise<string> => {
  const vaultContract = getUniversalVaultContract();
  if (!vaultContract) throw new Error('Vault contract not available');
  
  // Get pool details to find the underlying token
  const poolInfo = await getPoolDetails(poolName);
  
  // Find the token symbol by address
  let tokenSymbol = '';
  for (const [symbol, address] of Object.entries(TOKEN_ADDRESSES)) {
    if (address.toLowerCase() === poolInfo.underlyingToken.toLowerCase()) {
      tokenSymbol = symbol;
      break;
    }
  }
  
  if (!tokenSymbol) throw new Error('Unsupported token for this pool');
  
  // Format amount with correct decimals
  const parsedAmount = await formatAmount(tokenSymbol, amount);
  
  // Approve the vault to spend tokens
  await approveToken(tokenSymbol, amount, UNIVERSAL_VAULT_ADDRESS);
  
  // Execute the deposit
  const tx = await vaultContract.depositToMorphoBlue(poolName, parsedAmount);
  
  await tx.wait();
  return tx.hash;
};

// Withdraw from Morpho Blue
export const withdrawFromMorphoBlue = async (poolName: string, amount: string): Promise<string> => {
  const vaultContract = getUniversalVaultContract();
  if (!vaultContract) throw new Error('Vault contract not available');
  
  // Get pool details to find the underlying token
  const poolInfo = await getPoolDetails(poolName);
  
  // Find the token symbol by address
  let tokenSymbol = '';
  for (const [symbol, address] of Object.entries(TOKEN_ADDRESSES)) {
    if (address.toLowerCase() === poolInfo.underlyingToken.toLowerCase()) {
      tokenSymbol = symbol;
      break;
    }
  }
  
  if (!tokenSymbol) throw new Error('Unsupported token for this pool');
  
  // Format amount with correct decimals
  const parsedAmount = await formatAmount(tokenSymbol, amount);
  
  // Execute the withdrawal
  const tx = await vaultContract.withdrawFromMorphoBlue(poolName, parsedAmount);
  
  await tx.wait();
  return tx.hash;
};

// Swap tokens and deposit into a pool in one transaction
export const swapAndDeposit = async (
  fromToken: string,
  poolName: string,
  amount: string,
  slippagePercent: number = 0.5
): Promise<string> => {
  const vaultContract = getUniversalVaultContract();
  if (!vaultContract) throw new Error('Vault contract not available');
  
  const fromTokenAddress = TOKEN_ADDRESSES[fromToken as keyof typeof TOKEN_ADDRESSES];
  if (!fromTokenAddress) throw new Error('Unsupported source token');
  
  // Format amount with correct decimals
  const parsedAmount = await formatAmount(fromToken, amount);
  
  // Calculate minimum output amount based on slippage
  const minAmountOut = parsedAmount.mul(100 - Math.floor(slippagePercent * 100)).div(100);
  
  // Set deadline to 20 minutes from now
  const deadline = Math.floor(Date.now() / 1000) + 1200;
  
  // Approve the vault to spend tokens
  await approveToken(fromToken, amount, UNIVERSAL_VAULT_ADDRESS);
  
  // Execute the swap and deposit
  const tx = await vaultContract.swapAndDeposit(
    fromTokenAddress,
    poolName,
    parsedAmount,
    minAmountOut,
    deadline
  );
  
  await tx.wait();
  return tx.hash;
};

// Swap tokens with multi-hop and deposit into a pool in one transaction
export const swapMultihopAndDeposit = async (
  path: string[], // Array of token symbols in order of the path
  fees: number[], // Array of pool fees (e.g., [3000, 500] for 0.3%, 0.05%)
  poolName: string,
  amount: string,
  slippagePercent: number = 0.5
): Promise<string> => {
  const vaultContract = getUniversalVaultContract();
  if (!vaultContract) throw new Error('Vault contract not available');
  
  if (path.length < 2) throw new Error('Path must contain at least 2 tokens');
  if (fees.length !== path.length - 1) throw new Error('Number of fees must be one less than number of tokens');
  
  // Get token addresses
  const tokenAddresses = path.map(symbol => {
    const address = TOKEN_ADDRESSES[symbol as keyof typeof TOKEN_ADDRESSES];
    if (!address) throw new Error(`Unsupported token: ${symbol}`);
    return address;
  });
  
  // Format amount with correct decimals
  const parsedAmount = await formatAmount(path[0], amount);
  
  // Calculate minimum output amount based on slippage
  const minAmountOut = parsedAmount.mul(100 - Math.floor(slippagePercent * 100)).div(100);
  
  // Set deadline to 20 minutes from now
  const deadline = Math.floor(Date.now() / 1000) + 1200;
  
  // Encode the path
  let encodedPath = '0x';
  for (let i = 0; i < tokenAddresses.length - 1; i++) {
    encodedPath += tokenAddresses[i].slice(2); // Remove '0x' prefix except for the first element
    encodedPath += fees[i].toString(16).padStart(6, '0'); // Encode fee as 3 bytes
  }
  encodedPath += tokenAddresses[tokenAddresses.length - 1].slice(2);
  
  // Approve the vault to spend tokens
  await approveToken(path[0], amount, UNIVERSAL_VAULT_ADDRESS);
  
  // Execute the multi-hop swap and deposit
  const tx = await vaultContract.swapMultihopAndDeposit(
    encodedPath,
    poolName,
    parsedAmount,
    minAmountOut,
    deadline
  );
  
  await tx.wait();
  return tx.hash;
};