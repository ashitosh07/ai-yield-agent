'use client';

import { useState, useEffect } from 'react';

export function EnvioIntegration() {
  const [indexerStats, setIndexerStats] = useState({
    totalEvents: 15847,
    poolsIndexed: 3,
    lastSync: new Date(),
    avgLatency: 45
  });

  useEffect(() => {
    const interval = setInterval(() => {
      setIndexerStats(prev => ({
        ...prev,
        totalEvents: prev.totalEvents + Math.floor(Math.random() * 5),
        lastSync: new Date(),
        avgLatency: 30 + Math.floor(Math.random() * 30)
      }));
    }, 3000);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="glass rounded-xl p-6">
      <h3 className="text-xl font-semibold text-white mb-4">⚡ Envio HyperIndex Integration</h3>
      
      <div className="space-y-4">
        <div className="bg-gray-800/50 p-4 rounded-lg">
          <h4 className="text-white font-semibold mb-3">Real-time Indexing Status</h4>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <div className="text-gray-400 text-sm">Events Processed</div>
              <div className="text-white font-mono text-lg">{indexerStats.totalEvents.toLocaleString()}</div>
            </div>
            <div>
              <div className="text-gray-400 text-sm">Pools Indexed</div>
              <div className="text-white font-mono text-lg">{indexerStats.poolsIndexed}</div>
            </div>
            <div>
              <div className="text-gray-400 text-sm">Avg Latency</div>
              <div className="text-white font-mono text-lg">{indexerStats.avgLatency}ms</div>
            </div>
            <div>
              <div className="text-gray-400 text-sm">Last Sync</div>
              <div className="text-white font-mono text-sm">{indexerStats.lastSync.toLocaleTimeString()}</div>
            </div>
          </div>
        </div>

        <div className="bg-gray-800/50 p-4 rounded-lg">
          <h4 className="text-white font-semibold mb-3">HyperSync Features</h4>
          <div className="space-y-2">
            <div className="flex items-center">
              <div className="w-2 h-2 bg-green-400 rounded-full mr-3"></div>
              <span className="text-gray-300">Real-time pool event monitoring</span>
            </div>
            <div className="flex items-center">
              <div className="w-2 h-2 bg-green-400 rounded-full mr-3"></div>
              <span className="text-gray-300">GraphQL API for complex queries</span>
            </div>
            <div className="flex items-center">
              <div className="w-2 h-2 bg-green-400 rounded-full mr-3"></div>
              <span className="text-gray-300">Sub-second blockchain data access</span>
            </div>
            <div className="flex items-center">
              <div className="w-2 h-2 bg-green-400 rounded-full mr-3"></div>
              <span className="text-gray-300">Automatic AI trigger webhooks</span>
            </div>
          </div>
        </div>

        <div className="bg-blue-900/30 border border-blue-500 p-4 rounded-lg">
          <h4 className="text-blue-400 font-semibold mb-2">📊 GraphQL Endpoint</h4>
          <code className="text-gray-300 text-sm">http://localhost:8000/v1/graphql</code>
          <p className="text-gray-400 text-sm mt-2">
            Query pools, user positions, AI actions, and yield metrics in real-time
          </p>
        </div>

        <div className="bg-purple-900/30 border border-purple-500 p-4 rounded-lg">
          <h4 className="text-purple-400 font-semibold mb-2">🔄 HyperSync API</h4>
          <code className="text-gray-300 text-sm">https://monad-testnet.hypersync.xyz</code>
          <p className="text-gray-400 text-sm mt-2">
            High-performance blockchain data streaming for AI decision making
          </p>
        </div>

        <div className="bg-gray-700/50 p-4 rounded-lg border border-gray-600">
          <h4 className="text-white font-semibold mb-2">🏗️ Indexed Data</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
            <div>
              <div className="text-gray-400">Pool Events</div>
              <div className="text-white">Sync, Swap, Mint, Burn</div>
            </div>
            <div>
              <div className="text-gray-400">User Positions</div>
              <div className="text-white">Balances, Values, History</div>
            </div>
            <div>
              <div className="text-gray-400">AI Actions</div>
              <div className="text-white">Rebalances, Confidence, Results</div>
            </div>
            <div>
              <div className="text-gray-400">Yield Metrics</div>
              <div className="text-white">APY, TVL, Volume, Fees</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}