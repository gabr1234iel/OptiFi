// src/components/vault/TokenSelector.tsx
import React from 'react';

// Define token options with improved categorization
const TOKEN_OPTIONS = {
  stablecoins: [
    { symbol: 'USDC', name: 'USD Coin' },
    { symbol: 'USDT', name: 'Tether' },
    { symbol: 'DAI', name: 'Dai' },
    { symbol: 'PYUSD', name: 'PayPal USD' },
    { symbol: 'USDE', name: 'USDE' },
    { symbol: 'USDS', name: 'Sky USD' },
  ],
  'eth-derivatives': [
    { symbol: 'WETH', name: 'Wrapped Ether' },
    { symbol: 'CBETH', name: 'Coinbase ETH' },
    { symbol: 'STETH', name: 'Lido Staked ETH' },
    { symbol: 'WSTETH', name: 'Wrapped Lido Staked ETH' },
    { symbol: 'RETH', name: 'Rocket Pool ETH' },
    { symbol: 'WEETH', name: 'Wrapped EigenLayer ETH' },
    { symbol: 'ETHX', name: 'Stader ETHx' },
  ],
  'btc-derivatives': [
    { symbol: 'WBTC', name: 'Wrapped Bitcoin' }
  ]
};

interface TokenSelectorProps {
  interactionMode: string;
  fromToken: string;
  toToken: string;
  onChangeFromToken: (token: string) => void;
  onChangeToToken: (token: string) => void;
}

const TokenSelector: React.FC<TokenSelectorProps> = ({ 
  interactionMode, 
  fromToken, 
  toToken, 
  onChangeFromToken, 
  onChangeToToken 
}) => {
  // Group tokens by category for the dropdown
  const groupedTokenOptions = Object.entries(TOKEN_OPTIONS).map(([category, tokens]) => ({
    category,
    displayName: category.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' '),
    tokens
  }));
  
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
      {/* From Token (for deposit or swap) */}
      {interactionMode !== 'withdraw' && (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            From Token
          </label>
          <select
            value={fromToken}
            onChange={(e) => onChangeFromToken(e.target.value)}
            className="w-full p-2 border border-gray-300 rounded-md text-gray-700"
            required
          >
            {groupedTokenOptions.map((group) => (
              <optgroup key={group.category} label={group.displayName}>
                {group.tokens.map((token) => (
                  <option key={token.symbol} value={token.symbol}>
                    {token.symbol} - {token.name}
                  </option>
                ))}
              </optgroup>
            ))}
          </select>
        </div>
      )}
      
      {/* To Token (for deposit or withdraw) */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          {interactionMode === 'swap' 
            ? 'To Token' 
            : `Token to ${interactionMode === 'deposit' ? 'Deposit' : 'Withdraw'}`}
        </label>
        <select
          value={toToken}
          onChange={(e) => onChangeToToken(e.target.value)}
          className="w-full p-2 border border-gray-300 rounded-md text-gray-700"
          required
        >
          {groupedTokenOptions.map((group) => (
            <optgroup key={group.category} label={group.displayName}>
              {group.tokens.map((token) => (
                <option key={token.symbol} value={token.symbol}>
                  {token.symbol} - {token.name}
                </option>
              ))}
            </optgroup>
          ))}
        </select>
      </div>
    </div>
  );
};

export default TokenSelector;