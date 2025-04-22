#!/bin/bash

# Alchemy API key
ALCHEMY_API_KEY="VAQcT5_FZnSb1JcH7-3TGfRmzVpTW1Yl"    #replace with actual key

# Define RPC URL and port
ETH_RPC_URL="https://eth-mainnet.g.alchemy.com/v2/$ALCHEMY_API_KEY"
PORT=8545

# Start the fork with a different Chain ID
echo "Starting Ethereum mainnet fork on port $PORT..."
echo "RPC URL: $ETH_RPC_URL"

anvil --fork-url $ETH_RPC_URL --port $PORT \
      --chain-id 31337 # This is the standard Chain ID for Hardhat/Anvil