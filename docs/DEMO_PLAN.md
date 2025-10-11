# Demo Plan - AI Yield Agent

## 🎯 Demo Objectives
Showcase the complete AI Yield Agent workflow demonstrating all bounty integrations:
- **AI Agent**: Autonomous yield optimization
- **Delegations**: Scoped delegation with constraints
- **Envio**: Real-time pool monitoring
- **Consumer App**: User-friendly interface
- **Farcaster**: Social notifications

## 🎬 Demo Script (5 minutes)

### Scene 1: Setup & Delegation (90 seconds)
1. **Open Frontend** - Show clean, professional UI
2. **Connect Wallet** - MetaMask connection with smart account
3. **Create Delegation**:
   - Set max amount: 2.5 ETH
   - Set expiry: 24 hours
   - Select allowed pools: USDC/ETH, WETH/USDT
   - Show delegation constraints clearly
4. **Confirm Delegation** - Transaction on Monad testnet
5. **Show Audit Log** - Delegation recorded with hash

### Scene 2: AI Monitoring (60 seconds)
1. **Dashboard View** - Show current pool positions
2. **Envio Integration** - Explain real-time monitoring
3. **Pool Stats Display**:
   - USDC/ETH: 12.5% APY (current position)
   - WETH/USDT: 8.2% APY
   - DAI/USDC: 15.8% APY

### Scene 3: Event Trigger (90 seconds)
1. **Simulate APY Change** - Trigger Envio webhook
   - WETH/USDT APY jumps from 8.2% to 16.5%
2. **Show Backend Logs** - Webhook received
3. **AI Analysis** - Agent calculates optimal rebalance
4. **Decision Display**:
   - Confidence: 87%
   - Action: Move 1.5 ETH from USDC/ETH to WETH/USDT
   - Expected gain: 4% APY improvement

### Scene 4: Delegated Execution (90 seconds)
1. **Validation Check** - Show delegation constraints validation
2. **Execution** - Bundler submits transaction to Monad
3. **Transaction Confirmation** - Show tx hash and success
4. **Audit Trail Update** - New entry in audit log
5. **Portfolio Update** - Dashboard reflects new positions

### Scene 5: Social Integration (30 seconds)
1. **Farcaster Notification** - Show social cast
2. **Mini App Preview** - Quick approve/reject interface
3. **User Notification** - In-app notification system

## 🛠️ Demo Setup Checklist

### Pre-Demo Setup
- [ ] All services running (docker-compose up)
- [ ] Database seeded with test data
- [ ] Monad testnet wallet funded
- [ ] Envio webhook configured
- [ ] Farcaster API keys configured
- [ ] Frontend deployed and accessible

### Demo Environment
- [ ] Clean browser with MetaMask installed
- [ ] Test wallet with Monad testnet ETH
- [ ] Backend logs visible in terminal
- [ ] Database client open for audit trail
- [ ] Farcaster account ready

### Backup Plans
- [ ] Pre-recorded transaction hashes
- [ ] Mock data if APIs fail
- [ ] Screenshots of key screens
- [ ] Fallback demo video

## 🎥 Demo Flow Diagram

```
User Connects → Create Delegation → AI Monitors → Event Triggers → 
AI Analyzes → Validates Delegation → Executes Transaction → 
Updates Audit → Sends Notifications → Shows Results
```

## 📊 Key Metrics to Highlight

- **Delegation Constraints**: Max amount, expiry, allowed pools
- **AI Confidence**: 87% confidence score
- **Execution Speed**: < 30 seconds from trigger to execution
- **Gas Efficiency**: Bundled transaction optimization
- **Audit Trail**: Complete transparency and logging
- **Social Integration**: Real-time notifications

## 🏆 Bounty Alignment

### AI Agent Track
- Autonomous decision making
- ML-based confidence scoring
- Risk-adjusted yield optimization

### Delegation Innovation
- Scoped delegations with constraints
- Time-limited authority
- Granular permission system

### Envio Integration
- Real-time pool monitoring
- Event-driven triggers
- Webhook integration

### Consumer App
- Intuitive delegation management
- Real-time dashboard
- Mobile-responsive design

## 🎤 Key Talking Points

1. **"This is not just another DeFi bot"** - Emphasize the AI decision making and delegation constraints
2. **"Security first"** - Highlight scoped delegations and audit trails
3. **"Real-time optimization"** - Show Envio integration and instant responses
4. **"Social DeFi"** - Demonstrate Farcaster notifications
5. **"Production ready"** - Point out comprehensive logging and error handling

## 📱 Farcaster Mini App Demo

If time permits, show the Farcaster Mini App:
1. Open Farcaster client
2. Show AI Yield Agent cast with embedded action
3. Demonstrate quick approve/reject functionality
4. Show how social notifications work