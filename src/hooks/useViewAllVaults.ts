"use client";

import { useCallback } from "react";
import { useAccount, useConfig } from "wagmi";
import { QUERY_KEYS, valenceVaultABI } from "@/const";
import { readContract, readContracts } from "@wagmi/core";
import { erc20Abi } from "viem";
import { formatBigInt } from "@/lib";
import { useQueries } from "@tanstack/react-query";
import { useVaultsConfig } from "@/components/VaultsConfigProvider";
import { VaultConfig } from "@/server";

export type VaultData = VaultConfig & {
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
  const { address, chainId } = useAccount();
  const config = useConfig();
  const { vaultsConfig } = useVaultsConfig();

  // fetches vault data for a single vault
  const fetchVaultData = useCallback(
    async (vault: VaultConfig) => {
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
      let tokenDecimals: number;
      let shareDecimals: number;
      let tvl: bigint | undefined = undefined;
      let totalShares: bigint | undefined = undefined;
      let redemptionRate: bigint | undefined = undefined;

      if (!generalVaultData) {
        throw new Error("Failed to fetch general vault data");
      }

      if (generalVaultData.length !== 5) {
        throw new Error("Failed to fetch general vault data");
      } else if (
        generalVaultData[0] === undefined ||
        generalVaultData[1] === undefined
      ) {
        // if these are undefined, unit conversions cannot be done
        throw new Error("Failed to fetch token or share decimals");
      }

      tokenDecimals = Number(generalVaultData[0].result);
      shareDecimals = Number(generalVaultData[1].result);
      tvl = generalVaultData[2].result;
      totalShares = generalVaultData[3].result;
      redemptionRate = generalVaultData[4].result;

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
    queries: vaultsConfig
      .filter((vaultConfig) =>
        chainId ? vaultConfig.chainId === chainId : true,
      )
      .map((vaultConfig) => ({
        refetchInterval: 30000, // 30 seconds
        enabled: vaultsConfig?.length > 0,
        queryKey: [QUERY_KEYS.VAULT_DATA, vaultConfig.vaultId, address],
        queryFn: async () => {
          return fetchVaultData(vaultConfig);
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
    isError,
    vaults,
    chainId,
  };
}
