import {
  useReadContract,
  useAccount,
  usePublicClient,
  useWalletClient,
} from "wagmi";
import {
  parseUnits,
  formatUnits,
  erc20Abi,
  ContractFunctionRevertedError,
  ContractFunctionExecutionError,
  BaseError,
  maxUint256,
  WaitForTransactionReceiptTimeoutError,
} from "viem";
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
  const { vaultProxyAddress, tokenAddress, decimals } = vaultData ?? {};
  const { address } = useAccount();
  const publicClient = usePublicClient();
  const { data: walletClient } = useWalletClient();

  // Query token decimals for formatting
  const { data: decimals } = useReadContract({
    abi: erc20Abi,
    functionName: "decimals",
    address: tokenAddress as Address,
  });

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
  });

  // Query maximum withdrawable amount
  const { data: maxWithdraw } = useReadContract({
    abi: valenceVaultABI,
    functionName: "maxWithdraw",
    address: vaultProxyAddress as Address,
    args: address ? [address] : undefined,
  });

  const depositWithAmount = async (amount: string) => {
    if (!address) throw new Error("Not connected");
    if (!walletClient) throw new Error("Wallet not connected");
    if (!publicClient) throw new Error("Public client not initialized");

    const parsedAmount = parseUnits(amount, Number(decimals));

    console.log("parsedAmount", parsedAmount);

    try {
      // First approve the vault to spend tokens
      const approveHash = await walletClient.writeContract({
        address: tokenAddress as Address,
        abi: valenceVaultABI,
        functionName: "approve",
        args: [vaultProxyAddress as Address, parsedAmount],
      });

      console.log("silmulating", approveHash);

      try {
        await publicClient.simulateContract({
          address: vaultProxyAddress as Address,
          abi: valenceVaultABI,
          functionName: "deposit",
          args: [parsedAmount, address],
          account: address,
        });
      } catch (err) {
        if (
          err instanceof ContractFunctionRevertedError ||
          err instanceof ContractFunctionExecutionError ||
          err instanceof WaitForTransactionReceiptTimeoutError
        ) {
          throw new Error(err.shortMessage);
        } else if (err instanceof BaseError) {
          throw new Error(err.shortMessage);
        } else {
          throw new Error(
            `Transaction simulation failed. ${JSON.stringify(err)}`,
          );
        }
      }

      console.log("waiting for approval", approveHash);
      // Wait for approval to be mined
      await publicClient.waitForTransactionReceipt({
        hash: approveHash,
        timeout: 30000, // 30 second timeout
      });

      // Then deposit into the vault
      const depositHash = await walletClient.writeContract({
        address: vaultProxyAddress as Address,
        abi: valenceVaultABI,
        functionName: "deposit",
        args: [parsedAmount, address],
      });

      // Wait for deposit to be mined
      const receipt = await publicClient.waitForTransactionReceipt({
        hash: depositHash,
        timeout: 60000, // 60 second timeout
      });

      if (receipt.status !== "success") {
        console.error("Transaction reciept:", receipt);
        throw new Error(`Transaction reciept status: ${receipt.status}`);
      }
      return depositHash;
    } catch (error) {
      console.error("Transaction failed:", error);
      if (
        error instanceof ContractFunctionExecutionError ||
        error instanceof WaitForTransactionReceiptTimeoutError
      ) {
        throw new Error(error.details);
      } else if (error instanceof Error) {
        throw new Error(error.message);
      } else {
        throw new Error("Transaction failed");
      }
    }
  };

  const withdrawShares = async (
    shares: string,
    maxLossBps: number = 1000,
    allowSolverCompletion: boolean = true,
  ) => {
    if (!address || !decimals) throw new Error("Not connected");
    if (!walletClient) throw new Error("Wallet not connected");
    if (!publicClient) throw new Error("Public client not initialized");

    // Validate share balance
    if (!shareBalance) throw new Error("No shares to withdraw");

    const parsedShares = parseUnits(shares, Number(decimals));

    // First approve the vault to spend shares
    const approveHash = await walletClient.writeContract({
      address: vaultProxyAddress as Address,
      abi: erc20Abi,
      functionName: "approve",
      args: [vaultProxyAddress as Address, maxUint256],
    });

    // Wait for approval to be mined with timeout
    await publicClient.waitForTransactionReceipt({
      hash: approveHash,
      timeout: 60000, // 60 second timeout
    });

    console.log("simulating redeem", parsedShares);

    try {
      // Check the ABI to ensure we're using the correct function signature
      // If the ABI only accepts 3 parameters, we need to adjust our call
      await publicClient.simulateContract({
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
    } catch (err) {
      console.log("simulate error", err);
      if (
        err instanceof ContractFunctionRevertedError ||
        err instanceof ContractFunctionExecutionError
      ) {
        throw new Error(err.shortMessage);
      }
    }

    console.log("executing redeem");
    try {
      const hash = await walletClient.writeContract({
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

      // Wait for withdrawal to be mined with timeout
      const receipt = await publicClient.waitForTransactionReceipt({
        hash,
        timeout: 60000, // 60 second timeout
      });
      console.log("receipt", receipt);

      return hash;
    } catch (error) {
      if (error instanceof ContractFunctionExecutionError) {
        throw new Error(error.details);
      } else if (error instanceof Error) {
        throw new Error(error.message);
      } else {
        console.error("Transaction failed:", error);
        throw new Error("Transaction failed");
      }
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

  return {
    depositWithAmount,
    withdrawShares,
    getPendingWithdrawals,
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
