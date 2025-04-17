import { formatUnits } from "viem";

const defaultDisplayDecimals = 4;

export function formatTokenAmount(
  _value: bigint | undefined,
  symbol: string,
  options: {
    displayDecimals?: number; // fraction precision
    formatUnits?: number; // wei -> eth
  },
): string {
  if (!_value || _value === BigInt(0)) {
    return `0 ${symbol}`;
  }

  let formattedValue: number;

  if (options.formatUnits) {
    formattedValue = Number(formatUnits(_value, options.formatUnits));
  } else formattedValue = Number(_value);

  return `${formattedValue.toFixed(options.displayDecimals ?? defaultDisplayDecimals)} ${symbol}`;
}
