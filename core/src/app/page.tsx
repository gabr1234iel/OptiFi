"use client";
import React from 'react';
import Header from '../components/Header';
import RiskVault from '../components/RiskVault';
import { vaultData } from '../constants/mockData';
import { RiskLevel } from '../types';

export default function Home() {
  return (
    <div className="app min-h-screen flex flex-col bg-gray-50">
      <Header />
      
      <main className="container mx-auto px-4 py-8 flex-grow">
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