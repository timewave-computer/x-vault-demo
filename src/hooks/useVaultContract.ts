import { useContractWrite, useContractRead, erc20ABI, useAccount } from 'wagmi'
import { parseEther, parseUnits, formatUnits } from 'viem'

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
]

export function useVaultContract(vaultAddress: string, tokenAddress: string) {
  const { address } = useAccount()

  // Get token decimals
  const { data: decimals } = useContractRead({
    address: tokenAddress as `0x${string}`,
    abi: erc20ABI,
    functionName: 'decimals',
  })

  // Get token balance
  const { data: balance } = useContractRead({
    address: tokenAddress as `0x${string}`,
    abi: erc20ABI,
    functionName: 'balanceOf',
    args: address ? [address] : undefined,
    watch: true,
  })

  // Get share balance
  const { data: shareBalance } = useContractRead({
    address: vaultAddress as `0x${string}`,
    abi: VAULT_ABI,
    functionName: 'balanceOf',
    args: address ? [address] : undefined,
    watch: true,
  })

  // Get max redeemable shares
  const { data: maxShares } = useContractRead({
    address: vaultAddress as `0x${string}`,
    abi: VAULT_ABI,
    functionName: 'maxRedeem',
    args: address ? [address] : undefined,
    watch: true,
  })

  // Conversion functions
  const { data: assetsForShares, refetch: refetchAssetsForShares } = useContractRead({
    address: vaultAddress as `0x${string}`,
    abi: VAULT_ABI,
    functionName: 'convertToAssets',
    args: shareBalance ? [shareBalance] : undefined,
  })

  // Contract write functions
  const { writeAsync: deposit } = useContractWrite({
    address: vaultAddress as `0x${string}`,
    abi: VAULT_ABI,
    functionName: 'deposit',
  })

  const { writeAsync: withdraw } = useContractWrite({
    address: vaultAddress as `0x${string}`,
    abi: VAULT_ABI,
    functionName: 'withdraw',
  })

  const { writeAsync: approveToken } = useContractWrite({
    address: tokenAddress as `0x${string}`,
    abi: erc20ABI,
    functionName: 'approve',
  })

  const depositWithAmount = async (amount: string) => {
    if (!address) throw new Error('No wallet connected')
    if (!decimals) throw new Error('Could not get token decimals')
    if (!balance) throw new Error('Could not get token balance')
    
    try {
      const amountInWei = parseUnits(amount, decimals)
      
      // Check if user has enough balance
      if (balance && amountInWei > BigInt(balance.toString())) {
        throw new Error(`Insufficient balance. You have ${formatUnits(balance, decimals)} tokens available.`)
      }
      
      // First approve the vault to spend tokens
      console.log('Approving token spend...')
      const approveTx = await approveToken({
        args: [vaultAddress, amountInWei],
      })
      
      console.log('Approved! Now depositing...')
      const depositTx = await deposit({
        args: [amountInWei, address],
      })

      console.log('Deposit successful!')
      return true
    } catch (error) {
      console.error('Deposit failed:', error)
      throw error
    }
  }

  const withdrawShares = async (shares: string) => {
    if (!address) throw new Error('No wallet connected')
    if (!decimals) throw new Error('Could not get token decimals')
    if (!maxShares) throw new Error('Could not get maximum withdrawable shares')
    
    try {
      const sharesInWei = parseUnits(shares, decimals)
      
      // Check if user has enough shares
      if (maxShares && sharesInWei > BigInt(maxShares.toString())) {
        throw new Error(`Insufficient shares. You have ${formatUnits(maxShares, decimals)} shares available.`)
      }
      
      console.log('Withdrawing shares...')
      const withdrawTx = await withdraw({
        args: [sharesInWei, address, address],
      })

      console.log('Withdrawal successful!')
      return true
    } catch (error) {
      console.error('Withdrawal failed:', error)
      throw error
    }
  }

  return {
    depositWithAmount,
    withdrawShares,
    shareBalance: shareBalance ? formatUnits(shareBalance, decimals ?? 18) : '0',
    maxShares: maxShares ? formatUnits(maxShares, decimals ?? 18) : '0',
    assetsForShares: assetsForShares ? formatUnits(assetsForShares, decimals ?? 18) : '0',
    refetchAssetsForShares,
  }
} 