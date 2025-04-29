"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ConnectButton } from "@/components";

export function Header() {
  const pathname = usePathname();
  const isVaultPage = pathname?.startsWith("/vault/");
  const vaultId = isVaultPage ? pathname?.split("/")[2] : null;

  return (
    <header>
      <div className="mx-auto max-w-screen-xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-auto sm:h-32 items-start justify-between pt-6">
          {/* Left section - navigation */}
          <div className="flex flex-col gap-8 pt-2">
            <div className="flex flex-wrap items-center gap-6">
              <Link
                href="/"
                className="text-lg font-medium text-primary hover:text-primary-hover transition"
              >
                x—vaults
              </Link>

              {isVaultPage && (
                <>
                  <span className="text-gray-400 text-lg">/</span>
                  <span className="text-primary text-lg font-medium">
                    {vaultId?.toUpperCase()} Vault
                  </span>
                </>
              )}
            </div>
            {isVaultPage && (
              <Link
                href="/"
                className="inline-flex items-center justify-center gap-2 rounded-lg border-2 border-accent-purple/40 px-3 py-2 text-accent-purple transition hover:bg-accent-purple-light hover:text-accent-purple active:bg-accent-purple-light focus:outline-none focus:ring focus:ring-accent-purple w-fit"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth={2}
                  stroke="currentColor"
                  className="w-4 h-4"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18"
                  />
                </svg>
                <span className="text-sm font-medium">Back</span>
              </Link>
            )}
          </div>

          {/* Right section - wallet */}
          <div className="flex-shrink-0">
            <ConnectButton />
          </div>
        </div>
      </div>
    </header>
  );
}
