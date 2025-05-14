"use client";

import { useCallback } from "react";
import { useAccount, useConfig } from "wagmi";
import { QUERY_KEYS, valenceVaultABI } from "@/const";
import { readContract, readContracts } from "@wagmi/core";
import { erc20Abi } from "viem";
import {
  fetchAprFromApi,
  fetchAprFromContract,
  parseWithdrawRequest,
} from "@/lib";
import { useQueries } from "@tanstack/react-query";
import { useVaultsConfig, type VaultConfig } from "@/context";

export type VaultData = VaultConfig & {
  tokenDecimals: number;
  shareDecimals: number;
  aprPercentage?: string;
  totalShares: bigint;
  userVaultShares: bigint;
  userVaultAssets: bigint;
  tvl: bigint;
  redemptionRate: bigint;
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

      if (!generalVaultData) {
        throw new Error("Failed to fetch general vault data");
      }
      const tokenDecimals = Number(generalVaultData[0].result);
      const shareDecimals = Number(generalVaultData[1].result);
      const tvl = generalVaultData[2].result;
      const totalShares = generalVaultData[3].result;
      const redemptionRate = generalVaultData[4].result;
      if (!tokenDecimals || !shareDecimals) {
        // if these are undefined, unit conversions cannot be done
        throw new Error("Failed to fetch general vault data");
      }

      let userVaultShares = BigInt(0);
      let userVaultAssets = BigInt(0);

      if (address) {
        userVaultShares = await readContract(config, {
          abi: valenceVaultABI,
          address: vault.vaultProxyAddress,
          functionName: "balanceOf",
          args: [address as `0x${string}`],
        });

        userVaultAssets = await readContract(config, {
          abi: valenceVaultABI,
          address: vault.vaultProxyAddress,
          functionName: "convertToAssets",
          args: [userVaultShares],
        });

        const _userWithdrawRequest = await readContract(config, {
          abi: valenceVaultABI,
          address: vault.vaultProxyAddress,
          functionName: "userWithdrawRequest",
          args: [address as `0x${string}`],
        });

        const userWithdrawRequest = parseWithdrawRequest(_userWithdrawRequest);
        if (userWithdrawRequest) {
          const withdrawAssetAmount = await readContract(config, {
            abi: valenceVaultABI,
            address: vault.vaultProxyAddress,
            functionName: "convertToAssets",
            args: [userWithdrawRequest.withdrawSharesAmount],
          });
          userVaultShares =
            userVaultShares + userWithdrawRequest.withdrawSharesAmount;
          userVaultAssets = userVaultAssets + withdrawAssetAmount;
        }
      }

      let apr: string | undefined = undefined;
      if (vault.aprRequest.type === "contract") {
        apr = await fetchAprFromContract(vault, config, tokenDecimals);
      } else if (vault.aprRequest.type === "api") {
        apr = await fetchAprFromApi(vault);
      }
      const aprPercentage = apr
        ? (parseFloat(apr) * 100).toString()
        : undefined;

      const result: VaultData = {
        ...vault,
        tokenDecimals,
        shareDecimals,
        aprPercentage,
        totalShares: totalShares ?? BigInt(0),
        tvl: tvl ?? BigInt(0),
        userVaultShares: userVaultShares ?? BigInt(0),
        userVaultAssets: userVaultAssets ?? BigInt(0),
        redemptionRate: redemptionRate ?? BigInt(0),
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
        console.error(
          "Error fetching vault data. Errors:",
          combinedResults.errors,
        );
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
