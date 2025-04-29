const fs = require("fs");
const path = require("path");
const { Octokit } = require("octokit");
const dotenv = require("dotenv");

dotenv.config();

const isDevelopment = process.env.NODE_ENV === "development";
const GITHUB_ACCESS_TOKEN = process.env.VAULT_CONFIG_ACCESS_TOKEN;
const FILE_PATH = process.env.VAULT_CONFIG_FILE_PATH_URL;

const VAULTS_CONFIG_PATH = "vaults.config.json";

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
    if (isDevelopment) {
      console.log(
        "Not fetching vaults for development environment. Please modify vaults.config.json in the root folder, or set NODE_ENV to production.",
      );
      return;
    }
    const { content, url } = await fetchVaults();
    console.log("Successfully fetched remote vaults config from", url);

    try {
      // Save to root directory for serverless environments
      const rootOutputPath = path.join(process.cwd(), VAULTS_CONFIG_PATH);
      fs.writeFileSync(rootOutputPath, content);
      console.log("Saved remote vaults config to", VAULTS_CONFIG_PATH);
    } catch (error) {
      console.error("Error saving config files:", error);
      // Continue even if public directory save fails
    }
  } catch (error) {
    console.error("Error fetching vaults:", error);
    process.exit(1);
  }
}

main();
