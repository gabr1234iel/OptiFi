import React from 'react';
import { ProtocolDistribution } from '../../../types/admin';

interface ProtocolDistributionChartProps {
  data: ProtocolDistribution[];
}

// Generate color for each protocol
const getProtocolColor = (protocol: string): string => {
  // Map common protocols to specific colors
  const colorMap: Record<string, string> = {
    'AAVE_V2': 'bg-purple-600',
    'AAVE_V3': 'bg-purple-700',
    'METAMORPHO': 'bg-blue-600',
    'COMPOUND_V2': 'bg-green-600',
    'COMPOUND_V3': 'bg-green-700',
    'EULER_V2': 'bg-yellow-500',
    'FLUID': 'bg-pink-600',
    'SKYLENDING': 'bg-cyan-600',
    'SPARKLENDING': 'bg-orange-600'
  };
  
  return colorMap[protocol] || 'bg-gray-600';
};

const ProtocolDistributionChart: React.FC<ProtocolDistributionChartProps> = ({ data }) => {
  // Sort data by percentage (descending)
  const sortedData = [...data].sort((a, b) => b.percentage - a.percentage);
  
  return (
    <div className="space-y-4">
      {sortedData.length === 0 ? (
        <div className="text-center py-4 text-gray-500">
          <p>No protocols are currently in use.</p>
        </div>
      ) : (
        sortedData.map((item) => (
          <div key={item.protocol}>
            <div className="flex justify-between mb-1">
              <span className="text-sm font-medium text-gray-700">{item.displayName}</span>
              <span className="text-sm font-medium text-gray-700">{item.percentage}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2.5">
              <div 
                className={`${getProtocolColor(item.protocol)} h-2.5 rounded-full`} 
                style={{ width: `${item.percentage}%` }}
              ></div>
            </div>
          </div>
        ))
      )}
    </div>
  );
};

export default ProtocolDistributionChart;