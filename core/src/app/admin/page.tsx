"use client";
import React, { useState, useEffect } from 'react';
import Header from '../../components/Header';
import { useWallet } from '../../hooks/useWallet';
import { getAvailablePools, getPoolDetails } from '../../services/universalVaultService';

// Token addresses
const TOKEN_ADDRESSES = {
  USDC: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48',
  USDT: '0xdAC17F958D2ee523a2206206994597C13D831ec7',
  DAI: '0x6B175474E89094C44Da98b954EedeAC495271d0F',
  WETH: '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2',
  WSTETH: '0x7f39C581F595B53c5cb19bD0b3f8dA6c935E2Ca0',
};

// Protocol enum mapping
const PROTOCOLS = [
  { id: 0, name: 'AAVE_V2' },
  { id: 1, name: 'AAVE_V3' },
  { id: 2, name: 'MORPHO_BLUE' },
  { id: 3, name: 'COMPOUND_V2' },
  { id: 4, name: 'COMPOUND_V3' },
  { id: 5, name: 'EULER_V2' },
  { id: 6, name: 'FLUID' },
];

export default function AdminDashboard() {
  const { isConnected, account } = useWallet();
  const [activeTab, setActiveTab] = useState('pools');
  const [availablePools, setAvailablePools] = useState<string[]>([]);
  const [poolDetails, setPoolDetails] = useState<Record<string, any>>({});
  const [loadingPools, setLoadingPools] = useState(true);
  
  // Form states for adding new pools
  const [newPoolName, setNewPoolName] = useState('');
  const [newPoolToken, setNewPoolToken] = useState('USDC');
  const [newPoolProtocol, setNewPoolProtocol] = useState(0);
  const [newPoolAddress, setNewPoolAddress] = useState('');
  
  // Form states for changing adapter
  const [selectedToken, setSelectedToken] = useState('USDC');
  const [selectedAdapter, setSelectedAdapter] = useState('');
  
  // Form states for setting fee tiers
  const [tokenA, setTokenA] = useState('USDC');
  const [tokenB, setTokenB] = useState('WETH');
  const [feeTier, setFeeTier] = useState(3000); // 0.3% is 3000
  
  // Status message
  const [statusMessage, setStatusMessage] = useState('');
  const [isError, setIsError] = useState(false);

  // Load pools data
  useEffect(() => {
    const loadPoolsData = async () => {
      if (isConnected) {
        try {
          setLoadingPools(true);
          
          // Fetch all available pool names
          const pools = await getAvailablePools();
          setAvailablePools(pools);
          
          // Fetch details for each pool
          const details: Record<string, any> = {};
          for (const pool of pools) {
            details[pool] = await getPoolDetails(pool);
          }
          
          setPoolDetails(details);
        } catch (error) {
          console.error('Failed to load pools data:', error);
          setStatusMessage('Failed to load pools data');
          setIsError(true);
        } finally {
          setLoadingPools(false);
        }
      }
    };
    
    loadPoolsData();
  }, [isConnected]);
  
  // Handler for adding a new pool
  const handleAddPool = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!isConnected) {
      setStatusMessage('Please connect your wallet first');
      setIsError(true);
      return;
    }
    
    setStatusMessage('Adding new pool...');
    setIsError(false);
    
    try {
      // Here you would call your contract to add a new pool
      // This is a mock implementation since we don't have the actual function
      // In a real implementation, you would use a service function
      
      // Example:
      // await addPoolToVault(
      //   newPoolName,
      //   TOKEN_ADDRESSES[newPoolToken as keyof typeof TOKEN_ADDRESSES],
      //   newPoolAddress,
      //   newPoolProtocol
      // );
      
      // Mock success
      setTimeout(() => {
        setStatusMessage(`Successfully added pool: ${newPoolName}`);
        
        // Reset form
        setNewPoolName('');
        setNewPoolToken('USDC');
        setNewPoolProtocol(0);
        setNewPoolAddress('');
        
        // Reload pools data
        // In a real app, you would reload the pools data here
      }, 1000);
      
    } catch (error) {
      console.error('Failed to add pool:', error);
      setStatusMessage(`Failed to add pool: ${error instanceof Error ? error.message : String(error)}`);
      setIsError(true);
    }
  };
  
  // Handler for changing adapter
  const handleChangeAdapter = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!isConnected) {
      setStatusMessage('Please connect your wallet first');
      setIsError(true);
      return;
    }
    
    setStatusMessage('Changing adapter...');
    setIsError(false);
    
    try {
      // Here you would call your contract to change the adapter
      // This is a mock implementation
      
      // Example:
      // await setTokenAdapter(
      //   TOKEN_ADDRESSES[selectedToken as keyof typeof TOKEN_ADDRESSES],
      //   selectedAdapter
      // );
      
      // Mock success
      setTimeout(() => {
        setStatusMessage(`Successfully changed adapter for ${selectedToken}`);
        
        // Reset form
        setSelectedToken('USDC');
        setSelectedAdapter('');
        
      }, 1000);
      
    } catch (error) {
      console.error('Failed to change adapter:', error);
      setStatusMessage(`Failed to change adapter: ${error instanceof Error ? error.message : String(error)}`);
      setIsError(true);
    }
  };
  
  // Handler for setting fee tier
  const handleSetFeeTier = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!isConnected) {
      setStatusMessage('Please connect your wallet first');
      setIsError(true);
      return;
    }
    
    setStatusMessage('Setting fee tier...');
    setIsError(false);
    
    try {
      // Here you would call your contract to set the fee tier
      // This is a mock implementation
      
      // Example:
      // await setDefaultFeeTier(
      //   TOKEN_ADDRESSES[tokenA as keyof typeof TOKEN_ADDRESSES],
      //   TOKEN_ADDRESSES[tokenB as keyof typeof TOKEN_ADDRESSES],
      //   feeTier
      // );
      
      // Mock success
      setTimeout(() => {
        setStatusMessage(`Successfully set fee tier for ${tokenA}/${tokenB} to ${feeTier/10000}%`);
        
      }, 1000);
      
    } catch (error) {
      console.error('Failed to set fee tier:', error);
      setStatusMessage(`Failed to set fee tier: ${error instanceof Error ? error.message : String(error)}`);
      setIsError(true);
    }
  };
  
  // Function to find protocol name by ID
  const getProtocolName = (id: number): string => {
    return PROTOCOLS.find(p => p.id === id)?.name || 'Unknown';
  };
  
  // Function to find token symbol by address
  const getTokenSymbol = (address: string): string => {
    for (const [symbol, addr] of Object.entries(TOKEN_ADDRESSES)) {
      if (addr.toLowerCase() === address.toLowerCase()) {
        return symbol;
      }
    }
    return 'Unknown';
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Header />
      
      <main className="container mx-auto px-4 py-8 flex-grow">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900">Universal Vault Admin Dashboard</h1>
          {!isConnected && (
            <div className="mt-4 p-4 bg-yellow-100 rounded-lg border border-yellow-300">
              <p className="text-yellow-800">Please connect your wallet with admin access to manage the vault system.</p>
            </div>
          )}
        </div>
        
        {isConnected && (
          <>
            {/* Tab Navigation */}
            <div className="flex border-b mb-6">
              <button 
                className={`py-2 px-4 font-medium ${activeTab === 'pools' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-500'}`}
                onClick={() => setActiveTab('pools')}
              >
                Manage Pools
              </button>
              <button 
                className={`py-2 px-4 font-medium ${activeTab === 'adapters' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-500'}`}
                onClick={() => setActiveTab('adapters')}
              >
                Set Adapters
              </button>
              <button 
                className={`py-2 px-4 font-medium ${activeTab === 'fees' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-500'}`}
                onClick={() => setActiveTab('fees')}
              >
                Fee Tiers
              </button>
              <button 
                className={`py-2 px-4 font-medium ${activeTab === 'system' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-500'}`}
                onClick={() => setActiveTab('system')}
              >
                System Status
              </button>
            </div>
            
            {/* Status message */}
            {statusMessage && (
              <div className={`mb-6 p-4 rounded-lg ${isError ? 'bg-red-100 border border-red-300 text-red-800' : 'bg-green-100 border border-green-300 text-green-800'}`}>
                <p>{statusMessage}</p>
              </div>
            )}
            
            {/* Pools Tab */}
            {activeTab === 'pools' && (
              <div>
                <div className="mb-8">
                  <h2 className="text-xl font-bold mb-4 text-gray-800">Current Pools</h2>
                  
                  {loadingPools ? (
                    <div className="text-center py-8">
                      <p className="text-gray-500">Loading pools...</p>
                    </div>
                  ) : availablePools.length === 0 ? (
                    <div className="text-center py-8 bg-gray-100 rounded-lg">
                      <p className="text-gray-700">No pools available. Add your first pool below.</p>
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="min-w-full bg-white border rounded-lg shadow-sm">
                        <thead>
                          <tr className="bg-gray-100">
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">Pool Name</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">Pool Address</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">Underlying Token</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">Protocol</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">Actions</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200">
                          {availablePools.map((poolName) => {
                            const details = poolDetails[poolName] || {};
                            return (
                              <tr key={poolName} className="hover:bg-gray-50">
                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{poolName}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                  {details.poolAddress ? 
                                    `${details.poolAddress.substring(0, 6)}...${details.poolAddress.substring(details.poolAddress.length - 4)}` : 
                                    'N/A'}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                  {details.underlyingToken ? 
                                    getTokenSymbol(details.underlyingToken) : 
                                    'N/A'}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                  {details.protocol !== undefined ? 
                                    getProtocolName(details.protocol) : 
                                    'N/A'}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                  <button className="text-blue-600 hover:text-blue-800 mr-2">View</button>
                                  <button className="text-red-600 hover:text-red-800">Remove</button>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
                
                <div className="bg-white p-6 rounded-lg shadow-sm">
                  <h2 className="text-xl font-bold mb-4 text-gray-800">Add New Pool</h2>
                  
                  <form onSubmit={handleAddPool} className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Pool Name
                      </label>
                      <input
                        type="text"
                        value={newPoolName}
                        onChange={(e) => setNewPoolName(e.target.value)}
                        className="w-full p-2 border border-gray-300 rounded-md text-gray-700"
                        placeholder="e.g., STEAKUSDC"
                        required
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Underlying Token
                      </label>
                      <select
                        value={newPoolToken}
                        onChange={(e) => setNewPoolToken(e.target.value)}
                        className="w-full p-2 border border-gray-300 rounded-md text-gray-700"
                        required
                      >
                        {Object.keys(TOKEN_ADDRESSES).map((token) => (
                          <option key={token} value={token}>{token}</option>
                        ))}
                      </select>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Protocol
                      </label>
                      <select
                        value={newPoolProtocol}
                        onChange={(e) => setNewPoolProtocol(parseInt(e.target.value))}
                        className="w-full p-2 border border-gray-300 rounded-md text-gray-700"
                        required
                      >
                        {PROTOCOLS.map((protocol) => (
                          <option key={protocol.id} value={protocol.id}>{protocol.name}</option>
                        ))}
                      </select>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Pool Address
                      </label>
                      <input
                        type="text"
                        value={newPoolAddress}
                        onChange={(e) => setNewPoolAddress(e.target.value)}
                        className="w-full p-2 border border-gray-300 rounded-md text-gray-700"
                        placeholder="0x..."
                        required
                      />
                    </div>
                    
                    <button
                      type="submit"
                      className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 transition"
                    >
                      Add Pool
                    </button>
                  </form>
                </div>
              </div>
            )}
            
            {/* Adapters Tab */}
            {activeTab === 'adapters' && (
              <div>
                <div className="mb-8">
                  <h2 className="text-xl font-bold mb-4 text-gray-800">Adapter Settings</h2>
                  <p className="text-gray-600 mb-4">
                    Configure which protocol adapter to use for each token. This allows the vault to optimize for the highest yield.
                  </p>
                  
                  <div className="bg-white p-6 rounded-lg shadow-sm">
                    <h3 className="text-lg font-semibold mb-4 text-gray-800">Change Token Adapter</h3>
                    
                    <form onSubmit={handleChangeAdapter} className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Token
                        </label>
                        <select
                          value={selectedToken}
                          onChange={(e) => setSelectedToken(e.target.value)}
                          className="w-full p-2 border border-gray-300 rounded-md text-gray-700"
                          required
                        >
                          {Object.keys(TOKEN_ADDRESSES).map((token) => (
                            <option key={token} value={token}>{token}</option>
                          ))}
                        </select>
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Adapter Address
                        </label>
                        <input
                          type="text"
                          value={selectedAdapter}
                          onChange={(e) => setSelectedAdapter(e.target.value)}
                          className="w-full p-2 border border-gray-300 rounded-md text-gray-700"
                          placeholder="0x..."
                          required
                        />
                      </div>
                      
                      <button
                        type="submit"
                        className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 transition"
                      >
                        Change Adapter
                      </button>
                    </form>
                  </div>
                </div>
              </div>
            )}
            
            {/* Fee Tiers Tab */}
            {activeTab === 'fees' && (
              <div>
                <div className="mb-8">
                  <h2 className="text-xl font-bold mb-4 text-gray-800">Swap Fee Tiers</h2>
                  <p className="text-gray-600 mb-4">
                    Set the default fee tiers for token swaps. This affects the liquidity pools used on Uniswap.
                  </p>
                  
                  <div className="bg-white p-6 rounded-lg shadow-sm">
                    <h3 className="text-lg font-semibold mb-4 text-gray-800">Set Default Fee Tier</h3>
                    
                    <form onSubmit={handleSetFeeTier} className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Token A
                          </label>
                          <select
                            value={tokenA}
                            onChange={(e) => setTokenA(e.target.value)}
                            className="w-full p-2 border border-gray-300 rounded-md text-gray-700"
                            required
                          >
                            {Object.keys(TOKEN_ADDRESSES).map((token) => (
                              <option key={token} value={token}>{token}</option>
                            ))}
                          </select>
                        </div>
                        
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Token B
                          </label>
                          <select
                            value={tokenB}
                            onChange={(e) => setTokenB(e.target.value)}
                            className="w-full p-2 border border-gray-300 rounded-md text-gray-700"
                            required
                          >
                            {Object.keys(TOKEN_ADDRESSES).map((token) => (
                              <option key={token} value={token}>{token}</option>
                            ))}
                          </select>
                        </div>
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Fee Tier
                        </label>
                        <select
                          value={feeTier}
                          onChange={(e) => setFeeTier(parseInt(e.target.value))}
                          className="w-full p-2 border border-gray-300 rounded-md text-gray-700"
                          required
                        >
                          <option value={100}>0.01%</option>
                          <option value={500}>0.05%</option>
                          <option value={3000}>0.3%</option>
                          <option value={10000}>1%</option>
                        </select>
                      </div>
                      
                      <button
                        type="submit"
                        className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 transition"
                      >
                        Set Fee Tier
                      </button>
                    </form>
                  </div>
                </div>
              </div>
            )}
            
            {/* System Status Tab */}
            {activeTab === 'system' && (
              <div>
                <div className="mb-8">
                  <h2 className="text-xl font-bold mb-4 text-gray-800">System Status</h2>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {/* Total Value Locked */}
                    <div className="bg-white p-6 rounded-lg shadow-sm">
                      <h3 className="text-lg font-semibold mb-2 text-gray-800">Total Value Locked</h3>
                      <p className="text-3xl font-bold text-blue-600">$1,452,367</p>
                      <p className="text-sm text-gray-500 mt-1">+5.3% from last week</p>
                    </div>
                    
                    {/* Active Pools */}
                    <div className="bg-white p-6 rounded-lg shadow-sm">
                      <h3 className="text-lg font-semibold mb-2 text-gray-800">Active Pools</h3>
                      <p className="text-3xl font-bold text-blue-600">{availablePools.length}</p>
                      <p className="text-sm text-gray-500 mt-1">Across 4 protocols</p>
                    </div>
                    
                    {/* Total Users */}
                    <div className="bg-white p-6 rounded-lg shadow-sm">
                      <h3 className="text-lg font-semibold mb-2 text-gray-800">Total Users</h3>
                      <p className="text-3xl font-bold text-blue-600">247</p>
                      <p className="text-sm text-gray-500 mt-1">+12 in the last 24 hours</p>
                    </div>
                  </div>
                  
                  <div className="mt-8 bg-white p-6 rounded-lg shadow-sm">
                    <h3 className="text-lg font-semibold mb-4 text-gray-800">Protocol Distribution</h3>
                    
                    <div className="space-y-4">
                      {/* AAVE */}
                      <div>
                        <div className="flex justify-between mb-1">
                          <span className="text-sm font-medium text-gray-700">AAVE V3</span>
                          <span className="text-sm font-medium text-gray-700">45%</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2.5">
                          <div className="bg-blue-600 h-2.5 rounded-full" style={{ width: '45%' }}></div>
                        </div>
                      </div>
                      
                      {/* Morpho Blue */}
                      <div>
                        <div className="flex justify-between mb-1">
                          <span className="text-sm font-medium text-gray-700">Morpho Blue</span>
                          <span className="text-sm font-medium text-gray-700">30%</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2.5">
                          <div className="bg-blue-600 h-2.5 rounded-full" style={{ width: '30%' }}></div>
                        </div>
                      </div>
                      
                      {/* Compound */}
                      <div>
                        <div className="flex justify-between mb-1">
                          <span className="text-sm font-medium text-gray-700">Compound V3</span>
                          <span className="text-sm font-medium text-gray-700">15%</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2.5">
                          <div className="bg-blue-600 h-2.5 rounded-full" style={{ width: '15%' }}></div>
                        </div>
                      </div>
                      
                      {/* Euler */}
                      <div>
                        <div className="flex justify-between mb-1">
                          <span className="text-sm font-medium text-gray-700">Euler V2</span>
                          <span className="text-sm font-medium text-gray-700">10%</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2.5">
                          <div className="bg-blue-600 h-2.5 rounded-full" style={{ width: '10%' }}></div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </main>
      
      <footer className="container mx-auto px-4 py-8 text-center text-gray-500 text-sm">
        <p>© 2025 OptiFi. All rights reserved.</p>
      </footer>
    </div>
  );
}