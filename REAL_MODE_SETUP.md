# Real Mode Setup - No Mock Data

This guide explains how to use the AI Yield Agent with real Monad testnet tokens and actual blockchain transactions.

## 🚨 Important Changes

**ALL MOCK DATA HAS BEEN REMOVED**. The application now requires:
- Real MetaMask wallet connection
- Actual MON tokens on Monad Testnet
- Real smart contract interactions

## 🔧 Prerequisites

### 1. Install MetaMask
- Download and install MetaMask browser extension
- Create or import a wallet

### 2. Get Monad Testnet Tokens
- Visit Monad Testnet Faucet: https://faucet.monad.xyz
- Request MON tokens for your wallet address
- You need MON for gas fees

### 3. Network Configuration
The app automatically adds Monad Testnet to MetaMask:
- **Chain ID**: 10143 (0x279F)
- **RPC URL**: https://rpc.ankr.com/monad_testnet
- **Currency**: MON
- **Explorer**: https://testnet.monadexplorer.com

## 🚀 How to Use

### 1. Connect Wallet
- Click "Connect MetaMask"
- Approve network addition if prompted
- Switch to Monad Testnet
- Approve account connection

### 2. Smart Account Setup
- The app will initialize a real smart account
- This creates a deterministic address based on your EOA
- Balance will show your actual MON tokens

### 3. Create Delegations
- Go to "Delegations" tab
- Click "Create Delegation"
- Fill in real contract addresses:
  - **Delegate**: AI Agent address (who can execute)
  - **Token Address**: ERC20 token contract
  - **Max Amount**: Maximum tokens in Wei
  - **Expiry**: Unix timestamp

### 4. Real Transactions
- All transactions require MON for gas
- Transaction hashes are real and viewable on explorer
- No mock data or simulation

## 📋 Real Contract Addresses

### Test Tokens (Deploy your own or use existing)
```
// Example test token addresses on Monad Testnet
USDC_TEST: "0x..." // Deploy your own
DAI_TEST: "0x..."  // Deploy your own
```

### AI Agent Address
```
AI_AGENT: "0x742d35Cc6634C0532925a3b8D4C9db4C8b9b8b8b" // Default
```

## 🔍 Verification

### Check Transactions
1. Copy transaction hash from app
2. Visit: https://testnet.monadexplorer.com
3. Paste hash to view transaction details

### Verify Delegations
- Delegations are signed messages stored off-chain
- Execution happens on-chain when AI agent acts
- Check audit logs for delegation usage

## ⚠️ Troubleshooting

### "MetaMask not found"
- Install MetaMask browser extension
- Refresh the page

### "Insufficient funds"
- Get MON tokens from faucet
- Check balance in MetaMask

### "Chain ID not supported" or Network Errors
- Manually add Monad Testnet to MetaMask:
  - Network Name: Monad Testnet
  - RPC URL: https://rpc.ankr.com/monad_testnet
  - Chain ID: 10143
  - Currency: MON
  - Explorer: https://testnet.monadexplorer.com
- Refresh page after adding network

### "Transaction failed"
- Ensure you have enough MON for gas
- Check if contract addresses are valid
- Verify network is Monad Testnet

### "Delegation creation failed"
- Check all form fields are valid addresses
- Ensure expiry is in the future
- Verify you have MON for signing

## 🔒 Security Notes

- **Real Money**: MON tokens have value, use carefully
- **Private Keys**: Never share your private keys
- **Test Environment**: This is testnet, but treat as real
- **Delegation Limits**: Set reasonable max amounts
- **Expiry Times**: Use appropriate delegation durations

## 📊 Monitoring

### Real-time Updates
- Balance updates after transactions
- Delegation status reflects actual state
- Transaction confirmations from blockchain

### Audit Trail
- All actions logged with real transaction hashes
- Timestamps from actual block times
- No simulated or mock data

## 🎯 Next Steps

1. **Deploy Contracts**: Deploy your own yield farming contracts
2. **Configure Pools**: Add real DeFi pool addresses
3. **Set Strategies**: Configure AI agent with real parameters
4. **Monitor Performance**: Track actual yield optimization

---

**Remember**: This is now a fully functional DeFi application using real blockchain transactions. Always verify addresses and amounts before confirming transactions.