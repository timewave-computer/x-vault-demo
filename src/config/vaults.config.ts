export interface BaseVaultData {
  id: string;
  name: string;
  description: string;
  apr: string; // TODO: should be removed from base, derived from contract
  token: string;
  tokenAddress: `0x${string}`; // Contract address of the token
  vaultAddress: `0x${string}`; // Added for reference, not used by app
  vaultProxyAddress: `0x${string}`; // All of interaction is done here
  withdrawalLockup: number; // Number of hours to lock up withdrawals
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
      withdrawalLockup: 24 * 3, // 3 days
    },
  ],
  31337: [
    {
      id: "usdc",
      name: "USDC Stable Vault",
      description: "Stable yield generation for USDC deposits.",
      token: "USDC",
      vaultAddress: "0x0DCd1Bf9A1b36cE34237eEaFef220932846BCD82",
      vaultProxyAddress: "0x9A676e781A523b5d0C0e43731313A708CB607508",
      tokenAddress: "0xCf7Ed3AccA5a467e9e704C703E8D87F634fB0Fc9",
      apr: "3.8%",
      withdrawalLockup: 24 * 3, // 3 days
    },
  ],
};
