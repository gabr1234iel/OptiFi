// src/components/UniversalVaultInteraction.tsx
import React, { useState, useEffect } from 'react';
import { useWallet } from '../hooks/useWallet';
import VaultActionTabs from './vault/VaultActionTabs';
import PoolSelector from './vault/PoolSelector';
import TokenSelector from './vault/TokenSelector';
import SwapSettings from './vault/SwapSettings';
import TransactionForm from './vault/TransactionForm';
import ProtocolComparisonTable from './vault/ProtocolComparisonTable';
import { getAvailablePools, getPoolDetails } from '../services/universalVaultService';

interface PoolDetailsType {
  poolAddress: string;
  underlyingToken: string;
  protocol: number;
  apy?: number; // APY in basis points
}

const UniversalVaultInteraction: React.FC = () => {
  const { isConnected } = useWallet();
  
  // State for interaction mode
  const [interactionMode, setInteractionMode] = useState<string>('deposit'); // 'deposit', 'withdraw', 'swap'
  
  // State for tokens
  const [fromToken, setFromToken] = useState<string>('USDC');
  const [toToken, setToToken] = useState<string>('WETH');
  
  // State for pool selection
  const [availablePools, setAvailablePools] = useState<string[]>([]);
  const [filterPoolsByToken, setFilterPoolsByToken] = useState<boolean>(true);
  const [filteredPools, setFilteredPools] = useState<string[]>([]);
  const [selectedPool, setSelectedPool] = useState<string>('');
  const [poolDetails, setPoolDetails] = useState<Record<string, PoolDetailsType>>({});
  
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
  
  // State for protocol comparison
  const [showProtocolComparison, setShowProtocolComparison] = useState<boolean>(false);
  
  // Load available pools
  useEffect(() => {
    const loadPools = async () => {
      if (isConnected) {
        try {
          const pools = await getAvailablePools();
          setAvailablePools(pools);
          
          // Load details for each pool
          const details: Record<string, PoolDetailsType> = {};
          for (const pool of pools) {
            const poolDetail = await getPoolDetails(pool);
            details[pool] = {
              ...poolDetail,
              protocol: Number(poolDetail.protocol), // Convert protocol to number
            };
            
            // Add mock APY data (in a real app, this would come from the contract)
            details[pool].apy = Math.floor(Math.random() * 1000) + 100; // Random APY between 1% and 11%
          }
          
          setPoolDetails(details);
          
          // Set initially filtered pools
          filterPools(pools, details, toToken, filterPoolsByToken);
          
        } catch (error) {
          console.error('Error loading pools:', error);
          setErrorMessage('Failed to load pools');
        }
      }
    };
    
    loadPools();
  }, [isConnected]);
  
  // Filter pools when token or filter option changes
  useEffect(() => {
    filterPools(availablePools, poolDetails, toToken, filterPoolsByToken);
  }, [toToken, filterPoolsByToken, availablePools, poolDetails]);
  
  // Function to filter pools based on token and filter option
  const filterPools = (
    pools: string[], 
    details: Record<string, PoolDetailsType>, 
    tokenSymbol: string, 
    shouldFilter: boolean
  ) => {
    if (!shouldFilter) {
      setFilteredPools(pools);
      if (pools.length > 0 && !selectedPool) {
        setSelectedPool(pools[0]);
      }
      return;
    }
    
    // Filter pools by underlying token
    const filtered = pools.filter(pool => {
      const poolDetail = details[pool];
      if (!poolDetail) return false;
      
      // In a real app, compare actual addresses
      // Here we're simplifying by just checking if the pool name contains the token symbol
      return pool.includes(tokenSymbol);
    });
    
    setFilteredPools(filtered);
    
    // Auto-select the first filtered pool if there are results and none is selected
    if (filtered.length > 0 && (!selectedPool || !filtered.includes(selectedPool))) {
      setSelectedPool(filtered[0]);
    } else if (filtered.length === 0) {
      setSelectedPool('');
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
      <TransactionForm
        isConnected={isConnected}
        interactionMode={interactionMode}
        fromToken={fromToken}
        toToken={toToken}
        amount={amount}
        selectedPool={selectedPool}
        poolDetails={poolDetails}
        useMultihop={useMultihop}
        intermediateToken={intermediateToken}
        fee1={fee1}
        fee2={fee2}
        isProcessing={isProcessing}
        setIsProcessing={setIsProcessing}
        setTransactionHash={setTransactionHash}
        setErrorMessage={setErrorMessage}
        setAmount={setAmount}
      >
        {/* Protocol Comparison Toggle */}
        {interactionMode === 'deposit' && (
          <button 
            type="button"
            onClick={() => setShowProtocolComparison(!showProtocolComparison)}
            className="text-blue-600 hover:text-blue-800 text-sm font-medium flex items-center mb-4"
          >
            {showProtocolComparison ? 'Hide' : 'Show'} Protocol Comparison
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 ml-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>
        )}
        
        {/* Protocol Comparison Table */}
        {showProtocolComparison && interactionMode === 'deposit' && (
          <ProtocolComparisonTable 
            onSelectProtocol={(protocol) => {
              // Find a pool for this protocol and select it
              const poolsForProtocol = Object.entries(poolDetails)
                .filter(([_, details]) => details.protocol === protocol)
                .map(([poolName]) => poolName);
              
              if (poolsForProtocol.length > 0) {
                setSelectedPool(poolsForProtocol[0]);
              }
            }} 
          />
        )}
        
        {/* Pool Selection (for deposit/withdraw) */}
        {interactionMode !== 'swap' && (
          <PoolSelector
            filteredPools={filteredPools}
            selectedPool={selectedPool}
            poolDetails={poolDetails}
            onSelectPool={setSelectedPool}
            filterPoolsByToken={filterPoolsByToken}
            onToggleFilter={() => setFilterPoolsByToken(!filterPoolsByToken)}
          />
        )}
        
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
                onClick={() => setAmount('100')} // Example - in a real app would set to max balance
              >
                MAX
              </button>
            </div>
          </div>
        </div>
        
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
      </TransactionForm>
      
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