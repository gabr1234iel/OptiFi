import React, { useState, useEffect } from 'react';
import { ethers } from 'ethers';
import { useWallet } from '../hooks/useWallet';

// ABI for ERC20 tokens
const ERC20_ABI = [
  "function balanceOf(address owner) view returns (uint256)",
  "function decimals() view returns (uint8)",
  "function symbol() view returns (string)",
  "function name() view returns (string)"
];

// Token addresses from the CSV
const TOKENS = {
    WETH: '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2',
    USDC: '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48',
    USDT: '0xdAC17F958D2ee523a2206206994597C13D831ec7',
    WBTC: '0x2260fac5e5542a773aa44fbcfedf7c193bc2c599',
    DAI: '0x6B175474E89094C44Da98b954EedeAC495271d0F',
    CBETH: '0xBe9895146f7AF43049ca1c1AE358B0541Ea49704',
    STETH: '0xae7ab96520de3a18e5e111b5eaab095312d7fe84',
    WSTETH: '0x7f39c581f595b53c5cb19bd0b3f8da6c935e2ca0',
    RETH: '0xae78736Cd615f374D3085123A210448E74Fc6393',
    PYUSD: '0x6c3ea9036406852006290770bedfcaba0e23a0e8',
    USDE: '0x4c9edd5852cd905f086c759e8383e09bff1e68b3',
    USDS: '0xdc035d45d973e3ec169d2276ddab16f1e407384f',
    WEETH: '0xcd5fe23c85820f7b72d0926fc9b05b43e359b7ee',
    WBETH: '0xa2e3356610840701bdf5611a53974510ae27e2e1',
    ETHX: '0xa35b1b31ce002fbf2058d22f30f95d405200a15b',
    RSETH: '0xa1290d69c65a6fe4df752f95823fae25cb99e5a7',
    SWETH: '0xf951e335afb289353dc249e82926178eac7ded78',
    OSETH: '0xf1c9acdc66974dfb6decb12aa385b9cd01190e38',
    EZETH: '0xbf5495efe5db9ce00f80364c8b423567e58d2110',
    ANKRETH: '0xae78736Cd615f374D3085123A210448E74Fc6393',
    UNIETH: '0xF1376bceF0f78459C0Ed0ba5ddce976F1ddF51F4'
};

interface TokenBalance {
  balance: string;
  decimals: number;
  symbol: string;
}

const HoldingsDisplay: React.FC = () => {
  const { account, isConnected } = useWallet();
  const [balances, setBalances] = useState<Record<string, TokenBalance>>({});
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    if (isConnected && account) {
      fetchBalances();
    }
  }, [isConnected, account]);

  const fetchBalances = async () => {
    setIsLoading(true);
    try {
      if (!window.ethereum || !account) return;
      
      const provider = new ethers.providers.Web3Provider(window.ethereum);
      
      // Get ETH balance
      const ethBalance = await provider.getBalance(account);
      let newBalances: Record<string, TokenBalance> = {
        ETH: {
          balance: ethers.utils.formatEther(ethBalance),
          decimals: 18,
          symbol: 'ETH'
        }
      };
      
      // Fetch token balances
      for (const [symbol, tokenAddress] of Object.entries(TOKENS)) {
        try {
          const tokenContract = new ethers.Contract(tokenAddress, ERC20_ABI, provider);
          const balance = await tokenContract.balanceOf(account);
          const decimals = await tokenContract.decimals();
          
          if (balance.gt(0)) {
            newBalances[symbol] = {
              balance: ethers.utils.formatUnits(balance, decimals),
              decimals,
              symbol
            };
          }
        } catch (error) {
          console.error(`Error fetching balance for ${symbol}:`, error);
        }
      }
      
      setBalances(newBalances);
    } catch (error) {
      console.error("Error fetching token balances:", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="p-6 bg-white rounded-xl shadow-md">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-2xl font-bold text-black">Your Holdings</h2>
        <button 
          onClick={fetchBalances}
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition"
          disabled={isLoading || !isConnected}
        >
          {isLoading ? 'Refreshing...' : 'Refresh'}
        </button>
      </div>

      {!isConnected ? (
        <div className="text-center text-gray-500 p-4">
          Connect your wallet to see your holdings
        </div>
      ) : isLoading ? (
        <div className="text-center text-gray-700 p-4">
          Loading balances...
        </div>
      ) : (
        <div className="space-y-2 max-h-[500px] overflow-y-auto">
          {Object.entries(balances).length > 0 ? (
            Object.entries(balances).map(([token, data]) => (
              <div key={token} className="flex justify-between p-3 bg-gray-50 rounded-lg mb-2 text-gray-700">
                <span className="font-semibold">{data.symbol}:</span>
                <span>
                  {parseFloat(data.balance).toFixed(data.decimals === 6 ? 2 : 4)}
                </span>
              </div>
            ))
          ) : (
            <div className="text-center text-gray-500 p-4">
              No token balances found
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default HoldingsDisplay;