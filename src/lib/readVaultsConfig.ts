"use server";
import { z } from "zod";
import { Address } from "viem";
import vaultsConfig from "../../vaults.config.json";

/***
 * Reads the vaults config from the vaults.config.json file
 * and returns the config as an array of VaultConfig objects
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

const VaultConfigSchema = z.object({
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
  name: z.string(),
  description: z.string(),
  token: z.string(),
  aprRequest: aprRequestSchema,
});

export type VaultConfig = z.infer<typeof VaultConfigSchema> & {
  vaultAddress: Address;
  vaultProxyAddress: Address;
  tokenAddress: Address;
  startBlock: bigint;
};

export async function readVaultsConfig() {
  try {
    // Validate against schema
    const validatedData = VaultConfigSchema.array().parse(vaultsConfig);
    return Promise.resolve(validatedData as VaultConfig[]);
  } catch (error) {
    console.error(
      "Error reading or validating vaults config. Config:",
      JSON.stringify(vaultsConfig),
      error,
    );
    throw new Error("Failed to read or validate vaults configuration");
  }
}
