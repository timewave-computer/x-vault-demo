"use client";

import { Card } from "@/components";
import { useViewAllVaults } from "@/hooks";
import { formatBigInt } from "@/lib";
import Link from "next/link";
import { useAccount } from "wagmi";
export default function Home() {
  const { isConnected } = useAccount();
  const { vaults, chainId, isLoading, isError } = useViewAllVaults();

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
          {isLoading && (
            <div className="col-span-full flex justify-center items-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-accent-purple"></div>
            </div>
          )}
          {!isLoading && isError && <p>Error loading vaults.</p>}

          {!isLoading && !isError && vaults.length === 0 ? (
            <p>
              No vaults to show for chain ID {chainId}. Confirm your wallet is
              connected to the correct chain.
            </p>
          ) : (
            vaults.map((vault) => {
              const tvl = vault.tvl
                ? formatBigInt(vault.tvl, vault.tokenDecimals, vault.token, {
                    displayDecimals: 2,
                  })
                : "N/A";

              const apr = vault.aprPercentage
                ? `${vault.aprPercentage} %`
                : "N/A";

              const userVaultAssets = vault.userVaultAssets
                ? formatBigInt(
                    vault.userVaultAssets,
                    vault.tokenDecimals,
                    vault.token,
                    {
                      displayDecimals: 2,
                    },
                  )
                : "N/A";

              return (
                <Link
                  key={`vaultcard-${vault.vaultId}`}
                  href={`/vault/${vault.vaultId}`}
                >
                  <Card
                    isHoverable={true}
                    className="block  "
                    variant="primary"
                  >
                    <div className="mt-2">
                      <dl>
                        <div>
                          <dt className="sr-only">Name</dt>
                          <dd className="text-2xl font-beast text-primary">
                            {vault.copy.name}
                          </dd>
                        </div>
                        <div className="mt-2">
                          <dt className="sr-only">Description</dt>
                          <dd className="text-sm text-gray-500">
                            {vault.copy.description}
                          </dd>
                        </div>
                      </dl>
                      <div className="mt-6 grid grid-cols-2 gap-4 text-sm">
                        <div className="mt-1.5 sm:mt-0">
                          <p className="text-black">Vault TVL</p>
                          <p className="text-xl font-beast text-accent-purple text-wrap break-words">
                            {tvl}
                          </p>
                        </div>

                        <div className="gap-2">
                          <div className="mt-1.5 sm:mt-0">
                            <p className="text-black">APR</p>
                            <p className="text-xl font-beast text-secondary text-wrap break-words">
                              {apr}
                            </p>
                          </div>
                        </div>

                        {isConnected && (
                          <div className="col-span-2 border-t-2 border-primary/40 pt-4">
                            <div className="items-center gap-2">
                              <div className="mt-1.5 sm:mt-0">
                                <p className="text-black">Your Deposit</p>
                                <p className="text-xl font-beast text-accent-purple text-wrap break-words">
                                  {userVaultAssets}
                                </p>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </Card>
                </Link>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
