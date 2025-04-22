// src/services/universalVaultService.ts
import { ethers } from 'ethers';
import { getProvider } from './web3';
import UniversalVaultABI from '../constants/UniversalVaultABI.json';

// Universal Vault Contract address - replace with your deployed address
const UNIVERSAL_VAULT_ADDRESS = "0xfC3983DE3F7cBe1Ba01084469779470AD0BbeFfa";


// address constant USDC = 0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48;
// address constant USDT = 0xdAC17F958D2ee523a2206206994597C13D831ec7;
// address constant WBTC = 0x2260FAC5E5542a773Aa44fBCfeDf7C193bc2C599;
// address constant DAI = 0x6B175474E89094C44Da98b954EedeAC495271d0F;
// address constant WETH = 0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2;
// address constant WSTETH = 0x7f39C581F595B53c5cb19bD0b3f8dA6c935E2Ca0;
// address constant CBETH = 0xBe9895146f7AF43049ca1c1AE358B0541Ea49704;
// address constant ETHX = 0xA35b1B31Ce002FBF2058D22F30f95D405200A15b;
// address constant PYUSD = 0x6c3ea9036406852006290770BEdFcAbA0e23A0e8;
// address constant RETH = 0xae78736Cd615f374D3085123A210448E74Fc6393;
// address constant USDE = 0x4c9EDD5852cd905f086C759E8383e09bff1E68B3;
// address constant USDS = 0x45AC379F019E48ca5dAC02E54F406F99F5088099;
// address constant WEETH = 0xCd5fE23C85820F7B72D0926FC9b05b43E359b7ee;
// address constant RSETH = 0xA1290d69c65A6Fe4DF752f95823fae25cB99e5A7;
// address constant USD0 = 0x35D8949372D46B7a3D5A56006AE77B215fc69bC0;
// address constant USDL = 0x7751E2F4b8ae93EF6B79d86419d42FE3295A4559;
// address constant RUSD = 0x09D4214C03D01F49544C0448DBE3A27f768F2b34;
// address constant EUSD = 0xA0d69E286B938e21CBf7E51D71F6A4c8918f482F;

// Token addresses
const TOKEN_ADDRESSES = {
  // Stablecoins
  USDC: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48',
  USDT: '0xdAC17F958D2ee523a2206206994597C13D831ec7',
  DAI: '0x6B175474E89094C44Da98b954EedeAC495271d0F',
  PYUSD: '0x6c3ea9036406852006290770bedfcaba0e23a0e8',
  USDE: '0x4c9EDD5852cd905f086C759E8383e09bff1E68B3',
  USDS: '0x45AC379F019E48ca5dAC02E54F406F99F5088099',
  USD0: '0x35D8949372D46B7a3D5A56006AE77B215fc69bC0',
  USDL: '0x7751E2F4b8ae93EF6B79d86419d42FE3295A4559',
  RUSD: '0x09D4214C03D01F49544C0448DBE3A27f768F2b34',
  EUSD: '0xA0d69E286B938e21CBf7E51D71F6A4c8918f482F',
  
  // Ethereum derivatives
  WETH: '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2',
  CBETH: '0xBe9895146f7AF43049ca1c1AE358B0541Ea49704',
  STETH: '0xae7ab96520de3a18e5e111b5eaab095312d7fe84',
  WSTETH: '0x7f39c581f595b53c5cb19bd0b3f8da6c935e2ca0',
  WEETH: '0xCd5fE23C85820F7B72D0926FC9b05b43E359b7ee',
  ETHX: '0xA35b1B31Ce002FBF2058D22F30f95D405200A15b',
  RSETH: '0xA1290d69c65A6Fe4DF752f95823fae25cB99e5A7',
  RETH: '0xae78736Cd615f374D3085123A210448E74Fc6393',

  
  // Bitcoin derivatives
  WBTC: '0x2260fac5e5542a773aa44fbcfedf7c193bc2c599'
};

// ERC20 Token ABI - minimal for approvals
const ERC20ABI = [
  "function approve(address spender, uint256 amount) returns (bool)",
  "function allowance(address owner, address spender) view returns (uint256)",
  "function balanceOf(address account) view returns (uint256)",
  "function decimals() view returns (uint8)"
];

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
  
  try {
    return await vaultContract.getAllPoolNames();
  } catch (error) {
    console.error('Error fetching pools:', error);
    
    // Mock data for testing
    return [
      'STEAKUSDC',
      'REUSDC',
      'BBQUSDC',
      'SFRXUSD',
      'USUALUSDC+',
      'STEAKETH',
      'EUSDCHIGHYIELD',
      'SMWETH',
      'WETHV2',
      'USDC',
      'DAI'
    ];
  }
};

// Get pool details
export const getPoolDetails = async (poolName: string) => {
  const vaultContract = getUniversalVaultContract();
  if (!vaultContract) throw new Error('Vault contract not available');
  
  try {
    const poolInfo = await vaultContract.pools(poolName);
    return {
      poolAddress: poolInfo.poolAddress,
      underlyingToken: poolInfo.underlyingToken,
      protocol: poolInfo.protocol, // Protocol enum (0=AAVE_V2, 1=AAVE_V3, etc.)
      loanToken: poolInfo.loanToken, // For Morpho Blue
      collateralToken: poolInfo.collateralToken, // For Morpho Blue
      // Mock APY data
      apy: Math.floor(Math.random() * 1000) + 100 // Random APY between 1% and 11%
    };
  } catch (error) {
    console.error('Error fetching pool details:', error);
    
    // Mock data for testing
    const protocols: Record<string, number> = {
      'STEAKUSDC': 2, // Morpho Blue
      'REUSDC': 2, // Morpho Blue
      'BBQUSDC': 2, // Morpho Blue
      'SFRXUSD': 2, // Morpho Blue
      'USUALUSDC+': 2, // Morpho Blue
      'STEAKETH': 2, // Morpho Blue
      'EUSDCHIGHYIELD': 2, // Morpho Blue
      'SMWETH': 2, // Morpho Blue
      'WETHV2': 1, // Aave V3
      'USDC': 0, // Aave V2
      'DAI': 3 // Compound V2
    };
    
    const underlyingTokens: Record<string, string> = {
      'STEAKUSDC': TOKEN_ADDRESSES.USDC,
      'REUSDC': TOKEN_ADDRESSES.USDC,
      'BBQUSDC': TOKEN_ADDRESSES.USDC,
      'SFRXUSD': TOKEN_ADDRESSES.USDC,
      'USUALUSDC+': TOKEN_ADDRESSES.USDC,
      'STEAKETH': TOKEN_ADDRESSES.WETH,
      'EUSDCHIGHYIELD': TOKEN_ADDRESSES.USDC,
      'SMWETH': TOKEN_ADDRESSES.WETH,
      'WETHV2': TOKEN_ADDRESSES.WETH,
      'USDC': TOKEN_ADDRESSES.USDC,
      'DAI': TOKEN_ADDRESSES.DAI
    };
    
    return {
      poolAddress: '0x' + '1'.repeat(40), // Dummy address
      underlyingToken: underlyingTokens[poolName] || TOKEN_ADDRESSES.USDC,
      protocol: protocols[poolName] || 0,
      apy: Math.floor(Math.random() * 1000) + 100 // Random APY between 1% and 11%
    };
  }
};

// Get APY comparison across protocols for a token
export const getProtocolAPYs = async () => {
  // In a real implementation, this would query your vault contract
  // or directly query the protocols
  
  // Mock data for testing
  return {
    // USDC APYs across protocols
    'USDC': {
      'AAVE_V2': 3.42,
      'AAVE_V3': 3.68,
      'MORPHO_BLUE': 4.21,
      'COMPOUND_V2': 3.51,
      'COMPOUND_V3': 3.89,
      'EULER_V2': 3.76,
      'FLUID': 3.95
    },
    // WETH APYs across protocols
    'WETH': {
      'AAVE_V2': 2.56,
      'AAVE_V3': 2.78,
      'MORPHO_BLUE': 3.15,
      'COMPOUND_V2': 2.63,
      'COMPOUND_V3': 2.92,
      'EULER_V2': 2.82,
      'FLUID': 2.97
    },
    // DAI APYs across protocols
    'DAI': {
      'AAVE_V2': 3.31,
      'AAVE_V3': 3.57,
      'MORPHO_BLUE': 4.11,
      'COMPOUND_V2': 3.42,
      'COMPOUND_V3': 3.78,
      'EULER_V2': 3.65,
      'FLUID': 3.85
    }
  };
};

// Get user balances across protocols
export const getProtocolBalances = async (userAddress: string) => {
  // In a real implementation, this would query your vault contract
  // to get user's balances across different protocols
  
  // Mock data for testing
  return {
    'AAVE_V2': {
      'USDC': '1,000.00',
      'DAI': '500.00'
    },
    'AAVE_V3': {
      'WETH': '1.25'
    },
    'MORPHO_BLUE': {
      'USDC': '3,808.42',
      'WETH': '3.24'
    }
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
  // In a real implementation, you would get the expected output from a price oracle or quote
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
  
  // Execute the deposit (use version 1 for Aave V3)
  const tx = await vaultContract.deposit(tokenAddress, parsedAmount);
  
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
  
  // Execute the withdrawal (use version 1 for Aave V3)
  const tx = await vaultContract.withdraw(tokenAddress, parsedAmount);
  
  await tx.wait();
  return tx.hash;
};

// Deposit to Morpho Blue
export const depositToMorphoBlue = async (poolName: string, amount: string): Promise<string> => {
  const vaultContract = getUniversalVaultContract();
  if (!vaultContract) throw new Error('Vault contract not available');
  
  try {
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
    const tx = await vaultContract.deposit(poolName, parsedAmount);
    
    await tx.wait();
    return tx.hash;
  } catch (error) {
    console.error("Error depositing to Morpho Blue:", error);
    throw error;
  }
};

// Withdraw from Morpho Blue
export const withdrawFromMorphoBlue = async (poolName: string, amount: string): Promise<string> => {
  const vaultContract = getUniversalVaultContract();
  if (!vaultContract) throw new Error('Vault contract not available');
  
  try {
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
    const tx = await vaultContract.withdraw(poolName, parsedAmount);
    
    await tx.wait();
    return tx.hash;
  } catch (error) {
    console.error("Error withdrawing from Morpho Blue:", error);
    throw error;
  }
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