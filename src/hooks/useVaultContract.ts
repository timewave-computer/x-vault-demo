import {
  useReadContract,
  useAccount,
  usePublicClient,
  useWalletClient,
  useConfig,
  useReadContracts,
} from "wagmi";
import { parseUnits, erc20Abi, BaseError } from "viem";
import { type Address } from "viem";
import { valenceVaultABI } from "@/const";
import { formatBigInt, parseWithdrawRequest } from "@/lib";
import { readContract } from "@wagmi/core";
import { useConvertToAssets } from "@/hooks";

const REFRESH_INTERVAL = 5000;

/**
 * Hook for interacting with an ERC-4626 vault contract
 * Provides functionality for:
 * - Reading token and share balances
 * - Converting between assets and shares
 * - Depositing assets and withdrawing shares
 * - Viewing pending withdrawals
 */

interface UseVaultContractProps {
  vaultMetadata?: {
    vaultProxyAddress: `0x${string}`;
    tokenAddress: `0x${string}`;
    tokenDecimals: number;
    shareDecimals: number;
    transactionConfirmationTimeout: number;
    token: string;
  };
}

export function useVaultContract(
  props: UseVaultContractProps,
): UseVaultContractReturnValue {
  const { vaultMetadata } = props;

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
  const now = new Date().getTime();

  const vaultMetadataQuery = useReadContracts({
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

  const tvl = vaultMetadataQuery.data?.[0]?.result;
  const redemptionRate = vaultMetadataQuery.data?.[1]?.result;

  const userDataQuery = useReadContracts({
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

  const shareBalance = userDataQuery.data?.[1]?.result;
  const maxRedeemableShares = userDataQuery.data?.[2]?.result;
  const hasActiveWithdraw = userDataQuery.data?.[3]?.result;
  const _userWithdrawRequest = userDataQuery.data?.[4]?.result;

  const userWithdrawRequest = parseWithdrawRequest(_userWithdrawRequest);

  // Convert user's share balance to assets
  const convertShareBalanceQuery = useConvertToAssets({
    vaultProxyAddress: vaultProxyAddress as Address,
    shares: shareBalance,
    refetchInterval: REFRESH_INTERVAL,
    enabled: isConnected && !!address && !!shareBalance,
  });

  const userAssetAmount = convertShareBalanceQuery.data;

  // Convert withdraw shares to assets
  const convertWithdrawSharesQuery = useConvertToAssets({
    vaultProxyAddress: vaultProxyAddress as Address,
    shares: userWithdrawRequest?.withdrawSharesAmount,
    refetchInterval: REFRESH_INTERVAL,
    enabled:
      isConnected && !!address && !!userWithdrawRequest?.withdrawSharesAmount,
  });
  const convertedWithdrawAssetAmount = convertWithdrawSharesQuery.data;

  // Query the strategist update info for the withdrawal request
  const strategistUpdateInfoQuery = useReadContract({
    query: {
      enabled: isConnected && !!address && !!userWithdrawRequest?.updateId,
      refetchInterval: REFRESH_INTERVAL,
    },
    abi: valenceVaultABI,
    functionName: "updateInfos",
    address: vaultProxyAddress as Address,
    args: [BigInt(userWithdrawRequest?.updateId ?? 0)],
  });
  const withdrawRate = strategistUpdateInfoQuery.data?.[0];
  const strategistUpdateTimestamp = strategistUpdateInfoQuery.data?.[1];
  const withdrawFee = strategistUpdateInfoQuery.data?.[2];

  const isWithdrawClaimable =
    withdrawRate &&
    userWithdrawRequest?.claimableAtTimestamp &&
    strategistUpdateTimestamp
      ? now > userWithdrawRequest.claimableAtTimestamp
      : false;

  /**
   *  Vault queries
   */

  //Preview a deposit (tokens -> vault shares)
  const previewDeposit = async (amount: string) => {
    if (!vaultMetadata) throw new Error("Failed to preview deposit");
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

    return formatBigInt(previewAmount, shareDecimals);
  };

  // Preview a withdrawal (vault shares -> tokens)
  const previewRedeem = async (shares: string) => {
    if (!vaultMetadata) throw new Error("Failed to preview redeem");
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

    return formatBigInt(previewAmount, tokenDecimals);
  };

  /**
   * Vault actions
   */

  //Deposit tokens into vault
  const depositWithAmount = async (amount: string) => {
    if (!vaultMetadata) throw new Error("Failed to initiate deposit");
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
    if (!vaultMetadata) throw new Error("Failed to initiate withdraw");
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
    if (!vaultMetadata) throw new Error("Failed to complete withdrawal");
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

  // Refetch all data. Nice utility to use after performing an action
  const refetch = () => {
    vaultMetadataQuery.refetch();
    userDataQuery.refetch();
    convertWithdrawSharesQuery.refetch();
    convertShareBalanceQuery.refetch();
    strategistUpdateInfoQuery.refetch();
  };

  // statuses

  const isLoading =
    vaultMetadataQuery.isLoading ||
    userDataQuery.isLoading ||
    convertWithdrawSharesQuery.isLoading ||
    convertShareBalanceQuery.isLoading ||
    strategistUpdateInfoQuery.isLoading;

  const isError =
    vaultMetadataQuery.isError ||
    userDataQuery.isError ||
    convertWithdrawSharesQuery.isError ||
    convertShareBalanceQuery.isError ||
    strategistUpdateInfoQuery.isError;

  // for better UX, include assets in withdraw as part of the balance
  const syntheticShareBalance =
    (shareBalance ?? BigInt(0)) +
    (userWithdrawRequest?.withdrawSharesAmount ?? BigInt(0));
  const syntheticAssetBalance =
    (userAssetAmount ?? BigInt(0)) +
    (convertedWithdrawAssetAmount ?? BigInt(0));

  const pendingWithdraw = userWithdrawRequest
    ? {
        withdrawSharesAmount: formatBigInt(
          userWithdrawRequest.withdrawSharesAmount,
          shareDecimals,
        ),
        withdrawAssetAmount: formatBigInt(
          convertedWithdrawAssetAmount,
          tokenDecimals,
        ),

        // withdraw info
        owner: userWithdrawRequest.owner,
        timeRemaining: userWithdrawRequest.timeRemaining,
        maxLossBps: userWithdrawRequest.maxLossBps,
        receiver: userWithdrawRequest.receiver,
        updateId: userWithdrawRequest.updateId,

        solverFee: formatBigInt(userWithdrawRequest.solverFee, shareDecimals),

        claimableAtTimestamp: userWithdrawRequest.claimableAtTimestamp,
        // update info
        withdrawFee: withdrawFee,
        withdrawRate: formatBigInt(withdrawRate, shareDecimals),
        hasActiveWithdraw: hasActiveWithdraw ?? false,
        isClaimable: isWithdrawClaimable,
      }
    : undefined;

  return {
    isLoading,
    isError,
    refetch,
    depositWithAmount,
    withdrawShares,
    completeWithdraw,
    previewDeposit,
    previewRedeem,
    tokenDecimals,
    shareDecimals,
    data: {
      tvl: formatBigInt(tvl, tokenDecimals),
      redemptionRate: formatBigInt(redemptionRate, shareDecimals),
      maxRedeemableShares: formatBigInt(maxRedeemableShares, shareDecimals),
      shareBalance: formatBigInt(syntheticShareBalance, shareDecimals),
      assetBalance: formatBigInt(syntheticAssetBalance, tokenDecimals),
      pendingWithdraw,
    },
  };
}

interface UseVaultContractReturnValue {
  isLoading: boolean;
  isError: boolean;
  refetch: () => void;
  depositWithAmount: (amount: string) => Promise<`0x${string}` | undefined>;
  withdrawShares: (
    shares: string,
    maxLossBps?: number,
    allowSolverCompletion?: boolean,
  ) => Promise<`0x${string}` | undefined>;
  completeWithdraw: () => Promise<`0x${string}` | undefined>;
  previewDeposit: (amount: string) => Promise<string>;
  previewRedeem: (shares: string) => Promise<string>;
  tokenDecimals: number;
  shareDecimals: number;
  data: {
    tvl?: string;
    redemptionRate?: string;
    maxRedeemableShares?: string;
    shareBalance: string;
    assetBalance: string;
    pendingWithdraw?: {
      hasActiveWithdraw: boolean;
      withdrawFee?: number;
      withdrawRate?: string;
      withdrawAssetAmount: string;
      isClaimable?: boolean;
      owner?: Address;
      timeRemaining?: string | null;
      maxLossBps?: number;
      receiver?: Address;
      updateId?: number;
      solverFee?: string;
      withdrawSharesAmount?: string;
      claimableAtTimestamp?: number | null;
    };
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
