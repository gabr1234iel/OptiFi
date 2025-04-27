import React, { useState } from 'react';
import { TokenInfo, AdapterMap } from '../../../types/admin';
import { useAdmin } from '../../../contexts/AdminContext';
import { TOKEN_ADAPTER_COMPATIBILITY, PROTOCOL_DISPLAY_NAMES } from '../../../constants/TokenAdapterMap';

interface AdapterTableProps {
  tokens: TokenInfo[];
  adapters: AdapterMap;
}

const AdapterTable: React.FC<AdapterTableProps> = ({ tokens, adapters }) => {
  const { protocols, setStatusMessage } = useAdmin();
  const [searchTerm, setSearchTerm] = useState('');
  const [filterProtocol, setFilterProtocol] = useState<string | null>(null);
  
  const handleCopyAddress = (address: string) => {
    navigator.clipboard.writeText(address)
      .then(() => {
        setStatusMessage('Address copied to clipboard', false);
      })
      .catch((error) => {
        console.error('Failed to copy address:', error);
        setStatusMessage('Failed to copy address', true);
      });
  };
  
  // Get a list of all protocols used in adapters
  const getUsedProtocols = () => {
    const protocolsInUse = new Set<string>();
    
    tokens.forEach(token => {
      const protocol = adapters[`${token.symbol}_PROTOCOL`];
      if (protocol) {
        protocolsInUse.add(protocol);
      }
    });
    
    return Array.from(protocolsInUse);
  };
  
  // Filter tokens based on search and protocol filter
  const filteredTokens = tokens.filter(token => {
    const matchesSearch = token.symbol.toLowerCase().includes(searchTerm.toLowerCase());
    
    if (!filterProtocol) {
      return matchesSearch;
    }
    
    const tokenProtocol = adapters[`${token.symbol}_PROTOCOL`];
    return matchesSearch && tokenProtocol === filterProtocol;
  });
  
  // Get compatibility status for each token/protocol
  const isCompatible = (token: string, protocol: string) => {
    return TOKEN_ADAPTER_COMPATIBILITY[token]?.includes(protocol as any) || false;
  };
  
  // Get protocol display name
  const getProtocolDisplayName = (protocolKey: string) => {
    return PROTOCOL_DISPLAY_NAMES[protocolKey as keyof typeof PROTOCOL_DISPLAY_NAMES] || protocolKey;
  };
  
  return (
    <div className="bg-white p-6 rounded-lg shadow-sm mb-6">
      <h3 className="text-lg font-semibold mb-4 text-gray-800">Current Adapters</h3>
      
      {/* Filters */}
      <div className="flex flex-col md:flex-row gap-4 mb-6">
        <div className="flex-grow">
          <input
            type="text"
            placeholder="Search tokens..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full p-2 border border-gray-300 rounded-md text-gray-500"
          />
        </div>
        
        <div className="w-full md:w-auto">
          <select
            value={filterProtocol || ''}
            onChange={(e) => setFilterProtocol(e.target.value || null)}
            className="w-full p-2 border border-gray-300 rounded-md text-gray-500"
          >
            <option value="">All Protocols</option>
            {getUsedProtocols().map(protocol => (
              <option key={protocol} value={protocol}>
                {getProtocolDisplayName(protocol)}
              </option>
            ))}
          </select>
        </div>
      </div>
      
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Token</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Current Adapter</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Protocol</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Compatible With</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {filteredTokens.map((token) => {
              const adapterAddress = adapters[token.symbol] || '';
              const protocol = adapters[`${token.symbol}_PROTOCOL`] || '';
              const protocolDisplay = protocol 
                ? getProtocolDisplayName(protocol)
                : 'None';
              
              const compatibleProtocols = TOKEN_ADAPTER_COMPATIBILITY[token.symbol] || [];
              
              return (
                <tr key={token.symbol} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="text-sm font-medium text-gray-900">{token.symbol}</div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {adapterAddress ? (
                      <div className="flex items-center">
                        <span className="text-xs bg-gray-100 px-2 py-1 rounded mr-2">
                          {`${adapterAddress.substring(0, 6)}...${adapterAddress.substring(adapterAddress.length - 4)}`}
                        </span>
                        <button 
                          onClick={() => handleCopyAddress(adapterAddress)}
                          className="text-blue-600 hover:text-blue-800 p-1"
                          title="Copy address"
                        >
                          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M8 5H6C4.89543 5 4 5.89543 4 7V19C4 20.1046 4.89543 21 6 21H16C17.1046 21 18 20.1046 18 19V17M8 5C8 6.10457 8.89543 7 10 7H14C15.1046 7 16 6.10457 16 5M8 5C8 3.89543 8.89543 3 10 3H14C15.1046 3 16 3.89543 16 5M16 5V7C16 8.10457 16.8954 9 18 9H20M20 9C18.8954 9 18 9.89543 18 11V17M20 9V17M20 17C20 18.1046 19.1046 19 18 19" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                          </svg>
                        </button>
                      </div>
                    ) : (
                      <span className="text-xs bg-red-100 text-red-800 px-2 py-1 rounded">
                        Not Set
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {protocol ? (
                      <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                        {protocolDisplay}
                      </span>
                    ) : (
                      <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded">
                        None
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    <div className="flex flex-wrap gap-1">
                      {compatibleProtocols.length > 0 ? (
                        compatibleProtocols.map((compatibleProtocol) => (
                          <span 
                            key={compatibleProtocol}
                            className={`text-xs px-2 py-1 rounded ${
                              protocol === compatibleProtocol
                                ? 'bg-green-100 text-green-800 border border-green-300'
                                : 'bg-gray-100 text-gray-600'
                            }`}
                            title={protocol === compatibleProtocol ? 'Currently active' : 'Compatible option'}
                          >
                            {getProtocolDisplayName(compatibleProtocol)}
                          </span>
                        ))
                      ) : (
                        <span className="text-xs text-gray-500">No defined compatibilities</span>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    <div className="flex space-x-2">
                      <a
                        href={`https://etherscan.io/address/${token.address}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:text-blue-800"
                        title="View token on Etherscan"
                      >
                        <span className="px-2 py-1 bg-blue-50 rounded-md text-xs">Token</span>
                      </a>
                      {adapterAddress && (
                        <a
                          href={`https://etherscan.io/address/${adapterAddress}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:text-blue-800"
                          title="View adapter on Etherscan"
                        >
                          <span className="px-2 py-1 bg-blue-50 rounded-md text-xs">Adapter</span>
                        </a>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      
      {filteredTokens.length === 0 && (
        <div className="text-center py-4 text-gray-500">
          No tokens found matching your filters.
        </div>
      )}
    </div>
  );
};

export default AdapterTable;