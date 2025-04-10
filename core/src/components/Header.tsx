import React from 'react';
import Link from 'next/link';
import ConnectWallet from './ConnectWallet';

const Header: React.FC = () => {
  return (
    <header className="flex items-center justify-between px-8 py-4 bg-white border-b-2 border-gray-200 text-black">
      <div className="logo">
        <Link href="/">
          <h1 className='bold text-4xl'>OptiFi</h1>
        </Link>
      </div>
      <ConnectWallet />
    </header>
  );
};

export default Header;