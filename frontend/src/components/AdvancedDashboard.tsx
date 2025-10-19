'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { Line, Bar, Doughnut } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler
} from 'chart.js';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

interface PoolData {
  address: string;
  name: string;
  apy: number;
  tvl: number;
  volume24h: number;
  fees24h: number;
  riskScore: number;
  healthScore: number;
  isActive: boolean;
}

interface PortfolioSummary {
  totalValue: number;
  totalDailyEarnings: number;
  avgAPY: number;
  positionCount: number;
}

interface MarketAnalytics {
  totalTVL: number;
  avgAPY: number;
  totalVolume24h: number;
  totalFees24h: number;
  poolCount: number;
  avgHealthScore: number;
  healthyPools: number;
}

interface AIRecommendation {
  from_pool: string;
  to_pool: string;
  amount: number;
  confidence: number;
  expected_gain: number;
  risk_assessment: number;
  rationale: string;
  execution_priority: number;
}

export function AdvancedDashboard() {
  const address = '0x742d35Cc6634C0532925a3b8D4C9db4C8b9b8b8b';
  const [pools, setPools] = useState<PoolData[]>([]);
  const [portfolio, setPortfolio] = useState<PortfolioSummary | null>(null);
  const [analytics, setAnalytics] = useState<MarketAnalytics | null>(null);
  const [recommendations, setRecommendations] = useState<AIRecommendation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedTimeframe, setSelectedTimeframe] = useState('24h');
  const [realTimeData, setRealTimeData] = useState<any[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const wsRef = useRef<WebSocket | null>(null);

  const fetchDashboardData = useCallback(async () => {
    try {
      const [poolsRes, analyticsRes, portfolioRes] = await Promise.all([
        fetch('http://localhost:3002/api/pools/real-time'),
        fetch('http://localhost:3002/api/pools/analytics'),
        address ? fetch(`http://localhost:3002/api/pools/positions/${address}`) : null
      ]);

      if (poolsRes.ok) {
        const poolsData = await poolsRes.json();
        setPools(poolsData.data || []);
      }

      if (analyticsRes.ok) {
        const analyticsData = await analyticsRes.json();
        setAnalytics(analyticsData.data || null);
      }

      if (portfolioRes && portfolioRes.ok) {
        const portfolioData = await portfolioRes.json();
        setPortfolio({
          totalValue: portfolioData.totalValue || 0,
          totalDailyEarnings: portfolioData.totalDailyEarnings || 0,
          avgAPY: portfolioData.data?.reduce((sum: number, pos: any) => sum + pos.apy, 0) / (portfolioData.data?.length || 1) || 0,
          positionCount: portfolioData.data?.length || 0
        });
      }

      setError(null);
    } catch (err) {
      console.error('Error fetching dashboard data:', err);
      setError(err instanceof Error ? err.message : 'Unknown error');
    }
  }, [address]);

  const fetchAIRecommendations = useCallback(async () => {
    if (!address) return;

    try {
      const response = await fetch('http://localhost:3003/recommendations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userAddress: address,
          riskTolerance: 0.5
        })
      });

      if (response.ok) {
        const data = await response.json();
        setRecommendations(data.recommendations || []);
      }
    } catch (err) {
      console.error('Error fetching AI recommendations:', err);
    }
  }, [address]);

  const setupWebSocket = useCallback(() => {
    // Try to establish real WebSocket connection
    try {
      const ws = new WebSocket('ws://localhost:3002/ws');
      
      ws.onopen = () => {
        setIsConnected(true);
        console.log('WebSocket connected');
      };
      
      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          if (data.type === 'real_time_event') {
            setRealTimeData(prev => [data, ...prev.slice(0, 9)]);
          }
        } catch (err) {
          console.error('WebSocket message parse error:', err);
        }
      };
      
      ws.onclose = () => {
        setIsConnected(false);
        console.log('WebSocket disconnected');
      };
      
      ws.onerror = () => {
        setIsConnected(false);
        console.log('WebSocket error');
      };
      
      return () => {
        ws.close();
      };
    } catch (error) {
      setIsConnected(false);
      console.error('WebSocket connection failed:', error);
      return () => {};
    }
  }, []);

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      await Promise.all([
        fetchDashboardData(),
        fetchAIRecommendations()
      ]);
      setLoading(false);
    };

    loadData();
    const cleanup = setupWebSocket();

    // Set up periodic updates
    const interval = setInterval(() => {
      fetchDashboardData();
      fetchAIRecommendations();
    }, 30000); // Update every 30 seconds

    return () => {
      clearInterval(interval);
      if (cleanup) cleanup();
      if (wsRef.current) {
        wsRef.current.close();
      }
    };
  }, [fetchDashboardData, fetchAIRecommendations, setupWebSocket]);

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

  // Chart configurations
  const apyChartData = {
    labels: pools.map(p => p.name),
    datasets: [{
      label: 'APY (%)',
      data: pools.map(p => p.apy),
      backgroundColor: 'rgba(16, 185, 129, 0.6)',
      borderColor: 'rgba(16, 185, 129, 1)',
      borderWidth: 2,
      borderRadius: 4,
    }]
  };

  const riskDistributionData = {
    labels: ['Low Risk', 'Medium Risk', 'High Risk'],
    datasets: [{
      data: [
        pools.filter(p => p.riskScore < 0.3).length,
        pools.filter(p => p.riskScore >= 0.3 && p.riskScore < 0.6).length,
        pools.filter(p => p.riskScore >= 0.6).length
      ],
      backgroundColor: [
        'rgba(16, 185, 129, 0.8)',
        'rgba(245, 158, 11, 0.8)',
        'rgba(239, 68, 68, 0.8)'
      ],
      borderWidth: 0
    }]
  };

  const tvlChartData = {
    labels: pools.map(p => p.name),
    datasets: [{
      label: 'TVL (USD)',
      data: pools.map(p => p.tvl),
      backgroundColor: 'rgba(59, 130, 246, 0.6)',
      borderColor: 'rgba(59, 130, 246, 1)',
      borderWidth: 1,
      fill: true,
    }]
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        labels: {
          color: '#ffffff'
        }
      }
    },
    scales: {
      x: {
        ticks: { color: '#9ca3af' },
        grid: { color: 'rgba(255, 255, 255, 0.1)' }
      },
      y: {
        ticks: { color: '#9ca3af' },
        grid: { color: 'rgba(255, 255, 255, 0.1)' }
      }
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="glass p-8 rounded-xl">
          <div className="flex items-center justify-center space-x-3">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
            <span className="text-white text-lg">Loading advanced dashboard...</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with Real-time Status */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
            Advanced Dashboard
          </h1>
          <p className="text-gray-400 mt-1">Real-time DeFi portfolio optimization powered by AI</p>
        </div>
        
        <div className="flex items-center space-x-4">
          <div className={`flex items-center space-x-2 px-4 py-2 rounded-lg ${
            isConnected ? 'bg-green-500/20 border border-green-500/50' : 'bg-red-500/20 border border-red-500/50'
          }`}>
            <div className={`w-3 h-3 rounded-full ${isConnected ? 'bg-green-400' : 'bg-red-400'} ${
              isConnected ? 'animate-pulse' : ''
            }`}></div>
            <span className={`text-sm font-medium ${isConnected ? 'text-green-400' : 'text-red-400'}`}>
              {isConnected ? 'LIVE DATA' : 'OFFLINE'}
            </span>
          </div>
          
          <select
            value={selectedTimeframe}
            onChange={(e) => setSelectedTimeframe(e.target.value)}
            className="bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-white text-sm"
          >
            <option value="1h">1 Hour</option>
            <option value="24h">24 Hours</option>
            <option value="7d">7 Days</option>
            <option value="30d">30 Days</option>
          </select>
        </div>
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

      {/* Key Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Portfolio Value */}
        <div className="glass p-6 rounded-xl border border-blue-500/30">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-blue-600 rounded-lg flex items-center justify-center">
              <span className="text-white text-xl">💰</span>
            </div>
            <div className="text-right">
              <div className="text-gray-400 text-sm">Portfolio Value</div>
              <div className="text-white text-2xl font-bold">
                {portfolio ? formatCurrency(portfolio.totalValue) : '$0'}
              </div>
              <div className="text-green-400 text-sm">+2.3% today</div>
            </div>
          </div>
        </div>

        {/* Daily Earnings */}
        <div className="glass p-6 rounded-xl border border-green-500/30">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-gradient-to-r from-green-500 to-green-600 rounded-lg flex items-center justify-center">
              <span className="text-white text-xl">📈</span>
            </div>
            <div className="text-right">
              <div className="text-gray-400 text-sm">Daily Earnings</div>
              <div className="text-white text-2xl font-bold">
                {portfolio ? formatCurrency(portfolio.totalDailyEarnings) : '$0'}
              </div>
              <div className="text-green-400 text-sm">
                {portfolio ? `${portfolio.avgAPY.toFixed(2)}% APY` : '0% APY'}
              </div>
            </div>
          </div>
        </div>

        {/* Market TVL */}
        <div className="glass p-6 rounded-xl border border-purple-500/30">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-purple-600 rounded-lg flex items-center justify-center">
              <span className="text-white text-xl">🏦</span>
            </div>
            <div className="text-right">
              <div className="text-gray-400 text-sm">Total Market TVL</div>
              <div className="text-white text-2xl font-bold">
                {analytics ? formatCurrency(analytics.totalTVL) : '$0'}
              </div>
              <div className="text-blue-400 text-sm">
                {analytics ? `${analytics.poolCount} pools` : '0 pools'}
              </div>
            </div>
          </div>
        </div>

        {/* AI Recommendations */}
        <div className="glass p-6 rounded-xl border border-yellow-500/30">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-gradient-to-r from-yellow-500 to-yellow-600 rounded-lg flex items-center justify-center">
              <span className="text-white text-xl">🤖</span>
            </div>
            <div className="text-right">
              <div className="text-gray-400 text-sm">AI Recommendations</div>
              <div className="text-white text-2xl font-bold">{recommendations.length}</div>
              <div className="text-yellow-400 text-sm">
                {recommendations.length > 0 ? 'Action required' : 'All optimized'}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* APY Distribution Chart */}
        <div className="glass p-6 rounded-xl">
          <h3 className="text-xl font-bold text-white mb-4">Pool APY Distribution</h3>
          <div className="h-64">
            <Bar data={apyChartData} options={chartOptions} />
          </div>
        </div>

        {/* Risk Distribution Chart */}
        <div className="glass p-6 rounded-xl">
          <h3 className="text-xl font-bold text-white mb-4">Risk Distribution</h3>
          <div className="h-64">
            <Doughnut 
              data={riskDistributionData} 
              options={{
                ...chartOptions,
                plugins: {
                  ...chartOptions.plugins,
                  legend: {
                    position: 'bottom',
                    labels: { color: '#ffffff' }
                  }
                }
              }} 
            />
          </div>
        </div>
      </div>

      {/* TVL Trend Chart */}
      <div className="glass p-6 rounded-xl">
        <h3 className="text-xl font-bold text-white mb-4">Total Value Locked (TVL) by Pool</h3>
        <div className="h-80">
          <Line data={tvlChartData} options={chartOptions} />
        </div>
      </div>

      {/* AI Recommendations Panel */}
      {recommendations.length > 0 && (
        <div className="glass p-6 rounded-xl border border-yellow-500/30">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-bold text-white">🤖 AI Recommendations</h3>
            <div className="text-yellow-400 text-sm">
              Updated {new Date().toLocaleTimeString()}
            </div>
          </div>
          
          <div className="space-y-4">
            {recommendations.slice(0, 3).map((rec, index) => (
              <div key={index} className="bg-white/5 p-4 rounded-lg border border-yellow-500/20">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center space-x-3">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                      rec.execution_priority >= 8 ? 'bg-red-500' : 
                      rec.execution_priority >= 6 ? 'bg-yellow-500' : 'bg-green-500'
                    }`}>
                      {rec.execution_priority}
                    </div>
                    <div>
                      <div className="text-white font-medium">
                        {rec.from_pool} → {rec.to_pool}
                      </div>
                      <div className="text-gray-400 text-sm">
                        Amount: {Number(rec.amount).toFixed(3)} ETH
                      </div>
                    </div>
                  </div>
                  
                  <div className="text-right">
                    <div className="text-green-400 font-bold">
                      +{rec.expected_gain.toFixed(2)}% APY
                    </div>
                    <div className="text-gray-400 text-sm">
                      {Math.round(rec.confidence * 100)}% confidence
                    </div>
                  </div>
                </div>
                
                <div className="text-gray-300 text-sm mb-3">
                  {rec.rationale}
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4 text-xs text-gray-400">
                    <span>Risk: {(rec.risk_assessment * 100).toFixed(0)}%</span>
                    <span>Priority: {rec.execution_priority}/10</span>
                  </div>
                  
                  <div className="flex space-x-2">
                    <button className="px-3 py-1 bg-green-500/20 border border-green-500/50 text-green-400 rounded text-sm hover:bg-green-500/30 transition-colors">
                      Execute
                    </button>
                    <button className="px-3 py-1 bg-gray-500/20 border border-gray-500/50 text-gray-400 rounded text-sm hover:bg-gray-500/30 transition-colors">
                      Dismiss
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Real-time Activity Feed */}
      <div className="glass p-6 rounded-xl">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xl font-bold text-white">Real-time Activity</h3>
          <div className="flex items-center space-x-2">
            <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
            <span className="text-green-400 text-sm">Live</span>
          </div>
        </div>
        
        <div className="space-y-2 max-h-64 overflow-y-auto">
          {realTimeData.length > 0 ? (
            realTimeData.map((event, index) => (
              <div key={index} className="bg-white/5 p-3 rounded-lg border-l-4 border-blue-500">
                <div className="flex justify-between items-center">
                  <div className="flex items-center space-x-2">
                    <span className="text-blue-400 font-medium">{event.type}</span>
                    <span className="text-gray-400 text-sm">
                      Block {formatNumber(event.blockNumber)}
                    </span>
                  </div>
                  <div className="text-gray-400 text-xs">
                    {new Date(event.timestamp * 1000).toLocaleTimeString()}
                  </div>
                </div>
                <div className="text-gray-300 text-sm mt-1 font-mono">
                  {event.address?.slice(0, 20)}...
                </div>
              </div>
            ))
          ) : (
            <div className="text-gray-400 text-center py-8">
              <div className="animate-pulse">Waiting for real-time events...</div>
            </div>
          )}
        </div>
      </div>

      {/* Market Overview */}
      {analytics && (
        <div className="glass p-6 rounded-xl">
          <h3 className="text-xl font-bold text-white mb-4">Market Overview</h3>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-gray-400 text-sm">Avg APY</div>
              <div className="text-white text-xl font-bold">{analytics.averageAPY?.toFixed(2) || '0.00'}%</div>
            </div>
            <div className="text-center">
              <div className="text-gray-400 text-sm">24h Volume</div>
              <div className="text-white text-xl font-bold">{formatCurrency(analytics.totalVolume24h || 0)}</div>
            </div>
            <div className="text-center">
              <div className="text-gray-400 text-sm">Top Performers</div>
              <div className="text-white text-xl font-bold">{analytics.topPerformers?.length || 0}</div>
            </div>
            <div className="text-center">
              <div className="text-gray-400 text-sm">Risk Distribution</div>
              <div className="text-white text-xl font-bold">{analytics.riskDistribution?.low || 0}L/{analytics.riskDistribution?.medium || 0}M/{analytics.riskDistribution?.high || 0}H</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}