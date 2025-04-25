const fs = require("fs");
const path = require("path");
const https = require("https");

const VAULT_CONFIG_URL = process.env.VAULT_CONFIG_URL;
const isProduction = process.env.NODE_ENV === "production";

function fetchVaults(url) {
  return new Promise((resolve, reject) => {
    https
      .get(url, (res) => {
        let data = "";

        res.on("data", (chunk) => {
          data += chunk;
        });

        res.on("end", () => {
          try {
            // Validate that the data is valid JSON
            JSON.parse(data);
            resolve(data);
          } catch (e) {
            reject(new Error("Invalid JSON received"));
          }
        });
      })
      .on("error", (err) => {
        reject(err);
      });
  });
}

async function main() {
  try {
    if (!isProduction) {
      console.log(
        "Not fetching vaults in non-production environment. Please modify vaults.config.  json in the root folder.",
      );
      return;
    } else if (!VAULT_CONFIG_URL) {
      console.log(
        "VAULT_CONFIG_URL is not set. Please set it in the .env file.",
      );
      return;
    }
    const data = await fetchVaults(VAULT_CONFIG_URL);
    const outputPath = path.join(process.cwd(), "vaults.config.json");
    fs.writeFileSync(outputPath, data);
    console.log("Successfully fetched and saved vaults.config.json");
  } catch (error) {
    console.error("Error fetching vaults:", error);
    process.exit(1);
  }
}

main();
