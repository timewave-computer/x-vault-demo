'use client'

import { useAccount, useConnect, useDisconnect } from 'wagmi'
import { useVaultData } from '@/hooks/useVaultData'
import { useTokenBalances } from '@/hooks/useTokenBalances'
import { useState, useEffect } from 'react'

function shortenAddress(address: string) {
  return `${address.slice(0, 6)}...${address.slice(-4)}`
}

function formatBalance(balance: string | undefined, symbol: string, decimals: number = 4): string {
  if (!balance) return `0 ${symbol}`
  return `${Number(balance).toFixed(decimals)} ${symbol}`
}

export function ConnectButton() {
  const [mounted, setMounted] = useState(false)
  const { connect, connectors, isLoading, pendingConnector } = useConnect()
  const { address, isConnected } = useAccount()
  const { disconnect } = useDisconnect()
  const { vaults } = useVaultData()

  // Get unique token addresses from vaults
  const tokenAddresses = Array.from(new Set(vaults.map(vault => vault.tokenAddress)))

  // Get all balances
  const { ethBalance, tokenBalances } = useTokenBalances(
    address,
    tokenAddresses
  )

  // Prevent hydration mismatch by only rendering after mount
  useEffect(() => {
    setMounted(true)
  }, [])

  // Return null on server-side or before mounting to prevent hydration issues
  if (!mounted) {
    return (
      <button
        disabled
        className="inline-block rounded-md bg-gray-300 px-8 py-3 text-sm font-medium text-gray-500 cursor-not-allowed"
      >
        Connect Wallet
      </button>
    )
  }

  if (isConnected && address) {
    return (
      <div className="flex flex-col sm:flex-row items-end sm:items-center gap-4">
        <div className="flex flex-col sm:flex-row items-end sm:items-center gap-3 text-sm">
          <div className="flex flex-col sm:flex-row items-end sm:items-center gap-3 sm:gap-5">
            {ethBalance && (
              <span className="text-accent-purple whitespace-nowrap">
                {formatBalance(ethBalance.formatted, 'ETH')}
              </span>
            )}
            {tokenBalances.map(({ balance, address: tokenAddress }, index) => 
              balance && (
                <span key={tokenAddress} className="text-accent-purple whitespace-nowrap">
                  {formatBalance(balance.formatted, balance.symbol)}
                </span>
              )
            )}
          </div>
          <span className="hidden sm:inline text-primary/30">•</span>
          <a
            href={`https://etherscan.io/address/${address}`}
            target="_blank"
            rel="noopener noreferrer"
            className="font-medium text-primary hover:text-primary-hover transition-colors"
          >
            {shortenAddress(address)}
          </a>
        </div>
        <button
          onClick={() => disconnect()}
          disabled={isLoading}
          className={`rounded-md border-2 border-primary/40 px-5 py-2.5 text-sm font-beast ${
            isLoading 
              ? 'bg-gray-100 text-gray-400 cursor-not-allowed' 
              : 'bg-white text-primary hover:bg-primary-light hover:text-primary-hover active:bg-primary-light'
          } focus:outline-none focus:ring focus:ring-primary`}
        >
          Disconnect
        </button>
      </div>
    )
  }

  return (
    <div className="relative">
      <button
        onClick={() => connect({ connector: connectors[0] })}
        disabled={isLoading}
        className={`inline-block rounded-md px-12 py-4 text-base font-beast focus:outline-none focus:ring focus:ring-secondary/20 ${
          isLoading 
            ? 'bg-gray-300 text-gray-500 cursor-not-allowed' 
            : 'bg-secondary text-white hover:scale-110 hover:shadow-xl hover:bg-secondary-hover active:bg-secondary-hover transition-all'
        }`}
      >
        Connect Wallet
      </button>
      {isLoading && (
        <div className="absolute right-0 mt-2 w-48 rounded-md bg-white py-1 shadow-xl ring-1 ring-primary/20">
          <div className="px-4 py-2 text-sm text-primary">
            Connecting to {pendingConnector?.name}...
          </div>
        </div>
      )}
    </div>
  )
} 