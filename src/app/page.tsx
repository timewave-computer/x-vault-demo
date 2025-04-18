"use client";

import { VaultCard } from "@/components/VaultCard";
import { useVaultData } from "@/hooks/useVaultData";

export default function Home() {
  const { isConnected, vaults, chainId } = useVaultData();

  return (
    <div className="relative">
      {/* Content */}
      <div className="relative">
        <div className="flex flex-col gap-1.5">
          <h1 className="text-3xl font-beast text-accent-purple sm:text-4xl">
            ELSEWHERE VAULTS
          </h1>

          <p className="text-sm text-gray-500">
            Select a vault for more details and start earning yield.
          </p>
        </div>

        <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {vaults.length === 0 && (
            <p>No vaults to show for chain ID {chainId}.</p>
          )}
          {vaults.map((vault) => (
            <VaultCard
              key={`vaultcard-${vault.id}`}
              {...vault}
              isConnected={isConnected}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
