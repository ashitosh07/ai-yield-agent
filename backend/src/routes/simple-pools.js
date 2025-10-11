async function simplePoolsRoutes(fastify, options) {
  // Mock pool data
  const mockPools = [
    {
      address: '0x742d35Cc6634C0532925a3b8D4C9db4C8b9b8b8b',
      name: 'USDC/ETH',
      apy: 12.5,
      tvl: 2000000,
      volume24h: 150000,
      fees24h: 1500,
      riskScore: 0.25,
      healthScore: 92,
      isActive: true
    },
    {
      address: '0x853d955aCEf822Db058eb8505911ED77F175b99e',
      name: 'DAI/USDC',
      apy: 8.3,
      tvl: 4000000,
      volume24h: 200000,
      fees24h: 2000,
      riskScore: 0.1,
      healthScore: 98,
      isActive: true
    }
  ];

  fastify.get('/api/pools/real-time', async (request, reply) => {
    reply.send({
      success: true,
      data: { pools: mockPools },
      timestamp: new Date().toISOString()
    });
  });

  fastify.get('/api/pools/analytics', async (request, reply) => {
    reply.send({
      success: true,
      analytics: {
        market: {
          totalTVL: 6000000,
          avgAPY: 10.4,
          totalVolume24h: 350000,
          totalFees24h: 3500,
          poolCount: 2
        }
      }
    });
  });

  fastify.get('/api/pools/positions/:userAddress', async (request, reply) => {
    reply.send({
      success: true,
      data: [],
      summary: {
        totalValue: 8500,
        totalDailyEarnings: 12.5,
        avgAPY: 10.2,
        positionCount: 2
      }
    });
  });
}

module.exports = simplePoolsRoutes;