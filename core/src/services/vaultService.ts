import { ethers } from 'ethers';
import { getProvider } from './web3';

// Import ABI - you can paste the ABI here or import from a JSON file
const AaveVaultABI = [{"type":"constructor","inputs":[{"name":"_aavePool","type":"address","internalType":"address"}],"stateMutability":"nonpayable"},{"type":"function","name":"aTokens","inputs":[{"name":"","type":"address","internalType":"address"}],"outputs":[{"name":"","type":"address","internalType":"address"}],"stateMutability":"view"},{"type":"function","name":"aavePool","inputs":[],"outputs":[{"name":"","type":"address","internalType":"address"}],"stateMutability":"view"},{"type":"function","name":"addToken","inputs":[{"name":"token","type":"address","internalType":"address"},{"name":"aToken","type":"address","internalType":"address"}],"outputs":[],"stateMutability":"nonpayable"},{"type":"function","name":"deposit","inputs":[{"name":"token","type":"address","internalType":"address"},{"name":"amount","type":"uint256","internalType":"uint256"}],"outputs":[],"stateMutability":"nonpayable"},{"type":"function","name":"getCurrentAPY","inputs":[{"name":"token","type":"address","internalType":"address"}],"outputs":[{"name":"","type":"uint256","internalType":"uint256"}],"stateMutability":"view"},{"type":"function","name":"getUserBalance","inputs":[{"name":"user","type":"address","internalType":"address"},{"name":"token","type":"address","internalType":"address"}],"outputs":[{"name":"","type":"uint256","internalType":"uint256"}],"stateMutability":"view"},{"type":"function","name":"harvestYield","inputs":[{"name":"token","type":"address","internalType":"address"}],"outputs":[{"name":"","type":"uint256","internalType":"uint256"}],"stateMutability":"nonpayable"},{"type":"function","name":"owner","inputs":[],"outputs":[{"name":"","type":"address","internalType":"address"}],"stateMutability":"view"},{"type":"function","name":"renounceOwnership","inputs":[],"outputs":[],"stateMutability":"nonpayable"},{"type":"function","name":"totalPrincipal","inputs":[{"name":"","type":"address","internalType":"address"}],"outputs":[{"name":"","type":"uint256","internalType":"uint256"}],"stateMutability":"view"},{"type":"function","name":"transferOwnership","inputs":[{"name":"newOwner","type":"address","internalType":"address"}],"outputs":[],"stateMutability":"nonpayable"},{"type":"function","name":"userDeposits","inputs":[{"name":"","type":"address","internalType":"address"},{"name":"","type":"address","internalType":"address"}],"outputs":[{"name":"","type":"uint256","internalType":"uint256"}],"stateMutability":"view"},{"type":"function","name":"withdraw","inputs":[{"name":"token","type":"address","internalType":"address"},{"name":"amount","type":"uint256","internalType":"uint256"}],"outputs":[],"stateMutability":"nonpayable"},{"type":"function","name":"withdrawAll","inputs":[{"name":"token","type":"address","internalType":"address"}],"outputs":[],"stateMutability":"nonpayable"}];

// Contract addresses - Update these after deployment
const VAULT_ADDRESSES = {
  'low-risk': '0x98F74b7C96497070ba5052E02832EF9892962e62', // Your deployed AaveVault address
  'medium-risk': '0x98F74b7C96497070ba5052E02832EF9892962e62', // For now using the same contract
  'high-risk': '0x98F74b7C96497070ba5052E02832EF9892962e62'  // For now using the same contract
};

// Token addresses
const TOKEN_ADDRESSES = {
  USDC: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48',
  WETH: '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2'
};

// Create vault contract instances
export const getVaultContract = (riskLevel: string) => {
  const provider = getProvider();
  if (!provider) return null;
  
  const vaultAddress = VAULT_ADDRESSES[riskLevel as keyof typeof VAULT_ADDRESSES];
  if (!vaultAddress) return null;
  
  const signer = provider.getSigner();
  return new ethers.Contract(vaultAddress, AaveVaultABI, signer);
};

// Deposit into vault
export const depositToVault = async (riskLevel: string, token: string, amount: string) => {
  const vaultContract = getVaultContract(riskLevel);
  if (!vaultContract) throw new Error('Vault contract not available');
  
  const tokenAddress = TOKEN_ADDRESSES[token as keyof typeof TOKEN_ADDRESSES];
  if (!tokenAddress) throw new Error('Unsupported token');
  
  // First approve the vault to spend tokens
  const tokenContract = new ethers.Contract(
    tokenAddress,
    ['function approve(address spender, uint256 amount) returns (bool)', 'function decimals() view returns (uint8)'],
    vaultContract.signer
  );
  
  // Get token decimals
  const decimals = await tokenContract.decimals();
  
  // Parse amount with correct decimals
  const parsedAmount = ethers.utils.parseUnits(amount, decimals);
  
  // Approve spending
  const approveTx = await tokenContract.approve(vaultContract.address, parsedAmount);
  await approveTx.wait();
  
  // Deposit
  const tx = await vaultContract.deposit(tokenAddress, parsedAmount);
  await tx.wait();
  
  return tx.hash;
};

// Withdraw from vault
export const withdrawFromVault = async (riskLevel: string, token: string, amount: string) => {
  const vaultContract = getVaultContract(riskLevel);
  if (!vaultContract) throw new Error('Vault contract not available');
  
  const tokenAddress = TOKEN_ADDRESSES[token as keyof typeof TOKEN_ADDRESSES];
  if (!tokenAddress) throw new Error('Unsupported token');
  
  // Get token decimals
  const tokenContract = new ethers.Contract(
    tokenAddress,
    ['function decimals() view returns (uint8)'],
    vaultContract.signer
  );
  const decimals = await tokenContract.decimals();
  
  // Parse amount with correct decimals
  const parsedAmount = ethers.utils.parseUnits(amount, decimals);
  
  // Withdraw
  const tx = await vaultContract.withdraw(tokenAddress, parsedAmount);
  await tx.wait();
  
  return tx.hash;
};

// Withdraw all from vault
export const withdrawAllFromVault = async (riskLevel: string, token: string) => {
  const vaultContract = getVaultContract(riskLevel);
  if (!vaultContract) throw new Error('Vault contract not available');
  
  const tokenAddress = TOKEN_ADDRESSES[token as keyof typeof TOKEN_ADDRESSES];
  if (!tokenAddress) throw new Error('Unsupported token');
  
  // Withdraw all
  const tx = await vaultContract.withdrawAll(tokenAddress);
  await tx.wait();
  
  return tx.hash;
};

// Get APY from vault
export const getVaultAPY = async (riskLevel: string, token: string) => {
  const vaultContract = getVaultContract(riskLevel);
  if (!vaultContract) throw new Error('Vault contract not available');
  
  const tokenAddress = TOKEN_ADDRESSES[token as keyof typeof TOKEN_ADDRESSES];
  if (!tokenAddress) throw new Error('Unsupported token');
  
  // Get APY in ray units
  const apyRay = await vaultContract.getCurrentAPY(tokenAddress);
  
  // Convert from ray (27 decimals) to percentage
  return ethers.utils.formatUnits(apyRay, 25); // Divide by 10^25 to get percentage (2 decimals)
};

// Get user balance in the vault
export const getUserVaultBalance = async (riskLevel: string, token: string) => {
  const vaultContract = getVaultContract(riskLevel);
  if (!vaultContract) throw new Error('Vault contract not available');
  
  const tokenAddress = TOKEN_ADDRESSES[token as keyof typeof TOKEN_ADDRESSES];
  if (!tokenAddress) throw new Error('Unsupported token');
  
  const provider = getProvider();
  if (!provider) throw new Error('Provider not available');
  
  const signer = provider.getSigner();
  const userAddress = await signer.getAddress();
  
  // Get user balance including yield
  const balance = await vaultContract.getUserBalance(userAddress, tokenAddress);
  
  // Get token decimals
  const tokenContract = new ethers.Contract(
    tokenAddress,
    ['function decimals() view returns (uint8)'],
    provider
  );
  const decimals = await tokenContract.decimals();
  
  // Format balance
  return ethers.utils.formatUnits(balance, decimals);
};