import { useState, useEffect } from 'react';

interface HyperIndexData {
  pools: any[];
  swaps: any[];
  status: {
    connected: boolean;
    latestBlock: number;
    lastUpdate: string | null;
  };
}

export function useHyperIndex() {
  const [data, setData] = useState<HyperIndexData>({
    pools: [],
    swaps: [],
    status: { connected: false, latestBlock: 0, lastUpdate: null }
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [poolsRes, swapsRes, statusRes] = await Promise.all([
          fetch('http://localhost:3002/api/hyperindex/pools'),
          fetch('http://localhost:3002/api/hyperindex/swaps?limit=10'),
          fetch('http://localhost:3002/api/hyperindex/status')
        ]);

        const [pools, swaps, status] = await Promise.all([
          poolsRes.json(),
          swapsRes.json(),
          statusRes.json()
        ]);

        setData({
          pools: pools.success ? pools.data : [],
          swaps: swaps.success ? swaps.data : [],
          status: {
            connected: status.success && status.status === 'connected',
            latestBlock: status.latestBlock || 0,
            lastUpdate: status.lastUpdate
          }
        });
      } catch (error) {
        console.error('HyperIndex fetch error:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
    const interval = setInterval(fetchData, 10000);
    return () => clearInterval(interval);
  }, []);

  return { data, loading };
}