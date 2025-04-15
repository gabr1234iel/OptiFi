import React, { useState, useEffect } from 'react';
import { ethers } from 'ethers';
import { useWallet } from '../hooks/useWallet';

// ABI snippets for the tokens and Uniswap router
const ERC20_ABI = [
  "function balanceOf(address owner) view returns (uint256)",
  "function decimals() view returns (uint8)",
  "function symbol() view returns (string)",
  "function name() view returns (string)",
  "function approve(address spender, uint256 amount) returns (bool)"
];

const WETH_ABI = [
  ...ERC20_ABI,
  "function deposit() external payable",
  "function withdraw(uint) external"
];

// Updated with exactInput for auto-routing
const SWAP_ROUTER_ABI = [
  "function exactInputSingle((address tokenIn, address tokenOut, uint24 fee, address recipient, uint256 deadline, uint256 amountIn, uint256 amountOutMinimum, uint160 sqrtPriceLimitX96)) external payable returns (uint256 amountOut)",
  "function exactInput((bytes path, address recipient, uint256 deadline, uint256 amountIn, uint256 amountOutMinimum)) external payable returns (uint256 amountOut)"
];

// Quoter for auto-routing
const QUOTER_ABI = [
  "function quoteExactInput(bytes path, uint256 amountIn) external view returns (uint256 amountOut)",
  "function quoteExactInputSingle(address tokenIn, address tokenOut, uint24 fee, uint256 amountIn, uint160 sqrtPriceLimitX96) external view returns (uint256 amountOut)"
];

// Extracted token addresses
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
  UNIETH: '0xF1376bceF0f78459C0Ed0ba5ddce976F1ddF51F4',
  METH: '0xd5F7838F5C461fefF7FE49ea5ebaF7728bB0ADfa',
  SUSDE: '0x9d39a5de30e57443bff2a8307a4256c8797a3497'
};

// Common intermediary tokens for routing
const ROUTING_TOKENS = [
  TOKENS.WETH,  // Most tokens have WETH pairs
  TOKENS.USDC,  // Stablecoins often route through USDC
  TOKENS.USDT,  // Another common stablecoin 
  TOKENS.WSTETH // LSTs might route through wstETH
];

// Uniswap V3 Router address
const SWAP_ROUTER = '0xE592427A0AEce92De3Edee1F18E0157C05861564';
// Uniswap V3 Quoter address
const QUOTER = '0xb27308f9F90D607463bb33eA1BeBb41C27CE5AB6';

// Tokens that likely don't have Uniswap routes and need protocol-specific methods
const PROTOCOL_SPECIFIC_TOKENS: string | string[] = [
  // Add tokens identified as needing protocol-specific interactions
  // For example, yield tokens from protocols that don't have liquidity
];

const TokenSwapper: React.FC = () => {
  const { account, isConnected, balance } = useWallet();
  const [provider, setProvider] = useState<ethers.providers.Web3Provider | null>(null);
  const [signer, setSigner] = useState<ethers.Signer | null>(null);
  const [balances, setBalances] = useState<Record<string, string>>({ ETH: '0' });
  
  // ETH to WETH wrapper
  const [wrapAmount, setWrapAmount] = useState<string>('');
  const [isWrapping, setIsWrapping] = useState<boolean>(false);
  const [wrapTxHash, setWrapTxHash] = useState<string>('');
  
  // Token swapping
  const [swapAmount, setSwapAmount] = useState<string>('');
  const [fromToken, setFromToken] = useState<string>('ETH');
  const [toToken, setToToken] = useState<string>('WSTETH');
  const [isSwapping, setIsSwapping] = useState<boolean>(false);
  const [swapTxHash, setSwapTxHash] = useState<string>('');
  
  // UI state
  const [tokenInfo, setTokenInfo] = useState<Record<string, any>>({});
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<'wrap' | 'swap'>('swap');
  
  // Exchange rate info
  const [exchangeRate, setExchangeRate] = useState<number | null>(null);
  const [expectedOutput, setExpectedOutput] = useState<string | null>(null);
  const [routeInfo, setRouteInfo] = useState<string | null>(null);
  const [isProtocolSpecific, setIsProtocolSpecific] = useState<boolean>(false);
  const [swapParams, setSwapParams] = useState<any>(null);

  // Helper to encode path for Uniswap V3 router
  const encodePath = (path: string[], fees: number[]): string => {
    if (path.length !== fees.length + 1) {
      throw new Error('Path and fee lengths are not compatible');
    }
    
    let encoded = '0x';
    for (let i = 0; i < fees.length; i++) {
      encoded += path[i].slice(2); // Remove 0x prefix
      encoded += fees[i].toString(16).padStart(6, '0'); // Convert fee to hex and pad to 3 bytes
    }
    encoded += path[path.length - 1].slice(2); // Add the last token address
    
    return encoded;
  };

  useEffect(() => {
    const init = async () => {
      if (window.ethereum) {
        const provider = new ethers.providers.Web3Provider(window.ethereum);
        setProvider(provider);

        try {
          const signer = provider.getSigner();
          setSigner(signer);
          
          if (isConnected && account) {
            await refreshBalances(provider, account);
          }
        } catch (error) {
          console.error("Error initializing:", error);
        }
      }
    };

    init();
  }, [isConnected, account]);

  // Check if token is protocol-specific
  const isProtocolOnlyToken = (token: string): boolean => {
    return PROTOCOL_SPECIFIC_TOKENS.includes(token);
  };

  // Fetch exchange rate when amount, fromToken or toToken changes
  useEffect(() => {
    const fetchExchangeRate = async () => {
      if (!provider || !swapAmount || isNaN(parseFloat(swapAmount)) || parseFloat(swapAmount) <= 0) {
        setExchangeRate(null);
        setExpectedOutput(null);
        setRouteInfo(null);
        setSwapParams(null);
        return;
      }
      
      // Check if token requires protocol-specific interaction
      const isProtocolOnly = isProtocolOnlyToken(toToken);
      setIsProtocolSpecific(isProtocolOnly);
      
      if (isProtocolOnly) {
        setExchangeRate(null);
        setExpectedOutput("Protocol-specific token");
        setRouteInfo(null);
        setSwapParams(null);
        return;
      }

      try {
        const isFromETH = fromToken === 'ETH';
        // For ETH, we use WETH address for quotes
        const tokenInAddress = isFromETH ? TOKENS.WETH : TOKENS[fromToken as keyof typeof TOKENS];
        const tokenOutAddress = TOKENS[toToken as keyof typeof TOKENS];
        
        if (!tokenInAddress || !tokenOutAddress) {
          setExchangeRate(null);
          setExpectedOutput("Token address not found");
          setSwapParams(null);
          return;
        }

        // Make sure we have token info for decimals
        const tokenInDecimals = isFromETH ? 18 : tokenInfo[fromToken]?.decimals || 18;
        const tokenOutDecimals = tokenInfo[toToken]?.decimals || 18;
        
        const amountIn = ethers.utils.parseUnits(swapAmount, tokenInDecimals);
        
        // Create quoter contract
        const quoterContract = new ethers.Contract(
          QUOTER,
          QUOTER_ABI,
          provider
        );
        
        // Try direct quote first with different fee tiers
        const feeTiers = [100, 500, 3000, 10000]; // 0.01%, 0.05%, 0.3%, 1%
        let bestQuote = null;
        let bestFeeTier = 3000;
        let routeDescription = '';
        let bestParams = null;
        
        // Try direct path first
        for (const fee of feeTiers) {
          try {
            const quote = await quoterContract.quoteExactInputSingle(
              tokenInAddress,
              tokenOutAddress,
              fee,
              amountIn,
              0
            );
            
            if (!bestQuote || quote.gt(bestQuote)) {
              bestQuote = quote;
              bestFeeTier = fee;
              routeDescription = `Direct: ${fromToken} → ${toToken} (${fee/10000}% fee)`;
              
              // Store params for direct swap
              bestParams = {
                type: 'exactInputSingle',
                params: {
                  tokenIn: tokenInAddress,
                  tokenOut: tokenOutAddress,
                  fee: fee,
                  recipient: account,
                  deadline: Math.floor(Date.now() / 1000) + 1800,
                  amountIn: amountIn,
                  amountOutMinimum: 0,
                  sqrtPriceLimitX96: 0
                }
              };
            }
          } catch (error) {
            // Continue to next fee tier
          }
        }
        
        // If direct path fails, try routing through common intermediaries
        if (!bestQuote) {
          for (const intermediary of ROUTING_TOKENS) {
            // Skip if intermediary is the same as input or output
            if (intermediary === tokenInAddress || intermediary === tokenOutAddress) continue;
            
            for (const fee1 of feeTiers) {
              for (const fee2 of feeTiers) {
                try {
                  // Create path for two-hop swap
                  const path = encodePath(
                    [tokenInAddress, intermediary, tokenOutAddress],
                    [fee1, fee2]
                  );
                  
                  const quote = await quoterContract.quoteExactInput(path, amountIn);
                  
                  if (!bestQuote || quote.gt(bestQuote)) {
                    bestQuote = quote;
                    
                    // Get symbol for intermediary token
                    const interSymbol = Object.entries(TOKENS).find(
                      ([_, addr]) => addr.toLowerCase() === intermediary.toLowerCase()
                    )?.[0] || 'Unknown';
                    
                    routeDescription = `Multi-hop: ${fromToken} → ${interSymbol} → ${toToken} (${fee1/10000}% + ${fee2/10000}% fees)`;
                    
                    // Store params for multi-hop swap
                    bestParams = {
                      type: 'exactInput',
                      params: {
                        path: path,
                        recipient: account,
                        deadline: Math.floor(Date.now() / 1000) + 1800,
                        amountIn: amountIn,
                        amountOutMinimum: 0
                      }
                    };
                  }
                } catch (error) {
                  // Continue to next combination
                }
              }
            }
          }
        }
        
        if (bestQuote) {
          // Calculate expected output
          const outputAmount = ethers.utils.formatUnits(bestQuote, tokenOutDecimals);
          setExpectedOutput(outputAmount);
          
          // Calculate exchange rate: 1A = XB
          const rate = parseFloat(outputAmount) / parseFloat(swapAmount);
          setExchangeRate(rate);
          
          // Set route info
          setRouteInfo(routeDescription);
          
          // Store swap params
          setSwapParams(bestParams);
        } else {
          setExchangeRate(null);
          setExpectedOutput("No route found");
          setRouteInfo(null);
          setSwapParams(null);
        }
      } catch (error) {
        console.error("Error fetching exchange rate:", error);
        setExchangeRate(null);
        setExpectedOutput("Error fetching rate");
        setRouteInfo(null);
        setSwapParams(null);
      }
    };

    if (activeTab === 'swap') {
      fetchExchangeRate();
    }
  }, [provider, swapAmount, fromToken, toToken, tokenInfo, activeTab, account]);

  const refreshBalances = async (provider: ethers.providers.Web3Provider, address: string) => {
    setIsLoading(true);
    try {
      // Get ETH balance
      const ethBalance = await provider.getBalance(address);
      let newBalances: Record<string, string> = {
        ETH: ethers.utils.formatEther(ethBalance)
      };
      
      // Gather token info and balances
      const tokenInfoTemp: Record<string, any> = {};

      for (const [symbol, tokenAddress] of Object.entries(TOKENS)) {
        try {
          const tokenContract = new ethers.Contract(tokenAddress, ERC20_ABI, provider);
          const balance = await tokenContract.balanceOf(address);
          const decimals = await tokenContract.decimals();
          let tokenSymbol;
          
          try {
            tokenSymbol = await tokenContract.symbol();
          } catch (error) {
            tokenSymbol = symbol; // Use the key as fallback
          }
          
          // Only add tokens with non-zero balance to the balances object
          if (balance.gt(0)) {
            newBalances[symbol] = ethers.utils.formatUnits(balance, decimals);
          } else {
            // Include zero balances for common tokens
            newBalances[symbol] = '0';
          }

          // Store token info
          tokenInfoTemp[symbol] = {
            address: tokenAddress,
            decimals,
            symbol: tokenSymbol
          };
        } catch (error) {
          console.error(`Error loading info for ${symbol}:`, error);
          tokenInfoTemp[symbol] = {
            address: tokenAddress,
            decimals: 18, // Default
            symbol: symbol
          };
        }
      }

      setBalances(newBalances);
      setTokenInfo(tokenInfoTemp);
    } catch (error) {
      console.error("Error fetching balances:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleWrap = async () => {
    if (!wrapAmount || isNaN(parseFloat(wrapAmount)) || parseFloat(wrapAmount) <= 0) {
      alert("Please enter a valid amount");
      return;
    }

    if (!signer || !account) {
      alert("Please connect your wallet");
      return;
    }

    setIsWrapping(true);
    setWrapTxHash('');

    try {
      const amountIn = ethers.utils.parseEther(wrapAmount);
      const wethContract = new ethers.Contract(TOKENS.WETH, WETH_ABI, signer);
      
      const tx = await wethContract.deposit({ value: amountIn });
      await tx.wait();
      
      setWrapTxHash(tx.hash);
      alert(`Successfully wrapped ${wrapAmount} ETH to WETH`);
      
      // Refresh balances
      if (provider && account) {
        await refreshBalances(provider, account);
      }
    } catch (error: any) {
      console.error("Error wrapping ETH:", error);
      alert(`Error: ${error.message}`);
    } finally {
      setIsWrapping(false);
    }
  };

  const handleSwap = async () => {
    if (!swapAmount || isNaN(parseFloat(swapAmount)) || parseFloat(swapAmount) <= 0) {
      alert("Please enter a valid amount");
      return;
    }

    if (!signer || !account) {
      alert("Please connect your wallet");
      return;
    }
    
    // Check if token is protocol-specific
    if (isProtocolSpecific) {
      alert(`${toToken} needs to be acquired directly from its protocol. Uniswap routing is not available.`);
      return;
    }
    
    // Ensure we have a route
    if (!swapParams || expectedOutput === "No route found") {
      alert("No valid swap route found for this token pair");
      return;
    }

    setIsSwapping(true);
    setSwapTxHash('');

    try {
      const isFromETH = fromToken === 'ETH';
      const tokenInAddress = isFromETH ? TOKENS.WETH : TOKENS[fromToken as keyof typeof TOKENS];
      const router = new ethers.Contract(SWAP_ROUTER, SWAP_ROUTER_ABI, signer);
      
      if (swapParams.type === 'exactInputSingle') {
        // Single-hop swap
        let tx;
        if (isFromETH) {
          // Direct from ETH requires sending value
          tx = await router.exactInputSingle(swapParams.params, { 
            value: swapParams.params.amountIn 
          });
        } else {
          // First approve the router to spend tokens
          const tokenContract = new ethers.Contract(tokenInAddress, ERC20_ABI, signer);
          const approveTx = await tokenContract.approve(SWAP_ROUTER, swapParams.params.amountIn);
          await approveTx.wait();
          
          // Then swap
          tx = await router.exactInputSingle(swapParams.params);
        }
        
        const receipt = await tx.wait();
        setSwapTxHash(receipt.transactionHash);
      } else if (swapParams.type === 'exactInput') {
        // Multi-hop swap
        let tx;
        if (isFromETH) {
          // When using ETH as input, we need to send the ETH value
          tx = await router.exactInput(swapParams.params, { 
            value: swapParams.params.amountIn 
          });
        } else {
          // First approve the router to spend tokens
          const tokenContract = new ethers.Contract(tokenInAddress, ERC20_ABI, signer);
          const approveTx = await tokenContract.approve(SWAP_ROUTER, swapParams.params.amountIn);
          await approveTx.wait();
          
          // Then execute the multi-hop swap
          tx = await router.exactInput(swapParams.params);
        }
        
        const receipt = await tx.wait();
        setSwapTxHash(receipt.transactionHash);
      }
      
      alert(`Successfully swapped ${fromToken} for ${toToken}`);
      
      // Refresh balances
      if (provider && account) {
        await refreshBalances(provider, account);
      }
    } catch (error: any) {
      console.error("Error swapping tokens:", error);
      alert(`Error: ${error.message}`);
    } finally {
      setIsSwapping(false);
    }
  };

  const filteredTokens = Object.keys(TOKENS).filter(symbol => 
    symbol.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Get list of tokens with balances
  const tokensWithBalances = Object.keys(balances).filter(token => parseFloat(balances[token]) > 0);

  return (
    <div className="p-6 bg-white rounded-xl shadow-md">
      <h2 className="text-2xl font-bold mb-4 text-black">Anvil Token Swapper</h2>
      
      {/* Tab switcher */}
      <div className="flex border-b mb-6">
        <button 
          className={`py-2 px-4 font-medium ${activeTab === 'wrap' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-500'}`}
          onClick={() => setActiveTab('wrap')}
        >
          ETH → WETH
        </button>
        <button 
          className={`py-2 px-4 font-medium ${activeTab === 'swap' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-500'}`}
          onClick={() => setActiveTab('swap')}
        >
          Token Swap
        </button>
      </div>
      
      {/* ETH to WETH Tab */}
      {activeTab === 'wrap' && (
        <div className="space-y-4">
          <div className='text-gray-700'>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Amount (ETH)
            </label>
            <input
              type="number"
              value={wrapAmount}
              onChange={(e) => setWrapAmount(e.target.value)}
              placeholder="0.0"
              className="w-full p-2 border border-gray-300 rounded"
            />
            
            {balances.ETH && (
              <div className="text-xs text-gray-500 mt-1">
                Available: {parseFloat(balances.ETH).toFixed(4)} ETH
              </div>
            )}
          </div>
          
          <button
            onClick={handleWrap}
            disabled={isWrapping || !isConnected}
            className="w-full bg-blue-600 text-white py-2 px-4 rounded hover:bg-blue-700 disabled:bg-blue-400"
          >
            {isWrapping ? 'Wrapping...' : isConnected ? 'Wrap ETH to WETH' : 'Connect Wallet First'}
          </button>
          
          {wrapTxHash && (
            <div className="mt-4 p-3 bg-green-50 text-green-800 rounded">
              <p className="font-semibold">Transaction successful!</p>
              <p className="text-xs break-all">Hash: {wrapTxHash}</p>
            </div>
          )}
        </div>
      )}
      
      {/* Token Swap Tab */}
      {activeTab === 'swap' && (
        <div className="space-y-4">
          <div className='text-gray-700'>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              From Token
            </label>
            <select
              value={fromToken}
              onChange={(e) => setFromToken(e.target.value)}
              className="w-full p-2 border border-gray-300 rounded mb-1"
            >
              {tokensWithBalances.length > 0 ? (
                tokensWithBalances.map(symbol => (
                  <option key={symbol} value={symbol}>{symbol}</option>
                ))
              ) : (
                <>
                  <option value="ETH">ETH</option>
                  <option value="WETH">WETH</option>
                </>
              )}
            </select>
            
            {balances[fromToken] && (
              <div className="text-xs text-gray-500 mb-4">
                Available: {parseFloat(balances[fromToken]).toFixed(4)} {fromToken}
              </div>
            )}

            <label className="block text-sm font-medium text-gray-700 mb-1">
              Amount
            </label>
            <input
              type="number"
              value={swapAmount}
              onChange={(e) => setSwapAmount(e.target.value)}
              placeholder="0.0"
              className="w-full p-2 border border-gray-300 rounded mb-4"
            />
          </div>
          
          <div className='text-gray-700'>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Search Token
            </label>
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search by symbol"
              className="w-full p-2 border border-gray-300 rounded mb-2"
            />
            
            <label className="block text-sm font-medium text-gray-700 mb-1">
              To Token
            </label>
            <select
              value={toToken}
              onChange={(e) => setToToken(e.target.value)}
              className="w-full p-2 border border-gray-300 rounded mb-1"
            >
              {filteredTokens.map(symbol => (
                <option key={symbol} value={symbol}>{symbol}</option>
              ))}
            </select>
          </div>
          
          {/* Display route information */}
          {routeInfo && (
            <div className="text-xs text-green-500 mt-1 mb-3">
              ✓ {routeInfo}
            </div>
          )}
          
          {exchangeRate && (
            <div className="p-4 bg-gray-50 rounded-lg border border-gray-200 text-gray-700">
              <h3 className="font-medium mb-2">Exchange Rate:</h3>
              <p>1 {fromToken} = {exchangeRate.toFixed(6)} {toToken}</p>
              {expectedOutput && (
                <p className="mt-2">Expected output: {parseFloat(expectedOutput).toFixed(6)} {toToken}</p>
              )}
            </div>
          )}
          
          {/* Show warning for unsupported tokens */}
          {isProtocolSpecific && (
            <div className="p-4 bg-yellow-50 rounded-lg border border-yellow-200 text-yellow-800">
              <h3 className="font-medium mb-2">Protocol-Specific Token</h3>
              <p>This token needs to be acquired directly from its protocol.</p>
              <p className="mt-2 text-sm">Check the token's documentation for how to mint or acquire it.</p>
            </div>
          )}
          
          {!isProtocolSpecific && expectedOutput === "No route found" && (
            <div className="p-4 bg-yellow-50 rounded-lg border border-yellow-200 text-yellow-800">
              <h3 className="font-medium mb-2">No Swap Route Available</h3>
              <p>Uniswap couldn't find a route between these tokens.</p>
              <p className="mt-2 text-sm">Try a different token pair or acquire through the token's protocol.</p>
            </div>
          )}
          
          <button
            onClick={handleSwap}
            disabled={
              isSwapping || 
              !isConnected || 
              parseFloat(balances[fromToken] || '0') <= 0 ||
              isProtocolSpecific ||
              expectedOutput === "No route found"
            }
            className="w-full bg-blue-600 text-white py-2 px-4 rounded hover:bg-blue-700 disabled:bg-blue-400"
          >
            {isSwapping ? 'Swapping...' : 
             !isConnected ? 'Connect Wallet First' : 
             parseFloat(balances[fromToken] || '0') <= 0 ? `No ${fromToken} Balance` :
             isProtocolSpecific ? 'Protocol-Specific Token' :
             expectedOutput === "No route found" ? 'No Swap Route Found' :
             `Swap ${fromToken} to ${toToken}`}
          </button>
          
          {swapTxHash && (
            <div className="mt-4 p-3 bg-green-50 text-green-800 rounded">
              <p className="font-semibold">Transaction successful!</p>
              <p className="text-xs break-all">Hash: {swapTxHash}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default TokenSwapper;