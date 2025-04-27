"use client";
import React, { useState, useEffect } from 'react';
import Header from '@/components/Header';
import StatusMessage from '@/components/admin/StatusMessage';
import TabNavigation from '@/components/admin/TabNavigation';
import PoolsTab from '@/components/admin/pools/PoolsTab';
import AdaptersTab from '@/components/admin/adapters/AdaptersTab';
import FeeTiersTab from '@/components/admin/fees/FeeTierTabs';
import SystemStatusTab from '@/components/admin/system/SystemStatusTabs';
import { useWallet } from '../../hooks/useWallet';
import { AdminProvider, useAdmin } from '../../contexts/AdminContext';

// Internal component that uses the AdminContext
const AdminDashboardContent: React.FC = () => {
  const { isConnected, account } = useWallet();
  const { statusMessage, isError, setStatusMessage } = useAdmin();
  const [activeTab, setActiveTab] = useState('pools');
  const [isOwner, setIsOwner] = useState(false);

  // Check if current account is the vault owner
  useEffect(() => {
    const checkIsOwner = async () => {
      if (!isConnected || !account) return false;
      
      try {
        // In a real implementation, this would check if the account is the owner
        // For now, just simulate success for testing
        setIsOwner(true);
      } catch (error) {
        console.error('Error checking owner:', error);
        setIsOwner(false);
      }
    };
    
    if (isConnected && account) {
      checkIsOwner();
    } else {
      setIsOwner(false);
    }
  }, [isConnected, account]);

  // Tab definitions
  const tabs = [
    { id: 'pools', label: 'Manage Pools' },
    { id: 'adapters', label: 'Set Adapters' },
    { id: 'fees', label: 'Fee Tiers' },
    { id: 'system', label: 'System Status' },
  ];

  // Handle tab change
  const handleTabChange = (tabId: string) => {
    setActiveTab(tabId);
  };

  // Clear status message
  const clearStatusMessage = () => {
    setStatusMessage('', false);
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
          
          {isConnected && !isOwner && (
            <div className="mt-4 p-4 bg-red-100 rounded-lg border border-red-300">
              <p className="text-red-800">Your connected wallet does not have admin privileges.</p>
            </div>
          )}
        </div>
        
        {isConnected && isOwner && (
          <>
            {/* Tab Navigation */}
            <TabNavigation 
              activeTab={activeTab} 
              onTabChange={handleTabChange} 
              tabs={tabs} 
            />
            
            {/* Status Message */}
            <StatusMessage 
              message={statusMessage} 
              isError={isError} 
              onDismiss={clearStatusMessage} 
            />
            
            {/* Tab Content */}
            {activeTab === 'pools' && <PoolsTab />}
            {activeTab === 'adapters' && <AdaptersTab />}
            {activeTab === 'fees' && <FeeTiersTab />}
            {activeTab === 'system' && <SystemStatusTab />}
          </>
        )}
      </main>
      
      <footer className="container mx-auto px-4 py-8 text-center text-gray-500 text-sm">
        <p>© 2025 OptiFi. All rights reserved.</p>
      </footer>
    </div>
  );
};

// Wrapper with AdminProvider
export default function AdminDashboard() {
  return (
    <AdminProvider>
      <AdminDashboardContent />
    </AdminProvider>
  );
}