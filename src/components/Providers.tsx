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
      id: 31337,
      name: 'Anvil Local',
      nativeCurrency: { name: 'Ethereum', symbol: 'ETH', decimals: 18 },
      rpcUrls: {
        default: { http: ['http://localhost:8545'] },
      },
    }
  ],
  // Configure network transport methods
  transports: {
    31337: http('http://localhost:8545'),
  },
})

/**
 * Root provider component that wraps the application
 * Sets up:
 * - Wagmi for Ethereum interactions
 * - React Query for data fetching
 * - AppKit for wallet connection and UI
 */
export function Providers({ children }: { children: ReactNode }) {
  // Create a new QueryClient instance for each request
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        refetchOnWindowFocus: false,
        retry: 1,
        // Disable automatic background refetching
        staleTime: Infinity,
        // Prevent hydration mismatch by disabling initial data
        enabled: false
      }
    }
  })

  return (
    <WagmiProvider config={wagmiConfig}>
      <QueryClientProvider client={queryClient}>
        <AppKitProvider>{children}</AppKitProvider>
      </QueryClientProvider>
    </WagmiProvider>
  )
} 