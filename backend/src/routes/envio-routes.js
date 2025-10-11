const envioHyperSync = require('../services/envio-hypersync');

async function envioRoutes(fastify, options) {
  // Initialize Envio service on startup
  await envioHyperSync.initialize();

  fastify.get('/api/envio/stats', async (request, reply) => {
    const stats = envioHyperSync.getStats();
    reply.send({
      success: true,
      data: stats,
      timestamp: new Date().toISOString()
    });
  });

  fastify.get('/api/envio/events', async (request, reply) => {
    const { limit = 10 } = request.query;
    const events = await envioHyperSync.queryRecentEvents(parseInt(limit));
    reply.send({
      success: true,
      data: events,
      total: events.length,
      timestamp: new Date().toISOString()
    });
  });

  fastify.get('/api/pools', async (request, reply) => {
    const pools = await envioHyperSync.queryPools();
    reply.send({
      success: true,
      data: pools,
      meta: {
        source: 'Envio HyperIndex',
        lastUpdated: new Date().toISOString(),
        totalPools: pools.length
      }
    });
  });

  // Real-time pool data endpoint
  fastify.get('/api/pools/real-time', async (request, reply) => {
    const pools = await envioHyperSync.queryPools();
    reply.send({
      success: true,
      data: { pools },
      timestamp: new Date().toISOString()
    });
  });

  // HyperSync direct query endpoint
  fastify.post('/api/envio/hypersync-query', async (request, reply) => {
    try {
      // This would make direct HyperSync API calls
      const { query } = request.body;
      
      reply.send({
        success: true,
        message: 'HyperSync query endpoint ready',
        data: {
          hyperSyncUrl: envioHyperSync.hyperSyncUrl,
          graphqlUrl: envioHyperSync.graphqlUrl,
          querySupported: true
        }
      });
    } catch (error) {
      reply.status(500).send({
        success: false,
        error: error.message
      });
    }
  });
}

module.exports = envioRoutes;