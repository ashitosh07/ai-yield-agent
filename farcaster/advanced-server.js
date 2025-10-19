const express = require('express');
const cors = require('cors');

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('public'));

const PORT = process.env.PORT || 3006;
const BASE_URL = process.env.BASE_URL || `http://localhost:${PORT}`;

// Health check
app.get('/', (req, res) => {
  res.json({
    status: 'running',
    service: 'AI Yield Agent - Farcaster Mini App',
    port: PORT,
    frames: {
      portfolio: `${BASE_URL}/frame/portfolio/[address]`,
      delegate: `${BASE_URL}/frame/delegate`,
      approve: `${BASE_URL}/frame/approve/[actionId]`
    }
  });
});

// Frame: Portfolio Overview
app.get('/frame/portfolio/:userAddress', (req, res) => {
  const { userAddress } = req.params;
  
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
        <meta property="fc:frame:post_url" content="${BASE_URL}/api/frame/portfolio-action/${userAddress}">
        <title>AI Yield Agent - Portfolio</title>
      </head>
      <body>
        <div style="padding: 20px; font-family: Arial, sans-serif; background: #1a1a1a; color: white;">
          <h1>📊 Your AI-Optimized Portfolio</h1>
          <p>Address: ${userAddress.slice(0,6)}...${userAddress.slice(-4)}</p>
          <p>Real-time portfolio managed by AI on Monad</p>
        </div>
      </body>
    </html>
  `;
  
  res.send(html);
});

// Frame: Delegation Setup
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
        <meta property="fc:frame:post_url" content="${BASE_URL}/api/frame/delegate-action">
        <title>AI Yield Agent - Create Delegation</title>
      </head>
      <body>
        <div style="padding: 20px; font-family: Arial, sans-serif; background: #1a1a1a; color: white;">
          <h1>🔐 Delegate to AI Agent</h1>
          <p>Enable autonomous yield optimization with secure delegations</p>
        </div>
      </body>
    </html>
  `;
  
  res.send(html);
});

// Frame: Action Approval
app.get('/frame/approve/:actionId', (req, res) => {
  const { actionId } = req.params;
  
  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1">
        <meta property="fc:frame" content="vNext">
        <meta property="fc:frame:image" content="${BASE_URL}/api/frame/action-image/${actionId}">
        <meta property="fc:frame:button:1" content="✅ Approve">
        <meta property="fc:frame:button:2" content="❌ Reject">
        <meta property="fc:frame:button:3" content="📊 Details">
        <meta property="fc:frame:post_url" content="${BASE_URL}/api/frame/action/${actionId}">
        <title>AI Yield Agent - Action Approval</title>
      </head>
      <body>
        <div style="padding: 20px; font-family: Arial, sans-serif; background: #1a1a1a; color: white;">
          <h1>🤖 AI Action Approval</h1>
          <p>Action ID: ${actionId}</p>
        </div>
      </body>
    </html>
  `;
  
  res.send(html);
});

// API: Generate images (placeholders)
app.get('/api/frame/portfolio-image/:userAddress', (req, res) => {
  res.redirect('https://via.placeholder.com/1200x630/0f172a/ffffff?text=AI+Portfolio+Dashboard');
});

app.get('/api/frame/delegate-image', (req, res) => {
  res.redirect('https://via.placeholder.com/1200x630/1e1b4b/ffffff?text=Delegate+to+AI+Agent');
});

app.get('/api/frame/action-image/:actionId', (req, res) => {
  res.redirect('https://via.placeholder.com/1200x630/1a1a2e/ffffff?text=AI+Action+Approval');
});

// API: Handle frame actions
app.post('/api/frame/portfolio-action/:userAddress', (req, res) => {
  const { userAddress } = req.params;
  const buttonIndex = req.body.untrustedData?.buttonIndex || 1;

  if (buttonIndex === 1) {
    res.json({
      type: 'frame',
      frameUrl: `${BASE_URL}/frame/portfolio/${userAddress}?refresh=${Date.now()}`
    });
  } else if (buttonIndex === 2) {
    res.json({
      type: 'frame',
      frameUrl: `${BASE_URL}/frame/rebalance-triggered/${userAddress}`
    });
  } else {
    res.json({
      type: 'external_link',
      url: 'http://localhost:3000'
    });
  }
});

app.post('/api/frame/delegate-action', (req, res) => {
  const buttonIndex = req.body.untrustedData?.buttonIndex || 1;

  if (buttonIndex === 1) {
    res.json({
      type: 'frame',
      frameUrl: `${BASE_URL}/frame/delegate-setup`
    });
  } else {
    res.json({
      type: 'external_link',
      url: 'http://localhost:3000'
    });
  }
});

app.post('/api/frame/action/:actionId', (req, res) => {
  const { actionId } = req.params;
  const buttonIndex = req.body.untrustedData?.buttonIndex || 1;

  if (buttonIndex === 1) {
    res.json({
      type: 'frame',
      frameUrl: `${BASE_URL}/frame/success/${actionId}`
    });
  } else if (buttonIndex === 2) {
    res.json({
      type: 'frame',
      frameUrl: `${BASE_URL}/frame/rejected/${actionId}`
    });
  } else {
    res.json({
      type: 'external_link',
      url: 'http://localhost:3000'
    });
  }
});

// Success frame
app.get('/frame/success/:actionId', (req, res) => {
  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <meta property="fc:frame" content="vNext">
        <meta property="fc:frame:image" content="${BASE_URL}/api/frame/success-image">
        <meta property="fc:frame:button:1" content="📊 View Portfolio">
        <meta property="fc:frame:post_url" content="${BASE_URL}/api/frame/view-portfolio">
        <title>Action Approved</title>
      </head>
      <body>
        <h1>✅ Action Approved!</h1>
      </body>
    </html>
  `;
  res.send(html);
});

app.get('/api/frame/success-image', (req, res) => {
  res.redirect('https://via.placeholder.com/1200x630/10b981/ffffff?text=Action+Approved');
});

if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`🎭 Farcaster Mini App running on port ${PORT}`);
    console.log(`📱 Frame URLs:`);
    console.log(`   Portfolio: ${BASE_URL}/frame/portfolio/[address]`);
    console.log(`   Delegate: ${BASE_URL}/frame/delegate`);
    console.log(`   Approve: ${BASE_URL}/frame/approve/[actionId]`);
  });
}

module.exports = app;