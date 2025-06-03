import { defineChain } from 'viem';

// Monad Testnet configuration
export const monadTestnet = defineChain({
  id: 10143,
  name: 'Monad Testnet',
  nativeCurrency: {
    decimals: 18,
    name: 'Monad',
    symbol: 'MON',
  },
  rpcUrls: {
    default: {
      http: ['https://testnet-rpc.monad.xyz'],
    },
    public: {
      http: ['https://testnet-rpc.monad.xyz'],
    },
  },
  blockExplorers: {
    default: {
      name: 'Monad Explorer',
      url: 'https://testnet.monadexplorer.com',
    },
  },
  testnet: true,
});

// App constants
export const FEEDBACK_COST_MON = '1.1'; // 1.1 MON required to submit feedback
export const FEEDBACK_COST_WEI = BigInt('1100000000000000000'); // 1.1 MON in wei

// Project options for the feedback form
export const PROJECT_OPTIONS = [
  'Monad DEX',
  'Monad NFT Marketplace',
  'Monad Lending Protocol',
  'Monad Gaming Platform',
  'Monad Social Network',
  'Other'
];

// Rating options
export const RATING_OPTIONS = [
  { value: 1, label: 'Unusable' },
  { value: 2, label: 'Poor' },
  { value: 3, label: 'Average' },
  { value: 4, label: 'Good' },
  { value: 5, label: 'Excellent' },
]; 