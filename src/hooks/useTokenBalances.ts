'use client'

import { useBalance } from 'wagmi'

type BalanceData = {
  formatted: string
  symbol: string
  decimals: number
  value: bigint
}

interface TokenBalance {
  balance: BalanceData
  address: `0x${string}`
}

export function useTokenBalances(address: `0x${string}` | undefined, tokenAddresses: `0x${string}`[]) {
  // Get ETH balance
  const { data: ethBalance } = useBalance({
    address,
    chainId: 1337,
  })

  // Get WETH balance (if available)
  const { data: wethBalance } = useBalance({
    address,
    token: tokenAddresses[0],
    chainId: 1337,
  })

  // Get USDC balance (if available)
  const { data: usdcBalance } = useBalance({
    address,
    token: tokenAddresses[1],
    chainId: 1337,
  })

  // Get DAI balance (if available)
  const { data: daiBalance } = useBalance({
    address,
    token: tokenAddresses[2],
    chainId: 1337,
  })

  // Construct token balances array
  const tokenBalances: TokenBalance[] = [
    wethBalance && { balance: wethBalance, address: tokenAddresses[0] },
    usdcBalance && { balance: usdcBalance, address: tokenAddresses[1] },
    daiBalance && { balance: daiBalance, address: tokenAddresses[2] },
  ].filter((balance): balance is TokenBalance => Boolean(balance?.balance))

  return {
    ethBalance,
    tokenBalances,
  }
} 