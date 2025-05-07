import React from "react";
import { Button, Card, Tooltip, WithdrawTimer } from "@/components";
import { useAccount } from "wagmi";

interface WithdrawInProgressProps {
  copy: {
    title: string;
    description: string;
    cta: string;
  };
  pendingWithdrawal?: {
    formatted?: {
      claimTime: string;
      sharesAmount: string;
    };
    isClaimable?: boolean;
    timeRemaining?: string | null;
    withdrawAssetBalanceFormatted?: string;
    hasActiveWithdraw?: boolean;
    withdrawRate?: string;
  };
  onCompleteWithdraw: () => void;
  isCompletingWithdraw: boolean;
}

export const WithdrawInProgress: React.FC<WithdrawInProgressProps> = ({
  copy,
  pendingWithdrawal,
  onCompleteWithdraw,
  isCompletingWithdraw,
}) => {
  const { isConnected } = useAccount();
  if (
    !pendingWithdrawal ||
    !pendingWithdrawal?.formatted ||
    !pendingWithdrawal?.hasActiveWithdraw
  ) {
    return null;
  }

  return (
    <div className="mt-8">
      <Card variant="secondary">
        <div className="absolute top-0 right-0 w-32 h-32 -mr-8 -mt-8 bg-accent-purple/5 rounded-full blur-xl"></div>
        <div className="absolute bottom-0 left-0 w-24 h-24 -ml-10 -mb-10 bg-accent-purple/5 rounded-full blur-xl"></div>

        <div className="py-4">
          <div className="flex flex-col px-4 max-w-[1200px]">
            <div className="text-xl font-beast text-accent-purple mb-2">
              {copy.title}
            </div>
            <div>
              <div className="space-y-1">
                <p>{copy.description}</p>
                <p className="flex items-center gap-1">
                  Why do I have to wait?
                  <Tooltip
                    content={
                      <div>
                        <p className="font-medium mb-1">
                          Two-Step Withdrawal Process
                        </p>
                        <p className="mb-2">
                          This is a cross-chain vault, which means your assets
                          need to be moved back to the source chain before they
                          can be withdrawn.
                        </p>
                        <p className="font-medium mb-1">
                          Step 1: Clearing Period
                        </p>
                        <p className="mb-2">
                          When you initiate a withdrawal, your funds enter a
                          clearing period where they are moved from the
                          destination chain back to the source chain. This
                          process takes time to complete safely.
                        </p>
                        <p className="font-medium mb-1">
                          Step 2: Final Withdrawal
                        </p>
                        <p>
                          Once your funds have returned to the source chain,
                          they become claimable. At this point, you must
                          manually complete the withdrawal by clicking "Transfer
                          to Wallet".
                        </p>
                      </div>
                    }
                  />
                </p>
              </div>
            </div>

            <div className="mt-4 grid grid-cols-1 gap-6 lg:grid-cols-2">
              {/* col 1 */}
              <div className="">
                <WithdrawTimer
                  initialTimeRemaining={
                    pendingWithdrawal.isClaimable
                      ? "00:00:00"
                      : pendingWithdrawal.timeRemaining || "--:--:--"
                  }
                  isClaimable={!!pendingWithdrawal.isClaimable}
                  claimTime={pendingWithdrawal.formatted.claimTime || "N/A"}
                >
                  Claimable after: {pendingWithdrawal.formatted.claimTime}
                </WithdrawTimer>
              </div>

              {/* col 2 */}
              <div>
                <div className="flex flex-col w-full items-center">
                  <span className="text-2xl font-beast text-accent-purple">
                    {pendingWithdrawal.withdrawAssetBalanceFormatted}
                  </span>
                  <span className="text-sm text-accent-purple">
                    {pendingWithdrawal.formatted.sharesAmount}{" "}
                    {pendingWithdrawal?.withdrawRate &&
                      Number(pendingWithdrawal.withdrawRate) > 0 && (
                        <>at {pendingWithdrawal.withdrawRate}% </>
                      )}
                  </span>
                </div>
                <Button
                  className="w-full mt-2"
                  onClick={onCompleteWithdraw}
                  disabled={
                    !isConnected ||
                    isCompletingWithdraw ||
                    !pendingWithdrawal.isClaimable
                  }
                  variant="primary"
                  isLoading={isCompletingWithdraw}
                >
                  {isCompletingWithdraw ? "Processing..." : copy.cta}
                </Button>
              </div>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
};
