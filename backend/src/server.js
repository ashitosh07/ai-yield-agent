const fastify = require('fastify')({ logger: true });
const cors = require('@fastify/cors');
require('dotenv').config();

// Register plugins
fastify.register(cors, {
  origin: true
});

// Routes
fastify.register(require('./routes/delegations'));
fastify.register(require('./routes/webhooks'));
fastify.register(require('./routes/audit'));
fastify.register(require('./routes/simple-pools'));
fastify.register(require('./routes/ai-actions'));

console.log('🚀 Simple backend server starting...');

// Health check
fastify.get('/health', async (request, reply) => {
  return { status: 'ok', timestamp: new Date().toISOString() };
});

// Start server
const start = async () => {
  try {
    await fastify.listen({ port: 3002, host: '0.0.0.0' });
    console.log('🚀 Backend server running on port 3002');
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
};

start();