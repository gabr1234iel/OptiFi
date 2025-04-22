// src/components/vault/TransactionForm.tsx
import React from 'react';
import { 
  swapTokens,
  swapTokensMultihop,
  depositToAave,
  withdrawFromAave,
  depositToMorphoBlue,
  withdrawFromMorphoBlue,
  swapAndDeposit,
  swapMultihopAndDeposit
} from '../../services/universalVaultService';

interface PoolDetailsType {
  poolAddress: string;
  underlyingToken: string;
  protocol: number;
  apy?: number;
}

interface TransactionFormProps {
  isConnected: boolean;
  interactionMode: string;
  fromToken: string;
  toToken: string;
  amount: string;
  selectedPool: string;
  poolDetails: Record<string, PoolDetailsType>;
  useMultihop: boolean;
  intermediateToken: string;
  fee1: number;
  fee2: number;
  isProcessing: boolean;
  children: React.ReactNode;
  setIsProcessing: (isProcessing: boolean) => void;
  setTransactionHash: (hash: string) => void;
  setErrorMessage: (message: string) => void;
  setAmount: (amount: string) => void;
}

const TransactionForm: React.FC<TransactionFormProps> = ({
  isConnected,
  interactionMode,
  fromToken,
  toToken,
  amount,
  selectedPool,
  poolDetails,
  useMultihop,
  intermediateToken,
  fee1,
  fee2,
  isProcessing,
  children,
  setIsProcessing,
  setTransactionHash,
  setErrorMessage,
  setAmount
}) => {
  
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
        if (!selectedPool) {
          throw new Error('Please select a pool');
        }
        
        const details = poolDetails[selectedPool];
        if (!details) {
          throw new Error('Pool details not available');
        }
        
        if (fromToken === toToken) {
          // Direct deposit without swap
          if (details.protocol === 0 || details.protocol === 1) {
            // Aave V2 or V3
            txHash = await depositToAave(fromToken, amount);
          } else if (details.protocol === 2) {
            // Morpho Blue
            txHash = await depositToMorphoBlue(selectedPool, amount);
          } else {
            txHash = await depositToMorphoBlue(selectedPool, amount); // Default to Morpho for demo
          }
        } else {
          // Swap and deposit
          if (useMultihop) {
            // Multi-hop swap and deposit
            const path = [fromToken, intermediateToken, toToken];
            const fees = [fee1, fee2];
            txHash = await swapMultihopAndDeposit(path, fees, selectedPool, amount);
          } else {
            // Direct swap and deposit
            txHash = await swapAndDeposit(fromToken, selectedPool, amount);
          }
        }
      } else if (interactionMode === 'withdraw') {
        if (!selectedPool) {
          throw new Error('Please select a pool');
        }
        
        const details = poolDetails[selectedPool];
        if (!details) {
          throw new Error('Pool details not available');
        }
        
        if (details.protocol === 0 || details.protocol === 1) {
          // Aave V2 or V3
          txHash = await withdrawFromAave(toToken, amount);
        } else if (details.protocol === 2) {
          // Morpho Blue
          txHash = await withdrawFromMorphoBlue(selectedPool, amount);
        } else {
          txHash = await withdrawFromMorphoBlue(selectedPool, amount); // Default to Morpho for demo
        }
      } else if (interactionMode === 'swap') {
        if (useMultihop) {
          // Multi-hop swap
          const path = [fromToken, intermediateToken, toToken];
          const fees = [fee1, fee2];
          txHash = await swapTokensMultihop(path, fees, amount);
        } else {
          // Direct swap
          txHash = await swapTokens(fromToken, toToken, amount);
        }
      }
      
      setTransactionHash(txHash);
      setAmount('');
    } catch (error) {
      console.error('Transaction error:', error);
      setErrorMessage(error instanceof Error ? error.message : String(error));
    } finally {
      setIsProcessing(false);
    }
  };
  
  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {children}
      
      {/* Submit Button */}
      <button
        type="submit"
        disabled={isProcessing || !isConnected || (interactionMode !== 'swap' && !selectedPool)}
        className={`w-full py-3 px-4 rounded-md transition ${
          isProcessing ? 'bg-gray-400 text-white cursor-not-allowed' :
          !isConnected ? 'bg-gray-400 text-white cursor-not-allowed' :
          (interactionMode !== 'swap' && !selectedPool) ? 'bg-gray-400 text-white cursor-not-allowed' :
          'bg-blue-600 text-white hover:bg-blue-700'
        }`}
      >
        {isProcessing ? 'Processing...' : (
          !isConnected ? 'Connect Wallet to Continue' :
          (interactionMode !== 'swap' && !selectedPool) ? 'Select a Pool First' :
          interactionMode === 'deposit' ? 'Deposit' :
          interactionMode === 'withdraw' ? 'Withdraw' : 'Swap'
        )}
      </button>
    </form>
  );
};

export default TransactionForm;