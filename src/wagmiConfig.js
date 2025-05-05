import { createConfig, http } from '@wagmi/core';
import { mainnet, sepolia } from '@wagmi/core/chains'; // Adicione as redes que você usa
import { defineChain } from 'viem';

// Configure a rede que você está usando (no caso, parece ser a Monad testnet ou outra)
const monadTestnet = defineChain({
  id: 10143, // Substitua pelo chain ID correto da Monad testnet
  name: 'Monad Testnet',
  network: 'monad-testnet',
  nativeCurrency: {
    decimals: 18,
    name: 'Monad',
    symbol: 'MONAD',
  },
  rpcUrls: {
    default: {
      http: ['https://testnet-rpc.monad.xyz'], // Substitua pelo RPC correto
    },
  },
  blockExplorers: {
    default: { name: 'MonadScan', url: 'https://monad-testnet.socialscan.io/' }, // Opcional
  },
});

export const wagmiConfig = createConfig({
  chains: [monadTestnet], // Adicione as redes que você suporta
  transports: {
    [monadTestnet.id]: http(),
  },
});