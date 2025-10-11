const express = require('express');
const axios = require('axios');
const sharp = require('sharp');
const QRCode = require('qrcode');

// Use the advanced server instead of the basic one
const advancedServer = require('./advanced-server');

// Export the advanced server
module.exports = advancedServer;

const app = express();
app.use(express.json());
app.use(express.static('public'));

const PORT = process.env.PORT || 3004;
const BASE_URL = process.env.BASE_URL || `http://localhost:${PORT}`;

// Frame: AI Action Approval
app.get('/frame/approve/:actionId', async (req, res) => {
  const { actionId } = req.params;
  
  try {
    // Get action details from backend
    const actionResponse = await axios.get(`http://localhost:3002/api/ai-actions/${actionId}`);
    const action = actionResponse.data.data;

    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1">
          <meta property="fc:frame" content="vNext">
          <meta property="fc:frame:image" content="${BASE_URL}/api/frame/action-image/${actionId}">
          <meta property="fc:frame:button:1" content="✅ Approve (${(action.confidence * 100).toFixed(0)}%)">
          <meta property="fc:frame:button:2" content="❌ Reject">
          <meta property="fc:frame:button:3" content="📊 View Details">
          <meta property="fc:frame:post_url" content="${BASE_URL}/api/frame/action/${actionId}">
          <title>AI Yield Agent - Action Approval</title>
        </head>
        <body>
          <div style="padding: 20px; font-family: Arial, sans-serif; background: #1a1a1a; color: white;">
            <h1>🤖 AI Yield Agent</h1>
            <div style="background: #2a2a2a; padding: 15px; border-radius: 8px; margin: 10px 0;">
              <h3>Proposed Rebalance</h3>
              <p><strong>From:</strong> ${action.fromPool}</p>
              <p><strong>To:</strong> ${action.toPool}</p>
              <p><strong>Amount:</strong> ${action.amount} ETH</p>
              <p><strong>Expected APY Gain:</strong> +${action.expectedGain}%</p>
              <p><strong>AI Confidence:</strong> ${(action.confidence * 100).toFixed(0)}%</p>
            </div>
            <div style="background: #1a3a1a; padding: 10px; border-radius: 8px; border-left: 4px solid #4ade80;">
              <p><strong>Rationale:</strong> ${action.rationale}</p>
            </div>
          </div>
        </body>
      </html>
    `;
    
    res.send(html);
  } catch (error) {
    res.status(500).send('Error loading action');
  }
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
        <meta property="fc:frame:button:1" content="📊 Refresh Data">
        <meta property="fc:frame:button:2" content="🔄 Rebalance Now">
        <meta property="fc:frame:button:3" content="⚙️ Settings">
        <meta property="fc:frame:post_url" content="${BASE_URL}/api/frame/portfolio-action/${userAddress}">
        <title>AI Yield Agent - Portfolio</title>
      </head>
      <body>
        <div style="padding: 20px; font-family: Arial, sans-serif; background: #1a1a1a; color: white;">
          <h1>📊 Your AI-Optimized Portfolio</h1>
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
          <ul>
            <li>✅ Scoped permissions</li>
            <li>✅ Time-limited authority</li>
            <li>✅ Full audit trail</li>
          </ul>
        </div>
      </body>
    </html>
  `;
  
  res.send(html);
});

// API: Generate action approval image (placeholder)
app.get('/api/frame/action-image/:actionId', async (req, res) => {
  const { actionId } = req.params;
  
  // Return placeholder image URL for now
  res.redirect('https://via.placeholder.com/1200x630/1a1a2e/ffffff?text=AI+Action+Approval');
});

// API: Generate portfolio image (placeholder)
app.get('/api/frame/portfolio-image/:userAddress', async (req, res) => {
  const { userAddress } = req.params;
  
  // Return placeholder image URL for now
  res.redirect('https://via.placeholder.com/1200x630/0f172a/ffffff?text=AI+Portfolio+Dashboard');
});

// API: Generate delegation setup image (placeholder)
app.get('/api/frame/delegate-image', (req, res) => {
  // Return placeholder image URL for now
  res.redirect('https://via.placeholder.com/1200x630/1e1b4b/ffffff?text=Delegate+to+AI+Agent');
});

// API: Handle frame actions
app.post('/api/frame/action/:actionId', async (req, res) => {
  const { actionId } = req.params;
  const buttonIndex = req.body.untrustedData?.buttonIndex;

  try {
    if (buttonIndex === 1) {
      // Approve action
      await axios.post(`http://localhost:3002/api/ai-actions/${actionId}/approve`);
      
      res.json({
        type: 'frame',
        frameUrl: `${BASE_URL}/frame/success/${actionId}`
      });
    } else if (buttonIndex === 2) {
      // Reject action
      await axios.post(`http://localhost:3002/api/ai-actions/${actionId}/reject`);
      
      res.json({
        type: 'frame',
        frameUrl: `${BASE_URL}/frame/rejected/${actionId}`
      });
    } else if (buttonIndex === 3) {
      // View details
      res.json({
        type: 'frame',
        frameUrl: `${BASE_URL}/frame/details/${actionId}`
      });
    }
  } catch (error) {
    res.status(500).json({ error: 'Action failed' });
  }
});

// API: Handle portfolio actions
app.post('/api/frame/portfolio-action/:userAddress', async (req, res) => {
  const { userAddress } = req.params;
  const buttonIndex = req.body.untrustedData?.buttonIndex;

  if (buttonIndex === 1) {
    // Refresh data
    res.json({
      type: 'frame',
      frameUrl: `${BASE_URL}/frame/portfolio/${userAddress}?refresh=${Date.now()}`
    });
  } else if (buttonIndex === 2) {
    // Trigger rebalance
    try {
      await axios.post('http://localhost:3003/analyze', {
        userAddress,
        trigger: 'manual_farcaster'
      });
      
      res.json({
        type: 'frame',
        frameUrl: `${BASE_URL}/frame/rebalance-triggered/${userAddress}`
      });
    } catch (error) {
      res.status(500).json({ error: 'Rebalance failed' });
    }
  } else if (buttonIndex === 3) {
    // Open settings
    res.json({
      type: 'frame',
      frameUrl: `${BASE_URL}/frame/settings/${userAddress}`
    });
  }
});

// API: Handle delegation actions
app.post('/api/frame/delegate-action', (req, res) => {
  const buttonIndex = req.body.untrustedData?.buttonIndex;

  if (buttonIndex === 1) {
    // Create delegation
    res.json({
      type: 'frame',
      frameUrl: `${BASE_URL}/frame/delegate-setup`
    });
  } else if (buttonIndex === 2) {
    // Open app
    res.json({
      type: 'external_link',
      url: 'http://localhost:3000'
    });
  }
});

// Success/Error frames
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
        <p>AI agent will execute the rebalance shortly.</p>
      </body>
    </html>
  `;
  res.send(html);
});

app.get('/api/frame/success-image', (req, res) => {
  // Return placeholder image URL for now
  res.redirect('https://via.placeholder.com/1200x630/10b981/ffffff?text=Action+Approved');
});

app.listen(PORT, () => {
  console.log(`🎭 Farcaster Mini App running on port ${PORT}`);
  console.log(`📱 Frame URLs:`);
  console.log(`   Portfolio: ${BASE_URL}/frame/portfolio/[address]`);
  console.log(`   Delegate: ${BASE_URL}/frame/delegate`);
  console.log(`   Approve: ${BASE_URL}/frame/approve/[actionId]`);
});