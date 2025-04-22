"use client";

import Link from "next/link";
import { useViewAllVaults, useVaultLogs } from "@/hooks";
import { useQuery } from "@tanstack/react-query";
import { QUERY_KEYS } from "@/const";
import { formatUnits } from "viem";

export default function VaultPage({ params }: { params: { id: string } }) {
  const {
    vaults,
    isLoading: _isLoading,
    isError,
    isPending,
  } = useViewAllVaults();
  const vaultData = vaults?.find((v) => v.id === params.id);

  const { getLogs } = useVaultLogs(vaultData);

  const { data: logs } = useQuery({
    enabled: !!vaultData?.vaultProxyAddress,
    queryKey: [QUERY_KEYS.VAULT_LOGS, vaultData?.vaultProxyAddress],
    refetchInterval: 15000, // 15 seconds
    queryFn: async () => {
      return getLogs();
    },
  });

  const { withdrawRequests, processedUpdates, deposits } = logs ?? {};

  const isLoading = _isLoading || isPending;

  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-accent-purple"></div>
      </div>
    );
  } else if (isError) {
    return <p>Error loading vault data.</p>;
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

  return (
    <div className="relative">
      {/* Content */}
      <div className="relative">
        <div className="sm:flex sm:items-center sm:justify-between">
          <div>
            <h1 className="text-3xl font-beast text-primary sm:text-4xl">
              {vaultData.name}
            </h1>
            <p className="mt-1.5 text-base text-gray-500">
              {vaultData.description}
            </p>
            <p className="mt-1 text-sm text-gray-400 font-mono">
              Contract: {vaultData.vaultProxyAddress}
            </p>
          </div>
        </div>

        <dl className="mt-6 grid grid-cols-1 gap-6 sm:grid-cols-4">
          <div className="rounded-lg border-2 border-accent-purple/40 px-4 py-6 text-center bg-accent-purple-light">
            <dt className="text-base text-black">TVL</dt>
            <dd className="mt-2 text-2xl font-beast text-accent-purple">
              {vaultData.formatted.tvl}
            </dd>
          </div>
          <div className="rounded-lg border-2 border-accent-purple/40 px-4 py-6 text-center bg-accent-purple-light">
            <dt className="text-base text-black">Total Shares</dt>
            <dd className="mt-2 text-2xl font-beast text-accent-purple">
              {vaultData.formatted.totalShares}
            </dd>
          </div>

          <div className="rounded-lg border-2 border-accent-purple/40 px-4 py-6 text-center bg-accent-purple-light">
            <dt className="text-base text-black">Redemption Rate</dt>
            <dd className="mt-2 text-2xl font-beast text-secondary">
              {vaultData.formatted.redemptionRate}
            </dd>
          </div>
        </dl>

        <dl className="mt-6 grid grid-cols-3 gap-6 ">
          <div>
            {deposits && deposits.length > 0 && (
              <div className="mt-8">
                <div className="rounded-lg bg-primary-light px-8 pt-8 pb-6 border-2 border-primary/40">
                  <div className="mb-6">
                    <h3 className="text-lg font-beast text-accent-purple mb-1">
                      event = Deposit
                    </h3>
                  </div>
                  <div className="space-y-4">
                    {deposits.map((deposit) => {
                      return (
                        <div
                          key={deposit.transactionHash}
                          className="flex flex-col sm:flex-row sm:items-center justify-between p-4 bg-white rounded-lg border border-gray-200"
                        >
                          <div className="mb-4 sm:mb-0">
                            <p className="text-base font-medium text-gray-900">
                              {deposit.assets} assets
                            </p>
                            <p className="text-sm text-gray-500">
                              {deposit.shares} shares minted
                            </p>
                            <p className="text-sm text-gray-500">
                              Block:{" "}
                              <a
                                href={`https://etherscan.io/block/${deposit.blockNumber}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-sm opacity-90 hover:underline mt-1"
                              >
                                {deposit.blockNumber.toString()}
                              </a>
                            </p>
                            <p className="text-sm text-gray-500">
                              Sender: {deposit.sender}
                            </p>
                            <p className="text-sm text-gray-500">
                              Owner: {deposit.owner}
                            </p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}
          </div>
          <div>
            {withdrawRequests && withdrawRequests.length > 0 && (
              <div className="mt-8">
                <div className="rounded-lg bg-primary-light px-8 pt-8 pb-6 border-2 border-primary/40">
                  <div className="mb-6">
                    <h3 className="text-lg font-beast text-accent-purple mb-1">
                      event = Withdraw
                    </h3>
                  </div>
                  <div className="space-y-4">
                    {withdrawRequests.map((withdrawal) => {
                      return (
                        <div
                          key={withdrawal.transactionHash}
                          className="flex flex-col sm:flex-row sm:items-center justify-between p-4 bg-white rounded-lg border border-gray-200"
                        >
                          <div className="mb-4 sm:mb-0">
                            <p className="text-base font-medium text-gray-900">
                              {withdrawal.shares} shares
                            </p>
                            <p className="text-sm text-gray-500">
                              Initiated on block:{" "}
                              <a
                                href={`https://etherscan.io/block/${withdrawal.blockNumber}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-sm opacity-90 hover:underline mt-1"
                              >
                                {withdrawal.blockNumber.toString()}
                              </a>
                            </p>
                            <p className="text-sm text-gray-500">
                              Owner: {withdrawal.owner}
                            </p>
                            <p className="text-sm text-gray-500">
                              Update ID: {withdrawal.updateId}
                            </p>
                            <p className="text-sm text-gray-500">
                              Withdraw rate: {withdrawal.withdrawRate}
                            </p>
                            <p className="text-sm text-gray-500">
                              Claimable after: {withdrawal.claimTime}
                            </p>
                            <p className="text-sm text-gray-500">
                              Update Timestamp: {withdrawal.updateTimestamp}
                            </p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}
          </div>
          <div>
            {processedUpdates && processedUpdates.length > 0 && (
              <div className="mt-8">
                <div className="rounded-lg bg-primary-light px-8 pt-8 pb-6 border-2 border-primary/40">
                  <div className="mb-6">
                    <h3 className="text-lg font-beast text-accent-purple mb-1">
                      event = UpdateProcessed
                    </h3>
                  </div>
                  <div className="space-y-4">
                    {processedUpdates.map((update) => {
                      return (
                        <div
                          key={update.transactionHash}
                          className="flex flex-col sm:flex-row sm:items-center justify-between p-4 bg-white rounded-lg border border-gray-200"
                        >
                          <div className="mb-4 sm:mb-0">
                            <p className="text-base font-medium text-gray-900">
                              Update ID:{" "}
                              {update.args?.updateId?.toString() || "N/A"}
                            </p>
                            <p className="text-sm text-gray-500">
                              Block:{" "}
                              <a
                                href={`https://etherscan.io/block/${update.blockNumber}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-sm opacity-90 hover:underline mt-1"
                              >
                                {update.blockNumber.toString()}
                              </a>
                            </p>
                            <p className="text-sm text-gray-500">
                              Withdraw Rate:{" "}
                              {update.args?.withdrawRate
                                ? formatUnits(
                                    update.args.withdrawRate,
                                    vaultData?.shareDecimals ?? 18,
                                  )
                                : "N/A"}
                            </p>
                            <p className="text-sm text-gray-500">
                              Total Assets To Withdraw:{" "}
                              {update.args?.totalAssetsToWithdraw
                                ? formatUnits(
                                    update.args.totalAssetsToWithdraw,
                                    vaultData?.tokenDecimals ?? 18,
                                  )
                                : "N/A"}
                            </p>
                            {/* <p className="text-sm text-gray-500 text-wrap break-words">
                              Transaction:{" "}
                              <a
                                href={`https://etherscan.io/tx/${update.transactionHash}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-sm opacity-90 hover:underline mt-1 text-wrap break-words"
                              >
                                {update.transactionHash}
                              </a>
                            </p> */}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}
          </div>
        </dl>
      </div>
    </div>
  );
}
