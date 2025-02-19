'use client'

import { type ReactNode } from 'react'
import { WagmiProvider, createConfig, http } from 'wagmi'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { AppKitProvider } from '@/components/AppKitProvider'

// Configure Wagmi client for Ethereum interactions
const wagmiConfig = createConfig({
  // Define available blockchain networks
  chains: [
    {
      id: 1337,
      name: 'Anvil Local',
      nativeCurrency: { name: 'Ethereum', symbol: 'ETH', decimals: 18 },
      rpcUrls: {
        default: { http: ['http://localhost:8545'] },
      },
    }
  ],
  // Configure network transport methods
  transports: {
    1337: http('http://localhost:8545'),
  },
})

// Configure React Query client with optimized settings
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false, // Prevent unnecessary refetches
      retry: 1                     // Limit retry attempts
    }
  }
})

/**
 * Root provider component that wraps the application
 * Sets up:
 * - Wagmi for Ethereum interactions
 * - React Query for data fetching
 * - AppKit for wallet connection and UI
 */
export function Providers({ children }: { children: ReactNode }) {
  return (
    <WagmiProvider config={wagmiConfig}>
      <QueryClientProvider client={queryClient}>
        <AppKitProvider>{children}</AppKitProvider>
      </QueryClientProvider>
    </WagmiProvider>
  )
} 