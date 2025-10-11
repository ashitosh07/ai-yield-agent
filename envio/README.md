# AI Yield Agent - Envio HyperIndex Integration

## 🎯 Real-time DeFi Pool Indexing

This Envio HyperIndex indexer provides real-time monitoring and analytics for DeFi pools on Monad testnet, powering the AI Yield Agent's autonomous optimization decisions.

## 🏗️ Architecture

```
Monad Testnet → Envio HyperSync → Event Handlers → GraphQL API → AI Agent
```

## 📊 Indexed Data

### Pool Metrics
- **Real-time APY calculations** from fees and TVL
- **Risk scoring** based on volatility and liquidity
- **Volume tracking** for 24h periods
- **Reserve monitoring** for liquidity depth

### User Positions
- **Balance tracking** across all pools
- **USD value calculations** with live pricing
- **Position history** and performance metrics

### AI Actions
- **Autonomous rebalance tracking**
- **Confidence scoring** for each decision
- **Execution status** and transaction hashes
- **Performance attribution**

## 🚀 Quick Start

```bash
# Install Envio CLI
npm install -g envio

# Setup indexer
cd envio
npm install

# Generate types
envio codegen

# Start indexer (requires Monad testnet RPC)
envio dev
```

## 📈 GraphQL Queries

### Get Pool Data
```graphql
query GetPools {
  Pool {
    address
    name
    apy
    tvlUSD
    riskScore
    lastUpdated
  }
}
```

### Get User Positions
```graphql
query GetUserPositions($user: String!) {
  UserPosition(where: { user: { _eq: $user } }) {
    pool { name apy }
    balance
    valueUSD
  }
}
```

### Get AI Actions
```graphql
query GetAIActions($user: String!) {
  AIAction(where: { user: { _eq: $user } }) {
    fromPool { name }
    toPool { name }
    amount
    confidence
    rationale
    status
  }
}
```

## 🔄 Real-time Features

- **WebSocket subscriptions** for live pool updates
- **Automatic AI triggering** on significant APY changes
- **Event-driven architecture** with webhook integration
- **Sub-second latency** from blockchain to AI decision

## 🎯 Hackathon Integration

This indexer demonstrates:
- ✅ **Working Envio indexer** with comprehensive event handling
- ✅ **HyperSync API queries** for historical data
- ✅ **Envio-powered endpoints** consumed by frontend
- ✅ **Real-time GraphQL subscriptions** for live updates
- ✅ **Custom event handlers** for yield calculations

## 📝 Event Handlers

### Sync Events
- Updates pool reserves and TVL
- Recalculates APY and risk scores
- Triggers AI analysis on significant changes

### Swap Events  
- Tracks trading volume and fees
- Updates 24h metrics
- Calculates price impact

### Transfer Events
- Monitors user position changes
- Updates balance tracking
- Calculates portfolio values

## 🔗 Integration Points

- **Backend API**: Consumes GraphQL data via `envio-hyperindex.js`
- **AI Agent**: Receives webhook triggers on pool changes
- **Frontend**: Real-time updates via GraphQL subscriptions
- **Audit System**: Tracks all AI actions and decisions