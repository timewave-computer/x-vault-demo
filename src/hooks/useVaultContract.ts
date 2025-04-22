import {
  useReadContract,
  useAccount,
  usePublicClient,
  useWalletClient,
  useConfig,
} from "wagmi";
import { parseUnits, formatUnits, erc20Abi, BaseError } from "viem";
import { type Address } from "viem";
import { valenceVaultABI } from "@/const";
import { VaultData } from "@/hooks";
import { formatBigInt, formatTimestampToUTC } from "@/lib";
import { readContract } from "@wagmi/core";

/**
 * Hook for interacting with an ERC-4626 vault contract
 * Provides functionality for:
 * - Reading token and share balances
 * - Converting between assets and shares
 * - Depositing assets and withdrawing shares
 * - Viewing pending withdrawals
 */
export function useVaultContract(vaultData?: VaultData) {
  const {
    vaultProxyAddress,
    tokenAddress,
    decimals,
    transactionConfirmationTimeout,
  } = vaultData ?? {};

  const { address } = useAccount();
  const publicClient = usePublicClient();
  const { data: walletClient } = useWalletClient();
  const config = useConfig();

  /***
   * Fetch underlying token information
   */

  // Query user's token balance
  const {
    data: tokenBalance,
    refetch: refetchTokenBalance,
    isLoading: isLoadingTokenBalance,
    isError: isTokenBalanceError,
  } = useReadContract({
    abi: erc20Abi,
    functionName: "balanceOf",
    address: tokenAddress as Address,
    args: address ? [address] : undefined,
  });

  // Query user's token balance
  const {
    data: tokenDecimals,
    isLoading: isLoadingTokenDecimals,
    isError: isTokenDecimalsError,
  } = useReadContract({
    abi: erc20Abi,
    functionName: "decimals",
    address: tokenAddress as Address,
  });

  /***
   * Fetch general vault information
   */

  // Query vault total assets
  const {
    data: tvl,
    refetch: refetchTvl,
    isLoading: isLoadingTvl,
    isError: isTvlError,
  } = useReadContract({
    abi: valenceVaultABI,
    functionName: "totalAssets",
    address: vaultProxyAddress as Address,
  });

  // Query vault total assets
  const {
    data: redemptionRate,
    refetch: refetchRedemptionRate,
    isLoading: isLoadingRedemptionRate,
    isError: isRedemptionRateError,
  } = useReadContract({
    abi: valenceVaultABI,
    functionName: "redemptionRate",
    address: vaultProxyAddress as Address,
  });

  /***
   * Query user specific vault information
   */

  // Query user's vault share balance
  const {
    data: shareBalance,
    refetch: refetchShareBalance,
    isLoading: isLoadingShareBalance,
    isError: isShareBalanceError,
  } = useReadContract({
    abi: valenceVaultABI,
    functionName: "balanceOf",
    address: vaultProxyAddress as Address,
    args: address ? [address] : undefined,
  });

  // Query user's vault "position" (shares -> assets)
  const {
    data: assetBalance,
    refetch: refetchAssetBalance,
    isLoading: isLoadingAssetBalance,
    isError: isAssetBalanceError,
  } = useReadContract({
    abi: valenceVaultABI,
    functionName: "convertToAssets",
    address: vaultProxyAddress as Address,
    args: shareBalance ? [shareBalance] : undefined,
  });

  // Query maximum redeemable shares
  const {
    data: maxRedeem,
    refetch: refetchMaxRedeem,
    isLoading: isLoadingMaxRedeem,
    isError: isMaxRedeemError,
  } = useReadContract({
    abi: valenceVaultABI,
    functionName: "maxRedeem",
    address: vaultProxyAddress as Address,
    args: [address as Address],
  });

  const {
    data: hasActiveWithdraw,
    refetch: refetchHasActiveWithdraw,
    isLoading: isLoadingHasActiveWithdraw,
    isError: isHasActiveWithdrawError,
  } = useReadContract({
    abi: valenceVaultABI,
    functionName: "hasActiveWithdraw",
    address: vaultProxyAddress as Address,
    args: [address as Address],
  });

  // Query user's pending withdrawal request (if any exist)
  const {
    data: withdrawRequest,
    refetch: refetchWithdrawRequest,
    isLoading: isLoadingWithdrawRequest,
    isError: isWithdrawRequestError,
  } = useReadContract({
    abi: valenceVaultABI,
    functionName: "userWithdrawRequest",
    address: vaultProxyAddress as Address,
    args: [address as Address],
  });
  withdrawRequest;
  let withdrawData = null;
  if (withdrawRequest?.length === 7) {
    const [
      owner,
      claimTime,
      maxLossBps,
      receiver,
      updateId,
      solverFee,
      sharesAmount,
    ] = withdrawRequest;
    withdrawData = {
      owner,
      claimTime: claimTime ? formatTimestampToUTC(claimTime) : "N/A",
      maxLossBps,
      receiver,
      updateId,
      solverFee,
      sharesAmount:
        decimals && sharesAmount
          ? formatUnits(sharesAmount ?? BigInt(0), decimals)
          : "0",
    };
  }

  // Query the strategist update info for the withdrawal request
  const {
    data: updateInfoRequest,
    refetch: refetchUpdateInfo,
    isLoading: isLoadingUpdateInfo,
    isError: isUpdateInfoError,
  } = useReadContract({
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
        decimals && withdrawRate ? formatUnits(withdrawRate, decimals) : "0",
      timestamp: formatTimestampToUTC(timestamp),
      withdrawFee: withdrawFee.toString(),
    };
  }

  const isLoading =
    isLoadingTokenBalance ||
    isLoadingTokenDecimals ||
    isLoadingTvl ||
    isLoadingRedemptionRate ||
    isLoadingShareBalance ||
    isLoadingAssetBalance ||
    isLoadingMaxRedeem ||
    isLoadingHasActiveWithdraw ||
    isLoadingWithdrawRequest ||
    isLoadingUpdateInfo;

  const isError =
    isTokenBalanceError ||
    isTokenDecimalsError ||
    isTvlError ||
    isRedemptionRateError ||
    isShareBalanceError ||
    isAssetBalanceError ||
    isMaxRedeemError ||
    isHasActiveWithdrawError ||
    isWithdrawRequestError ||
    isUpdateInfoError;

  /***
   * Vault actions
   */

  //Deposit tokens into vault
  const depositWithAmount = async (amount: string) => {
    if (!vaultData) throw new Error("Failed to initiate deposit");
    if (!address) throw new Error("Not connected");
    if (!walletClient) throw new Error("Wallet not connected");
    if (!publicClient) throw new Error("Public client not initialized");

    try {
      const parsedAmount = parseUnits(amount, Number(decimals));

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

  //Withdraw shares from vault. Withdraw will be "pending" until the user completes the withdrawal.
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
      const parsedShares = parseUnits(shares, Number(decimals));

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

    const parsedAmount = parseUnits(amount, Number(decimals));
    const previewAmount = await readContract(config, {
      abi: valenceVaultABI,
      functionName: "previewDeposit",
      address: vaultProxyAddress as Address,
      args: [parsedAmount],
    });

    return formatBigInt(previewAmount, vaultData.decimals, "shares", {
      displayDecimals: 4,
    });
  };

  // Preview a withdrawal (vault shares -> tokens)
  const previewRedeem = async (shares: string) => {
    if (!vaultData) throw new Error("Failed to preview redeem");
    if (!address) throw new Error("Not connected");
    if (!walletClient) throw new Error("Wallet not connected");
    if (!publicClient) throw new Error("Public client not initialized");

    const parsedShares = parseUnits(shares, Number(decimals));
    const previewAmount = await readContract(config, {
      abi: valenceVaultABI,
      functionName: "previewRedeem",
      address: vaultProxyAddress as Address,
      args: [parsedShares],
    });

    return formatBigInt(previewAmount, vaultData.decimals, vaultData.token, {
      displayDecimals: 4,
    });
  };

  //Refetch all queries, useful after performing an action
  const refetchContractState = () => {
    refetchWithdrawRequest();
    refetchUpdateInfo();
    refetchTokenBalance();
    refetchShareBalance();
    refetchHasActiveWithdraw();
    refetchMaxRedeem();
    refetchAssetBalance();
    refetchTvl();
    refetchRedemptionRate();
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
    },
    tvl: tvl && decimals ? parseFloat(formatUnits(tvl, decimals)) : 0,
    redemptionRate:
      redemptionRate && decimals
        ? parseFloat(formatUnits(redemptionRate, decimals))
        : 0,
    tokenBalance:
      tokenBalance && tokenDecimals
        ? parseFloat(formatUnits(tokenBalance, tokenDecimals))
        : 0,
    maxRedeem:
      maxRedeem && decimals ? parseFloat(formatUnits(maxRedeem, decimals)) : 0,
    shareBalance:
      shareBalance && decimals
        ? parseFloat(formatUnits(shareBalance ?? BigInt(0), decimals))
        : 0,
    assetBalance:
      assetBalance && decimals
        ? parseFloat(formatUnits(assetBalance ?? BigInt(0), decimals))
        : 0,
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
