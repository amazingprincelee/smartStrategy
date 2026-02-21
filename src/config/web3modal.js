import { createWeb3Modal } from '@web3modal/wagmi';
import { wagmiConfig, chains, projectId, sepolia } from './wagmi';

// Initialize Web3Modal immediately when this module is imported
createWeb3Modal({
  wagmiConfig,
  projectId,
  chains,
  defaultChain: sepolia,
  metadata: {
    name: 'SmartStrategy',
    description: 'An automated cryptocurrency trading bot platform',
    url: typeof window !== 'undefined' ? window.location.origin : 'https://smartstrategy.app',
    icons: ['https://smartstrategy.app/icon.png'],
  },
  themeMode: 'light',
  themeVariables: {
    '--w3m-color-mix': '#00D4AA',
    '--w3m-color-mix-strength': 15,
  },
});