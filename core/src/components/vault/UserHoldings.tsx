// src/components/vault/UserHoldings.tsx
import React, { useState, useEffect } from 'react';
import { useWallet } from '../../hooks/useWallet';
import { getProtocolBalances, getUserVaultBalances } from '../../services/universalVaultService';

interface HoldingsProps {
  onDepositClick?: () => void;
  onWithdrawClick?: (token: string) => void;
}

interface HoldingData {
  poolName: string;
  token: string;
  protocol: string;
  balance: string;
  yield: string;
  apy: string;
}

const UserHoldings: React.FC<HoldingsProps> = ({ onDepositClick, onWithdrawClick }) => {
  const { isConnected, account } = useWallet();
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [holdings, setHoldings] = useState<HoldingData[]>([]);
  const [totalBalance, setTotalBalance] = useState<string>("0.00");
  const [totalYield, setTotalYield] = useState<string>("0.00");
  
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
  
  useEffect(() => {
    const loadHoldings = async () => {
      if (isConnected && account) {
        setIsLoading(true);
        try {
          // Get user balances directly from vault contract
          const vaultBalances = await getUserVaultBalances(account);
          
          // Get protocol balances (adapter-specific info)
          const protocolData = await getProtocolBalances(account);
          
          // Convert to the format needed for the UI
          const holdingsData: HoldingData[] = [];
          let totalValue = 0;
          let totalYieldValue = 0;
          
          // First process vault balances 
          for (const [token, balanceStr] of Object.entries(vaultBalances)) {
            // Handle only non-zero balances
            if (parseFloat(balanceStr) > 0) {
              // For now, use a fixed APY for demonstration
              const apy = Math.floor(Math.random() * 500) + 100; // Random APY between 1% and 6%
              
              // Calculate the yield based on APY
              const yieldValue = calculateYield(balanceStr, apy);
              
              // For poolName, use a token as identifier
              const poolName = `${token}_VAULT`;
              
              // Remove commas for calculation
              const balanceNum = parseFloat(balanceStr.replace(/,/g, ''));
              const yieldNum = parseFloat(yieldValue.replace(/,/g, ''));
              
              // Add to totals
              totalValue += balanceNum;
              totalYieldValue += yieldNum;
              
              // Add to holdings with "Universal Vault" as protocol
              holdingsData.push({
                poolName,
                token,
                protocol: "Universal Vault",
                balance: balanceStr,
                yield: yieldValue,
                apy: (apy / 100).toFixed(2) // Convert basis points to percentage
              });
            }
          }
          
          // Add protocol-specific holdings if available
          for (const [protocolKey, tokenBalances] of Object.entries(protocolData)) {
            // Process each token in this protocol
            for (const [token, balanceStr] of Object.entries(tokenBalances)) {
              if (parseFloat(balanceStr.replace(/,/g, '')) > 0) {
                // For now, use a fixed APY for demonstration
                const apy = Math.floor(Math.random() * 500) + 100; // Random APY between 1% and 6%
                
                // Calculate the yield based on APY
                const yieldValue = calculateYield(balanceStr, apy);
                
                // For poolName, use a combination of protocol and token
                const poolName = `${token}_${protocolKey}`;
                
                // Remove commas for calculation
                const balanceNum = parseFloat(balanceStr.replace(/,/g, ''));
                const yieldNum = parseFloat(yieldValue.replace(/,/g, ''));
                
                // Add to totals
                totalValue += balanceNum;
                totalYieldValue += yieldNum;
                
                // Use protocol name instead of enum
                const protocolDisplay = protocolKey.replace(/_/g, ' ');
                
                holdingsData.push({
                  poolName,
                  token,
                  protocol: protocolDisplay,
                  balance: balanceStr,
                  yield: yieldValue,
                  apy: (apy / 100).toFixed(2) // Convert basis points to percentage
                });
              }
            }
          }
          
          setHoldings(holdingsData);
          
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

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h2 className="text-xl font-bold text-gray-900 mb-4">Your Holdings</h2>
      
      {holdings.length === 0 ? (
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
              <p className="text-sm text-green-700 font-medium">Total Yield</p>
              <p className="text-2xl font-bold text-green-900">${totalYield}</p>
            </div>
          </div>
          
          {/* Holdings Table */}
          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Token</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Protocol</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Balance</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Yield</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">APY</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {holdings.map((item, index) => (
                  <tr key={index} className="hover:bg-gray-50">
                    <td className="px-4 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{item.token}</td>
                    <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500">{item.protocol}</td>
                    <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500">${item.balance}</td>
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