export interface VaultData {
    name: string;
    apy: string;
    tvl: string;
    chain: string;
    riskScore: number;
  }
  
  export interface PoolData {
    Pool: string;
    Project: string;
    Chain: string;
    TVL: number;
    APY: number;
    Risk_Score: number;
    Risk_Category: string;
  }
  
  export type RiskLevel = 'low-risk' | 'medium-risk' | 'high-risk';