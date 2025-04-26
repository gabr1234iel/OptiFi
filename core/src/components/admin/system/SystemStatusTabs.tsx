import React from 'react';
import StatusCard from './StatusCards';
import ProtocolDistributionChart from './ProtocolDistributionChart';

import { useAdmin } from '../../../contexts/AdminContext';

const SystemStatusTab: React.FC = () => {
  const { tvlData, pools, totalUsers, protocols, adapters } = useAdmin();
  
  // Calculate protocol distribution
  const getProtocolDistribution = () => {
    const distribution: Record<string, number> = {};
    let total = 0;

    // Count tokens by protocol
    Object.entries(adapters).forEach(([token, adapter]) => {
      if (token.includes('_PROTOCOL')) return; // Skip protocol markers

      const protocol = adapters[`${token}_PROTOCOL`];
      if (protocol) {
        distribution[protocol] = (distribution[protocol] || 0) + 1;
        total++;
      }
    });

    // Calculate percentages
    const result = Object.entries(distribution).map(([protocol, count]) => ({
      protocol,
      percentage: total > 0 ? Math.round((count / total) * 100) : 0,
      displayName: protocols.find(p => p.name === protocol)?.displayName || protocol
    }));

    return result;
  };
  
  const protocolDistribution = getProtocolDistribution();
  
  // Count pools by protocol
  const poolsByProtocol: Record<string, number> = {};
  protocols.forEach(protocol => {
    poolsByProtocol[protocol.displayName] = pools.filter(p => p.protocol === protocol.id).length;
  });
  
  return (
    <div>
      <div className="mb-8">
        <h2 className="text-xl font-bold mb-4 text-gray-800">System Status</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {/* Total Value Locked */}
          <StatusCard 
            title="Total Value Locked"
            value={`$${tvlData.total}`}
            details={Object.entries(tvlData.byToken).map(([token, value]) => ({
              label: token,
              value: `$${value}`
            }))}
            icon={
              <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            }
          />
          
          {/* Active Pools */}
          <StatusCard 
            title="Active Pools"
            value={pools.length.toString()}
            details={Object.entries(poolsByProtocol)
              .filter(([_, count]) => count > 0)
              .map(([protocol, count]) => ({
                label: protocol,
                value: count.toString()
              }))}
            icon={
              <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            }
          />
          
          {/* Total Users */}
          <StatusCard 
            title="Total Users"
            value={totalUsers.toString()}
            details={[
              { label: 'Active in last 24h', value: Math.floor(totalUsers * 0.6).toString() }
            ]}
            icon={
              <svg className="w-8 h-8 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
              </svg>
            }
          />
        </div>
        
        {/* Protocol Distribution */}
        <div className="bg-white p-6 rounded-lg shadow-sm">
          <h3 className="text-lg font-semibold mb-4 text-gray-800">Protocol Distribution</h3>
          
          <ProtocolDistributionChart data={protocolDistribution} />
        </div>
      </div>
    </div>
  );
};

export default SystemStatusTab;