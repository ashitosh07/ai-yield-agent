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

// Pools real-time endpoint
app.get('/api/pools/real-time', (req, res) => {
  // Prevent caching
  res.set({
    'Cache-Control': 'no-cache, no-store, must-revalidate',
    'Pragma': 'no-cache',
    'Expires': '0'
  });
  
  const mockPools = [
    {
      address: '0x1234567890123456789012345678901234567890',
      name: 'USDC/ETH',
      apy: 12.5,
      tvl: 2500000,
      volume24h: 150000,
      riskScore: 0.25
    },
    {
      address: '0x2345678901234567890123456789012345678901', 
      name: 'DAI/USDC',
      apy: 8.3,
      tvl: 1800000,
      volume24h: 95000,
      riskScore: 0.15
    },
    {
      address: '0x3456789012345678901234567890123456789012',
      name: 'WETH/USDT',
      apy: 15.7,
      tvl: 3200000,
      volume24h: 220000,
      riskScore: 0.35
    }
  ];
  
  res.json({
    success: true,
    data: mockPools,
    timestamp: new Date().toISOString()
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
  console.log(`💰 Pools API: http://localhost:${PORT}/api/pools/real-time`);
  console.log(`📊 Audit API: http://localhost:${PORT}/api/audit/:address`);
});