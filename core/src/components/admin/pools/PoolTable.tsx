import React from 'react';
import { PoolDetails } from '../../../types/admin';
import { getTokenSymbol, getProtocolName } from '../../../services/universalVaultService';
import { useAdmin } from '../../../contexts/AdminContext';

interface PoolTableProps {
  pools: PoolDetails[];
  isLoading: boolean;
}

const PoolTable: React.FC<PoolTableProps> = ({ pools, isLoading }) => {
  const { tokenPrices } = useAdmin();
  
  if (isLoading) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-500">Loading pools...</p>
      </div>
    );
  }
  
  if (pools.length === 0) {
    return (
      <div className="text-center py-8 bg-gray-100 rounded-lg">
        <p className="text-gray-700">No pools available. Add your first pool below.</p>
      </div>
    );
  }
  
  return (
    <div className="overflow-x-auto">
      <table className="min-w-full bg-white border rounded-lg shadow-sm">
        <thead>
          <tr className="bg-gray-100">
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">Pool Name</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">Pool Address</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">Underlying Token</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">Protocol</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">APY</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-200">
          {pools.map((pool) => {
            const tokenSymbol = getTokenSymbol(pool.underlyingToken);
            const tokenPrice = tokenPrices[tokenSymbol] || 0;
            
            return (
              <tr key={pool.poolName} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{pool.poolName}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {pool.poolAddress ? (
                    <a
                      href={`https://etherscan.io/address/${pool.poolAddress}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="hover:underline"
                    >
                      {`${pool.poolAddress.substring(0, 6)}...${pool.poolAddress.substring(pool.poolAddress.length - 4)}`}
                    </a>
                  ) : (
                    'N/A'
                  )}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  <div className="flex items-center">
                    <span>{tokenSymbol}</span>
                    {tokenPrice > 0 && (
                      <span className="ml-2 text-xs text-green-600">${tokenPrice.toFixed(2)}</span>
                    )}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {pool.protocol !== undefined ? (
                    <span className="px-2 py-1 text-xs rounded-full bg-blue-100 text-blue-800">
                      {getProtocolName(pool.protocol)}
                    </span>
                  ) : (
                    'N/A'
                  )}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {pool.apy !== undefined ? (
                    <span className="text-green-600 font-medium">
                      {(pool.apy / 100).toFixed(2)}%
                    </span>
                  ) : (
                    'N/A'
                  )}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  <button className="text-blue-600 hover:text-blue-800 mr-2 text-sm">View</button>
                  <button className="text-red-600 hover:text-red-800 text-sm">Remove</button>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};

export default PoolTable;