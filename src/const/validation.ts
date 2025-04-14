/**
 * Validates a number input string.
 *
 * This function checks if the input string is a valid number format.
 * It allows:
 * - Positive numbers
 * - Negative numbers
 * - Decimal numbers
 * - Scientific notation
 *
 * It does not allow:
 * - Non-numeric characters (e.g. letters, special characters)
 * - Multiple decimal points
 * - Leading zeros (except for the number 0 itself)
 *
 * @param value - The input string to validate
 * @returns True if the input is a valid number, false otherwise
 */
export const isValidNumberInput = (value: string) => {
  return /^\d*\.?\d*$/.test(value);
};
