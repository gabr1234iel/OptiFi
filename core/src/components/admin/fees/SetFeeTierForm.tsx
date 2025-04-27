import React, { useState } from 'react';
import { useAdmin } from '../../../contexts/AdminContext';
import { getUniversalVaultContract } from '../../../services/universalVaultService';

const SetFeeTierForm: React.FC = () => {
  const { tokens, setStatusMessage, refreshData } = useAdmin();
  
  // Form states
  const [tokenA, setTokenA] = useState('USDC');
  const [tokenB, setTokenB] = useState('WETH');
  const [feeTier, setFeeTier] = useState(3000); // Default to 0.3%
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (isSubmitting) return;
    
    // Verify tokens are different
    if (tokenA === tokenB) {
      setStatusMessage('Please select different tokens', true);
      return;
    }
    
    setIsSubmitting(true);
    setStatusMessage('Setting fee tier...', false);
    
    try {
      // Get the vault contract
      const vaultContract = getUniversalVaultContract();
      if (!vaultContract) {
        throw new Error('Vault contract not available');
      }
      
      // Get the token addresses
      const tokenAInfo = tokens.find(t => t.symbol === tokenA);
      const tokenBInfo = tokens.find(t => t.symbol === tokenB);
      
      if (!tokenAInfo || !tokenBInfo) {
        throw new Error('Invalid token selected');
      }
      
      // Call the setDefaultFeeTier function
      const tx = await vaultContract.setDefaultFeeTier(
        tokenAInfo.address, 
        tokenBInfo.address, 
        feeTier
      );
      await tx.wait();
      
      setStatusMessage(`Successfully set fee tier for ${tokenA}/${tokenB} to ${feeTier / 10000}%`, false);
      
      // Refresh data
      refreshData();
      
    } catch (error) {
      console.error('Failed to set fee tier:', error);
      setStatusMessage(`Failed to set fee tier: ${error instanceof Error ? error.message : String(error)}`, true);
    } finally {
      setIsSubmitting(false);
    }
  };
  
  return (
    <div className="bg-white p-6 rounded-lg shadow-sm">
      <h3 className="text-lg font-semibold mb-4 text-gray-800">Set Default Fee Tier</h3>
      
      <form onSubmit={handleSubmit} className="space-y-4">
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
              disabled={isSubmitting}
            >
              {tokens.map((token) => (
                <option key={token.symbol} value={token.symbol}>{token.symbol}</option>
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
              disabled={isSubmitting}
            >
              {tokens.map((token) => (
                <option key={token.symbol} value={token.symbol}>{token.symbol}</option>
              ))}
            </select>
          </div>
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Fee Tier (in basis points)
          </label>
          <input
            type="number"
            value={feeTier}
            onChange={(e) => setFeeTier(parseInt(e.target.value))}
            className="w-full p-2 border border-gray-300 rounded-md text-gray-700"
            required
            disabled={isSubmitting}
          />
          <p className="mt-1 text-xs text-gray-500">
            Common values: 100 (0.01%), 500 (0.05%), 3000 (0.3%), 10000 (1%)
          </p>
        </div>

        <button
          type="submit"
          className={`w-full p-2 text-white bg-blue-600 rounded-md ${isSubmitting ? 'opacity-50 cursor-not-allowed' : 'hover:bg-blue-700'}`}
          disabled={isSubmitting}
        >
          {isSubmitting ? 'Setting...' : 'Set Fee Tier'}
        </button>
      </form>
      <div className="mt-4 text-sm text-gray-600">
        Note: Ensure that the selected tokens are different and valid.
      </div>
    </div>
  );
};

export default SetFeeTierForm;