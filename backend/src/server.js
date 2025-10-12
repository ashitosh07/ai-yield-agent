const express = require('express');
const cors = require('cors');
const smartAccountRoutes = require('./routes/smart-account');
const envioRoutes = require('./routes/envio');

const app = express();
const PORT = process.env.PORT || 3002;

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use('/api/smart-account', smartAccountRoutes);
app.use('/api/envio', envioRoutes);

// HyperIndex status endpoint (simple fallback)
app.get('/api/hyperindex/status', (req, res) => {
  res.json({
    success: true,
    status: 'connected',
    latestBlock: Math.floor(Date.now() / 1000),
    lastUpdate: new Date().toISOString(),
    endpoint: 'http://localhost:8000/v1/graphql'
  });
});

// HyperIndex pools endpoint
app.get('/api/hyperindex/pools', (req, res) => {
  res.json({
    success: true,
    data: [
      {
        contractAddress: '0x642672169398C3281A14D063626371eFC30CeF3F',
        volume24h: 125000,
        fees24h: 375,
        estimatedTVL: 2500000,
        apy: 15.2,
        swapCount: 45,
        transferCount: 128,
        lastUpdate: new Date().toISOString()
      },
      {
        contractAddress: '0x8f5f1F5a93Be3C57f53f85B705f179F936dcDCea',
        volume24h: 89000,
        fees24h: 267,
        estimatedTVL: 1800000,
        apy: 12.8,
        swapCount: 32,
        transferCount: 95,
        lastUpdate: new Date().toISOString()
      }
    ],
    source: 'hyperindex-fallback',
    timestamp: new Date().toISOString()
  });
});

// HyperIndex swaps endpoint
app.get('/api/hyperindex/swaps', (req, res) => {
  const limit = parseInt(req.query.limit) || 10;
  const mockSwaps = Array.from({ length: limit }, (_, i) => ({
    id: `swap_${Date.now()}_${i}`,
    sender: '0x' + Math.random().toString(16).substr(2, 40),
    amount0In: (Math.random() * 1000).toFixed(18),
    amount1In: '0',
    amount0Out: '0',
    amount1Out: (Math.random() * 1000).toFixed(18),
    to: '0x' + Math.random().toString(16).substr(2, 40),
    contract: '0x642672169398C3281A14D063626371eFC30CeF3F',
    blockNumber: Math.floor(Date.now() / 1000) - i,
    timestamp: new Date(Date.now() - i * 60000).toISOString(),
    transactionHash: '0x' + Math.random().toString(16).substr(2, 64)
  }));
  
  res.json({
    success: true,
    data: mockSwaps,
    count: mockSwaps.length
  });
});

// Pools real-time endpoint - returns empty data since no real pools connected
app.get('/api/pools/real-time', (req, res) => {
  res.set({
    'Cache-Control': 'no-cache, no-store, must-revalidate',
    'Pragma': 'no-cache',
    'Expires': '0'
  });
  
  res.json({
    success: true,
    data: [],
    timestamp: new Date().toISOString(),
    message: 'No pools connected - Envio indexer offline'
  });
});

// Pool analytics endpoint - returns empty data since no real pools connected
app.get('/api/pools/analytics', (req, res) => {
  res.set({
    'Cache-Control': 'no-cache, no-store, must-revalidate',
    'Pragma': 'no-cache',
    'Expires': '0'
  });
  
  res.json({
    success: true,
    data: {
      totalTVL: 0,
      averageAPY: 0,
      totalVolume24h: 0,
      poolCount: 0,
      riskDistribution: { low: 0, medium: 0, high: 0 },
      topPerformers: []
    },
    timestamp: new Date().toISOString(),
    message: 'No analytics available - Envio indexer offline'
  });
});

// User positions endpoint
app.get('/api/pools/positions/:address', (req, res) => {
  const { address } = req.params;
  
  // Prevent caching
  res.set({
    'Cache-Control': 'no-cache, no-store, must-revalidate',
    'Pragma': 'no-cache',
    'Expires': '0'
  });
  
  const positions = [
    {
      poolAddress: '0x1234567890123456789012345678901234567890',
      poolName: 'USDC/ETH',
      balance: '1.5',
      value: 3000,
      apy: 12.5,
      dailyEarnings: 1.03
    },
    {
      poolAddress: '0x2345678901234567890123456789012345678901',
      poolName: 'DAI/USDC', 
      balance: '0.8',
      value: 1600,
      apy: 8.3,
      dailyEarnings: 0.36
    }
  ];
  
  res.json({
    success: true,
    data: positions,
    totalValue: positions.reduce((sum, pos) => sum + pos.value, 0),
    totalDailyEarnings: positions.reduce((sum, pos) => sum + pos.dailyEarnings, 0)
  });
});

// Audit logs endpoint
app.get('/api/audit/:address', async (req, res) => {
  const { address } = req.params;
  
  // Prevent caching
  res.set({
    'Cache-Control': 'no-cache, no-store, must-revalidate',
    'Pragma': 'no-cache',
    'Expires': '0'
  });
  
  try {
    const auditLogs = await app.locals.smartAccountService.getAuditLog(address);
    
    res.json({
      success: true,
      data: auditLogs,
      count: auditLogs.length
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Create audit entry endpoint
app.post('/api/audit', async (req, res) => {
  const { action, details, status, userAddress, txHash, confidence } = req.body;
  
  try {
    const auditEntry = {
      id: Date.now().toString(),
      action,
      details,
      status,
      userAddress,
      txHash,
      confidence,
      timestamp: new Date().toISOString()
    };
    
    await app.locals.smartAccountService.addAuditEntry(auditEntry);
    
    res.json({
      success: true,
      data: auditEntry,
      message: 'Audit entry created'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Simulate AI action endpoint for demo
app.post('/api/audit/:address/simulate', async (req, res) => {
  const { address } = req.params;
  
  try {
    const simulatedEntry = {
      id: Date.now().toString(),
      action: 'analysis',
      details: {
        trigger: 'Manual simulation',
        poolsAnalyzed: 3,
        recommendation: 'Rebalance to WETH/USDT for +2.1% APY improvement'
      },
      confidence: 0.89,
      status: 'success',
      userAddress: address,
      timestamp: new Date().toISOString()
    };
    
    await app.locals.smartAccountService.addAuditEntry(simulatedEntry);
    
    res.json({
      success: true,
      data: simulatedEntry,
      message: 'AI action simulated'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Create a global instance for shared state
const SmartAccountService = require('./services/smart-account-service');
const globalSmartAccountService = new SmartAccountService();
app.locals.smartAccountService = globalSmartAccountService;

app.listen(PORT, () => {
  console.log(`🚀 Backend server running on http://localhost:${PORT}`);
  console.log(`📡 Smart Account API: http://localhost:${PORT}/api/smart-account`);
  console.log(`⚡ Envio API: http://localhost:${PORT}/api/envio`);
  console.log(`🔥 HyperIndex API: http://localhost:${PORT}/api/hyperindex`);
  console.log(`💰 Pools API: http://localhost:${PORT}/api/pools/real-time`);
  console.log(`📊 Audit API: http://localhost:${PORT}/api/audit/:address`);
});