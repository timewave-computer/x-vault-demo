/***
 * Config Wagmi & AppKit support
 */

import type { AppKitNetwork } from "@reown/appkit-common";

// default to simulation env if no account connected
export const defaultChainId = 31337;

// Get Anvil RPC URL from environment variables
const anvilRpcUrl = process.env.NEXT_PUBLIC_ANVIL_RPC_URL as string;
if (!anvilRpcUrl) {
  throw new Error("NEXT_PUBLIC_ANVIL_RPC_URL is not set");
}

export const anvilNetwork: AppKitNetwork = {
  // If testnet RPC URL is provided, add Anvil network
  id: 31337,
  testnet: true,
  name: "Anvil",
  nativeCurrency: {
    name: "Ethereum",
    symbol: "ETH",
    decimals: 18,
  },
  rpcUrls: {
    default: { http: [anvilRpcUrl] },
  },
};

// Define network configurations for Appkit
export const networks: [AppKitNetwork, ...AppKitNetwork[]] = [anvilNetwork];
