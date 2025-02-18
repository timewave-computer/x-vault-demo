'use client'

import Link from 'next/link'
import { useVaultData } from '@/hooks/useVaultData'
import { useAccount } from 'wagmi'
import { useState } from 'react'
import { useVaultContract } from '@/hooks/useVaultContract'

export default function VaultPage({ params }: { params: { id: string } }) {
  const { vaults } = useVaultData()
  const { isConnected } = useAccount()
  const vaultData = vaults?.find((v) => v.id === params.id)
  const [depositAmount, setDepositAmount] = useState('')
  const [withdrawShares, setWithdrawShares] = useState('')
  const [isDepositing, setIsDepositing] = useState(false)
  const [isWithdrawing, setIsWithdrawing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isSuccess, setIsSuccess] = useState(false)

  const { 
    depositWithAmount, 
    withdrawShares: withdrawSharesFromVault,
    shareBalance,
    maxShares,
    assetsForShares,
    refetchAssetsForShares 
  } = useVaultContract(
    vaultData?.vaultAddress ?? '',
    vaultData?.tokenAddress ?? ''
  )

  const handleDeposit = async () => {
    if (!depositAmount || !isConnected || !vaultData) return
    setIsDepositing(true)
    setError(null)
    setIsSuccess(false)
    
    try {
      await depositWithAmount(depositAmount)
      setDepositAmount('')
      setIsSuccess(true)
    } catch (err) {
      if (err instanceof Error) {
        if (err.message.includes('rejected')) {
          setError('Transaction rejected')
        } else {
          setError(err.message)
        }
      } else {
        setError('Failed to deposit')
      }
      console.error('Deposit failed:', err)
    } finally {
      setIsDepositing(false)
    }
  }

  const handleWithdraw = async () => {
    if (!withdrawShares || !isConnected || !vaultData) return
    setIsWithdrawing(true)
    setError(null)
    setIsSuccess(false)
    
    try {
      await withdrawSharesFromVault(withdrawShares)
      setWithdrawShares('')
      setIsSuccess(true)
    } catch (err) {
      if (err instanceof Error) {
        if (err.message.includes('rejected')) {
          setError('Transaction rejected')
        } else {
          setError(err.message)
        }
      } else {
        setError('Failed to withdraw')
      }
      console.error('Withdrawal failed:', err)
    } finally {
      setIsWithdrawing(false)
    }
  }

  if (!vaultData) {
    return (
      <div className="text-center">
        <h1 className="text-2xl font-beast text-gray-900 sm:text-3xl">
          Vault Not Found
        </h1>
        <p className="mt-4 text-gray-500">
          The vault you are looking for does not exist.
        </p>
        <Link
          href="/"
          className="mt-8 inline-block rounded-lg bg-primary px-8 py-3 text-sm font-medium text-white transition hover:scale-110 hover:shadow-xl focus:outline-none focus:ring active:bg-primary-hover"
        >
          Go back home
        </Link>
      </div>
    )
  }

  return (
    <div className="relative">
      {/* Content */}
      <div className="relative">

        <div className="sm:flex sm:items-center sm:justify-between">
          <div>
            <h1 className="text-3xl font-beast text-primary sm:text-4xl">
              {vaultData.name}
            </h1>
            <p className="mt-1.5 text-base text-gray-500">
              {vaultData.description}
            </p>
          </div>
        </div>

        <dl className="mt-6 grid grid-cols-1 gap-6 sm:grid-cols-4">
          <div className="rounded-lg border-2 border-accent-purple/40 px-4 py-6 text-center bg-accent-purple-light">
            <dt className="text-base text-black">
              ETH Balance
            </dt>
            <dd className="mt-2 text-2xl font-beast text-accent-purple">
              {isConnected ? vaultData.ethBalance : '-'}
            </dd>
          </div>

          <div className="rounded-lg border-2 border-accent-purple/40 px-4 py-6 text-center bg-accent-purple-light">
            <dt className="text-base text-black">
              TVL
            </dt>
            <dd className="mt-2 text-2xl font-beast text-accent-purple">
              {vaultData.tvl}
            </dd>
          </div>

          <div className="rounded-lg border-2 border-accent-purple/40 px-4 py-6 text-center bg-accent-purple-light">
            <dt className="text-base text-black">
              APR
            </dt>
            <dd className="mt-2 text-2xl font-beast text-secondary">
              {vaultData.apr}
            </dd>
          </div>

          <div className="rounded-lg border-2 border-accent-purple/40 px-4 py-6 text-center bg-accent-purple-light">
            <dt className="text-base text-black">
              Your Position
            </dt>
            <dd className="mt-2 text-2xl font-beast text-accent-purple">
              {isConnected ? vaultData.userDeposit : '-'}
            </dd>
          </div>
        </dl>

        <div className="mt-8 grid grid-cols-1 gap-6 lg:grid-cols-2">
          {/* Deposit Section */}
          <div className="rounded-lg bg-primary-light px-8 pt-8 pb-6 border-2 border-primary/40">
            <div className="mb-6">
              <h3 className="text-lg font-beast text-accent-purple">Deposit</h3>
              <div className="flex justify-between items-center mt-2">
                <p className="text-sm text-gray-500">Add tokens to start earning yield</p>
                <div className="flex items-center gap-2">
                  <p className="text-sm text-gray-500">
                    Available: {vaultData.userDeposit}
                  </p>
                  <button
                    onClick={() => setDepositAmount(vaultData.userDeposit.split(' ')[0])}
                    className="px-2 py-1 text-sm font-medium text-white bg-primary hover:bg-primary-hover rounded transition-colors"
                  >
                    MAX
                  </button>
                </div>
              </div>
            </div>

            {/* Deposit input */}
            <div className="flex rounded-lg border-2 border-primary/40">
              <input
                type="number"
                name="depositAmount"
                id="depositAmount"
                className="w-full px-4 py-3 text-base text-gray-900 bg-white placeholder:text-gray-400 focus:outline-none focus:ring-0 focus:shadow-[inset_0_1px_8px_rgba(0,145,255,0.25)] rounded-l-lg"
                placeholder="0.0"
                value={depositAmount}
                onChange={(e) => {
                  setError(null)
                  setDepositAmount(e.target.value)
                }}
                disabled={!isConnected || isDepositing}
              />
              <div className="flex items-center bg-primary-light px-4 text-base text-black border-l border-primary rounded-r-lg">
                {vaultData.token}
              </div>
            </div>

            <button
              onClick={handleDeposit}
              disabled={!isConnected || !depositAmount || isDepositing || !vaultData.userDeposit || vaultData.userDeposit.startsWith('0')}
              className={`w-full rounded-lg px-8 py-3 text-base font-beast focus:outline-none focus:ring mt-4 ${
                !isConnected || !depositAmount || isDepositing || !vaultData.userDeposit || vaultData.userDeposit.startsWith('0')
                  ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  : 'bg-accent-purple text-white hover:scale-110 hover:shadow-xl hover:bg-accent-purple-hover active:bg-accent-purple-active transition-all'
              }`}
            >
              {isDepositing ? 'Confirm in Wallet...' : 'Deposit'}
            </button>

            {/* Deposit estimate and warning display */}
            <div className="h-6 mt-4 flex justify-between items-center">
              {depositAmount && (
                <p className="text-sm text-gray-500">
                  ≈ {assetsForShares} shares
                </p>
              )}
              {!isConnected ? (
                <p className="text-sm text-secondary">
                  Connect your wallet to start depositing
                </p>
              ) : (depositAmount && (!vaultData.userDeposit || vaultData.userDeposit.startsWith('0'))) && (
                <p className="text-sm text-secondary">
                  You need {vaultData.token} tokens to deposit into this vault
                </p>
              )}
            </div>

            {isSuccess && (
              <p className="mt-4 text-sm text-accent-purple">
                Transaction successful! Your position will update shortly.
              </p>
            )}
            {error && (
              <p className="mt-4 text-sm text-secondary">
                {error}
              </p>
            )}
          </div>

          {/* Withdraw Section */}
          <div className="rounded-lg bg-primary-light px-8 pt-8 pb-6 border-2 border-primary/40">
            <div className="mb-6">
              <h3 className="text-lg font-beast text-accent-purple mb-1">Withdraw</h3>
              <div className="flex justify-between items-center mt-2">
                <p className="text-sm text-gray-500">Convert your shares to tokens</p>
                <div className="flex items-center gap-2">
                  <p className="text-sm text-gray-500">
                    Available: {maxShares} shares
                  </p>
                  <button
                    onClick={() => setWithdrawShares(maxShares)}
                    className="px-2 py-1 text-sm font-medium text-white bg-primary hover:bg-primary-hover rounded transition-colors"
                  >
                    MAX
                  </button>
                </div>
              </div>
            </div>

            {/* Withdraw input */}
            <div className="flex rounded-lg border-2 border-primary/40">
              <input
                type="number"
                name="withdrawShares"
                id="withdrawShares"
                className="w-full px-4 py-3 text-base text-gray-900 bg-white placeholder:text-gray-400 focus:outline-none focus:ring-0 focus:shadow-[inset_0_1px_8px_rgba(0,145,255,0.25)] rounded-l-lg"
                placeholder="0.0"
                value={withdrawShares}
                onChange={(e) => {
                  setError(null)
                  setWithdrawShares(e.target.value)
                }}
                disabled={!isConnected || isWithdrawing}
              />
              <div className="flex items-center bg-primary-light px-4 text-base text-black border-l border-primary rounded-r-lg">
                Shares
              </div>
            </div>

            <button
              onClick={handleWithdraw}
              disabled={!isConnected || !withdrawShares || isWithdrawing || !maxShares || maxShares === '0'}
              className={`w-full rounded-lg px-8 py-3 text-base font-beast focus:outline-none focus:ring mt-4 ${
                !isConnected || !withdrawShares || isWithdrawing || !maxShares || maxShares === '0'
                  ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  : 'bg-accent-purple text-white hover:scale-110 hover:shadow-xl hover:bg-accent-purple-hover active:bg-accent-purple-active transition-all'
              }`}
            >
              {isWithdrawing ? 'Confirm in Wallet...' : 'Withdraw'}
            </button>

            {/* Withdraw estimate and warning display */}
            <div className="h-6 mt-4 flex justify-between items-center">
              {withdrawShares && (
                <p className="text-sm text-gray-500">
                  ≈ {assetsForShares} {vaultData.token}
                </p>
              )}
              {!isConnected ? (
                <p className="text-sm text-secondary">
                  Connect your wallet to start withdrawing
                </p>
              ) : (withdrawShares && (!maxShares || maxShares === '0')) && (
                <p className="text-sm text-secondary">
                  You need vault shares to withdraw
                </p>
              )}
            </div>

            {isSuccess && (
              <p className="mt-4 text-sm text-accent-purple">
                Transaction successful! Your position will update shortly.
              </p>
            )}
            {error && (
              <p className="mt-4 text-sm text-secondary">
                {error}
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  )
} 