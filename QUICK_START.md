# 🚀 Quick Start Guide

## Prerequisites
- Node.js 18+
- Python 3.8+
- Git

## 1. Clone & Setup (30 seconds)

```bash
git clone <repo-url>
cd ai-yield-agent
```

## 2. Start All Services (1 command)

### Windows:
```bash
start_all.bat
```

### Manual Start:
```bash
# Terminal 1 - Backend
cd backend && npm install && npm start

# Terminal 2 - AI Agent  
cd agent && pip install -r requirements.txt && python main.py

# Terminal 3 - Frontend
cd frontend && npm install && npm run dev
```

## 3. Verify Everything Works

```bash
python health_check.py
```

## 4. Access Application

- **Frontend**: http://localhost:3003
- **Backend API**: http://localhost:3001/health
- **AI Agent**: http://localhost:3002/docs

## 5. Demo Flow

1. Open http://localhost:3003
2. Connect MetaMask wallet
3. Create delegation with limits
4. Trigger APY change event
5. Watch AI execute automatically
6. Check audit logs

## Troubleshooting

### Port Already in Use
```bash
# Kill processes on ports
taskkill /f /im node.exe
taskkill /f /im python.exe
```

### Dependencies Issues
```bash
# Clean install
rm -rf node_modules package-lock.json
npm install

# Python dependencies
pip install --upgrade pip
pip install -r requirements.txt
```

### Database Connection
The app works without database (uses mock data for demo)

## Architecture

```
Frontend (3003) ←→ Backend (3001) ←→ AI Agent (3002)
     ↓                ↓                    ↓
  MetaMask        PostgreSQL         Monad Testnet
```

## Key Features Working

✅ Frontend UI with wallet connection  
✅ Backend API with delegation routes  
✅ AI Agent with yield optimization  
✅ Mock blockchain integration  
✅ Audit logging system  
✅ Health monitoring  

## Next Steps

1. Connect real MetaMask wallet
2. Deploy to Monad testnet
3. Integrate Envio HyperSync
4. Add Farcaster notifications
5. Enable real delegations