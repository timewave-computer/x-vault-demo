"use client";

import Link from "next/link";
import { useVaultData, useVaultContract, useTokenBalances } from "@/hooks";
import { useAccount } from "wagmi";
import { useState } from "react";
import { formatHoursToDays, isValidNumberInput } from "@/lib";
import { useToast } from "@/components";
import { useMutation, useQuery } from "@tanstack/react-query";
import { QUERY_KEYS } from "@/const";
import { formatUnits } from "viem";
export default function VaultPage({ params }: { params: { id: string } }) {
  const { vaults } = useVaultData();
  const { isConnected, address } = useAccount();
  const vaultData = vaults?.find((v) => v.id === params.id);
  const [depositAmount, setDepositAmount] = useState("");
  const [withdrawShares, setWithdrawShares] = useState("");
  const { showToast } = useToast();

  const {
    depositWithAmount,
    withdrawShares: withdrawSharesFromVault,
    userWithdrawRequest,
    completeWithdraw,
    previewRedeem,
    previewDeposit,
    refetchContractState,
  } = useVaultContract(vaultData);

  const maxWithdrawFormatted = parseFloat(
    formatUnits(
      vaultData?.raw.userShares ?? BigInt(0),
      vaultData?.decimals ?? 18,
    ),
  );

  const { tokenBalances, ethBalance } = useTokenBalances({
    address,
    tokenAddresses: vaultData ? [vaultData.tokenAddress] : [],
  });
  const vaultTokenBalance = tokenBalances.data?.[0] ?? undefined;
  const tokenBalance = vaultTokenBalance?.balance.formatted ?? "0";
  const tokenSymbol = vaultTokenBalance?.symbol;

  const { data: previewDepositAmount } = useQuery({
    enabled:
      !!vaultData?.vaultProxyAddress &&
      parseFloat(depositAmount) > 0 &&
      isConnected,
    staleTime: 0,
    queryKey: [
      QUERY_KEYS.VAULT_PREVIEW_DEPOSIT,
      vaultData?.vaultProxyAddress,
      depositAmount,
    ],
    queryFn: () => {
      return previewDeposit(depositAmount);
    },
  });

  const { data: previewRedeemAmount } = useQuery({
    enabled:
      !!vaultData?.vaultProxyAddress &&
      parseFloat(withdrawShares) > 0 &&
      isConnected,
    staleTime: 0,
    queryKey: [
      QUERY_KEYS.VAULT_PREVIEW_WITHDRAW,
      vaultData?.vaultProxyAddress,
      withdrawShares,
    ],
    queryFn: () => {
      return previewRedeem(withdrawShares);
    },
  });

  const { mutate: handleDeposit, isPending: isDepositing } = useMutation({
    mutationFn: async () => {
      if (!depositAmount || !isConnected || !vaultData)
        throw new Error("Unable to initiate deposit");
      return depositWithAmount(depositAmount);
    },
    onSuccess: (hash) => {
      setDepositAmount("");
      showToast({
        title: "Deposit successful",
        description: "Your deposit has been processed successfully.",
        type: "success",
        txHash: hash,
      });
      tokenBalances.refetch(vaultData?.tokenAddress);
      ethBalance.refetch();
    },
    onError: (err) => {
      if (err instanceof Error) {
        showToast({
          title: "Transaction failed",
          description: err.message,
          type: "error",
        });
      } else {
        console.error("Failed to deposit", err);
        showToast({
          title: "Failed to deposit",
          type: "error",
        });
      }
    },
  });

  const { mutate: handleWithdraw, isPending: isWithdrawing } = useMutation({
    mutationFn: async () => {
      if (!withdrawShares || !isConnected || !vaultData)
        throw new Error("Unable to initiate withdrawal");
      return withdrawSharesFromVault(withdrawShares);
    },
    onSuccess: (hash) => {
      setWithdrawShares("");
      showToast({
        title: "Withdraw initiation submitted",
        description: `This vault has a withdraw fullfillment period of ${formatHoursToDays(vaultData?.withdrawalLockup ?? 0)} days. After this time, you can claim your tokens.`,
        type: "success",
        txHash: hash,
      });
      tokenBalances.refetch(vaultData?.tokenAddress);
      ethBalance.refetch();
      refetchContractState();
    },
    onError: (err) => {
      if (err instanceof Error) {
        showToast({
          title: "Transaction failed",
          description: err.message,
          type: "error",
        });
      } else {
        console.error("Failed to withdraw", err);
        showToast({
          title: "Failed to withdraw",
          type: "error",
        });
      }
    },
  });

  const { mutate: handleCompleteWithdraw, isPending: isCompletingWithdraw } =
    useMutation({
      mutationFn: async () => {
        if (!isConnected || !vaultData)
          throw new Error("Unable to complete withdrawal");
        return completeWithdraw();
      },
      onSuccess: (hash) => {
        showToast({
          title: "Withdrawal completed",
          description: "Your withdrawal has been completed successfully.",
          type: "success",
          txHash: hash,
        });
        tokenBalances.refetch(vaultData?.tokenAddress);
        ethBalance.refetch();
        refetchContractState();
      },
      onError: (err) => {
        if (err instanceof Error) {
          showToast({
            title: "Transaction failed",
            description: err.message,
            type: "error",
          });
        } else {
          console.error("Failed to complete withdrawal", err);
          showToast({
            title: "Failed to complete withdrawal",
            type: "error",
          });
        }
      },
    });

  const isWithdrawDisabled =
    !isConnected ||
    !withdrawShares ||
    isWithdrawing ||
    !maxWithdrawFormatted ||
    maxWithdrawFormatted === 0 ||
    parseFloat(withdrawShares) > maxWithdrawFormatted;
  const isDepositDisabled =
    !isConnected ||
    !depositAmount ||
    isDepositing ||
    !tokenBalance ||
    parseFloat(depositAmount) > parseFloat(tokenBalance);

  if (!vaultData) {
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
            <dt className="text-base text-black">Your Balance</dt>
            <dd className="mt-2 text-2xl font-beast text-accent-purple">
              {isConnected ? vaultData.formatted.userShares : "-"}
            </dd>
          </div>

          <div className="rounded-lg border-2 border-accent-purple/40 px-4 py-6 text-center bg-accent-purple-light">
            <dt className="text-base text-black">Your Position</dt>
            <dd className="mt-2 text-2xl font-beast text-accent-purple">
              {isConnected ? vaultData.formatted.userPosition : "-"}
            </dd>
          </div>

          <div className="rounded-lg border-2 border-accent-purple/40 px-4 py-6 text-center bg-accent-purple-light">
            <dt className="text-base text-black">Vault TVL</dt>
            <dd className="mt-2 text-2xl font-beast text-accent-purple">
              {vaultData.formatted.tvl}
            </dd>
          </div>

          <div className="rounded-lg border-2 border-accent-purple/40 px-4 py-6 text-center bg-accent-purple-light">
            <dt className="text-base text-black">Redemption Rate</dt>
            <dd className="mt-2 text-2xl font-beast text-secondary">
              {vaultData.formatted.redemptionRate}
            </dd>
          </div>
        </dl>

        <div className="mt-8 grid grid-cols-1 gap-6 lg:grid-cols-2">
          {/* Deposit Section */}
          <div className="rounded-lg bg-primary-light px-8 pt-8 pb-6 border-2 border-primary/40">
            <div className="mb-6">
              <h3 className="text-lg font-beast text-accent-purple">Deposit</h3>
              <div className="flex justify-between items-center mt-2">
                <p className="text-sm text-gray-500">
                  Deposit tokens to start earning yield
                </p>
                <div className="flex items-center gap-2">
                  <p className="text-sm text-gray-500">
                    Available: {`${tokenBalance ?? 0} ${tokenSymbol}`}
                  </p>
                  <button
                    onClick={() =>
                      tokenBalance && setDepositAmount(tokenBalance)
                    }
                    disabled={!isConnected}
                    className={`px-2 py-1 text-sm font-medium rounded transition-colors ${
                      isConnected
                        ? "text-white bg-primary hover:bg-primary-hover"
                        : "text-gray-400 bg-gray-200 cursor-not-allowed"
                    }`}
                  >
                    MAX
                  </button>
                </div>
              </div>
            </div>

            {/* Deposit input */}
            <div className="flex rounded-lg border-2 border-primary/40">
              <input
                type="number"
                id="depositAmount"
                name="depositAmount"
                aria-label={`Deposit amount in ${tokenSymbol}`}
                className={`w-full px-4 py-3 text-base text-gray-900 bg-white placeholder:text-gray-400 focus:outline-none focus:ring-0 [border-top-left-radius:0.4rem] [border-bottom-left-radius:0.4rem] transition-shadow ${
                  depositAmount && isDepositDisabled
                    ? "shadow-[inset_0_1px_8px_rgba(255,0,0,0.25)]"
                    : "focus:shadow-[inset_0_1px_8px_rgba(0,145,255,0.25)]"
                }`}
                placeholder="0.0"
                value={depositAmount}
                onChange={(e) => {
                  const value = e.target.value;
                  handleNumberInput(value, setDepositAmount);
                }}
                min="0"
                step="any"
                inputMode="decimal"
                disabled={!isConnected || isDepositing}
              />
              <div className="flex items-center bg-primary-light px-4 text-base text-black border-l-2 border-primary/40 rounded-r-lg">
                {tokenSymbol}
              </div>
            </div>

            <button
              onClick={() => handleDeposit()}
              disabled={isDepositDisabled}
              className={`w-full rounded-lg px-8 py-3 text-base font-beast focus:outline-none focus:ring mt-4 ${
                isDepositDisabled
                  ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                  : "bg-accent-purple text-white hover:scale-110 hover:shadow-xl hover:bg-accent-purple-hover active:bg-accent-purple-active transition-all"
              }`}
            >
              {isDepositing ? "Confirm in Wallet..." : "Deposit"}
            </button>

            {/* Deposit estimate and warning display */}
            <div className="h-6 mt-4 flex justify-between items-center">
              {depositAmount &&
                previewDepositAmount &&
                parseFloat(depositAmount) > 0 && (
                  <p className="text-sm text-gray-500">
                    ≈ {previewDepositAmount}
                  </p>
                )}
              {isConnected &&
                depositAmount &&
                tokenBalance &&
                parseFloat(depositAmount) > parseFloat(tokenBalance) && (
                  <p className="text-sm text-secondary">
                    Insufficient {tokenSymbol} balance
                  </p>
                )}
            </div>
          </div>

          {/* Withdraw Section */}
          <div className="rounded-lg bg-primary-light px-8 pt-8 pb-6 border-2 border-primary/40">
            <div className="mb-6">
              <h3 className="text-lg font-beast text-accent-purple mb-1">
                Withdraw
              </h3>
              <div className="flex justify-between items-center mt-2">
                <p className="text-sm text-gray-500">
                  Convert shares back to tokens
                </p>
                <div className="flex items-center gap-2">
                  <p className="text-sm text-gray-500">
                    Available: {vaultData.formatted.userShares ?? `0 shares`}
                  </p>
                  <button
                    onClick={() =>
                      setWithdrawShares(maxWithdrawFormatted?.toString() ?? "0")
                    }
                    disabled={!isConnected}
                    className={`px-2 py-1 text-sm font-medium rounded transition-colors ${
                      isConnected
                        ? "text-white bg-primary hover:bg-primary-hover"
                        : "text-gray-400 bg-gray-200 cursor-not-allowed"
                    }`}
                  >
                    MAX
                  </button>
                </div>
              </div>
            </div>

            {/* Withdraw input */}
            <div className="flex rounded-lg border-2 border-primary/40">
              <input
                type="number"
                id="withdrawShares"
                name="withdrawShares"
                aria-label="Withdraw shares amount"
                className={`w-full px-4 py-3 text-base text-gray-900 bg-white placeholder:text-gray-400 focus:outline-none focus:ring-0 [border-top-left-radius:0.4rem] [border-bottom-left-radius:0.4rem] transition-shadow ${
                  withdrawShares &&
                  parseFloat(withdrawShares) > 0 &&
                  parseFloat(withdrawShares) > maxWithdrawFormatted
                    ? "shadow-[inset_0_1px_8px_rgba(255,0,0,0.25)]"
                    : "focus:shadow-[inset_0_1px_8px_rgba(0,145,255,0.25)]"
                }`}
                placeholder="0.0"
                value={withdrawShares}
                onChange={(e) => {
                  const value = e.target.value;
                  handleNumberInput(value, setWithdrawShares);
                }}
                min="0"
                step="any"
                inputMode="decimal"
                disabled={!isConnected || isWithdrawing}
              />
              <div className="flex items-center bg-primary-light px-4 text-base text-black border-l-2 border-primary/40 rounded-r-lg">
                Shares
              </div>
            </div>

            <button
              onClick={() => handleWithdraw()}
              disabled={isWithdrawDisabled}
              className={`w-full rounded-lg px-8 py-3 text-base font-beast focus:outline-none focus:ring mt-4 ${
                isWithdrawDisabled
                  ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                  : "bg-accent-purple text-white hover:scale-110 hover:shadow-xl hover:bg-accent-purple-hover active:bg-accent-purple-active transition-all"
              }`}
            >
              {isWithdrawing ? "Confirm in Wallet..." : "Initiate Withdraw"}
            </button>

            {/* Withdraw estimate and warning display */}
            <div className="h-6 mt-4 flex justify-between items-center">
              {withdrawShares &&
                parseFloat(withdrawShares) > 0 &&
                previewRedeemAmount && (
                  <p className="text-sm text-gray-500">
                    ≈ {previewRedeemAmount}
                  </p>
                )}
              {isConnected &&
                withdrawShares &&
                (!maxWithdrawFormatted || maxWithdrawFormatted === 0) && (
                  <p className="text-sm text-secondary">
                    You need vault shares to withdraw
                  </p>
                )}{" "}
              {isConnected &&
                withdrawShares &&
                parseFloat(withdrawShares) > maxWithdrawFormatted && (
                  <p className="text-sm text-secondary">
                    Insufficient vault balance
                  </p>
                )}
            </div>
          </div>
        </div>

        {userWithdrawRequest.withdrawData &&
          userWithdrawRequest.withdrawData.hasActiveWithdraw && (
            <div className="mt-8">
              <div className="rounded-lg bg-primary-light px-8 pt-8 pb-6 border-2 border-primary/40">
                <div className="mb-6">
                  <h3 className="text-lg font-beast text-accent-purple mb-1">
                    Pending Withdrawal
                  </h3>
                  <p className="text-sm text-gray-500">
                    Complete your pending withdrawal to receive your tokens.
                  </p>
                  <p className="text-sm text-gray-500">
                    This vault has a withdrawal fulfillment period of{" "}
                    {formatHoursToDays(vaultData?.withdrawalLockup ?? 0)} days.
                    You must wait this period after initiating a withdrawal
                    before you can complete it.
                  </p>
                </div>

                <div className="space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between p-4 bg-white rounded-lg border border-gray-200">
                    <div className="mb-4 sm:mb-0">
                      <p className="text-base font-medium text-gray-900">
                        {userWithdrawRequest.withdrawData.sharesAmount} shares
                      </p>

                      <p className="text-sm text-gray-500">
                        Owner: {userWithdrawRequest.withdrawData.owner}
                      </p>
                      <p className="text-sm text-gray-500">
                        Update ID: {userWithdrawRequest.withdrawData.updateId}
                      </p>
                      <p className="text-sm text-gray-500">
                        Withdraw rate:{" "}
                        {userWithdrawRequest.updateData?.withdrawRate}
                      </p>
                      <p className="text-sm text-gray-500">
                        Claimable after:{" "}
                        {userWithdrawRequest.withdrawData.claimTime}
                      </p>
                    </div>
                    <button
                      onClick={() => handleCompleteWithdraw()}
                      disabled={!isConnected || isCompletingWithdraw}
                      className={`px-4 py-2 rounded-lg text-sm font-medium ${
                        !isConnected || isCompletingWithdraw
                          ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                          : "bg-accent-purple text-white hover:bg-accent-purple-hover active:bg-accent-purple-active transition-all"
                      }`}
                    >
                      {isCompletingWithdraw
                        ? "Processing..."
                        : "Complete Withdraw"}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
      </div>
    </div>
  );
}

/***
 * Reusable function to validate number input
 * @param value - The value to handle
 * @param setValue - The function to set the value
 */
const handleNumberInput = (
  value: string,
  setValue: (value: string) => void,
) => {
  if (value === "") {
    setValue("");
  }
  // Only allow positive numbers
  if (isValidNumberInput(value) && parseFloat(value) >= 0) {
    setValue(value);
  }
};
