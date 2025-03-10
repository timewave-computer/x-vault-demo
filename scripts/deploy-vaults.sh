#!/usr/bin/env bash

# Update any references from script/ to scripts/
SCRIPT_DIR="$(dirname "$(readlink -f "$0")")"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"

# ... existing code ... 

# Build and deploy the contracts
if ! ${pkgs.foundry}/bin/forge script scripts/DeployVaults.sol:DeployVaults \
  --rpc-url http://localhost:8545 \
  --broadcast \
  --private-key $DEPLOYER_PRIVATE_KEY 2>&1 | tee deployment.log; then
  echo "Error: Deployment failed. Check deployment.log for details."
  exit 1
fi

# ... existing code ... 