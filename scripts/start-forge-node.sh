#!/bin/bash

# Start anvil (Forge's local testnet) with predefined accounts
anvil \
  --block-time 12 \
  --chain-id 31337 \
  --balance 10000 \
  --fork-url https://eth-mainnet.public.blastapi.io \
  --fork-block-number 19250000 