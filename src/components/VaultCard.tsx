import Link from "next/link";
import type { VaultData } from "@/hooks";

interface VaultCardProps extends VaultData {
  isConnected: boolean;
}

export function VaultCard({
  id,
  name,
  description,
  formatted: { tvl, redemptionRate, userPosition },
  isConnected,
}: VaultCardProps) {
  return (
    <Link
      href={`/vault/${id}`}
      className="block rounded-lg p-4 shadow-sm hover:shadow-lg hover:shadow-primary transition-all duration-200 active:scale-95 active:shadow-inner bg-primary-light border-2 border-primary/40 overflow-x-scroll"
    >
      <div className="mt-2">
        <dl>
          <div>
            <dt className="sr-only">Name</dt>
            <dd className="text-2xl font-beast text-primary">{name}</dd>
          </div>
          <div className="mt-2">
            <dt className="sr-only">Description</dt>
            <dd className="text-sm text-gray-500">{description}</dd>
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
              <p className="text-black">Redemption Rate</p>
              <p className="text-xl font-beast text-secondary text-wrap break-words">
                {redemptionRate}
              </p>
            </div>
          </div>

          {isConnected && (
            <div className="col-span-2 border-t-2 border-primary/40 pt-4">
              <div className="sm:inline-flex sm:shrink-0 sm:items-center sm:gap-2">
                <div className="mt-1.5 sm:mt-0">
                  <p className="text-black">Your Deposit</p>
                  <p className="text-xl font-beast text-accent-purple">
                    {userPosition}
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </Link>
  );
}
