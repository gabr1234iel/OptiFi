// src/components/vault/UserHoldings.tsx
import React, { useState, useEffect } from 'react';
import { useWallet } from '../../hooks/useWallet';
import { getProtocolBalances } from '../../services/universalVaultService';

interface HoldingsProps {
  onSelectPool?: (poolName: string) => void;
}

const UserHoldings: React.FC<HoldingsProps> = ({ onSelectPool }) => {
  const { isConnected, account } = useWallet();
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [holdings, setHoldings] = useState<any[]>([]);
  const [totalBalance, setTotalBalance] = useState<string>("0.00");
  const [totalYield, setTotalYield] = useState<string>("0.00");
  
  useEffect(() => {
    const loadHoldings = async () => {
      if (isConnected && account) {
        setIsLoading(true);
        try {
          // In a real app, this would call your service to get actual balances
          // For now, we'll use mock data
          const balances = await getProtocolBalances(account);
          
          // Mock data
          const mockHoldings = [
            { 
              poolName: 'STEAKUSDC', 
              token: 'USDC', 
              protocol: 'Morpho Blue', 
              balance: '2,458.42', 
              yield: '94.78', 
              apy: '3.87' 
            },
            { 
              poolName: 'REUSDC', 
              token: 'USDC', 
              protocol: 'Morpho Blue', 
              balance: '1,350.00', 
              yield: '65.21', 
              apy: '4.82' 
            },
            { 
              poolName: 'STEAKETH', 
              token: 'WETH', 
              protocol: 'Morpho Blue', 
              balance: '3.24', 
              yield: '0.11', 
              apy: '3.56' 
            },
            { 
              poolName: 'USDC', 
              token: 'USDC', 
              protocol: 'Aave V3', 
              balance: '1,000.00', 
              yield: '32.14', 
              apy: '3.21' 
            },
          ];
          
          setHoldings(mockHoldings);
          
          // Calculate totals
          const total = mockHoldings.reduce((sum, item) => {
            // In a real app, you would convert everything to a common denominator like USD
            // Here we'll just sum as if everything is in USD already
            return sum + parseFloat(item.balance.replace(',', ''));
          }, 0);
          
          const yieldTotal = mockHoldings.reduce((sum, item) => {
            return sum + parseFloat(item.yield);
          }, 0);
          
          setTotalBalance(total.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }));
          setTotalYield(yieldTotal.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }));
          
        } catch (error) {
          console.error('Error loading holdings:', error);
        } finally {
          setIsLoading(false);
        }
      }
    };
    
    loadHoldings();
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
            onClick={() => {}}
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
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Pool</th>
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
                    <td className="px-4 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{item.poolName}</td>
                    <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500">{item.token}</td>
                    <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500">{item.protocol}</td>
                    <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500">${item.balance}</td>
                    <td className="px-4 py-4 whitespace-nowrap text-sm text-green-600">${item.yield}</td>
                    <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500">{item.apy}%</td>
                    <td className="px-4 py-4 whitespace-nowrap text-sm text-right">
                      <button 
                        className="text-blue-600 hover:text-blue-800"
                        onClick={() => onSelectPool && onSelectPool(item.poolName)}
                      >
                        Manage
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          
          {/* Action Buttons */}
          <div className="mt-6 flex justify-end space-x-4">
            <button className="px-4 py-2 border border-blue-600 text-blue-600 rounded-md hover:bg-blue-50 transition">
              Withdraw All
            </button>
            <button className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition">
              Deposit More
            </button>
          </div>
        </>
      )}
    </div>
  );
};

export default UserHoldings;