import { formatUnits } from "viem";

const defaultDisplayDecimals = 4;

export function formatBigInt(
  _value: bigint | undefined,
  decimals: number,
  symbol: string,
  options?: {
    displayDecimals?: number; // fraction precision
  },
): string {
  const value = _value ?? BigInt(0);
  const displayDecimals = options?.displayDecimals ?? defaultDisplayDecimals;

  // Use formatUnits to shift the decimal point
  const formatted = formatUnits(value, decimals);

  // Split into whole and decimal parts
  const [whole, decimal] = formatted.split(".");

  // Format decimal part to desired precision
  const formattedDecimal = decimal
    ? decimal.slice(0, displayDecimals).padEnd(displayDecimals, "0")
    : "0".repeat(displayDecimals);

  if (symbol === "") {
    return `${whole}.${formattedDecimal}`;
  }
  if (symbol === "%") {
    return `${whole}.${formattedDecimal}%`;
  }

  return `${whole}.${formattedDecimal} ${symbol}`;
}
