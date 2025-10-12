'use client';

import { useState, useEffect } from 'react';
import { EnvioStatus } from './EnvioStatus';

interface Pool {
  address: string;
  name: string;
  apy: number;
  tvl: number;
  volume24h: number;
  riskScore: number;
}

interface UserPosition {
  poolAddress: string;
  poolName: string;
  balance: string;
  value: number;
  apy: number;
  dailyEarnings: number;
}

interface PortfolioMetrics {
  totalValue: number;
  weightedApy: number;
  portfolioRisk: number;
  diversificationScore: number;
  dailyEarnings: number;
}

interface Recommendation {
  type: string;
  priority: string;
  title: string;
  description: string;
  confidence: number;
}

export function YieldDashboard() {
  const realContracts = [
    '0x642672169398C3281A14D063626371eFC30CeF3F',
    '0x8f5f1F5a93Be3C57f53f85B705f179F936dcDCea'
  ];
  const address = '0x742d35Cc6634C0532925a3b8D4C9db4C8b9b8b8b';
  const [pools, setPools] = useState<Pool[]>([]);
  const [positions, setPositions] = useState<UserPosition[]>([]);
  const [metrics, setMetrics] = useState<PortfolioMetrics | null>(null);
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const [loading, setLoading] = useState(true);
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());

  useEffect(() => {
    if (address) {
      fetchDashboardData();
      const interval = setInterval(fetchDashboardData, 30000); // Update every 30 seconds
      return () => clearInterval(interval);
    }
  }, [address]);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      
      // Fetch pools data
      const poolsResponse = await fetch('http://localhost:3002/api/pools');
      const poolsData = await poolsResponse.json();
      
      if (poolsData.success) {
        setPools(poolsData.data);
      }

      // Fetch user positions
      const positionsResponse = await fetch(`http://localhost:3002/api/pools/positions/${address}`);
      const positionsData = await positionsResponse.json();
      
      if (positionsData.success) {
        setPositions(positionsData.data);
        
        // Calculate portfolio metrics
        const metricsData: PortfolioMetrics = {
          totalValue: positionsData.totalValue,
          weightedApy: calculateWeightedAPY(positionsData.data),
          portfolioRisk: calculatePortfolioRisk(positionsData.data, poolsData.data),
          diversificationScore: calculateDiversification(positionsData.data),
          dailyEarnings: positionsData.totalDailyEarnings
        };
        setMetrics(metricsData);
        
        // Generate recommendations
        generateRecommendations(poolsData.data, positionsData.data, metricsData);
      }
      
      setLastUpdate(new Date());
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const calculateWeightedAPY = (positions: UserPosition[]): number => {
    const totalValue = positions.reduce((sum, pos) => sum + pos.value, 0);
    if (totalValue === 0) return 0;
    
    return positions.reduce((sum, pos) => sum + (pos.value / totalValue) * pos.apy, 0);
  };

  const calculatePortfolioRisk = (positions: UserPosition[], pools: Pool[]): number => {
    const totalValue = positions.reduce((sum, pos) => sum + pos.value, 0);
    if (totalValue === 0) return 0;
    
    const poolMap = pools.reduce((map, pool) => {
      map[pool.address] = pool;
      return map;
    }, {} as Record<string, Pool>);
    
    return positions.reduce((sum, pos) => {
      const pool = poolMap[pos.poolAddress];
      return sum + (pos.value / totalValue) * (pool?.riskScore || 0);
    }, 0);
  };

  const calculateDiversification = (positions: UserPosition[]): number => {
    const totalValue = positions.reduce((sum, pos) => sum + pos.value, 0);
    if (totalValue === 0) return 0;
    
    const weights = positions.map(pos => pos.value / totalValue);
    const herfindahl = weights.reduce((sum, w) => sum + w * w, 0);
    return 1 - herfindahl;
  };

  const generateRecommendations = (pools: Pool[], positions: UserPosition[], metrics: PortfolioMetrics) => {
    const recs: Recommendation[] = [];
    
    // Risk warning
    if (metrics.portfolioRisk > 0.6) {
      recs.push({
        type: 'risk_warning',
        priority: 'high',
        title: 'High Portfolio Risk',
        description: `Risk score: ${metrics.portfolioRisk.toFixed(2)}. Consider rebalancing to lower-risk pools.`,
        confidence: 0.9
      });
    }
    
    // Diversification
    if (metrics.diversificationScore < 0.3) {
      recs.push({
        type: 'diversification',
        priority: 'medium',
        title: 'Improve Diversification',
        description: `Diversification score: ${metrics.diversificationScore.toFixed(2)}. Spread across more pools.`,
        confidence: 0.8
      });
    }
    
    // Yield opportunities
    const highYieldPools = pools.filter(p => p.apy > metrics.weightedApy + 2 && p.riskScore < 0.5);
    if (highYieldPools.length > 0) {
      const bestPool = highYieldPools.reduce((best, pool) => 
        pool.apy - pool.riskScore * 10 > best.apy - best.riskScore * 10 ? pool : best
      );
      
      recs.push({
        type: 'yield_opportunity',
        priority: 'medium',
        title: 'Higher Yield Available',
        description: `${bestPool.name}: ${bestPool.apy.toFixed(1)}% APY vs current ${metrics.weightedApy.toFixed(1)}%`,
        confidence: 0.75
      });
    }
    
    setRecommendations(recs.sort((a, b) => b.confidence - a.confidence));
  };

  const getRiskColor = (score: number) => {
    if (score < 0.3) return 'text-green-400';
    if (score < 0.6) return 'text-yellow-400';
    return 'text-red-400';
  };

  const getRiskLabel = (score: number) => {
    if (score < 0.3) return 'Low';
    if (score < 0.6) return 'Medium';
    return 'High';
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'border-red-500 bg-red-900/30';
      case 'medium': return 'border-yellow-500 bg-yellow-900/30';
      default: return 'border-blue-500 bg-blue-900/30';
    }
  };

  if (loading && !metrics) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Real-time Status */}
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-white">Portfolio Dashboard</h2>
        <div className="flex items-center space-x-4">
          <EnvioStatus />
          <div className="flex items-center space-x-2">
            <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
            <span className="text-sm text-gray-400">Live Data</span>
          </div>
          <span className="text-xs text-gray-500">
            Updated: {lastUpdate.toLocaleTimeString()}
          </span>
        </div>
      </div>

      {/* Portfolio Overview */}
      <div className="glass rounded-xl p-6">
        <h3 className="text-xl font-semibold text-white mb-4">Portfolio Overview</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          <div className="bg-gray-800/50 p-4 rounded-lg">
            <div className="text-gray-400 text-sm">Total Value</div>
            <div className="text-2xl font-bold text-white">
              ${metrics?.totalValue.toLocaleString() || '0'}
            </div>
          </div>
          <div className="bg-gray-800/50 p-4 rounded-lg">
            <div className="text-gray-400 text-sm">Weighted APY</div>
            <div className="text-2xl font-bold text-green-400">
              {metrics?.weightedApy.toFixed(1) || '0'}%
            </div>
          </div>
          <div className="bg-gray-800/50 p-4 rounded-lg">
            <div className="text-gray-400 text-sm">Portfolio Risk</div>
            <div className={`text-2xl font-bold ${getRiskColor(metrics?.portfolioRisk || 0)}`}>
              {getRiskLabel(metrics?.portfolioRisk || 0)}
            </div>
          </div>
          <div className="bg-gray-800/50 p-4 rounded-lg">
            <div className="text-gray-400 text-sm">Diversification</div>
            <div className="text-2xl font-bold text-blue-400">
              {((metrics?.diversificationScore || 0) * 100).toFixed(0)}%
            </div>
          </div>
          <div className="bg-gray-800/50 p-4 rounded-lg">
            <div className="text-gray-400 text-sm">Daily Earnings</div>
            <div className="text-2xl font-bold text-purple-400">
              ${metrics?.dailyEarnings.toFixed(2) || '0'}
            </div>
          </div>
        </div>
      </div>

      {/* Current Positions */}
      <div className="glass rounded-xl p-6">
        <h3 className="text-xl font-semibold text-white mb-4">Current Positions</h3>
        <div className="space-y-3">
          {positions.length > 0 ? positions.map((position, index) => (
            <div key={index} className="bg-gray-800/50 p-4 rounded-lg flex justify-between items-center">
              <div className="flex-1">
                <div className="flex items-center space-x-3">
                  <div className="text-white font-semibold">{position.poolName}</div>
                  <div className="text-green-400 font-medium">{position.apy.toFixed(1)}% APY</div>
                  <div className="text-purple-400 text-sm">
                    +${position.dailyEarnings.toFixed(2)}/day
                  </div>
                </div>
                <div className="text-gray-400 text-sm">
                  Balance: {position.balance} ETH
                </div>
              </div>
              <div className="text-right">
                <div className="text-white font-semibold">${position.value.toLocaleString()}</div>
                <div className="text-gray-400 text-sm">
                  {((position.value / (metrics?.totalValue || 1)) * 100).toFixed(1)}%
                </div>
              </div>
            </div>
          )) : (
            <div className="text-center py-8 text-gray-400">
              No positions found. Start by creating a delegation to begin yield optimization.
            </div>
          )}
        </div>
      </div>

      {/* Available Pools */}
      <div className="glass rounded-xl p-6">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-xl font-semibold text-white">Available Pools</h3>
          <div className="flex items-center text-sm text-gray-400">
            <span className="text-lg mr-1">⚡</span>
            Powered by Envio HyperIndex
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {pools.map((pool) => (
            <div key={pool.address} className="bg-gray-800/50 p-4 rounded-lg">
              <div className="flex justify-between items-start mb-2">
                <div className="text-white font-semibold">{pool.name}</div>
                <div className={`text-sm ${getRiskColor(pool.riskScore)}`}>
                  {getRiskLabel(pool.riskScore)}
                </div>
              </div>
              <div className="space-y-1">
                <div className="flex justify-between">
                  <span className="text-gray-400 text-sm">APY</span>
                  <span className="text-green-400 font-medium">{pool.apy.toFixed(1)}%</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400 text-sm">TVL</span>
                  <span className="text-white">${(pool.tvl / 1000000).toFixed(1)}M</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400 text-sm">24h Volume</span>
                  <span className="text-white">${(pool.volume24h / 1000).toFixed(0)}K</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* AI Recommendations */}
      <div className="glass rounded-xl p-6">
        <h3 className="text-xl font-semibold text-white mb-4">AI Recommendations</h3>
        <div className="space-y-3">
          {recommendations.length > 0 ? recommendations.map((rec, index) => (
            <div key={index} className={`p-4 rounded-lg border ${getPriorityColor(rec.priority)}`}>
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-semibold text-white">{rec.title}</div>
                  <div className="text-gray-300 text-sm mt-1">{rec.description}</div>
                </div>
                <div className="text-right">
                  <div className="text-sm text-gray-400">Confidence</div>
                  <div className="font-semibold text-white">
                    {(rec.confidence * 100).toFixed(0)}%
                  </div>
                </div>
              </div>
            </div>
          )) : (
            <div className="bg-green-900/30 border border-green-500 p-4 rounded-lg">
              <div className="text-green-400 font-semibold">Portfolio Optimized</div>
              <div className="text-gray-300 text-sm">
                Your current allocation is well-balanced for risk-adjusted returns.
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}