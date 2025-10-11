const express = require('express');
const axios = require('axios');
const QRCode = require('qrcode');

const app = express();
app.use(express.json());
app.use(express.static('public'));

const PORT = process.env.PORT || 3006;
const BASE_URL = process.env.BASE_URL || `http://localhost:${PORT}`;

// Frame: AI Action Approval
app.get('/frame/approve/:actionId', async (req, res) => {
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
        <meta property="fc:frame:post_url" content="${BASE_URL}/api/frame/action/${actionId}">
        <title>AI Yield Agent - Action Approval</title>
      </head>
      <body>
        <div style="padding: 20px; font-family: Arial, sans-serif; background: #1a1a1a; color: white;">
          <h1>🤖 AI Yield Agent</h1>
          <p>Action ID: ${actionId}</p>
        </div>
      </body>
    </html>
  `;
  
  res.send(html);
});

// Frame: Portfolio Overview
app.get('/frame/portfolio/:userAddress', async (req, res) => {
  const { userAddress } = req.params;
  
  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1">
        <meta property="fc:frame" content="vNext">
        <meta property="fc:frame:image" content="${BASE_URL}/api/frame/portfolio-image/${userAddress}">
        <meta property="fc:frame:button:1" content="📊 Refresh">
        <meta property="fc:frame:button:2" content="🔄 Rebalance">
        <meta property="fc:frame:post_url" content="${BASE_URL}/api/frame/portfolio-action/${userAddress}">
        <title>AI Yield Agent - Portfolio</title>
      </head>
      <body>
        <div style="padding: 20px; font-family: Arial, sans-serif; background: #1a1a1a; color: white;">
          <h1>📊 Your AI-Optimized Portfolio</h1>
          <p>Address: ${userAddress}</p>
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
          <p>Enable autonomous yield optimization</p>
        </div>
      </body>
    </html>
  `;
  
  res.send(html);
});

// Image APIs - using placeholder images
app.get('/api/frame/action-image/:actionId', (req, res) => {
  res.redirect('https://via.placeholder.com/1200x630/1a1a2e/ffffff?text=AI+Action+Approval');
});

app.get('/api/frame/portfolio-image/:userAddress', (req, res) => {
  res.redirect('https://via.placeholder.com/1200x630/0f172a/ffffff?text=AI+Portfolio+Dashboard');
});

app.get('/api/frame/delegate-image', (req, res) => {
  res.redirect('https://via.placeholder.com/1200x630/1e1b4b/ffffff?text=Delegate+to+AI+Agent');
});

// Frame action handlers
app.post('/api/frame/action/:actionId', (req, res) => {
  const { actionId } = req.params;
  const buttonIndex = req.body.untrustedData?.buttonIndex;

  if (buttonIndex === 1) {
    res.json({
      type: 'frame',
      frameUrl: `${BASE_URL}/frame/success/${actionId}`
    });
  } else {
    res.json({
      type: 'frame', 
      frameUrl: `${BASE_URL}/frame/rejected/${actionId}`
    });
  }
});

app.post('/api/frame/portfolio-action/:userAddress', (req, res) => {
  const { userAddress } = req.params;
  const buttonIndex = req.body.untrustedData?.buttonIndex;

  if (buttonIndex === 1) {
    res.json({
      type: 'frame',
      frameUrl: `${BASE_URL}/frame/portfolio/${userAddress}?refresh=${Date.now()}`
    });
  } else {
    res.json({
      type: 'external_link',
      url: 'http://localhost:3000'
    });
  }
});

app.post('/api/frame/delegate-action', (req, res) => {
  const buttonIndex = req.body.untrustedData?.buttonIndex;

  if (buttonIndex === 1) {
    res.json({
      type: 'external_link',
      url: 'http://localhost:3000?tab=delegations'
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
        <meta property="fc:frame:image" content="https://via.placeholder.com/1200x630/10b981/ffffff?text=Action+Approved">
        <meta property="fc:frame:button:1" content="📱 Open App">
        <meta property="fc:frame:post_url" content="${BASE_URL}/api/frame/open-app">
        <title>Action Approved</title>
      </head>
      <body>
        <h1>✅ Action Approved!</h1>
      </body>
    </html>
  `;
  res.send(html);
});

app.post('/api/frame/open-app', (req, res) => {
  res.json({
    type: 'external_link',
    url: 'http://localhost:3000'
  });
});

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', port: PORT });
});

app.listen(PORT, () => {
  console.log(`🎭 Farcaster Mini App running on port ${PORT}`);
  console.log(`📱 Frame URLs:`);
  console.log(`   Portfolio: ${BASE_URL}/frame/portfolio/[address]`);
  console.log(`   Delegate: ${BASE_URL}/frame/delegate`);
  console.log(`   Approve: ${BASE_URL}/frame/approve/[actionId]`);
});