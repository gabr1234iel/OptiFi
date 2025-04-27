import React, { useState, useEffect } from 'react';
import { ethers } from 'ethers';
import { useAdmin } from '../../../contexts/AdminContext';
import { getUniversalVaultContract } from '../../../services/universalVaultService';
import { TOKEN_ADAPTER_COMPATIBILITY, PROTOCOL_DISPLAY_NAMES } from '../../../constants/TokenAdapterMap';

const ChangeAdapterForm: React.FC = () => {
  const { tokens, adapters, refreshData, setStatusMessage, ADAPTER_ADDRESSES } = useAdmin();
  
  // Form state
  const [selectedToken, setSelectedToken] = useState('USDC');
  const [selectedAdapter, setSelectedAdapter] = useState('');
  const [selectedProtocol, setSelectedProtocol] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [compatibleProtocols, setCompatibleProtocols] = useState<string[]>([]);
  
  // Handle token selection change
  const handleTokenChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const token = e.target.value;
    setSelectedToken(token);
    
    // Reset protocol selection
    setSelectedProtocol(null);
    setSelectedAdapter('');
    
    // Update compatible protocols list
    updateCompatibleProtocols(token);
    
    // Pre-fill with current adapter if exists
    if (adapters[token]) {
      setSelectedAdapter(adapters[token]);
      
      // Try to match with a known protocol
      const protocolKey = Object.entries(ADAPTER_ADDRESSES).find(
        ([_, address]) => address.toLowerCase() === adapters[token].toLowerCase()
      )?.[0];
      
      if (protocolKey) {
        setSelectedProtocol(protocolKey);
      }
    }
  };
  
  // Update the list of compatible protocols for the selected token
  const updateCompatibleProtocols = (token: string) => {
    const compatibleOnes = TOKEN_ADAPTER_COMPATIBILITY[token] || [];
    setCompatibleProtocols(compatibleOnes);
  };
  
  // Initialize compatible protocols on component mount
  useEffect(() => {
    updateCompatibleProtocols(selectedToken);
    
    // Pre-fill with current adapter if exists
    if (adapters[selectedToken]) {
      setSelectedAdapter(adapters[selectedToken]);
      
      // Try to match with a known protocol
      const protocolKey = Object.entries(ADAPTER_ADDRESSES).find(
        ([_, address]) => address.toLowerCase() === adapters[selectedToken].toLowerCase()
      )?.[0];
      
      if (protocolKey) {
        setSelectedProtocol(protocolKey);
      }
    }
  }, [selectedToken, adapters]);
  
  // Handle protocol selection
  const handleProtocolSelect = (protocol: string) => {
    setSelectedProtocol(protocol);
    setSelectedAdapter(ADAPTER_ADDRESSES[protocol]);
  };
  
  // Handle manual adapter address input
  const handleAdapterAddressChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const address = e.target.value;
    setSelectedAdapter(address);
    
    // Clear protocol selection if address doesn't match any known protocol
    const matchingProtocol = Object.entries(ADAPTER_ADDRESSES).find(
      ([_, adapterAddress]) => adapterAddress.toLowerCase() === address.toLowerCase()
    );
    
    if (!matchingProtocol) {
      setSelectedProtocol(null);
    } else {
      setSelectedProtocol(matchingProtocol[0]);
    }
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
      
      const protocolName = selectedProtocol ? PROTOCOL_DISPLAY_NAMES[selectedProtocol as keyof typeof PROTOCOL_DISPLAY_NAMES] : 'custom adapter';
      setStatusMessage(`Successfully set ${protocolName} adapter for ${selectedToken}`, false);
      
      // Reset form
      setSelectedAdapter('');
      setSelectedProtocol(null);
      
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
      
      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Select Token
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
          
          {/* Current Adapter Info */}
          {adapters[selectedToken] && (
            <div className="mt-2 text-sm text-gray-600">
              <p>
                Current adapter: 
                <span className="ml-1 font-medium text-blue-600">
                  {adapters[`${selectedToken}_PROTOCOL`] || 'Custom Adapter'}
                </span>
              </p>
              <p className="text-xs text-gray-500 truncate mt-1">
                Address: {adapters[selectedToken]}
              </p>
            </div>
          )}
        </div>
        
        {/* Compatible Protocols */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Select Protocol for {selectedToken}
          </label>
          
          {compatibleProtocols.length > 0 ? (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
              {compatibleProtocols.map((protocol) => (
                <button
                  key={protocol}
                  type="button"
                  className={`p-3 text-sm rounded-md border transition ${
                    selectedProtocol === protocol
                      ? 'border-blue-500 bg-blue-50 text-blue-700'
                      : 'border-gray-300 hover:border-gray-400 text-gray-700'
                  }`}
                  onClick={() => handleProtocolSelect(protocol)}
                  disabled={isSubmitting}
                >
                  {PROTOCOL_DISPLAY_NAMES[protocol as keyof typeof PROTOCOL_DISPLAY_NAMES]}
                </button>
              ))}
            </div>
          ) : (
            <div className="p-4 bg-yellow-50 rounded-md text-yellow-700 text-sm">
              No compatible protocols defined for {selectedToken}. You can still manually enter an adapter address below.
            </div>
          )}
        </div>
        
        {/* Manual Adapter Input */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Adapter Address
          </label>
          <input
            type="text"
            value={selectedAdapter}
            onChange={handleAdapterAddressChange}
            className="w-full p-2 border border-gray-300 rounded-md text-gray-700"
            placeholder="0x..."
            required
            disabled={isSubmitting}
          />
          <p className="mt-1 text-xs text-gray-500">
            {selectedProtocol 
              ? `Using ${PROTOCOL_DISPLAY_NAMES[selectedProtocol as keyof typeof PROTOCOL_DISPLAY_NAMES]} adapter` 
              : 'Enter a custom adapter address or select a protocol above'}
          </p>
        </div>
        
        {/* Submit Button */}
        <button
          type="submit"
          className={`w-full py-3 px-4 rounded-md font-medium transition ${
            isSubmitting 
              ? 'bg-gray-400 cursor-not-allowed' 
              : 'bg-blue-600 hover:bg-blue-700 text-white'
          }`}
          disabled={isSubmitting || !selectedAdapter}
        >
          {isSubmitting ? 'Changing Adapter...' : 'Change Adapter'}
        </button>
      </form>
      
      {/* Protocol Information */}
      {selectedProtocol && (
        <div className="mt-6 pt-6 border-t border-gray-200 text-gray-700">
          <h4 className="font-medium text-gray-800 mb-2">About {PROTOCOL_DISPLAY_NAMES[selectedProtocol as keyof typeof PROTOCOL_DISPLAY_NAMES]}</h4>
          <p className="text-sm text-gray-600 mb-2">
            {getProtocolDescription(selectedProtocol)}
          </p>
          <div className="text-xs bg-gray-50 p-2 rounded border border-gray-200">
            <span className="font-medium">Adapter Address:</span> {ADAPTER_ADDRESSES[selectedProtocol]}
          </div>
        </div>
      )}
    </div>
  );
};

// Helper function to get protocol descriptions
function getProtocolDescription(protocol: string): string {
  const descriptions: Record<string, string> = {
    'AAVE_V2': 'Aave V2 is a well-established lending protocol with a strong security record. It offers stable rates and has been battle-tested since 2020.',
    'AAVE_V3': 'Aave V3 is the latest version of the Aave protocol with improved capital efficiency, risk management, and cross-chain capabilities.',
    'METAMORPHO': 'Morpho Blue is an optimized lending protocol that improves capital efficiency by matching lenders and borrowers peer-to-peer when possible.',
    'COMPOUND_V2': 'Compound V2 is one of the oldest and most reliable lending protocols in DeFi, known for its simplicity and security.',
    'COMPOUND_V3': 'Compound V3 (Comet) introduces single-borrower isolation, permission-less markets, and improved capital efficiency.',
    'EULER_V2': 'Euler Finance is a non-custodial protocol that allows users to lend and borrow almost any crypto asset with specialized risk-management features.',
    'FLUID': 'Fluid is a high-performance lending protocol designed to offer institutional-grade liquidity with minimal slippage.',
    'SKYLENDING': 'Sky Lending is a specialized protocol focused on stablecoin lending with optimized interest rates.',
    'SPARKLENDING': 'Spark Lending is a community-driven lending protocol offering competitive rates for a variety of assets.'
  };
  
  return descriptions[protocol] || 'No detailed information available for this protocol.';
}

export default ChangeAdapterForm;