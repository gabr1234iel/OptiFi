import React, { useState } from 'react';
import Link from 'next/link';
import ConnectWallet from './ConnectWallet';

interface HeaderProps {
  onHoldingsClick?: () => void;
}

const Header: React.FC<HeaderProps> = ({ onHoldingsClick }) => {
  return (
    <header className="flex items-center justify-between px-8 py-4 bg-white border-b-2 border-gray-200 text-black">
      <div className="logo">
        <Link href="/">
          <h1 className='bold text-4xl'>OptiFi</h1>
        </Link>
      </div>
      <div className="flex items-center space-x-4">
        {onHoldingsClick && (
          <button 
            onClick={onHoldingsClick}
            className="px-4 py-2 bg-blue-100 text-blue-700 rounded hover:bg-blue-200 transition"
          >
            My Holdings
          </button>
        )}
        <ConnectWallet />
      </div>
    </header>
  );
};

export default Header;