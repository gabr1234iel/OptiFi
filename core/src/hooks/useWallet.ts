import { useState, useEffect } from 'react';
import { connectWallet, switchNetwork } from '../services/web3';

export function useWallet() {
  const [account, setAccount] = useState<string>('');
  const [balance, setBalance] = useState<string>('');
  const [network, setNetwork] = useState<string>('');
  const [chainId, setChainId] = useState<string>('');
  const [isConnected, setIsConnected] = useState<boolean>(false);
  const [isConnecting, setIsConnecting] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const connect = async () => {
    setIsConnecting(true);
    setError(null);
    
    try {
      const walletData = await connectWallet();
      setAccount(walletData.address);
      setBalance(parseFloat(walletData.balance).toFixed(4));
      setNetwork(walletData.network);
      setChainId(`0x${walletData.chainId.toString(16)}`);
      setIsConnected(true);
    } catch (error) {
      setError('Failed to connect wallet');
      console.error(error);
    } finally {
      setIsConnecting(false);
    }
  };

  const handleNetworkChange = async (newChainId: string) => {
    try {
      await switchNetwork(newChainId);
      // The actual state update will happen through the accountsChanged/chainChanged event listeners
    } catch (error) {
      console.error('Failed to switch network', error);
    }
  };

  useEffect(() => {
    // Listen for account changes
    if (typeof window !== 'undefined' && window.ethereum) {
      const handleAccountsChanged = (accounts: string[]) => {
        if (accounts.length === 0) {
          // User disconnected
          setIsConnected(false);
          setAccount('');
          setBalance('');
        } else if (accounts[0] !== account) {
          // Account changed
          setAccount(accounts[0]);
          connect(); // Reconnect to get updated balance
        }
      };

      const handleChainChanged = (chainId: string) => {
        // Chain changed, reconnect to get updated info
        connect();
      };

      window.ethereum.on('accountsChanged', handleAccountsChanged);
      window.ethereum.on('chainChanged', handleChainChanged);

      // Check if already connected
      window.ethereum.request({ method: 'eth_accounts' })
        .then((accounts: string[]) => {
          if (accounts.length > 0) {
            connect();
          }
        })
        .catch(console.error);

      return () => {
        window.ethereum.removeListener('accountsChanged', handleAccountsChanged);
        window.ethereum.removeListener('chainChanged', handleChainChanged);
      };
    }
  }, [account]);

  return {
    account,
    balance,
    network,
    chainId,
    isConnected,
    isConnecting,
    error,
    connect,
    handleNetworkChange
  };
}