"use client";

import { useAccount, useDisconnect } from "wagmi";
import { useState, useEffect, Fragment } from "react";
import { useAppKit } from "@/context";
import { useTokenBalances, useViewAllVaults } from "@/hooks";
import { formatNumberString, shortenAddress } from "@/lib";

/**
 * ConnectButton component
 * Handles wallet connection state and displays:
 * - Connect button when disconnected
 * - Address and balances when connected
 * - Disconnect button to terminate connection
 */
export function ConnectButton() {
  const [mounted, setMounted] = useState(false);
  const { address, isConnected } = useAccount();
  const { disconnect } = useDisconnect();
  const { vaults } = useViewAllVaults();
  const appKit = useAppKit();

  // Extract unique token addresses from vaults
  const tokenAddresses = Array.from(
    new Set(vaults.map((vault) => vault.tokenAddress)),
  );

  // Fetch eth and tokens for the connected address
  const { ethBalance, tokenBalances } = useTokenBalances({
    address,
    tokenAddresses,
  });

  // Handle client-side mounting to prevent hydration issues
  useEffect(() => {
    setMounted(true);
  }, []);

  // Show placeholder during server-side rendering
  if (!mounted) {
    return (
      <button
        disabled
        className="inline-block rounded-md bg-gray-300 px-8 py-3 text-sm font-medium text-gray-500 cursor-not-allowed"
      >
        Connect Wallet
      </button>
    );
  }

  // Render connected state with balances and disconnect button
  if (isConnected && address) {
    return (
      <div className="flex flex-col sm:flex-row items-end sm:items-center gap-4">
        <div className="flex flex-col sm:flex-row items-end sm:items-center gap-3 text-sm">
          <div className="flex flex-col sm:flex-row items-end sm:items-center gap-3 sm:gap-5">
            {/* Display ETH balance */}
            {ethBalance && (
              <span className="text-accent-purple whitespace-nowrap">
                {formatNumberString(ethBalance.data?.balance, "ETH", {
                  displayDecimals: 2,
                })}
              </span>
            )}
            {/* Display token balances */}
            {tokenBalances.data?.map((tokenBalance, index) => (
              <Fragment key={`accountTokenBalance-${index}`}>
                {tokenBalance && (
                  <span className="text-accent-purple whitespace-nowrap">
                    {formatNumberString(
                      tokenBalance.balance,
                      tokenBalance.symbol,
                      {
                        displayDecimals: 2,
                      },
                    )}
                  </span>
                )}
              </Fragment>
            ))}
          </div>
          <span className="hidden sm:inline text-primary/30">•</span>
          {/* Etherscan link for address */}
          <a
            href={`https://etherscan.io/address/${address}`}
            target="_blank"
            rel="noopener noreferrer"
            className="font-medium text-primary hover:text-primary-hover transition-colors"
          >
            {shortenAddress(address)}
          </a>
        </div>
        {/* Disconnect button */}
        <button
          onClick={() => {
            disconnect();
            appKit?.disconnect();
          }}
          className="rounded-md border-2 border-primary/40 px-5 py-2.5 text-sm font-beast bg-white text-primary hover:bg-primary-light hover:text-primary-hover active:bg-primary-light focus:outline-none focus:ring focus:ring-primary"
        >
          Disconnect
        </button>
      </div>
    );
  }

  // Render connect button for disconnected state
  return (
    <button
      onClick={() => {
        if (appKit) {
          appKit.open({ view: "Connect" });
        }
      }}
      className="inline-block rounded-md px-12 py-4 text-base font-beast bg-secondary text-white hover:scale-110 hover:shadow-xl hover:bg-secondary-hover active:bg-secondary-hover transition-all focus:outline-none focus:ring focus:ring-secondary/20"
    >
      Connect Wallet
    </button>
  );
}
