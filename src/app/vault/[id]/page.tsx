"use client";

import Link from "next/link";
import { useViewAllVaults, useVaultContract, useTokenBalances } from "@/hooks";
import { useAccount } from "wagmi";
import { useState } from "react";
import { isValidNumberInput } from "@/lib";
import { useToast } from "@/context";
import { useMutation, useQuery } from "@tanstack/react-query";
import { QUERY_KEYS } from "@/const";
import {
  Button,
  Input,
  Card,
  WithdrawInProgress,
  DepositInProgress,
} from "@/components";
import { formatUnits } from "viem";

export default function VaultPage({ params }: { params: { id: string } }) {
  const { isConnected, address } = useAccount();
  const { showToast } = useToast();

  const {
    vaults,
    isLoading: isLoadingVaults,
    isError: isVaultsError,
  } = useViewAllVaults();
  const vaultData = vaults?.find((v) => v.vaultId === params.id);

  const [depositInput, setDepositInput] = useState("");
  const [withdrawInput, setWithdrawInput] = useState("");

  const {
    depositWithAmount,
    withdrawShares,
    pendingWithdrawal,
    completeWithdraw,
    previewRedeem,
    previewDeposit,
    refetchContractState,
    formatted: { tvl: tvlFormatted, totalShareBalance, totalAssetBalance },
    raw: { maxRedeem, tokenBalance, tokenDecimals, shareDecimals },

    isLoading: isLoadingContract,
    isError: isContractError,
  } = useVaultContract(vaultData);

  // do not truncate the decimal places
  const preciseMaxRedeem = formatUnits(maxRedeem ?? BigInt(0), shareDecimals);
  const preciseTokenBalance = formatUnits(
    tokenBalance ?? BigInt(0),
    tokenDecimals,
  );

  const isLoading = isLoadingVaults || isLoadingContract;
  const isError = isVaultsError || isContractError;

  const { ethBalance } = useTokenBalances({
    address,
    tokenAddresses: vaultData ? [vaultData.tokenAddress] : [],
  });
  const tokenSymbol = vaultData?.token ?? "";

  const { data: previewDepositAmount } = useQuery({
    enabled:
      !!vaultData?.vaultProxyAddress &&
      parseFloat(depositInput) > 0 &&
      isConnected,
    staleTime: 0,
    queryKey: [
      QUERY_KEYS.VAULT_PREVIEW_DEPOSIT,
      vaultData?.vaultProxyAddress,
      depositInput,
    ],
    queryFn: () => {
      return previewDeposit(depositInput);
    },
  });

  const { data: previewRedeemAmount } = useQuery({
    enabled:
      !!vaultData?.vaultProxyAddress &&
      parseFloat(withdrawInput) > 0 &&
      isConnected,
    staleTime: 0,
    queryKey: [
      QUERY_KEYS.VAULT_PREVIEW_WITHDRAW,
      vaultData?.vaultProxyAddress,
      withdrawInput,
    ],
    queryFn: () => {
      return previewRedeem(withdrawInput);
    },
  });

  const { mutate: handleDeposit, isPending: isDepositing } = useMutation({
    mutationFn: async () => {
      if (!depositInput || !isConnected || !vaultData)
        throw new Error("Unable to initiate deposit");
      return depositWithAmount(depositInput);
    },
    onSuccess: (hash) => {
      setDepositInput("");

      const toastDescription = vaultData?.apr
        ? `Your funds are now earning ${vaultData?.apr}% APY!`
        : "Funds are now earning yield.";
      showToast({
        title: "Deposit successful",
        description: toastDescription,
        type: "success",
        txHash: hash,
      });
      refetchContractState();
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
      if (!withdrawInput || !isConnected || !vaultData)
        throw new Error("Unable to initiate withdrawal");
      return withdrawShares(withdrawInput);
    },
    onSuccess: (hash) => {
      setWithdrawInput("");
      showToast({
        title: "Withdraw initiation submitted",
        description: "Assets will be claimable after the unbonding period.",
        type: "success",
        txHash: hash,
      });
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
          title: "Transfer successful",
          description: "Your withdrawal has been completed successfully.",
          type: "success",
          txHash: hash,
        });
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
    !withdrawInput ||
    isWithdrawing ||
    !maxRedeem ||
    maxRedeem === BigInt(0) ||
    parseFloat(withdrawInput) > maxRedeem;
  const isDepositDisabled =
    !isConnected ||
    !depositInput ||
    isDepositing ||
    !tokenBalance ||
    parseFloat(depositInput) > tokenBalance;

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
              {vaultData.copy.name}
            </h1>
            <div className="flex flex-col gap-1 mt-1 text-base text-gray-500">
              <p>
                Vault Address:{" "}
                <a
                  href={`https://etherscan.io/address/${vaultData.vaultProxyAddress}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className=" hover:underline"
                >
                  {vaultData.vaultProxyAddress}
                </a>
              </p>
              <p className="mt-2">{vaultData.copy.description}</p>
            </div>
          </div>
        </div>

        <dl className="mt-6 grid grid-cols-1 gap-6 sm:grid-cols-4">
          <Card variant="secondary" className="text-center">
            <dt className="text-base text-black">Your Balance</dt>
            <dd className="mt-2 text-2xl font-beast text-accent-purple text-wrap break-words">
              {isConnected ? totalShareBalance : "-"}
            </dd>
          </Card>

          <Card variant="secondary" className="text-center">
            <dt className="text-base text-black">Your Position</dt>
            <dd className="mt-2 text-2xl font-beast text-accent-purple text-wrap break-words">
              {isConnected ? totalAssetBalance : "-"}
            </dd>
          </Card>

          <Card variant="secondary" className="text-center">
            <dt className="text-base text-black">Vault TVL</dt>
            <dd className="mt-2 text-2xl font-beast text-accent-purple text-wrap break-words">
              {tvlFormatted}
            </dd>
          </Card>

          <Card variant="secondary" className="text-center">
            <dt className="text-base text-black">APR</dt>
            <dd className="mt-2 text-2xl font-beast text-secondary text-wrap break-words">
              {vaultData.apr ? `${vaultData.apr} %` : "N/A"}
            </dd>
          </Card>
        </dl>

        {/*shows when user has a deposit, and no pending withdrawal */}
        {isConnected &&
          maxRedeem &&
          maxRedeem > BigInt(0) &&
          // contains copy for vault path and on deposit success
          !pendingWithdrawal?.hasActiveWithdraw && (
            <DepositInProgress copy={vaultData.copy.depositInProgress} />
          )}

        {/*shows when user has a pending withdrawal */}
        {isConnected && pendingWithdrawal?.hasActiveWithdraw && (
          <WithdrawInProgress
            copy={vaultData?.copy.withdrawInProgress}
            pendingWithdrawal={pendingWithdrawal}
            onCompleteWithdraw={handleCompleteWithdraw}
            isCompletingWithdraw={isCompletingWithdraw}
          />
        )}
        <div className="mt-8 grid grid-cols-1 gap-6 lg:grid-cols-2">
          {/* Deposit Section */}
          <Card variant="primary">
            <div className="mb-6">
              <h3 className="text-lg font-beast text-accent-purple">
                {vaultData.copy.deposit.title}
              </h3>
              <div className="flex justify-between items-center mt-2">
                <p className="text-sm text-gray-500">
                  {vaultData.copy.deposit.description}
                </p>
                <div className="flex items-center gap-2">
                  <p className="text-sm text-gray-500">
                    Available: {`${preciseTokenBalance} ${tokenSymbol}`}
                  </p>
                  <Button
                    onClick={() => setDepositInput(preciseTokenBalance)}
                    disabled={!isConnected}
                    variant="secondary"
                    size="sm"
                  >
                    MAX
                  </Button>
                </div>
              </div>
            </div>

            {/* Deposit input */}
            <div className="flex rounded-lg border-2 border-primary/40">
              <Input
                type="number"
                id="depositInput"
                name="depositInput"
                aria-label={`Deposit amount in ${tokenSymbol}`}
                placeholder="0.0"
                min="0"
                step="any"
                inputMode="decimal"
                value={depositInput}
                onChange={(e) => {
                  const value = e.target.value;
                  handleNumberInput(value, setDepositInput);
                }}
                isEnabled={isConnected && !isDepositing}
                isError={
                  parseFloat(depositInput) > parseFloat(preciseTokenBalance)
                }
              />

              <div className="flex items-center bg-primary-light px-4 text-base text-black border-l-2 border-primary/40 rounded-r-lg">
                {tokenSymbol}
              </div>
            </div>

            <Button
              className="mt-4"
              onClick={() => handleDeposit()}
              disabled={isDepositDisabled}
              variant="primary"
              fullWidth
              isLoading={isDepositing}
            >
              {isDepositing
                ? "Confirm in Wallet..."
                : vaultData.copy.deposit.cta}
            </Button>

            {/* Deposit estimate and warning display */}
            <div className="h-6 mt-2 flex justify-between items-start">
              {depositInput &&
                previewDepositAmount &&
                parseFloat(depositInput) > 0 && (
                  <p className="text-sm text-gray-500">
                    ≈ {previewDepositAmount}
                  </p>
                )}
              {isConnected &&
                depositInput &&
                tokenBalance &&
                parseFloat(depositInput) > tokenBalance && (
                  <p className="text-sm text-secondary">
                    Insufficient {tokenSymbol} balance
                  </p>
                )}
            </div>
          </Card>

          {/* Withdraw Section */}
          <Card variant="primary">
            <div className="mb-6">
              <h3 className="text-lg font-beast text-accent-purple mb-1">
                {vaultData.copy.withdraw.title}
              </h3>
              <div className="flex justify-between items-start mt-2">
                <p className="text-sm text-gray-500">
                  {vaultData.copy.withdraw.description}
                </p>
                <div className="flex items-center gap-2">
                  <p className="text-sm text-gray-500">
                    Available: {preciseMaxRedeem} shares
                  </p>
                  <Button
                    onClick={() => setWithdrawInput(preciseMaxRedeem)}
                    disabled={!isConnected}
                    variant="secondary"
                    size="sm"
                  >
                    MAX
                  </Button>
                </div>
              </div>
            </div>

            {/* Withdraw input */}
            <div className="flex rounded-lg border-2 border-primary/40">
              <Input
                type="number"
                id="withdrawInput"
                name="withdrawInput"
                aria-label="Withdraw shares amount"
                min="0"
                step="any"
                inputMode="decimal"
                value={withdrawInput}
                placeholder="0.0"
                onChange={(e) => {
                  const value = e.target.value;
                  handleNumberInput(value, setWithdrawInput);
                }}
                isEnabled={isConnected && !isWithdrawing}
                isError={
                  parseFloat(withdrawInput) > parseFloat(preciseMaxRedeem)
                }
              />

              <div className="flex items-center bg-primary-light px-4 text-base text-black border-l-2 border-primary/40 rounded-r-lg">
                Shares
              </div>
            </div>

            <Button
              className="mt-4"
              onClick={() => handleWithdraw()}
              disabled={isWithdrawDisabled}
              variant="primary"
              fullWidth
              isLoading={isWithdrawing}
            >
              {isWithdrawing
                ? "Confirm in Wallet..."
                : vaultData.copy.withdraw.cta}
            </Button>

            {/* Withdraw estimate and warning display */}
            <div className="h-6 mt-4 flex justify-between items-center">
              {withdrawInput &&
                parseFloat(withdrawInput) > 0 &&
                previewRedeemAmount && (
                  <p className="text-sm text-gray-500">
                    ≈ {previewRedeemAmount}
                  </p>
                )}
              {isConnected &&
                withdrawInput &&
                (!maxRedeem || maxRedeem === BigInt(0)) && (
                  <p className="text-sm text-secondary">
                    You need vault shares to withdraw
                  </p>
                )}{" "}
              {isConnected &&
                withdrawInput &&
                parseFloat(withdrawInput) > parseFloat(preciseMaxRedeem) && (
                  <p className="text-sm text-secondary">
                    Insufficient vault balance
                  </p>
                )}
            </div>
          </Card>
        </div>
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
