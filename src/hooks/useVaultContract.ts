import { useContractRead, useContractWrite, useAccount } from 'wagmi'
import { parseUnits, formatUnits } from 'viem'

/**
 * Minimal ERC-20 ABI for basic token operations
 * Includes only the functions needed for balance checking and approvals
 */
const ERC20_ABI = [
  'function decimals() view returns (uint8)',
  'function balanceOf(address account) view returns (uint256)',
  'function approve(address spender, uint256 amount) returns (bool)',
] as const

/**
 * ERC-4626 Vault ABI combining both vault-specific and ERC-20 functions
 * Includes functions for:
 * - Deposits and withdrawals
 * - Asset conversion calculations
 * - Balance and allowance checks
 */
const VAULT_ABI = [
  // ERC-4626 deposit/withdraw functions
  'function deposit(uint256 assets, address receiver) returns (uint256 shares)',
  'function withdraw(uint256 shares, address receiver, address owner) returns (uint256 assets)',
  // ERC-4626 view functions
  'function asset() view returns (address)',
  'function convertToAssets(uint256 shares) view returns (uint256 assets)',
  'function convertToShares(uint256 assets) view returns (uint256 shares)',
  'function maxWithdraw(address owner) view returns (uint256 maxAssets)',
  'function maxRedeem(address owner) view returns (uint256 maxShares)',
  // ERC-20 functions
  'function decimals() view returns (uint8)',
  'function balanceOf(address account) view returns (uint256)',
  'function approve(address spender, uint256 amount) returns (bool)',
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

  // Query token decimals for formatting
  const { data: decimals } = useContractRead({
    abi: ERC20_ABI,
    functionName: 'decimals',
    chainId: 1337,
    address: tokenAddress as `0x${string}`,
  })

  // Query user's token balance
  const { data: balance } = useContractRead({
    abi: ERC20_ABI,
    functionName: 'balanceOf',
    chainId: 1337,
    address: tokenAddress as `0x${string}`,
    args: address ? [address] : undefined,
  })

  // Query user's vault share balance
  const { data: shareBalance } = useContractRead({
    abi: VAULT_ABI,
    functionName: 'balanceOf',
    chainId: 1337,
    address: vaultAddress as `0x${string}`,
    args: address ? [address] : undefined,
  })

  // Query maximum withdrawable amount
  const { data: maxWithdraw } = useContractRead({
    abi: VAULT_ABI,
    functionName: 'maxWithdraw',
    chainId: 1337,
    address: vaultAddress as `0x${string}`,
    args: address ? [address] : undefined,
  })

  // Set up token approval for vault deposits
  const { writeAsync: approve } = useContractWrite({
    abi: ERC20_ABI,
    functionName: 'approve',
    chainId: 1337,
    address: tokenAddress as `0x${string}`,
  })

  // Set up vault deposit function
  const { writeAsync: deposit } = useContractWrite({
    abi: VAULT_ABI,
    functionName: 'deposit',
    chainId: 1337,
    address: vaultAddress as `0x${string}`,
  })

  // Set up vault withdraw function
  const { writeAsync: withdraw } = useContractWrite({
    abi: VAULT_ABI,
    functionName: 'withdraw',
    chainId: 1337,
    address: vaultAddress as `0x${string}`,
  })

  /**
   * Deposit assets into the vault
   * Handles approval and deposit transaction sequence
   */
  const depositWithAmount = async (amount: string) => {
    if (!address || !decimals) return

    try {
      const parsedAmount = parseUnits(amount, decimals)
      
      // First approve vault to spend tokens
      const approveTx = await approve({
        args: [vaultAddress, parsedAmount],
      })
      await approveTx.wait()

      // Then deposit tokens into vault
      const depositTx = await deposit({
        args: [parsedAmount, address],
      })
      await depositTx.wait()
    } catch (error) {
      console.error('Error depositing:', error)
      throw error
    }
  }

  /**
   * Withdraw shares from the vault
   * Converts share amount to assets and executes withdrawal
   */
  const withdrawShares = async (shares: string) => {
    if (!address || !decimals) return

    try {
      const parsedShares = parseUnits(shares, decimals)
      
      // Execute withdrawal transaction
      const withdrawTx = await withdraw({
        args: [parsedShares, address, address],
      })
      await withdrawTx.wait()
    } catch (error) {
      console.error('Error withdrawing:', error)
      throw error
    }
  }

  return {
    balance: balance ? formatUnits(balance, decimals || 18) : undefined,
    shareBalance: shareBalance ? formatUnits(shareBalance, decimals || 18) : undefined,
    maxWithdraw: maxWithdraw ? formatUnits(maxWithdraw, decimals || 18) : undefined,
    depositWithAmount,
    withdrawShares,
  }
} 