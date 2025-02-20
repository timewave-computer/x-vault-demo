import { useContractRead, useContractWrite, useAccount, usePublicClient, useWalletClient } from 'wagmi'
import { parseUnits, formatUnits, type Abi } from 'viem'
import { type Address } from 'viem'
import { useAppKit } from '@/components/AppKitProvider'

/**
 * Minimal ERC-20 ABI for basic token operations
 * Includes only the functions needed for balance checking and approvals
 */
const ERC20_ABI = [
  {
    type: 'function',
    name: 'decimals',
    inputs: [],
    outputs: [{ type: 'uint8' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    name: 'balanceOf',
    inputs: [{ type: 'address', name: 'account' }],
    outputs: [{ type: 'uint256' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    name: 'approve',
    inputs: [
      { type: 'address', name: 'spender' },
      { type: 'uint256', name: 'amount' },
    ],
    outputs: [{ type: 'bool' }],
    stateMutability: 'nonpayable',
  },
] as const

/**
 * ERC-4626 Vault ABI combining both vault-specific and ERC-20 functions
 * Includes functions for:
 * - Deposits and withdrawals
 * - Asset conversion calculations
 * - Balance and allowance checks
 */
const VAULT_ABI = [
  {
    type: 'function',
    name: 'deposit',
    inputs: [
      { type: 'uint256', name: 'assets' },
      { type: 'address', name: 'receiver' },
    ],
    outputs: [{ type: 'uint256', name: 'shares' }],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    name: 'withdraw',
    inputs: [
      { type: 'uint256', name: 'shares' },
      { type: 'address', name: 'receiver' },
      { type: 'address', name: 'owner' },
    ],
    outputs: [{ type: 'uint256', name: 'assets' }],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    name: 'asset',
    inputs: [],
    outputs: [{ type: 'address' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    name: 'maxWithdraw',
    inputs: [{ type: 'address', name: 'owner' }],
    outputs: [{ type: 'uint256', name: 'maxAssets' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    name: 'balanceOf',
    inputs: [{ type: 'address', name: 'account' }],
    outputs: [{ type: 'uint256' }],
    stateMutability: 'view',
  },
] as const

/**
 * Hook for interacting with an ERC-4626 vault contract
 * Provides functionality for:
 * - Reading token and share balances
 * - Converting between assets and shares
 * - Depositing assets and withdrawing shares
 */
export function useVaultContract(vaultAddress: string, tokenAddress: string) {
  const { address } = useAccount()
  const appKit = useAppKit()
  const publicClient = usePublicClient()
  const { data: walletClient } = useWalletClient()

  // Query token decimals for formatting
  const { data: decimals } = useContractRead({
    abi: ERC20_ABI,
    functionName: 'decimals',
    chainId: 1337,
    address: tokenAddress as Address,
  })

  // Query user's token balance
  const { data: balance } = useContractRead({
    abi: ERC20_ABI,
    functionName: 'balanceOf',
    chainId: 1337,
    address: tokenAddress as Address,
    args: address ? [address] : undefined,
  })

  // Query user's vault share balance
  const { data: shareBalance } = useContractRead({
    abi: VAULT_ABI,
    functionName: 'balanceOf',
    chainId: 1337,
    address: vaultAddress as Address,
    args: address ? [address] : undefined,
  })

  // Query maximum withdrawable amount
  const { data: maxWithdraw } = useContractRead({
    abi: VAULT_ABI,
    functionName: 'maxWithdraw',
    chainId: 1337,
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
        abi: ERC20_ABI,
        functionName: 'approve',
        args: [vaultAddress as Address, parsedAmount],
      })
      
      // Wait for approval to be mined
      await publicClient.waitForTransactionReceipt({ hash: approveHash })
      
      // Then deposit into the vault
      const depositHash = await walletClient.writeContract({
        address: vaultAddress as Address,
        abi: VAULT_ABI,
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
        abi: VAULT_ABI,
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