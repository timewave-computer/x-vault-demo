import { formatUnits } from "viem";

const defaultDisplayDecimals = 4;

export function formatBigInt(
  _value: bigint | undefined,
  decimals: number,
  symbol: string,
  options: {
    displayDecimals?: number; // fraction precision
  },
): string {
  const value = !_value || _value === BigInt(0) ? BigInt(0) : _value;

  const float = parseFloat(formatUnits(value, decimals)); // WARNING: this will truncate to 15 significant figures. Needs to be revisited.
  const formattedValue = float.toFixed(
    options.displayDecimals ?? defaultDisplayDecimals,
  );

  if (symbol === "") {
    return formattedValue;
  }

  return `${formattedValue} ${symbol}`;
}

export function formatNumber(
  value: number | undefined = 0,
  symbol: string,
  options: {
    displayDecimals?: number; // fraction precision
  },
): string {
  const formattedValue = value.toFixed(
    options.displayDecimals ?? defaultDisplayDecimals,
  );

  if (symbol === "") {
    return formattedValue;
  }

  return `${formattedValue} ${symbol}`;
}
