#!/bin/bash

# Exit on error
set -e

# Generate a random private key for deployment
DEPLOYER_PRIVATE_KEY=$(cast wallet new | grep "Private key" | cut -d: -f2 | tr -d ' ')

# Export the private key for the deployment script
export DEPLOYER_PRIVATE_KEY

echo "Deploying vaults to local Anvil network..."

# Build and deploy the contracts
forge script script/DeployVaults.s.sol:DeployVaults \
    --rpc-url http://localhost:8545 \
    --broadcast \
    --private-key $DEPLOYER_PRIVATE_KEY

echo "Vaults deployed successfully!" 