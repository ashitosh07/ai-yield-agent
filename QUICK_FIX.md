# 🔧 Quick Fix Guide

## ✅ Issues Fixed

### 1. Frontend Permission Error (EACCES)
- **Problem**: Next.js trying to bind to 0.0.0.0 requires admin privileges on Windows
- **Fix**: Updated `package.json` to use `next dev -H localhost` instead
- **Fix**: Updated `next.config.js` with Windows-friendly settings

### 2. Farcaster Missing Module Error
- **Problem**: `server.js` trying to require './advanced-server' which didn't exist
- **Fix**: Created `advanced-server.js` with complete Farcaster Mini App functionality
- **Fix**: Added missing `cors` dependency to `package.json`

### 3. Agent Missing Module Error  
- **Problem**: `main.py` trying to import 'advanced_ai_engine' which didn't exist
- **Fix**: Created `advanced_ai_engine.py` with AI engine implementation

## 🚀 Quick Start (Fixed)

### Option 1: Use the Fix Script
```bash
# Run the comprehensive fix and start script
fix_and_start.bat
```

### Option 2: Manual Steps
```bash
# Install missing dependencies
cd farcaster && npm install && cd ..
cd agent && pip install -r requirements.txt && cd ..

# Start services individually
cd backend && npm start          # Port 3002
cd agent && python main.py       # Port 3003  
cd farcaster && npm start        # Port 3006
cd frontend && npm run dev        # Port 3000
```

## 🧪 Test Everything Works
```bash
# Run the test script
test_services.bat

# Or test manually
curl http://localhost:3002/health
curl http://localhost:3003/
curl http://localhost:3006/
# Open http://localhost:3000 in browser
```

## ✅ Expected Results

### Frontend (Port 3000)
- Should start without permission errors
- Binds to localhost only (not 0.0.0.0)
- All 5 tabs should load: Dashboard, Delegations, Audit Log, Envio, Social

### Farcaster (Port 3006)  
- Should start without module errors
- Frame URLs should work:
  - `/frame/portfolio/[address]`
  - `/frame/delegate` 
  - `/frame/approve/[actionId]`

### AI Agent (Port 3003)
- Should start without import errors
- Health endpoint should respond
- Analysis endpoint should accept POST requests

### Backend (Port 3002)
- Should already be working
- All API endpoints should respond

## 🎯 Priority Testing

1. **Envio Integration**: Check Envio tab shows real-time indexing stats
2. **Farcaster Mini App**: Test frame URLs and share buttons in Social tab
3. **Core App**: Verify wallet connection and delegation creation works
4. **API Integration**: Confirm all services communicate properly

## 🐛 If Still Having Issues

### Port Conflicts
```bash
# Check what's using ports
netstat -an | findstr :3000
netstat -an | findstr :3002
netstat -an | findstr :3003
netstat -an | findstr :3006

# Kill processes if needed
taskkill /F /PID [process_id]
```

### Permission Issues
- Run Command Prompt as Administrator
- Or use PowerShell with execution policy: `Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser`

### Missing Dependencies
```bash
# Reinstall all dependencies
cd frontend && npm install
cd backend && npm install  
cd farcaster && npm install
cd agent && pip install -r requirements.txt
```

## ✅ Success Criteria

All services should start without errors and you should be able to:
- ✅ Open http://localhost:3000 (Frontend)
- ✅ Navigate all 5 tabs without errors
- ✅ See Envio integration in Envio tab
- ✅ Test Farcaster frames in Social tab
- ✅ Create delegations and view audit logs
- ✅ All API endpoints respond correctly

**Ready for hackathon judging! 🏆**