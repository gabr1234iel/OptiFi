// src/app/dashboard/page.tsx
"use client";
import React, { useState } from 'react';
import Header from '../../components/Header';
import UniversalVaultInteraction from '../../components/UniversalVaultInteraction';
import UserHoldings from '../../components/vault/UserHoldings';
import { useWallet } from '../../hooks/useWallet';

export default function DashboardPage() {
    interface PoolDetailsType {
        poolAddress: string;
        underlyingToken: string;
        protocol: number;
        apy?: number; // APY in basis points
      }
  
    const { isConnected } = useWallet();
  
  const [selectedPool, setSelectedPool] = useState<string>('');
  

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
              <UserHoldings onSelectPool={setSelectedPool} />
              
              {/* Recent Activity */}
              <div className="bg-white rounded-lg shadow-md p-6 mt-6">
                <h2 className="text-xl font-bold text-gray-900 mb-4">Recent Activity</h2>
                <div className="space-y-4">
                  {/* Mock activity data */}
                  <div className="border-b pb-3">
                    <div className="flex justify-between">
                      <span className="font-medium text-gray-900">Deposit USDC</span>
                      <span className="text-gray-500">1 hour ago</span>
                    </div>
                    <div className="mt-1 text-sm text-gray-600">
                      Deposited 1,000 USDC into STEAKUSDC pool
                    </div>
                  </div>
                  <div className="border-b pb-3">
                    <div className="flex justify-between">
                      <span className="font-medium text-gray-900">Swap and Deposit</span>
                      <span className="text-gray-500">2 days ago</span>
                    </div>
                    <div className="mt-1 text-sm text-gray-600">
                      Swapped 2 ETH for WETH and deposited into STEAKETH pool
                    </div>
                  </div>
                  <div className="border-b pb-3">
                    <div className="flex justify-between">
                      <span className="font-medium text-gray-900">Yield Harvested</span>
                      <span className="text-gray-500">3 days ago</span>
                    </div>
                    <div className="mt-1 text-sm text-gray-600">
                      Harvested 58.21 USDC yield from Aave V3
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            <div>
              <UniversalVaultInteraction/>
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