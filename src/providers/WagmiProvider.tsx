'use client'

import { WagmiConfig, createConfig, configureChains } from 'wagmi'
import { Chain } from 'wagmi/chains'
import { MetaMaskConnector } from 'wagmi/connectors/metaMask'
import { WalletConnectConnector } from 'wagmi/connectors/walletConnect'
import { publicProvider } from 'wagmi/providers/public'

// Define local Anvil chain
const anvil: Chain = {
  id: 1337,
  name: 'Anvil Local',
  nativeCurrency: {
    decimals: 18,
    name: 'Ethereum',
    symbol: 'ETH',
  },
  rpcUrls: {
    default: { http: ['http://localhost:8545'] },
    public: { http: ['http://localhost:8545'] },
  },
  blockExplorers: {
    default: { name: 'Local Explorer', url: 'http://localhost:8545' },
  },
  testnet: true,
}

const { chains, publicClient, webSocketPublicClient } = configureChains(
  [anvil],
  [publicProvider()]
)

const config = createConfig({
  autoConnect: true,
  publicClient,
  webSocketPublicClient,
  connectors: [
    new MetaMaskConnector({ chains }),
    new WalletConnectConnector({
      chains,
      options: {
        projectId: 'YOUR_PROJECT_ID', // You'll need to get this from WalletConnect
        showQrModal: true,
      },
    }),
  ],
})

export function WagmiProvider({ children }: { children: React.ReactNode }) {
  return <WagmiConfig config={config}>{children}</WagmiConfig>
} 