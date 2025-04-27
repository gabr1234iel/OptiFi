import React, { useState, useEffect } from 'react';
import { ethers } from 'ethers';
import { useAdmin } from '../../../contexts/AdminContext';
import { getProvider } from '../../../services/web3';

// Different adapter types and their configuration methods
const ADAPTER_TYPES = {
  'AAVE_V2': { configMethod: 'addSupportedToken', needsAToken: true },
  'AAVE_V3': { configMethod: 'addSupportedToken', needsAToken: true },
  'COMPOUND_V2': { configMethod: 'preconfigured', needsAToken: false },
  'COMPOUND_V3': { configMethod: 'preconfigured', needsAToken: false },
  'EULER_V2': { configMethod: 'addSupportedToken', needsAToken: true },
  'FLUID': { configMethod: 'addSupportedToken', needsAToken: true },
  'METAMORPHO': { configMethod: 'addVault', needsAToken: false },
  'SKYLENDING': { configMethod: 'singleToken', needsAToken: false },
  'SPARKLENDING': { configMethod: 'addSupportedToken', needsAToken: true }
};

// Minimal ABI for different adapter types
const COMMON_ADAPTER_ABI = [
  "function supportedTokens(address token) view returns (bool)"
];

const ADD_SUPPORTED_TOKEN_ABI = [
  ...COMMON_ADAPTER_ABI,
  "function addSupportedToken(address token, address aToken) external",
  "function aTokens(address token) view returns (address)"
];

const METAMORPHO_ADAPTER_ABI = [
  "function addVault(address token, address vault, string calldata name) external returns (uint256 vaultId)",
  "function selectedVault(address token) view returns (uint256)",
  "function vaults(address token, uint256 vaultId) view returns (address vaultAddress, string memory name, bool active)"
];

// aToken addresses from deployment script
const ATOKEN_ADDRESSES: Record<string, Record<string, string>> = {
  'SPARKLENDING': {
    'USDC': '0x377C3bd93f2a2984E1E7bE6A5C22c525eD4A4815',
    'DAI': '0x4DEDf26112B3Ec8eC46e7E31EA5e123490B05B8B',
    'RETH': '0x9985dF20D7e9103ECBCeb16a84956434B6f06ae8',
    'WBTC': '0x4197ba364AE6698015AE5c1468f54087602715b2',
    'WETH': '0x59cD1C87501baa753d0B5B5Ab5D8416A45cD71DB',
    'USDS': '0xC02aB1A5eaA8d1B114EF786D9bde108cD4364359'
  },
  'AAVE_V2': {
    'USDC': '0xBcca60bB61934080951369a648Fb03DF4F96263C',
    'USDT': '0x3Ed3B47Dd13EC9a98b44e6204A523E766B225811',
    'WBTC': '0x9ff58f4fFB29fA2266Ab25e75e2A8b3503311656'
  },
  'AAVE_V3': {
    'CBETH': '0x977b6fc5dE62598B08C85AC8Cf2b745874E8b78c',
    'DAI': '0x018008bfb33d285247A21d44E50697654f754e63',
    'ETHX': '0x1c0E06a0b1A4c160c17545FF2A951bfcA57C0002',
    'PYUSD': '0x0C0d01AbF3e6aDfcA0989eBbA9d6e85dD58EaB1E',
    'RETH': '0xCc9EE9483f662091a1de4795249E24aC0aC2630f',
    'USDC': '0x98C23E9d8f34FEFb1B7BD6a91B7FF122F4e16F5c',
    'USDE': '0x4F5923Fc5FD4a93352581b38B7cD26943012DECF',
    'USDS': '0x32a6268f9Ba3642Dda7892aDd74f1D34469A4259',
    'USDT': '0x23878914EFE38d27C4D67Ab83ed1b93A74D4086a',
    'WBTC': '0x5Ee5bf7ae06D1Be5997A1A72006FE6C607eC6DE8',
    'WEETH': '0xBdfa7b7893081B35Fb54027489e2Bc7A38275129',
    'WETH': '0x4d5F47FA6A74757f35C14fD3a6Ef8E3C9BC514E8',
    'WSTETH': '0x0B925eD163218f6662a35e0f0371Ac234f9E9371'
  }
};

// MetaMorpho vault addresses
const METAMORPHO_VAULTS: Record<string, Record<string, { address: string, name: string }>> = {
  'USDC': {
    'STEAKUSDC': { address: '0xBEEF01735c132Ada46AA9aA4c54623cAA92A64CB', name: 'STEAKUSDC' },
    'BBQUSDC': { address: '0xBEeFFF209270748ddd194831b3fa287a5386f5bC', name: 'BBQUSDC' },
    'REUSDC': { address: '0x0F359FD18BDa75e9c49bC027E7da59a4b01BF32a', name: 'REUSDC' }
  },
  'WETH': {
    'STEAKETH': { address: '0xBEEf050ecd6a16c4e7bfFbB52Ebba7846C4b8cD4', name: 'STEAKETH' },
    'GTWETH': { address: '0x4881Ef0BF6d2365D3dd6499ccd7532bcdBCE0658', name: 'GTWETH' }
  },
  'DAI': {
    'SPDAI': { address: '0x73e65DBD630f90604062f6E02fAb9138e713edD9', name: 'SPDAI' }
  },
  'USDT': {
    'STEAKUSDT': { address: '0xbEef047a543E45807105E51A8BBEFCc5950fcfBa', name: 'STEAKUSDT' }
  },
  'PYUSD': {
    'STEAKPYUSD': { address: '0xbEEF02e5E13584ab96848af90261f0C8Ee04722a', name: 'STEAKPYUSD' }
  },
  'RUSD': {
    'STEAKRUSD': { address: '0xBeEf11eCb698f4B5378685C05A210bdF71093521', name: 'STEAKRUSD' }
  }
};

const AdapterConfiguration: React.FC = () => {
  const { tokens, ADAPTER_ADDRESSES, setStatusMessage, refreshData } = useAdmin();
  
  const [selectedToken, setSelectedToken] = useState('WETH');
  const [selectedAdapter, setSelectedAdapter] = useState('SPARKLENDING');
  const [customAToken, setCustomAToken] = useState('');
  const [metamorphoVault, setMetamorphoVault] = useState<string>('');
  const [metamorphoVaultName, setMetamorphoVaultName] = useState<string>('');
  const [isChecking, setIsChecking] = useState(false);
  const [isSupported, setIsSupported] = useState<boolean | null>(null);
  const [isAddingSupport, setIsAddingSupport] = useState(false);
  const [adapterType, setAdapterType] = useState(ADAPTER_TYPES.SPARKLENDING);
  const [adapterDescription, setAdapterDescription] = useState<string>('');
  
  // Update adapter type when selected adapter changes
  useEffect(() => {
    setAdapterType(ADAPTER_TYPES[selectedAdapter as keyof typeof ADAPTER_TYPES] || { 
      configMethod: 'unknown', 
      needsAToken: false 
    });
    
    // Set description based on adapter type
    switch(selectedAdapter) {
      case 'AAVE_V2':
      case 'AAVE_V3':
      case 'SPARKLENDING':
      case 'EULER_V2':
      case 'FLUID':
        setAdapterDescription(`This adapter requires explicitly adding each token with its corresponding aToken before it can be used.`);
        break;
      case 'COMPOUND_V2':
      case 'COMPOUND_V3':
        setAdapterDescription(`This adapter has pre-configured markets and doesn't require explicit token configuration.`);
        break;
      case 'SKYLENDING':
        setAdapterDescription(`This adapter only supports USDS tokens and doesn't require additional configuration.`);
        break;
      case 'METAMORPHO':
        setAdapterDescription(`This adapter requires adding each vault for a token instead of directly configuring tokens.`);
        break;
      default:
        setAdapterDescription('');
    }
    
    // Pre-fill aToken address if available
    if (ATOKEN_ADDRESSES[selectedAdapter]?.[selectedToken]) {
      setCustomAToken(ATOKEN_ADDRESSES[selectedAdapter][selectedToken]);
    } else {
      setCustomAToken('');
    }
    
    // Pre-fill MetaMorpho vault if available
    if (METAMORPHO_VAULTS[selectedToken]) {
      const firstVault = Object.values(METAMORPHO_VAULTS[selectedToken])[0];
      setMetamorphoVault(firstVault.address);
      setMetamorphoVaultName(firstVault.name);
    } else {
      setMetamorphoVault('');
      setMetamorphoVaultName('');
    }
  }, [selectedAdapter, selectedToken]);
  
  // Check if token is supported by the selected adapter
  const checkTokenSupport = async () => {
    setIsChecking(true);
    setIsSupported(null);
    
    try {
      const provider = getProvider();
      if (!provider) throw new Error('Provider not available');
      
      const signer = provider.getSigner();
      const adapterAddress = ADAPTER_ADDRESSES[selectedAdapter];
      
      if (!adapterAddress) {
        throw new Error(`No address found for adapter: ${selectedAdapter}`);
      }
      
      const token = tokens.find(t => t.symbol === selectedToken);
      if (!token) {
        throw new Error(`Token ${selectedToken} not found`);
      }
      
      // Handle different adapter types
      switch(adapterType.configMethod) {
        case 'addSupportedToken': {
          const adapterContract = new ethers.Contract(adapterAddress, ADD_SUPPORTED_TOKEN_ABI, signer);
          
          // Check if token is supported
          const supported = await adapterContract.supportedTokens(token.address);
          setIsSupported(supported);
          
          // If supported, get the aToken address
          if (supported) {
            const aTokenAddress = await adapterContract.aTokens(token.address);
            setCustomAToken(aTokenAddress);
            setStatusMessage(`Token ${selectedToken} is already supported by ${selectedAdapter}`, false);
          } else {
            setStatusMessage(`Token ${selectedToken} is not supported by ${selectedAdapter}. You can add support below.`, true);
            
            // Try to get predefined aToken address
            if (ATOKEN_ADDRESSES[selectedAdapter]?.[selectedToken]) {
              setCustomAToken(ATOKEN_ADDRESSES[selectedAdapter][selectedToken]);
            } else {
              setCustomAToken('');
            }
          }
          break;
        }
        
        case 'preconfigured': {
          // For preconfigured adapters, we'll simply check if they know this token
          const adapterContract = new ethers.Contract(adapterAddress, COMMON_ADAPTER_ABI, signer);
          
          try {
            // Try checking if the token is supported
            const supported = await adapterContract.supportedTokens(token.address);
            setIsSupported(supported);
            
            if (supported) {
              setStatusMessage(`Token ${selectedToken} is already supported by ${selectedAdapter}`, false);
            } else {
              setStatusMessage(`Token ${selectedToken} is not explicitly supported by ${selectedAdapter}. This adapter has preconfigured tokens.`, true);
            }
          } catch (error) {
            // If that doesn't work, assume it's supported via a different mechanism
            setIsSupported(true);
            setStatusMessage(`${selectedAdapter} has preconfigured markets and doesn't require explicit token configuration.`, false);
          }
          break;
        }
        
        case 'singleToken': {
          // For single token adapters like SkyLending, check if the token matches the expected one
          if (selectedToken === 'USDS') {
            setIsSupported(true);
            setStatusMessage(`${selectedAdapter} only supports USDS and is already configured.`, false);
          } else {
            setIsSupported(false);
            setStatusMessage(`${selectedAdapter} only supports USDS. Current token ${selectedToken} is not supported.`, true);
          }
          break;
        }
        
        case 'addVault': {
          // For MetaMorpho adapter, check if there are vaults for this token
          const adapterContract = new ethers.Contract(adapterAddress, METAMORPHO_ADAPTER_ABI, signer);
          
          try {
            // Check if there is a selected vault for this token
            const selectedVaultId = await adapterContract.selectedVault(token.address);
            
            if (selectedVaultId.toNumber() > 0) {
              // Get vault info
              const vaultInfo = await adapterContract.vaults(token.address, selectedVaultId);
              setIsSupported(true);
              setStatusMessage(`Token ${selectedToken} has configured vaults in ${selectedAdapter}. Currently selected vault: ${vaultInfo.name}`, false);
            } else {
              setIsSupported(false);
              setStatusMessage(`Token ${selectedToken} does not have any configured vaults in ${selectedAdapter}. You can add a vault below.`, true);
              
              // Suggest a vault if available
              if (METAMORPHO_VAULTS[selectedToken]) {
                const firstVault = Object.values(METAMORPHO_VAULTS[selectedToken])[0];
                setMetamorphoVault(firstVault.address);
                setMetamorphoVaultName(firstVault.name);
              }
            }
          } catch (error) {
            setIsSupported(false);
            setStatusMessage(`Token ${selectedToken} does not appear to have any configured vaults in ${selectedAdapter}.`, true);
          }
          break;
        }
        
        default: {
          setIsSupported(false);
          setStatusMessage(`${selectedAdapter} has an unknown configuration method.`, true);
        }
      }
    } catch (error) {
      console.error('Error checking token support:', error);
      setStatusMessage(`Error checking token support: ${error instanceof Error ? error.message : String(error)}`, true);
      setIsSupported(false);
    } finally {
      setIsChecking(false);
    }
  };
  
  // Configure the adapter with token support
  const configureAdapter = async () => {
    if (
      (adapterType.configMethod === 'addSupportedToken' && (!customAToken || !ethers.utils.isAddress(customAToken))) ||
      (adapterType.configMethod === 'addVault' && (!metamorphoVault || !ethers.utils.isAddress(metamorphoVault)))
    ) {
      setStatusMessage('Please enter a valid address', true);
      return;
    }
    
    setIsAddingSupport(true);
    
    try {
      const provider = getProvider();
      if (!provider) throw new Error('Provider not available');
      
      const signer = provider.getSigner();
      const adapterAddress = ADAPTER_ADDRESSES[selectedAdapter];
      
      if (!adapterAddress) {
        throw new Error(`No address found for adapter: ${selectedAdapter}`);
      }
      
      const token = tokens.find(t => t.symbol === selectedToken);
      if (!token) {
        throw new Error(`Token ${selectedToken} not found`);
      }
      
      switch(adapterType.configMethod) {
        case 'addSupportedToken': {
          const adapterContract = new ethers.Contract(adapterAddress, ADD_SUPPORTED_TOKEN_ABI, signer);
          
          // Call addSupportedToken
          const tx = await adapterContract.addSupportedToken(token.address, customAToken);
          await tx.wait();
          
          setStatusMessage(`Successfully added ${selectedToken} support to ${selectedAdapter}`, false);
          setIsSupported(true);
          break;
        }
        
        case 'addVault': {
          const adapterContract = new ethers.Contract(adapterAddress, METAMORPHO_ADAPTER_ABI, signer);
          
          // Call addVault
          const tx = await adapterContract.addVault(
            token.address, 
            metamorphoVault, 
            metamorphoVaultName || `${selectedToken} Vault`
          );
          await tx.wait();
          
          setStatusMessage(`Successfully added ${metamorphoVaultName || 'vault'} for ${selectedToken} to ${selectedAdapter}`, false);
          setIsSupported(true);
          break;
        }
        
        case 'preconfigured':
        case 'singleToken': 
        default: {
          setStatusMessage(`${selectedAdapter} doesn't need explicit configuration for tokens.`, false);
          setIsSupported(true);
          break;
        }
      }
      
      // Refresh data
      await refreshData();
    } catch (error) {
      console.error('Error configuring adapter:', error);
      setStatusMessage(`Error configuring adapter: ${error instanceof Error ? error.message : String(error)}`, true);
    } finally {
      setIsAddingSupport(false);
    }
  };
  
  // Get available vault options for MetaMorpho
  const getMetaMorphoVaultOptions = () => {
    if (!METAMORPHO_VAULTS[selectedToken]) {
      return (
        <div className="text-sm text-gray-600 italic">
          No predefined vaults for {selectedToken} found
        </div>
      );
    }
    
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
        {Object.entries(METAMORPHO_VAULTS[selectedToken]).map(([name, data]) => (
          <button
            key={name}
            type="button"
            className={`p-2 text-sm rounded-md border transition ${
              metamorphoVault === data.address
                ? 'border-blue-500 bg-blue-50 text-blue-700'
                : 'border-gray-300 hover:border-gray-400 text-gray-700'
            }`}
            onClick={() => {
              setMetamorphoVault(data.address);
              setMetamorphoVaultName(data.name);
            }}
          >
            {data.name}
          </button>
        ))}
      </div>
    );
  };
  
  // Render configuration form based on adapter type
  const renderConfigurationForm = () => {
    if (isSupported === true) {
      return (
        <div className="bg-green-50 p-4 rounded-md border border-green-200">
          <p className="text-green-800">
            Token {selectedToken} is supported by the {selectedAdapter} adapter. No further configuration needed.
          </p>
        </div>
      );
    }
    
    if (isSupported === false) {
      switch(adapterType.configMethod) {
        case 'addSupportedToken':
          return (
            <div className="border border-gray-200 rounded-md p-4">
              <h4 className="font-medium text-gray-800 mb-2">Add Token Support</h4>
              
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  aToken Address
                </label>
                <input
                  type="text"
                  value={customAToken}
                  onChange={(e) => setCustomAToken(e.target.value)}
                  className="w-full p-2 border border-gray-300 rounded-md"
                  placeholder="0x..."
                  disabled={isAddingSupport}
                />
                <p className="mt-1 text-xs text-gray-500">
                  This is the address of the corresponding aToken in the lending protocol.
                </p>
              </div>
              
              <button
                type="button"
                onClick={configureAdapter}
                className={`w-full py-2 rounded-md transition ${
                  isAddingSupport || !customAToken
                    ? 'bg-gray-400 cursor-not-allowed' 
                    : 'bg-green-600 hover:bg-green-700 text-white'
                }`}
                disabled={isAddingSupport || !customAToken}
              >
                {isAddingSupport ? 'Adding Support...' : 'Add Token Support'}
              </button>
            </div>
          );
        
        case 'addVault':
          return (
            <div className="border border-gray-200 rounded-md p-4">
              <h4 className="font-medium text-gray-800 mb-2">Add Vault for {selectedToken}</h4>
              
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Available Vaults
                </label>
                {getMetaMorphoVaultOptions()}
              </div>
              
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Vault Address
                </label>
                <input
                  type="text"
                  value={metamorphoVault}
                  onChange={(e) => setMetamorphoVault(e.target.value)}
                  className="w-full p-2 border border-gray-300 rounded-md"
                  placeholder="0x..."
                  disabled={isAddingSupport}
                />
              </div>
              
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Vault Name
                </label>
                <input
                  type="text"
                  value={metamorphoVaultName}
                  onChange={(e) => setMetamorphoVaultName(e.target.value)}
                  className="w-full p-2 border border-gray-300 rounded-md"
                  placeholder="e.g., STEAKUSDC"
                  disabled={isAddingSupport}
                />
              </div>
              
              <button
                type="button"
                onClick={configureAdapter}
                className={`w-full py-2 rounded-md transition ${
                  isAddingSupport || !metamorphoVault
                    ? 'bg-gray-400 cursor-not-allowed' 
                    : 'bg-green-600 hover:bg-green-700 text-white'
                }`}
                disabled={isAddingSupport || !metamorphoVault}
              >
                {isAddingSupport ? 'Adding Vault...' : 'Add Vault'}
              </button>
            </div>
          );
        
        case 'preconfigured':
          return (
            <div className="bg-blue-50 p-4 rounded-md border border-blue-200">
              <p className="text-blue-800">
                The {selectedAdapter} adapter has preconfigured markets and doesn't require explicit token configuration.
                You can try to use it directly with {selectedToken}.
              </p>
            </div>
          );
        
        case 'singleToken':
          return (
            <div className="bg-yellow-50 p-4 rounded-md border border-yellow-200">
              <p className="text-yellow-800">
                The {selectedAdapter} adapter only supports USDS tokens. {selectedToken} cannot be used with this adapter.
              </p>
            </div>
          );
        
        default:
          return (
            <div className="bg-gray-50 p-4 rounded-md border border-gray-200">
              <p className="text-gray-800">
                The {selectedAdapter} adapter has an unknown configuration method. Please refer to the contract documentation.
              </p>
            </div>
          );
      }
    }
    
    return null;
  };
  
  return (
    <div className="bg-white p-6 rounded-lg shadow-sm mb-6">
      <h3 className="text-lg font-semibold mb-4 text-gray-800">Adapter Configuration</h3>
      <p className="text-gray-600 mb-4">
        Before setting an adapter for a token, you need to make sure the adapter supports that token.
        Different adapters require different configuration methods.
      </p>
      
      {adapterDescription && (
        <div className="mb-4 p-3 bg-blue-50 border border-blue-100 rounded-md text-sm text-blue-700">
          {adapterDescription}
        </div>
      )}
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Select Token
          </label>
          <select
            value={selectedToken}
            onChange={(e) => setSelectedToken(e.target.value)}
            className="w-full p-2 border border-gray-300 rounded-md"
            disabled={isChecking || isAddingSupport}
          >
            {tokens.map((token) => (
              <option key={token.symbol} value={token.symbol}>{token.symbol}</option>
            ))}
          </select>
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Select Adapter
          </label>
          <select
            value={selectedAdapter}
            onChange={(e) => setSelectedAdapter(e.target.value)}
            className="w-full p-2 border border-gray-300 rounded-md"
            disabled={isChecking || isAddingSupport}
          >
            {Object.keys(ADAPTER_ADDRESSES).map((name) => (
              <option key={name} value={name}>{name}</option>
            ))}
          </select>
        </div>
      </div>
      
      <div className="flex justify-center mb-6">
        <button
          type="button"
          onClick={checkTokenSupport}
          className={`px-4 py-2 rounded-md transition ${
            isChecking 
              ? 'bg-gray-400 cursor-not-allowed' 
              : 'bg-blue-600 hover:bg-blue-700 text-white'
          }`}
          disabled={isChecking || isAddingSupport}
        >
          {isChecking ? 'Checking...' : 'Check Token Support'}
        </button>
      </div>
      
      {renderConfigurationForm()}
      
      <div className="mt-6 text-sm text-gray-600 bg-gray-50 p-4 rounded-md">
        <p className="font-medium mb-2">Adapter Configuration Workflow:</p>
        <ol className="list-decimal list-inside space-y-1 pl-2">
          <li>Select the token and adapter you want to use</li>
          <li>Click "Check Token Support" to see if the token is already supported</li>
          <li>If not supported, follow the specific instructions for that adapter type:
            <ul className="list-disc list-inside ml-6 mt-1">
              <li><strong>Aave/SparkLend/Euler/Fluid:</strong> Add token with its aToken address</li>
              <li><strong>MetaMorpho:</strong> Add a vault for the token</li>
              <li><strong>Compound/SkyLending:</strong> No extra configuration needed</li>
            </ul>
          </li>
          <li>After configuring the adapter, you can set it for the token in the "Change Token Adapter" section below</li>
        </ol>
      </div>
    </div>
  );
};

export default AdapterConfiguration;