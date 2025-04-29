import { VaultConfig } from "@/lib";
import { readContract } from "wagmi/actions";
import type { Config } from "wagmi";

/**
 * Fetches APR data from an API endpoint
 */
export async function fetchAprFromApi(
  vaultConfig: VaultConfig,
): Promise<number> {
  const {
    url,
    method,
    headers = {},
    body = {},
  } = vaultConfig.aprRequest as {
    type: "api";
    url: string;
    method: string;
    headers?: Record<string, string>;
    body?: Record<string, string>;
  };

  // Replace any placeholder variables in the URL
  const resolvedUrl = url.replace(/{vaultId}/g, vaultConfig.vaultId);

  try {
    const response = await fetch(resolvedUrl, {
      method: method || "GET",
      headers,
      body:
        method !== "GET" && Object.keys(body).length > 0
          ? JSON.stringify(body)
          : undefined,
    });

    if (!response.ok) {
      throw new Error(`API request failed with status ${response.status}`);
    }

    const data = await response.json();

    // If a responseField is specified, extract that field from the response
    const responseField = (vaultConfig.aprRequest as any).responseField;
    const aprValue = responseField ? data[responseField] : data;

    return Number(aprValue);
  } catch (error) {
    console.error(
      `Error fetching APR from API for vault ${vaultConfig.vaultId}:`,
      error,
    );
    throw error;
  }
}

/**
 * Fetches APR data from a smart contract
 */
export async function fetchAprFromContract(
  vaultConfig: VaultConfig,
  config: Config,
  decimals: number,
): Promise<bigint> {
  const {
    address,
    abi,
    functionName,
    args = [],
  } = vaultConfig.aprRequest as {
    type: "contract";
    address: string;
    abi: string[];
    functionName: string;
    args?: string[];
  };

  const fetchedApr = await readContract(config, {
    address: address as `0x${string}`,
    abi: abi,
    functionName,
    args,
  });

  return fetchedApr as bigint;
}
