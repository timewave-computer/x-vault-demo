'use client'
import Link from 'next/link'
import type { VaultData } from '@/hooks/useVaultData'

interface VaultCardProps extends VaultData {
  isConnected: boolean
}

export function VaultCard({ 
  id, 
  name, 
  description, 
  tvl, 
  apr, 
  userDeposit,
  isConnected 
}: VaultCardProps) {
  return (
    <Link 
      href={`/vault/${id}`}
      className="block rounded-lg p-4 shadow-sm hover:shadow-lg hover:shadow-primary transition-all duration-200 active:scale-95 active:shadow-inner bg-primary-light border-2 border-primary/40"
    >
      <div className="mt-2">
        <dl>
          <div>
            <dt className="sr-only">Name</dt>
            <dd className="text-2xl font-beast text-primary">{name}</dd>
          </div>
          <div className="mt-2">
            <dt className="sr-only">Description</dt>
            <dd className="text-sm text-gray-500">{description}</dd>
          </div>
        </dl>

        <div className="mt-6 grid grid-cols-2 gap-4 text-sm">
          <div className="sm:inline-flex sm:shrink-0 sm:items-center sm:gap-2">
            <div className="mt-1.5 sm:mt-0">
              <p className="text-black">TVL</p>
              <p className="text-xl font-beast text-accent-purple">{tvl}</p>
            </div>
          </div>

          <div className="sm:inline-flex sm:shrink-0 sm:items-center sm:gap-2">
            <div className="mt-1.5 sm:mt-0">
              <p className="text-black">APR</p>
              <p className="text-xl font-beast text-secondary">{apr}</p>
            </div>
          </div>

          {isConnected && (
            <div className="col-span-2 border-t-2 border-primary/40 pt-4">
              <div className="sm:inline-flex sm:shrink-0 sm:items-center sm:gap-2">
                <div className="mt-1.5 sm:mt-0">
                  <p className="text-black">Your Deposit</p>
                  <p className="text-xl font-beast text-accent-purple">{userDeposit}</p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </Link>
  )
} 