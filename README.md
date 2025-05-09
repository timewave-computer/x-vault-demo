# X—Vault Demo App

![X—Vault Demo App Screenshot](./readme_screenshot.png)

A simple web application for interacting with ERC-4626 vault contracts on Ethereum mainnet in order to integrate with Valence cross-chain vaults. Built with Next.js, Tailwind CSS, and wagmi. Nix reproducible environment and Foundry/Anvil for local Ethereum development.

## Development

1. set up environment variables

```bash
cp .env.example .env
```

2. Add `vaults.config.json` file
   Copy `example.vaults.config.json` and rename the file.

This file tells the UI which contracts to read. The repo is set up to not commit the config. For development you can save the file locally, and for deployment you can fetch from a private github repository.

To opt out of this, by delete the `fetch-remote-config` and `build-with-remote` npm scripts. Then, simply commit the config file and use the `build` command for deployment.

Create reown project and wallet connect project and add. You can opt-in to use the optional ones later.

3. start server
   NOTE: MAKE SURE YOU DID STEP #2 and created a `vaults.config.json`.

```bash
nix develop
npm install
npm run start
```

4. Add testnet to your browser wallet as a custom network:
   - Network Name: Vaults Test Env (or any name)
   - RPC URL: http://localhost:8545 (or any anvil rpc)
   - Chain ID: 31337
   - Currency Symbol: ETH

## Deployment

1. deploy with local vaults config (have to remove file from .gitignore)

```bash
npm run build
```

2. deploy with remotely saved vaults config
   The included script will fetch the json file from a private github repository.

```bash
npm run build-with-remote
```

## About `vaults.config.json`

The `vaults.config.json` file contains an array of vault configurations. Each vault object has the following fields:

- `chainId`: The ID of the blockchain network where the vault is deployed (e.g., 31337 for local testnet, 1 for Ethereum mainnet)
- `vaultId`: A unique identifier for the vault used internally by the application
- `vaultAddress`: The Ethereum address of the vault contract
- `vaultProxyAddress`: The address of the proxy contract if the vault uses upgradeable contracts
- `tokenAddress`: The address of the ERC-20 token that the vault accepts as deposits
- `transactionConfirmationTimeout`: Maximum time (in milliseconds) to wait for transaction confirmations
- `startBlock`: The block number from which to start scanning for vault events
- `name`: Human-readable name of the vault
- `description`: A brief description of the vault's purpose and strategy
- `token`: The symbol of the token accepted by the vault (e.g., "USDC", "ETH")
- `aprRequest`: Configuration for fetching the vault's APR (Annual Percentage Rate)
  - `type`: The source type for APR data ("api" or "contract")
  - For API requests:
    - `url`: The endpoint URL
    - `method`: HTTP method (GET, POST, etc.)
    - `headers`: Optional HTTP headers
    - `body`: Optional request body
  - For contract requests:
    - `address`: The contract address
    - `abi`: Contract ABI array
    - `functionName`: Name of the function to call
    - `args`: Optional arguments for the function call
    - NOTE: this is supported but not tested in production

## Deprecated npm scripts

start-anvil, manage-key, deploy-vaults, faucet are deprecated. They are for use with a local env.

# DEPRECATED DOCS

## Development

1. Enter environment and install dependencies:

   ```bash
   nix develop
   ```

   This will automatically install all dependencies and set up your development environment.

2. Start the local Anvil node (Ethereum testnet):

   ```bash
   start-anvil
   ```

   This will start a local Ethereum node that forks mainnet, giving you access to real mainnet state while allowing local testing.

   The node will run with the following configuration:

   - Chain ID: 31337
   - Block time: 12 seconds
   - Initial account balance: 10,000 ETH
   - RPC URL: http://localhost:8545
   - Fork Block: 19,250,000

3. Generate a deployer key and deploy the vaults:

   ```bash
   # Generate a new deployer key, select option 1 to generate a new key
   manage-key

   # Deploy vaults
   deploy-vaults
   ```

   This will deploy the test tokens (WETH, USDC, DAI) and their corresponding vaults.

4. Configure your browser wallet:

   - Network Name: Anvil Local
   - RPC URL: http://localhost:8545
   - Chain ID: 31337
   - Currency Symbol: ETH

5. Get test tokens using the faucet:

   ```bash
   # Check your wallet's current balances
   faucet balance YOUR_WALLET_ADDRESS

   # Mint some test tokens
   faucet mint YOUR_WALLET_ADDRESS ETH 10   # Get 10 ETH
   faucet mint YOUR_WALLET_ADDRESS WETH 10  # Get 10 WETH
   faucet mint YOUR_WALLET_ADDRESS USDC 100 # Get 100 USDC
   faucet mint YOUR_WALLET_ADDRESS DAI 100  # Get 100 DAI
   ```

6. Start the development server:

   ```bash
   npm run dev
   ```

7. Open [http://localhost:3000](http://localhost:3000) in your browser.

## Environment Variables

The project uses two environment files:

### `.env` (Persistent Environment)

This file stores persistent environment variables and is created by the `manage-key` command if it does not yet exist. It should contain:

```bash
# Persistent environment variables
DEPLOYER_PRIVATE_KEY=<your-deployer-private-key>
DEPLOYER_ADDRESS=<your-deployer-address>
NEXT_PUBLIC_REOWN_PROJECT_ID=<reown-project-id>
```

Do not commit this file to version control.

### `.env.local` (Session Environment)

**NOTE** `deploy-vaults` is deprecated. The UI will not read from these variables. See [#4](https://github.com/timewave-computer/x-vault-demo/issues/4).

This file is automatically generated by the `deploy-vaults` command and contains the deployed contract addresses:

```bash
# Session-specific environment variables
NEXT_PUBLIC_WETH_ADDRESS=<deployed-weth-address>
NEXT_PUBLIC_USDC_ADDRESS=<deployed-usdc-address>
NEXT_PUBLIC_DAI_ADDRESS=<deployed-dai-address>
NEXT_PUBLIC_WETH_VAULT_ADDRESS=<deployed-eth-vault-address>
NEXT_PUBLIC_USDC_VAULT_ADDRESS=<deployed-usdc-vault-address>
NEXT_PUBLIC_DAI_VAULT_ADDRESS=<deployed-dai-vault-address>
```

This file is regenerated each time you run `deploy-vaults` and should not be committed to version control.

## Available Commands

The development environment provides several useful commands:

- `start-anvil`: Start the local Ethereum testnet
- `manage-key`: Manage deployer private key
- `deploy-vaults`: Deploy test vaults to local network. NOTE: deprecated
- `faucet`: Manage token balances
  - `faucet balance <address>`: Show token balances
  - `faucet mint <address> <token> <amount>`: Mint tokens to address
  - `faucet burn <address> <token> <amount>`: Burn tokens from address
  - `faucet`: Show help menu
- `npm run dev`: Start Next.js development server

## Commit Hooks

The project is configured to reformat all staged files on commit, using `prettier` and `husky`.
