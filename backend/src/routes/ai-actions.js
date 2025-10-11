const axios = require('axios');

async function routes(fastify, options) {
  // Get AI action by ID
  fastify.get('/api/ai-actions/:actionId', async (request, reply) => {
    const { actionId } = request.params;
    
    // Mock AI action data for Farcaster frames
    const mockAction = {
      id: actionId,
      fromPool: 'USDC/ETH',
      toPool: 'WETH/USDT',
      amount: '1.5',
      confidence: 0.87,
      expectedGain: '4.2',
      rationale: 'WETH/USDT APY increased from 8.2% to 16.5%, optimal rebalance opportunity detected',
      status: 'pending',
      timestamp: new Date().toISOString()
    };
    
    return {
      success: true,
      data: mockAction
    };
  });

  // Approve AI action
  fastify.post('/api/ai-actions/:actionId/approve', async (request, reply) => {
    const { actionId } = request.params;
    
    try {
      // Trigger AI agent execution
      await axios.post('http://localhost:3003/execute-approved', {
        actionId,
        source: 'farcaster_frame'
      });
      
      return {
        success: true,
        message: 'Action approved and queued for execution'
      };
    } catch (error) {
      return reply.status(500).send({
        success: false,
        error: 'Failed to approve action'
      });
    }
  });

  // Reject AI action
  fastify.post('/api/ai-actions/:actionId/reject', async (request, reply) => {
    const { actionId } = request.params;
    
    // Log rejection
    await axios.post('http://localhost:3002/api/audit', {
      action: 'user_rejection',
      details: {
        actionId,
        source: 'farcaster_frame',
        reason: 'User rejected via Farcaster mini app'
      },
      status: 'rejected',
      timestamp: new Date().toISOString()
    });
    
    return {
      success: true,
      message: 'Action rejected'
    };
  });
}

module.exports = routes;