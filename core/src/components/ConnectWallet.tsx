import React from 'react';
import { useWallet } from '../hooks/useWallet';

const ConnectWallet: React.FC = () => {
  const { 
    account, 
    balance, 
    network, 
    chainId,
    isConnected, 
    isConnecting, 
    connect,
    handleNetworkChange 
  } = useWallet();

  return (
    <div className="wallet-info">
      {!isConnected ? (
        <button 
          onClick={connect} 
          disabled={isConnecting}
          className="connect-button"
        >
          {isConnecting ? 'Connecting...' : 'Connect Wallet'}
        </button>
      ) : (
        <>
          <div className="account-info">
            <span>{account.substring(0, 6)}...{account.substring(account.length - 4)}</span>
            <span>{balance} ETH</span>
          </div>
          
          <select 
            value={chainId}
            onChange={(e) => handleNetworkChange(e.target.value)}
            className="network-select"
          >
            <option value="0x1">Ethereum</option>
            <option value="0x89">Polygon</option>
            <option value="0xa4b1">Arbitrum</option>
            <option value="0xa">Optimism</option>
            <option value="0x2105">Base</option>
          </select>
        </>
      )}
    </div>
  );
};

export default ConnectWallet;