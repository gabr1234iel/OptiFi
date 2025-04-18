import React, { useState, useEffect } from 'react';
import { useWallet } from '../hooks/useWallet';
import { 
  getAvailablePools,
  getPoolDetails,
  swapTokens,
  swapTokensMultihop,
  depositToAave,
  withdrawFromAave,
  depositToMorphoBlue,
  withdrawFromMorphoBlue,
  swapAndDeposit,
  swapMultihopAndDeposit
} from '../services/universalVaultService';

// Define token options
const TOKEN_OPTIONS = [
  // Stablecoins
  { symbol: 'USDC', name: 'USD Coin', category: 'stablecoin' },
  { symbol: 'USDT', name: 'Tether', category: 'stablecoin' },
  { symbol: 'DAI', name: 'Dai', category: 'stablecoin' },
  { symbol: 'PYUSD', name: 'PayPal USD', category: 'stablecoin' },
  { symbol: 'USDE', name: 'USDE', category: 'stablecoin' },
  { symbol: 'USDS', name: 'Sky USD', category: 'stablecoin' },
  
  // Ethereum derivatives
  { symbol: 'WETH', name: 'Wrapped Ether', category: 'eth-derivative' },
  { symbol: 'CBETH', name: 'Coinbase ETH', category: 'eth-derivative' },
  { symbol: 'STETH', name: 'Lido Staked ETH', category: 'eth-derivative' },
  { symbol: 'WSTETH', name: 'Wrapped Lido Staked ETH', category: 'eth-derivative' },
  { symbol: 'RETH', name: 'Rocket Pool ETH', category: 'eth-derivative' },
  { symbol: 'WEETH', name: 'Wrapped EigenLayer ETH', category: 'eth-derivative' },
  { symbol: 'ETHX', name: 'Stader ETHx', category: 'eth-derivative' },
  
  // Bitcoin derivatives
  { symbol: 'WBTC', name: 'Wrapped Bitcoin', category: 'btc-derivative' }
];

// Common pool fee options for Uniswap
const FEE_OPTIONS = [
  { value: 500, label: '0.05%' },
  { value: 3000, label: '0.3%' },
  { value: 10000, label: '1%' }
];

const UniversalVaultInteraction: React.FC = () => {
  const { isConnected } = useWallet();
  
  // State for interaction mode
  const [interactionMode, setInteractionMode] = useState<string>('deposit'); // 'deposit', 'withdraw', 'swap'
  
  // State for tokens
  const [fromToken, setFromToken] = useState<string>('USDC');
  const [toToken, setToToken] = useState<string>('WETH');
  
  // State for pool selection
  const [availablePools, setAvailablePools] = useState<string[]>([]);
  const [selectedPool, setSelectedPool] = useState<string>('');
  const [poolDetails, setPoolDetails] = useState<any>(null);
  
  // State for amount
  const [amount, setAmount] = useState<string>('');
  
  // State for swap path (for multihop)
  const [useMultihop, setUseMultihop] = useState<boolean>(false);
  const [intermediateToken, setIntermediateToken] = useState<string>('WETH');
  const [fee1, setFee1] = useState<number>(3000);
  const [fee2, setFee2] = useState<number>(3000);
  
  // State for transaction status
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [transactionHash, setTransactionHash] = useState<string>('');
  const [errorMessage, setErrorMessage] = useState<string>('');
  
  // Load available pools
  useEffect(() => {
    const loadPools = async () => {
      if (isConnected) {
        try {
          const pools = await getAvailablePools();
          setAvailablePools(pools);
          if (pools.length > 0) {
            setSelectedPool(pools[0]);
          }
        } catch (error) {
          console.error('Error loading pools:', error);
          setErrorMessage('Failed to load pools');
        }
      }
    };
    
    loadPools();
  }, [isConnected]);
  
  // Load pool details when selected pool changes
  useEffect(() => {
    const loadPoolDetails = async () => {
      if (selectedPool) {
        try {
          const details = await getPoolDetails(selectedPool);
          setPoolDetails(details);
          
          // Find token symbol from the underlying token address
          let tokenSymbol = '';
          for (const token of TOKEN_OPTIONS) {
            // This would need a mapping between symbols and addresses in a real implementation
            // For now, let's assume we have this information
            if (token.symbol === 'USDC' && details.underlyingToken.toLowerCase().includes('a0b86991')) {
              tokenSymbol = 'USDC';
              break;
            } else if (token.symbol === 'WETH' && details.underlyingToken.toLowerCase().includes('c02aaa39')) {
              tokenSymbol = 'WETH';
              break;
            }
            // Add more mappings as needed
          }
          
          if (tokenSymbol) {
            setToToken(tokenSymbol);
          }
        } catch (error) {
          console.error('Error loading pool details:', error);
          setPoolDetails(null);
        }
      }
    };
    
    loadPoolDetails();
  }, [selectedPool]);
  
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
        if (!selectedPool) {
          throw new Error('Please select a pool');
        }
        
        if (fromToken === toToken) {
          // Direct deposit without swap
          if (poolDetails.protocol === 'AAVE_V2' || poolDetails.protocol === 'AAVE_V3') {
            txHash = await depositToAave(fromToken, amount);
          } else if (poolDetails.protocol === 'MORPHO_BLUE') {
            txHash = await depositToMorphoBlue(selectedPool, amount);
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
        
        if (poolDetails.protocol === 'AAVE_V2' || poolDetails.protocol === 'AAVE_V3') {
          txHash = await withdrawFromAave(toToken, amount);
        } else if (poolDetails.protocol === 'MORPHO_BLUE') {
          txHash = await withdrawFromMorphoBlue(selectedPool, amount);
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
  
  // Group tokens by category for the dropdown
  const groupedTokenOptions = TOKEN_OPTIONS.reduce((groups, token) => {
    if (!groups[token.category]) {
      groups[token.category] = [];
    }
    groups[token.category].push(token);
    return groups;
  }, {} as Record<string, typeof TOKEN_OPTIONS>);
  
  return (
    <div className="bg-white rounded-xl shadow-md p-6 max-w-2xl mx-auto">
      <h2 className="text-2xl font-bold mb-6 text-black">Yield Optimizer</h2>
      
      {/* Interaction Mode Selector */}
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
          <button 
            onClick={() => setInteractionMode('swap')}
            className={`flex-1 py-2 px-4 rounded-md transition ${
              interactionMode === 'swap' 
                ? 'bg-blue-600 text-white' 
                : 'bg-gray-200 text-gray-800 hover:bg-gray-300'
            }`}
          >
            Swap Only
          </button>
        </div>
      </div>
      
      <form onSubmit={handleSubmit}>
        {/* Pool Selection (for deposit/withdraw) */}
        {interactionMode !== 'swap' && (
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Select Pool
            </label>
            <select
              value={selectedPool}
              onChange={(e) => setSelectedPool(e.target.value)}
              className="w-full p-2 border border-gray-300 rounded-md text-gray-700"
              required
            >
              <option value="">Select a pool</option>
              {availablePools.map((pool) => (
                <option key={pool} value={pool}>
                  {pool}
                </option>
              ))}
            </select>
            
            {poolDetails && (
              <div className="mt-2 text-sm text-gray-600">
                <p>Protocol: {poolDetails.protocol}</p>
                <p>Underlying Token: {toToken}</p>
              </div>
            )}
          </div>
        )}
        
        {/* Token Selection */}
        <div className="mb-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* From Token (for deposit or swap) */}
            {interactionMode !== 'withdraw' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  From Token
                </label>
                <select
                  value={fromToken}
                  onChange={(e) => setFromToken(e.target.value)}
                  className="w-full p-2 border border-gray-300 rounded-md text-gray-700"
                  required
                >
                  {Object.entries(groupedTokenOptions).map(([category, tokens]) => (
                    <optgroup key={category} label={category.charAt(0).toUpperCase() + category.slice(1)}>
                      {tokens.map((token) => (
                        <option key={token.symbol} value={token.symbol}>
                          {token.symbol} - {token.name}
                        </option>
                      ))}
                    </optgroup>
                  ))}
                </select>
              </div>
            )}
            
            {/* To Token (for swap or showing target for deposit) */}
            {interactionMode === 'swap' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  To Token
                </label>
                <select
                  value={toToken}
                  onChange={(e) => setToToken(e.target.value)}
                  className="w-full p-2 border border-gray-300 rounded-md text-gray-700"
                  required
                >
                  {Object.entries(groupedTokenOptions).map(([category, tokens]) => (
                    <optgroup key={category} label={category.charAt(0).toUpperCase() + category.slice(1)}>
                      {tokens.map((token) => (
                        <option key={token.symbol} value={token.symbol}>
                          {token.symbol} - {token.name}
                        </option>
                      ))}
                    </optgroup>
                  ))}
                </select>
              </div>
            )}
          </div>
        </div>
        
        {/* Amount Input */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Amount
          </label>
          <input
            type="number"
            step="0.000001"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            className="w-full p-2 border border-gray-300 rounded-md text-gray-700"
            placeholder={`Enter amount in ${interactionMode !== 'withdraw' ? fromToken : toToken}`}
            required
          />
        </div>
        
        {/* Multihop Options (for swap or deposit with swap) */}
        {(interactionMode === 'swap' || (interactionMode === 'deposit' && fromToken !== toToken)) && (
          <div className="mb-4">
            <div className="flex items-center mb-2">
              <input
                type="checkbox"
                id="useMultihop"
                checked={useMultihop}
                onChange={(e) => setUseMultihop(e.target.checked)}
                className="mr-2"
              />
              <label htmlFor="useMultihop" className="text-sm font-medium text-gray-700">
                Use Multi-hop Swap (better rates for some pairs)
              </label>
            </div>
            
            {useMultihop && (
              <div className="pl-6 border-l-2 border-gray-200 mt-2">
                <div className="mb-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Intermediate Token
                  </label>
                  <select
                    value={intermediateToken}
                    onChange={(e) => setIntermediateToken(e.target.value)}
                    className="w-full p-2 border border-gray-300 text-gray-700 rounded-md"
                  >
                    {Object.entries(groupedTokenOptions).map(([category, tokens]) => (
                      <optgroup key={category} label={category.charAt(0).toUpperCase() + category.slice(1)}>
                        {tokens.map((token) => (
                          <option key={token.symbol} value={token.symbol}>
                            {token.symbol} - {token.name}
                          </option>
                        ))}
                      </optgroup>
                    ))}
                  </select>
                </div>
                
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      First Hop Fee
                    </label>
                    <select
                      value={fee1}
                      onChange={(e) => setFee1(parseInt(e.target.value))}
                      className="w-full p-2 border border-gray-300 text-gray-700 rounded-md"
                    >
                      {FEE_OPTIONS.map((fee) => (
                        <option key={fee.value} value={fee.value}>
                          {fee.label}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Second Hop Fee
                    </label>
                    <select
                      value={fee2}
                      onChange={(e) => setFee2(parseInt(e.target.value))}
                      className="w-full p-2 border border-gray-300 text-gray-700 rounded-md"
                    >
                      {FEE_OPTIONS.map((fee) => (
                        <option key={fee.value} value={fee.value}>
                          {fee.label}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
        
        {/* Submit Button */}
        <button
          type="submit"
          disabled={isProcessing || !isConnected}
          className="w-full bg-blue-600 text-white py-3 px-4 rounded-md hover:bg-blue-700 transition disabled:bg-gray-400"
        >
          {isProcessing ? 'Processing...' : (
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