import {
  useReadContract,
  useAccount,
  usePublicClient,
  useWalletClient,
  useConfig,
  useReadContracts,
} from "wagmi";
import { parseUnits, formatUnits, erc20Abi, BaseError } from "viem";
import { type Address } from "viem";
import { valenceVaultABI } from "@/const";
import { VaultData } from "@/hooks";
import {
  formatBigInt,
  formatBigIntToTimestamp,
  unixTimestampToDateString,
  formatRemainingTime,
} from "@/lib";
import { readContract } from "@wagmi/core";

const REFRESH_INTERVAL = 5000;

/**
 * Hook for interacting with an ERC-4626 vault contract
 * Provides functionality for:
 * - Reading token and share balances
 * - Converting between assets and shares
 * - Depositing assets and withdrawing shares
 * - Viewing pending withdrawals
 */
export function useVaultContract(vaultMetadata?: VaultData) {
  const {
    vaultProxyAddress,
    tokenAddress,
    tokenDecimals,
    shareDecimals,
    transactionConfirmationTimeout,
    token: symbol,
  } = vaultMetadata ?? {
    // placeholders
    tokenDecimals: 6,
    shareDecimals: 18,
    token: "",
  };

  const { address, isConnected } = useAccount();
  const publicClient = usePublicClient();
  const { data: walletClient } = useWalletClient();
  const config = useConfig();

  const {
    data: vaultData,
    isLoading: isLoadingVaultData,
    isError: isErrorVaultData,
    refetch: refetchVaultData,
  } = useReadContracts({
    query: {
      refetchInterval: REFRESH_INTERVAL,
    },
    contracts: [
      {
        // total assetss (tvl)
        abi: valenceVaultABI,
        functionName: "totalAssets",
        address: vaultProxyAddress as Address,
      },
      {
        // redemption rate
        abi: valenceVaultABI,
        functionName: "redemptionRate",
        address: vaultProxyAddress as Address,
      },
    ],
  });

  let tvl: bigint | undefined = undefined;
  let redemptionRate: bigint | undefined = undefined;
  if (vaultData && vaultData.length !== 2) {
    throw new Error("Failed to fetch vault data");
  }
  if (vaultData) {
    tvl = vaultData[0].result;
    redemptionRate = vaultData[1].result;
  }

  const {
    data: userData,
    isLoading: isLoadingUserData,
    isError: isErrorUserData,
    refetch: refetchUserData,
  } = useReadContracts({
    query: {
      enabled: isConnected && !!address,
      refetchInterval: REFRESH_INTERVAL,
    },
    contracts: [
      {
        // balance of underlying token
        abi: erc20Abi,
        functionName: "balanceOf",
        address: tokenAddress as Address,
        args: address ? [address] : undefined,
      },
      {
        // balance of vault shares
        abi: valenceVaultABI,
        functionName: "balanceOf",
        address: vaultProxyAddress as Address,
        args: address ? [address] : undefined,
      },
      {
        // maximum shares redeemable
        abi: valenceVaultABI,
        functionName: "maxRedeem",
        address: vaultProxyAddress as Address,
        args: [address as Address],
      },
      {
        // requested a withdrawal
        abi: valenceVaultABI,
        functionName: "hasActiveWithdraw",
        address: vaultProxyAddress as Address,
        args: [address as Address],
      }, // withdrawal request if exists
      {
        abi: valenceVaultABI,
        functionName: "userWithdrawRequest",
        address: vaultProxyAddress as Address,
        args: [address as Address],
      },
    ],
  });
  let tokenBalance = undefined;
  let shareBalance = undefined;
  let maxRedeem = undefined;
  let hasActiveWithdraw = undefined;
  let userWithdrawRequest = undefined;

  let withdrawData = null;

  if (userData?.length && userData.length !== 5) {
    throw new Error("Failed to fetch user data");
  }
  if (userData) {
    tokenBalance = userData[0].result;
    shareBalance = userData[1].result;
    maxRedeem = userData[2].result;
    hasActiveWithdraw = userData[3].result;
    userWithdrawRequest = userData[4].result;

    if (userWithdrawRequest && userWithdrawRequest?.length === 7) {
      const [
        owner,
        _claimTime, // bigint
        maxLossBps,
        receiver,
        updateId,
        solverFee,
        sharesAmount,
      ] = userWithdrawRequest;

      const claimTime = formatBigIntToTimestamp(_claimTime) + 60 * 1000; // add 1 min in milliseconds

      // Calculate the time remaining
      const timeRemaining = formatRemainingTime(claimTime);

      withdrawData = {
        owner,
        timeRemaining,
        maxLossBps,
        receiver,
        updateId,
        solverFee,
        raw: {
          sharesAmount: sharesAmount,
          claimTime: claimTime,
        },
        formatted: {
          sharesAmount: sharesAmount
            ? formatBigInt(sharesAmount, shareDecimals, "shares", {
                displayDecimals: 2,
              })
            : "0",
          claimTime: claimTime
            ? unixTimestampToDateString(claimTime, "toLocaleString")
            : "N/A",
        },
      };
    }
  }

  const {
    data: withdrawAssetBalanceRaw,
    refetch: refetchWithdrawAssetBalance,
    isLoading: isLoadingWithdrawAssetBalance,
    isError: isWithdrawAssetBalanceError,
  } = useReadContract({
    query: {
      enabled: isConnected && !!address && !!withdrawData?.raw.sharesAmount,
      refetchInterval: REFRESH_INTERVAL,
    },
    abi: valenceVaultABI,
    functionName: "convertToAssets",
    address: vaultProxyAddress as Address,
    args: withdrawData?.raw.sharesAmount
      ? [withdrawData.raw.sharesAmount]
      : [BigInt(0)],
  });
  const withdrawAssetBalanceFormatted = formatBigInt(
    withdrawAssetBalanceRaw,
    tokenDecimals,
    symbol,
    {
      displayDecimals: 2,
    },
  );

  //  user's vault "position" (shares -> assets)
  // depends on user's share balance
  const {
    data: assetBalance,
    refetch: refetchAssetBalance,
    isLoading: isLoadingAssetBalance,
    isError: isAssetBalanceError,
  } = useReadContract({
    query: {
      enabled: isConnected && !!address && !!shareBalance,
      refetchInterval: REFRESH_INTERVAL,
    },
    abi: valenceVaultABI,
    functionName: "convertToAssets",
    address: vaultProxyAddress as Address,
    args: shareBalance ? [shareBalance] : [BigInt(0)],
  });

  // Query the strategist update info for the withdrawal request
  const {
    data: updateInfoRequest,
    refetch: refetchUpdateInfo,
    isLoading: isLoadingUpdateInfo,
    isError: isUpdateInfoError,
  } = useReadContract({
    query: {
      enabled: isConnected && !!address && !!withdrawData?.updateId,
      refetchInterval: REFRESH_INTERVAL,
    },
    abi: valenceVaultABI,
    functionName: "updateInfos",
    address: vaultProxyAddress as Address,
    args: [BigInt(withdrawData?.updateId ?? 0)],
  });
  let updateData = null;
  // extract values from response
  if (updateInfoRequest?.length === 3) {
    const [withdrawRate, timestamp, withdrawFee] = updateInfoRequest;

    updateData = {
      withdrawRate:
        shareDecimals && withdrawRate
          ? formatBigInt(withdrawRate, shareDecimals, "", {
              displayDecimals: 2,
            })
          : "0",
      timestamp: unixTimestampToDateString(formatBigIntToTimestamp(timestamp)),
      withdrawFee: withdrawFee.toString(),
    };
  }

  /**
   * Vault actions
   */

  //Deposit tokens into vault
  const depositWithAmount = async (amount: string) => {
    if (!vaultData) throw new Error("Failed to initiate deposit");
    if (!address) throw new Error("Not connected");
    if (!walletClient) throw new Error("Wallet not connected");
    if (!publicClient) throw new Error("Public client not initialized");

    try {
      const parsedAmount = parseUnits(amount, Number(tokenDecimals));

      // approve vault to spend tokens
      const { request: approveRequest } = await publicClient.simulateContract({
        address: tokenAddress as Address,
        account: address,
        abi: erc20Abi,
        functionName: "approve",
        args: [vaultProxyAddress as Address, parsedAmount],
      });

      const approveHash = await walletClient.writeContract(approveRequest);

      // Wait for approval to be mined
      await publicClient.waitForTransactionReceipt({
        hash: approveHash,
        timeout: transactionConfirmationTimeout,
      });

      // deposit tokens into vault
      const { request: depositRequest } = await publicClient.simulateContract({
        address: vaultProxyAddress as Address,
        abi: valenceVaultABI,
        functionName: "deposit",
        args: [parsedAmount, address],
        account: address,
      });

      const depositHash = await walletClient.writeContract(depositRequest);

      // Wait for deposit to be mined
      const receipt = await publicClient.waitForTransactionReceipt({
        hash: depositHash,
        timeout: transactionConfirmationTimeout,
      });

      if (receipt.status !== "success") {
        console.error("Transaction reciept:", receipt);
        throw new Error(`Transaction reciept status: ${receipt.status}`);
      }
      return depositHash;
    } catch (error) {
      handleAndThrowError(error, "Deposit failed");
    }
  };

  // Withdraw shares from vault. Withdraw will be "pending" until the user completes the withdrawal.
  const withdrawShares = async (
    shares: string,
    maxLossBps: number = 1000,
    allowSolverCompletion: boolean = false,
  ) => {
    if (!vaultData) throw new Error("Failed to initiate withdraw");
    if (!address) throw new Error("Not connected");
    if (!walletClient) throw new Error("Wallet not connected");
    if (!publicClient) throw new Error("Public client not initialized");

    // Validate share balance
    if (!shareBalance) throw new Error("No shares to withdraw");

    try {
      const parsedShares = parseUnits(shares, Number(shareDecimals));

      // approve the vault to spend vault shares (shares owned by user)
      const { request: approveRequest } = await publicClient.simulateContract({
        address: vaultProxyAddress as Address,
        account: address,
        abi: valenceVaultABI,
        functionName: "approve",
        args: [vaultProxyAddress as Address, parsedShares],
      });

      const approveHash = await walletClient.writeContract(approveRequest);

      // wait for approval to be mined
      await publicClient.waitForTransactionReceipt({
        hash: approveHash,
        timeout: transactionConfirmationTimeout,
      });

      // redeem shares for tokens
      const { request: redeemRequest } = await publicClient.simulateContract({
        account: address,
        address: vaultProxyAddress as Address,
        abi: valenceVaultABI,
        functionName: "redeem",
        args: [
          parsedShares,
          address,
          address,
          maxLossBps,
          allowSolverCompletion,
        ],
      });

      const redeemHash = await walletClient.writeContract(redeemRequest);

      // Wait for withdrawal to be mined
      const withdrawalReceipt = await publicClient.waitForTransactionReceipt({
        hash: redeemHash,
        timeout: transactionConfirmationTimeout,
      });

      if (withdrawalReceipt.status !== "success") {
        console.error("Transaction reciept:", withdrawalReceipt);
        throw new Error(
          `Transaction reciept status: ${withdrawalReceipt.status}`,
        );
      }

      return redeemHash;
    } catch (error) {
      handleAndThrowError(error, "Withdraw failed");
    }
  };

  // Complete a withdrawal. Can be executed after the lockup period has passed.
  const completeWithdraw = async () => {
    if (!vaultData) throw new Error("Failed to complete withdrawal");
    if (!address) throw new Error("Not connected");
    if (!walletClient) throw new Error("Wallet not connected");
    if (!publicClient) throw new Error("Public client not initialized");

    try {
      const { request } = await publicClient.simulateContract({
        address: vaultProxyAddress as Address,
        abi: valenceVaultABI,
        functionName: "completeWithdraw",
        args: [address],
        account: address,
      });

      // Execute the transaction
      const completeHash = await walletClient.writeContract(request);
      // Wait for transaction to be mined
      const receipt = await publicClient.waitForTransactionReceipt({
        hash: completeHash,
        timeout: transactionConfirmationTimeout,
      });

      if (receipt.status !== "success") {
        console.error("Transaction receipt:", receipt);
        throw new Error(`Transaction receipt status: ${receipt.status}`);
      }
      return completeHash;
    } catch (error) {
      handleAndThrowError(error, "Complete Withdraw failed");
    }
  };

  //Preview a deposit (tokens -> vault shares)
  const previewDeposit = async (amount: string) => {
    if (!vaultData) throw new Error("Failed to preview deposit");
    if (!address) throw new Error("Not connected");
    if (!walletClient) throw new Error("Wallet not connected");
    if (!publicClient) throw new Error("Public client not initialized");

    const parsedAmount = parseUnits(amount, Number(tokenDecimals));
    const previewAmount = await readContract(config, {
      abi: valenceVaultABI,
      functionName: "previewDeposit",
      address: vaultProxyAddress as Address,
      args: [parsedAmount],
    });

    return formatBigInt(previewAmount, shareDecimals, "shares", {
      displayDecimals: 4,
    });
  };

  // Preview a withdrawal (vault shares -> tokens)
  const previewRedeem = async (shares: string) => {
    if (!vaultData) throw new Error("Failed to preview redeem");
    if (!address) throw new Error("Not connected");
    if (!walletClient) throw new Error("Wallet not connected");
    if (!publicClient) throw new Error("Public client not initialized");

    const parsedShares = parseUnits(shares, Number(shareDecimals));
    const previewAmount = await readContract(config, {
      abi: valenceVaultABI,
      functionName: "previewRedeem",
      address: vaultProxyAddress as Address,
      args: [parsedShares],
    });

    return formatBigInt(previewAmount, tokenDecimals, symbol, {
      displayDecimals: 2,
    });
  };

  /***
   * Statuses
   */

  const now = new Date().getTime();

  const isLoading =
    isLoadingVaultData ||
    isLoadingUserData ||
    isLoadingAssetBalance ||
    isLoadingUpdateInfo ||
    isLoadingWithdrawAssetBalance;

  const isError =
    isErrorVaultData ||
    isErrorUserData ||
    isAssetBalanceError ||
    isUpdateInfoError ||
    isWithdrawAssetBalanceError;

  // Refetch all queries, useful after performing an action
  const refetchContractState = () => {
    refetchVaultData();
    refetchUserData();
    refetchAssetBalance();
    refetchUpdateInfo();
    refetchWithdrawAssetBalance();
  };

  return {
    depositWithAmount,
    withdrawShares,
    completeWithdraw,
    previewDeposit,
    previewRedeem,
    refetchContractState,
    pendingWithdrawal: {
      hasActiveWithdraw,
      ...withdrawData,
      ...updateData,
      withdrawAssetBalanceFormatted,
      isClaimable:
        updateData?.withdrawRate && withdrawData?.raw.claimTime
          ? now > withdrawData.raw.claimTime
          : false,
    },
    raw: {
      tvl,
      redemptionRate,
      tokenBalance,
      maxRedeem,
      shareBalance,
      assetBalance,
      tokenDecimals,
      shareDecimals,
    },
    formatted: {
      tvl: formatBigInt(tvl, tokenDecimals, symbol, {
        displayDecimals: 2,
      }),
      redemptionRate: formatBigInt(redemptionRate, shareDecimals, "%", {
        displayDecimals: 2,
      }),
      tokenBalance: formatBigInt(tokenBalance, tokenDecimals, symbol, {
        displayDecimals: 2,
      }),
      maxRedeem: formatBigInt(maxRedeem, shareDecimals, "shares", {
        displayDecimals: 2,
      }),
      shareBalance: formatBigInt(shareBalance, shareDecimals, "shares", {
        displayDecimals: 2,
      }),
      assetBalance: formatBigInt(assetBalance, tokenDecimals, symbol, {
        displayDecimals: 2,
      }),
      totalShareBalance: formatBigInt(
        (shareBalance ?? BigInt(0)) +
          (withdrawData?.raw.sharesAmount ?? BigInt(0)),
        shareDecimals,
        "shares",
        {
          displayDecimals: 2,
        },
      ),
      totalAssetBalance: formatBigInt(
        (assetBalance ?? BigInt(0)) + (withdrawAssetBalanceRaw ?? BigInt(0)),
        tokenDecimals,
        symbol,
        {
          displayDecimals: 2,
        },
      ),
    },
    isLoading,
    isError,
  };
}

/***
 * Resuable error handling function for contract operations
 * @param error - The error to handle
 * @param defaultMessage - The default message to throw
 */
const handleAndThrowError = (error: unknown, defaultMessage: string) => {
  console.error(defaultMessage, error);
  if (error instanceof BaseError) {
    // @ts-ignore
    // attempt to extract meaningful error message
    const errorName = error.cause?.data?.abiItem?.name;

    const errorMessage =
      errorName && typeof errorName === "string"
        ? `${errorName}. ${error.shortMessage}`
        : error.shortMessage;

    throw new Error(errorMessage);
  } else if (error instanceof Error) {
    throw new Error(error.message);
  } else {
    throw new Error(defaultMessage);
  }
};
