'use client'

import { useState, useEffect } from 'react'
import { useAccount, useBalance } from 'wagmi'
import { type BaseVaultData,BASE_VAULTS } from '@/config'

export type VaultData = BaseVaultData & {
  userDeposit: string
  userShares: string
  ethBalance: string
}

// default to Ethereum mainnet if no account connected
const defaultChainId = 1

export function useVaultData(
) {
  const { address, isConnected, chainId:accountChainId, } = useAccount()
  const [vaults, setVaults] = useState<VaultData[]>([])
  const [chainId, setChainId] = useState<number | null>(null)
  useEffect(() => {
    // Update chainId on the client side
    setChainId( accountChainId || defaultChainId)
  }, [accountChainId])

  // Get ETH balance
  const { data: ethBalance } = useBalance({
    address,
    query: {
      enabled: Boolean(address),
      refetchInterval: 5000,
    },
  })



  useEffect(() => {
   
    // Read vault addresses from config
    const BASE_VAULTS_FOR_CHAIN = chainId ? BASE_VAULTS[chainId] : []

    // Create full vault data with user-specific info
    const fullVaults = BASE_VAULTS_FOR_CHAIN.map((vault) => ({
      ...vault,
      userDeposit: vault.id === 'eth' && ethBalance 
        ? Number(ethBalance.formatted) === 0 
          ? `0 ${ethBalance.symbol}`
          : `${Number(ethBalance.formatted).toFixed(4)} ${ethBalance.symbol}`
        : '0 ' + vault.token,
      userShares: '0 shares',
      ethBalance: ethBalance 
        ? Number(ethBalance.formatted) === 0
          ? `0 ${ethBalance.symbol}`
          : `${Number(ethBalance.formatted).toFixed(4)} ${ethBalance.symbol}`
        : '0 ETH'
    }))
    setVaults(fullVaults)
  }, [chainId, ethBalance, address])

  return {
    isConnected,
    vaults,
    chainId
  }
} 