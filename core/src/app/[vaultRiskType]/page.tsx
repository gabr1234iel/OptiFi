"use client";
import React from 'react';
import { useParams } from 'next/navigation';
import Header from '../../components/Header';
import VaultDetails from '../../components/VaultDetails';
import { poolsData } from '../../constants/mockData';
import { RiskLevel } from '../../types';

export default function VaultDetailsPage() {
  const params = useParams();
  const riskLevel = params?.vaultRiskType as RiskLevel || 'low-risk';
  
  // Validate risk level
  const validRiskLevel = ['low-risk', 'medium-risk', 'high-risk'].includes(riskLevel) 
    ? riskLevel 
    : 'low-risk';
  
  const pools = poolsData[validRiskLevel] || [];

  return (
    <div className="app min-h-screen bg-gray-50 flex-col">
      <Header />
      
      <main className="container mx-auto px-4 py-8 flex-grow">
        <div className="mb-4">
          <a href="/" className="text-blue-500 hover:underline">← Back to Dashboard</a>
        </div>
        
        <VaultDetails riskLevel={validRiskLevel} pools={pools} />
      </main>
      
      <footer className="container mx-auto px-4 py-8 text-center text-gray-500 text-sm">
        <p>© 2025 OptiFi. All rights reserved.</p>
      </footer>
    </div>
  );
}