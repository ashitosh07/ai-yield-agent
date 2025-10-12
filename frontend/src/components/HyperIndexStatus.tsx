'use client';

import { useState, useEffect } from 'react';

export function HyperIndexStatus() {
  const [status, setStatus] = useState({
    connected: false,
    latestBlock: 0,
    eventsProcessed: 0,
    lastUpdate: null
  });

  useEffect(() => {
    const fetchStatus = async () => {
      try {
        const response = await fetch('http://localhost:3002/api/hyperindex/status');
        const data = await response.json();
        
        if (data.success) {
          setStatus({
            connected: data.status === 'connected',
            latestBlock: data.latestBlock,
            eventsProcessed: data.eventsProcessed || 0,
            lastUpdate: data.lastUpdate
          });
        }
      } catch (error) {
        setStatus(prev => ({ ...prev, connected: false }));
      }
    };

    fetchStatus();
    const interval = setInterval(fetchStatus, 5000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="bg-gray-800/50 p-4 rounded-lg">
      <div className="flex items-center justify-between mb-3">
        <h4 className="text-white font-semibold">🔥 HyperIndex Status</h4>
        <div className={`w-3 h-3 rounded-full ${status.connected ? 'bg-green-400' : 'bg-red-400'}`}></div>
      </div>
      
      <div className="grid grid-cols-2 gap-4 text-sm">
        <div>
          <div className="text-gray-400">Latest Block</div>
          <div className="text-white font-mono">{status.latestBlock.toLocaleString()}</div>
        </div>
        <div>
          <div className="text-gray-400">Events</div>
          <div className="text-white font-mono">{status.eventsProcessed}</div>
        </div>
      </div>
      
      {status.lastUpdate && (
        <div className="mt-2 text-xs text-gray-400">
          Last update: {new Date(status.lastUpdate).toLocaleTimeString()}
        </div>
      )}
    </div>
  );
}