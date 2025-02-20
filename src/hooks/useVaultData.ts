'use client'

import { useState, useEffect } from 'react'
import { useAccount, useBalance, type UseBalanceReturnType } from 'wagmi'

export interface VaultData {
  id: string
  name: string
  description: string
  tvl: string
  apr: string
  userDeposit: string
  userShares: string
  token: string
  tokenAddress: `0x${string}` // Contract address of the token
  vaultAddress: `0x${string}`
  ethBalance: string
}

// Get addresses from environment variables
const WETH_ADDRESS = process.env.NEXT_PUBLIC_WETH_ADDRESS as `0x${string}`
const USDC_ADDRESS = process.env.NEXT_PUBLIC_USDC_ADDRESS as `0x${string}`
const DAI_ADDRESS = process.env.NEXT_PUBLIC_DAI_ADDRESS as `0x${string}`
const WETH_VAULT_ADDRESS = process.env.NEXT_PUBLIC_ETH_VAULT_ADDRESS as `0x${string}`
const USDC_VAULT_ADDRESS = process.env.NEXT_PUBLIC_USDC_VAULT_ADDRESS as `0x${string}`
const DAI_VAULT_ADDRESS = process.env.NEXT_PUBLIC_DAI_VAULT_ADDRESS as `0x${string}`

// Base vault data without user-specific info
const BASE_VAULTS: Record<string, Omit<VaultData, 'userDeposit' | 'userShares' | 'ethBalance'>> = {
  weth: {
    id: 'weth',
    name: 'WETH Yield Vault',
    description: 'A simple vault for earning yield on WETH deposits.',
    tvl: '0 WETH',
    apr: '5.2%',
    token: 'WETH',
    tokenAddress: WETH_ADDRESS,
    vaultAddress: WETH_VAULT_ADDRESS,
  },
  usdc: {
    id: 'usdc',
    name: 'USDC Stable Vault',
    description: 'Stable yield generation for USDC deposits.',
    tvl: '0 USDC',
    apr: '3.8%',
    token: 'USDC',
    tokenAddress: USDC_ADDRESS,
    vaultAddress: USDC_VAULT_ADDRESS,
  },
  dai: {
    id: 'dai',
    name: 'DAI Lend Vault',
    description: 'Lending markets for DAI with competitive rates.',
    tvl: '0 DAI',
    apr: '4.2%',
    token: 'DAI',
    tokenAddress: DAI_ADDRESS,
    vaultAddress: DAI_VAULT_ADDRESS,
  },
}

export function useVaultData(vaultId?: string) {
  const { address, isConnected } = useAccount()
  const [vaults, setVaults] = useState<VaultData[]>([])
  const [selectedVault, setSelectedVault] = useState<VaultData | null>(null)

  // Get ETH balance
  const { data: ethBalance } = useBalance({
    address,
    query: {
      enabled: Boolean(address),
      refetchInterval: 5000,
    },
  })

  useEffect(() => {
    // Create full vault data with user-specific info
    const fullVaults = Object.entries(BASE_VAULTS).map(([id, vault]) => ({
      ...vault,
      userDeposit: id === 'eth' && ethBalance 
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

    if (vaultId) {
      setSelectedVault(fullVaults.find(v => v.id === vaultId) || null)
    } else {
      setVaults(fullVaults)
    }
  }, [vaultId, ethBalance, address])

  return {
    isConnected,
    vaults,
    selectedVault,
  }
} 