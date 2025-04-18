"use client";
import React from 'react';
import Link from 'next/link';
import Header from '../components/Header';
import RiskVault from '../components/RiskVault';
import { vaultData } from '../constants/mockData';
import { RiskLevel } from '../types';

export default function Home() {
  return (
    <div className="app min-h-screen flex flex-col bg-gray-50">
      <Header />
      
      <main className="container mx-auto px-4 py-8 flex-grow">
        <div className="mb-8 bg-blue-100 p-4 rounded-lg border border-blue-300">
          <h3 className="text-lg font-bold text-blue-800 mb-2">🚀 New Feature</h3>
          <p className="text-blue-700 mb-2">
            Try our new Optimized Vault with multi-token support and direct swaps!
          </p>
          <Link href="/optimized" className="inline-block bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition">
            Go to Optimized Vaults
          </Link>
        </div>
        
        <div className="portfolio-section">
          <h2 className="text-2xl font-bold mb-6 text-black">Your Yield Portfolio</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <RiskVault riskLevel="low-risk" data={vaultData['low-risk']} />
            <RiskVault riskLevel="medium-risk" data={vaultData['medium-risk']} />
            <RiskVault riskLevel="high-risk" data={vaultData['high-risk']} />
          </div>
        </div>
      </main>
      
      <footer className="container mx-auto px-4 py-8 text-center text-gray-500 text-sm">
        <p>© 2025 OptiFi. All rights reserved.</p>
      </footer>
    </div>
  );
}