"use client";

import { useState, useEffect, useCallback } from "react";
import { useAccount, useConfig } from "wagmi";
import {
  type VaultMetadata,
  defaultChainId,
  getVaultsMetadata,
} from "@/config";
import { QUERY_KEYS, valenceVaultABI } from "@/const";
import { readContract, readContracts } from "@wagmi/core";
import { erc20Abi } from "viem";
import { formatBigInt } from "@/lib";
import { useQueries } from "@tanstack/react-query";

export type VaultData = VaultMetadata & {
  tokenDecimals: number;
  shareDecimals: number;
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
      const generalVaultData = await readContracts(config, {
        contracts: [
          {
            abi: erc20Abi,
            address: vault.tokenAddress,
            functionName: "decimals",
            args: [],
          },
          {
            abi: valenceVaultABI,
            address: vault.vaultProxyAddress,
            functionName: "decimals",
            args: [],
          },
          {
            // tvl
            abi: valenceVaultABI,
            address: vault.vaultProxyAddress,
            functionName: "totalAssets",
            args: [],
          },
          {
            // total shares
            abi: valenceVaultABI,
            address: vault.vaultProxyAddress,
            functionName: "totalSupply",
            args: [],
          },
          {
            abi: valenceVaultABI,
            address: vault.vaultProxyAddress,
            functionName: "redemptionRate",
            args: [],
          },
        ],
      });
      let tokenDecimals: number = 18; // reasonable default
      let shareDecimals: number = 18; // reasonable default
      let tvl: bigint | undefined = undefined;
      let totalShares: bigint | undefined = undefined;
      let redemptionRate: bigint | undefined = undefined;

      if (generalVaultData.length !== 5) {
        throw new Error("Failed to fetch general vault data");
      }
      if (generalVaultData) {
        tokenDecimals = generalVaultData[0].result ?? 18; // reasonable default
        shareDecimals = generalVaultData[1].result ?? 18; // reasonable default
        tvl = generalVaultData[2].result;
        totalShares = generalVaultData[3].result;
        redemptionRate = generalVaultData[4].result;
      }

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
        tokenDecimals,
        shareDecimals,
        ...vault,
        raw: {
          totalShares: totalShares ?? BigInt(0),
          tvl: tvl ?? BigInt(0),
          userShares: userShares ?? BigInt(0),
          userPosition: userPosition ?? BigInt(0),
          redemptionRate: redemptionRate ?? BigInt(0),
        },
        formatted: {
          totalShares: formatBigInt(totalShares, shareDecimals, "shares", {
            displayDecimals: 2,
          }),
          tvl: formatBigInt(tvl, tokenDecimals, vault.token, {
            displayDecimals: 2,
          }),
          userShares: formatBigInt(userShares, shareDecimals, "shares", {
            displayDecimals: 2,
          }),
          userPosition: formatBigInt(userPosition, tokenDecimals, vault.token, {
            displayDecimals: 2,
          }),
          redemptionRate: formatBigInt(redemptionRate, shareDecimals, "%", {
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
      refetchInterval: 30000, // 30 seconds
      enabled: !!vaultMetadata,
      queryKey: [QUERY_KEYS.VAULT_DATA, vaultMetadata.id, address],
      queryFn: async () => {
        return fetchVaultData(vaultMetadata);
      },
    })),
    combine: (results) => {
      const _errors = results
        .filter((result) => result.isError)
        .map((result) => result.error);
      const combinedResults = {
        data: results
          .flatMap((result) => result.data)
          .filter((data) => data !== undefined),
        isLoading: results.some((result) => result.isLoading),
        isError: results.some((result) => result.isError),
        errors: _errors.length > 0 ? _errors : undefined,
      };
      if (combinedResults.errors) {
        console.error("Error fetching vault data", combinedResults.errors);
      }
      return combinedResults;
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
