"use client";
import React, { useState } from 'react';
import Header from '../components/Header';
import HoldingsDisplay from '../components/HoldingsDisplay';
import UniversalVaultInteraction from '../components/UniversalVaultInteraction';

export default function OptimizedVaultPage() {
  const [showHoldings, setShowHoldings] = useState<boolean>(false);

  const toggleHoldings = () => {
    setShowHoldings(!showHoldings);
  };

  return (
    <div className="app min-h-screen flex flex-col bg-gray-50">
      <Header onHoldingsClick={toggleHoldings} />
      
      <main className="container mx-auto px-4 py-8 flex-grow">
        {showHoldings && (
          <div className="mb-8">
            <HoldingsDisplay />
          </div>
        )}
        
        <div className="mb-8">
          <h2 className="text-2xl font-bold mb-6 text-black">Optimized Yield Vaults</h2>
          <p className="text-gray-700 mb-6">
            Deposit your assets into our optimized vaults to earn the highest yields across Aave and Morpho Blue protocols.
            You can swap any token to the required underlying token in a single transaction.
          </p>
          
          <UniversalVaultInteraction />
        </div>
      </main>
      
      <footer className="container mx-auto px-4 py-8 text-center text-gray-500 text-sm">
        <p>© 2025 OptiFi. All rights reserved.</p>
      </footer>
    </div>
  );
}