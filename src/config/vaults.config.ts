export interface VaultMetadata {
  id: string;
  name: string;
  description: string;
  token: string;
  tokenAddress: `0x${string}`; // Contract address of the token
  vaultAddress: `0x${string}`; // Added for reference, not used by app
  vaultProxyAddress: `0x${string}`; // All of interaction is done here
  withdrawalLockup: number; // Number of hours to lock up withdrawals
  transactionConfirmationTimeout: number; // Number of milliseconds to wait for a transaction to be mined
  startBlock: bigint; // Block number during which the vault was deployed
}

// tenant id is used to display different set of vaults
const defaultTenantId = "DEFAULT_TENANT";
const tenantId = process.env.NEXT_PUBLIC_TENANT_ID ?? defaultTenantId;

// all vaults metadata for a given chain
export const getVaultsMetadata = (chainId: number) => {
  return BASE_VAULT_METADATA[tenantId][chainId];
};

// vault metadata for a given chain and vault id
export const getVaultMetadata = (chainId: number, vaultId: string) => {
  return BASE_VAULT_METADATA[tenantId][chainId].find(
    (vault) => vault.id === vaultId,
  );
};

// Config stored by tenant ID, to display different set of vaults
const BASE_VAULT_METADATA: Record<string, Record<number, VaultMetadata[]>> = {
  [defaultTenantId]: {
    // timewave test environment
    31337: [
      {
        id: "usdc",
        name: "USDC Stable Vault",
        description: "Stable yield generation for USDC deposits.",
        token: "USDC",
        vaultAddress: "0x0DCd1Bf9A1b36cE34237eEaFef220932846BCD82",
        vaultProxyAddress: "0x9A676e781A523b5d0C0e43731313A708CB607508",
        tokenAddress: "0xCf7Ed3AccA5a467e9e704C703E8D87F634fB0Fc9",
        withdrawalLockup: 24 * 3, // 3 days
        transactionConfirmationTimeout: 60000, // 1 minute
        startBlock: BigInt(0),
      },
    ],
  },
  TENANT_1: {
    // example of second tenant
    31337: [],
  },
};
