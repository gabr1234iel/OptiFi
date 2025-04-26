// src/components/UniversalVaultInteraction.tsx
import React, { useState, useEffect } from 'react';
import { useWallet } from '../hooks/useWallet';
import VaultActionTabs from './vault/VaultActionTabs';
import TokenSelector from './vault/TokenSelector';
import { 
  deposit, 
  withdraw,
  getUserTokenBalances,
  hasActiveAdapter
} from '../services/universalVaultService';

interface UniversalVaultInteractionProps {
  initialMode?: string;
  initialToken?: string;
}

const UniversalVaultInteraction: React.FC<UniversalVaultInteractionProps> = ({ 
  initialMode = 'deposit',
  initialToken
}) => {
  const { isConnected } = useWallet();
  
  // State for interaction mode (simplified to only deposit/withdraw)
  const [interactionMode, setInteractionMode] = useState<string>(initialMode);
  
  // State for token
  const [token, setToken] = useState<string>(initialToken || 'USDC');
  
  // State for amount
  const [amount, setAmount] = useState<string>('');
  
  // State for user balances
  const [userBalances, setUserBalances] = useState<Record<string, string>>({});
  
  // State for active adapters
  const [tokenHasAdapter, setTokenHasAdapter] = useState<Record<string, boolean>>({});
  
  // State for transaction status
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [transactionHash, setTransactionHash] = useState<string>('');
  const [errorMessage, setErrorMessage] = useState<string>('');
  
  // Update based on props changes
  useEffect(() => {
    if (initialMode) {
      setInteractionMode(initialMode);
    }
    
    if (initialToken) {
      setToken(initialToken);
    }
  }, [initialMode, initialToken]);
  
  // Load user balances
  useEffect(() => {
    const loadUserBalances = async () => {
      if (isConnected) {
        try {
          const balances = await getUserTokenBalances();
          setUserBalances(balances);
          
          // Check which tokens have active adapters
          const adapterStatus: Record<string, boolean> = {};
          for (const token of Object.keys(balances)) {
            adapterStatus[token] = await hasActiveAdapter(token);
          }
          setTokenHasAdapter(adapterStatus);
        } catch (error) {
          console.error('Error loading user balances:', error);
        }
      }
    };
    
    loadUserBalances();
  }, [isConnected, transactionHash]); // Reload when transaction completes
  
  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!isConnected) {
      setErrorMessage('Please connect your wallet first');
      return;
    }
    
    if (!amount || parseFloat(amount) <= 0) {
      setErrorMessage('Please enter a valid amount');
      return;
    }
    
    setIsProcessing(true);
    setTransactionHash('');
    setErrorMessage('');
    
    try {
      let txHash = '';
      
      // Handle different interaction modes
      if (interactionMode === 'deposit') {
        // Check if the token has an active adapter
        if (!tokenHasAdapter[token]) {
          throw new Error(`No active adapter for ${token}. Please contact admin to set up an adapter for this token.`);
        }
        
        // Direct deposit - no swapping involved
        console.log(`Depositing ${amount} ${token} to vault`);
        txHash = await deposit(token, amount);
      } else if (interactionMode === 'withdraw') {
        // Direct withdrawal
        console.log(`Withdrawing ${amount} ${token} from vault`);
        txHash = await withdraw(token, amount);
      }
      
      // Success - clear form and set tx hash
      setTransactionHash(txHash);
      setAmount('');
      
      // Reload balances after successful transaction
      setTimeout(async () => {
        const balances = await getUserTokenBalances();
        setUserBalances(balances);
      }, 2000);
      
    } catch (error) {
      console.error('Transaction error:', error);
      setErrorMessage(error instanceof Error ? error.message : String(error));
    } finally {
      setIsProcessing(false);
    }
  };
  
  // Get max balance for current token
  const getMaxBalance = () => {
    if (interactionMode === 'withdraw') {
      // We'd need to implement a function to get the user's vault balance
      // This is a placeholder; in a real implementation, get the balance from the vault
      return '0'; // Placeholder
    } else {
      // For deposits, use the user's wallet balance
      return userBalances[token] || '0';
    }
  };
  
  return (
    <div className="bg-white rounded-xl shadow-md p-6 max-w-2xl mx-auto">
      <h2 className="text-2xl font-bold mb-6 text-black">Universal Vault</h2>
      
      {/* Simplified Action Tabs - Only Deposit or Withdraw */}
      <div className="mb-6">
        <div className="flex space-x-2">
          <button 
            onClick={() => setInteractionMode('deposit')}
            className={`flex-1 py-2 px-4 rounded-md transition ${
              interactionMode === 'deposit' 
                ? 'bg-blue-600 text-white' 
                : 'bg-gray-200 text-gray-800 hover:bg-gray-300'
            }`}
          >
            Deposit
          </button>
          <button 
            onClick={() => setInteractionMode('withdraw')}
            className={`flex-1 py-2 px-4 rounded-md transition ${
              interactionMode === 'withdraw' 
                ? 'bg-blue-600 text-white' 
                : 'bg-gray-200 text-gray-800 hover:bg-gray-300'
            }`}
          >
            Withdraw
          </button>
        </div>
      </div>
      
      {/* Transaction Form */}
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Token Selection - Simplified */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            {interactionMode === 'deposit' ? 'Token to Deposit' : 'Token to Withdraw'}
          </label>
          <select
            value={token}
            onChange={(e) => setToken(e.target.value)}
            className="w-full p-2 border border-gray-300 rounded-md text-gray-700"
            required
          >
            {/* Simplified to a flat list of tokens */}
            <option value="USDC">USDC - USD Coin</option>
            <option value="USDT">USDT - Tether</option>
            <option value="DAI">DAI - Dai</option>
            <option value="WETH">WETH - Wrapped Ether</option>
            <option value="WBTC">WBTC - Wrapped Bitcoin</option>
          </select>
        </div>
        
        {/* Amount Input */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Amount
          </label>
          <div className="relative">
            <input
              type="number"
              step="0.000001"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="w-full p-2 border border-gray-300 rounded-md text-gray-700 pr-16"
              placeholder={`Enter amount in ${token}`}
              required
            />
            <div className="absolute inset-y-0 right-0 flex items-center">
              <button
                type="button"
                className="h-full px-3 text-xs text-blue-600 hover:bg-blue-50 rounded-r-md"
                onClick={() => setAmount(getMaxBalance())}
              >
                MAX
              </button>
            </div>
          </div>
          {userBalances[token] && interactionMode === 'deposit' && (
            <p className="text-xs text-gray-500 mt-1">
              Balance: {userBalances[token]} {token}
            </p>
          )}
        </div>
        
        {/* Token Warning */}
        {interactionMode === 'deposit' && !tokenHasAdapter[token] && (
          <div className="p-3 bg-yellow-100 text-yellow-800 rounded-md mb-4">
            <p className="text-sm">
              <strong>Warning:</strong> There is no active adapter for {token}. 
              Your funds won't earn yield until an administrator sets up an adapter for this token.
            </p>
          </div>
        )}
        
        {/* Submit Button */}
        <button
          type="submit"
          disabled={isProcessing || !isConnected}
          className={`w-full py-3 px-4 rounded-md transition ${
            isProcessing ? 'bg-gray-400 text-white cursor-not-allowed' :
            !isConnected ? 'bg-gray-400 text-white cursor-not-allowed' :
            'bg-blue-600 text-white hover:bg-blue-700'
          }`}
        >
          {isProcessing ? 'Processing...' : (
            !isConnected ? 'Connect Wallet to Continue' :
            interactionMode === 'deposit' ? 'Deposit' : 'Withdraw'
          )}
        </button>
      </form>
      
      {/* Transaction Status */}
      {transactionHash && (
        <div className="mt-4 p-3 bg-green-100 text-green-800 rounded-md">
          <p className="font-medium">Transaction Successful!</p>
          <p className="text-sm break-all">
            Transaction Hash: {transactionHash}
          </p>
          <div className="mt-2">
            <a 
              href={`https://etherscan.io/tx/${transactionHash}`} 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-blue-600 hover:underline"
            >
              View on Etherscan
            </a>
          </div>
        </div>
      )}
      
      {/* Error Message */}
      {errorMessage && (
        <div className="mt-4 p-3 bg-red-100 text-red-800 rounded-md">
          <p className="font-medium">Error</p>
          <p className="text-sm">{errorMessage}</p>
        </div>
      )}
    </div>
  );
};

export default UniversalVaultInteraction;