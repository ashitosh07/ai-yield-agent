const express = require('express');
const EnvioService = require('../services/envioService');

const router = express.Router();
const envioService = new EnvioService();

/**
 * GET /api/envio/stats
 * Get Envio indexer statistics
 */
router.get('/stats', async (req, res) => {
  try {
    const stats = await envioService.getIndexerStats();
    res.set({
      'Cache-Control': 'no-cache, no-store, must-revalidate',
      'Pragma': 'no-cache',
      'Expires': '0'
    });
    res.json({
      success: true,
      data: stats,
      source: 'envio-hyperindex'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * GET /api/envio/transfers
 * Get recent transfers from Envio indexer
 */
router.get('/transfers', async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 10;
    const data = await envioService.getRecentTransfers(limit);
    
    res.json({
      success: true,
      data: data.Transfer || [],
      count: data.Transfer?.length || 0,
      source: 'envio-hyperindex'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * GET /api/envio/swaps
 * Get recent swaps from Envio indexer
 */
router.get('/swaps', async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 10;
    const data = await envioService.getRecentSwaps(limit);
    
    res.json({
      success: true,
      data: data.Swap || [],
      count: data.Swap?.length || 0,
      source: 'envio-hyperindex'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * GET /api/envio/pools
 * Get pool creation events from Envio indexer
 */
router.get('/pools', async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 5;
    const data = await envioService.getPoolCreations(limit);
    
    res.json({
      success: true,
      data: data.PoolCreated || [],
      count: data.PoolCreated?.length || 0,
      source: 'envio-hyperindex'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * GET /api/envio/liquidity
 * Get liquidity events (Mint/Burn) from Envio indexer
 */
router.get('/liquidity', async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 10;
    const data = await envioService.getLiquidityEvents(limit);
    
    res.json({
      success: true,
      data: {
        mints: data.mints,
        burns: data.burns,
        total: data.mints.length + data.burns.length
      },
      source: 'envio-hyperindex'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * GET /api/envio/analytics
 * Get analytics from Envio indexed data
 */
router.get('/analytics', async (req, res) => {
  try {
    const analytics = await envioService.getAnalytics();
    
    res.json({
      success: true,
      data: analytics,
      source: 'envio-hyperindex'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * GET /api/envio/user/:address
 * Get user activity from Envio indexer
 */
router.get('/user/:address', async (req, res) => {
  try {
    const { address } = req.params;
    const limit = parseInt(req.query.limit) || 20;
    
    const data = await envioService.getUserActivity(address, limit);
    
    res.json({
      success: true,
      data: {
        transfers: data.transfers || [],
        swaps: data.swaps || [],
        totalActivity: (data.transfers?.length || 0) + (data.swaps?.length || 0)
      },
      source: 'envio-hyperindex'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * POST /api/envio/webhook
 * Webhook endpoint for Envio events (called from EventHandlers)
 */
router.post('/webhook', async (req, res) => {
  try {
    const { type, data, source } = req.body;
    
    console.log(`📡 Envio webhook received: ${type}`, {
      source,
      blockNumber: data.blockNumber,
      timestamp: new Date().toISOString()
    });
    
    // Forward to AI agent for analysis
    if (['LARGE_TRANSFER', 'LARGE_SWAP', 'NEW_POOL'].includes(type)) {
      try {
        const aiResponse = await fetch('http://localhost:3003/analyze', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            event: type,
            data,
            source: 'envio-hyperindex',
            timestamp: Date.now()
          })
        });
        
        if (aiResponse.ok) {
          console.log(`🤖 AI analysis triggered for ${type}`);
        }
      } catch (aiError) {
        console.warn('AI analysis failed:', aiError.message);
      }
    }
    
    res.json({
      success: true,
      message: 'Webhook processed',
      type,
      forwarded: ['LARGE_TRANSFER', 'LARGE_SWAP', 'NEW_POOL'].includes(type)
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

module.exports = router;