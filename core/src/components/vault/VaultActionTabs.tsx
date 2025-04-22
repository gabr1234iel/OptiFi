// src/components/vault/VaultActionTabs.tsx
import React from 'react';

interface VaultActionTabsProps {
  activeTab: string;
  onChange: (tab: string) => void;
}

const VaultActionTabs: React.FC<VaultActionTabsProps> = ({ activeTab, onChange }) => {
  return (
    <div className="mb-6">
      <div className="flex space-x-2">
        <button 
          onClick={() => onChange('deposit')}
          className={`flex-1 py-2 px-4 rounded-md transition ${
            activeTab === 'deposit' 
              ? 'bg-blue-600 text-white' 
              : 'bg-gray-200 text-gray-800 hover:bg-gray-300'
          }`}
        >
          Deposit
        </button>
        <button 
          onClick={() => onChange('withdraw')}
          className={`flex-1 py-2 px-4 rounded-md transition ${
            activeTab === 'withdraw' 
              ? 'bg-blue-600 text-white' 
              : 'bg-gray-200 text-gray-800 hover:bg-gray-300'
          }`}
        >
          Withdraw
        </button>
        <button 
          onClick={() => onChange('swap')}
          className={`flex-1 py-2 px-4 rounded-md transition ${
            activeTab === 'swap' 
              ? 'bg-blue-600 text-white' 
              : 'bg-gray-200 text-gray-800 hover:bg-gray-300'
          }`}
        >
          Swap Only
        </button>
      </div>
    </div>
  );
};

export default VaultActionTabs;