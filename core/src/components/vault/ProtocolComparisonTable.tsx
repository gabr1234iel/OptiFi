import React, { useState, useEffect } from 'react';
import { getProtocolAPYs } from '../../services/universalVaultService';

interface ProtocolComparisonTableProps {
  onSelectProtocol: (protocolId: number) => void;
  selectedToken?: string; // Currently selected token to get comparison for
}

// Protocol enum mapping with colors and display names
const PROTOCOLS = [
  { id: 0, name: 'AAVE_V2', displayName: 'Aave V2', color: 'bg-purple-100 text-purple-800' },
  { id: 1, name: 'AAVE_V3', displayName: 'Aave V3', color: 'bg-purple-200 text-purple-800' },
  { id: 2, name: 'MORPHO_BLUE', displayName: 'Morpho Blue', color: 'bg-blue-100 text-blue-800' },
  { id: 3, name: 'COMPOUND_V2', displayName: 'Compound V2', color: 'bg-green-100 text-green-800' },
  { id: 4, name: 'COMPOUND_V3', displayName: 'Compound V3', color: 'bg-green-200 text-green-800' },
  { id: 5, name: 'EULER_V2', displayName: 'Euler V2', color: 'bg-yellow-100 text-yellow-800' },
  { id: 6, name: 'FLUID', displayName: 'Fluid Protocol', color: 'bg-pink-100 text-pink-800' }
];

interface ProtocolData {
  id: number;
  name: string;
  displayName: string;
  color: string;
  apy: number;
  tvl: number;
}

const ProtocolComparisonTable: React.FC<ProtocolComparisonTableProps> = ({ 
  onSelectProtocol,
  selectedToken = 'USDC' // Default to USDC if not specified
}) => {
  const [loading, setLoading] = useState(true);
  const [protocolData, setProtocolData] = useState<ProtocolData[]>([]);
  
  useEffect(() => {
    const loadProtocolData = async () => {
      setLoading(true);
      try {
        // Get real APY data from smart contracts
        const apyData = await getProtocolAPYs(selectedToken);
        
        // Combine with protocol data
        const combinedData: ProtocolData[] = PROTOCOLS.map(protocol => {
          // Get the APY for this protocol (or use a default)
          const apy = apyData[protocol.name] || 0;
          
          // Generate a somewhat realistic TVL (would come from a real API in production)
          // This is just for demonstration
          const tvl = (Math.random() * 75 + 5).toFixed(1);
          
          return {
            ...protocol,
            apy,
            tvl: parseFloat(tvl)
          };
        }).filter(p => p.apy > 0); // Only show protocols that have APY data
        
        // Sort by APY (highest first)
        combinedData.sort((a, b) => b.apy - a.apy);
        
        setProtocolData(combinedData);
      } catch (error) {
        console.error('Error loading protocol data:', error);
      } finally {
        setLoading(false);
      }
    };
    
    loadProtocolData();
  }, [selectedToken]);

  if (loading) {
    return (
      <div className="mb-6 border rounded-lg overflow-hidden p-4">
        <div className="animate-pulse space-y-4">
          <div className="h-4 bg-gray-200 rounded w-1/4"></div>
          <div className="h-10 bg-gray-200 rounded"></div>
          <div className="h-10 bg-gray-200 rounded"></div>
          <div className="h-10 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="mb-6 border rounded-lg overflow-hidden">
      <div className="px-6 py-3 bg-gray-50 border-b">
        <h3 className="text-sm font-medium text-gray-700">
          Protocol Comparison for {selectedToken}
        </h3>
      </div>
      
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
          {protocolData.length === 0 ? (
            <tr>
              <td colSpan={4} className="px-6 py-4 text-center text-gray-500">
                No protocol data available for {selectedToken}
              </td>
            </tr>
          ) : (
            protocolData.map((protocol) => (
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
            ))
          )}
        </tbody>
      </table>
    </div>
  );
};

export default ProtocolComparisonTable;