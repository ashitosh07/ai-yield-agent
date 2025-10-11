const axios = require('axios');

class EnvioService {
  constructor() {
    this.hyperSyncUrl = process.env.ENVIO_HYPERSYNC_URL || 'https://monad-testnet.hypersync.xyz';
    this.graphqlUrl = process.env.ENVIO_GRAPHQL_URL || 'https://indexer.bigdevenergy.link/41454/v1/graphql';
  }

  async getPoolEvents(fromBlock, toBlock) {
    try {
      const response = await axios.post(`${this.hyperSyncUrl}/query`, {
        from_block: fromBlock,
        to_block: toBlock,
        logs: [{
          address: [
            '0x1234567890123456789012345678901234567890', // USDC/ETH Pool
            '0x2345678901234567890123456789012345678901', // DAI/USDC Pool
            '0x3456789012345678901234567890123456789012'  // WETH/USDT Pool
          ],
          topics: [
            ['0x1c411e9a96e071241c2f21f7726b17ae89e3cab4c78be50e062b03a9fffbbad1'], // Sync event
            ['0xd78ad95fa46c994b6551d0da85fc275fe613ce37657fb8d5e3d130840159d822']  // Swap event
          ]
        }],
        field_selection: {
          log: ['address', 'topic0', 'topic1', 'topic2', 'topic3', 'data'],
          block: ['number', 'timestamp']
        }
      });

      return this.parsePoolEvents(response.data);
    } catch (error) {
      console.error('Error fetching pool events:', error);
      throw error;
    }
  }

  async getPoolData(poolAddresses) {
    const query = `
      query GetPoolData($addresses: [String!]!) {
        pools(where: { address_in: $addresses }) {
          address
          token0 {
            symbol
            decimals
          }
          token1 {
            symbol
            decimals
          }
          reserve0
          reserve1
          totalSupply
          volumeUSD24h
          feesUSD24h
          apy
          tvlUSD
        }
      }
    `;

    try {
      const response = await axios.post(this.graphqlUrl, {
        query,
        variables: { addresses: poolAddresses }
      });

      return response.data.data.pools.map(pool => ({
        address: pool.address,
        name: `${pool.token0.symbol}/${pool.token1.symbol}`,
        apy: this.calculateAPY(pool),
        tvl: parseFloat(pool.tvlUSD),
        volume24h: parseFloat(pool.volumeUSD24h),
        fees24h: parseFloat(pool.feesUSD24h),
        riskScore: this.calculateRiskScore(pool)
      }));
    } catch (error) {
      console.error('Error fetching pool data:', error);
      return this.getMockPoolData();
    }
  }

  calculateAPY(pool) {
    // Calculate APY based on fees and TVL
    const dailyFees = parseFloat(pool.feesUSD24h);
    const tvl = parseFloat(pool.tvlUSD);
    
    if (tvl === 0) return 0;
    
    const dailyYield = dailyFees / tvl;
    const apy = (Math.pow(1 + dailyYield, 365) - 1) * 100;
    
    return Math.min(apy, 1000); // Cap at 1000% to avoid unrealistic values
  }

  calculateRiskScore(pool) {
    const tvl = parseFloat(pool.tvlUSD);
    const volume = parseFloat(pool.volumeUSD24h);
    
    // Risk factors
    let riskScore = 0;
    
    // TVL risk (lower TVL = higher risk)
    if (tvl < 100000) riskScore += 0.4;
    else if (tvl < 1000000) riskScore += 0.2;
    else riskScore += 0.1;
    
    // Volume/TVL ratio risk
    const volumeRatio = volume / tvl;
    if (volumeRatio > 2) riskScore += 0.3; // High turnover
    else if (volumeRatio < 0.1) riskScore += 0.2; // Low liquidity
    
    // Token pair risk (simplified)
    const isStablePair = ['USDC', 'DAI', 'USDT'].includes(pool.token0.symbol) && 
                        ['USDC', 'DAI', 'USDT'].includes(pool.token1.symbol);
    if (!isStablePair) riskScore += 0.2;
    
    return Math.min(riskScore, 1.0);
  }

  parsePoolEvents(data) {
    const events = [];
    
    if (data.data && data.data.length > 0) {
      data.data.forEach(item => {
        if (item.logs) {
          item.logs.forEach(log => {
            events.push({
              address: log.address,
              blockNumber: item.block_number,
              timestamp: item.timestamp,
              topic0: log.topic0,
              data: log.data,
              type: this.getEventType(log.topic0)
            });
          });
        }
      });
    }
    
    return events;
  }

  getEventType(topic0) {
    const eventTypes = {
      '0x1c411e9a96e071241c2f21f7726b17ae89e3cab4c78be50e062b03a9fffbbad1': 'Sync',
      '0xd78ad95fa46c994b6551d0da85fc275fe613ce37657fb8d5e3d130840159d822': 'Swap'
    };
    
    return eventTypes[topic0] || 'Unknown';
  }

  getMockPoolData() {
    return [
      {
        address: '0x1234567890123456789012345678901234567890',
        name: 'USDC/ETH',
        apy: 12.5 + (Math.random() - 0.5) * 4, // Add some variance
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

  async monitorPoolChanges() {
    let lastBlock = await this.getLatestBlock();
    
    setInterval(async () => {
      try {
        const currentBlock = await this.getLatestBlock();
        
        if (currentBlock > lastBlock) {
          const events = await this.getPoolEvents(lastBlock + 1, currentBlock);
          
          if (events.length > 0) {
            await this.processPoolEvents(events);
          }
          
          lastBlock = currentBlock;
        }
      } catch (error) {
        console.error('Error monitoring pool changes:', error);
      }
    }, 10000); // Check every 10 seconds
  }

  async getLatestBlock() {
    try {
      const response = await axios.post(`${this.hyperSyncUrl}/height`);
      return response.data.height;
    } catch (error) {
      console.error('Error getting latest block:', error);
      return 0;
    }
  }

  async processPoolEvents(events) {
    for (const event of events) {
      if (event.type === 'Sync') {
        // Trigger AI analysis for significant pool changes
        await this.triggerAIAnalysis(event);
      }
    }
  }

  async triggerAIAnalysis(event) {
    try {
      await axios.post('http://localhost:3003/analyze', {
        poolAddress: event.address,
        oldAPY: 0, // Would calculate from previous state
        newAPY: 0, // Would calculate from current state
        timestamp: new Date(event.timestamp * 1000).toISOString()
      });
    } catch (error) {
      console.error('Error triggering AI analysis:', error);
    }
  }
}

module.exports = EnvioService;