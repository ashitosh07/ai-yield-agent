const { GraphQLClient } = require('graphql-request');

class HyperIndexClient {
  constructor() {
    this.client = new GraphQLClient('http://localhost:8000/v1/graphql');
    this.isConnected = false;
  }

  async connect() {
    try {
      await this.healthCheck();
      this.isConnected = true;
      console.log('✅ HyperIndex connected');
      return true;
    } catch (error) {
      console.log('❌ HyperIndex connection failed:', error.message);
      this.isConnected = false;
      return false;
    }
  }

  async healthCheck() {
    const query = `
      query {
        Transfer(limit: 1) {
          id
          blockNumber
        }
      }
    `;
    
    return await this.client.request(query);
  }

  async getRecentSwaps(limit = 10) {
    const query = `
      query GetRecentSwaps($limit: Int!) {
        Swap(
          limit: $limit
          order_by: { blockNumber: desc }
        ) {
          id
          sender
          amount0In
          amount1In
          amount0Out
          amount1Out
          to
          contract
          blockNumber
          timestamp
          transactionHash
        }
      }
    `;

    try {
      const data = await this.client.request(query, { limit });
      return data.Swap || [];
    } catch (error) {
      console.error('HyperIndex swap query failed:', error);
      return [];
    }
  }

  async getPoolActivity(contractAddress, hours = 24) {
    const hoursAgo = new Date(Date.now() - hours * 60 * 60 * 1000);
    
    const query = `
      query GetPoolActivity($contract: String!, $timestamp: timestamptz!) {
        Transfer(
          where: {
            contract: { _eq: $contract }
            timestamp: { _gte: $timestamp }
          }
          order_by: { blockNumber: desc }
        ) {
          id
          from
          to
          value
          blockNumber
          timestamp
          transactionHash
        }
        
        Swap(
          where: {
            contract: { _eq: $contract }
            timestamp: { _gte: $timestamp }
          }
          order_by: { blockNumber: desc }
        ) {
          id
          amount0In
          amount1In
          amount0Out
          amount1Out
          blockNumber
          timestamp
        }
      }
    `;

    try {
      const data = await this.client.request(query, {
        contract: contractAddress,
        timestamp: hoursAgo.toISOString()
      });
      
      return {
        transfers: data.Transfer || [],
        swaps: data.Swap || [],
        totalVolume: this.calculateVolume(data.Swap || [])
      };
    } catch (error) {
      console.error('HyperIndex pool activity query failed:', error);
      return { transfers: [], swaps: [], totalVolume: 0 };
    }
  }

  calculateVolume(swaps) {
    return swaps.reduce((total, swap) => {
      const volume = Math.max(
        parseFloat(swap.amount0In || 0),
        parseFloat(swap.amount1In || 0)
      );
      return total + volume;
    }, 0);
  }

  async getLatestBlock() {
    const query = `
      query GetLatestBlock {
        Transfer(limit: 1, order_by: { blockNumber: desc }) {
          blockNumber
          timestamp
        }
      }
    `;

    try {
      const data = await this.client.request(query);
      return data.Transfer[0] || null;
    } catch (error) {
      console.error('HyperIndex latest block query failed:', error);
      return null;
    }
  }

  async getYieldMetrics(contractAddress) {
    const activity = await this.getPoolActivity(contractAddress, 24);
    const volume24h = activity.totalVolume;
    const fees24h = volume24h * 0.003; // 0.3% fee
    
    // Estimate TVL from recent transfers
    const recentTransfers = activity.transfers.slice(0, 20);
    const avgTransferValue = recentTransfers.reduce((sum, t) => 
      sum + parseFloat(t.value), 0) / Math.max(recentTransfers.length, 1);
    
    const estimatedTVL = avgTransferValue * 1000; // Rough estimate
    const apy = estimatedTVL > 0 ? (fees24h * 365 / estimatedTVL) * 100 : 0;

    return {
      contractAddress,
      volume24h,
      fees24h,
      estimatedTVL,
      apy,
      swapCount: activity.swaps.length,
      transferCount: activity.transfers.length,
      lastUpdate: new Date().toISOString()
    };
  }
}

module.exports = HyperIndexClient;