const fs = require("fs");
const path = require("path");
const { Octokit } = require("octokit");
const dotenv = require("dotenv");

dotenv.config();

const isProduction = process.env.NODE_ENV === "production";
const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
const GITHUB_PATH = process.env.GITHUB_PATH;
const VAULTS_CONFIG_PATH = "vaults.config.json";

async function fetchVaults() {
  if (!GITHUB_TOKEN || !GITHUB_PATH) {
    throw new Error("Missing GITHUB_TOKEN or GITHUB_PATH in .env");
  }

  const octokit = new Octokit({
    auth: GITHUB_TOKEN,
  });

  const response = await octokit.request(
    "GET /repos/{owner}/{repo}/contents/{path}",
    {
      owner: "timewave-computer",
      repo: "vault-customer-configs",
      path: GITHUB_PATH,
      headers: {
        "X-GitHub-Api-Version": "2022-11-28",
      },
    },
  );

  const content = Buffer.from(response.data.content, "base64").toString();
  return content;
}

async function main() {
  try {
    if (!isProduction) {
      console.log(
        "Not fetching vaults in non-production environment. Please modify vaults.config.json in the root folder, or set NODE_ENV to production.",
      );
      return;
    }
    const data = await fetchVaults();
    const outputPath = path.join(process.cwd(), VAULTS_CONFIG_PATH);
    fs.writeFileSync(outputPath, data);
    console.log("Successfully fetched and saved ", VAULTS_CONFIG_PATH);
  } catch (error) {
    console.error("Error fetching vaults:", error);
    process.exit(1);
  }
}

main();
