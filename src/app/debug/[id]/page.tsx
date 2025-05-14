"use client";

import Link from "next/link";
import { useState } from "react";
import { useViewAllVaults, useVaultLogs } from "@/hooks";
import { useQuery } from "@tanstack/react-query";
import { QUERY_KEYS } from "@/const";
import {
  Card,
  Toggle,
  DepositEvents,
  WithdrawEvents,
  UpdateProcessedEvents,
  type ToggleOption,
  ChronologicalEvents,
} from "@/components";
import { formatBigInt } from "@/lib";

// Export specific EventToggle for backward compatibility
export type ViewMode = "divided" | "chronological";

export default function VaultPage({ params }: { params: { id: string } }) {
  const [viewMode, setViewMode] = useState<ViewMode>("divided");
  const toggleOptions: ToggleOption[] = [
    { value: "divided", label: "By Event Type" },
    { value: "chronological", label: "Chronological" },
  ];

  const {
    vaults,
    isLoading: isLoadingVaults,
    isError: isErrorVaults,
  } = useViewAllVaults();
  const vaultData = vaults?.find((v) => v.vaultId === params.id);

  const { getLogs } = useVaultLogs(
    vaultData
      ? {
          vaultProxyAddress: vaultData.vaultProxyAddress,
          tokenDecimals: vaultData.tokenDecimals,
          shareDecimals: vaultData.shareDecimals,
          startBlock: vaultData.startBlock,
        }
      : undefined,
  );

  const {
    data: logs,
    error: logsError,
    isLoading: isLogsLoading,
  } = useQuery({
    enabled: !!vaultData?.vaultProxyAddress,
    queryKey: [QUERY_KEYS.VAULT_LOGS, vaultData?.vaultProxyAddress],
    refetchInterval: 15000, // 15 seconds
    queryFn: async () => {
      return getLogs();
    },
  });

  const { withdrawRequests, processedUpdates, deposits } = logs ?? {};

  const isLoading = isLoadingVaults || isLogsLoading;

  const apr = vaultData?.aprPercentage ? `${vaultData.aprPercentage} %` : "N/A";

  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-accent-purple"></div>
      </div>
    );
  } else if (isErrorVaults) {
    return (
      <p>Error loading vault. Check that vault exists and chain is running.</p>
    );
  } else if (logsError) {
    return <p>Error loading logs.</p>;
  } else if (!vaultData) {
    return (
      <div className="text-center">
        <h1 className="text-3xl font-beast text-accent-purple sm:text-4xl">
          Vault Not Found
        </h1>
        <p className="mt-4 text-gray-500">
          The vault you are looking for does not exist.
        </p>
        <Link
          href="/"
          className="mt-8 inline-block rounded-lg bg-accent-purple px-8 py-3 text-sm font-medium text-white transition hover:scale-110 hover:shadow-xl focus:outline-none focus:ring active:bg-accent-purple-hover"
        >
          Go back home
        </Link>
      </div>
    );
  }

  // Check if there are any events
  const hasEvents =
    (deposits && deposits.length > 0) ||
    (withdrawRequests && withdrawRequests.length > 0) ||
    (processedUpdates && processedUpdates.length > 0);

  return (
    <div className="relative">
      {/* Content */}
      <div className="relative">
        <div className="sm:flex sm:items-center sm:justify-between">
          <div>
            <h1 className="text-3xl font-beast text-primary sm:text-4xl">
              {vaultData.copy.name}
            </h1>
            <div className="flex flex-col gap-1 mt-1.5 text-base text-gray-500">
              <p className=" ">{vaultData.copy.description}</p>

              <a
                href={`https://etherscan.io/address/${vaultData.vaultProxyAddress}`}
                target="_blank"
                rel="noopener noreferrer"
                className=" hover:underline"
              >
                {vaultData.vaultProxyAddress}
              </a>
            </div>
          </div>
        </div>

        <dl className="mt-6 grid grid-cols-1 gap-6 sm:grid-cols-4">
          <Card variant="secondary" className="text-center">
            <dt className="text-base text-black">TVL</dt>
            <dd className="mt-2 text-2xl font-beast text-accent-purple text-wrap break-words">
              {vaultData.tvl} {vaultData.token}
            </dd>
          </Card>

          <Card variant="secondary" className="text-center">
            <dt className="text-base text-black">Total Shares</dt>
            <dd className="mt-2 text-2xl font-beast text-accent-purple text-wrap break-words">
              {vaultData.totalShares} shares
            </dd>
          </Card>

          <Card variant="secondary" className="text-center">
            <dt className="text-base text-black">APR</dt>
            <dd className="mt-2 text-2xl font-beast text-secondary text-wrap break-words">
              {apr}
            </dd>
          </Card>
        </dl>

        {hasEvents && (
          <div className="mt-8">
            <h2 className="text-2xl font-beast text-primary mb-4">
              Vault Events
            </h2>

            <Toggle
              options={toggleOptions}
              value={viewMode}
              onChange={(value) => setViewMode(value as ViewMode)}
            />

            {viewMode === "divided" ? (
              <dl className="grid grid-cols-1 gap-6 md:grid-cols-3 text-nowrap">
                <div>
                  <DepositEvents deposits={deposits || []} />
                </div>
                <div>
                  <WithdrawEvents withdrawRequests={withdrawRequests || []} />
                </div>
                <div>
                  <UpdateProcessedEvents
                    processedUpdates={processedUpdates || []}
                    tokenDecimals={vaultData?.tokenDecimals}
                    shareDecimals={vaultData?.shareDecimals}
                  />
                </div>
              </dl>
            ) : (
              <ChronologicalEvents
                deposits={deposits || []}
                withdrawRequests={withdrawRequests || []}
                processedUpdates={processedUpdates || []}
                tokenDecimals={vaultData?.tokenDecimals}
                shareDecimals={vaultData?.shareDecimals}
              />
            )}
          </div>
        )}

        {!hasEvents && (
          <div className="mt-8 text-center p-6 bg-gray-50 rounded-lg">
            <p className="text-gray-500">No events found for this vault</p>
          </div>
        )}
      </div>
    </div>
  );
}
