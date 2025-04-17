// Helper function to handle BigInt serialization

export const jsonStringify = (value: object) => {
  return JSON.stringify(value, bigIntReplacer, 2);
};

const bigIntReplacer = (_key: string, value: any) => {
  if (typeof value === "bigint") {
    return value.toString();
  }
  return value;
};
