import { z } from "zod";

/***
 * For validating the vaults.config.json file
 * Useful if fetching file from a remote source
 */

const aprContractRequestSchema = z.object({
  type: z.literal("contract"),
  address: z.string(),
  abi: z.array(z.string()),
  functionName: z.string(),
  args: z.array(z.string()),
});

const aprApiRequestSchema = z.object({
  type: z.literal("api"),
  url: z.string(),
  method: z.string(),
  headers: z.record(z.string(), z.string()),
  body: z.record(z.string(), z.string()),
});

const aprRequestSchema = z.union([
  aprContractRequestSchema,
  aprApiRequestSchema,
]);

export const vaultConfigSchema = z.object({
  chainId: z.number(),
  vaultId: z.string(),
  vaultAddress: z
    .string()
    .regex(/^0x[a-fA-F0-9]{40}$/, "Invalid vault address"),
  vaultProxyAddress: z
    .string()
    .regex(/^0x[a-fA-F0-9]{40}$/, "Invalid vault proxy address"),
  tokenAddress: z
    .string()
    .regex(/^0x[a-fA-F0-9]{40}$/, "Invalid token address"),
  transactionConfirmationTimeout: z.number(),
  startBlock: z.number(),
  copy: z.object({
    name: z.string(),
    description: z.string(),
    onDepositSuccess: z.string().optional(),
    vaultPath: z.string().optional(),
  }),
  token: z.string(),
  aprRequest: aprRequestSchema,
});
