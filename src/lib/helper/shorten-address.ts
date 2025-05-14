/**
 * Utility function to format an Ethereum address for display
 * Returns address in format: 0x1234...5678
 */
export function shortenAddress(address: string) {
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}
