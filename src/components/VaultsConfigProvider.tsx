"use client";

import { createContext, useContext, ReactNode } from "react";
import { VaultConfig } from "@/lib";

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
