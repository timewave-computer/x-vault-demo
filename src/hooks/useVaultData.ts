"use client";

import { useState, useEffect } from "react";
import { useAccount, useBalance, useConfig } from "wagmi";
import { type BaseVaultData, BASE_VAULTS, defaultChainId } from "@/config";
import { valenceVaultABI } from "@/const";
import { readContract } from "@wagmi/core";

export type VaultData = BaseVaultData & {
  userShares: string;
  userPosition: string;
  ethBalance: string;
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
      const fullVaults = await Promise.all(
        BASE_VAULTS_FOR_CHAIN.map(async (vault) => {
          let userShares = BigInt(0),
            vaultPosition = BigInt(0),
            tvl = BigInt(0);

          try {
            tvl = await readContract(config, {
              abi: valenceVaultABI,
              address: vault.vaultAddress,
              functionName: "totalAssets",
              args: [],
            });
          } catch (error) {
            console.error("Error fetching TVL:", error);
          }

          if (address) {
            try {
              const _userShares = await readContract(config, {
                abi: valenceVaultABI,
                address: vault.vaultAddress,
                functionName: "balanceOf",
                args: [address],
              });
              userShares = _userShares;
            } catch (error) {
              console.error("Error fetching user shares:", error);
            }

            if (userShares) {
              try {
                const _vaultPosition = await readContract(config, {
                  abi: valenceVaultABI,
                  address: vault.vaultAddress,
                  functionName: "convertToAssets",
                  args: [userShares],
                });

                vaultPosition = _vaultPosition;
              } catch (error) {
                console.error("Error fetching user shares:", error);
              }
            }
          }

          return {
            ...vault,
            tvl: formatTokenAmount(tvl, vault.token),
            userShares: formatTokenAmount(userShares, vault.token),
            userPosition: formatTokenAmount(vaultPosition, vault.token),
            apr: vault.apr,
            userVaultBalance: 0,
            ethBalance: ethBalance
              ? Number(ethBalance.formatted) === 0
                ? `0 ${ethBalance.symbol}`
                : `${Number(ethBalance.formatted).toFixed(4)} ${ethBalance.symbol}`
              : "0 ETH",
          };
        }),
      );
      setVaults(fullVaults);
    };
    generateAndSetVaults();
  }, [chainId, ethBalance, address]);

  return {
    isConnected,
    vaults,
    chainId,
  };
}

function formatTokenAmount(
  value: bigint | undefined,
  symbol: string,
  displayDecimals: number = 4,
): string {
  if (!value || value === BigInt(0)) {
    return `0 ${symbol}`;
  }

  return `${Number(value).toFixed(displayDecimals)}} ${symbol}`;
}
