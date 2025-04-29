"use client";

import { type ReactNode } from "react";
import {
  CreateConfigParameters,
  WagmiProvider,
  createConfig,
  http,
} from "wagmi";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { AppKitProvider } from "@/context";
import { networks } from "@/config";
import { createClient } from "viem";

type WagmiChainParameters = CreateConfigParameters["chains"];

const wagmiChainConfig: WagmiChainParameters = networks.map((network) => ({
  id: network.id,
  name: network.name,
  nativeCurrency: network.nativeCurrency,
  rpcUrls: {
    default: { http: network.rpcUrls.default.http },
  },
  // Type requires at least 1 chain object. networks is guaranteed to always have at least mainnet, so type cast is safe
})) as unknown as WagmiChainParameters;

// Configure Wagmi client for Ethereum interactions
const wagmiConfig = createConfig({
  // Define available blockchain networks
  chains: wagmiChainConfig,
  // Configure network transport methods
  // transports:wagmiTransportConfig,
  client({ chain }) {
    return createClient({
      chain,
      transport: http(chain.rpcUrls.default.http[0]),
    });
  },
});

/**
 * Root provider component that wraps the application
 * Sets up:
 * - Wagmi for Ethereum interactions
 * - React Query for data fetching
 * - AppKit for wallet connection and UI
 */
export function ChainProviders({ children }: { children: ReactNode }) {
  // Create a new QueryClient instance for each request
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        refetchOnWindowFocus: false,
        retry: 1,
        // Disable automatic background refetching
        staleTime: Infinity,
        // Prevent hydration mismatch by disabling initial data
        enabled: false,
      },
    },
  });

  return (
    <WagmiProvider config={wagmiConfig}>
      <QueryClientProvider client={queryClient}>
        <AppKitProvider>{children}</AppKitProvider>
      </QueryClientProvider>
    </WagmiProvider>
  );
}
