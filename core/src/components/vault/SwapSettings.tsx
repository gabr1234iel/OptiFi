// src/components/vault/SwapSettings.tsx
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

// Common pool fee options for Uniswap
const FEE_OPTIONS = [
  { value: 100, label: '0.01%' },
  { value: 500, label: '0.05%' },
  { value: 3000, label: '0.3%' },
  { value: 10000, label: '1%' }
];

interface SwapSettingsProps {
  useMultihop: boolean;
  onToggleMultihop: () => void;
  intermediateToken: string;
  onChangeIntermediateToken: (token: string) => void;
  fee1: number;
  onChangeFee1: (fee: number) => void;
  fee2: number;
  onChangeFee2: (fee: number) => void;
  fromToken: string;
  toToken: string;
}

const SwapSettings: React.FC<SwapSettingsProps> = ({
  useMultihop,
  onToggleMultihop,
  intermediateToken,
  onChangeIntermediateToken,
  fee1,
  onChangeFee1,
  fee2,
  onChangeFee2,
  fromToken,
  toToken
}) => {
  // Group tokens by category for the dropdown
  const groupedTokenOptions = Object.entries(TOKEN_OPTIONS).map(([category, tokens]) => ({
    category,
    displayName: category.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' '),
    tokens
  }));
  
  return (
    <div className="mb-4">
      <div className="flex items-center mb-2">
        <input
          type="checkbox"
          id="useMultihop"
          checked={useMultihop}
          onChange={onToggleMultihop}
          className="mr-2 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
        />
        <label htmlFor="useMultihop" className="text-sm font-medium text-gray-700">
          Use Multi-hop Swap (for better rates on some pairs)
        </label>
      </div>
      
      {useMultihop && (
        <div className="pl-6 border-l-2 border-gray-200 mt-2 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Intermediate Token
            </label>
            <select
              value={intermediateToken}
              onChange={(e) => onChangeIntermediateToken(e.target.value)}
              className="w-full p-2 border border-gray-300 rounded-md text-gray-700"
              required
            >
              {groupedTokenOptions.map((group) => (
                <optgroup key={group.category} label={group.displayName}>
                  {group.tokens
                    .filter(token => token.symbol !== fromToken && token.symbol !== toToken)
                    .map((token) => (
                      <option key={token.symbol} value={token.symbol}>
                        {token.symbol} - {token.name}
                      </option>
                    ))
                  }
                </optgroup>
              ))}
            </select>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                First Hop Fee
              </label>
              <select
                value={fee1}
                onChange={(e) => onChangeFee1(parseInt(e.target.value))}
                className="w-full p-2 border border-gray-300 rounded-md text-gray-700"
                required
              >
                {FEE_OPTIONS.map((fee) => (
                  <option key={fee.value} value={fee.value}>
                    {fee.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Second Hop Fee
              </label>
              <select
                value={fee2}
                onChange={(e) => onChangeFee2(parseInt(e.target.value))}
                className="w-full p-2 border border-gray-300 rounded-md text-gray-700"
                required
              >
                {FEE_OPTIONS.map((fee) => (
                  <option key={fee.value} value={fee.value}>
                    {fee.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
          
          <div className="text-sm text-gray-600">
            <div className="font-medium mb-1">Swap Path:</div>
            <div className="flex items-center">
              <span className="mr-2">{fromToken}</span>
              <svg className="h-4 w-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
              <span className="mx-2">{intermediateToken}</span>
              <svg className="h-4 w-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
              <span className="ml-2">{toToken}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SwapSettings;