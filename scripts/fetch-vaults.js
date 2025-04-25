const fs = require("fs");
const path = require("path");
const { Octokit } = require("octokit");
const dotenv = require("dotenv");

dotenv.config();

const isProduction = process.env.NODE_ENV === "production";
const GITHUB_ACCESS_TOKEN = process.env.VAULT_CONFIG_ACCESS_TOKEN;
const FILE_PATH = process.env.VAULT_CONFIG_FILE_PATH_URL;

const WRITE_PATH = "vaults.config.json";

async function fetchVaults() {
  if (!GITHUB_ACCESS_TOKEN || !FILE_PATH) {
    throw new Error("Missing GITHUB_ACCESS_TOKEN or FILE_PATH in .env");
  }

  const octokit = new Octokit({
    auth: GITHUB_ACCESS_TOKEN,
  });

  const response = await octokit.request(
    "GET /repos/{owner}/{repo}/contents/{path}",
    {
      owner: "timewave-computer",
      repo: "vault-customer-configs",
      path: FILE_PATH,
      headers: {
        "X-GitHub-Api-Version": "2022-11-28",
      },
    },
  );

  return {
    url: response.url,
    content: Buffer.from(response.data.content, "base64").toString(),
  };
}

async function main() {
  console.log("Fetching remote vaults config...");
  try {
    if (!isProduction) {
      console.log(
        "Not fetching vaults in non-production environment. Please modify vaults.config.json in the root folder, or set NODE_ENV to production.",
      );
      return;
    }
    const { content, url } = await fetchVaults();
    console.log("Successfully fetched remote vaults config from", url);
    const outputPath = path.join(process.cwd(), WRITE_PATH);
    fs.writeFileSync(outputPath, content);
    console.log("Saved remote vaults config to", WRITE_PATH);
  } catch (error) {
    console.error("Error fetching vaults:", error);
    process.exit(1);
  }
}

main();
