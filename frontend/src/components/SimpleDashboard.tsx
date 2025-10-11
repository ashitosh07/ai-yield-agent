'use client';

import { useState, useEffect } from 'react';
import { useAccount } from 'wagmi';

export function SimpleDashboard() {
  const { address } = useAccount();
  const [pools, setPools] = useState([]);
  const [portfolio, setPortfolio] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [poolsRes, portfolioRes] = await Promise.all([
          fetch('http://localhost:3002/api/pools/real-time'),
          address ? fetch(`http://localhost:3002/api/pools/positions/${address}`) : null
        ]);

        if (poolsRes.ok) {
          const poolsData = await poolsRes.json();
          setPools(poolsData.data?.pools || []);
        }

        if (portfolioRes && portfolioRes.ok) {
          const portfolioData = await portfolioRes.json();
          setPortfolio(portfolioData.summary);
        }
      } catch (err) {
        console.error('Error fetching data:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [address]);

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="glass p-8 rounded-xl">
          <div className="flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
            <span className="text-white ml-3">Loading dashboard...</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
            AI Yield Dashboard
          </h1>
          <p className="text-gray-400 mt-1">DeFi portfolio optimization powered by AI</p>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="glass p-6 rounded-xl border border-blue-500/30">
          <div className="flex items-center justify-between">
            <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-blue-600 rounded-lg flex items-center justify-center">
              <span className="text-white text-xl">💰</span>
            </div>
            <div className="text-right">
              <div className="text-gray-400 text-sm">Portfolio Value</div>
              <div className="text-white text-2xl font-bold">
                ${portfolio ? portfolio.totalValue.toLocaleString() : '8,500'}
              </div>
            </div>
          </div>
        </div>

        <div className="glass p-6 rounded-xl border border-green-500/30">
          <div className="flex items-center justify-between">
            <div className="w-12 h-12 bg-gradient-to-r from-green-500 to-green-600 rounded-lg flex items-center justify-center">
              <span className="text-white text-xl">📈</span>
            </div>
            <div className="text-right">
              <div className="text-gray-400 text-sm">Daily Earnings</div>
              <div className="text-white text-2xl font-bold">
                ${portfolio ? portfolio.totalDailyEarnings.toFixed(2) : '12.50'}
              </div>
            </div>
          </div>
        </div>

        <div className="glass p-6 rounded-xl border border-purple-500/30">
          <div className="flex items-center justify-between">
            <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-purple-600 rounded-lg flex items-center justify-center">
              <span className="text-white text-xl">🏦</span>
            </div>
            <div className="text-right">
              <div className="text-gray-400 text-sm">Active Pools</div>
              <div className="text-white text-2xl font-bold">{pools.length}</div>
            </div>
          </div>
        </div>

        <div className="glass p-6 rounded-xl border border-yellow-500/30">
          <div className="flex items-center justify-between">
            <div className="w-12 h-12 bg-gradient-to-r from-yellow-500 to-yellow-600 rounded-lg flex items-center justify-center">
              <span className="text-white text-xl">🤖</span>
            </div>
            <div className="text-right">
              <div className="text-gray-400 text-sm">AI Status</div>
              <div className="text-white text-2xl font-bold">Active</div>
            </div>
          </div>
        </div>
      </div>

      {/* Pool List */}
      <div className="glass p-6 rounded-xl">
        <h3 className="text-xl font-bold text-white mb-4">Available Pools</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {pools.map((pool, index) => (
            <div key={index} className="bg-white/5 p-4 rounded-lg border border-white/10">
              <div className="flex justify-between items-center mb-2">
                <h4 className="text-white font-semibold">{pool.name}</h4>
                <span className="text-green-400 font-bold">{pool.apy.toFixed(2)}%</span>
              </div>
              <div className="space-y-1 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-400">TVL:</span>
                  <span className="text-white">${pool.tvl.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">24h Volume:</span>
                  <span className="text-white">${pool.volume24h.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Risk Score:</span>
                  <span className={`${pool.riskScore < 0.3 ? 'text-green-400' : pool.riskScore < 0.6 ? 'text-yellow-400' : 'text-red-400'}`}>
                    {(pool.riskScore * 100).toFixed(0)}%
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* AI Recommendations */}
      <div className="glass p-6 rounded-xl border border-yellow-500/30">
        <h3 className="text-xl font-bold text-white mb-4">🤖 AI Recommendations</h3>
        <div className="bg-white/5 p-4 rounded-lg">
          <div className="flex items-center justify-between mb-3">
            <div>
              <div className="text-white font-medium">USDC/ETH → DAI/USDC</div>
              <div className="text-gray-400 text-sm">Rebalance 1.5 ETH</div>
            </div>
            <div className="text-right">
              <div className="text-green-400 font-bold">+3.2% APY</div>
              <div className="text-gray-400 text-sm">85% confidence</div>
            </div>
          </div>
          <div className="text-gray-300 text-sm mb-3">
            Higher APY with lower risk profile. Market conditions favorable for stable pairs.
          </div>
          <div className="flex space-x-2">
            <button className="px-3 py-1 bg-green-500/20 border border-green-500/50 text-green-400 rounded text-sm">
              Execute
            </button>
            <button className="px-3 py-1 bg-gray-500/20 border border-gray-500/50 text-gray-400 rounded text-sm">
              Dismiss
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}