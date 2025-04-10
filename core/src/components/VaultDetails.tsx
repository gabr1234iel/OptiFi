import React from 'react';
import { PoolData } from '../types';

interface VaultDetailsProps {
  riskLevel: string;
  pools: PoolData[];
}

const VaultDetails: React.FC<VaultDetailsProps> = ({ riskLevel, pools }) => {
  return (
    <div className="vault-details">
      <h2 className="text-2xl font-bold mb-6 capitalize text-black">{riskLevel.replace('-', ' ')} Pools</h2>
      
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