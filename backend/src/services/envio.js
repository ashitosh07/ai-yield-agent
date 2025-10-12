const axios = require('axios');

class EnvioService {
  constructor() {
    this.hyperSyncUrl = process.env.ENVIO_HYPERSYNC_URL || 'https://monad-testnet.hypersync.xyz';
    this.graphqlUrl = process.env.ENVIO_GRAPHQL_URL || 'http://localhost:8080/v1/graphql';
    this.realContracts = [
      '0x642672169398C3281A14D063626371eFC30CeF3F',
      '0x8f5f1F5a93Be3C57f53f85B705f179F936dcDCea'
    ];
  }

  async getPoolEvents(fromBlock, toBlock) {
    try {
      const response = await axios.post(`${this.hyperSyncUrl}/query`, {
        from_block: fromBlock,
        to_block: toBlock,
        logs: [{
          address: this.realContracts,
          topics: [
            ['0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef'], // Transfer
            ['0x8c5be1e5ebec7d5bd14f71427d1e84f3dd0314c0f7b2291e5b200ac8c7c3b925'], // Approval
            ['0x1c411e9a96e071241c2f21f7726b17ae89e3cab4c78be50e062b03a9fffbbad1'], // Sync
            ['0xd78ad95fa46c994b6551d0da85fc275fe613ce37657fb8d5e3d130840159d822']  // Swap
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
      query GetTransfers($addresses: [String!]!) {
        transfers(where: { contract_in: $addresses }, orderBy: blockNumber, orderDirection: desc, first: 100) {
          id
          from
          to
          value
          contract
          blockNumber
          timestamp
          transactionHash
        }
      }
    `;

    try {
      const response = await axios.post(this.graphqlUrl, {
        query,
        variables: { addresses: poolAddresses }
      });

      if (response.data.data && response.data.data.transfers) {
        return this.processTransfersToPoolData(response.data.data.transfers);
      }
      
      return this.getMockPoolData();
    } catch (error) {
      console.error('Error fetching pool data:', error);
      return this.getMockPoolData();
    }
  }

  processTransfersToPoolData(transfers) {
    const poolStats = {};
    
    transfers.forEach(transfer => {
      if (!poolStats[transfer.contract]) {
        poolStats[transfer.contract] = {
          address: transfer.contract,
          name: transfer.contract === '0x642672169398C3281A14D063626371eFC30CeF3F' ? 'MON/Token1' : 'MON/Token2',
          totalVolume: BigInt(0),
          transferCount: 0,
          lastActivity: new Date(transfer.timestamp)
        };
      }
      
      poolStats[transfer.contract].totalVolume += BigInt(transfer.value);
      poolStats[transfer.contract].transferCount++;
    });

    return Object.values(poolStats).map(pool => ({
      address: pool.address,
      name: pool.name,
      apy: this.calculateAPYFromActivity(pool),
      tvl: Number(pool.totalVolume) / 1e18,
      volume24h: Number(pool.totalVolume) / 1e18 * 0.1,
      fees24h: Number(pool.totalVolume) / 1e18 * 0.003,
      riskScore: this.calculateRiskFromActivity(pool)
    }));
  }

  calculateAPYFromActivity(pool) {
    const baseAPY = 8 + (pool.transferCount * 0.1);
    return Math.min(baseAPY + Math.random() * 10, 50);
  }

  calculateRiskFromActivity(pool) {
    if (pool.transferCount < 10) return 0.8;
    if (pool.transferCount < 50) return 0.5;
    return 0.3;
  }

  calculateAPY(pool) {
    const dailyFees = parseFloat(pool.feesUSD24h);
    const tvl = parseFloat(pool.tvlUSD);
    
    if (tvl === 0) return 0;
    
    const dailyYield = dailyFees / tvl;
    const apy = (Math.pow(1 + dailyYield, 365) - 1) * 100;
    
    return Math.min(apy, 1000);
  }

  calculateRiskScore(pool) {
    const tvl = parseFloat(pool.tvlUSD);
    const volume = parseFloat(pool.volumeUSD24h);
    
    let riskScore = 0;
    
    if (tvl < 100000) riskScore += 0.4;
    else if (tvl < 1000000) riskScore += 0.2;
    else riskScore += 0.1;
    
    const volumeRatio = volume / tvl;
    if (volumeRatio > 2) riskScore += 0.3;
    else if (volumeRatio < 0.1) riskScore += 0.2;
    
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
      '0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef': 'Transfer',
      '0x8c5be1e5ebec7d5bd14f71427d1e84f3dd0314c0f7b2291e5b200ac8c7c3b925': 'Approval',
      '0x1c411e9a96e071241c2f21f7726b17ae89e3cab4c78be50e062b03a9fffbbad1': 'Sync',
      '0xd78ad95fa46c994b6551d0da85fc275fe613ce37657fb8d5e3d130840159d822': 'Swap'
    };
    
    return eventTypes[topic0] || 'Unknown';
  }

  getMockPoolData() {
    return [
      {
        address: '0x642672169398C3281A14D063626371eFC30CeF3F',
        name: 'MON/Token1',
        apy: 12.5 + (Math.random() - 0.5) * 4,
        tvl: 500000 + Math.random() * 250000,
        volume24h: 25000 + Math.random() * 50000,
        fees24h: 250 + Math.random() * 500,
        riskScore: 0.4
      },
      {
        address: '0x8f5f1F5a93Be3C57f53f85B705f179F936dcDCea',
        name: 'MON/Token2',
        apy: 18.3 + (Math.random() - 0.5) * 6,
        tvl: 300000 + Math.random() * 150000,
        volume24h: 15000 + Math.random() * 30000,
        fees24h: 150 + Math.random() * 300,
        riskScore: 0.6
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
    }, 10000);
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
      if (event.type === 'Transfer' || event.type === 'Sync') {
        await this.triggerAIAnalysis(event);
      }
    }
  }

  async triggerAIAnalysis(event) {
    try {
      await axios.post('http://localhost:3003/analyze', {
        poolAddress: event.address,
        eventType: event.type,
        blockNumber: event.blockNumber,
        timestamp: new Date(event.timestamp * 1000).toISOString()
      });
    } catch (error) {
      console.error('Error triggering AI analysis:', error);
    }
  }
}

module.exports = EnvioService;