import {
  useReadContract,
  useAccount,
  usePublicClient,
  useWalletClient,
} from "wagmi";
import { parseUnits, formatUnits, erc20Abi, BaseError } from "viem";
import { type Address } from "viem";
import { valenceVaultABI } from "@/const";
import { VaultData } from "./useVaultData";

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

  // Query user's token balance
  const { data: balance } = useReadContract({
    abi: erc20Abi,
    functionName: "balanceOf",
    address: tokenAddress as Address,
    args: address ? [address] : undefined,
  });

  // Query user's vault share balance
  const { data: shareBalance } = useReadContract({
    abi: valenceVaultABI,
    functionName: "balanceOf",
    address: vaultProxyAddress as Address,
    args: address ? [address] : undefined,
  }) as { data: bigint | undefined };

  // Query maximum withdrawable amount
  const { data: maxWithdraw } = useReadContract({
    abi: valenceVaultABI,
    functionName: "maxWithdraw",
    address: vaultProxyAddress as Address,
    args: [address],
  }) as { data: bigint | undefined };

  const depositWithAmount = async (amount: string) => {
    if (!vaultData) throw new Error("Failed to initiate deposit");
    if (!address) throw new Error("Not connected");
    if (!walletClient) throw new Error("Wallet not connected");
    if (!publicClient) throw new Error("Public client not initialized");

    try {
      const parsedAmount = parseUnits(amount, Number(decimals));

      const { request: approveRequest } = await publicClient.simulateContract({
        address: tokenAddress as Address,
        account: address,
        abi: erc20Abi,
        functionName: "approve",
        args: [vaultProxyAddress as Address, parsedAmount],
      });

      // First approve the vault to spend tokens
      const approveHash = await walletClient.writeContract(approveRequest);

      // Wait for approval to be mined
      await publicClient.waitForTransactionReceipt({
        hash: approveHash,
        timeout: transactionConfirmationTimeout,
      });

      const { request: depositRequest } = await publicClient.simulateContract({
        address: vaultProxyAddress as Address,
        abi: valenceVaultABI,
        functionName: "deposit",
        args: [parsedAmount, address],
        account: address,
      });

      // Then deposit into the vault
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

      // First approve the vault to spend shares
      const { request: approveRequest } = await publicClient.simulateContract({
        address: vaultProxyAddress as Address,
        account: address,
        abi: valenceVaultABI,
        functionName: "approve",
        args: [vaultProxyAddress as Address, parsedShares],
      });

      const approveHash = await walletClient.writeContract(approveRequest);

      await publicClient.waitForTransactionReceipt({
        hash: approveHash,
        timeout: transactionConfirmationTimeout,
      });

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

      // Wait for withdrawal to be mined with timeout
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

  /**
   * Retrieves pending withdrawals for the current user from the vault
   * @returns An array of pending withdrawal objects with details
   */
  const getPendingWithdrawals = async () => {
    if (!address || !publicClient) throw new Error("Not connected");
    if (!vaultProxyAddress) throw new Error("Vault address not provided");

    try {
      // Get the current block number
      const currentBlock = await publicClient.getBlockNumber();

      // Look back 30 days (approximately 172,800 blocks on Ethereum)
      const _fromBlock = Math.max(Number(currentBlock) - 172800, 0);

      // Convert to number, subtract, then back to BigInt
      const fromBlock = BigInt(_fromBlock);

      // Get logs for Withdraw events
      const logs = await publicClient.getLogs({
        address: vaultProxyAddress as Address,
        event: {
          type: "event",
          name: "WithdrawRequested",
          inputs: [
            { type: "address", name: "owner", indexed: true },
            { type: "address", name: "receiver", indexed: true },
            { type: "uint256", name: "shares", indexed: false },
            { type: "uint256", name: "maxLossBps", indexed: false },
            { type: "bool", name: "solverEnabled", indexed: false },
            { type: "uint64", name: "updateId", indexed: false },
          ],
        },
        fromBlock,
        toBlock: "latest",
        args: {
          owner: address,
        },
      });

      // Process the logs to extract withdrawal information
      const pendingWithdrawals = logs.map((log) => {
        const { shares, maxLossBps, solverEnabled, updateId } = log.args as {
          shares: bigint;
          maxLossBps: bigint;
          solverEnabled: boolean;
          updateId: bigint;
        };
        const formattedShares = Number(
          formatUnits(shares, Number(decimals ?? 18)),
        ).toFixed(4);
        const formattedMaxLossBps = Number(maxLossBps).toString();

        return {
          shares: formattedShares,
          maxLossBps: formattedMaxLossBps,
          solverEnabled,
          updateId: Number(updateId),
          owner: log.args.owner,
          receiver: log.args.receiver,
          transactionHash: log.transactionHash,
          blockNumber: log.blockNumber,
        };
      });

      return pendingWithdrawals;
    } catch (error) {
      console.error("Failed to fetch pending withdrawals:", error);
      throw new Error("Failed to fetch pending withdrawals");
    }
  };

  /**
   * Completes a withdrawal for the current user
   * @returns Transaction hash
   */
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
        args: [BigInt(0), address, address],
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

  return {
    depositWithAmount,
    withdrawShares,
    getPendingWithdrawals,
    completeWithdraw,
    maxWithdraw: maxWithdraw
      ? Number(formatUnits(maxWithdraw, Number(decimals ?? 18))).toFixed(4)
      : "0",
    balance: balance
      ? Number(formatUnits(balance, Number(decimals ?? 18))).toFixed(4)
      : "0",
    shareBalance: shareBalance
      ? Number(formatUnits(shareBalance, Number(decimals ?? 18))).toFixed(4)
      : undefined,
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
