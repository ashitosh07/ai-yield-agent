# Core Components - Hackathon Compliance

## ✅ Required Components (Kept)

### 1. MetaMask Smart Accounts + Delegation Toolkit
- `frontend/src/components/RealSmartAccountSetup.tsx` - Smart account creation
- `frontend/src/components/RealDelegationManager.tsx` - Delegation management
- `frontend/src/hooks/useRealSmartAccount.js` - Smart account hooks
- `frontend/src/lib/realSmartAccount.ts` - Smart account logic
- `frontend/src/lib/delegation.ts` - Delegation toolkit integration

### 2. Monad Testnet Integration
- `contracts/` - Smart contracts for Monad
- `frontend/src/config/monad.js` - Monad network config
- `frontend/src/lib/chains.ts` - Chain configurations

### 3. Envio HyperIndex/HyperSync
- `envio/` - Complete Envio indexer setup
- `backend/src/routes/envio.js` - Envio API routes
- `backend/src/services/envioService.js` - Envio service integration
- `frontend/src/components/EnvioRealTime.tsx` - Real-time data display

### 4. AI Agent Core
- `agent/main.py` - Main AI agent
- `agent/ai_engine.py` - AI decision engine
- `agent/delegation_validator.py` - Delegation validation
- `agent/smart_account_executor.py` - Smart account execution

### 5. Backend Core
- `backend/src/routes/delegations.js` - Delegation API
- `backend/src/routes/pools.js` - Pool data API
- `backend/src/routes/webhooks.js` - Webhook handlers
- `backend/src/services/envio.js` - Envio integration
- `backend/src/services/smart-account-service.js` - Smart account service

### 6. Frontend Core
- `frontend/src/components/RealWalletConnect.tsx` - Wallet connection
- `frontend/src/components/AdvancedDashboard.tsx` - Main dashboard
- `frontend/src/components/YieldDashboard.tsx` - Yield optimization UI
- `frontend/src/components/AuditLog.tsx` - Delegation audit trail

### 7. Farcaster Mini App (Bonus)
- `farcaster/server.js` - Farcaster frame server

## ❌ Removed Components (Duplicates/Non-essential)

### Duplicate AI Agents
- `agent/advanced_ai_engine.py` ❌
- `agent/advanced_main.py` ❌  
- `agent/simple_main.py` ❌

### Duplicate Frontend Components
- `frontend/src/components/DelegationManager.js` ❌
- `frontend/src/components/SmartAccountSetup.js` ❌
- `frontend/src/components/SimpleDashboard.tsx` ❌
- `frontend/src/components/SimpleConnectWallet.tsx` ❌

### Duplicate Backend Services
- `backend/src/routes/simple-pools.js` ❌
- `backend/src/routes/pools-advanced.js` ❌
- `backend/src/services/envio-hyperindex.js` ❌
- `backend/src/services/envio-hypersync.js` ❌

### Duplicate Envio Setup
- `envio-indexer/` ❌ (kept main `envio/`)

### Test Files
- `test_advanced_features.py` ❌
- `test_all.py` ❌
- `health_check.py` ❌

## 🎯 Focused Architecture

```
ai-yield-agent/
├── frontend/          # Next.js + MetaMask Smart Accounts
├── backend/           # Node.js API + Delegation management  
├── agent/             # Python AI agent
├── envio/             # HyperIndex indexer
├── contracts/         # Monad smart contracts
├── farcaster/         # Mini app (bonus)
└── infra/             # Docker setup
```

This streamlined structure focuses on the core hackathon requirements while removing duplicates and non-essential components.