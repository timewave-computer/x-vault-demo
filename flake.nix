{
  description = "Next.js + Tailwind + Ethereum development environment";

  inputs = {
    nixpkgs.url = "github:NixOS/nixpkgs/nixos-unstable";
    flake-utils.url = "github:numtide/flake-utils";
  };

  outputs = { self, nixpkgs, flake-utils }:
    flake-utils.lib.eachDefaultSystem (system:
      let
        pkgs = nixpkgs.legacyPackages.${system};
        
        # Script to start the Anvil node
        start-anvil-script = pkgs.writeShellScriptBin "start-anvil" ''
          if [ -f .anvil.pid ]; then
            echo "Anvil process already running. Stopping it first..."
            kill $(cat .anvil.pid) 2>/dev/null || true
            rm .anvil.pid
          fi

          echo "Starting Anvil node..."
          ${pkgs.foundry}/bin/anvil \
            --block-time 12 \
            --chain-id 1337 \
            --balance 10000 \
            --fork-url https://eth-mainnet.public.blastapi.io \
            --fork-block-number 19250000 > anvil.log 2>&1 & echo $! > .anvil.pid

          # Wait for Anvil to start
          echo "Waiting for Anvil to initialize..."
          while ! grep -q "Listening on" anvil.log 2>/dev/null; do
            if ! kill -0 $(cat .anvil.pid) 2>/dev/null; then
              echo "Error: Anvil process died. Check anvil.log for details."
              exit 1
            fi
            sleep 1
          done

          echo "Anvil is ready! Listening on http://localhost:8545"
          echo "Process ID: $(cat .anvil.pid)"
          echo "Log file: anvil.log"

          # Setup trap to clean up on exit
          trap 'kill $(cat .anvil.pid) 2>/dev/null; rm .anvil.pid' EXIT

          # Keep the script running to maintain the trap
          tail -f anvil.log
        '';

        # Script to manage deployer private key
        manage-key-script = pkgs.writeShellScriptBin "manage-key" ''
          # Function to generate a new key
          generate_new_key() {
            NEW_KEY=$(${pkgs.foundry}/bin/cast wallet new | grep "Private key" | cut -d: -f2 | tr -d ' ')
            NEW_ADDRESS=$(${pkgs.foundry}/bin/cast wallet address "$NEW_KEY")
            
            # Write to .env file
            echo "DEPLOYER_PRIVATE_KEY=$NEW_KEY" > .env
            echo "DEPLOYER_ADDRESS=$NEW_ADDRESS" >> .env
            
            # Export variables to current environment
            export DEPLOYER_PRIVATE_KEY=$NEW_KEY
            export DEPLOYER_ADDRESS=$NEW_ADDRESS
            
            echo "New private key and address saved to .env file"
            echo "Corresponding address: $NEW_ADDRESS"
            echo "Environment variables have been set for the current session"
          }

          # Function to show current key info
          show_key_info() {
            if [ -n "$DEPLOYER_PRIVATE_KEY" ]; then
              if [ -n "$DEPLOYER_ADDRESS" ]; then
                ADDRESS="$DEPLOYER_ADDRESS"
              else
                ADDRESS=$(${pkgs.foundry}/bin/cast wallet address "$DEPLOYER_PRIVATE_KEY")
              fi
              echo "Current deployer address: $ADDRESS"
            else
              echo "No private key found in environment"
            fi
          }

          # Main menu
          echo "Deployer Key Management"
          echo "1. Generate new key"
          echo "2. Show current key info"
          echo "3. Exit"
          read -p "Select an option (1-3): " choice

          case $choice in
            1)
              generate_new_key
              ;;
            2)
              show_key_info
              ;;
            3)
              exit 0
              ;;
            *)
              echo "Invalid option"
              exit 1
              ;;
          esac
        '';

        # Script to manage token balances (faucet)
        faucet-script = pkgs.writeShellApplication {
          name = "faucet";
          runtimeInputs = [ pkgs.foundry ];
          text = ''
            # shellcheck disable=SC1091
            # Source environment variables from .env if it exists
            if [ -f .env ]; then
              set -a
              source .env
              set +a
            fi

            # Check if Anvil is running
            if [ ! -f .anvil.pid ]; then
              echo "Error: Anvil is not running. Please start it first with 'start-anvil'"
              exit 1
            fi

            # Read PID into variable first to avoid word splitting
            ANVIL_PID=""
            if [ -f .anvil.pid ]; then
              ANVIL_PID=$(cat .anvil.pid)
            fi

            # Check if the process is actually running
            if [ -n "$ANVIL_PID" ] && ! kill -0 "$ANVIL_PID" 2>/dev/null; then
              echo "Error: Anvil process not found. Please restart it with 'start-anvil'"
              rm .anvil.pid
              exit 1
            fi

            # Function to validate address
            validate_address() {
              # Check basic format (0x prefix and 40 hex chars, 42 chars total)
              if [[ ! $1 =~ ^(0x)[a-fA-F0-9]{40}$ ]]; then
                echo "Error: Invalid Ethereum address format. Must be 42 characters (0x + 40 hex characters)"
                exit 1
              fi
            }

            # Function to validate token
            validate_token() {
              case $1 in
                ETH|WETH|USDC|DAI) ;;
                *)
                  echo "Error: Invalid token. Must be one of: ETH, WETH, USDC, DAI"
                  exit 1
                  ;;
              esac
            }

            # Function to get token address
            get_token_address() {
              local token=$1
              if [ "$token" = "ETH" ]; then
                return
              fi
              case $token in
                WETH) echo "$WETH_ADDRESS" ;;
                USDC) echo "$USDC_ADDRESS" ;;
                DAI) echo "$DAI_ADDRESS" ;;
              esac
            }

            # Function to get token decimals
            get_token_decimals() {
              case $1 in
                ETH) echo 18 ;;
                WETH) echo 18 ;;
                USDC) echo 6 ;;
                DAI) echo 18 ;;
              esac
            }

            # Function to check balance
            check_balance() {
              local address=$1
              local token=$2
              if [ "$token" = "ETH" ]; then
                cast balance "$address" --rpc-url http://localhost:8545
              else
                local token_address
                token_address=$(get_token_address "$token")
                cast call "$token_address" "balanceOf(address)(uint256)" "$address" --rpc-url http://localhost:8545
              fi
            }

            # Function to format balance with proper decimals
            format_balance() {
              local balance=$1
              local decimals=$2
              local token=$3
              local formatted
              formatted=$(cast to-wei "$balance" ether)
              echo "$formatted $token"
            }

            # Function to handle balance command
            handle_balance() {
              local address=$1
              validate_address "$address"
              echo "Token balances for $address:"
              for token in ETH WETH USDC DAI; do
                local balance
                local decimals
                local formatted
                balance=$(check_balance "$address" "$token")
                decimals=$(get_token_decimals "$token")
                formatted=$(format_balance "$balance" "$decimals" "$token")
                echo "$token: $formatted"
              done
            }

            # Function to handle mint command
            handle_mint() {
              local address=$1
              local token=$2
              local amount=$3
              validate_address "$address"
              validate_token "$token"
              local decimals
              local amount_wei
              decimals=$(get_token_decimals "$token")
              # Convert amount to wei based on token decimals
              amount_wei=$(cast --to-wei "$3")
              
              if [ "$token" = "ETH" ]; then
                # Use Anvil's special RPC method to set ETH balance
                curl -s -X POST -H "Content-Type: application/json" \
                  --data "{\"jsonrpc\":\"2.0\",\"method\":\"anvil_setBalance\",\"params\":[\"$address\", \"$amount_wei\"],\"id\":1}" \
                  http://localhost:8545 > /dev/null
                echo "Set $amount ETH balance for $address"
              else
                local token_address
                token_address=$(get_token_address "$token")
                if [ -z "$token_address" ]; then
                  echo "Error: Could not find token address. Have you run deploy-vaults?"
                  exit 1
                fi
                cast send --rpc-url http://localhost:8545 \
                  "$token_address" "mint(address,uint256)" "$address" "$amount_wei" \
                  --private-key "$DEPLOYER_PRIVATE_KEY"
                echo "Minted $amount $token to $address"
              fi
            }

            # Function to handle burn command
            handle_burn() {
              local address=$1
              local token=$2
              local amount=$3
              validate_address "$address"
              validate_token "$token"
              
              local decimals
              local amount_wei
              local current_balance
              decimals=$(get_token_decimals "$token")
              # Convert amount to wei based on token decimals
              amount_wei=$(cast --to-wei "$3")
              current_balance=$(check_balance "$address" "$token")
              
              if [ "$amount_wei" -gt "$current_balance" ]; then
                echo "Error: Insufficient balance"
                exit 1
              fi

              if [ "$token" = "ETH" ]; then
                # Calculate new balance
                local new_balance=$((current_balance - amount_wei))
                # Use Anvil's special RPC method to set new ETH balance
                curl -s -X POST -H "Content-Type: application/json" \
                  --data "{\"jsonrpc\":\"2.0\",\"method\":\"anvil_setBalance\",\"params\":[\"$address\", \"$new_balance\"],\"id\":1}" \
                  http://localhost:8545 > /dev/null
                echo "Burned $amount ETH from $address"
              else
                local token_address
                token_address=$(get_token_address "$token")
                if [ -z "$token_address" ]; then
                  echo "Error: Could not find token address. Have you run deploy-vaults?"
                  exit 1
                fi
                cast send --rpc-url http://localhost:8545 \
                  "$token_address" "burn(address,uint256)" "$address" "$amount_wei" \
                  --private-key "$DEPLOYER_PRIVATE_KEY"
                echo "Burned $amount $token from $address"
              fi
            }

            # Function to display help
            show_help() {
              echo "Token Faucet - Manage token balances on local testnet"
              echo
              echo "Usage:"
              echo "  faucet balance <address>                     - Show token balances"
              echo "  faucet mint <address> <token> <amount>      - Mint tokens to address"
              echo "  faucet burn <address> <token> <amount>      - Burn tokens from address"
              echo
              echo "Available tokens: ETH, WETH, USDC, DAI"
              echo
              echo "Examples:"
              echo "  faucet balance 0x123...  - Show all token balances"
              echo "  faucet mint 0x123... ETH 10   - Set balance to 10 ETH"
              echo "  faucet burn 0x123... ETH 5    - Burn 5 ETH from balance"
              echo "  faucet mint 0x123... WETH 10  - Mint 10 WETH"
              echo "  faucet burn 0x123... USDC 100 - Burn 100 USDC"
            }

            # Main command handling
            case $1 in
              "balance")
                if [ $# -ne 2 ]; then
                  echo "Error: balance command requires an address"
                  show_help
                  exit 1
                fi
                handle_balance "$2"
                ;;

              "mint")
                if [ $# -ne 4 ]; then
                  echo "Error: mint command requires address, token, and amount"
                  show_help
                  exit 1
                fi
                handle_mint "$2" "$3" "$4"
                ;;

              "burn")
                if [ $# -ne 4 ]; then
                  echo "Error: burn command requires address, token, and amount"
                  show_help
                  exit 1
                fi
                handle_burn "$2" "$3" "$4"
                ;;

              *)
                show_help
                ;;
            esac
          '';
        };

        # Script to deploy local vaults
        deploy-vaults-script = pkgs.writeShellScriptBin "deploy-vaults" ''
          # Create project structure
          mkdir -p script lib

          # Download dependencies directly
          echo "Downloading dependencies..."
          
          # Create lib directory if it doesn't exist
          mkdir -p lib

          # Download forge-std
          if [ ! -d lib/forge-std ]; then
            echo "Downloading forge-std..."
            curl -L https://github.com/foundry-rs/forge-std/archive/refs/tags/v1.7.6.tar.gz | tar xz
            mv forge-std-1.7.6 lib/forge-std
          fi

          # Download OpenZeppelin contracts
          if [ ! -d lib/openzeppelin-contracts ]; then
            echo "Downloading OpenZeppelin contracts..."
            curl -L https://github.com/OpenZeppelin/openzeppelin-contracts/archive/refs/tags/v5.0.1.tar.gz | tar xz
            mv openzeppelin-contracts-5.0.1 lib/openzeppelin-contracts
          fi

          # Check if Anvil is running
          if [ ! -f .anvil.pid ]; then
            echo "Error: Anvil is not running. Please start it first with 'start-anvil'"
            exit 1
          fi

          # Check if the process is actually running
          if ! kill -0 $(cat .anvil.pid) 2>/dev/null; then
            echo "Error: Anvil process not found. Please restart it with 'start-anvil'"
            rm .anvil.pid
            exit 1
          fi

          # Test RPC connection
          echo "Testing connection to Anvil..."
          if ! curl -s -X POST -H "Content-Type: application/json" \
            --data '{"jsonrpc\":\"2.0\",\"method\":\"eth_blockNumber\",\"params\":[],\"id\":1}' \
            http://localhost:8545 > /dev/null; then
            echo "Error: Cannot connect to Anvil node at http://localhost:8545"
            exit 1
          fi

          echo "Connected to Anvil node successfully!"

          # Check for DEPLOYER_PRIVATE_KEY in environment
          if [ -z "$DEPLOYER_PRIVATE_KEY" ]; then
            echo "Error: DEPLOYER_PRIVATE_KEY not found in environment."
            echo "Please run 'manage-key' to generate or configure a deployer key."
            exit 1
          fi

          DEPLOYER_ADDRESS=$(${pkgs.foundry}/bin/cast wallet address "$DEPLOYER_PRIVATE_KEY")
          
          # Fund the deployer account with 10000 ETH
          echo "Funding deployer account..."
          curl -s -X POST -H "Content-Type: application/json" \
            --data "{\"jsonrpc\":\"2.0\",\"method\":\"anvil_setBalance\",\"params\":[\"$DEPLOYER_ADDRESS\", \"0x21E19E0C9BAB2400000\"],\"id\":1}" \
            http://localhost:8545 > /dev/null

          echo "Deployer address: $DEPLOYER_ADDRESS"
          echo "Building and deploying contracts..."

          # Build and deploy the contracts
          if ! ${pkgs.foundry}/bin/forge script script/DeployVaults.s.sol:DeployVaults \
            --rpc-url http://localhost:8545 \
            --broadcast \
            --private-key $DEPLOYER_PRIVATE_KEY 2>&1 | tee deployment.log; then
            echo "Error: Deployment failed. Check deployment.log for details."
            exit 1
          fi

          # Extract and save contract addresses
          echo "Saving deployed addresses..."
          if grep "Deployed addresses:" -A 6 deployment.log > deployed-addresses.txt; then
            # Extract addresses and save to .env
            # Use awk for more reliable extraction
            WETH_ADDRESS=$(awk '/WETH:/ {print $2}' deployed-addresses.txt)
            USDC_ADDRESS=$(awk '/USDC:/ {print $2}' deployed-addresses.txt)
            DAI_ADDRESS=$(awk '/DAI:/ {print $2}' deployed-addresses.txt)
            ETH_VAULT_ADDRESS=$(awk '/ETH Vault:/ {print $3}' deployed-addresses.txt)
            USDC_VAULT_ADDRESS=$(awk '/USDC Vault:/ {print $3}' deployed-addresses.txt)
            DAI_VAULT_ADDRESS=$(awk '/DAI Vault:/ {print $3}' deployed-addresses.txt)
            
            # Verify addresses were extracted
            if [ -z "$WETH_ADDRESS" ] || [ -z "$USDC_ADDRESS" ] || [ -z "$DAI_ADDRESS" ] || \
               [ -z "$ETH_VAULT_ADDRESS" ] || [ -z "$USDC_VAULT_ADDRESS" ] || [ -z "$DAI_VAULT_ADDRESS" ]; then
              echo "Error: Failed to extract one or more addresses"
              echo "Content of deployed-addresses.txt:"
              cat deployed-addresses.txt
              exit 1
            fi
            
            # Export variables immediately
            export WETH_ADDRESS
            export USDC_ADDRESS
            export DAI_ADDRESS
            export ETH_VAULT_ADDRESS
            export USDC_VAULT_ADDRESS
            export DAI_VAULT_ADDRESS
            
            # Append to .env file (preserving existing variables)
            if [ -f .env ]; then
              # Remove old token addresses if they exist
              sed -i.bak '/^WETH_ADDRESS=/d' .env
              sed -i.bak '/^USDC_ADDRESS=/d' .env
              sed -i.bak '/^DAI_ADDRESS=/d' .env
              sed -i.bak '/^ETH_VAULT_ADDRESS=/d' .env
              sed -i.bak '/^USDC_VAULT_ADDRESS=/d' .env
              sed -i.bak '/^DAI_VAULT_ADDRESS=/d' .env
              rm -f .env.bak
            fi
            
            # Add new token addresses
            {
              echo "WETH_ADDRESS=$WETH_ADDRESS"
              echo "USDC_ADDRESS=$USDC_ADDRESS"
              echo "DAI_ADDRESS=$DAI_ADDRESS"
              echo "ETH_VAULT_ADDRESS=$ETH_VAULT_ADDRESS"
              echo "USDC_VAULT_ADDRESS=$USDC_VAULT_ADDRESS"
              echo "DAI_VAULT_ADDRESS=$DAI_VAULT_ADDRESS"
            } >> .env

            # Create Next.js environment file
            {
              echo "NEXT_PUBLIC_WETH_ADDRESS=$WETH_ADDRESS"
              echo "NEXT_PUBLIC_USDC_ADDRESS=$USDC_ADDRESS"
              echo "NEXT_PUBLIC_DAI_ADDRESS=$DAI_ADDRESS"
              echo "NEXT_PUBLIC_ETH_VAULT_ADDRESS=$ETH_VAULT_ADDRESS"
              echo "NEXT_PUBLIC_USDC_VAULT_ADDRESS=$USDC_VAULT_ADDRESS"
              echo "NEXT_PUBLIC_DAI_VAULT_ADDRESS=$DAI_VAULT_ADDRESS"
            } > .env.local
            
            rm deployment.log
            echo "Vaults deployed successfully! Addresses saved to deployed-addresses.txt, .env, and .env.local"
            echo "Token addresses exported to environment:"
            echo "WETH: $WETH_ADDRESS"
            echo "USDC: $USDC_ADDRESS"
            echo "DAI: $DAI_ADDRESS"
            cat deployed-addresses.txt
          else
            echo "Error: Could not find deployed addresses in output."
            exit 1
          fi
        '';

        # Create foundry.toml configuration
        foundry-toml = pkgs.writeText "foundry.toml" ''
          [profile.default]
          src = 'script'
          test = 'test'
          script = 'script'
          out = 'out'
          libs = ['lib']
          solc = "0.8.20"
          optimizer = true
          optimizer_runs = 200
        '';
      in
      {
        devShells.default = pkgs.mkShell {
          nativeBuildInputs = with pkgs; [
            nodejs_20
            nodePackages.npm
            foundry
            git
            curl
            start-anvil-script
            deploy-vaults-script
            manage-key-script
            faucet-script
          ];

          NODE_ENV = "development";
          
          shellHook = ''
            # Install NPM dependencies quietly unless there's an error
            echo "Installing dependencies..."
            if ! npm install --no-audit --no-fund --silent > /dev/null 2>&1; then
              echo "Error during dependency installation. Retrying with full output:"
              npm install --no-audit --no-fund
            fi

            # Setup Foundry configuration
            cp ${foundry-toml} foundry.toml
            
            # Source .env file if it exists
            if [ -f .env ]; then
              set -a
              source .env
              set +a
              echo "Loaded environment from .env file"
            else
              echo "No .env file found. One will be created when needed."
            fi
            
            # Ensure node_modules/.bin is in PATH
            export PATH="$PWD/node_modules/.bin:$PATH"

            echo "Development environment ready. Available commands:"
            echo "  start-anvil    - Start local Anvil node"
            echo "  manage-key     - Manage deployer private key"
            echo "  deploy-vaults  - Deploy test vaults to local network"
            echo "  faucet         - Manage token balances (ETH, WETH, USDC, DAI):"
            echo "                   • faucet balance <address>              - Show token balances"
            echo "                   • faucet mint <address> <token> <amt>   - Mint tokens to address"
            echo "                   • faucet burn <address> <token> <amt>   - Burn tokens from address"
            echo "                   • faucet                                - Show help menu"
            echo "  npm run dev    - Start Next.js development server"
          '';
        };
      }
    );
}
