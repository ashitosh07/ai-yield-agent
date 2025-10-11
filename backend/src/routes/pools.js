const EnvioService = require('../services/envio');
const EnvioHyperIndexService = require('../services/envio-hyperindex');

async function routes(fastify, options) {
  const envioService = new EnvioService();
  const hyperIndexService = new EnvioHyperIndexService();

  // Get current pool data
  fastify.get('/api/pools', async (request, reply) => {
    try {
      const poolAddresses = [
        '0x1234567890123456789012345678901234567890',
        '0x2345678901234567890123456789012345678901',
        '0x3456789012345678901234567890123456789012'
      ];

      // Try HyperIndex first, fallback to HyperSync
      let pools = await hyperIndexService.getPoolsWithMetrics();
      if (!pools || pools.length === 0) {
        pools = await envioService.getPoolData(poolAddresses);
      }
      
      return {
        success: true,
        data: pools,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      fastify.log.error('Error fetching pools:', error);
      return reply.status(500).send({
        success: false,
        error: 'Failed to fetch pool data'
      });
    }
  });

  // Get pool events
  fastify.get('/api/pools/events', async (request, reply) => {
    try {
      const { fromBlock, toBlock } = request.query;
      
      const events = await envioService.getPoolEvents(
        parseInt(fromBlock) || 0,
        parseInt(toBlock) || 'latest'
      );
      
      return {
        success: true,
        data: events,
        count: events.length
      };
    } catch (error) {
      fastify.log.error('Error fetching pool events:', error);
      return reply.status(500).send({
        success: false,
        error: 'Failed to fetch pool events'
      });
    }
  });

  // Get user positions
  fastify.get('/api/pools/positions/:address', async (request, reply) => {
    try {
      const { address } = request.params;
      
      // Mock user positions - would query from blockchain
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
      
      return {
        success: true,
        data: positions,
        totalValue: positions.reduce((sum, pos) => sum + pos.value, 0),
        totalDailyEarnings: positions.reduce((sum, pos) => sum + pos.dailyEarnings, 0)
      };
    } catch (error) {
      fastify.log.error('Error fetching user positions:', error);
      return reply.status(500).send({
        success: false,
        error: 'Failed to fetch user positions'
      });
    }
  });

  // Get pool analytics
  fastify.get('/api/pools/analytics', async (request, reply) => {
    try {
      const pools = await envioService.getPoolData([
        '0x1234567890123456789012345678901234567890',
        '0x2345678901234567890123456789012345678901',
        '0x3456789012345678901234567890123456789012'
      ]);

      const analytics = {
        totalTVL: pools.reduce((sum, pool) => sum + pool.tvl, 0),
        averageAPY: pools.reduce((sum, pool) => sum + pool.apy, 0) / pools.length,
        totalVolume24h: pools.reduce((sum, pool) => sum + pool.volume24h, 0),
        poolCount: pools.length,
        riskDistribution: {
          low: pools.filter(p => p.riskScore < 0.3).length,
          medium: pools.filter(p => p.riskScore >= 0.3 && p.riskScore < 0.6).length,
          high: pools.filter(p => p.riskScore >= 0.6).length
        },
        topPerformers: pools
          .sort((a, b) => b.apy - a.apy)
          .slice(0, 3)
          .map(pool => ({
            name: pool.name,
            apy: pool.apy,
            riskScore: pool.riskScore
          }))
      };

      return {
        success: true,
        data: analytics,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      fastify.log.error('Error fetching pool analytics:', error);
      return reply.status(500).send({
        success: false,
        error: 'Failed to fetch pool analytics'
      });
    }
  });

  // Start monitoring (called once on server start)
  fastify.get('/api/pools/start-monitoring', async (request, reply) => {
    try {
      envioService.monitorPoolChanges();
      
      return {
        success: true,
        message: 'Pool monitoring started'
      };
    } catch (error) {
      fastify.log.error('Error starting pool monitoring:', error);
      return reply.status(500).send({
        success: false,
        error: 'Failed to start pool monitoring'
      });
    }
  });
}

module.exports = routes;