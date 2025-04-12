import React, { useState, useEffect } from 'react';
import { PoolData } from '../types';
import { useWallet } from '../hooks/useWallet';
import { withdrawFromVault, withdrawAllFromVault, getUserVaultBalance } from '../services/vaultService';
interface VaultDetailsProps {
  riskLevel: string;
  pools: PoolData[];
}

const VaultDetails: React.FC<VaultDetailsProps> = ({ riskLevel, pools }) => {
  const { isConnected, account } = useWallet();
  const [userBalance, setUserBalance] = useState<string>('0');
  const [withdrawAmount, setWithdrawAmount] = useState<string>('');
  const [isWithdrawing, setIsWithdrawing] = useState<boolean>(false);
  
  // Default token for this risk level
  const defaultToken = riskLevel === 'high-risk' ? 'WETH' : 'USDC';
  
  // Load user balance
  useEffect(() => {
    const loadBalance = async () => {
      if (isConnected && account) {
        try {
          const balance = await getUserVaultBalance(riskLevel, defaultToken);
          setUserBalance(balance);
        } catch (error) {
          console.error('Error loading user balance:', error);
        }
      }
    };
    
    loadBalance();
    
    // Refresh balance every 30 seconds
    const interval = setInterval(loadBalance, 30000);
    return () => clearInterval(interval);
  }, [isConnected, account, riskLevel, defaultToken]);
  
  const handleWithdraw = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isConnected) {
      alert("Please connect your wallet first");
      return;
    }
    
    if (!withdrawAmount || parseFloat(withdrawAmount) <= 0) {
      alert("Please enter a valid amount");
      return;
    }
    
    setIsWithdrawing(true);
    
    try {
      const txHash = await withdrawFromVault(riskLevel, defaultToken, withdrawAmount);
      alert(`Withdrawal successful! Transaction hash: ${txHash}`);
      setWithdrawAmount('');
      
      // Refresh user balance
      const balance = await getUserVaultBalance(riskLevel, defaultToken);
      setUserBalance(balance);
    } catch (error) {
      console.error('Error withdrawing from vault:', error);
      alert(`Error withdrawing: ${error instanceof Error ? error.message : String(error)}`);
    } finally {
      setIsWithdrawing(false);
    }
  };
  
  const handleWithdrawAll = async () => {
    if (!isConnected) {
      alert("Please connect your wallet first");
      return;
    }
    
    if (parseFloat(userBalance) <= 0) {
      alert("You don't have any funds to withdraw");
      return;
    }
    
    setIsWithdrawing(true);
    
    try {
      const txHash = await withdrawAllFromVault(riskLevel, defaultToken);
      alert(`Withdrawal successful! Transaction hash: ${txHash}`);
      
      // Refresh user balance
      const balance = await getUserVaultBalance(riskLevel, defaultToken);
      setUserBalance(balance);
    } catch (error) {
      console.error('Error withdrawing from vault:', error);
      alert(`Error withdrawing: ${error instanceof Error ? error.message : String(error)}`);
    } finally {
      setIsWithdrawing(false);
    }
  };

  return (
    <div className="vault-details">
      <h2 className="text-2xl font-bold mb-6 capitalize text-black">{riskLevel.replace('-', ' ')} Pools</h2>
      
      {/* User balance and withdraw form */}
      {isConnected && (
        <div className="mb-8 p-4 bg-white border rounded-lg shadow-sm">
          <h3 className="text-lg font-semibold mb-2 text-black">Your Investment</h3>
          <p className="text-gray-700 mb-4">
            Current Balance: <span className="font-bold">{parseFloat(userBalance).toFixed(6)} {defaultToken}</span>
          </p>
          
          <form onSubmit={handleWithdraw} className="mb-4">
            <div className="flex items-end space-x-2">
              <div className="flex-grow">
                <label className="block text-sm text-gray-900 mb-1">Withdraw Amount</label>
                <input
                  type="number"
                  step="0.000001"
                  value={withdrawAmount}
                  onChange={(e) => setWithdrawAmount(e.target.value)}
                  className="w-full border rounded p-2 text-gray-700"
                  placeholder={`Enter ${defaultToken} amount`}
                  required
                />
              </div>
              <button
                type="submit"
                disabled={isWithdrawing}
                className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 disabled:bg-gray-400"
              >
                {isWithdrawing ? 'Processing...' : 'Withdraw'}
              </button>
            </div>
          </form>
          
          <button
            onClick={handleWithdrawAll}
            disabled={isWithdrawing || parseFloat(userBalance) <= 0}
            className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600 disabled:bg-gray-400"
          >
            Withdraw All (Including Yield)
          </button>
        </div>
      )}
      
      {/* Pools table */}
      <div className="overflow-x-auto">
        <table className="min-w-full bg-white border rounded-lg">
          <thead>
            <tr className="bg-gray-100">
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">Pool</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">Project</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">Chain</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">APY</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">TVL</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">Risk Score</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {pools.map((pool, index) => (
              <tr key={index} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{pool.Pool}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{pool.Project}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{pool.Chain}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{pool.APY.toFixed(2)}%</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">${(pool.TVL / 1000000).toFixed(1)}M</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{pool.Risk_Score.toFixed(1)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default VaultDetails;