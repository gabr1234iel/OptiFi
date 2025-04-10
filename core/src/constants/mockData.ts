import { VaultData, PoolData } from '../types';

export const vaultData: Record<string, VaultData> = {
  'low-risk': {
    name: "USDC on Compound V3",
    apy: "3.74%",
    tvl: "$143.2M",
    chain: "Ethereum",
    riskScore: 32.1
  },
  'medium-risk': {
    name: "STEAKRUSD on Morpho Blue",
    apy: "5.81%",
    tvl: "$24.5M",
    chain: "Ethereum",
    riskScore: 52.9
  },
  'high-risk': {
    name: "SFRXETH on Fraxlend",
    apy: "11.66%",
    tvl: "$5.8M",
    chain: "Ethereum",
    riskScore: 80.4
  }
};

export const poolsData: Record<string, PoolData[]> = {
  'low-risk': [
    { Pool: "USDC", Project: "Compound V3", Chain: "Ethereum", TVL: 143200000, APY: 3.73919, Risk_Score: 32.102564, Risk_Category: "Low Risk" },
    { Pool: "METH", Project: "mETH Protocol", Chain: "Ethereum", TVL: 98600000, APY: 3.69841, Risk_Score: 29.641026, Risk_Category: "Low Risk" },
    { Pool: "APXETH", Project: "Dinero (pxETH)", Chain: "Ethereum", TVL: 87500000, APY: 3.53000, Risk_Score: 33.282051, Risk_Category: "Low Risk" },
    { Pool: "STETH", Project: "Lido", Chain: "Ethereum", TVL: 165800000, APY: 3.29300, Risk_Score: 32.666667, Risk_Category: "Low Risk" },
    { Pool: "WBETH", Project: "Binance staked ETH", Chain: "Ethereum", TVL: 112700000, APY: 3.23025, Risk_Score: 27.589744, Risk_Category: "Low Risk" }
  ],
  'medium-risk': [
    { Pool: "STEAKRUSD", Project: "Morpho Blue", Chain: "Ethereum", TVL: 24500000, APY: 5.80754, Risk_Score: 52.871795, Risk_Category: "Medium Risk" },
    { Pool: "REUSDC", Project: "Morpho Blue", Chain: "Ethereum", TVL: 22100000, APY: 5.77967, Risk_Score: 55.897436, Risk_Category: "Medium Risk" },
    { Pool: "BBQUSDC", Project: "Morpho Blue", Chain: "Ethereum", TVL: 18900000, APY: 5.70204, Risk_Score: 53.846154, Risk_Category: "Medium Risk" },
    { Pool: "SFRXUSD", Project: "Frax", Chain: "Ethereum", TVL: 15600000, APY: 5.61188, Risk_Score: 63.794872, Risk_Category: "Medium Risk" },
    { Pool: "USUALUSDC+", Project: "Morpho Blue", Chain: "Ethereum", TVL: 16900000, APY: 5.43704, Risk_Score: 54.153846, Risk_Category: "Medium Risk" }
  ],
  'high-risk': [
    { Pool: "SFRXETH", Project: "Fraxlend", Chain: "Ethereum", TVL: 5800000, APY: 11.66143, Risk_Score: 80.410256, Risk_Category: "High Risk" },
    { Pool: "SMWETH", Project: "Morpho Blue", Chain: "Base", TVL: 4200000, APY: 9.04515, Risk_Score: 90.666667, Risk_Category: "High Risk" },
    { Pool: "USDS", Project: "SparkLend", Chain: "Ethereum", TVL: 7500000, APY: 7.27951, Risk_Score: 67.948718, Risk_Category: "High Risk" },
    { Pool: "SMUSDC", Project: "Morpho Blue", Chain: "Base", TVL: 8100000, APY: 6.73995, Risk_Score: 67.333333, Risk_Category: "High Risk" },
    { Pool: "USD₮0", Project: "Fluid Lending", Chain: "Arbitrum", TVL: 3900000, APY: 6.73000, Risk_Score: 79.589744, Risk_Category: "High Risk" }
  ]
};