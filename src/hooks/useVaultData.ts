"use client";

import { useState, useEffect } from "react";
import { useAccount, useBalance, useConfig } from "wagmi";
import { type BaseVaultData, BASE_VAULTS, defaultChainId } from "@/config";
import { valenceVaultABI } from "@/const";
import { readContract } from "@wagmi/core";
import { erc20Abi, formatUnits } from "viem";

export type VaultData = BaseVaultData & {
  decimals: number;
  raw: {
    totalShares: bigint;
    userShares: bigint;
    userPosition: bigint;
    ethBalance: bigint;
    tvl: bigint;
    redemptionRate: bigint;
  };
  formatted: {
    totalShares: string;
    userShares: string;
    userPosition: string;
    ethBalance: string;
    tvl: string;
    redemptionRate: string;
  };
};

export function useVaultData() {
  const { address, isConnected, chainId: accountChainId } = useAccount();
  const [vaults, setVaults] = useState<VaultData[]>([]);
  const [chainId, setChainId] = useState<number | null>(null);
  const config = useConfig();

  useEffect(() => {
    // client may have different chain ID than what is server rendered. Need to set with effect to avoid hydration error
    setChainId(accountChainId || defaultChainId);
  }, [accountChainId]);

  // Get ETH balance
  const { data: ethBalance } = useBalance({
    address,
    query: {
      enabled: Boolean(address),
      refetchInterval: 5000,
    },
  });

  useEffect(() => {
    // Read vault addresses from config
    const BASE_VAULTS_FOR_CHAIN = chainId ? BASE_VAULTS[chainId] : [];

    const generateAndSetVaults = async () => {
      // Create full vault data with user-specific info
      const vaultPromises = await Promise.allSettled(
        BASE_VAULTS_FOR_CHAIN.map(async (vault) => {
          try {
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
                args: [address],
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
                ethBalance: ethBalance?.value ?? BigInt(0),
              },
              formatted: {
                totalShares: formatTokenAmount(totalShares, "shares", {
                  displayDecimals: 4,
                  formatUnits: decimals,
                }),
                tvl: formatTokenAmount(tvl, vault.token, {
                  displayDecimals: 4,
                  formatUnits: decimals,
                }),
                userShares: formatTokenAmount(userShares, "shares", {
                  displayDecimals: 4,
                  formatUnits: decimals,
                }),
                userPosition: formatTokenAmount(userPosition, vault.token, {
                  displayDecimals: 4,
                  formatUnits: decimals,
                }),
                redemptionRate: formatTokenAmount(redemptionRate, "%", {
                  displayDecimals: 2,
                  formatUnits: decimals,
                }),
                ethBalance: formatTokenAmount(
                  ethBalance?.value ?? BigInt(0),
                  "ETH",
                  {
                    displayDecimals: 4,
                    formatUnits: 18,
                  },
                ),
              },
            };
            return result;
          } catch (error) {
            return Promise.reject(error);
          }
        }),
      );

      vaultPromises
        .filter((promise) => promise.status === "rejected")
        .forEach((promise) => {
          console.error("Error fetching vault:", promise.reason);
        });

      const hydratedVaults = vaultPromises
        .filter((promise) => promise.status === "fulfilled")
        .map((promise) => promise.value);

      setVaults(hydratedVaults);
    };
    generateAndSetVaults();
  }, [chainId, ethBalance, address]);

  return {
    isConnected,
    vaults,
    chainId,
  };
}

const defaultDisplayDecimals = 4;

function formatTokenAmount(
  _value: bigint | undefined,
  symbol: string,
  options: {
    displayDecimals?: number; // fraction precision
    formatUnits?: number; // wei -> eth
  },
): string {
  if (!_value || _value === BigInt(0)) {
    return `0 ${symbol}`;
  }

  let formattedValue: number;

  if (options.formatUnits) {
    formattedValue = Number(formatUnits(_value, options.formatUnits));
  } else formattedValue = Number(_value);

  return `${formattedValue.toFixed(options.displayDecimals ?? defaultDisplayDecimals)} ${symbol}`;
}
