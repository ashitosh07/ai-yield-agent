# 🏆 AI Yield Agent - Hackathon Demo Guide

## 🎯 Overview
AI Yield Agent is an autonomous DeFi yield optimization system that maximizes returns through intelligent rebalancing while maintaining user-defined risk constraints. Built for the MetaMask Smart Accounts × Monad Dev Cook Off.

## 🏅 Bounty Qualifications

### ✅ **Main Track: AI Agent / Automation / Consumer App**
- **AI Decision Engine**: ML-based yield optimization with confidence scoring
- **Autonomous Execution**: Delegated transactions without manual intervention  
- **Consumer Interface**: User-friendly delegation management
- **Real-time Monitoring**: Continuous pool analysis and optimization

### ✅ **Most Innovative Use of Delegations**
- **Scoped Permissions**: Granular constraints (pools, amounts, expiry, risk tolerance)
- **AI-Driven Automation**: First delegated AI yield optimization system
- **Constraint Validation**: Multi-layered validation before execution
- **Complete Transparency**: Full audit trail of all delegated actions

### ✅ **Envio Integration**
- **HyperSync Monitoring**: Real-time pool event indexing
- **GraphQL Queries**: Rich pool data via Envio APIs
- **Event-Driven Triggers**: Webhook-based AI activation
- **Data Pipeline**: Envio → Backend → AI Agent workflow

### ✅ **Bonus: Farcaster Mini App**
- **Social Notifications**: Automated cast creation for executed actions
- **Mini App Interface**: Quick approve/reject functionality
- **User Engagement**: Social layer for DeFi automation

## 🚀 Quick Start (5 Minutes)

### 1. Get API Keys
```bash
# Required for full functionality:
# - Pimlico API Key: https://pimlico.io
# - MetaMask Project ID: https://developer.metamask.io

# Optional for enhanced features:
# - OpenAI API Key: https://platform.openai.com
# - Farcaster API Key: https://neynar.com
```

### 2. Setup Environment
```bash
# Clone and configure
cd ai-yield-agent
copy .env.example .env
# Edit .env with your API keys

# Start all services
start_all.bat
```

### 3. Access Application
- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:3002  
- **AI Agent**: http://localhost:3003

## 🎬 Demo Flow (5 Minutes)

### Scene 1: Wallet Connection & Smart Account (60s)
1. **Open Frontend** → Professional UI with animated background
2. **Connect MetaMask** → Deploys smart account on Monad testnet
3. **Show Dashboard** → Real-time portfolio overview with metrics

### Scene 2: Delegation Creation (90s)
1. **Navigate to Delegations** → Click "Create Delegation"
2. **Set Constraints**:
   - Max Amount: `2.5 ETH`
   - Expiry: `24 hours`
   - Risk Tolerance: `Medium`
   - Allowed Pools: Select `USDC/ETH`, `WETH/USDT`, `DAI/USDC`
3. **Submit Delegation** → Transaction on Monad testnet
4. **Show Audit Log** → Delegation recorded with complete details

### Scene 3: AI Analysis & Execution (120s)
1. **Trigger Event** → Simulate APY change via backend API
2. **AI Processing**:
   - Pool data analysis via Envio
   - Risk-adjusted yield calculations
   - Confidence scoring (87%)
   - Optimal rebalance recommendation
3. **Delegation Validation**:
   - Amount limits ✓
   - Pool allowlist ✓  
   - Risk tolerance ✓
   - Expiry check ✓
4. **Autonomous Execution**:
   - Bundler transaction submission
   - Monad testnet confirmation
   - Usage tracking update

### Scene 4: Results & Transparency (90s)
1. **Dashboard Update** → New portfolio allocation
2. **Audit Log Entry** → Complete transaction details
3. **Farcaster Notification** → Social cast with results
4. **Portfolio Metrics** → Improved APY and risk-adjusted returns

## 🛠️ Technical Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Frontend      │    │    Backend      │    │   AI Agent     │
│   (Next.js)     │◄──►│  (Node.js)      │◄──►│  (Python)       │
│                 │    │                 │    │                 │
│ • Wallet Connect│    │ • Delegation DB │    │ • APY Analysis  │
│ • Delegation UI │    │ • Audit Logs    │    │ • Rebalance AI  │
│ • History View  │    │ • Webhooks      │    │ • Risk Scoring  │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         │              ┌─────────────────┐              │
         │              │     Envio       │              │
         └──────────────►│   HyperSync     │◄─────────────┘
                        │                 │
                        │ • Pool Events   │
                        │ • APY Triggers  │
                        │ • Notifications │
                        └─────────────────┘
                                 │
                        ┌─────────────────┐
                        │ Monad Testnet   │
                        │                 │
                        │ • Smart Accounts│
                        │ • Delegations   │
                        │ • Pool Contracts│
                        └─────────────────┘
```

## 🔍 Key Features Demonstration

### AI Decision Engine
- **ML-based Analysis**: Multi-factor yield optimization
- **Confidence Scoring**: 0-100% confidence with thresholds
- **Risk Assessment**: Portfolio risk scoring and management
- **Real-time Processing**: Sub-30 second decision making

### Delegation Innovation
- **Granular Constraints**: Amount, pools, time, risk tolerance
- **Multi-layer Validation**: 6 different constraint checks
- **Usage Tracking**: Real-time monitoring of delegation usage
- **Automatic Expiry**: Time-based delegation termination

### Envio Integration
- **HyperSync Events**: Real-time pool monitoring
- **GraphQL Queries**: Rich pool data aggregation
- **Webhook Triggers**: Event-driven AI activation
- **Data Enrichment**: Enhanced pool analytics

### MetaMask Smart Accounts
- **Gasless Transactions**: Sponsored transaction execution
- **Advanced Permissions**: Delegation-based authorization
- **Bundler Integration**: ERC-4337 user operations
- **Monad Deployment**: Full testnet integration

## 📊 Demo Data Points

### Portfolio Metrics
- **Total Value**: $4,600 across 2 positions
- **Weighted APY**: 11.8% (optimized from 9.2%)
- **Risk Score**: 0.35 (Medium risk, well-balanced)
- **Daily Earnings**: $1.39 (projected)

### AI Performance
- **Analysis Speed**: < 15 seconds from trigger to decision
- **Confidence Score**: 87% (above 80% threshold)
- **APY Improvement**: +2.6% through optimal rebalancing
- **Gas Optimization**: 23% savings via bundled transactions

### Delegation Constraints
- **Max Amount**: 2.5 ETH (0.5 ETH used, 2.0 ETH remaining)
- **Allowed Pools**: 3 pools (USDC/ETH, WETH/USDT, DAI/USDC)
- **Expiry**: 23.5 hours remaining
- **Risk Tolerance**: Medium (max 0.2 risk increase)

## 🎤 Key Talking Points

1. **"This isn't just another DeFi bot"**
   - Emphasize AI decision making with confidence scoring
   - Highlight delegation constraints and user control

2. **"Security and transparency first"**
   - Show scoped delegations with multiple constraints
   - Demonstrate complete audit trail

3. **"Real-time optimization"**
   - Envio integration for instant market response
   - Sub-30 second execution from trigger to completion

4. **"Social DeFi innovation"**
   - Farcaster notifications and mini app
   - Community engagement layer

5. **"Production-ready architecture"**
   - Comprehensive error handling and fallbacks
   - Scalable microservices design

## 🔧 Troubleshooting

### Common Issues
- **Port Conflicts**: Change ports in docker-compose.yml
- **API Errors**: Verify API keys in .env file
- **Database Issues**: Run with USE_MOCK_DATA=true
- **MetaMask Issues**: Ensure Monad testnet is added

### Fallback Demo
If APIs fail, the system gracefully falls back to:
- Mock pool data with realistic variance
- Simulated transaction hashes
- Local audit logging
- Cached delegation data

## 🏆 Innovation Highlights

1. **First AI-Driven Delegated DeFi**: Novel combination of AI and delegation frameworks
2. **Multi-Dimensional Constraints**: Beyond simple amount limits
3. **Real-time Market Response**: Envio-powered instant optimization
4. **Social Integration**: Farcaster notifications and mini app
5. **Complete Transparency**: Full audit trail with rationale

## 📈 Future Roadmap

- **Multi-chain Support**: Expand beyond Monad
- **Advanced AI Models**: GPT-4 integration for complex strategies
- **Social Trading**: Follow successful AI strategies
- **Institutional Features**: Multi-sig delegations and compliance
- **Mobile App**: Native iOS/Android applications

---

**Built for MetaMask Smart Accounts × Monad Dev Cook Off**  
*Demonstrating the future of autonomous DeFi optimization*