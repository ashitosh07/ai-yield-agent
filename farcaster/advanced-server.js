const express = require('express');
const axios = require('axios');
const sharp = require('sharp');
const QRCode = require('qrcode');

const app = express();
app.use(express.json());
app.use(express.static('public'));

const PORT = process.env.PORT || 3004;
const BASE_URL = process.env.BASE_URL || `http://localhost:${PORT}`;
const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:3002';

// Advanced SVG-based image generation (no canvas dependency)
class FrameImageGenerator {
  static async generateActionFrame(actionData) {
    const confidence = Math.round(actionData.confidence * 100);
    const confidenceColor = confidence > 80 ? '#10b981' : confidence > 60 ? '#f59e0b' : '#ef4444';
    
    const svg = `
      <svg width="1200" height="630" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" style="stop-color:#1a1a2e;stop-opacity:1" />
            <stop offset="100%" style="stop-color:#16213e;stop-opacity:1" />
          </linearGradient>
          <linearGradient id="cardBg" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" style="stop-color:rgba(255,255,255,0.1);stop-opacity:1" />
            <stop offset="100%" style="stop-color:rgba(255,255,255,0.05);stop-opacity:1" />
          </linearGradient>
        </defs>
        
        <!-- Background -->
        <rect width="1200" height="630" fill="url(#bg)"/>
        
        <!-- Header -->
        <text x="60" y="80" font-family="Arial, sans-serif" font-size="48" font-weight="bold" fill="#ffffff">
          🤖 AI Yield Agent
        </text>
        <text x="60" y="120" font-family="Arial, sans-serif" font-size="24" fill="#a0a0a0">
          Autonomous Rebalance Proposal
        </text>
        
        <!-- Main Card -->
        <rect x="50" y="160" width="1100" height="300" fill="url(#cardBg)" stroke="#4ade80" stroke-width="3" rx="12"/>
        
        <!-- Action Details -->
        <text x="80" y="220" font-family="Arial, sans-serif" font-size="32" font-weight="bold" fill="#ffffff">
          From: ${actionData.fromPool || 'USDC/ETH Pool'}
        </text>
        <text x="80" y="270" font-family="Arial, sans-serif" font-size="32" font-weight="bold" fill="#ffffff">
          To: ${actionData.toPool || 'DAI/USDC Pool'}
        </text>
        <text x="80" y="320" font-family="Arial, sans-serif" font-size="32" font-weight="bold" fill="#ffffff">
          Amount: ${actionData.amount || '2.5'} ETH
        </text>
        
        <!-- Confidence Badge -->
        <rect x="80" y="350" width="300" height="60" fill="${confidenceColor}" rx="8"/>
        <text x="230" y="390" font-family="Arial, sans-serif" font-size="28" font-weight="bold" fill="#ffffff" text-anchor="middle">
          Confidence: ${confidence}%
        </text>
        
        <!-- Expected Gain -->
        <text x="80" y="440" font-family="Arial, sans-serif" font-size="28" font-weight="bold" fill="#4ade80">
          Expected APY Gain: +${actionData.expectedGain || '4.2'}%
        </text>
        
        <!-- Footer -->
        <text x="60" y="580" font-family="Arial, sans-serif" font-size="20" fill="#64748b">
          Powered by MetaMask Smart Accounts × Monad × Envio HyperSync
        </text>
        
        <!-- Status Indicator -->
        <circle cx="1120" cy="80" r="20" fill="#10b981"/>
        <text x="1120" y="87" font-family="Arial, sans-serif" font-size="16" fill="#ffffff" text-anchor="middle">✓</text>
      </svg>
    `;
    
    return await sharp(Buffer.from(svg))
      .png()
      .toBuffer();
  }

  static async generatePortfolioFrame(portfolioData) {
    const totalValue = portfolioData.totalValue || 12500;
    const dailyEarnings = portfolioData.dailyEarnings || 45.67;
    const positions = portfolioData.positions?.length || 3;
    const apyGain = portfolioData.apyGain || 12.3;
    
    const svg = `
      <svg width="1200" height="630" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" style="stop-color:#0f172a;stop-opacity:1" />
            <stop offset="100%" style="stop-color:#1e293b;stop-opacity:1" />
          </linearGradient>
          <linearGradient id="cardBg" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" style="stop-color:rgba(255,255,255,0.1);stop-opacity:1" />
            <stop offset="100%" style="stop-color:rgba(255,255,255,0.05);stop-opacity:1" />
          </linearGradient>
        </defs>
        
        <!-- Background -->
        <rect width="1200" height="630" fill="url(#bg)"/>
        
        <!-- Header -->
        <text x="60" y="70" font-family="Arial, sans-serif" font-size="42" font-weight="bold" fill="#ffffff">
          📊 AI-Optimized Portfolio
        </text>
        
        <!-- Main Stats Card -->
        <rect x="50" y="100" width="1100" height="400" fill="url(#cardBg)" rx="12"/>
        
        <!-- Portfolio Value -->
        <text x="80" y="160" font-family="Arial, sans-serif" font-size="36" font-weight="bold" fill="#ffffff">
          Total Value: $${totalValue.toLocaleString()}
        </text>
        
        <!-- Daily Earnings -->
        <text x="80" y="210" font-family="Arial, sans-serif" font-size="32" font-weight="bold" fill="#4ade80">
          Daily Earnings: $${dailyEarnings}
        </text>
        
        <!-- Active Positions -->
        <text x="80" y="260" font-family="Arial, sans-serif" font-size="28" fill="#60a5fa">
          Active Positions: ${positions}
        </text>
        
        <!-- AI Status -->
        <rect x="80" y="290" width="200" height="40" fill="#10b981" rx="6"/>
        <text x="180" y="315" font-family="Arial, sans-serif" font-size="18" font-weight="bold" fill="#ffffff" text-anchor="middle">
          🤖 AI ACTIVE
        </text>
        
        <text x="80" y="350" font-family="Arial, sans-serif" font-size="20" fill="#a0a0a0">
          Monitoring 3 pools • Last optimization: 2h ago
        </text>
        
        <!-- Performance -->
        <text x="80" y="420" font-family="Arial, sans-serif" font-size="28" font-weight="bold" fill="#4ade80">
          📈 +${apyGain}% APY (AI Optimized)
        </text>
        
        <!-- Address -->
        <text x="60" y="580" font-family="Arial, sans-serif" font-size="18" fill="#64748b">
          Address: ${portfolioData.address?.slice(0, 6)}...${portfolioData.address?.slice(-4)}
        </text>
        
        <!-- Live Indicator -->
        <circle cx="1120" cy="60" r="8" fill="#10b981">
          <animate attributeName="opacity" values="1;0.3;1" dur="2s" repeatCount="indefinite"/>
        </circle>
        <text x="1120" y="90" font-family="Arial, sans-serif" font-size="14" fill="#10b981" text-anchor="middle">LIVE</text>
      </svg>
    `;
    
    return await sharp(Buffer.from(svg))
      .png()
      .toBuffer();
  }

  static async generateDelegationFrame() {
    const svg = `
      <svg width="1200" height="630" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" style="stop-color:#1e1b4b;stop-opacity:1" />
            <stop offset="100%" style="stop-color:#312e81;stop-opacity:1" />
          </linearGradient>
          <linearGradient id="cardBg" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" style="stop-color:rgba(255,255,255,0.1);stop-opacity:1" />
            <stop offset="100%" style="stop-color:rgba(255,255,255,0.05);stop-opacity:1" />
          </linearGradient>
        </defs>
        
        <!-- Background -->
        <rect width="1200" height="630" fill="url(#bg)"/>
        
        <!-- Header -->
        <text x="60" y="80" font-family="Arial, sans-serif" font-size="48" font-weight="bold" fill="#ffffff">
          🔐 Delegate to AI Agent
        </text>
        
        <!-- Features Card -->
        <rect x="50" y="120" width="1100" height="350" fill="url(#cardBg)" rx="12"/>
        
        <!-- Feature List -->
        <text x="80" y="180" font-family="Arial, sans-serif" font-size="32" fill="#ffffff">
          ✅ Scoped Permissions - Only approved pools
        </text>
        <text x="80" y="230" font-family="Arial, sans-serif" font-size="32" fill="#ffffff">
          ✅ Time Limits - Automatic expiry
        </text>
        <text x="80" y="280" font-family="Arial, sans-serif" font-size="32" fill="#ffffff">
          ✅ Amount Caps - Maximum exposure limits
        </text>
        <text x="80" y="330" font-family="Arial, sans-serif" font-size="32" fill="#ffffff">
          ✅ Full Transparency - Complete audit trail
        </text>
        <text x="80" y="380" font-family="Arial, sans-serif" font-size="32" fill="#ffffff">
          ✅ MetaMask Smart Accounts - Gasless execution
        </text>
        <text x="80" y="430" font-family="Arial, sans-serif" font-size="32" fill="#ffffff">
          ✅ Envio Real-time - Instant notifications
        </text>
        
        <!-- CTA -->
        <text x="60" y="540" font-family="Arial, sans-serif" font-size="36" font-weight="bold" fill="#4ade80">
          Enable Autonomous Yield Optimization
        </text>
        
        <!-- Security Badge -->
        <rect x="950" y="140" width="180" height="80" fill="#4ade80" rx="8"/>
        <text x="1040" y="170" font-family="Arial, sans-serif" font-size="16" font-weight="bold" fill="#ffffff" text-anchor="middle">
          SECURE
        </text>
        <text x="1040" y="190" font-family="Arial, sans-serif" font-size="16" font-weight="bold" fill="#ffffff" text-anchor="middle">
          DELEGATION
        </text>
        <text x="1040" y="210" font-family="Arial, sans-serif" font-size="14" fill="#ffffff" text-anchor="middle">
          🛡️ AUDITED
        </text>
      </svg>
    `;
    
    return await sharp(Buffer.from(svg))
      .png()
      .toBuffer();
  }

  static async generateSuccessFrame(message = 'Action Approved!') {
    const svg = `
      <svg width="1200" height="630" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <radialGradient id="bg" cx="50%" cy="50%" r="50%">
            <stop offset="0%" style="stop-color:#10b981;stop-opacity:1" />
            <stop offset="100%" style="stop-color:#059669;stop-opacity:1" />
          </radialGradient>
        </defs>
        
        <!-- Background -->
        <rect width="1200" height="630" fill="url(#bg)"/>
        
        <!-- Success Icon -->
        <circle cx="600" cy="200" r="80" fill="rgba(255,255,255,0.2)" stroke="#ffffff" stroke-width="4"/>
        <text x="600" y="220" font-family="Arial, sans-serif" font-size="60" fill="#ffffff" text-anchor="middle">✅</text>
        
        <!-- Message -->
        <text x="600" y="350" font-family="Arial, sans-serif" font-size="48" font-weight="bold" fill="#ffffff" text-anchor="middle">
          ${message}
        </text>
        
        <!-- Subtitle -->
        <text x="600" y="400" font-family="Arial, sans-serif" font-size="24" fill="rgba(255,255,255,0.8)" text-anchor="middle">
          AI agent will execute shortly
        </text>
        
        <!-- Footer -->
        <text x="600" y="550" font-family="Arial, sans-serif" font-size="18" fill="rgba(255,255,255,0.6)" text-anchor="middle">
          Transaction will be processed on Monad testnet
        </text>
      </svg>
    `;
    
    return await sharp(Buffer.from(svg))
      .png()
      .toBuffer();
  }
}

// Enhanced Frame Routes with Real Data
app.get('/frame/approve/:actionId', async (req, res) => {
  const { actionId } = req.params;
  
  try {
    const actionResponse = await axios.get(`${BACKEND_URL}/api/ai-actions/${actionId}`);
    const action = actionResponse.data.data;

    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1">
          <meta property="fc:frame" content="vNext">
          <meta property="fc:frame:image" content="${BASE_URL}/api/frame/action-image/${actionId}">
          <meta property="fc:frame:button:1" content="✅ Approve (${Math.round(action.confidence * 100)}%)">
          <meta property="fc:frame:button:2" content="❌ Reject">
          <meta property="fc:frame:button:3" content="📊 View Details">
          <meta property="fc:frame:button:4" content="🔄 Refresh Data">
          <meta property="fc:frame:post_url" content="${BASE_URL}/api/frame/action/${actionId}">
          <meta property="fc:frame:image:aspect_ratio" content="1.91:1">
          <title>AI Yield Agent - Action Approval</title>
          
          <!-- Open Graph -->
          <meta property="og:title" content="AI Yield Agent - Action Approval">
          <meta property="og:description" content="Review and approve AI-recommended yield optimization">
          <meta property="og:image" content="${BASE_URL}/api/frame/action-image/${actionId}">
          
          <!-- Twitter -->
          <meta name="twitter:card" content="summary_large_image">
          <meta name="twitter:title" content="AI Yield Agent - Action Approval">
          <meta name="twitter:description" content="Review and approve AI-recommended yield optimization">
          <meta name="twitter:image" content="${BASE_URL}/api/frame/action-image/${actionId}">
        </head>
        <body style="margin: 0; padding: 20px; font-family: Arial, sans-serif; background: linear-gradient(135deg, #1a1a2e, #16213e); color: white; min-height: 100vh;">
          <div style="max-width: 800px; margin: 0 auto;">
            <h1 style="text-align: center; margin-bottom: 30px;">🤖 AI Yield Agent</h1>
            
            <div style="background: rgba(255,255,255,0.1); padding: 30px; border-radius: 16px; border: 2px solid #4ade80; margin-bottom: 20px;">
              <h2 style="color: #4ade80; margin-top: 0;">Proposed Rebalance</h2>
              
              <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin: 20px 0;">
                <div>
                  <strong>From Pool:</strong><br>
                  <span style="color: #60a5fa;">${action.fromPool}</span>
                </div>
                <div>
                  <strong>To Pool:</strong><br>
                  <span style="color: #4ade80;">${action.toPool}</span>
                </div>
                <div>
                  <strong>Amount:</strong><br>
                  <span style="font-size: 1.2em;">${action.amount} ETH</span>
                </div>
                <div>
                  <strong>Expected Gain:</strong><br>
                  <span style="color: #4ade80; font-size: 1.2em;">+${action.expectedGain}%</span>
                </div>
              </div>
              
              <div style="background: rgba(16,185,129,0.2); padding: 15px; border-radius: 8px; border-left: 4px solid #10b981; margin: 20px 0;">
                <strong>AI Confidence:</strong> 
                <span style="color: #4ade80; font-size: 1.3em;">${Math.round(action.confidence * 100)}%</span>
              </div>
              
              <div style="background: rgba(255,255,255,0.05); padding: 15px; border-radius: 8px; margin-top: 20px;">
                <strong>Rationale:</strong><br>
                <em>${action.rationale}</em>
              </div>
            </div>
            
            <div style="text-align: center; color: #64748b;">
              <p>Use Farcaster frame buttons above to interact</p>
              <p style="font-size: 0.9em;">Powered by MetaMask Smart Accounts × Monad × Envio</p>
            </div>
          </div>
        </body>
      </html>
    `;
    
    res.send(html);
  } catch (error) {
    console.error('Error loading action:', error);
    res.status(500).send(`
      <html>
        <body style="background: #1a1a2e; color: white; text-align: center; padding: 50px;">
          <h1>⚠️ Error Loading Action</h1>
          <p>Action ID: ${actionId}</p>
          <p>Please try again later</p>
        </body>
      </html>
    `);
  }
});

app.get('/frame/portfolio/:userAddress', async (req, res) => {
  const { userAddress } = req.params;
  
  try {
    const portfolioResponse = await axios.get(`${BACKEND_URL}/api/pools/positions/${userAddress}`);
    const portfolio = portfolioResponse.data;
    
    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1">
          <meta property="fc:frame" content="vNext">
          <meta property="fc:frame:image" content="${BASE_URL}/api/frame/portfolio-image/${userAddress}">
          <meta property="fc:frame:button:1" content="📊 Refresh Data">
          <meta property="fc:frame:button:2" content="🔄 Rebalance Now">
          <meta property="fc:frame:button:3" content="⚙️ Settings">
          <meta property="fc:frame:button:4" content="📱 Open App">
          <meta property="fc:frame:post_url" content="${BASE_URL}/api/frame/portfolio-action/${userAddress}">
          <meta property="fc:frame:image:aspect_ratio" content="1.91:1">
          <title>AI Yield Agent - Portfolio</title>
        </head>
        <body style="margin: 0; padding: 20px; font-family: Arial, sans-serif; background: linear-gradient(135deg, #0f172a, #1e293b); color: white; min-height: 100vh;">
          <div style="max-width: 800px; margin: 0 auto;">
            <h1 style="text-align: center;">📊 Your AI-Optimized Portfolio</h1>
            
            <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 20px; margin: 30px 0;">
              <div style="background: rgba(255,255,255,0.1); padding: 20px; border-radius: 12px; text-align: center;">
                <h3 style="color: #4ade80; margin: 0;">Total Value</h3>
                <p style="font-size: 1.5em; margin: 10px 0;">$${portfolio.totalValue?.toLocaleString() || '0'}</p>
              </div>
              <div style="background: rgba(255,255,255,0.1); padding: 20px; border-radius: 12px; text-align: center;">
                <h3 style="color: #60a5fa; margin: 0;">Daily Earnings</h3>
                <p style="font-size: 1.5em; margin: 10px 0;">$${portfolio.totalDailyEarnings?.toFixed(2) || '0'}</p>
              </div>
              <div style="background: rgba(255,255,255,0.1); padding: 20px; border-radius: 12px; text-align: center;">
                <h3 style="color: #f59e0b; margin: 0;">Positions</h3>
                <p style="font-size: 1.5em; margin: 10px 0;">${portfolio.data?.length || 0}</p>
              </div>
            </div>
            
            <div style="background: rgba(16,185,129,0.2); padding: 20px; border-radius: 12px; border: 2px solid #10b981; text-align: center;">
              <h3 style="margin: 0;">🤖 AI Agent Status: ACTIVE</h3>
              <p style="margin: 10px 0;">Monitoring ${portfolio.data?.length || 0} pools • Last optimization: 2h ago</p>
              <p style="color: #4ade80; font-size: 1.2em; margin: 0;">📈 +12.3% APY (AI Optimized)</p>
            </div>
          </div>
        </body>
      </html>
    `;
    
    res.send(html);
  } catch (error) {
    console.error('Error loading portfolio:', error);
    res.status(500).send('Error loading portfolio');
  }
});

app.get('/frame/delegate', (req, res) => {
  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1">
        <meta property="fc:frame" content="vNext">
        <meta property="fc:frame:image" content="${BASE_URL}/api/frame/delegate-image">
        <meta property="fc:frame:button:1" content="🔐 Create Delegation">
        <meta property="fc:frame:button:2" content="📱 Open App">
        <meta property="fc:frame:button:3" content="📋 View Guide">
        <meta property="fc:frame:button:4" content="🔍 Check Status">
        <meta property="fc:frame:post_url" content="${BASE_URL}/api/frame/delegate-action">
        <meta property="fc:frame:image:aspect_ratio" content="1.91:1">
        <title>AI Yield Agent - Create Delegation</title>
      </head>
      <body style="margin: 0; padding: 20px; font-family: Arial, sans-serif; background: linear-gradient(135deg, #1e1b4b, #312e81); color: white; min-height: 100vh;">
        <div style="max-width: 800px; margin: 0 auto;">
          <h1 style="text-align: center;">🔐 Delegate to AI Agent</h1>
          
          <div style="background: rgba(255,255,255,0.1); padding: 30px; border-radius: 16px; margin: 20px 0;">
            <h2 style="color: #4ade80; margin-top: 0;">Secure Delegation Features</h2>
            
            <div style="display: grid; gap: 15px;">
              <div style="display: flex; align-items: center; gap: 15px;">
                <span style="color: #4ade80; font-size: 1.5em;">✅</span>
                <div>
                  <strong>Scoped Permissions</strong><br>
                  <span style="color: #a0a0a0;">Only approved pools and actions</span>
                </div>
              </div>
              <div style="display: flex; align-items: center; gap: 15px;">
                <span style="color: #4ade80; font-size: 1.5em;">✅</span>
                <div>
                  <strong>Time Limits</strong><br>
                  <span style="color: #a0a0a0;">Automatic expiry for safety</span>
                </div>
              </div>
              <div style="display: flex; align-items: center; gap: 15px;">
                <span style="color: #4ade80; font-size: 1.5em;">✅</span>
                <div>
                  <strong>Amount Caps</strong><br>
                  <span style="color: #a0a0a0;">Maximum exposure limits</span>
                </div>
              </div>
              <div style="display: flex; align-items: center; gap: 15px;">
                <span style="color: #4ade80; font-size: 1.5em;">✅</span>
                <div>
                  <strong>Full Transparency</strong><br>
                  <span style="color: #a0a0a0;">Complete audit trail</span>
                </div>
              </div>
            </div>
          </div>
          
          <div style="text-align: center; background: rgba(16,185,129,0.2); padding: 20px; border-radius: 12px;">
            <h3 style="color: #4ade80; margin: 0;">Enable Autonomous Yield Optimization</h3>
            <p style="margin: 10px 0;">Powered by MetaMask Smart Accounts</p>
          </div>
        </div>
      </body>
    </html>
  `;
  
  res.send(html);
});

// Advanced Image API Routes
app.get('/api/frame/action-image/:actionId', async (req, res) => {
  const { actionId } = req.params;
  
  try {
    const actionResponse = await axios.get(`${BACKEND_URL}/api/ai-actions/${actionId}`);
    const action = actionResponse.data.data;
    
    const imageBuffer = await FrameImageGenerator.generateActionFrame(action);
    
    res.setHeader('Content-Type', 'image/png');
    res.setHeader('Cache-Control', 'public, max-age=300'); // 5 minute cache
    res.send(imageBuffer);
  } catch (error) {
    console.error('Error generating action image:', error);
    
    // Fallback image
    const fallbackBuffer = await FrameImageGenerator.generateSuccessFrame('Error Loading Action');
    res.setHeader('Content-Type', 'image/png');
    res.send(fallbackBuffer);
  }
});

app.get('/api/frame/portfolio-image/:userAddress', async (req, res) => {
  const { userAddress } = req.params;
  
  try {
    const portfolioResponse = await axios.get(`${BACKEND_URL}/api/pools/positions/${userAddress}`);
    const portfolio = portfolioResponse.data;
    portfolio.address = userAddress;
    
    const imageBuffer = await FrameImageGenerator.generatePortfolioFrame(portfolio);
    
    res.setHeader('Content-Type', 'image/png');
    res.setHeader('Cache-Control', 'public, max-age=300');
    res.send(imageBuffer);
  } catch (error) {
    console.error('Error generating portfolio image:', error);
    
    const fallbackBuffer = await FrameImageGenerator.generatePortfolioFrame({ 
      address: userAddress,
      totalValue: 0,
      dailyEarnings: 0,
      positions: []
    });
    res.setHeader('Content-Type', 'image/png');
    res.send(fallbackBuffer);
  }
});

app.get('/api/frame/delegate-image', async (req, res) => {
  try {
    const imageBuffer = await FrameImageGenerator.generateDelegationFrame();
    
    res.setHeader('Content-Type', 'image/png');
    res.setHeader('Cache-Control', 'public, max-age=3600'); // 1 hour cache
    res.send(imageBuffer);
  } catch (error) {
    console.error('Error generating delegation image:', error);
    res.status(500).send('Error generating image');
  }
});

app.get('/api/frame/success-image', async (req, res) => {
  const message = req.query.message || 'Action Approved!';
  
  try {
    const imageBuffer = await FrameImageGenerator.generateSuccessFrame(message);
    
    res.setHeader('Content-Type', 'image/png');
    res.setHeader('Cache-Control', 'public, max-age=300');
    res.send(imageBuffer);
  } catch (error) {
    console.error('Error generating success image:', error);
    res.status(500).send('Error generating image');
  }
});

// Enhanced Frame Action Handlers
app.post('/api/frame/action/:actionId', async (req, res) => {
  const { actionId } = req.params;
  const buttonIndex = req.body.untrustedData?.buttonIndex;
  const fid = req.body.untrustedData?.fid;

  try {
    console.log(`Frame action: ${actionId}, button: ${buttonIndex}, user: ${fid}`);

    if (buttonIndex === 1) {
      // Approve action
      await axios.post(`${BACKEND_URL}/api/ai-actions/${actionId}/approve`, {
        approvedBy: fid,
        source: 'farcaster_frame'
      });
      
      res.json({
        type: 'frame',
        frameUrl: `${BASE_URL}/frame/success/${actionId}?message=Action+Approved`
      });
    } else if (buttonIndex === 2) {
      // Reject action
      await axios.post(`${BACKEND_URL}/api/ai-actions/${actionId}/reject`, {
        rejectedBy: fid,
        source: 'farcaster_frame'
      });
      
      res.json({
        type: 'frame',
        frameUrl: `${BASE_URL}/frame/success/${actionId}?message=Action+Rejected`
      });
    } else if (buttonIndex === 3) {
      // View details - redirect to app
      res.json({
        type: 'external_link',
        url: `http://localhost:3000?action=${actionId}`
      });
    } else if (buttonIndex === 4) {
      // Refresh data
      res.json({
        type: 'frame',
        frameUrl: `${BASE_URL}/frame/approve/${actionId}?refresh=${Date.now()}`
      });
    }
  } catch (error) {
    console.error('Frame action error:', error);
    res.status(500).json({ 
      error: 'Action failed',
      type: 'frame',
      frameUrl: `${BASE_URL}/frame/error?message=Action+Failed`
    });
  }
});

app.post('/api/frame/portfolio-action/:userAddress', async (req, res) => {
  const { userAddress } = req.params;
  const buttonIndex = req.body.untrustedData?.buttonIndex;
  const fid = req.body.untrustedData?.fid;

  try {
    if (buttonIndex === 1) {
      // Refresh data
      res.json({
        type: 'frame',
        frameUrl: `${BASE_URL}/frame/portfolio/${userAddress}?refresh=${Date.now()}`
      });
    } else if (buttonIndex === 2) {
      // Trigger rebalance
      await axios.post('http://localhost:3003/analyze', {
        userAddress,
        trigger: 'manual_farcaster',
        triggeredBy: fid
      });
      
      res.json({
        type: 'frame',
        frameUrl: `${BASE_URL}/frame/success/rebalance?message=Rebalance+Triggered`
      });
    } else if (buttonIndex === 3) {
      // Settings
      res.json({
        type: 'external_link',
        url: `http://localhost:3000?tab=delegations&user=${userAddress}`
      });
    } else if (buttonIndex === 4) {
      // Open app
      res.json({
        type: 'external_link',
        url: `http://localhost:3000?user=${userAddress}`
      });
    }
  } catch (error) {
    console.error('Portfolio action error:', error);
    res.status(500).json({ error: 'Action failed' });
  }
});

app.post('/api/frame/delegate-action', async (req, res) => {
  const buttonIndex = req.body.untrustedData?.buttonIndex;
  const fid = req.body.untrustedData?.fid;

  try {
    if (buttonIndex === 1) {
      // Create delegation - redirect to app
      res.json({
        type: 'external_link',
        url: `http://localhost:3000?tab=delegations&action=create&fid=${fid}`
      });
    } else if (buttonIndex === 2) {
      // Open app
      res.json({
        type: 'external_link',
        url: `http://localhost:3000?fid=${fid}`
      });
    } else if (buttonIndex === 3) {
      // View guide
      res.json({
        type: 'external_link',
        url: `http://localhost:3000?tab=guide&fid=${fid}`
      });
    } else if (buttonIndex === 4) {
      // Check status
      res.json({
        type: 'frame',
        frameUrl: `${BASE_URL}/frame/status/${fid}`
      });
    }
  } catch (error) {
    console.error('Delegate action error:', error);
    res.status(500).json({ error: 'Action failed' });
  }
});

// Success/Error frames
app.get('/frame/success/:actionId', (req, res) => {
  const { actionId } = req.params;
  const message = req.query.message || 'Success!';
  
  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <meta property="fc:frame" content="vNext">
        <meta property="fc:frame:image" content="${BASE_URL}/api/frame/success-image?message=${encodeURIComponent(message)}">
        <meta property="fc:frame:button:1" content="📊 View Portfolio">
        <meta property="fc:frame:button:2" content="📱 Open App">
        <meta property="fc:frame:post_url" content="${BASE_URL}/api/frame/success-action">
        <title>${message}</title>
      </head>
      <body style="background: linear-gradient(135deg, #10b981, #059669); color: white; text-align: center; padding: 50px;">
        <h1>✅ ${message}</h1>
        <p>Action ID: ${actionId}</p>
        <p>AI agent will process this shortly on Monad testnet</p>
      </body>
    </html>
  `;
  res.send(html);
});

// Health check and stats
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    version: '2.0.0',
    features: [
      'Advanced SVG image generation',
      'Real-time data integration',
      'Enhanced frame interactions',
      'Multi-button support',
      'Error handling',
      'Caching optimization'
    ]
  });
});

app.get('/stats', (req, res) => {
  res.json({
    frameTypes: ['action-approval', 'portfolio', 'delegation', 'success'],
    imageFormats: ['PNG via Sharp'],
    cachePolicy: '5min for dynamic, 1hr for static',
    integrations: ['Backend API', 'AI Agent', 'Envio HyperSync'],
    lastUpdated: new Date().toISOString()
  });
});

app.listen(PORT, () => {
  console.log(`🎭 Advanced Farcaster Mini App running on port ${PORT}`);
  console.log(`📱 Enhanced Frame URLs:`);
  console.log(`   Portfolio: ${BASE_URL}/frame/portfolio/[address]`);
  console.log(`   Delegate: ${BASE_URL}/frame/delegate`);
  console.log(`   Approve: ${BASE_URL}/frame/approve/[actionId]`);
  console.log(`🖼️  Image APIs:`);
  console.log(`   Action: ${BASE_URL}/api/frame/action-image/[actionId]`);
  console.log(`   Portfolio: ${BASE_URL}/api/frame/portfolio-image/[address]`);
  console.log(`   Delegate: ${BASE_URL}/api/frame/delegate-image`);
});