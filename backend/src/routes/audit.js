const { Pool } = require('pg');

// Mock database for development
const pool = process.env.DATABASE_URL ? new Pool({
  connectionString: process.env.DATABASE_URL
}) : null;

async function routes(fastify, options) {
  // Get audit log for user
  fastify.get('/api/audit/:address', async (request, reply) => {
    const { address } = request.params;
    
    if (!pool) {
      // Mock audit data for development
      const mockAuditData = [
        {
          id: '1',
          action: 'rebalance',
          details: {
            rationale: 'WETH/USDT APY increased from 8.2% to 16.5%, moving 1.5 ETH for 4% improvement',
            fromPool: 'USDC/ETH',
            toPool: 'WETH/USDT',
            amount: '1.5',
            expectedImprovement: '4.0%'
          },
          txHash: '0x1234567890abcdef1234567890abcdef12345678',
          confidence: 0.87,
          status: 'success',
          timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
          gasUsed: '0.0023',
          gasPrice: '20',
          userAddress: address
        },
        {
          id: '2',
          action: 'delegation_created',
          details: {
            maxAmount: '2.5 ETH',
            expiry: '24 hours',
            poolCount: 3,
            riskTolerance: 'medium'
          },
          txHash: '0xabcdef1234567890abcdef1234567890abcdef12',
          status: 'success',
          timestamp: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString(),
          gasUsed: '0.0045',
          gasPrice: '22',
          userAddress: address
        },
        {
          id: '3',
          action: 'analysis',
          details: {
            trigger: 'Pool APY change detected',
            poolsAnalyzed: 3,
            recommendation: 'No action - insufficient improvement',
            triggerPool: 'DAI/USDC',
            apyChange: '+0.3%'
          },
          confidence: 0.65,
          status: 'success',
          timestamp: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(),
          userAddress: address
        },
        {
          id: '4',
          action: 'rebalance',
          details: {
            rationale: 'Moving from DAI/USDC to USDC/ETH for better risk-adjusted returns',
            fromPool: 'DAI/USDC',
            toPool: 'USDC/ETH',
            amount: '0.8',
            riskImprovement: '-0.1'
          },
          txHash: '0x9876543210fedcba9876543210fedcba98765432',
          confidence: 0.92,
          status: 'success',
          timestamp: new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString(),
          gasUsed: '0.0019',
          gasPrice: '18',
          userAddress: address
        },
        {
          id: '5',
          action: 'user_rejection',
          details: {
            rejectedAction: 'Rebalance to high-risk pool',
            reason: 'User rejected via Farcaster mini app',
            proposedPool: 'WETH/USDT',
            proposedAmount: '1.2'
          },
          confidence: 0.73,
          status: 'failed',
          timestamp: new Date(Date.now() - 18 * 60 * 60 * 1000).toISOString(),
          userAddress: address
        }
      ];
      
      return {
        success: true,
        data: mockAuditData
      };
    }
    
    const query = `
      SELECT * FROM audit_log 
      WHERE user_address = $1 
      ORDER BY timestamp DESC 
      LIMIT 100
    `;
    
    const result = await pool.query(query, [address]);
    
    return {
      success: true,
      data: result.rows
    };
  });

  // Create audit entry
  fastify.post('/api/audit', async (request, reply) => {
    const { 
      action, 
      details, 
      txHash, 
      confidence, 
      status, 
      userAddress,
      gasUsed,
      gasPrice 
    } = request.body;
    
    if (!pool) {
      // Mock response for development
      return {
        success: true,
        id: Date.now().toString(),
        message: 'Audit entry created (mock)'
      };
    }
    
    const query = `
      INSERT INTO audit_log (
        action, details, tx_hash, confidence, status, 
        user_address, gas_used, gas_price, timestamp
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW())
      RETURNING *
    `;
    
    const result = await pool.query(query, [
      action, 
      JSON.stringify(details), 
      txHash, 
      confidence, 
      status,
      userAddress,
      gasUsed,
      gasPrice
    ]);
    
    return {
      success: true,
      data: result.rows[0]
    };
  });

  // Get audit statistics
  fastify.get('/api/audit/:address/stats', async (request, reply) => {
    const { address } = request.params;
    
    if (!pool) {
      // Mock stats for development
      return {
        success: true,
        data: {
          totalActions: 15,
          successfulActions: 12,
          failedActions: 3,
          totalRebalances: 8,
          totalGasSaved: '0.045',
          averageConfidence: 0.84,
          lastAction: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
          weeklyStats: {
            actions: 5,
            rebalances: 3,
            gasUsed: '0.012',
            yieldImprovement: '2.3%'
          }
        }
      };
    }
    
    const statsQuery = `
      SELECT 
        COUNT(*) as total_actions,
        COUNT(CASE WHEN status = 'success' THEN 1 END) as successful_actions,
        COUNT(CASE WHEN status = 'failed' THEN 1 END) as failed_actions,
        COUNT(CASE WHEN action = 'rebalance' THEN 1 END) as total_rebalances,
        AVG(confidence) as average_confidence,
        SUM(CAST(gas_used AS DECIMAL)) as total_gas_used,
        MAX(timestamp) as last_action
      FROM audit_log 
      WHERE user_address = $1
    `;
    
    const result = await pool.query(statsQuery, [address]);
    
    return {
      success: true,
      data: result.rows[0]
    };
  });

  // Get recent activity
  fastify.get('/api/audit/recent', async (request, reply) => {
    const limit = parseInt(request.query.limit) || 10;
    
    if (!pool) {
      // Mock recent activity
      return {
        success: true,
        data: [
          {
            id: '1',
            action: 'rebalance',
            userAddress: '0x1234...5678',
            timestamp: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
            status: 'success'
          },
          {
            id: '2',
            action: 'delegation_created',
            userAddress: '0xabcd...efgh',
            timestamp: new Date(Date.now() - 45 * 60 * 1000).toISOString(),
            status: 'success'
          }
        ]
      };
    }
    
    const query = `
      SELECT id, action, user_address, timestamp, status
      FROM audit_log 
      ORDER BY timestamp DESC 
      LIMIT $1
    `;
    
    const result = await pool.query(query, [limit]);
    
    return {
      success: true,
      data: result.rows
    };
  });

  // Export audit data
  fastify.get('/api/audit/:address/export', async (request, reply) => {
    const { address } = request.params;
    const { format = 'json' } = request.query;
    
    if (!pool) {
      const mockData = [
        {
          timestamp: new Date().toISOString(),
          action: 'rebalance',
          status: 'success',
          details: 'Mock export data'
        }
      ];
      
      if (format === 'csv') {
        const csv = 'timestamp,action,status,details\n' + 
                   mockData.map(row => 
                     `${row.timestamp},${row.action},${row.status},"${row.details}"`
                   ).join('\n');
        
        reply.header('Content-Type', 'text/csv');
        reply.header('Content-Disposition', `attachment; filename="audit-${address}.csv"`);
        return csv;
      }
      
      return {
        success: true,
        data: mockData,
        format: 'json'
      };
    }
    
    const query = `
      SELECT * FROM audit_log 
      WHERE user_address = $1 
      ORDER BY timestamp DESC
    `;
    
    const result = await pool.query(query, [address]);
    
    if (format === 'csv') {
      const headers = Object.keys(result.rows[0] || {});
      const csv = headers.join(',') + '\n' + 
                 result.rows.map(row => 
                   headers.map(header => `"${row[header]}"`).join(',')
                 ).join('\n');
      
      reply.header('Content-Type', 'text/csv');
      reply.header('Content-Disposition', `attachment; filename="audit-${address}.csv"`);
      return csv;
    }
    
    return {
      success: true,
      data: result.rows,
      format: 'json'
    };
  });
}

module.exports = routes;