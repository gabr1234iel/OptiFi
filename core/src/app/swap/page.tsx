"use client";
import React, { useState } from 'react';
import Header from '../../components/Header';
import TokenSwapper from '../../components/TokenSwapper';
import HoldingsDisplay from '../../components/HoldingsDisplay';

export default function SwapPage() {
  const [showHoldings, setShowHoldings] = useState(false);

  const toggleHoldings = () => {
    setShowHoldings(!showHoldings);
  };

  return (
    <div className="app min-h-screen bg-gray-50 flex flex-col">
      <Header onHoldingsClick={toggleHoldings} />
      
      <main className="container mx-auto px-4 py-8 flex-grow">
        <div className="mb-4">
          <a href="/" className="text-blue-500 hover:underline">← Back to Dashboard</a>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <TokenSwapper />
          {showHoldings && <HoldingsDisplay />}
        </div>
      </main>
      
      <footer className="container mx-auto px-4 py-8 text-center text-gray-500 text-sm">
        <p>© 2025 OptiFi. All rights reserved.</p>
      </footer>
    </div>
  );
}