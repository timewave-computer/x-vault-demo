import {   useReadContract, useAccount, usePublicClient, useWalletClient } from 'wagmi'
import { parseUnits, formatUnits, erc20Abi } from 'viem'
import { type Address } from 'viem'
import { valenceVaultABI } from '@/const'



/**
 * Hook for interacting with an ERC-4626 vault contract
 * Provides functionality for:
 * - Reading token and share balances
 * - Converting between assets and shares
 * - Depositing assets and withdrawing shares
 */
export function useVaultContract(vaultAddress: string, tokenAddress: string) {
  const { address } = useAccount()
  const publicClient = usePublicClient()
  const { data: walletClient } = useWalletClient()

  // Query token decimals for formatting
  const { data: decimals } = useReadContract({
    abi: erc20Abi,
    functionName: 'decimals',
    address: tokenAddress as Address,
  })

  // Query user's token balance
  const { data: balance } = useReadContract({
    abi: erc20Abi,
    functionName: 'balanceOf',
    address: tokenAddress as Address,
    args: address ? [address] : undefined,
  })

  // Query user's vault share balance
  const { data: shareBalance } = useReadContract({
    abi: valenceVaultABI,
    functionName: 'balanceOf',
    address: vaultAddress as Address,
    args: address ? [address] : undefined,
  })

  // Query maximum withdrawable amount
  const { data: maxWithdraw } = useReadContract({
    abi: valenceVaultABI,
    functionName: 'maxWithdraw',
    address: vaultAddress as Address,
    args: address ? [address] : undefined,
  })

  const depositWithAmount = async (amount: string) => {
    if (!address || !decimals) throw new Error('Not connected')
    if (!walletClient) throw new Error('Wallet not connected')
    if (!publicClient) throw new Error('Public client not initialized')
    
    const parsedAmount = parseUnits(amount, Number(decimals))
    
    try {
      // First approve the vault to spend tokens
      const approveHash = await walletClient.writeContract({
        address: tokenAddress as Address,
        abi: erc20Abi,
        functionName: 'approve',
        args: [vaultAddress as Address, parsedAmount],
      })
      
      // Wait for approval to be mined
      await publicClient.waitForTransactionReceipt({ hash: approveHash })
      
      // Then deposit into the vault
      const depositHash = await walletClient.writeContract({
        address: vaultAddress as Address,
        abi: valenceVaultABI,
        functionName: 'deposit',
        args: [parsedAmount, address],
      })
      
      // Wait for deposit to be mined
      await publicClient.waitForTransactionReceipt({ hash: depositHash })
      
      return depositHash
    } catch (error) {
      console.error('Transaction failed:', error)
      throw new Error('Transaction failed')
    }
  }

  const withdrawShares = async (shares: string) => {
    if (!address || !decimals) throw new Error('Not connected')
    if (!walletClient) throw new Error('Wallet not connected')
    if (!publicClient) throw new Error('Public client not initialized')
    
    const parsedShares = parseUnits(shares, Number(decimals))
    try {
      const hash = await walletClient.writeContract({
        address: vaultAddress as Address,
        abi: valenceVaultABI,
        functionName: 'withdraw',
        args: [parsedShares, address, address],
      })
      
      // Wait for withdrawal to be mined
      await publicClient.waitForTransactionReceipt({ hash })
      
      return hash
    } catch (error) {
      console.error('Transaction failed:', error)
      throw new Error('Transaction failed')
    }
  }

  return {
    depositWithAmount,
    withdrawShares,
    maxWithdraw: maxWithdraw ? Number(formatUnits(maxWithdraw, Number(decimals ?? 18))).toFixed(4) : '0',
    balance: balance ? Number(formatUnits(balance, Number(decimals ?? 18))).toFixed(4) : '0',
    shareBalance: shareBalance ? Number(formatUnits(shareBalance, Number(decimals ?? 18))).toFixed(4) : undefined,
  }
} 