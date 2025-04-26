// src/app/dashboard/page.tsx
"use client";
import React, { useState, useEffect } from 'react';
import Header from '../../components/Header';
import UniversalVaultInteraction from '../../components/UniversalVaultInteraction';
import UserHoldings from '../../components/vault/UserHoldings';
import { useWallet } from '../../hooks/useWallet';

export default function DashboardPage() {
  const { isConnected } = useWallet();
  const [showDepositForm, setShowDepositForm] = useState(false);
  const [withdrawToken, setWithdrawToken] = useState<string | null>(null);
  const [activeMode, setActiveMode] = useState<string>('deposit');
  const [activeToken, setActiveToken] = useState<string | undefined>(undefined);

  // Handle when user clicks "Deposit Now" or "Deposit More"
  const handleDepositClick = () => {
    setActiveMode('deposit');
    setActiveToken(undefined);
    setShowDepositForm(true);
    // If there's a token selected for withdrawal, clear it
    setWithdrawToken(null);
  };

  // Handle when user clicks "Withdraw" on a specific token
  const handleWithdrawClick = (token: string) => {
    setActiveMode('withdraw');
    setActiveToken(token);
    setWithdrawToken(token);
    setShowDepositForm(true);
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Header />
      
      <main className="container mx-auto px-4 py-8 flex-grow">
        <h1 className="text-3xl font-bold text-gray-900 mb-6">Universal Vault Dashboard</h1>
        
        {!isConnected ? (
          <div className="bg-white rounded-lg shadow-md p-10 text-center">
            <h2 className="text-2xl font-bold text-gray-800 mb-4">Welcome to Universal Vault</h2>
            <p className="text-lg text-gray-600 mb-8">Connect your wallet to manage your assets across multiple DeFi protocols</p>
            <div className="p-6 bg-blue-50 rounded-lg border border-blue-200 max-w-md mx-auto">
              <h3 className="text-xl font-semibold text-blue-800 mb-4">Benefits</h3>
              <ul className="text-left text-blue-700 space-y-3">
                <li className="flex items-start">
                  <svg className="h-5 w-5 text-blue-500 mr-2 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                  </svg>
                  <span>Best yields across multiple protocols</span>
                </li>
                <li className="flex items-start">
                  <svg className="h-5 w-5 text-blue-500 mr-2 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                  </svg>
                  <span>Swap and deposit in a single transaction</span>
                </li>
                <li className="flex items-start">
                  <svg className="h-5 w-5 text-blue-500 mr-2 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                  </svg>
                  <span>Reduced gas fees with optimized paths</span>
                </li>
                <li className="flex items-start">
                  <svg className="h-5 w-5 text-blue-500 mr-2 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                  </svg>
                  <span>Simple interface for complex DeFi operations</span>
                </li>
              </ul>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div>
              {/* User Holdings Component */}
              <UserHoldings 
                onDepositClick={handleDepositClick}
                onWithdrawClick={handleWithdrawClick}
              />
              
              {/* Recent Activity */}
              <div className="bg-white rounded-lg shadow-md p-6 mt-6">
                <h2 className="text-xl font-bold text-gray-900 mb-4">Recent Activity</h2>
                
                {/* Activity will come from real transactions in the full implementation */}
                <div className="space-y-4">
                  <div className="text-center py-4 text-gray-500">
                    <p>Recent transaction activity will appear here after you make deposits or withdrawals.</p>
                  </div>
                </div>
              </div>
            </div>
            
            <div>
              {/* Simplified interaction component based on user actions */}
              <UniversalVaultInteraction 
                initialMode={activeMode}
                initialToken={activeToken}
              />
            </div>
          </div>
        )}
      </main>
      
      <footer className="container mx-auto px-4 py-8 text-center text-gray-500 text-sm">
        <p>© 2025 OptiFi. All rights reserved.</p>
      </footer>
    </div>
  );
}