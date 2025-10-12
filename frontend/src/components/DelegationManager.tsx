'use client';

import React, { useState, useEffect } from 'react';
import { useSmartAccount } from '../hooks/useSmartAccount';
import { useAccount } from 'wagmi';

export default function DelegationManager({ smartAccount }) {
  const { address } = useAccount();
  const {
    createDelegation,
    revokeDelegation,
    executeWithDelegation,
    isLoading,
    error
  } = useSmartAccount();

  const [delegations, setDelegations] = useState([
    {
      id: '1',
      delegate: '0x742d35Cc6634C0532925a3b8D4C9db4C8b9b8b8b',
      status: 'active',
      createdAt: new Date().toISOString(),
      caveats: [
        { type: 'AllowedTargets', value: ['0xf817257fed379853cDe0fa4F97AB987181B1E5Ea'] }, // USDC testnet
        { type: 'MaxAmount', value: '1000000000' }, // 1000 USDC (6 decimals)
        { type: 'ExpiryTime', value: Math.floor(Date.now() / 1000) + 86400 }
      ],
      purpose: 'AI Yield Optimization'
    }
  ]);

  const [newDelegation, setNewDelegation] = useState({
    delegate: '0x742d35Cc6634C0532925a3b8D4C9db4C8b9b8b8b', // AI Agent address
    maxAmount: '1000000000', // 1000 USDC
    allowedTargets: '0xf817257fed379853cDe0fa4F97AB987181B1E5Ea', // USDC testnet
    expiryHours: '24',
    purpose: 'AI Yield Optimization'
  });

  const [showAdvanced, setShowAdvanced] = useState(false);

  // Preset configurations for common use cases
  const presets = {
    yieldOptimization: {
      delegate: '0x742d35Cc6634C0532925a3b8D4C9db4C8b9b8b8b',
      maxAmount: '1000000000',
      allowedTargets: '0xf817257fed379853cDe0fa4F97AB987181B1E5Ea,0x88b8E2161DEDC77EF4ab7585569D2415a1C1055D',
      expiryHours: '24',
      purpose: 'AI Yield Optimization'
    },
    trading: {
      delegate: '0x742d35Cc6634C0532925a3b8D4C9db4C8b9b8b8b',
      maxAmount: '500000000',
      allowedTargets: '0x961235a9020b05c44df1026d956d1f4d78014276', // UniswapV3Factory
      expiryHours: '12',
      purpose: 'Automated Trading'
    }
  };

  const handlePresetSelect = (presetKey) => {
    setNewDelegation(presets[presetKey]);
  };

  const handleCreateDelegation = async (e) => {
    e.preventDefault();
    
    try {
      const caveats = [
        {
          type: 'AllowedTargets',
          value: newDelegation.allowedTargets.split(',').map(addr => addr.trim())
        },
        {
          type: 'MaxAmount',
          value: newDelegation.maxAmount
        },
        {
          type: 'ExpiryTime',
          value: Math.floor(Date.now() / 1000) + (parseInt(newDelegation.expiryHours) * 3600)
        }
      ];

      const result = await createDelegation({
        delegate: newDelegation.delegate,
        caveats
      });

      const delegation = {
        id: Date.now().toString(),
        delegate: newDelegation.delegate,
        status: 'active',
        createdAt: new Date().toISOString(),
        caveats,
        txHash: result.txHash,
        purpose: newDelegation.purpose
      };

      setDelegations(prev => [...prev, delegation]);
      setNewDelegation({ 
        delegate: '0x742d35Cc6634C0532925a3b8D4C9db4C8b9b8b8b', 
        maxAmount: '1000000000', 
        allowedTargets: '0xf817257fed379853cDe0fa4F97AB987181B1E5Ea', 
        expiryHours: '24',
        purpose: 'AI Yield Optimization'
      });
    } catch (err) {
      console.error('Failed to create delegation:', err);
    }
  };

  const handleRevokeDelegation = async (delegationId) => {
    try {
      const delegation = delegations.find(d => d.id === delegationId);
      await revokeDelegation(delegation.txHash);
      
      setDelegations(prev => 
        prev.map(d => 
          d.id === delegationId 
            ? { ...d, status: 'revoked' }
            : d
        )
      );
    } catch (err) {
      console.error('Failed to revoke delegation:', err);
    }
  };

  const getTokenName = (address) => {
    const tokens = {
      '0xf817257fed379853cDe0fa4F97AB987181B1E5Ea': 'USDC',
      '0x88b8E2161DEDC77EF4ab7585569D2415a1C1055D': 'USDT',
      '0xcf5a6076cfa32686c0Df13aBaDa2b40dec133F1d': 'WBTC',
      '0xB5a30b0FDc42e3E9760Cb8449Fb37': 'WETH'
    };
    return tokens[address] || address.slice(0, 6) + '...' + address.slice(-4);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="glass p-6 rounded-xl">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-2xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
              🔐 MetaMask Smart Account Delegations
            </h3>
            <p className="text-gray-400 mt-1">Grant scoped permissions to AI agents for autonomous DeFi operations</p>
          </div>
          <div className="text-right">
            <div className="text-sm text-gray-400">Smart Account</div>
            <div className="text-blue-400 font-mono text-sm">
              {smartAccount?.address?.slice(0, 8)}...{smartAccount?.address?.slice(-6)}
            </div>
          </div>
        </div>

        {/* Preset Buttons */}
        <div className="flex space-x-3 mb-6">
          <button
            onClick={() => handlePresetSelect('yieldOptimization')}
            className="bg-gradient-to-r from-green-500/20 to-blue-500/20 border border-green-500/30 text-green-400 px-4 py-2 rounded-lg hover:from-green-500/30 hover:to-blue-500/30 transition-all"
          >
            🎯 Yield Optimization
          </button>
          <button
            onClick={() => handlePresetSelect('trading')}
            className="bg-gradient-to-r from-purple-500/20 to-pink-500/20 border border-purple-500/30 text-purple-400 px-4 py-2 rounded-lg hover:from-purple-500/30 hover:to-pink-500/30 transition-all"
          >
            📈 Automated Trading
          </button>
          <button
            onClick={() => setShowAdvanced(!showAdvanced)}
            className="bg-gray-500/20 border border-gray-500/30 text-gray-400 px-4 py-2 rounded-lg hover:bg-gray-500/30 transition-all"
          >
            ⚙️ {showAdvanced ? 'Hide' : 'Show'} Advanced
          </button>
        </div>
        
        {/* Create New Delegation */}
        <form onSubmit={handleCreateDelegation} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Purpose
              </label>
              <input
                type="text"
                value={newDelegation.purpose}
                onChange={(e) => setNewDelegation(prev => ({ ...prev, purpose: e.target.value }))}
                className="w-full px-4 py-3 glass border border-white/10 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-white placeholder-gray-400"
                placeholder="AI Yield Optimization"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Delegate (AI Agent Address)
              </label>
              <input
                type="text"
                value={newDelegation.delegate}
                onChange={(e) => setNewDelegation(prev => ({ ...prev, delegate: e.target.value }))}
                className="w-full px-4 py-3 glass border border-white/10 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-white placeholder-gray-400 font-mono text-sm"
                placeholder="0x742d35Cc6634C0532925a3b8D4C9db4C8b9b8b8b"
                required
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Max Amount (Wei/Tokens)
              </label>
              <input
                type="text"
                value={newDelegation.maxAmount}
                onChange={(e) => setNewDelegation(prev => ({ ...prev, maxAmount: e.target.value }))}
                className="w-full px-4 py-3 glass border border-white/10 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-white placeholder-gray-400"
                placeholder="1000000000 (1000 USDC)"
                required
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Expiry (hours)
              </label>
              <select
                value={newDelegation.expiryHours}
                onChange={(e) => setNewDelegation(prev => ({ ...prev, expiryHours: e.target.value }))}
                className="w-full px-4 py-3 glass border border-white/10 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-white"
              >
                <option value="1">1 hour</option>
                <option value="6">6 hours</option>
                <option value="12">12 hours</option>
                <option value="24">24 hours</option>
                <option value="168">1 week</option>
              </select>
            </div>
          </div>
          
          {showAdvanced && (
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Allowed Target Contracts (comma-separated)
              </label>
              <textarea
                value={newDelegation.allowedTargets}
                onChange={(e) => setNewDelegation(prev => ({ ...prev, allowedTargets: e.target.value }))}
                className="w-full px-4 py-3 glass border border-white/10 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-white placeholder-gray-400 font-mono text-sm"
                placeholder="0xf817257fed379853cDe0fa4F97AB987181B1E5Ea,0x88b8E2161DEDC77EF4ab7585569D2415a1C1055D"
                rows={3}
                required
              />
              <p className="text-xs text-gray-400 mt-1">
                USDC: 0xf817257fed379853cDe0fa4F97AB987181B1E5Ea | USDT: 0x88b8E2161DEDC77EF4ab7585569D2415a1C1055D
              </p>
            </div>
          )}
          
          <button
            type="submit"
            disabled={isLoading || !smartAccount}
            className="w-full bg-gradient-to-r from-blue-500 to-purple-600 text-white px-6 py-3 rounded-lg hover:from-blue-600 hover:to-purple-700 disabled:opacity-50 transition-all font-medium"
          >
            {isLoading ? 'Creating Delegation...' : '🔐 Create Scoped Delegation'}
          </button>
        </form>

        {error && (
          <div className="bg-red-500/20 border border-red-500/50 rounded-lg p-4 mt-4">
            <p className="text-red-400 font-medium">Delegation Error</p>
            <p className="text-red-300 text-sm">{error}</p>
          </div>
        )}
      </div>

      {/* Existing Delegations */}
      <div className="glass p-6 rounded-xl">
        <h4 className="text-xl font-bold text-white mb-4">📋 Active Delegations</h4>
        
        {delegations.length === 0 ? (
          <div className="text-center py-8">
            <div className="text-6xl mb-4">🔒</div>
            <p className="text-gray-400">No delegations created yet.</p>
            <p className="text-gray-500 text-sm">Create your first delegation to enable AI automation.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {delegations.map((delegation) => {
              const maxAmount = delegation.caveats.find(c => c.type === 'MaxAmount')?.value;
              const targets = delegation.caveats.find(c => c.type === 'AllowedTargets')?.value || [];
              const expiry = delegation.caveats.find(c => c.type === 'ExpiryTime')?.value;
              
              return (
                <div key={delegation.id} className="glass border border-white/10 rounded-lg p-4 hover:border-white/20 transition-all">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-3">
                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                          delegation.status === 'active' 
                            ? 'bg-green-500/20 text-green-400 border border-green-500/30'
                            : 'bg-red-500/20 text-red-400 border border-red-500/30'
                        }`}>
                          {delegation.status === 'active' ? '🟢 Active' : '🔴 Revoked'}
                        </span>
                        <span className="text-blue-400 font-medium">{delegation.purpose}</span>
                        <span className="text-xs text-gray-400">
                          {new Date(delegation.createdAt).toLocaleString()}
                        </span>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                        <div>
                          <p className="text-gray-400">Delegate:</p>
                          <p className="text-white font-mono text-xs">{delegation.delegate}</p>
                        </div>
                        <div>
                          <p className="text-gray-400">Max Amount:</p>
                          <p className="text-white">{maxAmount} Wei</p>
                        </div>
                        <div>
                          <p className="text-gray-400">Allowed Targets:</p>
                          <div className="flex flex-wrap gap-1">
                            {targets.map((target, idx) => (
                              <span key={idx} className="bg-blue-500/20 text-blue-400 px-2 py-1 rounded text-xs">
                                {getTokenName(target)}
                              </span>
                            ))}
                          </div>
                        </div>
                        <div>
                          <p className="text-gray-400">Expires:</p>
                          <p className="text-white">{new Date(expiry * 1000).toLocaleString()}</p>
                        </div>
                      </div>
                      
                      {delegation.txHash && (
                        <div className="mt-3 pt-3 border-t border-white/10">
                          <p className="text-gray-400 text-xs">Transaction Hash:</p>
                          <p className="text-gray-300 font-mono text-xs break-all">{delegation.txHash}</p>
                        </div>
                      )}
                    </div>
                    
                    {delegation.status === 'active' && (
                      <button
                        onClick={() => handleRevokeDelegation(delegation.id)}
                        disabled={isLoading}
                        className="bg-red-500/20 hover:bg-red-500/30 border border-red-500/50 text-red-400 px-4 py-2 rounded-lg transition-all disabled:opacity-50 ml-4"
                      >
                        🗑️ Revoke
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}