# Real Data Setup - No Mock Data

## Current Status: OFFLINE (No Mock Data)
- ❌ Envio indexer: Not running
- ❌ Real blockchain events: Not available  
- ❌ Pool data: Empty
- ❌ Analytics: All zeros

## To Get Real Events & Data:

### Option 1: WSL (Recommended)
```bash
# Install WSL
wsl --install

# In WSL terminal:
cd /mnt/c/Personal/monad\ hackathon/ai-yield-agent/envio
npm install
envio dev
```

### Option 2: Linux VM
- Install Ubuntu/Linux VM
- Run envio dev inside VM
- Forward port 8080 to Windows

### Option 3: Docker (if available)
```bash
docker run -p 8080:8080 envio/indexer
```

## What Happens When Running:
1. **Envio indexer starts** → GraphQL at http://localhost:8080
2. **Backend connects** → Status changes to LIVE
3. **Real events flow** → Transfer/Swap/Pool events
4. **Analytics populate** → Real TVL, APY, volume data
5. **WebSocket streams** → Live event feed

## Current Endpoints (All Return Empty/Error):
- `/api/pools/real-time` → Empty array
- `/api/pools/analytics` → All zeros  
- `/api/envio/stats` → Offline status
- `/api/envio/transfers` → No transfers

## No Mock Data Policy:
- ✅ System shows real connection status
- ✅ Empty data when services offline
- ✅ Error messages explain requirements
- ❌ No fake/mock data displayed