"use client";

import { useState, useEffect, useCallback } from "react";
import { useAccount, useConfig } from "wagmi";
import {
  type VaultMetadata,
  defaultChainId,
  getVaultsMetadata,
} from "@/config";
import { QUERY_KEYS, valenceVaultABI } from "@/const";
import { readContract } from "@wagmi/core";
import { erc20Abi } from "viem";
import { formatBigInt } from "@/lib";
import { useQueries } from "@tanstack/react-query";

export type VaultData = VaultMetadata & {
  decimals: number;
  raw: {
    totalShares: bigint;
    userShares: bigint;
    userPosition: bigint;
    tvl: bigint;
    redemptionRate: bigint;
  };
  formatted: {
    totalShares: string;
    userShares: string;
    userPosition: string;
    tvl: string;
    redemptionRate: string;
  };
};

export function useViewAllVaults() {
  const { address, chainId: accountChainId } = useAccount();
  const [vaultsMetadata, setVaultsMetadata] = useState<VaultMetadata[]>([]);
  const [chainId, setChainId] = useState<number | null>(null);
  const config = useConfig();

  useEffect(() => {
    // client may have different chain ID than what is server rendered. Need to set with effect to avoid hydration error
    setChainId(accountChainId || defaultChainId);
  }, [accountChainId]);

  useEffect(() => {
    if (!chainId) return;
    const vaultsMetadata = getVaultsMetadata(chainId);
    setVaultsMetadata(vaultsMetadata);
  }, [chainId]);

  // fetches vault data for a single vault
  const fetchVaultData = useCallback(
    async (vault: VaultMetadata) => {
      const decimals = await readContract(config, {
        abi: erc20Abi,
        address: vault.tokenAddress,
        functionName: "decimals",
        args: [],
      });

      const tvl = await readContract(config, {
        abi: valenceVaultABI,
        address: vault.vaultProxyAddress,
        functionName: "totalAssets",
        args: [],
      });

      const totalShares = await readContract(config, {
        abi: valenceVaultABI,
        address: vault.vaultProxyAddress,
        functionName: "totalSupply",
        args: [],
      });

      const redemptionRate = await readContract(config, {
        abi: valenceVaultABI,
        address: vault.vaultProxyAddress,
        functionName: "redemptionRate",
        args: [],
      });

      let userShares = BigInt(0),
        userPosition = BigInt(0);
      if (address) {
        userShares = await readContract(config, {
          abi: valenceVaultABI,
          address: vault.vaultProxyAddress,
          functionName: "balanceOf",
          args: [address as `0x${string}`],
        });

        userPosition = await readContract(config, {
          abi: valenceVaultABI,
          address: vault.vaultProxyAddress,
          functionName: "convertToAssets",
          args: [userShares],
        });
      }

      const result: VaultData = {
        decimals: Number(decimals),
        ...vault,
        raw: {
          totalShares: totalShares,
          tvl: tvl,
          userShares: userShares,
          userPosition: userPosition,
          redemptionRate: redemptionRate,
        },
        formatted: {
          totalShares: formatBigInt(totalShares, decimals, "shares", {
            displayDecimals: 4,
          }),
          tvl: formatBigInt(tvl, decimals, vault.token, {
            displayDecimals: 4,
          }),
          userShares: formatBigInt(userShares, decimals, "shares", {
            displayDecimals: 4,
          }),
          userPosition: formatBigInt(userPosition, decimals, vault.token, {
            displayDecimals: 4,
          }),
          redemptionRate: formatBigInt(redemptionRate, decimals, "%", {
            displayDecimals: 2,
          }),
        },
      };
      return result;
    },
    [config, address],
  );

  const {
    data: vaults,
    isLoading,
    isError,
  } = useQueries({
    queries: vaultsMetadata.map((vaultMetadata) => ({
      enabled: !!vaultMetadata,
      queryKey: [QUERY_KEYS.VAULT_DATA, vaultMetadata.id, address],
      queryFn: async () => {
        return fetchVaultData(vaultMetadata);
      },
    })),
    combine: (results) => {
      return {
        data: results
          .flatMap((result) => result.data)
          .filter((data) => data !== undefined),
        isLoading: results.some((result) => result.isLoading),
        isError: results.some((result) => result.isError),
        error: results.map((result) => result.error),
      };
    },
  });

  return {
    isLoading: isLoading,
    isPending: !chainId, // need to wait to chainId to be set in client to trigger fetch
    isError,
    vaults,
    chainId,
  };
}
