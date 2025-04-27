type AdapterType = 'AAVE_V2' | 'AAVE_V3' | 'METAMORPHO' | 'COMPOUND_V2' | 'COMPOUND_V3' | 'EULER_V2' | 'FLUID' | 'SKYLENDING' | 'SPARKLENDING';

export const TOKEN_ADAPTER_COMPATIBILITY: Record<string, AdapterType[]> = {
  'CBETH': ['AAVE_V3'],
  'DAI': ['AAVE_V3', 'COMPOUND_V2', 'METAMORPHO', 'SPARKLENDING'],
  'WETH': ['AAVE_V3', 'COMPOUND_V2', 'COMPOUND_V3', 'METAMORPHO', 'SPARKLENDING'],
  'PYUSD': ['AAVE_V3', 'METAMORPHO'],
  'RETH': ['AAVE_V3', 'SPARKLENDING'],
  'RSETH': ['EULER_V2'],
  'RUSD': ['METAMORPHO'],
  'USD0': ['EULER_V2'],
  'USDC': ['FLUID', 'AAVE_V2', 'AAVE_V3', 'COMPOUND_V2', 'COMPOUND_V3', 'EULER_V2', 'METAMORPHO'],
  'USDE': ['AAVE_V3', 'EULER_V2'],
  'USDL': ['METAMORPHO'],
  'USDS': ['AAVE_V3', 'SKYLENDING', 'SPARKLENDING'],
  'USDT': ['FLUID', 'AAVE_V2', 'AAVE_V3', 'COMPOUND_V2', 'COMPOUND_V3', 'METAMORPHO'],
  'WBTC': ['AAVE_V2', 'AAVE_V3', 'COMPOUND_V2', 'EULER_V2', 'SPARKLENDING'],
  'WEETH': ['AAVE_V3', 'EULER_V2'],
  'STETH': ['AAVE_V3'],
  'WSTETH': ['FLUID', 'AAVE_V3']
};

// Protocol display names
export const PROTOCOL_DISPLAY_NAMES: Record<AdapterType, string> = {
  'AAVE_V2': 'Aave V2',
  'AAVE_V3': 'Aave V3',
  'METAMORPHO': 'Morpho Blue',
  'COMPOUND_V2': 'Compound V2',
  'COMPOUND_V3': 'Compound V3',
  'EULER_V2': 'Euler V2',
  'FLUID': 'Fluid Lending',
  'SKYLENDING': 'Sky Lending',
  'SPARKLENDING': 'Spark Lending'
};