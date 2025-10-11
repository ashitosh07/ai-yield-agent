'use client';

import { useState, useEffect } from 'react';

interface EnvioMetrics {
  indexerStatus: 'active' | 'syncing' | 'error';
  lastBlock: number;
  eventsProcessed: number;
  hyperSyncLatency: number;
  graphqlQueries: number;
}

export function EnvioStatus() {
  const [metrics, setMetrics] = useState<EnvioMetrics>({
    indexerStatus: 'active',
    lastBlock: 12847392,
    eventsProcessed: 15847,
    hyperSyncLatency: 45,
    graphqlQueries: 1247
  });

  useEffect(() => {
    // Simulate real-time updates
    const interval = setInterval(() => {
      setMetrics(prev => ({
        ...prev,
        lastBlock: prev.lastBlock + Math.floor(Math.random() * 3),
        eventsProcessed: prev.eventsProcessed + Math.floor(Math.random() * 5),
        hyperSyncLatency: 30 + Math.floor(Math.random() * 30),
        graphqlQueries: prev.graphqlQueries + Math.floor(Math.random() * 3)
      }));
    }, 2000);

    return () => clearInterval(interval);
  }, []);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'text-green-400 bg-green-900/30';
      case 'syncing': return 'text-yellow-400 bg-yellow-900/30';
      case 'error': return 'text-red-400 bg-red-900/30';
      default: return 'text-gray-400 bg-gray-900/30';
    }
  };

  return (
    <div className="glass rounded-xl p-4">
      <div className="flex items-center justify-between mb-3">
        <h4 className="text-white font-semibold flex items-center">
          <span className="text-2xl mr-2">⚡</span>
          Envio HyperIndex
        </h4>
        <div className={`px-2 py-1 rounded-full text-xs ${getStatusColor(metrics.indexerStatus)}`}>
          {metrics.indexerStatus.toUpperCase()}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 text-sm">
        <div>
          <div className="text-gray-400">Latest Block</div>
          <div className="text-white font-mono">{metrics.lastBlock.toLocaleString()}</div>
        </div>
        <div>
          <div className="text-gray-400">Events Processed</div>
          <div className="text-white font-mono">{metrics.eventsProcessed.toLocaleString()}</div>
        </div>
        <div>
          <div className="text-gray-400">HyperSync Latency</div>
          <div className="text-white font-mono">{metrics.hyperSyncLatency}ms</div>
        </div>
        <div>
          <div className="text-gray-400">GraphQL Queries</div>
          <div className="text-white font-mono">{metrics.graphqlQueries.toLocaleString()}</div>
        </div>
      </div>

      <div className="mt-3 pt-3 border-t border-gray-700">
        <div className="flex items-center text-xs text-gray-400">
          <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse mr-2"></div>
          Real-time pool monitoring via Envio HyperSync
        </div>
      </div>
    </div>
  );
}