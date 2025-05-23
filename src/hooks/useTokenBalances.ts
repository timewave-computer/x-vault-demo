"use client";

import { useBalance, useConfig } from "wagmi";
import { readContracts } from "@wagmi/core";
import { Address, erc20Abi } from "viem";
import { useQueries, useQueryClient } from "@tanstack/react-query";
import { formatUnits } from "viem";
import { QUERY_KEYS } from "@/const";

const REFRESH_INTERVAL = 5000;

export function useTokenBalances({
  address,
  tokenAddresses,
}: {
  address?: Address;
  tokenAddresses?: Address[];
}) {
  const config = useConfig();
  const queryClient = useQueryClient();

  const ethBalance = useBalance({
    address,
    query: {
      enabled: !!address,
      refetchInterval: REFRESH_INTERVAL,
    },
  });

  const tokenBalances = useQueries({
    queries: !tokenAddresses
      ? []
      : tokenAddresses.map((tokenAddress) => ({
          queryKey: [QUERY_KEYS.TOKEN_BALANCE, address, tokenAddress],
          enabled: !!address,
          refetchInterval: REFRESH_INTERVAL,
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
              address: tokenAddress,
              balance: formatUnits(balance ?? BigInt(0), decimals),
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
        refetch: (tokenAddress?: `0x${string}`) => {
          if (!address || !tokenAddress) return;
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
        balance: formatUnits(ethBalance.data?.value ?? BigInt(0), 18),
        decimals: ethBalance.data?.decimals,
        symbol: ethBalance.data?.symbol,
      },
    },
    refetchTokenBalance: (tokenAddress: Address) => {
      if (!address || !tokenAddress) return;
      return queryClient.invalidateQueries({
        queryKey: [QUERY_KEYS.TOKEN_BALANCE, address, tokenAddress],
      });
    },
  };
}
