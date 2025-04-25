/***
 * Config Wagmi & AppKit support
 */

import { mainnet } from "@reown/appkit/networks";
import type { AppKitNetwork } from "@reown/appkit-common";

// default to simulation env if no account connected
export const defaultChainId = 31337;

// Get Anvil RPC URL from environment variables
const anvilRpcUrl = process.env.NEXT_PUBLIC_RPC_URL;

// Define network configurations for Appkit
export const networks: [AppKitNetwork, ...AppKitNetwork[]] = [
  mainnet,
  ...(anvilRpcUrl
    ? [
        {
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
        },
      ]
    : []),
];
