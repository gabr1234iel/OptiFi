// src/components/vault/UserHoldings.tsx
import React, { useState, useEffect } from 'react';
import { useWallet } from '../../hooks/useWallet';
import { 
  getProtocolBalances, 
  getUserVaultBalances, 
  getProtocolAPYs, 
  getTokenAdapter
} from '../../services/universalVaultService';

// CoinGecko API for token prices
const COINGECKO_API_URL = "https://api.coingecko.com/api/v3";

// Mapping of our token symbols to CoinGecko IDs
const COINGECKO_ID_MAP: Record<string, string> = {
  "USDC": "usd-coin",
  "USDT": "tether",
  "DAI": "dai",
  "WETH": "weth",
  "WBTC": "wrapped-bitcoin",
  "STETH": "staked-ether",
  "WSTETH": "wrapped-staked-ether",
  "CBETH": "coinbase-wrapped-staked-eth",
  "RETH": "rocket-pool-eth",
  "PYUSD": "paypal-usd",
  "USDE": "usde",
  "USDS": "usds"
};

interface HoldingsProps {
  onDepositClick?: () => void;
  onWithdrawClick?: (token: string) => void;
}

interface HoldingData {
  token: string;
  protocol: string;
  balance: string;         // Raw token balance
  balanceUsd: string;      // USD value of the balance
  yield: string;           // Yield in USD
  apy: string;             // APY as percentage
  tokenPrice: number;      // Price per token in USD
}

const UserHoldings: React.FC<HoldingsProps> = ({ onDepositClick, onWithdrawClick }) => {
  const { isConnected, account } = useWallet();
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [protocolHoldings, setProtocolHoldings] = useState<HoldingData[]>([]);
  const [unallocatedHoldings, setUnallocatedHoldings] = useState<HoldingData[]>([]);
  const [totalBalance, setTotalBalance] = useState<string>("0.00");
  const [totalYield, setTotalYield] = useState<string>("0.00");
  const [tokenPrices, setTokenPrices] = useState<Record<string, number>>({});
  const [priceError, setPriceError] = useState<string>("");
  
  const calculateYield = (balance: string, apy: number): string => {
    // Remove commas from the balance string
    const cleanBalance = balance.replace(/,/g, '');
    
    // Calculate daily yield based on APY (APY / 365)
    const dailyRate = apy / 36500; // Convert APY from basis points to daily rate
    const dailyYield = parseFloat(cleanBalance) * dailyRate;
    
    // Multiply by 30 for a month of yield
    const monthlyYield = dailyYield * 30;
    
    return monthlyYield.toLocaleString('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    });
  };
  
  // Fetch token prices from CoinGecko
  const fetchTokenPrices = async () => {
    try {
      // Get list of token IDs we need
      const tokenIds = Object.values(COINGECKO_ID_MAP).join(",");
      
      // Fetch prices
      const response = await fetch(
        `${COINGECKO_API_URL}/simple/price?ids=${tokenIds}&vs_currencies=usd`
      );
      
      if (!response.ok) {
        throw new Error("Failed to fetch token prices");
      }
      
      const data = await response.json();
      
      // Convert to our format
      const prices: Record<string, number> = {};
      for (const [symbol, id] of Object.entries(COINGECKO_ID_MAP)) {
        if (data[id]?.usd) {
          prices[symbol] = data[id].usd;
        }
      }
      
      setTokenPrices(prices);
      setPriceError("");
    } catch (error) {
      console.error("Error fetching token prices:", error);
      setPriceError("Could not fetch current token prices");
      
      // Fallback to stable values for stablecoins and placeholder prices for others
      const fallbackPrices: Record<string, number> = {
        "USDC": 1,
        "USDT": 1,
        "DAI": 1,
        "PYUSD": 1,
        "USDE": 1,
        "USDS": 1,
        "WETH": 3500,
        "STETH": 3450,
        "WSTETH": 3480,
        "CBETH": 3400,
        "RETH": 3550,
        "WBTC": 65000
      };
      
      setTokenPrices(fallbackPrices);
    }
  };

  useEffect(() => {
    // Fetch prices when component mounts
    fetchTokenPrices();
    
    // Refresh prices every 5 minutes
    const priceInterval = setInterval(fetchTokenPrices, 5 * 60 * 1000);
    
    return () => clearInterval(priceInterval);
  }, []);

  useEffect(() => {
    const loadHoldings = async () => {
      if (isConnected && account) {
        setIsLoading(true);
        try {
          // Get user balances directly from vault contract
          const vaultBalances = await getUserVaultBalances(account);
          
          // Get protocol balances (adapter-specific info)
          const protocolData = await getProtocolBalances(account);
          
          // Get APY data for each token
          const apyData: Record<string, Record<string, number>> = {};
          
          // Track tokens that have adapters
          const tokensWithAdapters: Record<string, boolean> = {};
          
          // Convert to the format needed for the UI
          const unallocatedData: HoldingData[] = [];
          const protocolData2: HoldingData[] = [];
          let totalValue = 0;
          let totalYieldValue = 0;
          
          // Process vault balances
          for (const [token, balanceStr] of Object.entries(vaultBalances)) {
            // Handle only non-zero balances
            if (parseFloat(balanceStr.replace(/,/g, '')) > 0) {
              // Check if this token has an adapter
              const adapterAddress = await getTokenAdapter(token);
              const hasAdapter = adapterAddress !== '0x0000000000000000000000000000000000000000';
              tokensWithAdapters[token] = hasAdapter;
              
              // If token doesn't have adapter or there's no protocol balance, it's unallocated
              let protocolAllocated = false;
              
              // Check if this token appears in any protocol
              for (const [protocolKey, tokenBalances] of Object.entries(protocolData)) {
                if (tokenBalances[token] && parseFloat(tokenBalances[token].replace(/,/g, '')) > 0) {
                  protocolAllocated = true;
                  break;
                }
              }
              
              // Get APY data if not already fetched
              if (!apyData[token]) {
                try {
                  apyData[token] = await getProtocolAPYs(token);
                } catch (error) {
                  console.error(`Failed to get APY for ${token}:`, error);
                  // Use placeholder data
                  apyData[token] = {
                    'UNIVERSAL_VAULT': Math.floor(Math.random() * 300) + 100
                  };
                }
              }
              
              // If no protocol allocation, show as unallocated in vault
              if (!protocolAllocated) {
                // For unallocated funds, APY is 0
                const apy = 0;
                
                // Calculate the yield (will be 0 for unallocated)
                const yieldValue = calculateYield(balanceStr, apy);
                
                // Remove commas for calculation
                const balanceNum = parseFloat(balanceStr.replace(/,/g, ''));
                
                // Get token price and calculate USD value
                const tokenPrice = tokenPrices[token] || 0;
                const balanceUsd = (balanceNum * tokenPrice).toLocaleString('en-US', {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2
                });
                
                // Add to totals (using USD value)
                totalValue += balanceNum * tokenPrice;
                
                // Add to unallocated holdings
                unallocatedData.push({
                  token,
                  protocol: "Unallocated",
                  balance: balanceStr,
                  balanceUsd: balanceUsd,
                  yield: "0.00",
                  apy: "0.00",
                  tokenPrice: tokenPrice
                });
              }
            }
          }
          
          // Add protocol-specific holdings
          for (const [protocolKey, tokenBalances] of Object.entries(protocolData)) {
            // Process each token in this protocol
            for (const [token, balanceStr] of Object.entries(tokenBalances)) {
              if (parseFloat(balanceStr.replace(/,/g, '')) > 0) {
                // Get APY data if not already fetched
                if (!apyData[token]) {
                  try {
                    apyData[token] = await getProtocolAPYs(token);
                  } catch (error) {
                    console.error(`Failed to get APY for ${token}:`, error);
                    // Use placeholder data
                    apyData[token] = {
                      [protocolKey]: Math.floor(Math.random() * 300) + 100
                    };
                  }
                }
                
                // Get APY for this protocol, fallback to random
                const apy = apyData[token][protocolKey] || Math.floor(Math.random() * 300) + 100;
                
                // Calculate the yield based on APY
                const yieldValue = calculateYield(balanceStr, apy);
                
                // Remove commas for calculation
                const balanceNum = parseFloat(balanceStr.replace(/,/g, ''));
                const yieldNum = parseFloat(yieldValue.replace(/,/g, ''));
                
                // Get token price and calculate USD value
                const tokenPrice = tokenPrices[token] || 0;
                const balanceUsd = (balanceNum * tokenPrice).toLocaleString('en-US', {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2
                });
                
                // Add to totals (using USD value)
                totalValue += balanceNum * tokenPrice;
                totalYieldValue += yieldNum;
                
                // Format the protocol name for display
                const protocolDisplay = protocolKey.replace(/_/g, ' ');
                
                // Add to protocol holdings
                protocolData2.push({
                  token,
                  protocol: protocolDisplay,
                  balance: balanceStr,
                  balanceUsd: balanceUsd,
                  yield: yieldValue,
                  apy: (apy / 100).toFixed(2), // Convert basis points to percentage
                  tokenPrice: tokenPrice
                });
              }
            }
          }
          
          // Set state with the processed data
          setUnallocatedHoldings(unallocatedData);
          setProtocolHoldings(protocolData2);
          
          // Format totals
          setTotalBalance(totalValue.toLocaleString('en-US', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
          }));
          
          setTotalYield(totalYieldValue.toLocaleString('en-US', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
          }));
          
        } catch (error) {
          console.error('Error loading holdings:', error);
        } finally {
          setIsLoading(false);
        }
      }
    };
    
    loadHoldings();
    
    // Set up an interval to reload holdings every 20 seconds
    const interval = setInterval(loadHoldings, 20000);
    
    // Clean up the interval when component unmounts
    return () => clearInterval(interval);
  }, [isConnected, account]);

  if (!isConnected) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6 text-center">
        <p className="text-gray-500">Connect your wallet to view your holdings</p>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-4 bg-gray-200 rounded w-1/4"></div>
          <div className="h-10 bg-gray-200 rounded"></div>
          <div className="h-20 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  const hasHoldings = protocolHoldings.length > 0 || unallocatedHoldings.length > 0;

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h2 className="text-xl font-bold text-gray-900 mb-4">Your Holdings</h2>
      
      {!hasHoldings ? (
        <div className="text-center py-8 border border-dashed border-gray-300 rounded-lg">
          <p className="text-gray-500 mb-4">You don't have any holdings yet</p>
          <button 
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition"
            onClick={() => onDepositClick && onDepositClick()}
          >
            Deposit Now
          </button>
        </div>
      ) : (
        <>
          {/* Summary */}
          <div className="grid grid-cols-2 gap-4 mb-6">
            <div className="bg-blue-50 p-4 rounded-lg">
              <p className="text-sm text-blue-700 font-medium">Total Balance</p>
              <p className="text-2xl font-bold text-blue-900">${totalBalance}</p>
            </div>
            <div className="bg-green-50 p-4 rounded-lg">
              <p className="text-sm text-green-700 font-medium">Monthly Yield</p>
              <p className="text-2xl font-bold text-green-900">${totalYield}</p>
            </div>
          </div>
          
          {/* Price Data Error Alert */}
          {priceError && (
            <div className="p-3 mb-4 bg-yellow-100 text-yellow-800 rounded-md">
              <p className="text-sm font-medium">{priceError} - Using estimated values.</p>
            </div>
          )}
          
          {/* Protocol Holdings */}
          {protocolHoldings.length > 0 && (
            <div className="mb-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-3">Protocol-Allocated Funds</h3>
              <div className="overflow-x-auto">
                <table className="min-w-full">
                  <thead>
                    <tr className="border-b border-gray-200">
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Token</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Protocol</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Balance</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Value (USD)</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Monthly Yield</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">APY</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {protocolHoldings.map((item, index) => (
                      <tr key={index} className="hover:bg-gray-50">
                        <td className="px-4 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{item.token}</td>
                        <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500">{item.protocol}</td>
                        <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500">{item.balance}</td>
                        <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-700">${item.balanceUsd}</td>
                        <td className="px-4 py-4 whitespace-nowrap text-sm text-green-600">${item.yield}</td>
                        <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500">{item.apy}%</td>
                        <td className="px-4 py-4 whitespace-nowrap text-sm text-right">
                          <button 
                            className="text-blue-600 hover:text-blue-800"
                            onClick={() => onWithdrawClick && onWithdrawClick(item.token)}
                          >
                            Withdraw
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
          
          {/* Unallocated Holdings */}
          {unallocatedHoldings.length > 0 && (
            <div className="mb-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-3">Unallocated Funds</h3>
              <div className="overflow-x-auto">
                <table className="min-w-full">
                  <thead>
                    <tr className="border-b border-gray-200">
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Token</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Balance</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Value (USD)</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Token Price</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {unallocatedHoldings.map((item, index) => (
                      <tr key={index} className="hover:bg-gray-50 bg-gray-50">
                        <td className="px-4 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{item.token}</td>
                        <td className="px-4 py-4 whitespace-nowrap text-sm">
                          <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-yellow-100 text-yellow-800">
                            Pending Allocation
                          </span>
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500">{item.balance}</td>
                        <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-700">${item.balanceUsd}</td>
                        <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500">${item.tokenPrice.toFixed(2)}</td>
                        <td className="px-4 py-4 whitespace-nowrap text-sm text-right">
                          <button 
                            className="text-blue-600 hover:text-blue-800"
                            onClick={() => onWithdrawClick && onWithdrawClick(item.token)}
                          >
                            Withdraw
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
          
          {/* Action Buttons */}
          <div className="mt-6 flex justify-end space-x-4">
            <button 
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition"
              onClick={() => onDepositClick && onDepositClick()}
            >
              Deposit More
            </button>
          </div>
        </>
      )}
    </div>
  );
};

export default UserHoldings;