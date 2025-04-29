"use client";

import { vaultConfigSchema } from "@/lib";
import { createContext, useContext, ReactNode } from "react";
import { Address } from "viem";
import { z } from "zod";

/***
 * Provider for accessing data read out from vaults.config.json file saved locally in the file system
 * This can be removed and the config file accessed by direct import if vaults.config.json is committed to the repository
 *
 */

export type VaultConfig = z.infer<typeof vaultConfigSchema> & {
  vaultAddress: Address;
  vaultProxyAddress: Address;
  tokenAddress: Address;
  startBlock: bigint;
};

interface VaultsContextType {
  vaultsConfig: VaultConfig[];
  getVaultConfig: (vaultId: string) => VaultConfig | undefined;
}

const VaultsContext = createContext<VaultsContextType | null>(null);

export function VaultsConfigProvider({
  children,
  vaultsConfig,
}: {
  children: ReactNode;
  vaultsConfig: VaultConfig[];
}) {
  const getVaultConfig = (vaultId: string) => {
    return vaultsConfig.find((vault) => vault.vaultId === vaultId);
  };
  return (
    <VaultsContext.Provider value={{ vaultsConfig, getVaultConfig }}>
      {children}
    </VaultsContext.Provider>
  );
}

export function useVaultsConfig() {
  const context = useContext(VaultsContext);
  if (!context) {
    throw new Error(
      "useVaultsConfig must be used within a VaultsConfigProvider",
    );
  }
  return context;
}
