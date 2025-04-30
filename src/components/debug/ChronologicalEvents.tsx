import { formatUnits } from "viem";
import { Card } from "@/components";

type EventType = "Deposit" | "Withdraw" | "UpdateProcessed";

interface Event {
  type: EventType;
  blockNumber: number | bigint;
  transactionHash: string | `0x${string}`;
  data: any;
}

interface ChronologicalEventsProps {
  deposits: Array<{
    transactionHash: string | `0x${string}`;
    assets: string;
    shares: string;
    blockNumber: number | bigint;
    sender: string | `0x${string}`;
    owner: string | `0x${string}`;
  }>;
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

export function ChronologicalEvents({
  deposits,
  withdrawRequests,
  processedUpdates,
  tokenDecimals,
  shareDecimals,
}: ChronologicalEventsProps) {
  // Combine all events into a single array
  const allEvents: Event[] = [
    ...(deposits || []).map((deposit) => ({
      type: "Deposit" as EventType,
      blockNumber: deposit.blockNumber,
      transactionHash: deposit.transactionHash,
      data: deposit,
    })),
    ...(withdrawRequests || []).map((withdraw) => ({
      type: "Withdraw" as EventType,
      blockNumber: withdraw.blockNumber,
      transactionHash: withdraw.transactionHash,
      data: withdraw,
    })),
    ...(processedUpdates || []).map((update) => ({
      type: "UpdateProcessed" as EventType,
      blockNumber: update.blockNumber,
      transactionHash: update.transactionHash,
      data: update,
    })),
  ];

  // Sort events by block number (ascending order - oldest first)
  const sortedEvents = [...allEvents].sort((a, b) => {
    const blockA = BigInt(a.blockNumber.toString());
    const blockB = BigInt(b.blockNumber.toString());
    return blockA > blockB ? 1 : blockA < blockB ? -1 : 0;
  });

  if (sortedEvents.length === 0) {
    return (
      <div className="text-center mt-8 p-4 bg-gray-50 rounded-lg">
        <p className="text-gray-500">No events found</p>
      </div>
    );
  }

  return (
    <div className="mt-8">
      <Card variant="primary">
        <div className="mb-6">
          <h3 className="text-lg font-beast text-accent-purple mb-1">
            Chronological Events
          </h3>
        </div>
        <div className="space-y-4">
          {sortedEvents.map((event) => (
            <div
              key={event.transactionHash.toString()}
              className="flex flex-col p-4 bg-white rounded-lg border border-gray-200 overflow-x-scroll"
            >
              <div className="mb-2 flex justify-between items-center">
                <span className="px-2 py-1 text-xs font-medium rounded-full bg-accent-purple-light text-accent-purple">
                  {event.type}
                </span>
                <span className="text-xs text-gray-500">
                  Block: {event.blockNumber.toString()}
                </span>
              </div>

              {event.type === "Deposit" && (
                <DepositEventContent deposit={event.data} />
              )}
              {event.type === "Withdraw" && (
                <WithdrawEventContent withdraw={event.data} />
              )}
              {event.type === "UpdateProcessed" && (
                <UpdateEventContent
                  update={event.data}
                  tokenDecimals={tokenDecimals}
                  shareDecimals={shareDecimals}
                />
              )}
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}

// Individual event content components
function DepositEventContent({ deposit }: { deposit: any }) {
  return (
    <div>
      <p className="text-base font-medium text-gray-900">
        {deposit.assets} assets
      </p>
      <p className="text-sm text-gray-500">{deposit.shares} shares minted</p>
      <p className="text-sm text-gray-500">Sender: {deposit.sender}</p>
      <p className="text-sm text-gray-500">Owner: {deposit.owner}</p>
      <p className="text-sm text-gray-500 ">
        Transaction Hash:
        <a
          href={`https://etherscan.io/tx/${deposit.transactionHash}`}
          target="_blank"
          rel="noopener noreferrer"
          className="text-sm opacity-90 hover:underline"
        >
          {deposit.transactionHash}
        </a>
      </p>
    </div>
  );
}

function WithdrawEventContent({ withdraw }: { withdraw: any }) {
  return (
    <div>
      <p className="text-base font-medium text-gray-900">
        {withdraw.shares} shares
      </p>
      <p className="text-sm text-gray-500">Owner: {withdraw.owner || "N/A"}</p>
      <p className="text-sm text-gray-500">
        Update ID: {withdraw.updateId.toString()}
      </p>
      <p className="text-sm text-gray-500">
        Withdraw rate: {withdraw.withdrawRate}
      </p>
      <p className="text-sm text-gray-500">
        Claimable after: {withdraw.claimTime}
      </p>
      <p className="text-sm text-gray-500">
        Update Timestamp: {withdraw.updateTimestamp}
      </p>
      <p className="text-sm text-gray-500">
        Transaction Hash:
        <a
          href={`https://etherscan.io/tx/${withdraw.transactionHash}`}
          target="_blank"
          rel="noopener noreferrer"
          className="text-sm opacity-90 hover:underline"
        >
          {withdraw.transactionHash}
        </a>
      </p>
    </div>
  );
}

function UpdateEventContent({
  update,
  tokenDecimals,
  shareDecimals,
}: {
  update: any;
  tokenDecimals?: number;
  shareDecimals?: number;
}) {
  return (
    <div>
      <p className="text-base font-medium text-gray-900">
        Update ID: {update.args?.updateId?.toString() || "N/A"}
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
          ? formatUnits(update.args.totalAssetsToWithdraw, tokenDecimals)
          : "N/A"}
      </p>
      <p className="text-sm text-gray-500">
        Transaction Hash:
        <a
          href={`https://etherscan.io/tx/${update.transactionHash}`}
          target="_blank"
          rel="noopener noreferrer"
          className="text-sm opacity-90 hover:underline"
        >
          {update.transactionHash}
        </a>
      </p>
    </div>
  );
}
