"use client";

import Link from "next/link";
import { useVaultData, useVaultContract, useTokenBalances } from "@/hooks";
import { useAccount } from "wagmi";
import { useState } from "react";
import { formatHoursToDays, isValidNumberInput } from "@/lib";
import { useToast } from "@/components";
import { useMutation } from "@tanstack/react-query";

export default function VaultPage({ params }: { params: { id: string } }) {
  const { vaults } = useVaultData();
  const { isConnected, address } = useAccount();
  const vaultData = vaults?.find((v) => v.id === params.id);
  const [depositAmount, setDepositAmount] = useState("");
  const [withdrawShares, setWithdrawShares] = useState("");
  const locale = "en-US";
  const { showToast } = useToast();

  const {
    depositWithAmount,
    withdrawShares: withdrawSharesFromVault,
    maxWithdraw,
    balance,
  } = useVaultContract(
    vaultData?.vaultProxyAddress ?? "",
    vaultData?.tokenAddress ?? "",
  );

  const { tokenBalances, ethBalance } = useTokenBalances({
    address,
    tokenAddresses: vaultData ? [vaultData.tokenAddress] : [],
  });
  const vaultTokenBalance = tokenBalances.data?.[0] ?? undefined;
  const tokenBalance = vaultTokenBalance?.balance.formatted ?? "0";
  const tokenSymbol = vaultTokenBalance?.symbol;

  const { mutate: handleDeposit, isPending: isDepositing } = useMutation({
    mutationFn: async () => {
      if (!depositAmount || !isConnected || !vaultData)
        throw new Error("Invalid input");
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
          </div>
        </div>

        <dl className="mt-6 grid grid-cols-1 gap-6 sm:grid-cols-4">
          <div className="rounded-lg border-2 border-accent-purple/40 px-4 py-6 text-center bg-accent-purple-light">
            <dt className="text-base text-black">Your Balance</dt>
            <dd className="mt-2 text-2xl font-beast text-accent-purple">
              {isConnected ? vaultData.userShares : "-"}
            </dd>
          </div>

          <div className="rounded-lg border-2 border-accent-purple/40 px-4 py-6 text-center bg-accent-purple-light">
            <dt className="text-base text-black">Your Position</dt>
            <dd className="mt-2 text-2xl font-beast text-accent-purple">
              {isConnected ? vaultData.userPosition : "-"}
            </dd>
          </div>

          <div className="rounded-lg border-2 border-accent-purple/40 px-4 py-6 text-center bg-accent-purple-light">
            <dt className="text-base text-black">Vault TVL</dt>
            <dd className="mt-2 text-2xl font-beast text-accent-purple">
              {vaultData.tvl}
            </dd>
          </div>

          <div className="rounded-lg border-2 border-accent-purple/40 px-4 py-6 text-center bg-accent-purple-light">
            <dt className="text-base text-black">APR</dt>
            <dd className="mt-2 text-2xl font-beast text-secondary">
              {vaultData.apr}
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
                  Add tokens to start earning yield
                </p>
                <div className="flex items-center gap-2">
                  <p className="text-sm text-gray-500">
                    Available: {tokenBalance ?? "0"} {tokenSymbol}
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
                  depositAmount &&
                  parseFloat(depositAmount) > parseFloat(tokenBalance || "0")
                    ? "shadow-[inset_0_1px_8px_rgba(255,0,0,0.25)]"
                    : "focus:shadow-[inset_0_1px_8px_rgba(0,145,255,0.25)]"
                }`}
                placeholder="0.0"
                value={depositAmount}
                onChange={(e) => {
                  const value = e.target.value;
                  // Only allow positive numbers
                  if (value === "") {
                    setDepositAmount("");
                  }
                  if (isValidNumberInput(value) && parseFloat(value) >= 0) {
                    setDepositAmount(value);
                  }
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
              disabled={
                !isConnected ||
                !depositAmount ||
                parseFloat(depositAmount || "0") <= 0 ||
                isDepositing ||
                !tokenBalance ||
                parseFloat(depositAmount || "0") >
                  parseFloat(tokenBalance || "0")
              }
              className={`w-full rounded-lg px-8 py-3 text-base font-beast focus:outline-none focus:ring mt-4 ${
                !isConnected ||
                !depositAmount ||
                parseFloat(depositAmount || "0") <= 0 ||
                isDepositing ||
                !tokenBalance ||
                parseFloat(depositAmount || "0") >
                  parseFloat(tokenBalance || "0")
                  ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                  : "bg-accent-purple text-white hover:scale-110 hover:shadow-xl hover:bg-accent-purple-hover active:bg-accent-purple-active transition-all"
              }`}
            >
              {isDepositing ? "Confirm in Wallet..." : "Deposit"}
            </button>

            {/* Deposit estimate and warning display */}
            <div className="h-6 mt-4 flex justify-between items-center">
              {depositAmount && parseFloat(depositAmount) > 0 && (
                <p className="text-sm text-gray-500">
                  Balance: {tokenBalance ?? "0"} {tokenSymbol}
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
                  Convert your shares to tokens
                </p>
                <div className="flex items-center gap-2">
                  <p className="text-sm text-gray-500">
                    Available: {maxWithdraw} shares
                  </p>
                  <button
                    onClick={() => setWithdrawShares(maxWithdraw ?? "0")}
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
                  (!maxWithdraw ||
                    parseFloat(withdrawShares) > parseFloat(maxWithdraw))
                    ? "shadow-[inset_0_1px_8px_rgba(255,0,0,0.25)]"
                    : "focus:shadow-[inset_0_1px_8px_rgba(0,145,255,0.25)]"
                }`}
                placeholder="0.0"
                value={withdrawShares}
                onChange={(e) => {
                  const value = e.target.value;
                  // Only allow positive numbers
                  if (value === "") {
                    setWithdrawShares("");
                  }
                  if (isValidNumberInput(value) && parseFloat(value) >= 0) {
                    setWithdrawShares(value);
                  }
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
              disabled={
                !isConnected ||
                !withdrawShares ||
                isWithdrawing ||
                !maxWithdraw ||
                maxWithdraw === "0"
              }
              className={`w-full rounded-lg px-8 py-3 text-base font-beast focus:outline-none focus:ring mt-4 ${
                !isConnected ||
                !withdrawShares ||
                isWithdrawing ||
                !maxWithdraw ||
                maxWithdraw === "0"
                  ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                  : "bg-accent-purple text-white hover:scale-110 hover:shadow-xl hover:bg-accent-purple-hover active:bg-accent-purple-active transition-all"
              }`}
            >
              {isWithdrawing ? "Confirm in Wallet..." : "Initiate Withdraw"}
            </button>

            {/* Withdraw estimate and warning display */}
            <div className="h-6 mt-4 flex justify-between items-center">
              {withdrawShares && (
                <p className="text-sm text-gray-500">
                  ≈ {balance} {vaultData.token}
                </p>
              )}
              {isConnected &&
                withdrawShares &&
                (!maxWithdraw || maxWithdraw === "0") && (
                  <p className="text-sm text-secondary">
                    You need vault shares to withdraw
                  </p>
                )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
