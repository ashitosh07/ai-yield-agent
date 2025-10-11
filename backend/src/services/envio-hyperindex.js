const axios = require('axios');

class EnvioHyperIndexService {
  constructor() {
    this.graphqlUrl = process.env.ENVIO_GRAPHQL_URL || 'http://localhost:8080/v1/graphql';
    this.indexerUrl = process.env.ENVIO_INDEXER_URL || 'http://localhost:8080';
  }

  async getPoolsWithMetrics() {
    const query = `
      query GetPoolsWithMetrics {
        Pool {
          id
          address
          name
          token0
          token1
          reserve0
          reserve1
          apy
          tvlUSD
          volumeUSD24h
          feesUSD24h
          riskScore
          lastUpdated
        }
      }
    `;

    try {
      const response = await axios.post(this.graphqlUrl, { query });
      return response.data.data.Pool.map(pool => ({
        address: pool.address,
        name: pool.name,
        apy: pool.apy,
        tvl: pool.tvlUSD,
        volume24h: pool.volumeUSD24h,
        fees24h: pool.feesUSD24h,
        riskScore: pool.riskScore,
        reserve0: pool.reserve0,
        reserve1: pool.reserve1,
        lastUpdated: pool.lastUpdated
      }));
    } catch (error) {
      console.error('Error fetching pools from HyperIndex:', error);
      return this.getMockPoolData();
    }
  }

  async getUserPositions(userAddress) {
    const query = `
      query GetUserPositions($user: String!) {
        UserPosition(where: { user: { _eq: $user } }) {
          id
          user
          pool {
            id
            address
            name
            apy
            tvlUSD
          }
          balance
          valueUSD
          lastUpdated
        }
      }
    `;

    try {
      const response = await axios.post(this.graphqlUrl, {
        query,
        variables: { user: userAddress.toLowerCase() }
      });

      return response.data.data.UserPosition.map(position => ({
        poolAddress: position.pool.address,
        poolName: position.pool.name,
        balance: (Number(position.balance) / 1e18).toString(),
        value: position.valueUSD,
        apy: position.pool.apy,
        dailyEarnings: position.valueUSD * position.pool.apy / 100 / 365
      }));
    } catch (error) {
      console.error('Error fetching user positions:', error);
      return [];
    }
  }

  async getPoolHistory(poolAddress, days = 7) {
    const query = `
      query GetPoolHistory($poolId: String!, $fromDate: String!) {
        YieldMetrics(
          where: { 
            pool_id: { _eq: $poolId }
            date: { _gte: $fromDate }
          }
          order_by: { date: asc }
        ) {
          date
          apy
          tvlUSD
          volumeUSD
          feesUSD
          blockTimestamp
        }
      }
    `;

    const fromDate = new Date();
    fromDate.setDate(fromDate.getDate() - days);

    try {
      const response = await axios.post(this.graphqlUrl, {
        query,
        variables: {
          poolId: poolAddress.toLowerCase(),
          fromDate: fromDate.toISOString().split('T')[0]
        }
      });

      return response.data.data.YieldMetrics;
    } catch (error) {
      console.error('Error fetching pool history:', error);
      return [];
    }
  }

  async getRecentSwaps(poolAddress, limit = 10) {
    const query = `
      query GetRecentSwaps($poolId: String!, $limit: Int!) {
        SwapEvent(
          where: { pool_id: { _eq: $poolId } }
          order_by: { blockTimestamp: desc }
          limit: $limit
        ) {
          id
          sender
          amount0In
          amount1In
          amount0Out
          amount1Out
          to
          volumeUSD
          blockNumber
          blockTimestamp
          transactionHash
        }
      }
    `;

    try {
      const response = await axios.post(this.graphqlUrl, {
        query,
        variables: {
          poolId: poolAddress.toLowerCase(),
          limit
        }
      });

      return response.data.data.SwapEvent;
    } catch (error) {
      console.error('Error fetching recent swaps:', error);
      return [];
    }
  }

  async getAIActions(userAddress, limit = 20) {
    const query = `
      query GetAIActions($user: String!, $limit: Int!) {
        AIAction(
          where: { user: { _eq: $user } }
          order_by: { blockTimestamp: desc }
          limit: $limit
        ) {
          id
          user
          fromPool {
            name
            address
          }
          toPool {
            name
            address
          }
          amount
          confidence
          rationale
          status
          txHash
          blockNumber
          blockTimestamp
        }
      }
    `;

    try {
      const response = await axios.post(this.graphqlUrl, {
        query,
        variables: {
          user: userAddress.toLowerCase(),
          limit
        }
      });

      return response.data.data.AIAction.map(action => ({
        id: action.id,
        action: 'rebalance',
        details: {
          rationale: action.rationale,
          fromPool: action.fromPool?.name,
          toPool: action.toPool?.name,
          amount: (Number(action.amount) / 1e18).toString()
        },
        txHash: action.txHash,
        confidence: action.confidence,
        status: action.status,
        timestamp: new Date(Number(action.blockTimestamp) * 1000).toISOString(),
        userAddress: action.user
      }));
    } catch (error) {
      console.error('Error fetching AI actions:', error);
      return [];
    }
  }

  async getPoolAnalytics() {
    const query = `
      query GetPoolAnalytics {
        Pool {
          tvlUSD
          apy
          volumeUSD24h
          riskScore
        }
      }
    `;

    try {
      const response = await axios.post(this.graphqlUrl, { query });
      const pools = response.data.data.Pool;

      return {
        totalTVL: pools.reduce((sum, pool) => sum + pool.tvlUSD, 0),
        averageAPY: pools.reduce((sum, pool) => sum + pool.apy, 0) / pools.length,
        totalVolume24h: pools.reduce((sum, pool) => sum + pool.volumeUSD24h, 0),
        poolCount: pools.length,
        riskDistribution: {
          low: pools.filter(p => p.riskScore < 0.3).length,
          medium: pools.filter(p => p.riskScore >= 0.3 && p.riskScore < 0.6).length,
          high: pools.filter(p => p.riskScore >= 0.6).length
        }
      };
    } catch (error) {
      console.error('Error fetching pool analytics:', error);
      return this.getMockAnalytics();
    }
  }

  async subscribeToPoolChanges(callback) {
    const subscription = `
      subscription PoolChanges {
        Pool {
          id
          address
          name
          apy
          tvlUSD
          lastUpdated
        }
      }
    `;

    try {
      // WebSocket subscription for real-time updates
      const ws = new WebSocket(this.graphqlUrl.replace('http', 'ws'));
      
      ws.onopen = () => {
        ws.send(JSON.stringify({
          type: 'start',
          payload: { query: subscription }
        }));
      };

      ws.onmessage = (event) => {
        const data = JSON.parse(event.data);
        if (data.type === 'data') {
          callback(data.payload.data.Pool);
        }
      };

      return ws;
    } catch (error) {
      console.error('Error setting up pool subscription:', error);
      return null;
    }
  }

  getMockPoolData() {
    return [
      {
        address: '0x1234567890123456789012345678901234567890',
        name: 'USDC/ETH',
        apy: 12.5 + (Math.random() - 0.5) * 4,
        tvl: 1000000 + Math.random() * 500000,
        volume24h: 50000 + Math.random() * 100000,
        fees24h: 500 + Math.random() * 1000,
        riskScore: 0.3
      },
      {
        address: '0x2345678901234567890123456789012345678901',
        name: 'DAI/USDC',
        apy: 8.3 + (Math.random() - 0.5) * 2,
        tvl: 2000000 + Math.random() * 800000,
        volume24h: 80000 + Math.random() * 120000,
        fees24h: 800 + Math.random() * 1200,
        riskScore: 0.1
      },
      {
        address: '0x3456789012345678901234567890123456789012',
        name: 'WETH/USDT',
        apy: 15.2 + (Math.random() - 0.5) * 6,
        tvl: 800000 + Math.random() * 400000,
        volume24h: 60000 + Math.random() * 80000,
        fees24h: 600 + Math.random() * 800,
        riskScore: 0.5
      }
    ];
  }

  getMockAnalytics() {
    return {
      totalTVL: 3800000,
      averageAPY: 12.0,
      totalVolume24h: 190000,
      poolCount: 3,
      riskDistribution: { low: 1, medium: 1, high: 1 }
    };
  }
}

module.exports = EnvioHyperIndexService;