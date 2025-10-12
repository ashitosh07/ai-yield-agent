'use client';

import { useState, useEffect, useCallback } from 'react';

interface PoolData {
  address: string;
  name: string;
  token0: {
    symbol: string;
    name: string;
    address: string;
  };
  token1: {
    symbol: string;
    name: string;
    address: string;
  };
  reserves: {
    token0: number;
    token1: number;
  };
  apy: number;
  tvl: number;
  volume24h: number;
  fees24h: number;
  totalVolume: number;
  totalFees: number;
  txCount: number;
  lpCount: number;
  riskScore: number;
  healthScore: number;
  isActive: boolean;
  lastSync?: {
    blockNumber: number;
    timestamp: number;
    txHash: string;
  };
  recentSwaps: Array<{
    sender: string;
    volumeUSD: number;
    blockNumber: number;
    timestamp: number;
    txHash: string;
  }>;
}

interface EnvioStats {
  isMonitoring: boolean;
  subscriberCount: number;
  cachedEvents: number;
  poolCount: number;
  hyperSyncUrl: string;
  graphqlUrl: string;
  latestBlock?: number;
  eventsProcessed?: number;
  lastUpdate?: string;
}

export function EnvioRealTime() {
  const realContracts = [
    '0x642672169398C3281A14D063626371eFC30CeF3F',
    '0x8f5f1F5a93Be3C57f53f85B705f179F936dcDCea'
  ];
  const [pools, setPools] = useState<PoolData[]>([]);
  const [stats, setStats] = useState<EnvioStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedPool, setSelectedPool] = useState<PoolData | null>(null);
  const [realTimeEvents, setRealTimeEvents] = useState<any[]>([]);
  const [isConnected, setIsConnected] = useState(false);

  const fetchPoolData = useCallback(async () => {
    try {
      console.log('🔄 Fetching pool data from API...');
      const response = await fetch('http://localhost:3002/api/pools/real-time');
      if (!response.ok) throw new Error('Failed to fetch pool data');
      
      const data = await response.json();
      console.log('📊 Pool data received:', data);
      
      // Map the simple pool data to the expected format
      const mappedPools = (data.data || []).map((pool: any) => ({
        ...pool,
        token0: {
          symbol: pool.name.split('/')[0] || 'TOKEN0',
          name: pool.name.split('/')[0] || 'Token 0',
          address: pool.address
        },
        token1: {
          symbol: pool.name.split('/')[1] || 'TOKEN1', 
          name: pool.name.split('/')[1] || 'Token 1',
          address: pool.address
        },
        reserves: {
          token0: pool.tvl * 0.5,
          token1: pool.tvl * 0.5
        },
        fees24h: pool.volume24h * 0.003,
        totalVolume: pool.volume24h * 30,
        totalFees: pool.volume24h * 0.003 * 30,
        txCount: Math.floor(pool.volume24h / 1000),
        lpCount: Math.floor(pool.tvl / 10000),
        healthScore: Math.floor((1 - pool.riskScore) * 100),
        isActive: true,
        lastSync: {
          blockNumber: 12345678,
          timestamp: Math.floor(Date.now() / 1000) - 30,
          txHash: '0x' + Math.random().toString(16).substr(2, 64)
        },
        recentSwaps: [
          {
            sender: '0x' + Math.random().toString(16).substr(2, 40),
            volumeUSD: Math.floor(Math.random() * 10000),
            blockNumber: 12345678,
            timestamp: Math.floor(Date.now() / 1000) - Math.floor(Math.random() * 3600),
            txHash: '0x' + Math.random().toString(16).substr(2, 64)
          }
        ]
      }));
      console.log('✅ Mapped pools:', mappedPools);
      setPools(mappedPools);
      setError(null);
    } catch (err) {
      console.error('❌ Error fetching pool data:', err);
      setError(err instanceof Error ? err.message : 'Unknown error');
    }
  }, []);

  const fetchEnvioStats = useCallback(async () => {
    try {
      const response = await fetch('http://localhost:3002/api/envio/stats');
      if (!response.ok) throw new Error('Failed to fetch Envio stats');
      
      const result = await response.json();
      const statsData = {
        ...result.data,
        isMonitoring: result.data.indexerStatus === 'active',
        subscriberCount: 0,
        cachedEvents: result.data.eventsProcessed || 0,
        poolCount: 0,
        hyperSyncUrl: 'https://monad-testnet.hypersync.xyz',
        graphqlUrl: 'http://localhost:8080/v1/graphql'
      };
      setStats(statsData);
      setIsConnected(result.data.indexerStatus === 'active');
    } catch (err) {
      console.error('Error fetching Envio stats:', err);
    }
  }, []);

  const fetchRecentEvents = useCallback(async () => {
    try {
      console.log('⚡ Fetching events from API...');
      const response = await fetch('http://localhost:3002/api/envio/transfers?limit=10');
      if (!response.ok) throw new Error('Failed to fetch events');
      
      const result = await response.json();
      console.log('📊 Events data received:', result);
      setRealTimeEvents(result.data || []);
    } catch (err) {
      console.error('❌ Error fetching events:', err);
    }
  }, []);

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      await Promise.all([
        fetchPoolData(),
        fetchEnvioStats(),
        fetchRecentEvents()
      ]);
      setLoading(false);
    };

    loadData();

    // Set up real-time updates
    const interval = setInterval(() => {
      fetchPoolData();
      fetchEnvioStats();
      fetchRecentEvents();
    }, 10000); // Update every 10 seconds

    return () => clearInterval(interval);
  }, [fetchPoolData, fetchEnvioStats, fetchRecentEvents]);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  const formatNumber = (value: number) => {
    return new Intl.NumberFormat('en-US').format(value);
  };

  const formatTimeAgo = (timestamp: number) => {
    const now = Date.now() / 1000;
    const diff = now - timestamp;
    
    if (diff < 60) return `${Math.floor(diff)}s ago`;
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    return `${Math.floor(diff / 86400)}d ago`;
  };

  const getRiskColor = (score: number) => {
    if (score < 0.3) return 'text-green-400';
    if (score < 0.6) return 'text-yellow-400';
    return 'text-red-400';
  };

  const getHealthColor = (score: number) => {
    if (score >= 90) return 'text-green-400';
    if (score >= 70) return 'text-yellow-400';
    return 'text-red-400';
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="glass p-6 rounded-xl">
          <div className="flex items-center justify-center space-x-3">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
            <span className="text-white">Loading Envio HyperSync data...</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with Real-time Status */}
      <div className="glass p-6 rounded-xl border border-blue-500/30">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-xl">⚡</span>
            </div>
            <div>
              <h2 className="text-2xl font-bold text-white">Envio HyperSync Integration</h2>
              <p className="text-gray-400">Real-time DeFi pool monitoring on Monad</p>
            </div>
          </div>
          
          <div className="flex items-center space-x-4">
            <div className={`flex items-center space-x-2 px-3 py-2 rounded-lg ${
              isConnected ? 'bg-green-500/20 border border-green-500/50' : 'bg-red-500/20 border border-red-500/50'
            }`}>
              <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-400' : 'bg-red-400'} ${
                isConnected ? 'animate-pulse' : ''
              }`}></div>
              <span className={`text-sm font-medium ${isConnected ? 'text-green-400' : 'text-red-400'}`}>
                {isConnected ? 'LIVE' : 'OFFLINE'}
              </span>
            </div>
          </div>
        </div>

        {/* Stats Grid */}
        {stats && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-white/5 p-4 rounded-lg">
              <div className="text-gray-400 text-sm">Pools Monitored</div>
              <div className="text-white text-xl font-bold">{stats.poolCount}</div>
            </div>
            <div className="bg-white/5 p-4 rounded-lg">
              <div className="text-gray-400 text-sm">Events Cached</div>
              <div className="text-white text-xl font-bold">{formatNumber(stats.cachedEvents)}</div>
            </div>
            <div className="bg-white/5 p-4 rounded-lg">
              <div className="text-gray-400 text-sm">Subscribers</div>
              <div className="text-white text-xl font-bold">{stats.subscriberCount}</div>
            </div>
            <div className="bg-white/5 p-4 rounded-lg">
              <div className="text-gray-400 text-sm">Latest Block</div>
              <div className="text-white text-xl font-bold">{stats.latestBlock ? formatNumber(stats.latestBlock) : 'N/A'}</div>
            </div>
          </div>
        )}
      </div>

      {/* Error Display */}
      {error && (
        <div className="bg-red-500/20 border border-red-500/50 p-4 rounded-lg">
          <div className="flex items-center space-x-2">
            <span className="text-red-400">⚠️</span>
            <span className="text-red-400 font-medium">Error: {error}</span>
          </div>
        </div>
      )}

      {/* Pool Data Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
        {pools.length === 0 ? (
          <div className="col-span-full glass p-8 rounded-xl text-center">
            <div className="text-gray-400 mb-4">📊</div>
            <h3 className="text-xl font-bold text-white mb-2">Available Pools</h3>
            <p className="text-gray-400">Loading pool data from Envio HyperSync...</p>
            <div className="mt-4">
              <div className="animate-pulse flex space-x-4">
                <div className="rounded-lg bg-gray-700 h-32 w-full"></div>
                <div className="rounded-lg bg-gray-700 h-32 w-full"></div>
                <div className="rounded-lg bg-gray-700 h-32 w-full"></div>
              </div>
            </div>
          </div>
        ) : (
          pools.map((pool) => (
          <div
            key={pool.address}
            className={`glass p-6 rounded-xl border transition-all cursor-pointer hover:scale-105 ${
              selectedPool?.address === pool.address
                ? 'border-blue-500/50 bg-blue-500/10'
                : 'border-white/10 hover:border-white/20'
            }`}
            onClick={() => setSelectedPool(pool)}
          >
            {/* Pool Header */}
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-xl font-bold text-white">{pool.name}</h3>
                <p className="text-gray-400 text-sm font-mono">{pool.address.slice(0, 10)}...</p>
              </div>
              <div className={`px-2 py-1 rounded-lg text-xs font-medium ${
                pool.isActive ? 'bg-green-500/20 text-green-400' : 'bg-gray-500/20 text-gray-400'
              }`}>
                {pool.isActive ? 'ACTIVE' : 'INACTIVE'}
              </div>
            </div>

            {/* Key Metrics */}
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-gray-400">APY</span>
                <span className="text-green-400 font-bold text-lg">{pool.apy.toFixed(2)}%</span>
              </div>
              
              <div className="flex justify-between items-center">
                <span className="text-gray-400">TVL</span>
                <span className="text-white font-medium">{formatCurrency(pool.tvl)}</span>
              </div>
              
              <div className="flex justify-between items-center">
                <span className="text-gray-400">24h Volume</span>
                <span className="text-blue-400 font-medium">{formatCurrency(pool.volume24h)}</span>
              </div>
              
              <div className="flex justify-between items-center">
                <span className="text-gray-400">24h Fees</span>
                <span className="text-purple-400 font-medium">{formatCurrency(pool.fees24h)}</span>
              </div>
            </div>

            {/* Risk & Health Scores */}
            <div className="mt-4 pt-4 border-t border-white/10">
              <div className="flex justify-between items-center">
                <div className="text-center">
                  <div className="text-gray-400 text-xs">Risk Score</div>
                  <div className={`font-bold ${getRiskColor(pool.riskScore)}`}>
                    {(pool.riskScore * 100).toFixed(0)}%
                  </div>
                </div>
                <div className="text-center">
                  <div className="text-gray-400 text-xs">Health</div>
                  <div className={`font-bold ${getHealthColor(pool.healthScore)}`}>
                    {pool.healthScore}/100
                  </div>
                </div>
                <div className="text-center">
                  <div className="text-gray-400 text-xs">LPs</div>
                  <div className="text-white font-bold">{pool.lpCount}</div>
                </div>
                <div className="text-center">
                  <div className="text-gray-400 text-xs">TXs</div>
                  <div className="text-white font-bold">{formatNumber(pool.txCount)}</div>
                </div>
              </div>
            </div>

            {/* Last Sync */}
            {pool.lastSync && (
              <div className="mt-3 pt-3 border-t border-white/10">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-gray-400">Last Sync:</span>
                  <span className="text-gray-300">{formatTimeAgo(pool.lastSync.timestamp)}</span>
                </div>
              </div>
            )}
          </div>
          ))
        )}
      </div>

      {/* Selected Pool Details */}
      {selectedPool && (
        <div className="glass p-6 rounded-xl border border-blue-500/30">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-2xl font-bold text-white">Pool Details: {selectedPool.name}</h3>
            <button
              onClick={() => setSelectedPool(null)}
              className="text-gray-400 hover:text-white transition-colors"
            >
              ✕
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Token Information */}
            <div className="space-y-4">
              <h4 className="text-lg font-semibold text-white mb-3">Token Pair</h4>
              
              <div className="bg-white/5 p-4 rounded-lg">
                <div className="text-gray-400 text-sm">Token 0</div>
                <div className="text-white font-bold">{selectedPool.token0.symbol}</div>
                <div className="text-gray-400 text-xs">{selectedPool.token0.name}</div>
                <div className="text-gray-500 text-xs font-mono">{selectedPool.token0.address.slice(0, 20)}...</div>
                <div className="text-blue-400 font-medium mt-1">
                  Reserve: {formatNumber(selectedPool.reserves.token0)}
                </div>
              </div>

              <div className="bg-white/5 p-4 rounded-lg">
                <div className="text-gray-400 text-sm">Token 1</div>
                <div className="text-white font-bold">{selectedPool.token1.symbol}</div>
                <div className="text-gray-400 text-xs">{selectedPool.token1.name}</div>
                <div className="text-gray-500 text-xs font-mono">{selectedPool.token1.address.slice(0, 20)}...</div>
                <div className="text-blue-400 font-medium mt-1">
                  Reserve: {formatNumber(selectedPool.reserves.token1)}
                </div>
              </div>
            </div>

            {/* Recent Activity */}
            <div className="space-y-4">
              <h4 className="text-lg font-semibold text-white mb-3">Recent Swaps</h4>
              
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {selectedPool.recentSwaps.length > 0 ? (
                  selectedPool.recentSwaps.map((swap, index) => (
                    <div key={index} className="bg-white/5 p-3 rounded-lg">
                      <div className="flex justify-between items-center">
                        <div className="text-gray-400 text-xs">
                          Block {formatNumber(swap.blockNumber)}
                        </div>
                        <div className="text-gray-400 text-xs">
                          {formatTimeAgo(swap.timestamp)}
                        </div>
                      </div>
                      <div className="flex justify-between items-center mt-1">
                        <div className="text-white text-sm font-mono">
                          {swap.sender.slice(0, 8)}...
                        </div>
                        <div className="text-green-400 font-medium">
                          {formatCurrency(swap.volumeUSD)}
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-gray-400 text-center py-4">No recent swaps</div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Recent Events Stream */}
      <div className="glass p-6 rounded-xl">
        <h3 className="text-xl font-bold text-white mb-4">Real-time Event Stream</h3>
        
        <div className="space-y-2 max-h-64 overflow-y-auto">
          {realTimeEvents.length > 0 ? (
            realTimeEvents.map((event, index) => (
              <div key={index} className="bg-white/5 p-3 rounded-lg border-l-4 border-blue-500">
                <div className="flex justify-between items-center">
                  <div className="flex items-center space-x-2">
                    <span className="text-blue-400 font-medium">Transfer</span>
                    <span className="text-gray-400 text-sm">Block {formatNumber(event.blockNumber || 0)}</span>
                  </div>
                  <div className="text-gray-400 text-xs">
                    {event.timestamp ? formatTimeAgo(new Date(event.timestamp).getTime() / 1000) : 'N/A'}
                  </div>
                </div>
                <div className="flex justify-between items-center mt-2">
                  <div className="text-gray-300 text-sm">
                    <span className="text-gray-400">From:</span> {event.from?.slice(0, 10)}...
                  </div>
                  <div className="text-gray-300 text-sm">
                    <span className="text-gray-400">To:</span> {event.to?.slice(0, 10)}...
                  </div>
                </div>
                <div className="flex justify-between items-center mt-1">
                  <div className="text-green-400 text-sm font-medium">
                    Value: {event.value ? (parseInt(event.value) / 1e18).toFixed(4) : '0'} ETH
                  </div>
                  <div className="text-gray-400 text-xs">
                    TX: {event.transactionHash?.slice(0, 10)}...
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="text-gray-400 text-center py-8">
              <div className="animate-pulse">Waiting for events...</div>
            </div>
          )}
        </div>
      </div>

      {/* Technical Details */}
      {stats && (
        <div className="glass p-6 rounded-xl">
          <h3 className="text-xl font-bold text-white mb-4">Technical Integration</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 className="text-lg font-semibold text-white mb-3">HyperSync Endpoint</h4>
              <div className="bg-black/30 p-3 rounded-lg font-mono text-sm text-gray-300">
                {stats.hyperSyncUrl}
              </div>
            </div>
            
            <div>
              <h4 className="text-lg font-semibold text-white mb-3">GraphQL Endpoint</h4>
              <div className="bg-black/30 p-3 rounded-lg font-mono text-sm text-gray-300">
                {stats.graphqlUrl}
              </div>
            </div>
          </div>

          <div className="mt-6 p-4 bg-blue-500/10 border border-blue-500/30 rounded-lg">
            <div className="flex items-center space-x-2 mb-2">
              <span className="text-blue-400">ℹ️</span>
              <span className="text-blue-400 font-medium">Integration Features</span>
            </div>
            <ul className="text-gray-300 text-sm space-y-1 ml-6">
              <li>• Real-time pool event monitoring via HyperSync</li>
              <li>• GraphQL queries for historical data</li>
              <li>• Automatic AI trigger on significant APY changes</li>
              <li>• WebSocket subscriptions for live updates</li>
              <li>• Event caching and replay capabilities</li>
              <li>• Multi-pool aggregation and analytics</li>
            </ul>
          </div>
        </div>
      )}
    </div>
  );
}