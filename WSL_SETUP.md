# WSL Setup for Envio on Windows

## Step 1: Install WSL
```powershell
# Run as Administrator
wsl --install
```

## Step 2: Setup Ubuntu
```bash
# After WSL install, open Ubuntu terminal
sudo apt update
sudo apt install -y curl git

# Install Node.js
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Install pnpm
npm install -g pnpm
```

## Step 3: Install Envio in WSL
```bash
# Navigate to project (Windows drive mounted at /mnt/c)
cd /mnt/c/Personal/monad\ hackathon/ai-yield-agent/envio

# Install dependencies
pnpm install

# Install Envio CLI
pnpm add -g envio

# Start indexer
envio dev
```

## Step 4: Verify Setup
- GraphQL endpoint: http://localhost:8080
- Admin password: `testing`
- Backend will connect to: http://localhost:8080/health

## Current Config (Monad Testnet)
- Network ID: 10143
- RPC: https://monad-testnet.rpc.hypersync.xyz/
- Events: Transfer, Swap, PoolCreated, Mint, Burn
- Contracts: USDC, Uniswap V3 Factory/Pool

## Expected Result
- ✅ Envio indexer running in WSL
- ✅ GraphQL at localhost:8080
- ✅ Backend shows LIVE status
- ✅ Real blockchain events flowing