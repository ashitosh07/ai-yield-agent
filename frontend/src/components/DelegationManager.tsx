'use client';

import { useState, useEffect } from 'react';
import { useAccount, useWriteContract, useWaitForTransactionReceipt } from 'wagmi';

interface Delegation {
  id: string;
  delegateAddress: string;
  maxAmount: string;
  expiry: string;
  allowedPools: string[];
  status: 'active' | 'expired' | 'revoked';
  createdAt: string;
  usedAmount: string;
  transactionCount: number;
}

interface Pool {
  address: string;
  name: string;
  apy: number;
  riskScore: number;
}

export function DelegationManager() {
  const { address } = useAccount();
  const { writeContract, data: hash, isPending } = useWriteContract();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash });

  const [delegations, setDelegations] = useState<Delegation[]>([]);
  const [pools, setPools] = useState<Pool[]>([]);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [loading, setLoading] = useState(true);

  // Form state
  const [formData, setFormData] = useState({
    maxAmount: '',
    expiry: '',
    selectedPools: [] as string[],
    riskTolerance: 'medium'
  });

  useEffect(() => {
    if (address) {
      fetchDelegations();
      fetchPools();
    }
  }, [address]);

  useEffect(() => {
    if (isSuccess) {
      setShowCreateForm(false);
      setFormData({
        maxAmount: '',
        expiry: '',
        selectedPools: [],
        riskTolerance: 'medium'
      });
      fetchDelegations();
    }
  }, [isSuccess]);

  const fetchDelegations = async () => {
    try {
      const response = await fetch(`http://localhost:3002/api/delegations/${address}`);
      const data = await response.json();
      
      if (data.success) {
        setDelegations(data.data);
      }
    } catch (error) {
      console.error('Error fetching delegations:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchPools = async () => {
    try {
      const response = await fetch('http://localhost:3002/api/pools');
      const data = await response.json();
      
      if (data.success) {
        setPools(data.data);
      }
    } catch (error) {
      console.error('Error fetching pools:', error);
    }
  };

  const handleCreateDelegation = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.maxAmount || !formData.expiry || formData.selectedPools.length === 0) {
      alert('Please fill in all required fields');
      return;
    }

    try {
      // First create delegation metadata in backend
      const delegationData = {
        userAddress: address,
        maxAmount: formData.maxAmount,
        expiry: formData.expiry,
        allowedPools: formData.selectedPools,
        riskTolerance: formData.riskTolerance
      };

      const response = await fetch('http://localhost:3002/api/delegations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(delegationData)
      });

      const result = await response.json();
      
      if (result.success) {
        // Execute on-chain delegation creation
        // This would use the actual delegation toolkit in production
        console.log('Delegation created:', result.data);
        
        // For demo, we'll simulate the transaction
        setTimeout(() => {
          fetchDelegations();
          setShowCreateForm(false);
        }, 2000);
      }
    } catch (error) {
      console.error('Error creating delegation:', error);
      alert('Failed to create delegation');
    }
  };

  const handleRevokeDelegation = async (delegationId: string) => {
    try {
      const response = await fetch(`http://localhost:3002/api/delegations/${delegationId}/revoke`, {
        method: 'POST'
      });

      const result = await response.json();
      
      if (result.success) {
        fetchDelegations();
      }
    } catch (error) {
      console.error('Error revoking delegation:', error);
    }
  };

  const handlePoolSelection = (poolAddress: string) => {
    setFormData(prev => ({
      ...prev,
      selectedPools: prev.selectedPools.includes(poolAddress)
        ? prev.selectedPools.filter(p => p !== poolAddress)
        : [...prev.selectedPools, poolAddress]
    }));
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'text-green-400 bg-green-900/30 border-green-500';
      case 'expired': return 'text-yellow-400 bg-yellow-900/30 border-yellow-500';
      case 'revoked': return 'text-red-400 bg-red-900/30 border-red-500';
      default: return 'text-gray-400 bg-gray-900/30 border-gray-500';
    }
  };

  const getRiskColor = (score: number) => {
    if (score < 0.3) return 'text-green-400';
    if (score < 0.6) return 'text-yellow-400';
    return 'text-red-400';
  };

  const calculateDaysUntilExpiry = (expiry: string) => {
    const expiryDate = new Date(expiry);
    const now = new Date();
    const diffTime = expiryDate.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
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
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-white">Delegation Management</h2>
          <p className="text-gray-400 mt-1">Manage AI agent permissions and constraints</p>
        </div>
        <button
          onClick={() => setShowCreateForm(true)}
          className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white px-6 py-3 rounded-lg font-semibold transition-all"
        >
          + Create Delegation
        </button>
      </div>

      {/* Create Delegation Form */}
      {showCreateForm && (
        <div className="glass rounded-xl p-6">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-xl font-semibold text-white">Create New Delegation</h3>
            <button
              onClick={() => setShowCreateForm(false)}
              className="text-gray-400 hover:text-white"
            >
              ✕
            </button>
          </div>

          <form onSubmit={handleCreateDelegation} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Max Amount */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Maximum Amount (ETH)
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={formData.maxAmount}
                  onChange={(e) => setFormData(prev => ({ ...prev, maxAmount: e.target.value }))}
                  className="w-full bg-gray-800 border border-gray-600 rounded-lg px-4 py-3 text-white focus:border-blue-500 focus:outline-none"
                  placeholder="2.5"
                  required
                />
              </div>

              {/* Expiry */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Expiry Date
                </label>
                <input
                  type="datetime-local"
                  value={formData.expiry}
                  onChange={(e) => setFormData(prev => ({ ...prev, expiry: e.target.value }))}
                  className="w-full bg-gray-800 border border-gray-600 rounded-lg px-4 py-3 text-white focus:border-blue-500 focus:outline-none"
                  min={new Date().toISOString().slice(0, 16)}
                  required
                />
              </div>
            </div>

            {/* Risk Tolerance */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Risk Tolerance
              </label>
              <select
                value={formData.riskTolerance}
                onChange={(e) => setFormData(prev => ({ ...prev, riskTolerance: e.target.value }))}
                className="w-full bg-gray-800 border border-gray-600 rounded-lg px-4 py-3 text-white focus:border-blue-500 focus:outline-none"
              >
                <option value="low">Low Risk (Conservative)</option>
                <option value="medium">Medium Risk (Balanced)</option>
                <option value="high">High Risk (Aggressive)</option>
              </select>
            </div>

            {/* Pool Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Allowed Pools ({formData.selectedPools.length} selected)
              </label>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {pools.map((pool) => (
                  <div
                    key={pool.address}
                    onClick={() => handlePoolSelection(pool.address)}
                    className={`p-4 rounded-lg border cursor-pointer transition-all ${
                      formData.selectedPools.includes(pool.address)
                        ? 'border-blue-500 bg-blue-900/30'
                        : 'border-gray-600 bg-gray-800/50 hover:border-gray-500'
                    }`}
                  >
                    <div className="flex justify-between items-start mb-2">
                      <div className="text-white font-semibold">{pool.name}</div>
                      <div className={`text-sm ${getRiskColor(pool.riskScore)}`}>
                        {pool.riskScore < 0.3 ? 'Low' : pool.riskScore < 0.6 ? 'Med' : 'High'}
                      </div>
                    </div>
                    <div className="text-green-400 font-medium">{pool.apy.toFixed(1)}% APY</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Submit Button */}
            <div className="flex justify-end space-x-4">
              <button
                type="button"
                onClick={() => setShowCreateForm(false)}
                className="px-6 py-3 border border-gray-600 text-gray-300 rounded-lg hover:bg-gray-800 transition-all"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isPending || isConfirming}
                className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white px-6 py-3 rounded-lg font-semibold transition-all disabled:opacity-50"
              >
                {isPending || isConfirming ? 'Creating...' : 'Create Delegation'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Active Delegations */}
      <div className="glass rounded-xl p-6">
        <h3 className="text-xl font-semibold text-white mb-4">Active Delegations</h3>
        
        {delegations.length > 0 ? (
          <div className="space-y-4">
            {delegations.map((delegation) => (
              <div key={delegation.id} className="bg-gray-800/50 rounded-lg p-6">
                <div className="flex justify-between items-start mb-4">
                  <div className="flex items-center space-x-3">
                    <div className={`px-3 py-1 rounded-full text-sm border ${getStatusColor(delegation.status)}`}>
                      {delegation.status.toUpperCase()}
                    </div>
                    <div className="text-gray-400 text-sm">
                      Created {new Date(delegation.createdAt).toLocaleDateString()}
                    </div>
                  </div>
                  
                  {delegation.status === 'active' && (
                    <button
                      onClick={() => handleRevokeDelegation(delegation.id)}
                      className="text-red-400 hover:text-red-300 text-sm"
                    >
                      Revoke
                    </button>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
                  <div>
                    <div className="text-gray-400 text-sm">Max Amount</div>
                    <div className="text-white font-semibold">{delegation.maxAmount} ETH</div>
                  </div>
                  <div>
                    <div className="text-gray-400 text-sm">Used Amount</div>
                    <div className="text-white font-semibold">{delegation.usedAmount} ETH</div>
                  </div>
                  <div>
                    <div className="text-gray-400 text-sm">Transactions</div>
                    <div className="text-white font-semibold">{delegation.transactionCount}</div>
                  </div>
                  <div>
                    <div className="text-gray-400 text-sm">Expires In</div>
                    <div className="text-white font-semibold">
                      {calculateDaysUntilExpiry(delegation.expiry)} days
                    </div>
                  </div>
                </div>

                <div>
                  <div className="text-gray-400 text-sm mb-2">Allowed Pools ({delegation.allowedPools.length})</div>
                  <div className="flex flex-wrap gap-2">
                    {delegation.allowedPools.map((poolAddress) => {
                      const pool = pools.find(p => p.address === poolAddress);
                      return (
                        <div key={poolAddress} className="bg-gray-700 px-3 py-1 rounded-full text-sm text-white">
                          {pool?.name || `${poolAddress.slice(0, 6)}...`}
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <div className="text-6xl mb-4">🔐</div>
            <div className="text-xl text-white mb-2">No Delegations Yet</div>
            <div className="text-gray-400 mb-6">
              Create your first delegation to enable AI-powered yield optimization
            </div>
            <button
              onClick={() => setShowCreateForm(true)}
              className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white px-6 py-3 rounded-lg font-semibold transition-all"
            >
              Create Delegation
            </button>
          </div>
        )}
      </div>

      {/* Delegation Info */}
      <div className="glass rounded-xl p-6">
        <h3 className="text-xl font-semibold text-white mb-4">How Delegations Work</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="text-center">
            <div className="text-3xl mb-3">🔒</div>
            <div className="text-white font-semibold mb-2">Scoped Permissions</div>
            <div className="text-gray-400 text-sm">
              AI can only operate within your defined constraints: amount limits, pool restrictions, and time windows.
            </div>
          </div>
          <div className="text-center">
            <div className="text-3xl mb-3">🤖</div>
            <div className="text-white font-semibold mb-2">AI Decision Making</div>
            <div className="text-gray-400 text-sm">
              Advanced algorithms analyze yield opportunities and execute optimal rebalances automatically.
            </div>
          </div>
          <div className="text-center">
            <div className="text-3xl mb-3">📊</div>
            <div className="text-white font-semibold mb-2">Full Transparency</div>
            <div className="text-gray-400 text-sm">
              Every action is logged with rationale, confidence scores, and complete audit trails.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}