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
