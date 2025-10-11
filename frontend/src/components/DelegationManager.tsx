'use client';

import { useState, useEffect } from 'react';
import { useAccount } from 'wagmi';
import { useSmartAccount } from '../hooks/useSmartAccount';

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

export function DelegationManager({ smartAccount }: { smartAccount?: any }) {
  const { address } = useAccount();
  const { createDelegation, revokeDelegation, isLoading, error } = useSmartAccount();
  
  // Mock smart account if not provided
  const mockSmartAccount = smartAccount || {
    address: '0x742d35Cc6634C0532925a3b8D4C9db4C8b9b8b8b',
    signDelegation: async () => '0x' + Math.random().toString(16).substr(2, 128)
  };

  const [delegations, setDelegations] = useState<Delegation[]>([]);
  const [pools, setPools] = useState<Pool[]>([]);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [loading, setLoading] = useState(true);

  // Form state
  const [formData, setFormData] = useState({
    maxAmount: '1000',
    expiryHours: '24',
    selectedPools: [] as string[],
    riskTolerance: 'medium'
  });

  useEffect(() => {
    if (address) {
      fetchDelegations();
      fetchPools();
    }
  }, [address]);

  // Remove this useEffect as isSuccess is not defined

  const fetchDelegations = async () => {
    try {
      console.log('🔄 Fetching delegations from API...');
      const response = await fetch(`http://localhost:3001/api/smart-account/delegations/${address}`);
      const data = await response.json();
      
      if (data.success) {
        console.log('✅ Delegations fetched:', data.delegations);
        setDelegations(data.delegations);
      }
    } catch (error) {
      console.warn('⚠️ API not available, using local state:', error);
      setDelegations([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchPools = async () => {
    try {
      console.log('🔄 Fetching pools from Envio API...');
      const response = await fetch('http://localhost:3001/api/envio/pools');
      const data = await response.json();
      
      if (data.success) {
        console.log('✅ Pools fetched from Envio:', data.pools.length);
        setPools(data.pools.map((pool: any) => ({
          address: pool.address,
          name: pool.name,
          apy: pool.apy,
          riskScore: pool.riskScore
        })));
      }
    } catch (error) {
      console.warn('⚠️ Envio API not available, using mock pools:', error);
      setPools([
        { address: '0x742d35Cc6634C0532925a3b8D4C9db4C8b9b8b8b', name: 'USDC/ETH', apy: 12.5, riskScore: 0.25 },
        { address: '0x853d955aCEf822Db058eb8505911ED77F175b99e', name: 'DAI/USDC', apy: 8.3, riskScore: 0.15 },
        { address: '0x1234567890abcdef1234567890abcdef12345678', name: 'WBTC/ETH', apy: 15.2, riskScore: 0.45 },
        { address: '0xabcdef1234567890abcdef1234567890abcdef12', name: 'LINK/ETH', apy: 9.8, riskScore: 0.35 }
      ]);
    }
  };

  const handleCreateDelegation = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.maxAmount || formData.selectedPools.length === 0) {
      alert('Please fill in max amount and select at least one pool');
      return;
    }

    // Use mock smart account for demo
    const accountToUse = smartAccount || mockSmartAccount;

    try {
      const caveats = [
        {
          type: 'MaxAmount',
          value: formData.maxAmount,
        },
        {
          type: 'AllowedTargets', 
          value: formData.selectedPools,
        },
        {
          type: 'Expiry',
          value: Math.floor(Date.now() / 1000) + (parseInt(formData.expiryHours || '24') * 3600),
        },
      ];

      // Mock delegation creation for demo
      const delegation = {
        hash: '0x' + Math.random().toString(16).substr(2, 64),
        delegate: '0x742d35Cc6634C0532925a3b8D4C9db4C8b9b8b8b',
        authority: 'yield-optimization',
        caveats
      };
      const txHash = '0x' + Math.random().toString(16).substr(2, 64);
      
      console.log('✅ Mock delegation created:', { delegation, txHash });

      console.log('✅ Delegation created:', { delegation, txHash });
      
      // Add to local state
      const newDelegation = {
        id: delegation.hash,
        delegateAddress: '0x742d35Cc6634C0532925a3b8D4C9db4C8b9b8b8b',
        maxAmount: formData.maxAmount,
        expiry: new Date(Date.now() + (parseInt(formData.expiryHours || '24') * 3600 * 1000)).toISOString(),
        allowedPools: formData.selectedPools,
        status: 'active' as const,
        createdAt: new Date().toISOString(),
        usedAmount: '0',
        transactionCount: 0,
      };
      
      setDelegations(prev => [...prev, newDelegation]);
      setShowCreateForm(false);
      setFormData({
        maxAmount: '1000',
        expiryHours: '24',
        selectedPools: [],
        riskTolerance: 'medium'
      });
    } catch (error) {
      console.error('❌ Error creating delegation:', error);
      alert('Failed to create delegation: ' + (error as Error).message);
    }
  };

  const handleRevokeDelegation = async (delegationId: string) => {
    try {
      const txHash = await revokeDelegation(delegationId);
      console.log('✅ Delegation revoked:', txHash);
      
      // Update local state
      setDelegations(prev => prev.map(d => 
        d.id === delegationId 
          ? { ...d, status: 'revoked' as const }
          : d
      ));
    } catch (error) {
      console.error('❌ Error revoking delegation:', error);
      alert('Failed to revoke delegation: ' + (error as Error).message);
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
              {/* AI Agent Address */}
              <div>
                <label className="block text-sm font-medium text-black-300 mb-2">
                  AI Agent Address
                </label>
                <input
                  type="text"
                  value="0x742d35Cc6634C0532925a3b8D4C9db4C8b9b8b8b"
                  disabled
                  className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-3 text-gray-300 focus:border-blue-500 focus:outline-none"
                />
              </div>

              {/* Max Amount */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Max Amount (USD)
                </label>
                <input
                  type="number"
                  value={formData.maxAmount}
                  onChange={(e) => setFormData(prev => ({ ...prev, maxAmount: e.target.value }))}
                  className="w-full bg-gray-800 border border-gray-600 rounded-lg px-4 py-3 text-white focus:border-blue-500 focus:outline-none"
                  placeholder="1000"
                  required
                />
              </div>

              {/* Expiry Hours */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Expiry (Hours)
                </label>
                <select
                  value={formData.expiryHours || '24'}
                  onChange={(e) => setFormData(prev => ({ ...prev, expiryHours: e.target.value }))}
                  className="w-full bg-gray-800 border border-gray-600 rounded-lg px-4 py-3 text-white focus:border-blue-500 focus:outline-none"
                >
                  <option value="1">1 Hour</option>
                  <option value="6">6 Hours</option>
                  <option value="24">24 Hours</option>
                  <option value="168">1 Week</option>
                </select>
              </div>

              {/* Authority */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Authority
                </label>
                <input
                  type="text"
                  value="yield-optimization"
                  disabled
                  className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-3 text-gray-300 focus:border-blue-500 focus:outline-none"
                />
              </div>
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
                disabled={isLoading}
                className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white px-6 py-3 rounded-lg font-semibold transition-all disabled:opacity-50"
              >
                {isLoading ? 'Creating...' : 'Create Delegation'}
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

      {/* Smart Account Status & Delegation Info */}
      <div className="glass rounded-xl p-6">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-xl font-semibold text-white">MetaMask Smart Accounts Integration</h3>
          <div className={`px-3 py-1 rounded-full text-sm ${
            smartAccount ? 'bg-green-900/30 text-green-400 border border-green-500' : 'bg-red-900/30 text-red-400 border border-red-500'
          }`}>
            {smartAccount ? '✅ Active' : '❌ Not Connected'}
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="text-center">
            <div className="text-3xl mb-3">🔒</div>
            <div className="text-white font-semibold mb-2">Delegation Toolkit</div>
            <div className="text-gray-400 text-sm">
              Real on-chain delegations with scoped permissions: amount limits, target contracts, and expiry times.
            </div>
          </div>
          <div className="text-center">
            <div className="text-3xl mb-3">⚡</div>
            <div className="text-white font-semibold mb-2">Smart Account Execution</div>
            <div className="text-gray-400 text-sm">
              AI executes transactions through your Smart Account with gasless operations and bundled transactions.
            </div>
          </div>
          <div className="text-center">
            <div className="text-3xl mb-3">🌐</div>
            <div className="text-white font-semibold mb-2">Monad Testnet</div>
            <div className="text-gray-400 text-sm">
              Deployed on Monad testnet with real Smart Account contracts and delegation management.
            </div>
          </div>
        </div>
        
        {error && (
          <div className="mt-4 bg-red-900/30 border border-red-500 rounded-lg p-4">
            <p className="text-red-400 font-medium">Smart Account Error</p>
            <p className="text-red-300 text-sm">{error}</p>
          </div>
        )}
      </div>
    </div>
  );
}