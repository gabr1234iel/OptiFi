import React, { useState } from 'react';
import { ethers } from 'ethers';
import { useAdmin } from '../../../contexts/AdminContext';
import { getUniversalVaultContract } from '../../../services/universalVaultService';

const ChangeAdapterForm: React.FC = () => {
  const { tokens, adapters, refreshData, setStatusMessage, ADAPTER_ADDRESSES } = useAdmin();
  
  // Form state
  const [selectedToken, setSelectedToken] = useState('USDC');
  const [selectedAdapter, setSelectedAdapter] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Handle token selection change
  const handleTokenChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const token = e.target.value;
    setSelectedToken(token);
    // Pre-fill with current adapter if exists
    if (adapters[token]) {
      setSelectedAdapter(adapters[token]);
    } else {
      setSelectedAdapter('');
    }
  };
  
  // Handle adapter selection from dropdown
  const handleAdapterSelect = (adapterAddress: string) => {
    setSelectedAdapter(adapterAddress);
  };
  
  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (isSubmitting) return;
    
    setIsSubmitting(true);
    setStatusMessage('Changing adapter...', false);
    
    try {
      // Get the vault contract
      const vaultContract = getUniversalVaultContract();
      if (!vaultContract) {
        throw new Error('Vault contract not available');
      }
      
      // Get the token address
      const token = tokens.find(t => t.symbol === selectedToken);
      if (!token) {
        throw new Error('Invalid token selected');
      }
      
      // Validate the adapter address
      if (!ethers.utils.isAddress(selectedAdapter)) {
        throw new Error('Invalid adapter address');
      }
      
      // Call the setAdapter function
      const tx = await vaultContract.setAdapter(token.address, selectedAdapter);
      await tx.wait();
      
      setStatusMessage(`Successfully changed adapter for ${selectedToken}`, false);
      
      // Reset selected adapter
      setSelectedAdapter('');
      
      // Refresh data
      refreshData();
      
    } catch (error) {
      console.error('Failed to change adapter:', error);
      setStatusMessage(`Failed to change adapter: ${error instanceof Error ? error.message : String(error)}`, true);
    } finally {
      setIsSubmitting(false);
    }
  };
  
  return (
    <div className="bg-white p-6 rounded-lg shadow-sm">
      <h3 className="text-lg font-semibold mb-4 text-gray-800">Change Token Adapter</h3>
      
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Token
          </label>
          <select
            value={selectedToken}
            onChange={handleTokenChange}
            className="w-full p-2 border border-gray-300 rounded-md text-gray-700"
            required
            disabled={isSubmitting}
          >
            {tokens.map((token) => (
              <option key={token.symbol} value={token.symbol}>{token.symbol}</option>
            ))}
          </select>
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Adapter Address
          </label>
          <div className="flex">
            <input
              type="text"
              value={selectedAdapter}
              onChange={(e) => setSelectedAdapter(e.target.value)}
              className="flex-1 p-2 border border-gray-300 rounded-l-md text-gray-700"
              placeholder="0x..."
              required
              disabled={isSubmitting}
            />
            <div className="relative inline-block">
              <button
                type="button"
                className="bg-gray-200 hover:bg-gray-300 text-gray-700 font-medium py-2 px-4 rounded-r-md"
                onClick={() => document.getElementById('adapter-dropdown')?.classList.toggle('hidden')}
                disabled={isSubmitting}
              >
                Select
              </button>
              <div id="adapter-dropdown" className="hidden absolute right-0 mt-2 w-72 bg-white border border-gray-300 rounded-md shadow-lg z-10">
                <div className="p-2 text-sm text-gray-700 border-b border-gray-200">
                  Select an adapter:
                </div>
                <div className="max-h-48 overflow-y-auto">
                  {Object.entries(ADAPTER_ADDRESSES).map(([name, address]) => (
                    <button
                      key={name}
                      type="button"
                      className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                      onClick={() => {
                        handleAdapterSelect(address);
                        document.getElementById('adapter-dropdown')?.classList.add('hidden');
                      }}
                    >
                      <div className="font-medium">{name}</div>
                      <div className="text-xs text-gray-500 truncate">{address}</div>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
          <p className="mt-1 text-xs text-gray-500">
            Enter an adapter address or select from the dropdown
          </p>
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Protocol Adapter Addresses (Reference)
          </label>
          <div className="text-xs bg-gray-50 p-3 rounded border border-gray-200 max-h-40 overflow-y-auto">
            {Object.entries(ADAPTER_ADDRESSES).map(([protocol, address]) => (
              <div key={protocol} className="mb-1">
                <span className="font-medium">{protocol}:</span> {address}
              </div>
            ))}
          </div>
        </div>
        
        <button
          type="submit"
          className={`w-full py-3 px-4 rounded-md transition ${
            isSubmitting ? 'bg-gray-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700'
          } text-white`}
          disabled={isSubmitting}
        >
          {isSubmitting ? 'Changing Adapter...' : 'Change Adapter'}
        </button>
      </form>
    </div>
  );
};

export default ChangeAdapterForm;