# 🔗 Real Wallet Integration Setup

## 🚨 **Current Status: Demo Mode**
The application is currently running in **demo mode** with mock wallet addresses and simplified Smart Account services for hackathon demonstration purposes.

## 🔧 **To Enable Real Wallet Integration:**

### 1. **Install Required Packages**
```bash
cd frontend
npm install @metamask/delegation-toolkit viem@latest wagmi@latest @tanstack/react-query
```

### 2. **Replace Mock Components**
Replace these files to enable real wallet connection:

**In `src/app/page.tsx`:**
```tsx
import { RealWalletConnect } from '../components/RealWalletConnect';

// Replace SimpleConnectWallet with RealWalletConnect
if (!isConnected) {
  return <RealWalletConnect onConnect={handleConnect} />;
}
```

### 3. **Enable Real Smart Account Service**
**In `src/hooks/useSmartAccount.js`:**
```javascript
// Replace this line:
import { simplifiedSmartAccountService } from '../lib/simplifiedSmartAccount';

// With:
import { smartAccountService } from '../lib/smartAccount';
```

### 4. **MetaMask Setup Requirements**

#### **Install MetaMask Extension**
- Download from: https://metamask.io/download/

#### **Add Monad Testnet**
- **Network Name**: Monad Testnet
- **RPC URL**: https://testnet1.monad.xyz
- **Chain ID**: 10143
- **Currency Symbol**: MON
- **Block Explorer**: https://testnet.monadexplorer.com

#### **Get Test Tokens**
- Visit Monad testnet faucet
- Request test MON tokens for gas fees
- Get test USDC/USDT for delegation testing

### 5. **Smart Account Deployment**

The real Smart Account integration will:
- ✅ Deploy actual MetaMask Smart Account on Monad
- ✅ Create real delegation transactions
- ✅ Execute transactions through bundler
- ✅ Generate real transaction hashes

### 6. **Environment Variables**
Create `.env.local` in frontend:
```env
NEXT_PUBLIC_MONAD_RPC_URL=https://testnet1.monad.xyz
NEXT_PUBLIC_MONAD_BUNDLER_URL=https://testnet-bundler.monad.xyz
NEXT_PUBLIC_WALLET_CONNECT_PROJECT_ID=your_project_id
```

## 🎯 **Demo vs Production Mode**

### **Current Demo Mode:**
- ✅ Mock wallet addresses
- ✅ Simplified Smart Account
- ✅ Mock transaction hashes
- ✅ Full UI functionality
- ✅ Backend API integration
- ✅ Perfect for hackathon demo

### **Production Mode (After Setup):**
- 🔗 Real MetaMask connection
- 🔗 Real Smart Account deployment
- 🔗 Real delegation transactions
- 🔗 Real Monad testnet integration
- 🔗 Real transaction validation

## 🚀 **Quick Enable Real Wallet**

To quickly enable real wallet for testing:

1. **Replace wallet connection:**
```bash
# In src/app/page.tsx, replace:
<SimpleConnectWallet onConnect={handleConnect} />
# With:
<RealWalletConnect onConnect={handleConnect} />
```

2. **Install MetaMask and add Monad Testnet**

3. **Get test tokens from faucet**

4. **Test delegation creation**

## ⚠️ **Important Notes**

- **Demo mode is perfect for hackathon judging** - shows all functionality
- **Real mode requires MetaMask setup** - may cause connection issues
- **All backend APIs work in both modes** - no changes needed
- **UI is identical in both modes** - seamless experience

## 🏆 **Recommendation for Hackathon**

**Keep demo mode enabled** for judging to ensure:
- ✅ No wallet connection issues
- ✅ Smooth demonstration flow
- ✅ All features work reliably
- ✅ Focus on AI and delegation logic

**Enable real mode** only for:
- 🔧 Technical deep-dive sessions
- 🔧 Live transaction demonstrations
- 🔧 Validator testing