import { useReadContract } from "wagmi";
import { valenceVaultABI } from "@/const";
import { type Address } from "viem";

const REFRESH_INTERVAL = 5000;

interface UseConvertToAssetsProps {
  vaultProxyAddress: Address;
  shares: bigint | undefined;
  enabled?: boolean;
  refetchInterval?: number;
}

export function useConvertToAssets({
  vaultProxyAddress,
  shares,
  enabled = true,
  refetchInterval = REFRESH_INTERVAL,
}: UseConvertToAssetsProps) {
  return useReadContract({
    query: {
      enabled,
      refetchInterval,
    },
    abi: valenceVaultABI,
    functionName: "convertToAssets",
    address: vaultProxyAddress,
    args: shares ? [shares] : [BigInt(0)],
  });
}
