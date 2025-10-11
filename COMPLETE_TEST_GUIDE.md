# 🧪 Complete Testing Guide - AI Yield Agent

## 🚀 **Quick Start (2 Minutes)**

### 1. Start All Services
```bash
# Run the master startup script
start_all.bat

# This starts:
# - Backend (Port 3002)
# - AI Agent (Port 3003) 
# - Frontend (Port 3000)
# - Farcaster Mini App (Port 3006)
```

### 2. Open Main Application
```
http://localhost:3000
```

## 🎯 **Priority 1: Envio HyperIndex Testing**

### ✅ **Frontend Integration Test**
1. Open http://localhost:3000
2. Connect wallet (any address works)
3. Navigate to **"Envio" tab** (⚡)
4. Verify you see:
   - Real-time indexing stats
   - Event processing counters
   - HyperSync features list
   - GraphQL endpoint info

### ✅ **Dashboard Integration Test**
1. Go to **"Dashboard" tab** (📊)
2. Check top-right corner for **EnvioStatus component**
3. Verify live metrics updating:
   - Latest Block numbers
   - Events Processed count
   - HyperSync Latency
   - GraphQL Queries count

### ✅ **Backend API Test**
```bash
# Test pools API (uses Envio HyperIndex service)
curl http://localhost:3002/api/pools

# Test pool analytics
curl http://localhost:3002/api/pools/analytics

# Test user positions
curl "http://localhost:3002/api/pools/positions/0xfB0A5Ebf31A15Ee3cD51080F1bCAC39Cd676343f"
```

### ✅ **Envio Configuration Test**
```bash
# Check Envio indexer files exist
dir envio\config.yaml
dir envio\schema.graphql
dir envio\src\EventHandlers.ts
```

## 🎭 **Priority 2: Farcaster Mini App Testing**

### ✅ **Frontend Integration Test**
1. Open http://localhost:3000
2. Navigate to **"Social" tab** (🎭)
3. Test share buttons:
   - Click "📊 Share Portfolio Frame"
   - Click "🔐 Share Delegation Frame" 
   - Click "🤖 Share AI Action Frame"
4. URLs copied to clipboard automatically

### ✅ **Frame Testing**
```bash
# Test Portfolio Frame
http://localhost:3006/frame/portfolio/0xfB0A5Ebf31A15Ee3cD51080F1bCAC39Cd676343f

# Test Delegation Frame
http://localhost:3006/frame/delegate

# Test Action Approval Frame
http://localhost:3006/frame/approve/demo-123
```

### ✅ **Image Generation Test**
```bash
# Test dynamic image APIs
curl -I http://localhost:3006/api/frame/portfolio-image/0xfB0A5Ebf31A15Ee3cD51080F1bCAC39Cd676343f
curl -I http://localhost:3006/api/frame/action-image/demo-123
curl -I http://localhost:3006/api/frame/delegate-image
```

### ✅ **Frame Validation Test**
1. Copy any frame URL
2. Go to https://warpcast.com/~/developers/frames
3. Paste URL to validate frame meta tags
4. Should show proper buttons and image

## 🤖 **Core Application Testing**

### ✅ **Wallet Connection Test**
1. Open http://localhost:3000
2. Click "Connect MetaMask"
3. Should show wallet connection interface
4. Any address works for demo

### ✅ **Dashboard Test**
1. Navigate to **"Dashboard" tab**
2. Verify sections load:
   - Portfolio Overview (5 metrics)
   - Current Positions (mock data)
   - Available Pools (3 pools with live data)
   - AI Recommendations
3. Check Envio branding on pools section

### ✅ **Delegations Test**
1. Navigate to **"Delegations" tab**
2. Click "Create Delegation"
3. Fill form:
   - Max Amount: 2.5 ETH
   - Expiry: Tomorrow
   - Select pools
   - Risk tolerance: Medium
4. Submit (creates mock delegation)

### ✅ **Audit Log Test**
1. Navigate to **"Audit Log" tab**
2. Should show mock audit entries
3. Test filters and sorting
4. Check transaction details

## 🔧 **Backend API Testing**

### ✅ **All Endpoints Test**
```bash
# Health check
curl http://localhost:3002/health

# Pools (Envio integration)
curl http://localhost:3002/api/pools
curl http://localhost:3002/api/pools/analytics

# User data
curl "http://localhost:3002/api/pools/positions/0xfB0A5Ebf31A15Ee3cD51080F1bCAC39Cd676343f"
curl "http://localhost:3002/api/delegations/0xfB0A5Ebf31A15Ee3cD51080F1bCAC39Cd676343f"
curl "http://localhost:3002/api/audit/0xfB0A5Ebf31A15Ee3cD51080F1bCAC39Cd676343f"

# AI Actions (Farcaster integration)
curl http://localhost:3002/api/ai-actions/demo-123
```

### ✅ **AI Agent Test**
```bash
# Health check
curl http://localhost:3003/

# Trigger analysis
curl -X POST http://localhost:3003/analyze \
  -H "Content-Type: application/json" \
  -d '{"poolAddress":"0x1234567890123456789012345678901234567890","oldAPY":8.2,"newAPY":16.5,"timestamp":"2024-01-01T00:00:00Z"}'
```

## 🎯 **Success Criteria Checklist**

### ✅ **Priority 1: Envio Integration**
- [ ] Envio tab loads with real-time stats
- [ ] Dashboard shows EnvioStatus component
- [ ] Backend uses HyperIndex service
- [ ] Pool data shows "Powered by Envio"
- [ ] API endpoints return Envio-sourced data

### ✅ **Priority 2: Farcaster Mini App**
- [ ] Social tab loads with share buttons
- [ ] Frame URLs generate and copy to clipboard
- [ ] All frame URLs load without errors
- [ ] Dynamic images generate properly
- [ ] Frame meta tags validate correctly

### ✅ **Core Application**
- [ ] All 5 tabs load without errors
- [ ] Wallet connection works
- [ ] Dashboard shows live metrics
- [ ] Delegation creation works
- [ ] Audit log displays entries

### ✅ **Backend Services**
- [ ] All API endpoints respond
- [ ] Mock data returns properly
- [ ] CORS enabled for frontend
- [ ] Error handling works

## 🐛 **Troubleshooting**

### Common Issues:
```bash
# Port conflicts
netstat -an | findstr :3000
netstat -an | findstr :3002
netstat -an | findstr :3003
netstat -an | findstr :3006

# Service not starting
# Check individual terminal windows opened by start_all.bat

# Canvas/Image errors (Farcaster)
cd farcaster && npm install canvas sharp

# API errors
# Check backend terminal for error logs
```

### Quick Fixes:
```bash
# Restart all services
# Close all terminal windows
# Run start_all.bat again

# Test individual services
cd backend && npm start
cd frontend && npm run dev
cd farcaster && npm start
cd agent && python main.py
```

## 🏆 **Demo Flow (5 Minutes)**

### **Scene 1: Envio Integration (60s)**
1. Open http://localhost:3000
2. Show **Envio tab** with real-time indexing
3. Navigate to **Dashboard** - point out Envio status
4. Highlight "Powered by Envio HyperIndex" on pools

### **Scene 2: Farcaster Mini App (90s)**
1. Navigate to **Social tab**
2. Click share buttons - show URLs copied
3. Open frame URLs in new tabs
4. Demonstrate interactive buttons
5. Show dynamic image generation

### **Scene 3: Core Application (90s)**
1. Show **Dashboard** with live metrics
2. Create **Delegation** with constraints
3. View **Audit Log** with transparency
4. Highlight AI recommendations

### **Scene 4: Integration Proof (60s)**
1. Show backend API responses
2. Demonstrate real-time updates
3. Point out Envio/Farcaster branding
4. Highlight hackathon compliance

## ✅ **Ready for Judging**

This setup demonstrates:
- ✅ **Working Envio indexer** with real-time integration
- ✅ **Interactive Farcaster Mini App** with dynamic frames
- ✅ **MetaMask Smart Accounts** delegation flow
- ✅ **AI Agent** with autonomous decision making
- ✅ **Monad testnet** integration ready
- ✅ **Complete audit trail** and transparency

**All priorities implemented and testable!**