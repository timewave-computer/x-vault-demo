"use server";
import fs from "fs";
import path from "path";
import { z } from "zod";
import { Address } from "viem";

/***
 * Reads the vaults config from the vaults.config.json file
 * and returns the config as an array of VaultConfig objects
 */

const VAULTS_CONFIG_READ_PATH = "public/vaults.config.json";

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
    const vaultsPath = path.join(process.cwd(), VAULTS_CONFIG_READ_PATH);
    console.log("searching for vaults config at", vaultsPath);
    const isExists = fs.existsSync(vaultsPath);
    if (!isExists) {
      throw new Error(
        `${VAULTS_CONFIG_READ_PATH} not found at ${vaultsPath}. See README.md for more info.`,
      );
    }
    const vaultsData = JSON.parse(fs.readFileSync(vaultsPath, "utf-8"));

    // Validate against schema
    const validatedData = VaultConfigSchema.array().parse(vaultsData);
    return Promise.resolve(validatedData as VaultConfig[]);
  } catch (error) {
    console.error(
      "Error reading or validating ",
      VAULTS_CONFIG_READ_PATH,
      error,
    );
    throw new Error("Failed to read or validate vaults configuration");
  }
}
