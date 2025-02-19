'use client'

import { createAppKit } from '@reown/appkit'
import { WagmiAdapter } from '@reown/appkit-adapter-wagmi'
import { mainnet } from '@reown/appkit/networks'
import type { AppKitNetwork } from '@reown/appkit-common'
import { type ReactNode, useEffect, useRef } from 'react'
import Script from 'next/script'

// Define the local development network configuration for Anvil
const networks: [AppKitNetwork, ...AppKitNetwork[]] = [
  {
    id: 1337,
    name: 'Anvil Local',
    nativeCurrency: {
      name: 'Ethereum',
      symbol: 'ETH',
      decimals: 18,
    },
    rpcUrls: {
      default: { http: ['http://localhost:8545'] },
      public: { http: ['http://localhost:8545'] },
    },
  },
  mainnet // Include Ethereum mainnet as an available network
]

// Validate required environment variables
const projectId = process.env.NEXT_PUBLIC_REOWN_PROJECT_ID
if (!projectId) {
  throw new Error('Missing NEXT_PUBLIC_REOWN_PROJECT_ID in environment variables')
}

// Define core application configuration for AppKit
const config = {
  // Application metadata for wallet connections
  metadata: {
    name: 'X—Vault Demo',
    description: 'A simple web application for interacting with ERC-4626 vault contracts.',
    url: 'https://x-vault-demo.com',
    icons: ['https://x-vault-demo.com/icon.png'] as string[]
  },
  // Configure Wagmi adapter for Web3 interactions
  adapter: new WagmiAdapter({
    ssr: true,
    projectId: projectId as string,
    networks
  }),
  // UI theme configuration
  theme: {
    mode: 'light' as const,
    variables: {
      '--w3m-accent': '#600473',
      '--w3m-color-mix': '#600473'
    }
  }
}

// Store AppKit instance
let appKitInstance: ReturnType<typeof createAppKit> | undefined

/**
 * Hook to access the AppKit instance
 */
export function useAppKit() {
  return appKitInstance
}

/**
 * AppKitProvider component
 * Initializes and provides the AppKit context to the application
 * Manages the AppKit instance and loads required scripts
 */
export function AppKitProvider({ children }: { children: ReactNode }) {
  useEffect(() => {
    if (!appKitInstance) {
      appKitInstance = createAppKit({
        adapters: [config.adapter],
        networks,
        metadata: config.metadata,
        projectId: projectId as string,
        features: {
          analytics: false,
        },
        themeMode: config.theme.mode,
        themeVariables: config.theme.variables
      })
    }
  }, [])

  return (
    <>
      {/* Load AppKit UI script after initial render */}
      <Script
        src="https://unpkg.com/@reown/appkit@1.6.8/dist/appkit.js"
        strategy="afterInteractive"
      />
      {children}
    </>
  )
} 