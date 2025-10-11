# 🧪 Farcaster Mini App Testing Guide

## 🚀 Quick Test Setup

### 1. Start All Services
```bash
# Run the startup script
start_all.bat

# Or manually:
cd backend && npm start     # Port 3002
cd agent && python main.py # Port 3003  
cd frontend && npm run dev  # Port 3000
cd farcaster && npm start   # Port 3006
```

### 2. Test Frame URLs

#### Portfolio Frame
```
http://localhost:3006/frame/portfolio/0xfB0A5Ebf31A15Ee3cD51080F1bCAC39Cd676343f
```
- Shows AI-optimized portfolio metrics
- Interactive buttons: Refresh, Rebalance, Settings
- Dynamic image generation with real data

#### Delegation Frame  
```
http://localhost:3006/frame/delegate
```
- Delegation setup interface
- Security features explanation
- Direct app integration

#### Action Approval Frame
```
http://localhost:3006/frame/approve/demo-123
```
- AI rebalance proposal display
- Confidence scoring (87%)
- Approve/Reject buttons with rationale

### 3. Frontend Integration Test

1. Open http://localhost:3000
2. Connect wallet
3. Navigate to "Social" tab (🎭)
4. Click frame share buttons
5. Test frame URLs (copied to clipboard)

### 4. Frame Functionality Test

#### Test Portfolio Frame:
1. Visit portfolio frame URL
2. Check dynamic image loads
3. Verify real portfolio data display
4. Test button interactions

#### Test Action Approval:
1. Visit approval frame URL  
2. Check confidence scoring display
3. Test approve/reject buttons
4. Verify action logging

#### Test Delegation Setup:
1. Visit delegation frame URL
2. Check security features display
3. Test "Create Delegation" flow
4. Verify app integration

### 5. API Integration Test

#### Backend APIs:
```bash
# Test AI actions API
curl http://localhost:3002/api/ai-actions/demo-123

# Test portfolio API  
curl http://localhost:3002/api/pools/positions/0xfB0A5Ebf31A15Ee3cD51080F1bCAC39Cd676343f

# Test pools API
curl http://localhost:3002/api/pools
```

#### Frame Image APIs:
```bash
# Test image generation
curl http://localhost:3006/api/frame/portfolio-image/0xfB0A5Ebf31A15Ee3cD51080F1bCAC39Cd676343f

curl http://localhost:3006/api/frame/action-image/demo-123

curl http://localhost:3006/api/frame/delegate-image
```

## 🎯 Expected Results

### ✅ Working Features:
- **Dynamic frame images** with real-time data
- **Interactive buttons** with proper meta tags
- **Backend integration** for live portfolio data
- **Action approval flow** with confidence scoring
- **Frontend integration** via Social tab
- **URL generation** and clipboard copying

### 🔧 Test Scenarios:

#### Scenario 1: Portfolio Sharing
1. User clicks "Share Portfolio Frame" in frontend
2. Frame URL copied to clipboard
3. Frame displays live portfolio metrics
4. Buttons trigger portfolio actions

#### Scenario 2: AI Action Approval  
1. AI generates rebalance proposal
2. Frame shows proposal with confidence
3. User clicks Approve/Reject
4. Action logged to audit trail

#### Scenario 3: Delegation Setup
1. User shares delegation frame
2. Frame explains security features
3. "Create Delegation" redirects to app
4. Full delegation flow completed

## 🐛 Troubleshooting

### Common Issues:
- **Canvas errors**: Install canvas dependencies
- **Port conflicts**: Check all services running
- **API errors**: Verify backend routes registered
- **Image generation**: Check Canvas/Sharp installation

### Debug Commands:
```bash
# Check service status
netstat -an | findstr :3006
netstat -an | findstr :3002

# Test frame HTML
curl http://localhost:3006/frame/delegate

# Test image generation
curl -I http://localhost:3006/api/frame/delegate-image
```

## 📱 Farcaster Client Testing

### For Real Farcaster Testing:
1. Deploy frames to public URL (ngrok/Vercel)
2. Create Farcaster cast with frame URL
3. Test in Warpcast or other Farcaster clients
4. Verify button interactions work

### Frame Validator:
Use https://warpcast.com/~/developers/frames to validate frame HTML and meta tags.

## ✅ Success Criteria

- [ ] All frame URLs load without errors
- [ ] Dynamic images generate with real data  
- [ ] Interactive buttons have proper meta tags
- [ ] Backend APIs return valid data
- [ ] Frontend integration works smoothly
- [ ] Action approval flow completes
- [ ] Portfolio data displays correctly
- [ ] Delegation setup flow functional

This testing setup demonstrates a **complete Farcaster Mini App** with real blockchain integration, qualifying for the **Best Farcaster Mini App** bonus bounty!