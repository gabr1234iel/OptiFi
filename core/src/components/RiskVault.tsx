import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useWallet } from '../hooks/useWallet';
import { VaultData, RiskLevel } from '../types';
import { depositToVault, getVaultAPY, getUserVaultBalance } from '../services/vaultService';

interface RiskVaultProps {
  riskLevel: RiskLevel;
  data: VaultData;
}

const RiskVault: React.FC<RiskVaultProps> = ({ riskLevel, data }) => {
  const { isConnected, account } = useWallet();
  const [depositAmount, setDepositAmount] = useState<string>('');
  const [userBalance, setUserBalance] = useState<string>('0');
  const [isDepositing, setIsDepositing] = useState<boolean>(false);
  const [currentAPY, setCurrentAPY] = useState<string>('');
  
  // Default token for this risk level
  const defaultToken = riskLevel === 'high-risk' ? 'WETH' : 'USDC';
  
  // Load current APY and user balance
  useEffect(() => {
    const loadData = async () => {
      if (isConnected && account) {
        try {
          const apy = await getVaultAPY(riskLevel, defaultToken);
          setCurrentAPY(apy);
          
          const balance = await getUserVaultBalance(riskLevel, defaultToken);
          setUserBalance(balance);
        } catch (error) {
          console.error('Error loading vault data:', error);
        }
      }
    };
    
    loadData();
    
    // Refresh data every 60 seconds
    const interval = setInterval(loadData, 60000);
    return () => clearInterval(interval);
  }, [isConnected, account, riskLevel, defaultToken]);

  const handleDepositSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isConnected) {
      alert("Please connect your wallet first");
      return;
    }
    
    if (!depositAmount || parseFloat(depositAmount) <= 0) {
      alert("Please enter a valid amount");
      return;
    }
    
    setIsDepositing(true);
    
    try {
      const txHash = await depositToVault(riskLevel, defaultToken, depositAmount);
      alert(`Deposit successful! Transaction hash: ${txHash}`);
      setDepositAmount('');
      
      // Refresh user balance
      const balance = await getUserVaultBalance(riskLevel, defaultToken);
      setUserBalance(balance);
    } catch (error) {
      console.error('Error depositing to vault:', error);
      alert(`Error depositing: ${error instanceof Error ? error.message : String(error)}`);
    } finally {
      setIsDepositing(false);
    }
  };

  const riskColorClass = 
    riskLevel === 'low-risk' ? 'bg-green-100 border-green-400' :
    riskLevel === 'medium-risk' ? 'bg-yellow-100 border-yellow-400' :
    'bg-red-100 border-red-400';

  return (
    <div className={`risk-vault ${riskColorClass} p-4 rounded-lg border-4`}>
      <div className="vault-header flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold capitalize text-black">{riskLevel.replace('-', ' ')}</h3>
        <button 
          onClick={() => document.getElementById(`deposit-form-${riskLevel}`)?.classList.toggle('hidden')}
          className="deposit-button bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
        >
          Deposit
        </button>
      </div>
      
      <div className="vault-content">
        <p className="text-xl text-green-700 font-extrabold">
          {currentAPY ? `${currentAPY}%` : data.apy}
        </p>
        <p className="text-gray-700">Current APY</p>
        <div className="mt-2">
          <p className="text-sm text-gray-600">{data.name}</p>
          <p className="text-sm text-gray-600">TVL: {data.tvl}</p>
          {isConnected && (
            <p className="text-sm text-gray-600 mt-2">
              Your Balance: {parseFloat(userBalance).toFixed(6)} {defaultToken}
            </p>
          )}
        </div>
      </div>
      
      {/* Deposit Form */}
      <form 
        id={`deposit-form-${riskLevel}`} 
        className="mt-4 hidden"
        onSubmit={handleDepositSubmit}
      >
        <div className="flex flex-col space-y-2">
          <label className="text-sm text-gray-600">
            Deposit Amount ({defaultToken})
          </label>
          <input
            type="number"
            step="0.000001"
            value={depositAmount}
            onChange={(e) => setDepositAmount(e.target.value)}
            className="border rounded p-2 text-gray-700"
            placeholder={`Enter ${defaultToken} amount`}
            required
          />
          <button
            type="submit"
            disabled={isDepositing || !isConnected}
            className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 disabled:bg-gray-400"
          >
            {isDepositing ? 'Processing...' : 'Confirm Deposit'}
          </button>
        </div>
      </form>
      
      <div className="vault-footer mt-4 text-right">
        <Link href={`/${riskLevel}`} className="text-blue-500 text-sm hover:underline">
          View Details →
        </Link>
      </div>
    </div>
  );
};

export default RiskVault;