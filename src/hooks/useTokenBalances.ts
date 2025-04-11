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
    chainId: 31337,
  })

  // Get WETH balance (if available)
  const { data: wethBalance } = useBalance({
    address,
    token: tokenAddresses[0],
    chainId: 31337,
  })

  // Get USDC balance (if available)
  const { data: usdcBalance } = useBalance({
    address,
    token: tokenAddresses[1],
    chainId: 31337,
  })

  // Get DAI balance (if available)
  const { data: daiBalance } = useBalance({
    address,
    token: tokenAddresses[2],
    chainId: 31337,
  })

  // Construct token balances array
  const tokenBalances: TokenBalance[] = [
    wethBalance && { 
      balance: {
        ...wethBalance,
        formatted: Number(wethBalance.formatted) === 0 
          ? '0'
          : Number(wethBalance.formatted).toFixed(4)
      }, 
      address: tokenAddresses[0] 
    },
    usdcBalance && { 
      balance: {
        ...usdcBalance,
        formatted: Number(usdcBalance.formatted) === 0 
          ? '0'
          : Number(usdcBalance.formatted).toFixed(4)
      }, 
      address: tokenAddresses[1] 
    },
    daiBalance && { 
      balance: {
        ...daiBalance,
        formatted: Number(daiBalance.formatted) === 0 
          ? '0'
          : Number(daiBalance.formatted).toFixed(4)
      }, 
      address: tokenAddresses[2] 
    },
  ].filter((balance): balance is TokenBalance => Boolean(balance?.balance))

  return {
    ethBalance: ethBalance ? {
      ...ethBalance,
      formatted: Number(ethBalance.formatted) === 0 
        ? '0'
        : Number(ethBalance.formatted).toFixed(4)
    } : undefined,
    tokenBalances,
  }
} 