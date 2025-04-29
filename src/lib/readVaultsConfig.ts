"use server";
import { vaultConfigSchema } from "@/lib";
import { type VaultConfig } from "@/context";

// NOTE: if this file does not exist, create from example.vaults.config.json
import vaultsConfig from "../../vaults.config.json";

/***
 * Reads and validates the vaults config from the file system from vaults.config.json

 * This method is necessary if vaults.config.json is fetched from a remote source, because it is fetched on build time
 * This can be removed and the config file accessed by direct import if vaults.config.json is committed to the repository
 *
 */

export async function readVaultsConfig() {
  try {
    // Validate against schema
    const validatedData = vaultConfigSchema.array().parse(vaultsConfig);
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
