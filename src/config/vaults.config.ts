export interface BaseVaultData {
  id: string;
  name: string;
  description: string;
  apr: string; // TODO: should be removed from base, derived from contract
  token: string;
  tokenAddress: `0x${string}`; // Contract address of the token
  vaultAddress: `0x${string}`; // Added for reference, not used by app
  vaultProxyAddress: `0x${string}`; // All of interaction is done here
}

export const BASE_VAULTS: Record<number, BaseVaultData[]> = {
  1: [
    {
      id: "usdc",
      name: "USDC Mock Vault",
      description: "Stable yield generation for USDC deposits.",
      token: "USDC",
      vaultAddress: "0xB7f8BC63BbcaD18155201308C8f3540b07f84F5e", // contract does not exist
      vaultProxyAddress: "0xB7f8BC63BbcaD18155201308C8f3540b07f84F5e", // contract does not exist
      tokenAddress: "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48",
      apr: "3.8%",
    },
  ],
  31337: [
    {
      id: "usdc",
      name: "USDC Stable Vault",
      description: "Stable yield generation for USDC deposits.",
      token: "USDC",
      vaultAddress: "0xB7f8BC63BbcaD18155201308C8f3540b07f84F5e",
      vaultProxyAddress: "0xA51c1fc2f0D1a1b8494Ed1FE312d7C3a78Ed91C0",
      tokenAddress: "0x8A791620dd6260079BF849Dc5567aDC3F2FdC318",
      apr: "3.8%",
    },
  ],
};
