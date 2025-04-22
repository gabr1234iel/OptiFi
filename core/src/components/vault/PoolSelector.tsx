// src/components/vault/PoolSelector.tsx
import React from 'react';

// Protocol enum mapping
const PROTOCOLS = [
  { id: 0, name: 'AAVE_V2', displayName: 'Aave V2', color: 'bg-purple-100 text-purple-800' },
  { id: 1, name: 'AAVE_V3', displayName: 'Aave V3', color: 'bg-purple-200 text-purple-800' },
  { id: 2, name: 'MORPHO_BLUE', displayName: 'Morpho Blue', color: 'bg-blue-100 text-blue-800' },
  { id: 3, name: 'COMPOUND_V2', displayName: 'Compound V2', color: 'bg-green-100 text-green-800' },
  { id: 4, name: 'COMPOUND_V3', displayName: 'Compound V3', color: 'bg-green-200 text-green-800' },
  { id: 5, name: 'EULER_V2', displayName: 'Euler V2', color: 'bg-yellow-100 text-yellow-800' },
  { id: 6, name: 'FLUID', displayName: 'Fluid Protocol', color: 'bg-pink-100 text-pink-800' },
];

interface PoolDetailsType {
  poolAddress: string;
  underlyingToken: string;
  protocol: number;
  apy?: number;
}

interface PoolSelectorProps {
  filteredPools: string[];
  selectedPool: string;
  poolDetails: Record<string, PoolDetailsType>;
  onSelectPool: (pool: string) => void;
  filterPoolsByToken: boolean;
  onToggleFilter: () => void;
}

const PoolSelector: React.FC<PoolSelectorProps> = ({
  filteredPools,
  selectedPool,
  poolDetails,
  onSelectPool,
  filterPoolsByToken,
  onToggleFilter
}) => {
  // Function to get protocol display from ID
  const getProtocolDisplay = (protocolId: number) => {
    return PROTOCOLS.find(p => p.id === protocolId);
  };
  
  return (
    <div className="space-y-4 mb-4">
      <div className="flex justify-between items-center">
        <label className="block text-sm font-medium text-gray-700">
          Select Pool
        </label>
        <div className="flex items-center">
          <input
            id="filter-pools"
            type="checkbox"
            checked={filterPoolsByToken}
            onChange={onToggleFilter}
            className="mr-2 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
          />
          <label htmlFor="filter-pools" className="text-xs text-gray-600">
            Filter pools by token
          </label>
        </div>
      </div>
      
      <div className="grid grid-cols-2 gap-2 max-h-60 overflow-y-auto">
        {filteredPools.length === 0 ? (
          <div className="col-span-2 text-center py-4 text-gray-500">
            No pools available for this token
          </div>
        ) : (
          filteredPools.map((poolName) => {
            const details = poolDetails[poolName];
            const protocol = details ? getProtocolDisplay(details.protocol) : null;
            
            return (
              <div 
                key={poolName}
                className={`p-3 rounded-lg border cursor-pointer hover:bg-gray-50 ${
                  selectedPool === poolName ? 'border-blue-500 bg-blue-50' : 'border-gray-200'
                }`}
                onClick={() => onSelectPool(poolName)}
              >
                <div className="font-medium text-gray-900">{poolName}</div>
                {protocol && (
                  <div className={`text-xs ${protocol.color} inline-block px-2 py-0.5 rounded mt-1`}>
                    {protocol.displayName}
                  </div>
                )}
                {details?.apy && (
                  <div className="text-sm text-green-600 mt-1">
                    {(details.apy / 100).toFixed(2)}% APY
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

export default PoolSelector;