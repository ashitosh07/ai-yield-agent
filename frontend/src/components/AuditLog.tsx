'use client';

import { useState, useEffect } from 'react';

interface AuditEntry {
  id: string;
  action: string;
  details: any;
  txHash?: string;
  confidence?: number;
  status: 'success' | 'failed' | 'pending';
  timestamp: string;
  gasUsed?: string;
  gasPrice?: string;
  fromPool?: string;
  toPool?: string;
  amount?: string;
}

interface AuditLogProps {
  userAddress?: string;
}

export function AuditLog({ userAddress }: AuditLogProps = {}) {
  const address = userAddress || '0x742d35Cc6634C0532925a3b8D4C9db4C8b9b8b8b';
  const [auditEntries, setAuditEntries] = useState<AuditEntry[]>(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem(`audit_${address}`);
      return stored ? JSON.parse(stored) : [];
    }
    return [];
  });
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [sortBy, setSortBy] = useState('timestamp');

  useEffect(() => {
    if (address) {
      fetchAuditLog();
      const interval = setInterval(fetchAuditLog, 15000); // Update every 15 seconds
      return () => clearInterval(interval);
    }
  }, [address]);

  const fetchAuditLog = async () => {
    try {
      console.log('📋 Fetching real audit data for:', address);
      
      // First load from localStorage
      const stored = localStorage.getItem(`audit_${address}`);
      if (stored) {
        const localData = JSON.parse(stored);
        setAuditEntries(localData);
      }
      
      // Then try to fetch from API
      const response = await fetch(`http://localhost:3002/api/audit/${address}`);
      if (response.ok) {
        const data = await response.json();
        
        if (data.success && data.data.length > 0) {
          console.log('✅ Real audit data received:', data.data);
          setAuditEntries(data.data);
          localStorage.setItem(`audit_${address}`, JSON.stringify(data.data));
        } else {
          console.log('📋 No audit data from API, using local data');
        }
      } else {
        console.log('📋 API not available, using local data');
      }
    } catch (error) {
      console.log('📋 API error, using local data:', error.message);
    } finally {
      setLoading(false);
    }
  };
  
  const simulateAIAction = async () => {
    const newEntry: AuditEntry = {
      id: Date.now().toString(),
      action: 'analysis',
      details: {
        trigger: 'Manual simulation',
        poolsAnalyzed: 3,
        recommendation: 'Rebalance to WETH/USDT pool for +2.1% APY improvement',
        confidence: 0.89
      },
      confidence: 0.89,
      status: 'success',
      timestamp: new Date().toISOString()
    };
    
    const updatedEntries = [newEntry, ...auditEntries];
    setAuditEntries(updatedEntries);
    localStorage.setItem(`audit_${address}`, JSON.stringify(updatedEntries));
    
    // Also try to send to API
    try {
      await fetch('http://localhost:3002/api/audit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...newEntry,
          userAddress: address
        })
      });
    } catch (error) {
      console.log('Could not send to API:', error.message);
    }
  };

  // Add real audit entry function
  const addAuditEntry = (entry: Omit<AuditEntry, 'id' | 'timestamp'>) => {
    const newEntry: AuditEntry = {
      ...entry,
      id: Date.now().toString(),
      timestamp: new Date().toISOString()
    };
    
    const updatedEntries = [newEntry, ...auditEntries];
    setAuditEntries(updatedEntries);
    localStorage.setItem(`audit_${address}`, JSON.stringify(updatedEntries));
    
    return newEntry;
  };
  
  // Expose function globally for other components to use
  useEffect(() => {
    if (typeof window !== 'undefined') {
      (window as any).addAuditEntry = addAuditEntry;
    }
  }, [auditEntries, address]);

  const filteredEntries = auditEntries.filter(entry => {
    if (filter === 'all') return true;
    if (filter === 'rebalances') return entry.action === 'rebalance';
    if (filter === 'delegations') return entry.action.includes('delegation');
    if (filter === 'analysis') return entry.action === 'analysis';
    return true;
  });

  const sortedEntries = [...filteredEntries].sort((a, b) => {
    if (sortBy === 'timestamp') {
      return new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime();
    }
    if (sortBy === 'confidence') {
      return (b.confidence || 0) - (a.confidence || 0);
    }
    return 0;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'success': return 'text-green-400 bg-green-900/30';
      case 'failed': return 'text-red-400 bg-red-900/30';
      case 'pending': return 'text-yellow-400 bg-yellow-900/30';
      default: return 'text-gray-400 bg-gray-900/30';
    }
  };

  const getActionIcon = (action: string) => {
    switch (action) {
      case 'rebalance': return '🔄';
      case 'delegation_created': return '🔐';
      case 'delegation_revoked': return '🚫';
      case 'analysis': return '🧠';
      case 'user_rejection': return '❌';
      default: return '📝';
    }
  };

  const formatTimeAgo = (timestamp: string) => {
    const now = new Date();
    const time = new Date(timestamp);
    const diffInMinutes = Math.floor((now.getTime() - time.getTime()) / (1000 * 60));
    
    if (diffInMinutes < 1) return 'Just now';
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h ago`;
    return `${Math.floor(diffInMinutes / 1440)}d ago`;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header and Controls */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center space-y-4 md:space-y-0">
        <div>
          <h2 className="text-2xl font-bold text-white">Audit Log</h2>
          <p className="text-gray-400 mt-1">Real-time tracking of all delegation and AI actions</p>
        </div>
        
        <button
          onClick={simulateAIAction}
          className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg transition-colors"
        >
          🤖 Simulate AI Action
        </button>
        
        <div className="flex space-x-4">
          {/* Filter */}
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="bg-gray-800 border border-gray-600 rounded-lg px-4 py-2 text-white focus:border-blue-500 focus:outline-none"
          >
            <option value="all">All Actions</option>
            <option value="rebalances">Rebalances</option>
            <option value="delegations">Delegations</option>
            <option value="analysis">Analysis</option>
          </select>
          
          {/* Sort */}
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="bg-gray-800 border border-gray-600 rounded-lg px-4 py-2 text-white focus:border-blue-500 focus:outline-none"
          >
            <option value="timestamp">Latest First</option>
            <option value="confidence">Highest Confidence</option>
          </select>
        </div>
      </div>

      {/* Stats Summary */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="glass p-4 rounded-lg">
          <div className="text-gray-400 text-sm">Total Actions</div>
          <div className="text-2xl font-bold text-white">{auditEntries.length}</div>
        </div>
        <div className="glass p-4 rounded-lg">
          <div className="text-gray-400 text-sm">Successful</div>
          <div className="text-2xl font-bold text-green-400">
            {auditEntries.filter(e => e.status === 'success').length}
          </div>
        </div>
        <div className="glass p-4 rounded-lg">
          <div className="text-gray-400 text-sm">Rebalances</div>
          <div className="text-2xl font-bold text-blue-400">
            {auditEntries.filter(e => e.action === 'rebalance').length}
          </div>
        </div>
        <div className="glass p-4 rounded-lg">
          <div className="text-gray-400 text-sm">Avg Confidence</div>
          <div className="text-2xl font-bold text-purple-400">
            {(auditEntries
              .filter(e => e.confidence)
              .reduce((sum, e) => sum + (e.confidence || 0), 0) / 
              auditEntries.filter(e => e.confidence).length * 100
            ).toFixed(0)}%
          </div>
        </div>
      </div>

      {/* Audit Entries */}
      <div className="glass rounded-xl p-6">
        <div className="space-y-4">
          {sortedEntries.length > 0 ? sortedEntries.map((entry) => (
            <div key={entry.id} className="bg-gray-800/50 rounded-lg p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center space-x-3">
                  <div className="text-2xl">{getActionIcon(entry.action)}</div>
                  <div>
                    <div className="flex items-center space-x-2">
                      <div className="text-white font-semibold capitalize">
                        {entry.action.replace('_', ' ')}
                      </div>
                      <div className={`px-2 py-1 rounded-full text-xs ${getStatusColor(entry.status)}`}>
                        {entry.status.toUpperCase()}
                      </div>
                    </div>
                    <div className="text-gray-400 text-sm">
                      {formatTimeAgo(entry.timestamp)}
                    </div>
                  </div>
                </div>
                
                {entry.confidence && (
                  <div className="text-right">
                    <div className="text-gray-400 text-sm">Confidence</div>
                    <div className="text-white font-semibold">
                      {(entry.confidence * 100).toFixed(0)}%
                    </div>
                  </div>
                )}
              </div>

              {/* Action Details */}
              <div className="space-y-3">
                {entry.details.rationale && (
                  <div>
                    <div className="text-gray-400 text-sm">Rationale</div>
                    <div className="text-white">{entry.details.rationale}</div>
                  </div>
                )}

                {entry.fromPool && entry.toPool && (
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <div className="text-gray-400 text-sm">From Pool</div>
                      <div className="text-white">{entry.fromPool}</div>
                    </div>
                    <div>
                      <div className="text-gray-400 text-sm">To Pool</div>
                      <div className="text-white">{entry.toPool}</div>
                    </div>
                    <div>
                      <div className="text-gray-400 text-sm">Amount</div>
                      <div className="text-white">{entry.amount} ETH</div>
                    </div>
                  </div>
                )}

                {entry.txHash && (
                  <div className="flex items-center justify-between bg-gray-700/50 p-3 rounded">
                    <div>
                      <div className="text-gray-400 text-sm">Transaction Hash</div>
                      <div className="text-white font-mono text-sm">{entry.txHash}</div>
                    </div>
                    <a
                      href={`https://testnet.monadexplorer.com/tx/${entry.txHash}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-400 hover:text-blue-300 text-sm"
                    >
                      View on Explorer →
                    </a>
                  </div>
                )}

                {entry.gasUsed && (
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-gray-400">Gas Used: </span>
                      <span className="text-white">{entry.gasUsed} ETH</span>
                    </div>
                    <div>
                      <span className="text-gray-400">Gas Price: </span>
                      <span className="text-white">{entry.gasPrice} gwei</span>
                    </div>
                  </div>
                )}

                {/* Additional Details */}
                {Object.keys(entry.details).filter(key => 
                  !['rationale'].includes(key)
                ).map(key => (
                  <div key={key}>
                    <div className="text-gray-400 text-sm capitalize">{key.replace('_', ' ')}</div>
                    <div className="text-white">
                      {typeof entry.details[key] === 'object' 
                        ? JSON.stringify(entry.details[key], null, 2)
                        : entry.details[key]
                      }
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )) : (
            <div className="text-center py-12">
              <div className="text-6xl mb-4">📋</div>
              <div className="text-xl text-white mb-2">No Audit Entries Yet</div>
              <div className="text-gray-400 mb-4">
                Create delegations or simulate AI actions to see audit entries
              </div>
              <button
                onClick={simulateAIAction}
                className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg transition-colors"
              >
                🤖 Simulate AI Action
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}