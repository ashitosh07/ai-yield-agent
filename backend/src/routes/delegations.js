const { Pool } = require('pg');

// Mock database for development
const pool = process.env.DATABASE_URL ? new Pool({
  connectionString: process.env.DATABASE_URL
}) : null;

async function routes(fastify, options) {

  // Get user delegations
  fastify.get('/api/delegations/:address', async (request, reply) => {
    const { address } = request.params;
    
    if (!pool) {
      // Mock data for development
      const mockDelegations = [
        {
          id: '1',
          delegateAddress: '0xAI_AGENT_ADDRESS',
          maxAmount: '2.5',
          expiry: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
          allowedPools: [
            '0x1234567890123456789012345678901234567890',
            '0x2345678901234567890123456789012345678901'
          ],
          status: 'active',
          createdAt: new Date().toISOString(),
          usedAmount: '0.5',
          transactionCount: 3
        }
      ];
      
      return {
        success: true,
        data: mockDelegations
      };
    }
    
    const query = 'SELECT * FROM delegations WHERE delegator = $1 ORDER BY created_at DESC';
    const result = await pool.query(query, [address]);
    
    return {
      success: true,
      data: result.rows
    };
  });

  // Create delegation
  fastify.post('/api/delegations', async (request, reply) => {
    const { userAddress, maxAmount, expiry, allowedPools, riskTolerance } = request.body;
    
    if (!pool) {
      // Mock delegation creation
      const mockDelegation = {
        id: Date.now().toString(),
        delegateAddress: '0xAI_AGENT_ADDRESS',
        maxAmount,
        expiry,
        allowedPools,
        riskTolerance,
        status: 'active',
        createdAt: new Date().toISOString(),
        usedAmount: '0',
        transactionCount: 0
      };
      
      return {
        success: true,
        data: mockDelegation
      };
    }
    
    const query = `
      INSERT INTO delegations (user_address, max_amount, expiry, allowed_pools, risk_tolerance, created_at)
      VALUES ($1, $2, $3, $4, $5, NOW())
      RETURNING *
    `;
    
    const result = await pool.query(query, [
      userAddress, maxAmount, expiry, JSON.stringify(allowedPools), riskTolerance
    ]);
    
    return {
      success: true,
      data: result.rows[0]
    };
  });

  // Revoke delegation
  fastify.post('/api/delegations/:id/revoke', async (request, reply) => {
    const { id } = request.params;
    
    if (!pool) {
      return {
        success: true,
        message: 'Delegation revoked (mock)'
      };
    }
    
    const query = 'UPDATE delegations SET status = $1 WHERE id = $2 RETURNING *';
    const result = await pool.query(query, ['revoked', id]);
    
    return {
      success: true,
      data: result.rows[0]
    };
  });

  // Validate delegation
  fastify.post('/api/delegations/validate', async (request, reply) => {
    const { hash, action } = request.body;
    
    if (!pool) {
      return { valid: true, reason: 'Mock validation' };
    }
    
    const query = 'SELECT * FROM delegations WHERE hash = $1';
    const result = await pool.query(query, [hash]);
    
    if (result.rows.length === 0) {
      return { valid: false, reason: 'Delegation not found' };
    }
    
    const delegation = result.rows[0];
    const allowedPools = JSON.parse(delegation.allowed_pools);
    
    // Validation checks
    if (delegation.expiry < Date.now()) {
      return { valid: false, reason: 'Delegation expired' };
    }
    
    if (parseFloat(action.amount) > parseFloat(delegation.max_amount)) {
      return { valid: false, reason: 'Amount exceeds limit' };
    }
    
    if (!allowedPools.includes(action.poolAddress)) {
      return { valid: false, reason: 'Pool not allowed' };
    }
    
    return { valid: true };
  });
}

module.exports = routes;