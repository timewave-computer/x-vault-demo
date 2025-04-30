import { formatUnits } from "viem";
import { Card } from "@/components";

interface BaseEventCardProps {
  title: string;
  children: React.ReactNode;
}

export function EventCard({ title, children }: BaseEventCardProps) {
  return (
    <Card variant="primary">
      <div className="mb-6">
        <h3 className="text-lg font-beast text-accent-purple mb-1">
          event = {title}
        </h3>
      </div>
      <div className="space-y-4">{children}</div>
    </Card>
  );
}

export interface DepositEventProps {
  deposits: Array<{
    transactionHash: string | `0x${string}`;
    assets: string;
    shares: string;
    blockNumber: number | bigint;
    sender: string | `0x${string}`;
    owner: string | `0x${string}`;
  }>;
}

export function DepositEvents({ deposits }: DepositEventProps) {
  if (!deposits || deposits.length === 0) return null;

  return (
    <div className="mt-8">
      <EventCard title="Deposit">
        {deposits.map((deposit) => (
          <div
            key={deposit.transactionHash.toString()}
            className="flex flex-col sm:flex-row sm:items-center justify-between p-4 bg-white rounded-lg border border-gray-200 overflow-x-scroll"
          >
            <div className="mb-4 sm:mb-0">
              <p className="text-base font-medium text-gray-900">
                {deposit.assets} assets
              </p>
              <p className="text-sm text-gray-500">
                {deposit.shares} shares minted
              </p>
              <p className="text-sm text-gray-500">
                Block:{" "}
                <a
                  href={`https://etherscan.io/block/${deposit.blockNumber}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm opacity-90 hover:underline mt-1"
                >
                  {deposit.blockNumber.toString()}
                </a>
              </p>
              <p className="text-sm text-gray-500">Sender: {deposit.sender}</p>
              <p className="text-sm text-gray-500">Owner: {deposit.owner}</p>
            </div>
          </div>
        ))}
      </EventCard>
    </div>
  );
}

export interface WithdrawEventProps {
  withdrawRequests: Array<{
    transactionHash: string | `0x${string}`;
    shares: string;
    blockNumber: number | bigint;
    owner?: string | `0x${string}`;
    updateId: string | number;
    withdrawRate: string;
    claimTime: string;
    updateTimestamp: string;
    maxLossBps?: string;
    solverEnabled?: boolean;
    receiver?: string | `0x${string}`;
    withdrawFee?: number;
  }>;
}

export function WithdrawEvents({ withdrawRequests }: WithdrawEventProps) {
  if (!withdrawRequests || withdrawRequests.length === 0) return null;

  return (
    <div className="mt-8">
      <EventCard title="Withdraw">
        {withdrawRequests.map((withdrawal) => (
          <div
            key={withdrawal.transactionHash.toString()}
            className="flex flex-col sm:flex-row sm:items-center justify-between p-4 bg-white rounded-lg border border-gray-200 overflow-x-scroll"
          >
            <div className="mb-4 sm:mb-0">
              <p className="text-base font-medium text-gray-900">
                {withdrawal.shares} shares
              </p>
              <p className="text-sm text-gray-500">
                Initiated on block:{" "}
                <a
                  href={`https://etherscan.io/block/${withdrawal.blockNumber}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm opacity-90 hover:underline mt-1"
                >
                  {withdrawal.blockNumber.toString()}
                </a>
              </p>
              <p className="text-sm text-gray-500">
                Owner: {withdrawal.owner || "N/A"}
              </p>
              <p className="text-sm text-gray-500">
                Update ID: {withdrawal.updateId.toString()}
              </p>
              <p className="text-sm text-gray-500">
                Withdraw rate: {withdrawal.withdrawRate}
              </p>
              <p className="text-sm text-gray-500">
                Claimable after: {withdrawal.claimTime}
              </p>
              <p className="text-sm text-gray-500">
                Update Timestamp: {withdrawal.updateTimestamp}
              </p>
            </div>
          </div>
        ))}
      </EventCard>
    </div>
  );
}

export interface UpdateProcessedEventProps {
  processedUpdates: Array<{
    transactionHash: string | `0x${string}`;
    blockNumber: number | bigint;
    args?: {
      updateId?: bigint;
      withdrawRate?: bigint;
      totalAssetsToWithdraw?: bigint;
    };
    [key: string]: any;
  }>;
  tokenDecimals?: number;
  shareDecimals?: number;
}

export function UpdateProcessedEvents({
  processedUpdates,
  tokenDecimals,
  shareDecimals,
}: UpdateProcessedEventProps) {
  if (!processedUpdates || processedUpdates.length === 0) return null;

  return (
    <div className="mt-8">
      <EventCard title="UpdateProcessed">
        {processedUpdates.map((update) => (
          <div
            key={update.transactionHash.toString()}
            className="flex flex-col sm:flex-row sm:items-center justify-between p-4 bg-white rounded-lg border border-gray-200 overflow-x-scroll"
          >
            <div className="mb-4 sm:mb-0">
              <p className="text-base font-medium text-gray-900">
                Update ID: {update.args?.updateId?.toString() || "N/A"}
              </p>
              <p className="text-sm text-gray-500">
                Block:{" "}
                <a
                  href={`https://etherscan.io/block/${update.blockNumber}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm opacity-90 hover:underline mt-1"
                >
                  {update.blockNumber.toString()}
                </a>
              </p>
              <p className="text-sm text-gray-500">
                Withdraw Rate:{" "}
                {update.args?.withdrawRate && shareDecimals
                  ? formatUnits(update.args.withdrawRate, shareDecimals)
                  : "N/A"}
              </p>
              <p className="text-sm text-gray-500">
                Total Assets To Withdraw:{" "}
                {update.args?.totalAssetsToWithdraw && tokenDecimals
                  ? formatUnits(
                      update.args.totalAssetsToWithdraw,
                      tokenDecimals,
                    )
                  : "N/A"}
              </p>
              <p className="text-sm text-gray-500 ">
                Transaction:{" "}
                <a
                  href={`https://etherscan.io/tx/${update.transactionHash}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm opacity-90 hover:underline mt-1 "
                >
                  {update.transactionHash}
                </a>
              </p>
            </div>
          </div>
        ))}
      </EventCard>
    </div>
  );
}
