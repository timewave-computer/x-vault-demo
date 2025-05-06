export const formatHoursToDays = (hours: number) => {
  return Math.floor(hours / 24);
};

// converts a bigint to a unix timestamp in milliseconds example: 1745518813154
export const formatBigIntToTimestamp = (timestamp: bigint) => {
  // convert bigint to number and multiply by 1000 to get milliseconds
  return Number(timestamp) * 1000;
};

// returns unix timestamp in milliseconds example: 1745518813154
export const dateToUnixTimestamp = (date: Date): number => {
  return Math.floor(date.getTime());
};

/**
 * Converts a BigInt Unix timestamp to a date string
 * @param timestamp - The BigInt Unix timestamp (in seconds)
 * @param format - Optional format string (default: 'toLocaleString')
 * @param timezone - Optional timezone (default: 'local', can be 'UTC')
 * @returns Formatted date string
 */
export const unixTimestampToDateString = (
  timestamp: number | undefined,
  format: "toLocaleString" | "toISOString" | "toUTCString" = "toLocaleString",
): string => {
  if (!timestamp) return "N/A";

  // Convert BigInt to number and multiply by 1000 to get milliseconds
  const date = new Date(timestamp);

  const timeZoneName = new Intl.DateTimeFormat("en-US", {
    timeZoneName: "short",
  })
    .format(date)
    .split(" ")
    .pop();

  // Return formatted date based on requested format
  switch (format) {
    case "toISOString":
      // 2025-04-23T18:27:35.000Z
      return date.toISOString();
    case "toUTCString":
      // Wed, 23 Apr 2025 18:27:35 UTC
      return date.toUTCString().replace("GMT", "UTC");
    case "toLocaleString":
    default:
      // Apr 23, 2025, 04:36:20 PM EDT
      return `${date.toLocaleString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
      })} ${timeZoneName}`;
  }
};

/**
 * Calculates and formats the remaining time until a future timestamp
 * @param claimTimestamp - Future timestamp in milliseconds
 * @returns Formatted time string in "HH:MM:SS" or "DD:HH:MM:SS" format for longer timeframes
 */
export const formatRemainingTime = (
  endtimeStamp: number | undefined,
): string | null => {
  if (!endtimeStamp) return null;

  const now = Date.now();

  // If timestamp is in the past, return null
  if (endtimeStamp <= now) return null;

  // Calculate difference in seconds
  const diffInSeconds = Math.floor((endtimeStamp - now) / 1000);

  // For larger time frames, show days
  const days = Math.floor(diffInSeconds / 86400); // 86400 seconds in a day
  const hours = Math.floor((diffInSeconds % 86400) / 3600);
  const minutes = Math.floor((diffInSeconds % 3600) / 60);
  const seconds = diffInSeconds % 60;

  // Format with leading zeros
  const formattedHours = String(hours).padStart(2, "0");
  const formattedMinutes = String(minutes).padStart(2, "0");
  const formattedSeconds = String(seconds).padStart(2, "0");

  // Include days in the output if there are any
  if (days > 0) {
    const formattedDays = String(days).padStart(2, "0");
    return `${formattedDays}:${formattedHours}:${formattedMinutes}:${formattedSeconds}`;
  }

  return `${formattedHours}:${formattedMinutes}:${formattedSeconds}`;
};
