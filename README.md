# X—Vault Demo App

![X—Vault Demo App Screenshot](./readme_screenshot.png)

A simple web application for interacting with ERC-4626 vault contracts on Ethereum mainnet in order to integrate with Valence cross-chain vaults. Built with Next.js, Tailwind CSS, and wagmi. Nix reproducible environment and Foundry/Anvil for local Ethereum development.

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
   - Chain ID: 1337
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
   - Chain ID: 1337
   - Currency Symbol: ETH

5. Start the development server:
   ```bash
   npm run dev
   ```

6. Open [http://localhost:3000](http://localhost:3000) in your browser.

## Available Commands

The development environment provides several useful commands:

- `start-anvil`: Start the local Ethereum testnet
- `manage-key`: Manage deployer private key
- `deploy-vaults`: Deploy test vaults to local network
- `faucet`: Manage token balances
  - `faucet balance <address>`: Show token balances
  - `faucet mint <address> <token> <amount>`: Mint tokens to address
  - `faucet burn <address> <token> <amount>`: Burn tokens from address
- `npm run dev`: Start Next.js development server
