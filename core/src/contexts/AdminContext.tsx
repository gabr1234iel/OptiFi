"use client";
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { ethers } from 'ethers';
import {
  getAvailablePools,
  getPoolDetails,
  getTotalBalance,
  getTokenAdapter,
  ADAPTER_ADDRESSES,
  PROTOCOL_ENUM,
} from '../services/universalVaultService';
import { useWallet } from '../hooks/useWallet';
import { 
  AdminContextType, 
  TokenInfo, 
  Protocol, 
  AdapterMap, 
  PoolDetails, 
  TVLData, 
  TokenPriceMap
} from '../types/admin';

// Token data
const TOKENS: TokenInfo[] = [
  { symbol: 'USDC', address: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48', decimals: 6, coingeckoId: 'usd-coin' },
  { symbol: 'USDT', address: '0xdAC17F958D2ee523a2206206994597C13D831ec7', decimals: 6, coingeckoId: 'tether' },
  { symbol: 'DAI', address: '0x6B175474E89094C44Da98b954EedeAC495271d0F', decimals: 18, coingeckoId: 'dai' },
  { symbol: 'WETH', address: '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2', decimals: 18, coingeckoId: 'weth' },
  { symbol: 'WSTETH', address: '0x7f39C581F595B53c5cb19bD0b3f8dA6c935E2Ca0', decimals: 18, coingeckoId: 'wrapped-staked-ether' },
  { symbol: 'WBTC', address: '0x2260FAC5E5542a773Aa44fBCfeDf7C193bc2C599', decimals: 8, coingeckoId: 'wrapped-bitcoin' },
  { symbol: 'PYUSD', address: '0x6c3ea9036406852006290770bedfcaba0e23a0e8', decimals: 18, coingeckoId: 'paypal-usd' },
  { symbol: 'USDE', address: '0x4c9EDD5852cd905f086C759E8383e09bff1E68B3', decimals: 18, coingeckoId: 'usde' },
  { symbol: 'USDS', address: '0xdC035D45d973E3EC169d2276DDab16f1e407384F', decimals: 18, coingeckoId: 'usds' },
  { symbol: 'CBETH', address: '0xBe9895146f7AF43049ca1c1AE358B0541Ea49704', decimals: 18, coingeckoId: 'coinbase-wrapped-staked-eth' },
  { symbol: 'STETH', address: '0xae7ab96520de3a18e5e111b5eaab095312d7fe84', decimals: 18, coingeckoId: 'staked-ether' },
  { symbol: 'RETH', address: '0xae78736Cd615f374D3085123A210448E74Fc6393', decimals: 18, coingeckoId: 'rocket-pool-eth' },
];

// Protocol data
const PROTOCOLS: Protocol[] = [
  { id: 0, name: 'AAVE_V2', displayName: 'Aave V2' },
  { id: 1, name: 'AAVE_V3', displayName: 'Aave V3' },
  { id: 2, name: 'METAMORPHO', displayName: 'Morpho Blue' },
  { id: 3, name: 'COMPOUND_V2', displayName: 'Compound V2' },
  { id: 4, name: 'COMPOUND_V3', displayName: 'Compound V3' },
  { id: 5, name: 'EULER_V2', displayName: 'Euler V2' },
  { id: 6, name: 'FLUID', displayName: 'Fluid Protocol' },
  { id: 7, name: 'SKYLENDING', displayName: 'Sky Lending' },
  { id: 8, name: 'SPARKLENDING', displayName: 'Spark Lending' },
];

// CoinGecko API URL
const COINGECKO_API_URL = "https://api.coingecko.com/api/v3";

// Create context with default values
const AdminContext = createContext<AdminContextType>({
  tokens: TOKENS,
  protocols: PROTOCOLS,
  adapters: {},
  pools: [],
  tvlData: { total: "0.00", byToken: {} },
  tokenPrices: {},
  totalUsers: 0,
  isLoading: false,
  statusMessage: '',
  isError: false,
  setStatusMessage: () => {},
  refreshData: async () => {},
});

export function useAdmin() {
  return useContext(AdminContext);
}

interface AdminProviderProps {
  children: ReactNode;
}

export function AdminProvider({ children }: AdminProviderProps) {
  const { isConnected, account } = useWallet();
  const [adapters, setAdapters] = useState<AdapterMap>({});
  const [pools, setPools] = useState<PoolDetails[]>([]);
  const [tvlData, setTvlData] = useState<TVLData>({ total: "0.00", byToken: {} });
  const [tokenPrices, setTokenPrices] = useState<TokenPriceMap>({});
  const [totalUsers, setTotalUsers] = useState<number>(0);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [statusMessage, setStatusMessage] = useState<string>('');
  const [isError, setIsError] = useState<boolean>(false);

  // Helper function to set status message
  const handleSetStatusMessage = (message: string, error: boolean = false) => {
    setStatusMessage(message);
    setIsError(error);
    
    // Auto-clear success messages after 5 seconds
    if (!error && message) {
      setTimeout(() => {
        setStatusMessage('');
      }, 5000);
    }
  };

  // Fetch token prices from CoinGecko
  const fetchTokenPrices = async () => {
    try {
      // Get list of token IDs
      const tokenIds = TOKENS.map(t => t.coingeckoId).join(",");
      
      // Fetch prices
      const response = await fetch(
        `${COINGECKO_API_URL}/simple/price?ids=${tokenIds}&vs_currencies=usd`
      );
      
      if (!response.ok) {
        throw new Error("Failed to fetch token prices");
      }
      
      const data = await response.json();
      
      // Convert to our format
      const prices: TokenPriceMap = {};
      for (const token of TOKENS) {
        if (data[token.coingeckoId]?.usd) {
          prices[token.symbol] = data[token.coingeckoId].usd;
        }
      }
      
      setTokenPrices(prices);
      return prices;
    } catch (error) {
      console.error("Error fetching token prices:", error);
      
      // Fallback to stable values
      const fallbackPrices: TokenPriceMap = {};
      TOKENS.forEach(token => {
        if (token.symbol === 'USDC' || token.symbol === 'USDT' || token.symbol === 'DAI' || 
            token.symbol === 'PYUSD' || token.symbol === 'USDE' || token.symbol === 'USDS') {
          fallbackPrices[token.symbol] = 1;
        } else if (token.symbol.includes('ETH')) {
          fallbackPrices[token.symbol] = 3500;
        } else if (token.symbol.includes('BTC')) {
          fallbackPrices[token.symbol] = 65000;
        } else {
          fallbackPrices[token.symbol] = 10; // Default fallback
        }
      });
      
      setTokenPrices(fallbackPrices);
      return fallbackPrices;
    }
  };

  // Fetch TVL data
  const fetchTVL = async (prices: TokenPriceMap) => {
    try {
      const totalByToken: Record<string, string> = {};
      let totalValueUsd = 0;

      // For each token, get total balance and convert to USD
      for (const token of TOKENS) {
        try {
          const balance = await getTotalBalance(token.address);
          const tokenPrice = prices[token.symbol] || 0;
          
          // Format the balance and calculate USD value
          const formattedBalance = ethers.utils.formatUnits(balance, token.decimals);
          
          const balanceNum = parseFloat(formattedBalance);
          const valueUsd = balanceNum * tokenPrice;
          
          if (valueUsd > 0) {
            totalByToken[token.symbol] = valueUsd.toLocaleString('en-US', {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2
            });
            
            totalValueUsd += valueUsd;
          }
        } catch (error) {
          console.error(`Error fetching balance for ${token.symbol}:`, error);
        }
      }

      // Set the TVL data
      setTvlData({
        total: totalValueUsd.toLocaleString('en-US', {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2
        }),
        byToken: totalByToken
      });
    } catch (error) {
      console.error('Error calculating TVL:', error);
    }
  };

  // Load adapters for each token
  const loadAdapters = async () => {
    const adapters: AdapterMap = {};

    for (const token of TOKENS) {
      try {
        const adapterAddress = await getTokenAdapter(token.symbol);
        if (adapterAddress && adapterAddress !== '0x0000000000000000000000000000000000000000') {
          adapters[token.symbol] = adapterAddress;

          // Identify which protocol this adapter corresponds to
          for (const [protocolName, protocolAdapter] of Object.entries(ADAPTER_ADDRESSES)) {
            if (protocolAdapter.toLowerCase() === adapterAddress.toLowerCase()) {
              adapters[`${token.symbol}_PROTOCOL`] = protocolName;
              break;
            }
          }
        }
      } catch (error) {
        console.error(`Error fetching adapter for ${token.symbol}:`, error);
      }
    }

    setAdapters(adapters);
  };

  // Load pool data
  const loadPools = async () => {
    try {
      // Get available pools
      const poolNames = await getAvailablePools();
      
      // Get details for each pool
      const poolsData: PoolDetails[] = [];
      
      for (const poolName of poolNames) {
        try {
          const details = await getPoolDetails(poolName);
          
          poolsData.push({
            poolName,
            poolAddress: details.poolAddress || '',
            underlyingToken: details.underlyingToken || '',
            protocol: details.protocol || 0,
            apy: details.apy || 0,
            // Default to lending type
            type: 'lending'
          });
        } catch (error) {
          console.error(`Failed to load details for pool ${poolName}:`, error);
        }
      }
      
      setPools(poolsData);
    } catch (error) {
      console.error('Failed to load pools:', error);
      handleSetStatusMessage('Failed to load pools data', true);
    }
  };

  // Refresh all data
  const refreshData = async () => {
    if (!isConnected) return;
    
    setIsLoading(true);
    try {
      // Fetch token prices first since other functions depend on them
      const prices = await fetchTokenPrices();
      
      // Fetch all other data in parallel
      await Promise.all([
        fetchTVL(prices),
        loadAdapters(),
        loadPools(),
      ]);
      
      // Set mock total users (in a real app, you'd query this from contract events)
      setTotalUsers(Math.floor(Math.random() * 50) + 10);
      
    } catch (error) {
      console.error('Error refreshing data:', error);
      handleSetStatusMessage('Error refreshing data', true);
    } finally {
      setIsLoading(false);
    }
  };

  // Load data when connected
  useEffect(() => {
    if (isConnected) {
      refreshData();
    }
  }, [isConnected]);

  // Context value
  const value: AdminContextType = {
    tokens: TOKENS,
    protocols: PROTOCOLS,
    adapters,
    pools,
    tvlData,
    tokenPrices,
    totalUsers,
    isLoading,
    statusMessage,
    isError,
    setStatusMessage: handleSetStatusMessage,
    refreshData,
  };

  return (
    <AdminContext.Provider value={value}>
      {children}
    </AdminContext.Provider>
  );
}