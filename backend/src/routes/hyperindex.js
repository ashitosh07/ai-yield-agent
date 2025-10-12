const HyperIndexClient = require('../services/hyperindex-client');

async function hyperIndexRoutes(app) {
  const hyperIndex = new HyperIndexClient();
  
  // Connect to HyperIndex on startup
  await hyperIndex.connect();

  // Get real-time pool data from HyperIndex
  app.get('/api/hyperindex/pools', async (req, res) => {
    try {
      const contracts = [
        '0x642672169398C3281A14D063626371eFC30CeF3F',
        '0x8f5f1F5a93Be3C57f53f85B705f179F936dcDCea'
      ];

      const poolData = await Promise.all(
        contracts.map(contract => hyperIndex.getYieldMetrics(contract))
      );

      res.json({
        success: true,
        data: poolData,
        source: 'hyperindex',
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      res.json({
        success: false,
        error: error.message,
        fallback: 'Using mock data due to HyperIndex unavailability'
      });
    }
  });

  // Get recent swaps for AI analysis
  app.get('/api/hyperindex/swaps', async (req, res) => {
    try {
      const limit = parseInt(req.query.limit) || 20;
      const swaps = await hyperIndex.getRecentSwaps(limit);

      res.json({
        success: true,
        data: swaps,
        count: swaps.length
      });
    } catch (error) {
      res.json({
        success: false,
        error: error.message,
        data: []
      });
    }
  });

  // Get pool activity for specific contract
  app.get('/api/hyperindex/activity/:contract', async (req, res) => {
    try {
      const { contract } = req.params;
      const hours = parseInt(req.query.hours) || 24;
      
      const activity = await hyperIndex.getPoolActivity(contract, hours);

      res.json({
        success: true,
        data: activity,
        contract,
        timeframe: `${hours}h`
      });
    } catch (error) {
      res.json({
        success: false,
        error: error.message
      });
    }
  });

  // HyperIndex status endpoint
  app.get('/api/hyperindex/status', async (req, res) => {
    try {
      const latestBlock = await hyperIndex.getLatestBlock();
      
      res.json({
        success: true,
        status: hyperIndex.isConnected ? 'connected' : 'disconnected',
        latestBlock: latestBlock?.blockNumber || 0,
        lastUpdate: latestBlock?.timestamp || null,
        endpoint: 'http://localhost:8000/v1/graphql'
      });
    } catch (error) {
      res.json({
        success: false,
        status: 'error',
        error: error.message
      });
    }
  });

  // Webhook endpoint for HyperIndex events
  app.post('/api/webhooks/hyperindex', async (req, res) => {
    try {
      const { type, data } = req.body;
      
      console.log(`📡 HyperIndex webhook: ${type}`);
      
      // Forward to AI agent if significant event
      if (type === 'LARGE_SWAP' && data.amount0In > '1000000000000000000') {
        // Trigger AI analysis
        try {
          const response = await fetch('http://localhost:5000/api/analyze', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              trigger: 'hyperindex_swap',
              data: {
                contract: data.contract,
                volume: data.amount0In,
                blockNumber: data.blockNumber,
                transactionHash: data.transactionHash
              }
            })
          });
          
          console.log('✅ AI analysis triggered from HyperIndex');
        } catch (aiError) {
          console.log('❌ AI trigger failed:', aiError.message);
        }
      }

      res.json({ success: true, processed: true });
    } catch (error) {
      res.json({ success: false, error: error.message });
    }
  });
}

module.exports = hyperIndexRoutes;