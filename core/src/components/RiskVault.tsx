import React from 'react';
import Link from 'next/link';
import { useWallet } from '../hooks/useWallet';
import { VaultData, RiskLevel } from '../types';

interface RiskVaultProps {
  riskLevel: RiskLevel;
  data: VaultData;
}

const RiskVault: React.FC<RiskVaultProps> = ({ riskLevel, data }) => {
  const { isConnected } = useWallet();
  
  const handleDeposit = () => {
    if (!isConnected) {
      alert("Please connect your wallet first");
      return;
    }
    alert(`Deposit to ${riskLevel} vault initiated. This will be implemented with smart contracts.`);
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
          onClick={handleDeposit} 
          className="deposit-button bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
        >
          Deposit
        </button>
      </div>
      
      <div className="vault-content">
        <p className="text-xl text-green-700 font-extrabold">{data.apy}</p>
        <p className="text-gray-700">Current APY</p>
        <div className="mt-2">
          <p className="text-sm text-gray-600">{data.name}</p>
          <p className="text-sm text-gray-600">TVL: {data.tvl}</p>
        </div>
      </div>
      
      <div className="vault-footer mt-4 text-right">
        <Link href={`/${riskLevel}`} className="text-blue-500 text-sm hover:underline">
          View Details →
        </Link>
      </div>
    </div>
  );
};

export default RiskVault;