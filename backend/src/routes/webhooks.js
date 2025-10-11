const axios = require('axios');
const EnvioService = require('../services/envio');

const envioService = new EnvioService();

function verifyEnvioSignature(signature, body) {
  // Mock signature verification for development
  return true;
}

async function routes(fastify, options) {
  // Envio HyperSync webhook endpoint
  fastify.post('/webhooks/envio', async (request, reply) => {
    const { event, data } = request.body;
    
    console.log('📡 Envio HyperSync webhook received:', event);
    
    // Verify webhook signature
    const signature = request.headers['x-envio-signature'];
    if (!verifyEnvioSignature(signature, request.body)) {
      return reply.code(401).send({ error: 'Invalid signature' });
    }
    
    if (event === 'pool_apy_change') {
      // Query additional data from Envio GraphQL
      const poolData = await envioService.queryPoolData([data.poolAddress]);
      
      // Trigger AI agent analysis with enriched data
      try {
        await axios.post('http://localhost:3003/analyze', {
          poolAddress: data.poolAddress,
          oldAPY: data.oldAPY,
          newAPY: data.newAPY,
          poolData: poolData[0],
          timestamp: data.timestamp,
          blockNumber: data.blockNumber,
          txHash: data.txHash
        });
        
        console.log('🤖 AI analysis triggered with Envio data');
      } catch (error) {
        console.error('Failed to trigger AI analysis:', error.message);
      }
    }
    
    return { status: 'processed' };
  });

  // Farcaster webhook for social notifications
  fastify.post('/webhooks/farcaster', async (request, reply) => {
    const { action, txHash, user } = request.body;
    
    // Send social notification
    await sendFarcasterNotification({
      message: `🤖 AI Agent executed ${action} for ${user}`,
      txHash,
      timestamp: new Date().toISOString()
    });
    
    return { status: 'notification_sent' };
  });
}

async function sendFarcasterNotification(data) {
  try {
    // Farcaster API integration
    const response = await axios.post('https://api.farcaster.xyz/v2/casts', {
      text: data.message,
      embeds: [{
        url: `https://explorer.monad.xyz/tx/${data.txHash}`
      }]
    }, {
      headers: {
        'Authorization': `Bearer ${process.env.FARCASTER_API_KEY}`,
        'Content-Type': 'application/json'
      }
    });
    
    console.log('📱 Farcaster notification sent');
  } catch (error) {
    console.error('Farcaster notification failed:', error.message);
  }
}

module.exports = routes;