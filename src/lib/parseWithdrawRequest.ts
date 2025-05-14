import { formatBigIntToTimestamp, formatRemainingTime } from "@/lib";

export const parseWithdrawRequest = (
  withdrawRequest?: readonly [
    `0x${string}`,
    bigint,
    number,
    `0x${string}`,
    number,
    bigint,
    bigint,
  ],
) => {
  if (!withdrawRequest || withdrawRequest.length !== 7) return undefined;
  const owner = withdrawRequest?.[0];
  const _claimableAtTimestamp = withdrawRequest?.[1];
  const maxLossBps = withdrawRequest?.[2];
  const receiver = withdrawRequest?.[3];
  const updateId = withdrawRequest?.[4];
  const solverFee = withdrawRequest?.[5];
  const withdrawSharesAmount = withdrawRequest?.[6];

  // add 1 minute to simulate a 1 minute delay in claiming. The current env is has a wait period of 1 second so this simulates the delay
  const claimableAtTimestamp = _claimableAtTimestamp
    ? formatBigIntToTimestamp(_claimableAtTimestamp) + 1000 * 60
    : null;
  const timeRemaining = claimableAtTimestamp
    ? formatRemainingTime(claimableAtTimestamp)
    : null;
  return {
    owner,
    timeRemaining,
    maxLossBps,
    receiver,
    updateId,
    solverFee,
    withdrawSharesAmount,
    claimableAtTimestamp,
  };
};
