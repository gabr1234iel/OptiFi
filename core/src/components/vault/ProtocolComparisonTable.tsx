// src/components/vault/ProtocolComparisonTable.tsx
import React from 'react';

// Protocol enum mapping
const PROTOCOLS = [
  { id: 0, name: 'AAVE_V2', displayName: 'Aave V2', color: 'bg-purple-100 text-purple-800', apy: 3.42, tvl: 14.3 },
  { id: 1, name: 'AAVE_V3', displayName: 'Aave V3', color: 'bg-purple-200 text-purple-800', apy: 3.68, tvl: 85.7 },
  { id: 2, name: 'MORPHO_BLUE', displayName: 'Morpho Blue', color: 'bg-blue-100 text-blue-800', apy: 4.21, tvl: 63.2 },
  { id: 3, name: 'COMPOUND_V2', displayName: 'Compound V2', color: 'bg-green-100 text-green-800', apy: 3.51, tvl: 28.5 },
  { id: 4, name: 'COMPOUND_V3', displayName: 'Compound V3', color: 'bg-green-200 text-green-800', apy: 3.89, tvl: 58.1 },
];

interface ProtocolComparisonTableProps {
  onSelectProtocol: (protocolId: number) => void;
}

const ProtocolComparisonTable: React.FC<ProtocolComparisonTableProps> = ({ onSelectProtocol }) => {
  return (
    <div className="mb-6 border rounded-lg overflow-hidden">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Protocol</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Current APY</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">TVL</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"></th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {PROTOCOLS.map((protocol) => (
            <tr key={protocol.id} className="hover:bg-gray-50">
              <td className="px-6 py-4 whitespace-nowrap">
                <div className="flex items-center">
                  <div className={`px-2 py-1 rounded-md ${protocol.color} text-sm font-medium`}>
                    {protocol.displayName}
                  </div>
                </div>
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                {protocol.apy.toFixed(2)}%
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                ${protocol.tvl.toFixed(1)}M
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-right">
                <button 
                  type="button"
                  className="text-blue-600 hover:text-blue-800"
                  onClick={() => onSelectProtocol(protocol.id)}
                >
                  Select
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default ProtocolComparisonTable;