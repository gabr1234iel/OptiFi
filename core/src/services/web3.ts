import { ethers } from 'ethers';

// Add a type declaration for window.ethereum
declare global {
  interface Window {
    ethereum?: any;
  }
}

// Network names mapping
const NETWORK_NAMES: Record<number, string> = {
  1: 'Ethereum Mainnet',
  31337: 'Anvil Local', // Add Anvil
  137: 'Polygon',
  42161: 'Arbitrum',
  10: 'Optimism',
  8453: 'Base'
};

export const getProvider = () => {
  if (typeof window !== 'undefined' && window.ethereum) {
    return new ethers.providers.Web3Provider(window.ethereum);
  }
  return null;
};

export const connectWallet = async () => {
  if (typeof window === 'undefined' || !window.ethereum) {
    throw new Error('MetaMask is not installed');
  }
  
  try {
    const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
    const provider = getProvider();
    
    if (!provider) {
      throw new Error('Provider not available');
    }
    
    const signer = provider.getSigner();
    const address = await signer.getAddress();
    const balance = await provider.getBalance(address);
    const network = await provider.getNetwork();
    
    return {
      address,
      balance: ethers.utils.formatEther(balance),
      chainId: network.chainId,
      network: NETWORK_NAMES[network.chainId] || network.name
    };
  } catch (error) {
    console.error('Error connecting to wallet:', error);
    throw error;
  }
};

export const switchNetwork = async (chainId: string) => {
  if (typeof window === 'undefined' || !window.ethereum) {
    throw new Error('MetaMask is not installed');
  }
  
  try {
    await window.ethereum.request({
      method: 'wallet_switchEthereumChain',
      params: [{ chainId }],
    });
    return true;
  } catch (error) {
    console.error('Error switching network:', error);
    throw error;
  }
};