'use client'

import { createAppKit } from '@reown/appkit'
import { WagmiAdapter } from '@reown/appkit-adapter-wagmi'
import { mainnet } from '@reown/appkit/networks'
import type { AppKitNetwork } from '@reown/appkit-common'
import { type ReactNode, useEffect } from 'react'
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
const projectId = process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID
if (!projectId) {
  throw new Error('Missing NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID in environment variables')
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
    // Cleanup any existing instance first
    if (appKitInstance) {
      appKitInstance.disconnect().catch(console.error)
      appKitInstance = undefined
    }

    const initializeAppKit = async () => {
      try {
        // Create adapter instance
        const adapter = new WagmiAdapter({
          ssr: false,
          projectId: projectId as string,
          networks
        })

        // Create AppKit instance with error handling
        appKitInstance = await createAppKit({
          adapters: [adapter],
          networks,
          projectId: projectId as string,
          features: {
            analytics: false
          },
          themeMode: 'light',
          themeVariables: {
            '--w3m-accent': '#600473',
            '--w3m-color-mix': '#600473',
            '--w3m-z-index': 1000
          }
        })

        // Add event listener for page unload
        const handleUnload = () => {
          if (appKitInstance) {
            appKitInstance.disconnect().catch(console.error)
            appKitInstance = undefined
          }
        }
        window.addEventListener('beforeunload', handleUnload)

        return () => {
          window.removeEventListener('beforeunload', handleUnload)
        }
      } catch (error) {
        console.error('Failed to initialize AppKit:', error)
        appKitInstance = undefined
      }
    }

    const cleanup = initializeAppKit()

    // Cleanup function
    return () => {
      cleanup?.then(cleanupFn => cleanupFn?.())
      if (appKitInstance) {
        appKitInstance.disconnect().catch(console.error)
        appKitInstance = undefined
      }
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