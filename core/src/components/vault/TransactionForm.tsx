import React from 'react';
import { 
  swapTokens,
  swapTokensMultihop,
  deposit,
  withdraw,
  depositToMorphoBlue,
  withdrawFromMorphoBlue,
  swapAndDeposit,
  swapMultihopAndDeposit,
  depositToAave,
  withdrawFromAave,
  getPoolNameForTokenAndProtocol,
  PROTOCOL_ENUM
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
        if (!selectedPool && toToken) {
          // If no pool selected but token is selected, find one
          const autoPoolName = getPoolNameForTokenAndProtocol(toToken, PROTOCOL_ENUM.AAVE_V3) || 
                              getPoolNameForTokenAndProtocol(toToken, PROTOCOL_ENUM.MORPHO_BLUE);
          
          if (!autoPoolName) {
            throw new Error('Please select a pool or a supported token');
          }
          
          console.log(`Auto-selected pool: ${autoPoolName} for ${toToken}`);
        }
        
        if (fromToken === toToken) {
          // Direct deposit without swap
          const details = poolDetails[selectedPool];
          
          if (details) {
            // Use specific protocol deposit logic
            if (details.protocol === PROTOCOL_ENUM.AAVE_V2 || details.protocol === PROTOCOL_ENUM.AAVE_V3) {
              console.log(`Depositing ${amount} ${fromToken} to Aave`);
              txHash = await depositToAave(fromToken, amount);
            } else if (details.protocol === PROTOCOL_ENUM.MORPHO_BLUE) {
              console.log(`Depositing ${amount} ${fromToken} to Morpho Blue pool ${selectedPool}`);
              txHash = await depositToMorphoBlue(selectedPool, amount);
            } else {
              // Default deposit logic for other protocols
              console.log(`Depositing ${amount} ${fromToken} to vault`);
              txHash = await deposit(fromToken, amount);
            }
          } else {
            // If no pool details, use generic deposit
            console.log(`Depositing ${amount} ${fromToken} to vault`);
            txHash = await deposit(fromToken, amount);
          }
        } else {
          // Swap and deposit
          if (useMultihop) {
            // Multi-hop swap and deposit
            console.log(`Swapping ${amount} ${fromToken} to ${toToken} via ${intermediateToken} and depositing`);
            const path = [fromToken, intermediateToken, toToken];
            const fees = [fee1, fee2];
            txHash = await swapMultihopAndDeposit(path, fees, selectedPool, amount);
          } else {
            // Direct swap and deposit
            console.log(`Swapping ${amount} ${fromToken} to ${toToken} and depositing`);
            txHash = await swapAndDeposit(fromToken, selectedPool, amount);
          }
        }
      } else if (interactionMode === 'withdraw') {
        if (!selectedPool) {
          throw new Error('Please select a pool');
        }
        
        const details = poolDetails[selectedPool];
        
        if (details) {
          // Use specific protocol withdrawal logic
          if (details.protocol === PROTOCOL_ENUM.AAVE_V2 || details.protocol === PROTOCOL_ENUM.AAVE_V3) {
            console.log(`Withdrawing ${amount} ${toToken} from Aave`);
            txHash = await withdrawFromAave(toToken, amount);
          } else if (details.protocol === PROTOCOL_ENUM.MORPHO_BLUE) {
            console.log(`Withdrawing ${amount} ${toToken} from Morpho Blue pool ${selectedPool}`);
            txHash = await withdrawFromMorphoBlue(selectedPool, amount);
          } else {
            // Default withdrawal logic for other protocols
            console.log(`Withdrawing ${amount} ${toToken} from vault`);
            txHash = await withdraw(toToken, amount);
          }
        } else {
          // If no pool details, use generic withdrawal
          console.log(`Withdrawing ${amount} ${toToken} from vault`);
          txHash = await withdraw(toToken, amount);
        }
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