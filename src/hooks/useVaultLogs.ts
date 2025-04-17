import { useConfig } from "wagmi";
import { formatUnits } from "viem";
import { usePublicClient } from "wagmi";
import { VaultData } from "@/hooks";
import { Address } from "viem";
import { valenceVaultABI } from "@/const";
import { readContract } from "wagmi/actions";
import { formatTimestampToUTC } from "@/lib";

export function useVaultLogs(vaultData?: VaultData) {
  const {
    vaultProxyAddress,
    decimals,
    startBlock: vaultStartBlock,
  } = vaultData ?? {};
  const publicClient = usePublicClient();

  const config = useConfig();
  /**
   * Retrieves pending withdrawals for the current user from the vault
   * @returns An array of pending withdrawal objects with details
   */
  const getLogs = async () => {
    if (!vaultProxyAddress) throw new Error("Vault address not provided");
    if (!publicClient) throw new Error("Public client not initialized");

    try {
      const processedUpdates = await publicClient.getLogs({
        address: vaultProxyAddress as Address,
        event: {
          type: "event",
          name: "UpdateProcessed",
          inputs: [
            { type: "uint256", name: "updateId", indexed: true },
            { type: "uint256", name: "withdrawRate", indexed: false },
            { type: "uint256", name: "totalAssetsToWithdraw", indexed: false },
          ],
        },
        fromBlock: vaultStartBlock,
        toBlock: "latest",
      });

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
        fromBlock: vaultStartBlock,
        toBlock: "latest",
      });
      // Process the logs to extract withdrawal information
      const withdrawRequests = await Promise.all(
        logs.map(async (log) => {
          const { shares, maxLossBps, solverEnabled, updateId, owner } =
            log.args as {
              shares: bigint;
              maxLossBps: bigint;
              solverEnabled: boolean;
              updateId: bigint;
              owner: Address;
            };

          const formattedShares = formatUnits(shares, decimals ?? 18);
          const formattedMaxLossBps = Number(maxLossBps).toString();

          const updateInfos = await readContract(config, {
            abi: valenceVaultABI,
            address: vaultProxyAddress,
            functionName: "updateInfos",
            args: [BigInt(updateId)],
          });
          const [withdrawRate, timestamp, withdrawFee] = updateInfos ?? [];

          const userWithdrawRequest = await readContract(config, {
            abi: valenceVaultABI,
            address: vaultProxyAddress,
            functionName: "userWithdrawRequest",
            args: [owner],
          });
          const [_, claimTime] = userWithdrawRequest ?? [];

          return {
            shares: formattedShares,
            maxLossBps: formattedMaxLossBps,
            solverEnabled,
            updateId: Number(updateId),
            owner: log.args.owner,
            receiver: log.args.receiver,
            transactionHash: log.transactionHash,
            blockNumber: log.blockNumber,
            withdrawRate: formatUnits(withdrawRate, decimals ?? 18),
            updateTimestamp: timestamp
              ? formatTimestampToUTC(timestamp)
              : "N/A",
            withdrawFee,
            claimTime: claimTime ? formatTimestampToUTC(claimTime) : "N/A",
          };
        }),
      );

      return { withdrawRequests, processedUpdates };
    } catch (error) {
      console.error("Failed to fetch pending withdrawals:", error);
      throw new Error("Failed to fetch pending withdrawals");
    }
  };

  return {
    getLogs,
  };
}
