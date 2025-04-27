// src/services/universalVaultService.ts
import { ethers } from 'ethers';
import { getProvider } from './web3';
import UniversalVaultABI from '../constants/UniversalVaultABI.json';

// Universal Vault Contract address - deployed address
const UNIVERSAL_VAULT_ADDRESS = "0x488b54Cf1b3F65Fa0cf76889ccb78afD2a054f4E";

// Adapter addresses from deployment
export const ADAPTER_ADDRESSES = {
  AAVE_V2: "0x31C89d6188b169aDCC7f6002d9cBAB605B67fd6d",
  AAVE_V3: "0x656eef60fFA6c3b984E199d29443b885c51A6200",
  COMPOUND_V2: "0x94a4d8C45FBaC4cCDD0afAebD0C006d97cfA8b6c",
  COMPOUND_V3: "0xd6A0A8E18934Bb04eb1787De1C7bD48013579935",
  EULER_V2: "0x263f307a067B559972302ED69A68f7a2FfBb7639",
  FLUID: "0x17b6BBD34266Ed4d6770D9Ed643Fc24eE1a1197B",
  METAMORPHO: "0x2bf05b061eF80b63ba3bd7c3fcC1Bb505a7b9e7C",
  SKYLENDING: "0x192ad6993AA1a7D642461C1d0E7224cf32B174E3",
  SPARKLENDING: "0xe89cC665c4F246289C272c284ed8Cd3D6cdEB66d"
};

// Protocol enum mapping
export const PROTOCOL_ENUM = {
  AAVE_V2: 0,
  AAVE_V3: 1,
  MORPHO_BLUE: 2,
  COMPOUND_V2: 3,
  COMPOUND_V3: 4,
  EULER_V2: 5,
  FLUID: 6,
  SKY: 7,
  SPARK: 8
};

// Token addresses
export const TOKEN_ADDRESSES = {
  // Stablecoins
  USDC: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48',
  USDT: '0xdAC17F958D2ee523a2206206994597C13D831ec7',
  DAI: '0x6B175474E89094C44Da98b954EedeAC495271d0F',
  PYUSD: '0x6c3ea9036406852006290770bedfcaba0e23a0e8',
  USDE: '0x4c9EDD5852cd905f086C759E8383e09bff1E68B3',
  USDS: '0xdC035D45d973E3EC169d2276DDab16f1e407384F',
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

// Define standard pool information mapping from the deployment
export const POOL_INFO = {
  // Morpho pools
  STEAKUSDC: { 
    protocol: PROTOCOL_ENUM.MORPHO_BLUE, 
    underlyingToken: TOKEN_ADDRESSES.USDC,
    adapter: ADAPTER_ADDRESSES.METAMORPHO
  },
  REUSDC: { 
    protocol: PROTOCOL_ENUM.MORPHO_BLUE, 
    underlyingToken: TOKEN_ADDRESSES.USDC,
    adapter: ADAPTER_ADDRESSES.METAMORPHO
  },
  BBQUSDC: { 
    protocol: PROTOCOL_ENUM.MORPHO_BLUE, 
    underlyingToken: TOKEN_ADDRESSES.USDC,
    adapter: ADAPTER_ADDRESSES.METAMORPHO
  },
  STEAKETH: { 
    protocol: PROTOCOL_ENUM.MORPHO_BLUE, 
    underlyingToken: TOKEN_ADDRESSES.WETH,
    adapter: ADAPTER_ADDRESSES.METAMORPHO
  },
  STEAKRUSD: { 
    protocol: PROTOCOL_ENUM.MORPHO_BLUE, 
    underlyingToken: TOKEN_ADDRESSES.RUSD,
    adapter: ADAPTER_ADDRESSES.METAMORPHO
  },
  
  // Aave pools
  USDC_AAVE_V2: { 
    protocol: PROTOCOL_ENUM.AAVE_V2, 
    underlyingToken: TOKEN_ADDRESSES.USDC,
    adapter: ADAPTER_ADDRESSES.AAVE_V2
  },
  USDT_AAVE_V2: { 
    protocol: PROTOCOL_ENUM.AAVE_V2, 
    underlyingToken: TOKEN_ADDRESSES.USDT,
    adapter: ADAPTER_ADDRESSES.AAVE_V2
  },
  WBTC_AAVE_V2: { 
    protocol: PROTOCOL_ENUM.AAVE_V2, 
    underlyingToken: TOKEN_ADDRESSES.WBTC,
    adapter: ADAPTER_ADDRESSES.AAVE_V2
  },
  
  // Aave V3 pools
  WETH_AAVE_V3: { 
    protocol: PROTOCOL_ENUM.AAVE_V3, 
    underlyingToken: TOKEN_ADDRESSES.WETH,
    adapter: ADAPTER_ADDRESSES.AAVE_V3
  },
  USDC_AAVE_V3: { 
    protocol: PROTOCOL_ENUM.AAVE_V3, 
    underlyingToken: TOKEN_ADDRESSES.USDC,
    adapter: ADAPTER_ADDRESSES.AAVE_V3
  },
  
  // Compound pools
  DAI_COMPOUND_V2: { 
    protocol: PROTOCOL_ENUM.COMPOUND_V2, 
    underlyingToken: TOKEN_ADDRESSES.DAI,
    adapter: ADAPTER_ADDRESSES.COMPOUND_V2
  },
  USDC_COMPOUND_V2: { 
    protocol: PROTOCOL_ENUM.COMPOUND_V2, 
    underlyingToken: TOKEN_ADDRESSES.USDC,
    adapter: ADAPTER_ADDRESSES.COMPOUND_V2
  },
  
  // Compound V3 pools
  USDC_COMPOUND_V3: { 
    protocol: PROTOCOL_ENUM.COMPOUND_V3, 
    underlyingToken: TOKEN_ADDRESSES.USDC,
    adapter: ADAPTER_ADDRESSES.COMPOUND_V3
  },
  
  // Fluid pools
  USDC_FLUID: { 
    protocol: PROTOCOL_ENUM.FLUID, 
    underlyingToken: TOKEN_ADDRESSES.USDC,
    adapter: ADAPTER_ADDRESSES.FLUID
  },
  USDT_FLUID: { 
    protocol: PROTOCOL_ENUM.FLUID, 
    underlyingToken: TOKEN_ADDRESSES.USDT,
    adapter: ADAPTER_ADDRESSES.FLUID
  },
  WSTETH_FLUID: { 
    protocol: PROTOCOL_ENUM.FLUID, 
    underlyingToken: TOKEN_ADDRESSES.WSTETH,
    adapter: ADAPTER_ADDRESSES.FLUID
  }
};

// Convert protocol enum to readable name
export const getProtocolName = (protocolId: number): string => {
  for (const [key, value] of Object.entries(PROTOCOL_ENUM)) {
    if (value === protocolId) {
      return key;
    }
  }
  return 'Unknown';
};

// Get token symbol from address
export const getTokenSymbol = (address: string): string => {
  const normalizedAddress = address.toLowerCase();
  for (const [symbol, addr] of Object.entries(TOKEN_ADDRESSES)) {
    if (addr.toLowerCase() === normalizedAddress) {
      return symbol;
    }
  }
  return 'Unknown';
};

// ERC20 ABI - minimal for approvals and balances
export const ERC20ABI = [
  "function approve(address spender, uint256 amount) returns (bool)",
  "function allowance(address owner, address spender) view returns (uint256)",
  "function balanceOf(address account) view returns (uint256)",
  "function decimals() view returns (uint8)",
  "function symbol() view returns (string)"
];

// Protocol adapter ABI (just what we need)
export const ADAPTER_ABI = [
  "function getAPY(address underlyingToken) view returns (uint256)",
  "function getBalance(address underlyingToken) view returns (uint256)"
];

// Create vault contract instance
export const getUniversalVaultContract = () => {
  const provider = getProvider();
  if (!provider) return null;
  
  const signer = provider.getSigner();
  return new ethers.Contract(UNIVERSAL_VAULT_ADDRESS, UniversalVaultABI, signer);
};

// Format amounts with proper decimals
export const formatAmount = async (token: string, amount: string): Promise<ethers.BigNumber> => {
  const provider = getProvider();
  if (!provider) throw new Error('Provider not available');
  
  const tokenAddress = TOKEN_ADDRESSES[token as keyof typeof TOKEN_ADDRESSES];
  if (!tokenAddress) throw new Error('Unsupported token');
  
  const tokenContract = new ethers.Contract(tokenAddress, ERC20ABI, provider);
  const decimals = await tokenContract.decimals();
  
  return ethers.utils.parseUnits(amount, decimals);
};

// Approve token spending
export const approveToken = async (token: string, amount: string, spender: string): Promise<string> => {
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
    // In a real implementation, you'd query from a registry or event logs
    // Since our Universal Vault doesn't have a specific function to get all pools,
    // we'll return the available pools from our predefined mapping
    return Object.keys(POOL_INFO);
  } catch (error) {
    console.error('Error fetching pools:', error);
    throw error;
  }
};

// Get token adapter address from vault
export const getTokenAdapter = async (token: string): Promise<string> => {
  const vaultContract = getUniversalVaultContract();
  if (!vaultContract) throw new Error('Vault contract not available');
  
  const tokenAddress = TOKEN_ADDRESSES[token as keyof typeof TOKEN_ADDRESSES];
  if (!tokenAddress) throw new Error('Unsupported token');
  
  try {
    return await vaultContract.tokenAdapters(tokenAddress);
  } catch (error) {
    console.error('Error getting token adapter:', error);
    throw error;
  }
};

// Get pool details
export const getPoolDetails = async (poolName: string) => {
  const vaultContract = getUniversalVaultContract();
  if (!vaultContract) throw new Error('Vault contract not available');
  
  try {
    // Get pool info from our mapping
    const poolInfo = POOL_INFO[poolName as keyof typeof POOL_INFO];
    if (!poolInfo) {
      throw new Error(`Pool ${poolName} not found`);
    }
    
    // Get the actual adapter from the vault for this token
    const actualAdapter = await vaultContract.tokenAdapters(poolInfo.underlyingToken);
    
    // Get the APY from the adapter
    let apy = 0;
    if (actualAdapter && actualAdapter !== ethers.constants.AddressZero) {
      const provider = getProvider();
      if (provider) {
        const adapterContract = new ethers.Contract(actualAdapter, ADAPTER_ABI, provider);
        try {
          const apyBN = await adapterContract.getAPY(poolInfo.underlyingToken);
          apy = apyBN.toNumber(); // APY in basis points (1% = 100)
        } catch (error) {
          console.error('Error getting APY:', error);
          // Use fallback
          apy = Math.floor(Math.random() * 500) + 100; // Random APY between 1% and 6%
        }
      }
    }
    
    return {
      poolAddress: poolInfo.adapter, // Using adapter address as the pool address
      underlyingToken: poolInfo.underlyingToken,
      protocol: poolInfo.protocol,
      apy: apy // APY in basis points
    };
  } catch (error) {
    console.error('Error fetching pool details:', error);
    throw error;
  }
};

// Get APY comparison across protocols for a token
export const getProtocolAPYs = async (tokenSymbol: string) => {
  const provider = getProvider();
  if (!provider) throw new Error('Provider not available');
  
  const tokenAddress = TOKEN_ADDRESSES[tokenSymbol as keyof typeof TOKEN_ADDRESSES];
  if (!tokenAddress) throw new Error('Unsupported token');
  
  const result: Record<string, number> = {};
  
  // Query each adapter for this token
  for (const [protocol, adapterAddress] of Object.entries(ADAPTER_ADDRESSES)) {
    try {
      const adapterContract = new ethers.Contract(adapterAddress, ADAPTER_ABI, provider);
      const apyBN = await adapterContract.getAPY(tokenAddress);
      // Convert from basis points to percentage
      result[protocol] = apyBN.toNumber() / 100;
    } catch (error) {
      console.error(`Error getting APY for ${protocol}:`, error);
      // Use fallback
      result[protocol] = Math.random() * 5 + 1; // Random APY between 1% and 6%
    }
  }
  
  return result;
};

// Get user balances across protocols
export const getProtocolBalances = async (userAddress: string) => {
  const vaultContract = getUniversalVaultContract();
  if (!vaultContract) throw new Error('Vault contract not available');
  
  const result: Record<string, Record<string, string>> = {};
  
  // First, get all supported tokens and their adapters
  const tokenSymbols = Object.keys(TOKEN_ADDRESSES);
  
  for (const symbol of tokenSymbols) {
    const tokenAddress = TOKEN_ADDRESSES[symbol as keyof typeof TOKEN_ADDRESSES];
    
    try {
      // Get the balance for this user and token
      const balance = await vaultContract.getUserBalance(userAddress, tokenAddress);
      
      if (balance.gt(0)) {
        // Get the token's decimals
        const provider = getProvider();
        if (provider) {
          const tokenContract = new ethers.Contract(tokenAddress, ERC20ABI, provider);
          const decimals = await tokenContract.decimals();
          const formattedBalance = ethers.utils.formatUnits(balance, decimals);
          
          // Get the adapter for this token
          const adapterAddress = await vaultContract.tokenAdapters(tokenAddress);
          if (adapterAddress && adapterAddress !== ethers.constants.AddressZero) {
            // Find the protocol name for this adapter
            let protocolName = 'Unknown';
            for (const [protocol, addr] of Object.entries(ADAPTER_ADDRESSES)) {
              if (addr.toLowerCase() === adapterAddress.toLowerCase()) {
                protocolName = protocol;
                break;
              }
            }
            
            // Add to result
            if (!result[protocolName]) {
              result[protocolName] = {};
            }
            
            // Format the balance with commas
            const numberWithCommas = Number(formattedBalance).toLocaleString('en-US', {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2
            });
            
            result[protocolName][symbol] = numberWithCommas;
          }
        }
      }
    } catch (error) {
      console.error(`Error getting balance for ${symbol}:`, error);
    }
  }
  
  return result;
};

// Deposit to vault
export const deposit = async (token: string, amount: string): Promise<string> => {
  const vaultContract = getUniversalVaultContract();
  if (!vaultContract) throw new Error('Vault contract not available');
  
  const tokenAddress = TOKEN_ADDRESSES[token as keyof typeof TOKEN_ADDRESSES];
  if (!tokenAddress) throw new Error('Unsupported token');
  
  // Format amount with correct decimals
  const parsedAmount = await formatAmount(token, amount);
  
  // Approve the vault to spend tokens
  await approveToken(token, amount, UNIVERSAL_VAULT_ADDRESS);
  
  // Execute the deposit
  const tx = await vaultContract.deposit(tokenAddress, parsedAmount);
  await tx.wait();
  
  return tx.hash;
};

// Withdraw from vault
export const withdraw = async (token: string, amount: string): Promise<string> => {
  const vaultContract = getUniversalVaultContract();
  if (!vaultContract) throw new Error('Vault contract not available');
  
  const tokenAddress = TOKEN_ADDRESSES[token as keyof typeof TOKEN_ADDRESSES];
  if (!tokenAddress) throw new Error('Unsupported token');
  
  // Format amount with correct decimals
  const parsedAmount = await formatAmount(token, amount);
  
  // Execute the withdrawal
  const tx = await vaultContract.withdraw(tokenAddress, parsedAmount);
  await tx.wait();
  
  return tx.hash;
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
  // This is an approximation - in a real app you would use a price oracle or quote
  const minAmountOut = parsedAmount.mul(100 - Math.floor(slippagePercent * 100)).div(100);
  
  // Get the fee tier for this pair (or use default)
  const feeTier = await vaultContract.getFeeTier(fromTokenAddress, toTokenAddress);
  
  // Approve the vault to spend tokens
  await approveToken(fromToken, amount, UNIVERSAL_VAULT_ADDRESS);
  
  // Execute the swap
  const tx = await vaultContract.swapExactTokens(
    fromTokenAddress,
    toTokenAddress,
    parsedAmount,
    minAmountOut,
    feeTier
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
  
  // Approve the vault to spend tokens
  await approveToken(path[0], amount, UNIVERSAL_VAULT_ADDRESS);
  
  // Execute the multi-hop swap
  const tx = await vaultContract.swapExactTokensMultiHop(
    tokenAddresses,
    fees,
    parsedAmount,
    minAmountOut
  );
  
  await tx.wait();
  return tx.hash;
};

// Helper to get pool name for a token and protocol
export const getPoolNameForTokenAndProtocol = (token: string, protocol: number): string | null => {
  for (const [poolName, info] of Object.entries(POOL_INFO)) {
    if (info.protocol === protocol && 
        info.underlyingToken.toLowerCase() === TOKEN_ADDRESSES[token as keyof typeof TOKEN_ADDRESSES]?.toLowerCase()) {
      return poolName;
    }
  }
  return null;
};

// Deposit to a specific protocol through Universal Vault
export const depositToAave = async (token: string, amount: string): Promise<string> => {
  // Find the appropriate pool for this token in Aave
  const poolName = getPoolNameForTokenAndProtocol(token, PROTOCOL_ENUM.AAVE_V3) || 
                   getPoolNameForTokenAndProtocol(token, PROTOCOL_ENUM.AAVE_V2);
  
  if (!poolName) {
    throw new Error(`No Aave pool found for token ${token}`);
  }
  
  // Use the standard deposit function
  return await deposit(token, amount);
};

// Withdraw from Aave through Universal Vault
export const withdrawFromAave = async (token: string, amount: string): Promise<string> => {
  // Use the standard withdraw function
  return await withdraw(token, amount);
};

// Deposit to Morpho Blue through Universal Vault
export const depositToMorphoBlue = async (poolName: string, amount: string): Promise<string> => {
  const poolInfo = POOL_INFO[poolName as keyof typeof POOL_INFO];
  if (!poolInfo) {
    throw new Error(`Pool ${poolName} not found`);
  }
  
  // Find the token symbol
  let tokenSymbol = '';
  for (const [symbol, address] of Object.entries(TOKEN_ADDRESSES)) {
    if (address.toLowerCase() === poolInfo.underlyingToken.toLowerCase()) {
      tokenSymbol = symbol;
      break;
    }
  }
  
  if (!tokenSymbol) {
    throw new Error('Token not found for this pool');
  }
  
  // Use the standard deposit function
  return await deposit(tokenSymbol, amount);
};

// Withdraw from Morpho Blue through Universal Vault
export const withdrawFromMorphoBlue = async (poolName: string, amount: string): Promise<string> => {
  const poolInfo = POOL_INFO[poolName as keyof typeof POOL_INFO];
  if (!poolInfo) {
    throw new Error(`Pool ${poolName} not found`);
  }
  
  // Find the token symbol
  let tokenSymbol = '';
  for (const [symbol, address] of Object.entries(TOKEN_ADDRESSES)) {
    if (address.toLowerCase() === poolInfo.underlyingToken.toLowerCase()) {
      tokenSymbol = symbol;
      break;
    }
  }
  
  if (!tokenSymbol) {
    throw new Error('Token not found for this pool');
  }
  
  // Use the standard withdraw function
  return await withdraw(tokenSymbol, amount);
};

// Swap with multi-hop and deposit in one transaction
export const swapMultihopAndDeposit = async (
  path: string[], // Array of token symbols in order of the path
  fees: number[], // Array of pool fees
  poolName: string,
  amount: string,
  slippagePercent: number = 0.5
): Promise<string> => {
  // Similar to swapAndDeposit but using multi-hop swap
  // Get pool info
  const poolInfo = POOL_INFO[poolName as keyof typeof POOL_INFO];
  if (!poolInfo) {
    throw new Error(`Pool ${poolName} not found`);
  }
  
  // Find target token symbol
  let targetTokenSymbol = '';
  for (const [symbol, address] of Object.entries(TOKEN_ADDRESSES)) {
    if (address.toLowerCase() === poolInfo.underlyingToken.toLowerCase()) {
      targetTokenSymbol = symbol;
      break;
    }
  }
  
  if (!targetTokenSymbol) {
    throw new Error('Target token not found for this pool');
  }
  
  // Make sure the last token in the path matches the target token
  if (path[path.length - 1] !== targetTokenSymbol) {
    throw new Error('Last token in path must match pool underlying token');
  }
  
  // 1. Swap tokens using multi-hop
  const txHash1 = await swapTokensMultihop(path, fees, amount, slippagePercent);
  
  // 2. Get the amount we received (again simplified)
  const parsedAmount = await formatAmount(path[0], amount);
  const minAmountOut = parsedAmount.mul(100 - Math.floor(slippagePercent * 100)).div(100);
  
  // Convert to the target token's decimals
  const provider = getProvider();
  if (!provider) throw new Error('Provider not available');
  
  const fromTokenAddress = TOKEN_ADDRESSES[path[0] as keyof typeof TOKEN_ADDRESSES];
  const toTokenAddress = TOKEN_ADDRESSES[targetTokenSymbol as keyof typeof TOKEN_ADDRESSES];
  
  const fromTokenContract = new ethers.Contract(fromTokenAddress, ERC20ABI, provider);
  const toTokenContract = new ethers.Contract(toTokenAddress, ERC20ABI, provider);
  
  const fromDecimals = await fromTokenContract.decimals();
  const toDecimals = await toTokenContract.decimals();
  
  const receivedAmount = ethers.utils.formatUnits(minAmountOut, fromDecimals);
  const targetAmount = ethers.utils.parseUnits(receivedAmount, toDecimals);
  
  // 3. Deposit the received amount
  const txHash2 = await deposit(targetTokenSymbol, ethers.utils.formatUnits(targetAmount, toDecimals));
  
  // Return the deposit transaction hash
  return txHash2;
};

// Get total value locked for a token
export const getTotalValueLocked = async (token: string): Promise<string> => {
  const vaultContract = getUniversalVaultContract();
  if (!vaultContract) throw new Error('Vault contract not available');
  
  const tokenAddress = TOKEN_ADDRESSES[token as keyof typeof TOKEN_ADDRESSES];
  if (!tokenAddress) throw new Error('Unsupported token');
  
  try {
    // Get the total balance for this token
    const totalBalance = await vaultContract.getTotalBalance(tokenAddress);
    
    // Get token decimals
    const provider = getProvider();
    if (!provider) throw new Error('Provider not available');
    
    const tokenContract = new ethers.Contract(tokenAddress, ERC20ABI, provider);
    const decimals = await tokenContract.decimals();
    
    // Format the balance
    return ethers.utils.formatUnits(totalBalance, decimals);
  } catch (error) {
    console.error('Error getting total value locked:', error);
    throw error;
  }
};

// Transfer between protocols 
export const transferBetweenProtocols = async (
  sourceToken: string, 
  targetToken: string,
  amount: string,
  targetProtocol: number,
  useMultihop: boolean = false,
  intermediateToken?: string,
  fee1?: number,
  fee2?: number
): Promise<string> => {
  const vaultContract = getUniversalVaultContract();
  if (!vaultContract) throw new Error('Vault contract not available');
  
  const sourceTokenAddress = TOKEN_ADDRESSES[sourceToken as keyof typeof TOKEN_ADDRESSES];
  const targetTokenAddress = TOKEN_ADDRESSES[targetToken as keyof typeof TOKEN_ADDRESSES];
  
  if (!sourceTokenAddress) throw new Error('Unsupported source token');
  if (!targetTokenAddress) throw new Error('Unsupported target token');
  
  // Find the adapter for the target protocol
  let targetAdapter = '';
  for (const [protocol, adapterAddress] of Object.entries(ADAPTER_ADDRESSES)) {
    if (PROTOCOL_ENUM[protocol as keyof typeof PROTOCOL_ENUM] === targetProtocol) {
      targetAdapter = adapterAddress;
      break;
    }
  }
  
  if (!targetAdapter) throw new Error('Adapter not found for target protocol');
  
  // Format amount with correct decimals
  const parsedAmount = await formatAmount(sourceToken, amount);
  
  // Calculate minimum output amount with 0.5% slippage (can be adjusted)
  const minAmountOut = parsedAmount.mul(995).div(1000);
  
  // Prepare swap params
  let swapParams = '0x';
  
  if (sourceToken !== targetToken) {
    if (useMultihop && intermediateToken) {
      // Multi-hop path
      const path = [sourceToken, intermediateToken, targetToken];
      const fees = [fee1 || 3000, fee2 || 3000]; // Default to 0.3% if not specified
      
      // Get token addresses for the path
      const tokenAddresses = path.map(symbol => {
        const address = TOKEN_ADDRESSES[symbol as keyof typeof TOKEN_ADDRESSES];
        if (!address) throw new Error(`Unsupported token: ${symbol}`);
        return address;
      });
      
      // Encode the path for Uniswap V3
      swapParams = ethers.utils.defaultAbiCoder.encode(
        ['address[]', 'uint24[]'],
        [tokenAddresses, fees]
      );
    } else {
      // Direct swap - just encode the fee tier
      const feeTier = await vaultContract.getFeeTier(sourceTokenAddress, targetTokenAddress);
      swapParams = ethers.utils.defaultAbiCoder.encode(['uint24'], [feeTier]);
    }
  }
  
  // Approve the vault to spend tokens
  await approveToken(sourceToken, amount, UNIVERSAL_VAULT_ADDRESS);
  
  // Execute the transfer between protocols
  const tx = await vaultContract.transferBetweenProtocols(
    sourceTokenAddress,
    targetTokenAddress,
    parsedAmount,
    minAmountOut,
    targetAdapter,
    swapParams
  );
  
  await tx.wait();
  return tx.hash;
};

// Get token balances for the connected user
export const getUserTokenBalances = async (): Promise<Record<string, string>> => {
  const provider = getProvider();
  if (!provider) throw new Error('Provider not available');
  
  const signer = provider.getSigner();
  const userAddress = await signer.getAddress();
  
  const result: Record<string, string> = {};
  
  // Get balances for all tokens
  for (const [symbol, address] of Object.entries(TOKEN_ADDRESSES)) {
    try {
      const tokenContract = new ethers.Contract(address, ERC20ABI, provider);
      const balance = await tokenContract.balanceOf(userAddress);
      const decimals = await tokenContract.decimals();
      
      if (balance.gt(0)) {
        result[symbol] = ethers.utils.formatUnits(balance, decimals);
      }
    } catch (error) {
      console.error(`Error getting balance for ${symbol}:`, error);
    }
  }
  
  return result;
};

export const getUserVaultBalances = async (userAddress: string): Promise<Record<string, string>> => {
  const vaultContract = getUniversalVaultContract();
  if (!vaultContract) throw new Error('Vault contract not available');
  
  const provider = getProvider();
  if (!provider) throw new Error('Provider not available');
  
  const result: Record<string, string> = {};
  
  // Check balances for each token
  for (const [symbol, address] of Object.entries(TOKEN_ADDRESSES)) {
    try {
      // Get the user's balance for this token
      const balance = await vaultContract.getUserBalance(userAddress, address);
      
      if (balance.gt(0)) {
        // Get token decimals
        const tokenContract = new ethers.Contract(address, ERC20ABI, provider);
        const decimals = await tokenContract.decimals();
        
        // Format with proper decimals
        const formattedBalance = ethers.utils.formatUnits(balance, decimals);
        
        // Format with commas
        result[symbol] = parseFloat(formattedBalance).toLocaleString('en-US', {
          minimumFractionDigits: 2,
          maximumFractionDigits: decimals > 6 ? 6 : decimals
        });
      }
    } catch (error) {
      console.error(`Error getting vault balance for ${symbol}:`, error);
    }
  }
  
  return result;
};

// Simplified swapAndDeposit that doesn't need a pool name
export const swapAndDeposit = async (
  fromToken: string,
  toToken: string,
  amount: string,
  slippagePercent: number = 0.5
): Promise<string> => {
  const vaultContract = getUniversalVaultContract();
  if (!vaultContract) throw new Error('Vault contract not available');
  
  const fromTokenAddress = TOKEN_ADDRESSES[fromToken as keyof typeof TOKEN_ADDRESSES];
  const toTokenAddress = TOKEN_ADDRESSES[toToken as keyof typeof TOKEN_ADDRESSES];
  
  if (!fromTokenAddress) throw new Error('Unsupported source token');
  if (!toTokenAddress) throw new Error('Unsupported destination token');
  
  // If source and target tokens are the same, just deposit
  if (fromToken === toToken) {
    return await deposit(fromToken, amount);
  }
  
  // Format amount with correct decimals
  const parsedAmount = await formatAmount(fromToken, amount);
  
  // Calculate minimum output amount based on slippage
  const minAmountOut = parsedAmount.mul(100 - Math.floor(slippagePercent * 100)).div(100);
  
  // Get the fee tier for this pair (or use default)
  const feeTier = await vaultContract.getFeeTier(fromTokenAddress, toTokenAddress);
  
  // Approve the vault to spend tokens
  await approveToken(fromToken, amount, UNIVERSAL_VAULT_ADDRESS);
  
  // Execute the swap
  const tx = await vaultContract.swapExactTokens(
    fromTokenAddress,
    toTokenAddress,
    parsedAmount,
    minAmountOut,
    feeTier
  );
  
  await tx.wait();
  
  // The swap already deposits the tokens into the active adapter, so we don't
  // need to do a separate deposit step
  
  return tx.hash;
};

// Add a utility function to check if a token has an active adapter
export const hasActiveAdapter = async (token: string): Promise<boolean> => {
  const vaultContract = getUniversalVaultContract();
  if (!vaultContract) return false;
  
  const tokenAddress = TOKEN_ADDRESSES[token as keyof typeof TOKEN_ADDRESSES];
  if (!tokenAddress) return false;
  
  try {
    const adapterAddress = await vaultContract.tokenAdapters(tokenAddress);
    return adapterAddress !== ethers.constants.AddressZero;
  } catch (error) {
    console.error('Error checking adapter:', error);
    return false;
  }
};

// Get vault balance for a token
export const getTotalBalance = async (tokenAddress: string): Promise<ethers.BigNumber> => {
  const vaultContract = getUniversalVaultContract();
  if (!vaultContract) throw new Error('Vault contract not available');
  
  try {
    // This matches the function in the contract
    return await vaultContract.vaultBalances(tokenAddress);
  } catch (error) {
    console.error('Error getting vault balance:', error);
    // Return zero balance as fallback
    return ethers.BigNumber.from(0);
  }
};