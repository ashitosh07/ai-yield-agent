const EnvioRealService = require('../services/envio-real');

async function poolsAdvancedRoutes(fastify, options) {
  const envioService = new EnvioRealService();
  
  // Initialize Envio service
  await envioService.initialize();
  
  // Start real-time monitoring
  await envioService.startRealTimeMonitoring();

  // Get real-time pool data with advanced metrics
  fastify.get('/api/pools/real-time', async (request, reply) => {
    try {
      const data = await envioService.getRealTimePoolData();
      
      reply.send({
        success: true,
        data: data,
        timestamp: new Date().toISOString(),
        source: 'envio_hypersync'
      });
    } catch (error) {
      fastify.log.error('Error fetching real-time pool data:', error);
      reply.status(500).send({
        success: false,
        error: error.message,
        fallback: true,
        data: envioService.getFallbackPoolData()
      });
    }
  });

  // Get Envio service statistics
  fastify.get('/api/envio/stats', async (request, reply) => {
    try {
      const stats = envioService.getStats();
      const latestBlock = await envioService.getLatestBlock();
      
      reply.send({
        success: true,
        ...stats,
        latestBlock,
        lastUpdate: new Date().toISOString()
      });
    } catch (error) {
      reply.status(500).send({
        success: false,
        error: error.message
      });
    }
  });

  // Get recent HyperSync events
  fastify.get('/api/envio/events', async (request, reply) => {
    try {
      const { limit = 50, fromBlock, toBlock } = request.query;
      
      const currentBlock = await envioService.getLatestBlock();
      const startBlock = fromBlock || Math.max(0, currentBlock - 1000);
      
      const events = await envioService.getHyperSyncEvents(startBlock, toBlock);
      
      reply.send({
        success: true,
        events: events.slice(0, parseInt(limit)),
        totalEvents: events.length,
        blockRange: {
          from: startBlock,
          to: toBlock || currentBlock
        },
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      reply.status(500).send({
        success: false,
        error: error.message,
        events: []
      });
    }
  });

  // Get user positions with real data
  fastify.get('/api/pools/positions/:userAddress', async (request, reply) => {
    try {
      const { userAddress } = request.params;
      
      const positions = await envioService.getUserPositions(userAddress);
      const poolData = await envioService.getRealTimePoolData();
      
      // Enrich positions with current pool data
      const enrichedPositions = positions.map(position => {
        const pool = poolData.pools.find(p => 
          p.address.toLowerCase() === position.poolAddress.toLowerCase()
        );
        
        return {
          ...position,
          currentAPY: pool?.apy || 0,
          currentTVL: pool?.tvl || 0,
          riskScore: pool?.riskScore || 0,
          healthScore: pool?.healthScore || 100,
          dailyEarnings: (position.valueUSD * (pool?.apy || 0)) / 365 / 100
        };
      });

      // Calculate portfolio totals
      const totalValue = enrichedPositions.reduce((sum, pos) => sum + pos.valueUSD, 0);
      const totalDailyEarnings = enrichedPositions.reduce((sum, pos) => sum + pos.dailyEarnings, 0);
      const avgAPY = enrichedPositions.length > 0 
        ? enrichedPositions.reduce((sum, pos) => sum + pos.currentAPY, 0) / enrichedPositions.length
        : 0;

      reply.send({
        success: true,
        data: enrichedPositions,
        summary: {
          totalValue,
          totalDailyEarnings,
          avgAPY,
          positionCount: enrichedPositions.length,
          lastUpdated: new Date().toISOString()
        },
        totalValue, // Legacy compatibility
        totalDailyEarnings // Legacy compatibility
      });
    } catch (error) {
      reply.status(500).send({
        success: false,
        error: error.message,
        data: [],
        totalValue: 0,
        totalDailyEarnings: 0
      });
    }
  });

  // Get pool analytics and insights
  fastify.get('/api/pools/analytics', async (request, reply) => {
    try {
      const data = await envioService.getRealTimePoolData();
      
      // Calculate market analytics
      const totalTVL = data.pools.reduce((sum, pool) => sum + pool.tvl, 0);
      const avgAPY = data.pools.reduce((sum, pool) => sum + pool.apy, 0) / data.pools.length;
      const totalVolume24h = data.pools.reduce((sum, pool) => sum + pool.volume24h, 0);
      const totalFees24h = data.pools.reduce((sum, pool) => sum + pool.fees24h, 0);
      
      // Risk distribution
      const riskDistribution = {
        low: data.pools.filter(p => p.riskScore < 0.3).length,
        medium: data.pools.filter(p => p.riskScore >= 0.3 && p.riskScore < 0.6).length,
        high: data.pools.filter(p => p.riskScore >= 0.6).length
      };
      
      // Top performers
      const topByAPY = [...data.pools].sort((a, b) => b.apy - a.apy).slice(0, 5);
      const topByTVL = [...data.pools].sort((a, b) => b.tvl - a.tvl).slice(0, 5);
      const topByVolume = [...data.pools].sort((a, b) => b.volume24h - a.volume24h).slice(0, 5);
      
      // Health scores
      const avgHealthScore = data.pools.reduce((sum, pool) => sum + pool.healthScore, 0) / data.pools.length;
      const healthyPools = data.pools.filter(p => p.healthScore >= 80).length;
      
      reply.send({
        success: true,
        analytics: {
          market: {
            totalTVL,
            avgAPY,
            totalVolume24h,
            totalFees24h,
            poolCount: data.pools.length,
            avgHealthScore,
            healthyPools
          },
          riskDistribution,
          topPerformers: {
            byAPY: topByAPY,
            byTVL: topByTVL,
            byVolume: topByVolume
          },
          trends: {
            // In production, calculate from historical data
            tvlTrend: Math.random() * 0.2 - 0.1, // -10% to +10%
            apyTrend: Math.random() * 0.1 - 0.05, // -5% to +5%
            volumeTrend: Math.random() * 0.3 - 0.15 // -15% to +15%
          }
        },
        timestamp: new Date().toISOString(),
        source: 'envio_hypersync'
      });
    } catch (error) {
      reply.status(500).send({
        success: false,
        error: error.message
      });
    }
  });

  // Get pool comparison data
  fastify.get('/api/pools/compare', async (request, reply) => {
    try {
      const { pools: poolAddresses } = request.query;
      
      if (!poolAddresses) {
        return reply.status(400).send({
          success: false,
          error: 'Pool addresses required'
        });
      }
      
      const addresses = Array.isArray(poolAddresses) ? poolAddresses : [poolAddresses];
      const data = await envioService.getRealTimePoolData();
      
      const comparedPools = data.pools.filter(pool => 
        addresses.some(addr => addr.toLowerCase() === pool.address.toLowerCase())
      );
      
      if (comparedPools.length === 0) {
        return reply.status(404).send({
          success: false,
          error: 'No pools found for comparison'
        });
      }
      
      // Calculate comparison metrics
      const comparison = {
        pools: comparedPools,
        metrics: {
          bestAPY: Math.max(...comparedPools.map(p => p.apy)),
          bestTVL: Math.max(...comparedPools.map(p => p.tvl)),
          lowestRisk: Math.min(...comparedPools.map(p => p.riskScore)),
          highestHealth: Math.max(...comparedPools.map(p => p.healthScore)),
          totalVolume: comparedPools.reduce((sum, p) => sum + p.volume24h, 0)
        },
        recommendations: comparedPools.map(pool => ({
          address: pool.address,
          name: pool.name,
          score: (pool.apy * 0.4) + ((1 - pool.riskScore) * 30) + (pool.healthScore * 0.3),
          strengths: [
            pool.apy > 10 ? 'High APY' : null,
            pool.riskScore < 0.3 ? 'Low Risk' : null,
            pool.healthScore > 90 ? 'Excellent Health' : null,
            pool.tvl > 1000000 ? 'High Liquidity' : null
          ].filter(Boolean),
          weaknesses: [
            pool.apy < 5 ? 'Low APY' : null,
            pool.riskScore > 0.6 ? 'High Risk' : null,
            pool.healthScore < 70 ? 'Poor Health' : null,
            pool.tvl < 100000 ? 'Low Liquidity' : null
          ].filter(Boolean)
        })).sort((a, b) => b.score - a.score)
      };
      
      reply.send({
        success: true,
        comparison,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      reply.status(500).send({
        success: false,
        error: error.message
      });
    }
  });

  // Get historical pool performance
  fastify.get('/api/pools/:address/history', async (request, reply) => {
    try {
      const { address } = request.params;
      const { days = 7 } = request.query;
      
      // In production, fetch from database
      // For now, generate mock historical data
      const history = [];
      const now = new Date();
      
      for (let i = parseInt(days); i >= 0; i--) {
        const date = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
        history.push({
          date: date.toISOString().split('T')[0],
          apy: 12 + Math.sin(i * 0.5) * 3 + Math.random() * 2,
          tvl: 1000000 + Math.sin(i * 0.3) * 200000 + Math.random() * 100000,
          volume: 50000 + Math.sin(i * 0.7) * 20000 + Math.random() * 10000,
          fees: 500 + Math.sin(i * 0.7) * 200 + Math.random() * 100
        });
      }
      
      reply.send({
        success: true,
        address,
        history,
        period: `${days} days`,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      reply.status(500).send({
        success: false,
        error: error.message
      });
    }
  });

  // WebSocket endpoint for real-time updates
  fastify.register(async function (fastify) {
    fastify.get('/api/pools/ws', { websocket: true }, (connection, req) => {
      fastify.log.info('New WebSocket connection for pool updates');
      
      // Send initial data
      envioService.getRealTimePoolData().then(data => {
        connection.socket.send(JSON.stringify({
          type: 'initial_data',
          data: data,
          timestamp: new Date().toISOString()
        }));
      });
      
      // Subscribe to real-time updates
      const unsubscribe = envioService.subscribe((event, data) => {
        if (connection.socket.readyState === 1) { // OPEN
          connection.socket.send(JSON.stringify({
            type: event,
            data: data,
            timestamp: new Date().toISOString()
          }));
        }
      });
      
      connection.socket.on('close', () => {
        fastify.log.info('WebSocket connection closed');
        unsubscribe();
      });
      
      connection.socket.on('message', (message) => {
        try {
          const parsed = JSON.parse(message.toString());
          
          if (parsed.type === 'subscribe_pool') {
            // Handle pool-specific subscriptions
            fastify.log.info(`Subscribed to pool: ${parsed.poolAddress}`);
          }
        } catch (error) {
          fastify.log.error('Error parsing WebSocket message:', error);
        }
      });
    });
  });

  // Webhook endpoint for Envio events
  fastify.post('/webhooks/envio', async (request, reply) => {
    try {
      const { event, data } = request.body;
      
      fastify.log.info(`Received Envio webhook: ${event}`);
      
      if (event === 'pool_apy_change') {
        // Trigger AI analysis
        try {
          await fetch('http://localhost:3003/analyze', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              poolAddress: data.poolAddress,
              oldAPY: data.oldAPY,
              newAPY: data.newAPY,
              timestamp: data.timestamp,
              source: 'envio_webhook'
            })
          });
          
          fastify.log.info(`AI analysis triggered for pool ${data.poolAddress}`);
        } catch (error) {
          fastify.log.error('Failed to trigger AI analysis:', error);
        }
      }
      
      reply.send({ success: true, processed: true });
    } catch (error) {
      fastify.log.error('Webhook processing error:', error);
      reply.status(500).send({ success: false, error: error.message });
    }
  });

  // Health check for advanced features
  fastify.get('/api/pools/health', async (request, reply) => {
    try {
      const stats = envioService.getStats();
      const latestBlock = await envioService.getLatestBlock();
      
      const health = {
        status: 'healthy',
        services: {
          envio_hypersync: stats.isMonitoring ? 'active' : 'inactive',
          real_time_monitoring: stats.isMonitoring ? 'active' : 'inactive',
          websocket_server: 'active',
          ai_integration: 'active'
        },
        metrics: {
          pools_monitored: stats.poolCount,
          events_cached: stats.cachedEvents,
          subscribers: stats.subscriberCount,
          latest_block: latestBlock
        },
        endpoints: [
          '/api/pools/real-time',
          '/api/pools/analytics',
          '/api/pools/compare',
          '/api/envio/stats',
          '/api/envio/events',
          '/api/pools/ws'
        ],
        timestamp: new Date().toISOString()
      };
      
      reply.send(health);
    } catch (error) {
      reply.status(500).send({
        status: 'unhealthy',
        error: error.message,
        timestamp: new Date().toISOString()
      });
    }
  });
}

module.exports = poolsAdvancedRoutes;