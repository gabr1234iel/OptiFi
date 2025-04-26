// src/components/UniversalVaultInteraction.tsx
import React, { useState, useEffect } from 'react';
import { useWallet } from '../hooks/useWallet';
import VaultActionTabs from './vault/VaultActionTabs';
import TokenSelector from './vault/TokenSelector';
import SwapSettings from './vault/SwapSettings';
import { 
  deposit, 
  withdraw, 
  swapTokens, 
  swapTokensMultihop,
  swapAndDeposit,
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
  
  // State for interaction mode
  const [interactionMode, setInteractionMode] = useState<string>(initialMode);
  
  // State for tokens
  const [fromToken, setFromToken] = useState<string>(initialToken || 'USDC');
  const [toToken, setToToken] = useState<string>(initialToken || 'USDC');
  
  // State for amount
  const [amount, setAmount] = useState<string>('');
  
  // State for user balances
  const [userBalances, setUserBalances] = useState<Record<string, string>>({});
  
  // State for active adapters
  const [tokenHasAdapter, setTokenHasAdapter] = useState<Record<string, boolean>>({});
  
  // State for swap path (for multihop)
  const [useMultihop, setUseMultihop] = useState<boolean>(false);
  const [intermediateToken, setIntermediateToken] = useState<string>('WETH');
  const [fee1, setFee1] = useState<number>(3000);
  const [fee2, setFee2] = useState<number>(3000);
  
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
      if (initialMode === 'withdraw') {
        setToToken(initialToken);
      } else {
        setFromToken(initialToken);
      }
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
        if (!tokenHasAdapter[toToken]) {
          throw new Error(`No active adapter for ${toToken}. Please contact admin to set up an adapter for this token.`);
        }
        
        if (fromToken === toToken) {
          // Direct deposit without swap - automatically uses the active adapter
          console.log(`Depositing ${amount} ${fromToken} to vault`);
          txHash = await deposit(fromToken, amount);
        } else {
          // Swap and deposit
          if (useMultihop) {
            // Multi-hop swap and deposit
            console.log(`Swapping ${amount} ${fromToken} to ${toToken} via ${intermediateToken} and depositing`);
            const path = [fromToken, intermediateToken, toToken];
            const fees = [fee1, fee2];
            txHash = await swapTokensMultihop(path, fees, amount);
            // Then deposit the result (in a production app, you'd get the actual output amount)
            // This step is automatically handled by the vault when using swapAndDeposit
          } else {
            // Direct swap and deposit
            console.log(`Swapping ${amount} ${fromToken} to ${toToken} and depositing`);
            txHash = await swapAndDeposit(fromToken, toToken, amount);
          }
        }
      } else if (interactionMode === 'withdraw') {
        // Direct withdrawal - no pool selection needed
        console.log(`Withdrawing ${amount} ${toToken} from vault`);
        txHash = await withdraw(toToken, amount);
      } else if (interactionMode === 'swap') {
        if (useMultihop) {
          // Multi-hop swap
          console.log(`Swapping ${amount} ${fromToken} to ${toToken} via ${intermediateToken}`);
          const path = [fromToken, intermediateToken, toToken];
          const fees = [fee1, fee2];
          txHash = await swapTokensMultihop(path, fees, amount);
        } else {
          // Direct swap
          console.log(`Swapping ${amount} ${fromToken} to ${toToken}`);
          txHash = await swapTokens(fromToken, toToken, amount);
        }
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
      // For withdrawals, we'd need to get the user's balance in the vault
      // This would be implemented in a real app
      return '0'; // Placeholder
    } else {
      // For deposits and swaps, use the user's wallet balance
      const token = interactionMode === 'deposit' ? fromToken : fromToken;
      return userBalances[token] || '0';
    }
  };
  
  return (
    <div className="bg-white rounded-xl shadow-md p-6 max-w-2xl mx-auto">
      <h2 className="text-2xl font-bold mb-6 text-black">Universal Vault</h2>
      
      {/* Interaction Mode Tabs */}
      <VaultActionTabs 
        activeTab={interactionMode} 
        onChange={setInteractionMode} 
      />
      
      {/* Transaction Form */}
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Token Selection */}
        <TokenSelector
          interactionMode={interactionMode}
          fromToken={fromToken}
          toToken={toToken}
          onChangeFromToken={setFromToken}
          onChangeToToken={setToToken}
        />
        
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
              placeholder={`Enter amount in ${interactionMode !== 'withdraw' ? fromToken : toToken}`}
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
          {userBalances[fromToken] && interactionMode !== 'withdraw' && (
            <p className="text-xs text-gray-500 mt-1">
              Balance: {userBalances[fromToken]} {fromToken}
            </p>
          )}
        </div>
        
        {/* Token Warning */}
        {interactionMode === 'deposit' && !tokenHasAdapter[toToken] && (
          <div className="p-3 bg-yellow-100 text-yellow-800 rounded-md mb-4">
            <p className="text-sm">
              <strong>Warning:</strong> There is no active adapter for {toToken}. 
              Your funds won't earn yield until an administrator sets up an adapter for this token.
            </p>
          </div>
        )}
        
        {/* Swap Settings */}
        {((interactionMode === 'swap') || (interactionMode === 'deposit' && fromToken !== toToken)) && (
          <SwapSettings
            useMultihop={useMultihop}
            onToggleMultihop={() => setUseMultihop(!useMultihop)}
            intermediateToken={intermediateToken}
            onChangeIntermediateToken={setIntermediateToken}
            fee1={fee1}
            onChangeFee1={setFee1}
            fee2={fee2}
            onChangeFee2={setFee2}
            fromToken={fromToken}
            toToken={toToken}
          />
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
            interactionMode === 'deposit' ? 'Deposit' :
            interactionMode === 'withdraw' ? 'Withdraw' : 'Swap'
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