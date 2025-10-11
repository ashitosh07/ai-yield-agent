const express = require('express');
const EnvioHyperSyncService = require('../services/envio-hypersync');

const router = express.Router();
const envioService = new EnvioHyperSyncService();

// Initialize Envio service
envioService.initialize();

// Get pools data
router.get('/pools', async (req, res) => {
  try {
    const pools = await envioService.queryPools();
    res.json({ success: true, pools });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get recent events
router.get('/events', async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 10;
    const events = await envioService.queryRecentEvents(limit);
    res.json({ success: true, data: events });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get service stats
router.get('/stats', async (req, res) => {
  try {
    res.json({ success: true, data: envioService.stats });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get real-time pool data
router.get('/pools/real-time', async (req, res) => {
  try {
    const pools = await envioService.queryPools();
    const events = await envioService.queryRecentEvents(5);
    res.json({ 
      success: true, 
      pools, 
      events,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;