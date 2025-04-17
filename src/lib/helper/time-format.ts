export const formatHoursToDays = (hours: number) => {
  return Math.floor(hours / 24);
};

/**
 * Converts a BigInt Unix timestamp to a UTC date string
 * @param timestamp - The BigInt Unix timestamp (in seconds)
 * @param format - Optional format string (default: 'toLocaleString')
 * @returns Formatted UTC date string
 */
export const formatTimestampToUTC = (
  timestamp: bigint | undefined,
  format: "toLocaleString" | "toISOString" | "toUTCString" = "toLocaleString",
): string => {
  if (!timestamp) return "N/A";

  // Convert BigInt to number and multiply by 1000 to get milliseconds
  const date = new Date(Number(timestamp) * 1000);

  // Return formatted date based on requested format
  switch (format) {
    case "toISOString":
      return date.toISOString();
    case "toUTCString":
      return date.toUTCString();
    case "toLocaleString":
    default:
      return date.toLocaleString("en-US", {
        timeZone: "UTC",
        year: "numeric",
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
      });
  }
};
