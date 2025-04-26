import React from 'react';
import { TokenInfo, AdapterMap } from '../../../types/admin';
import { useAdmin } from '../../../contexts/AdminContext';

interface AdapterTableProps {
  tokens: TokenInfo[];
  adapters: AdapterMap;
}

const AdapterTable: React.FC<AdapterTableProps> = ({ tokens, adapters }) => {
  const { protocols, setStatusMessage } = useAdmin();
  
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
  
  return (
    <div className="bg-white p-6 rounded-lg shadow-sm mb-6">
      <h3 className="text-lg font-semibold mb-4 text-gray-800">Current Adapters</h3>
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead>
            <tr className="bg-gray-50">
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Token</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Current Adapter</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Protocol</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {tokens.map((token) => {
              const adapterAddress = adapters[token.symbol] || '';
              const protocol = adapters[`${token.symbol}_PROTOCOL`] || '';
              const protocolDisplay = protocols.find(p => p.name === protocol)?.displayName || 'None';
              
              return (
                <tr key={token.symbol} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {token.symbol}
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
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    <a
                      href={`https://etherscan.io/address/${token.address}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:text-blue-800 mr-3"
                      title="View token on Etherscan"
                    >
                      Token
                    </a>
                    {adapterAddress && (
                      <a
                        href={`https://etherscan.io/address/${adapterAddress}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:text-blue-800"
                        title="View adapter on Etherscan"
                      >
                        Adapter
                      </a>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default AdapterTable;