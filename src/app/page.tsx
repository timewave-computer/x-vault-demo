"use client";

import { Card } from "@/components";
import { useViewAllVaults } from "@/hooks";
import Link from "next/link";
import { useAccount } from "wagmi";
export default function Home() {
  const { isConnected } = useAccount();
  const {
    vaults,
    chainId,
    isLoading: _isLoading,
    isError,
    isPending,
  } = useViewAllVaults();

  const isLoading = _isLoading || isPending;
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
            vaults.map((vault) => (
              <Link key={`vaultcard-${vault.id}`} href={`/vault/${vault.id}`}>
                <Card isHoverable={true} className="block  " variant="primary">
                  <div className="mt-2">
                    <div className="mt-6 grid grid-cols-2 gap-4 text-sm">
                      <div className="mt-1.5 sm:mt-0">
                        <p className="text-black">Vault TVL</p>
                        <p className="text-xl font-beast text-accent-purple text-wrap break-words">
                          {vault.formatted.tvl}
                        </p>
                      </div>

                      <div className="gap-2">
                        <div className="mt-1.5 sm:mt-0">
                          <p className="text-black">Redemption Rate</p>
                          <p className="text-xl font-beast text-secondary text-wrap break-words">
                            {vault.formatted.redemptionRate}
                          </p>
                        </div>
                      </div>

                      {isConnected && (
                        <div className="col-span-2 border-t-2 border-primary/40 pt-4">
                          <div className="items-center gap-2">
                            <div className="mt-1.5 sm:mt-0">
                              <p className="text-black">Your Deposit</p>
                              <p className="text-xl font-beast text-accent-purple text-wrap break-words">
                                {vault.formatted.userPosition}
                              </p>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </Card>
              </Link>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
