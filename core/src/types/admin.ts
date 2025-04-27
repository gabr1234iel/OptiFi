// src/types/admin.ts
import { ReactNode } from 'react';

// Protocol Adapter Interface
export interface IProtocolAdapter {
  deposit: (token: string, amount: number) => Promise<number>;
  withdraw: (token: string) => Promise<number>;
  getBalance: (token: string) => Promise<number>;
  getAPY: (token: string) => Promise<number>;
}

// Token related types
export interface TokenInfo {
  symbol: string;
  address: string;
  decimals: number;
  coingeckoId: string;
  price?: number;
}

export interface TokenPriceMap {
  [symbol: string]: number;
}

// Protocol related types
export interface Protocol {
  id: number;
  name: string;
  displayName: string;
  color?: string;
}

export interface AdapterMap {
  [key: string]: string;
}

// Pool related types
export interface PoolDetails {
  poolName: string;
  poolAddress: string;
  underlyingToken: string;
  protocol: number;
  apy?: number;
  type?: 'lending' | 'liquidity' | 'staking';
}

// TVL related types
export interface TVLData {
  total: string;
  byToken: Record<string, string>;
}

// UI Component Props
export interface StatusMessageProps {
  message: string;
  isError: boolean;
  onDismiss?: () => void;
}

export interface TabNavigationProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
  tabs: Array<{ id: string; label: string }>;
}

// Protocol Distribution
export interface ProtocolDistribution {
  protocol: string;
  percentage: number;
  displayName: string;
}

// Admin Context
export interface AdminContextType {
  tokens: TokenInfo[];
  protocols: Protocol[];
  adapters: AdapterMap;
  pools: PoolDetails[];
  tvlData: TVLData;
  tokenPrices: TokenPriceMap;
  totalUsers: number;
  isLoading: boolean;
  statusMessage: string;
  isError: boolean;
  ADAPTER_ADDRESSES: Record<string, string>; // Added this property
  setStatusMessage: (message: string, isError: boolean) => void;
  refreshData: () => Promise<void>;
}