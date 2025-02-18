import { useBalance } from 'wagmi'
import type { FetchBalanceResult } from '@wagmi/core'

interface TokenBalance {
  balance: FetchBalanceResult
  address: `0x${string}`
}

export function useTokenBalances(address: `0x${string}` | undefined, tokenAddresses: `0x${string}`[]) {
  // Get ETH balance
  const { data: ethBalance } = useBalance({
    address,
  })

  // Get WETH balance (if available)
  const { data: wethBalance } = useBalance({
    address,
    token: tokenAddresses[0],
    watch: true,
  })

  // Get USDC balance (if available)
  const { data: usdcBalance } = useBalance({
    address,
    token: tokenAddresses[1],
    watch: true,
  })

  // Get DAI balance (if available)
  const { data: daiBalance } = useBalance({
    address,
    token: tokenAddresses[2],
    watch: true,
  })

  // Construct token balances array
  const tokenBalances: TokenBalance[] = [
    wethBalance && { balance: wethBalance, address: tokenAddresses[0] },
    usdcBalance && { balance: usdcBalance, address: tokenAddresses[1] },
    daiBalance && { balance: daiBalance, address: tokenAddresses[2] },
  ].filter((balance): balance is TokenBalance => balance !== null && balance !== undefined)

  return {
    ethBalance,
    tokenBalances,
  }
} 