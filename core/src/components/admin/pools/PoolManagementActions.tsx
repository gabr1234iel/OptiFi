import React, { useState } from 'react';
import { useAdmin } from '../../../contexts/AdminContext';

const PoolManagementActions: React.FC = () => {
  const { setStatusMessage, refreshData } = useAdmin();
  const [isRebalancing, setIsRebalancing] = useState(false);
  const [isWithdrawing, setIsWithdrawing] = useState(false);
  const [isUpdatingAPY, setIsUpdatingAPY] = useState(false);
  const [isOptimizing, setIsOptimizing] = useState(false);
  
  const handleForceRebalance = async () => {
    if (isRebalancing) return;
    
    setIsRebalancing(true);
    setStatusMessage('Rebalancing all pools...', false);
    
    try {
      // In a real implementation, this would call a rebalance function
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      setStatusMessage('Successfully rebalanced all pools', false);
      refreshData();
    } catch (error) {
      console.error('Error rebalancing pools:', error);
      setStatusMessage(
        `Error rebalancing pools: ${error instanceof Error ? error.message : String(error)}`,
        true
      );
    } finally {
      setIsRebalancing(false);
    }
  };
  
  const handleEmergencyWithdraw = async () => {
    if (isWithdrawing) return;
    
    // Ask for confirmation
    if (!window.confirm('Are you sure you want to withdraw all funds from all protocols? This is an emergency action.')) {
      return;
    }
    
    setIsWithdrawing(true);
    setStatusMessage('Emergency withdrawing all funds...', false);
    
    try {
      // In a real implementation, this would call an emergency withdraw function
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      setStatusMessage('Successfully withdrawn all funds', false);
      refreshData();
    } catch (error) {
      console.error('Error withdrawing funds:', error);
      setStatusMessage(
        `Error withdrawing funds: ${error instanceof Error ? error.message : String(error)}`,
        true
      );
    } finally {
      setIsWithdrawing(false);
    }
  };
  
  const handleUpdateAPY = async () => {
    if (isUpdatingAPY) return;
    
    setIsUpdatingAPY(true);
    setStatusMessage('Updating APY data for all pools...', false);
    
    try {
      // In a real implementation, this would update APY data
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      setStatusMessage('Successfully updated APY data', false);
      refreshData();
    } catch (error) {
      console.error('Error updating APY data:', error);
      setStatusMessage(
        `Error updating APY data: ${error instanceof Error ? error.message : String(error)}`,
        true
      );
    } finally {
      setIsUpdatingAPY(false);
    }
  };
  
  const handleOptimizeAllocations = async () => {
    if (isOptimizing) return;
    
    setIsOptimizing(true);
    setStatusMessage('Optimizing pool allocations...', false);
    
    try {
      // In a real implementation, this would optimize allocations
      await new Promise(resolve => setTimeout(resolve, 2500));
      
      setStatusMessage('Successfully optimized pool allocations', false);
      refreshData();
    } catch (error) {
      console.error('Error optimizing allocations:', error);
      setStatusMessage(
        `Error optimizing allocations: ${error instanceof Error ? error.message : String(error)}`,
        true
      );
    } finally {
      setIsOptimizing(false);
    }
  };
  
  return (
    <div className="bg-white p-6 rounded-lg shadow-sm">
      <h2 className="text-xl font-bold mb-4 text-gray-800">Pool Management</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
          <h3 className="text-lg font-semibold mb-3 text-gray-700">Emergency Actions</h3>
          <div className="space-y-2">
            <button 
              className={`w-full py-2 px-4 rounded-md transition ${
                isRebalancing 
                  ? 'bg-orange-400 cursor-not-allowed' 
                  : 'bg-orange-600 hover:bg-orange-700'
              } text-white`}
              onClick={handleForceRebalance}
              disabled={isRebalancing}
            >
              {isRebalancing ? 'Rebalancing...' : 'Force Rebalance All Pools'}
            </button>
            <button 
              className={`w-full py-2 px-4 rounded-md transition ${
                isWithdrawing 
                  ? 'bg-red-400 cursor-not-allowed' 
                  : 'bg-red-600 hover:bg-red-700'
              } text-white`}
              onClick={handleEmergencyWithdraw}
              disabled={isWithdrawing}
            >
              {isWithdrawing ? 'Withdrawing...' : 'Emergency Withdraw All Funds'}
            </button>
          </div>
        </div>
        
        <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
          <h3 className="text-lg font-semibold mb-3 text-gray-700">Maintenance</h3>
          <div className="space-y-2">
            <button 
              className={`w-full py-2 px-4 rounded-md transition ${
                isUpdatingAPY 
                  ? 'bg-blue-400 cursor-not-allowed' 
                  : 'bg-blue-600 hover:bg-blue-700'
              } text-white`}
              onClick={handleUpdateAPY}
              disabled={isUpdatingAPY}
            >
              {isUpdatingAPY ? 'Updating...' : 'Update All APY Data'}
            </button>
            <button 
              className={`w-full py-2 px-4 rounded-md transition ${
                isOptimizing 
                  ? 'bg-green-400 cursor-not-allowed' 
                  : 'bg-green-600 hover:bg-green-700'
              } text-white`}
              onClick={handleOptimizeAllocations}
              disabled={isOptimizing}
            >
              {isOptimizing ? 'Optimizing...' : 'Optimize Pool Allocations'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PoolManagementActions;