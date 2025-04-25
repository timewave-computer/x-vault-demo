"use server";
import fs from "fs";
import path from "path";
import { z } from "zod";
import { Address } from "viem";

const VAULTS_CONFIG_PATH = "vaults.config.json";

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
});

export type VaultConfig = z.infer<typeof VaultConfigSchema> & {
  vaultAddress: Address;
  vaultProxyAddress: Address;
  tokenAddress: Address;
  startBlock: bigint;
};

export async function getVaultsConfig() {
  try {
    const vaultsPath = path.join(process.cwd(), VAULTS_CONFIG_PATH);
    const isExists = fs.existsSync(vaultsPath);
    if (!isExists) {
      throw new Error(
        `${VAULTS_CONFIG_PATH} not found. See README.md for more info.`,
      );
    }
    const vaultsData = JSON.parse(fs.readFileSync(vaultsPath, "utf-8"));

    // Validate against schema
    const validatedData = VaultConfigSchema.array().parse(vaultsData);
    return Promise.resolve(validatedData as VaultConfig[]);
  } catch (error) {
    console.error("Error reading or validating ", VAULTS_CONFIG_PATH, error);
    throw new Error("Failed to read or validate vaults configuration");
  }
}
