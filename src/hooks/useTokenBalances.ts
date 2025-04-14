"use client";

import { useBalance, useConfig } from "wagmi";
import { readContracts } from "@wagmi/core";
import { erc20Abi } from "viem";
import { useQueries, useQueryClient } from "@tanstack/react-query";
import { formatUnits } from "viem";
import { QUERY_KEYS } from "@/const";

export function useTokenBalances({
  address,
  tokenAddresses,
}: {
  address: `0x${string}` | undefined;
  tokenAddresses: `0x${string}`[];
}) {
  const config = useConfig();
  const queryClient = useQueryClient();

  const ethBalance = useBalance({
    address,
    query: {
      enabled: !!address,
      refetchInterval: 5000,
    },
  });

  const tokenBalances = useQueries({
    queries: tokenAddresses.map((tokenAddress) => ({
      queryKey: [QUERY_KEYS.TOKEN_BALANCE, address, tokenAddress],
      enabled: !!address,
      queryFn: async () => {
        if (!address) return;
        const [balance, decimals, symbol] = await readContracts(config, {
          allowFailure: false,
          contracts: [
            {
              address: tokenAddress,
              abi: erc20Abi,
              functionName: "balanceOf",
              args: [address],
            },
            {
              address: tokenAddress,
              abi: erc20Abi,
              functionName: "decimals",
            },
            {
              address: tokenAddress,
              abi: erc20Abi,
              functionName: "symbol",
            },
          ],
        });
        return {
          balance: {
            raw: balance,
            formatted: formatUnits(balance, decimals),
          },
          decimals,
          symbol,
        };
      },
    })),
    combine: (results) => {
      return {
        data: results.map((result) => result.data),
        isLoading: results.some((result) => result.isLoading),
        isError: results.some((result) => result.isPending),
        error: results.map((result) => result.error),
        refetch: (tokenAddress: `0x${string}`) => {
          if (!address) return;
          return queryClient.invalidateQueries({
            queryKey: [QUERY_KEYS.TOKEN_BALANCE, address, tokenAddress],
          });
        },
      };
    },
  });

  return {
    tokenBalances,
    ethBalance: {
      ...ethBalance,
      data: {
        balance: {
          raw: ethBalance.data?.value,
          formatted: formatUnits(ethBalance.data?.value ?? BigInt(0), 18),
        },
        decimals: ethBalance.data?.decimals,
        symbol: ethBalance.data?.symbol,
      },
    },
  };
}
