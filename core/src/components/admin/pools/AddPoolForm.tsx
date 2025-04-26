import React, { useState } from 'react';
import { useAdmin } from '../../../contexts/AdminContext';
import { getAvailablePools } from '../../../services/universalVaultService';
import { ethers } from 'ethers';

const AddPoolForm: React.FC = () => {
  const { tokens, protocols, refreshData, setStatusMessage } = useAdmin();
  
  // Form states
  const [poolName, setPoolName] = useState('');
  const [poolToken, setPoolToken] = useState('USDC');
  const [poolProtocol, setPoolProtocol] = useState(0);
  const [poolAddress, setPoolAddress] = useState('');
  const [poolType, setPoolType] = useState<'lending' | 'liquidity' | 'staking'>('lending');
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (isSubmitting) return;
    
    setIsSubmitting(true);
    setStatusMessage('Adding new pool...', false);
    
    try {
      // Check if pool already exists
      const pools = await getAvailablePools();
      if (pools.includes(poolName)) {
        throw new Error('Pool with this name already exists');
      }
      
      // Get the token address
      const token = tokens.find(t => t.symbol === poolToken);
      if (!token) {
        throw new Error('Invalid token selected');
      }
      
      // Validate pool address
      if (!ethers.utils.isAddress(poolAddress)) {
        throw new Error('Invalid pool address');
      }
      
      // In a real implementation, this would call an addPool function
      // For now, just simulate success
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Success
      setStatusMessage(`Successfully added pool: ${poolName}`, false);
      
      // Reset form
      setPoolName('');
      setPoolToken('USDC');
      setPoolProtocol(0);
      setPoolAddress('');
      setPoolType('lending');
      
      // Refresh data
      refreshData();
      
    } catch (error) {
      console.error('Failed to add pool:', error);
      setStatusMessage(`Failed to add pool: ${error instanceof Error ? error.message : String(error)}`, true);
    } finally {
      setIsSubmitting(false);
    }
  };
  
  return (
    <div className="bg-white p-6 rounded-lg shadow-sm mb-8">
      <h2 className="text-xl font-bold mb-4 text-gray-800">Add New Pool</h2>
      
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Pool Name
          </label>
          <input
            type="text"
            value={poolName}
            onChange={(e) => setPoolName(e.target.value)}
            className="w-full p-2 border border-gray-300 rounded-md text-gray-700"
            placeholder="e.g., STEAKUSDC"
            required
            disabled={isSubmitting}
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Underlying Token
          </label>
          <select
            value={poolToken}
            onChange={(e) => setPoolToken(e.target.value)}
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
            Protocol
          </label>
          <select
            value={poolProtocol}
            onChange={(e) => setPoolProtocol(parseInt(e.target.value))}
            className="w-full p-2 border border-gray-300 rounded-md text-gray-700"
            required
            disabled={isSubmitting}
          >
            {protocols.map((protocol) => (
              <option key={protocol.id} value={protocol.id}>{protocol.displayName}</option>
            ))}
          </select>
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Pool Address
          </label>
          <input
            type="text"
            value={poolAddress}
            onChange={(e) => setPoolAddress(e.target.value)}
            className="w-full p-2 border border-gray-300 rounded-md text-gray-700"
            placeholder="0x..."
            required
            disabled={isSubmitting}
          />
        </div>
        
        {/* Pool Type Radio Buttons */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Pool Type
          </label>
          <div className="flex space-x-4">
            <label className="inline-flex items-center">
              <input
                type="radio"
                className="form-radio text-blue-600"
                name="poolType"
                value="lending"
                checked={poolType === 'lending'}
                onChange={() => setPoolType('lending')}
                disabled={isSubmitting}
              />
              <span className="ml-2 text-gray-700">Lending Pool</span>
            </label>
            <label className="inline-flex items-center">
              <input
                type="radio"
                className="form-radio text-blue-600"
                name="poolType"
                value="liquidity"
                checked={poolType === 'liquidity'}
                onChange={() => setPoolType('liquidity')}
                disabled={isSubmitting}
              />
              <span className="ml-2 text-gray-700">Liquidity Pool</span>
            </label>
            <label className="inline-flex items-center">
              <input
                type="radio"
                className="form-radio text-blue-600"
                name="poolType"
                value="staking"
                checked={poolType === 'staking'}
                onChange={() => setPoolType('staking')}
                disabled={isSubmitting}
              />
              <span className="ml-2 text-gray-700">Staking Pool</span>
            </label>
          </div>
        </div>
        
        <button
          type="submit"
          className={`w-full py-3 px-4 rounded-md transition ${
            isSubmitting
              ? 'bg-gray-400 text-white cursor-not-allowed'
              : 'bg-blue-600 text-white hover:bg-blue-700'
          }`}
          disabled={isSubmitting}
        >
          {isSubmitting ? 'Adding Pool...' : 'Add Pool'}
        </button>
      </form>
    </div>
  );
};

export default AddPoolForm;