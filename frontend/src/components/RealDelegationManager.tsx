'use client';

import { useState, useEffect } from 'react';
import { useRealSmartAccount } from '../hooks/useRealSmartAccount';

interface RealDelegationManagerProps {
  smartAccount: any;
  userAddress: string;
}

export default function RealDelegationManager({ smartAccount, userAddress }: RealDelegationManagerProps) {
  const { createDelegation, executeWithDelegation, isLoading, error, initializeSmartAccount } = useRealSmartAccount();
  const [isInitialized, setIsInitialized] = useState(false);
  const [currentChainId, setCurrentChainId] = useState<string | null>(null);
  
  // Check current chain
  useEffect(() => {
    const checkNetwork = async () => {
      if (window.ethereum && window.ethereum.isMetaMask) {
        let ethereum = window.ethereum;
        
        // If multiple wallets, ensure we use MetaMask
        if (window.ethereum.providers) {
          ethereum = window.ethereum.providers.find((p: any) => p.isMetaMask) || window.ethereum;
        }
        
        try {
          const chainId = await ethereum.request({ method: 'eth_chainId' });
          console.log('Current chain ID:', chainId, 'Expected: 0x279f');
          setCurrentChainId(chainId);
        } catch (error) {
          console.error('Failed to get chain ID:', error);
        }
        
        // Listen for chain changes
        const handleChainChanged = (chainId: string) => {
          console.log('Chain changed to:', chainId);
          setCurrentChainId(chainId);
        };
        
        ethereum.on('chainChanged', handleChainChanged);
        return () => ethereum.removeListener('chainChanged', handleChainChanged);
      }
    };
    
    checkNetwork();
  }, []);
  
  // Initialize smart account when component mounts
  useEffect(() => {
    if (userAddress && !isInitialized) {
      initializeSmartAccount(userAddress)
        .then(() => setIsInitialized(true))
        .catch(console.error);
    }
  }, [userAddress, isInitialized, initializeSmartAccount]);
  const [delegations, setDelegations] = useState<any[]>(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem(`delegations_${userAddress}`);
      return stored ? JSON.parse(stored) : [];
    }
    return [];
  });
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [formData, setFormData] = useState({
    delegate: '0x742d35Cc6634C0532925a3b8D4C9db4C8b9b8b8b', // AI Agent address
    tokenAddress: '0xf817257fed379853cDe0fa4F97AB987181B1E5Ea', // Test token
    maxAmount: '1000000000000000', // 0.001 token (much smaller for testing)
    expiry: Math.floor(Date.now() / 1000) + 86400 // 24 hours
  });

  const handleCreateDelegation = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!isInitialized) {
      alert('Smart account not initialized yet. Please wait.');
      return;
    }
    
    try {
      const result = await createDelegation({
        delegate: formData.delegate,
        tokenAddress: formData.tokenAddress,
        maxAmount: formData.maxAmount,
        expiry: formData.expiry
      });

      const newDelegation = {
        ...result.delegation,
        id: Date.now(),
        status: 'active',
        createdAt: new Date().toISOString(),
        delegate: formData.delegate,
        tokenAddress: formData.tokenAddress,
        maxAmount: formData.maxAmount,
        expiry: formData.expiry
      };

      const updatedDelegations = [...delegations, newDelegation];
      setDelegations(updatedDelegations);
      
      // Store in localStorage
      if (typeof window !== 'undefined') {
        localStorage.setItem(`delegations_${userAddress}`, JSON.stringify(updatedDelegations));
      }
      setShowCreateForm(false);
      
      // Reset form
      setFormData({
        delegate: '0x742d35Cc6634C0532925a3b8D4C9db4C8b9b8b8b',
        tokenAddress: '0xf817257fed379853cDe0fa4F97AB987181B1E5Ea',
        maxAmount: '1000000000000000', // 0.001 token
        expiry: Math.floor(Date.now() / 1000) + 86400
      });
    } catch (err) {
      console.error('Failed to create delegation:', err);
    }
  };

  const handleRevokeDelegation = async (delegationId: number) => {
    // In a real implementation, this would call a revoke function
    const updatedDelegations = delegations.map(d => 
      d.id === delegationId 
        ? { ...d, status: 'revoked' }
        : d
    );
    
    setDelegations(updatedDelegations);
    
    // Store in localStorage
    if (typeof window !== 'undefined') {
      localStorage.setItem(`delegations_${userAddress}`, JSON.stringify(updatedDelegations));
    }
    
    // Log revocation to audit trail
    const auditEntry = {
      action: 'delegation_revoked' as const,
      details: {
        delegationId,
        reason: 'User manually revoked delegation'
      },
      status: 'success' as const
    };
    
    // Add to localStorage audit log
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem(`audit_${userAddress}`) || '[]';
      const auditEntries = JSON.parse(stored);
      const newEntry = {
        ...auditEntry,
        id: Date.now().toString(),
        timestamp: new Date().toISOString()
      };
      auditEntries.unshift(newEntry);
      localStorage.setItem(`audit_${userAddress}`, JSON.stringify(auditEntries));
    }
    
    console.log('✅ Revocation audit entry added to localStorage');
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-white">Real Delegation Manager</h2>
          <p className="text-gray-400">Manage delegations on Monad Testnet</p>
          {!isInitialized && (
            <p className="text-yellow-400 text-sm mt-1">⏳ Initializing smart account...</p>
          )}
        </div>
        <button
          onClick={() => setShowCreateForm(true)}
          disabled={!isInitialized || isLoading || (currentChainId && currentChainId.toLowerCase() !== '0x279f')}
          className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white px-6 py-3 rounded-lg font-semibold transition-all disabled:opacity-50"
        >
          Create Delegation
        </button>
      </div>

      {currentChainId && currentChainId.toLowerCase() !== '0x279f' && (
        <div className="bg-yellow-500/20 border border-yellow-500/50 text-yellow-400 p-4 rounded-lg mb-6">
          <div className="flex justify-between items-center">
            <div>
              <p className="font-semibold">⚠️ Wrong Network</p>
              <p className="text-sm">Please switch to Monad Testnet (Chain ID: 10143)</p>
            </div>
            <button
              onClick={async () => {
                if (!window.ethereum?.isMetaMask) return;
                
                let ethereum = window.ethereum;
                if (window.ethereum.providers) {
                  ethereum = window.ethereum.providers.find((p: any) => p.isMetaMask) || window.ethereum;
                }
                
                try {
                  console.log('Attempting to switch to Monad Testnet...');
                  await ethereum.request({
                    method: 'wallet_switchEthereumChain',
                    params: [{ chainId: '0x279f' }]
                  });
                } catch (err: any) {
                  console.log('Switch failed, trying to add network:', err.code);
                  if (err.code === 4902) {
                    try {
                      await ethereum.request({
                        method: 'wallet_addEthereumChain',
                        params: [{
                          chainId: '0x279f',
                          chainName: 'Monad Testnet',
                          nativeCurrency: { name: 'Monad', symbol: 'MON', decimals: 18 },
                          rpcUrls: ['https://testnet-rpc.monad.xyz'],
                          blockExplorerUrls: ['https://testnet.monadexplorer.com']
                        }]
                      });
                      console.log('Network added successfully');
                    } catch (addErr) {
                      console.error('Failed to add network:', addErr);
                    }
                  } else {
                    console.error('Network switch error:', err);
                  }
                }
              }}
              className="bg-yellow-500 hover:bg-yellow-600 text-black px-4 py-2 rounded-lg font-semibold transition-all"
            >
              Switch Network
            </button>
          </div>
        </div>
      )}
      
      {error && (
        <div className="bg-red-500/20 border border-red-500/50 text-red-400 p-4 rounded-lg">
          <p className="font-semibold">Error:</p>
          <p className="text-sm">{error}</p>
        </div>
      )}

      {/* Create Delegation Form */}
      {showCreateForm && (
        <div className="glass p-6 rounded-xl border border-white/10">
          <h3 className="text-xl font-bold text-white mb-4">Create New Delegation</h3>
          
          <form onSubmit={handleCreateDelegation} className="space-y-4">
            <div>
              <label className="block text-gray-300 text-sm font-medium mb-2">
                Delegate Address (AI Agent)
              </label>
              <input
                type="text"
                value={formData.delegate}
                onChange={(e) => setFormData(prev => ({ ...prev, delegate: e.target.value }))}
                className="w-full bg-gray-800 border border-gray-600 rounded-lg px-4 py-3 text-white focus:border-blue-500 focus:outline-none"
                placeholder="0x..."
                required
              />
            </div>

            <div>
              <label className="block text-gray-300 text-sm font-medium mb-2">
                Token Address
              </label>
              <input
                type="text"
                value={formData.tokenAddress}
                onChange={(e) => setFormData(prev => ({ ...prev, tokenAddress: e.target.value }))}
                className="w-full bg-gray-800 border border-gray-600 rounded-lg px-4 py-3 text-white focus:border-blue-500 focus:outline-none"
                placeholder="0x..."
                required
              />
            </div>

            <div>
              <label className="block text-gray-300 text-sm font-medium mb-2">
                Max Amount (Wei)
              </label>
              <input
                type="text"
                value={formData.maxAmount}
                onChange={(e) => setFormData(prev => ({ ...prev, maxAmount: e.target.value }))}
                className="w-full bg-gray-800 border border-gray-600 rounded-lg px-4 py-3 text-white focus:border-blue-500 focus:outline-none"
                placeholder="1000000000000000"
                required
              />
              <p className="text-gray-500 text-xs mt-1">
                Default: 1000000000000000 Wei = 0.001 tokens (low gas cost)
              </p>
            </div>

            <div>
              <label className="block text-gray-300 text-sm font-medium mb-2">
                Expiry (Unix Timestamp)
              </label>
              <input
                type="number"
                value={formData.expiry}
                onChange={(e) => setFormData(prev => ({ ...prev, expiry: parseInt(e.target.value) }))}
                className="w-full bg-gray-800 border border-gray-600 rounded-lg px-4 py-3 text-white focus:border-blue-500 focus:outline-none"
                required
              />
            </div>

            <div className="flex space-x-4">
              <button
                type="submit"
                disabled={isLoading}
                className="flex-1 bg-gradient-to-r from-green-500 to-blue-600 hover:from-green-600 hover:to-blue-700 text-white py-3 rounded-lg font-semibold transition-all disabled:opacity-50"
              >
                {isLoading ? 'Creating...' : 'Create Delegation'}
              </button>
              <button
                type="button"
                onClick={() => setShowCreateForm(false)}
                className="flex-1 bg-gray-600 hover:bg-gray-700 text-white py-3 rounded-lg font-semibold transition-all"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Delegations List */}
      <div className="space-y-4">
        {delegations.length === 0 ? (
          <div className="glass p-8 rounded-xl border border-white/10 text-center">
            <div className="w-16 h-16 bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-2xl">🔐</span>
            </div>
            <h3 className="text-xl font-semibold text-white mb-2">No Delegations Yet</h3>
            <p className="text-gray-400 mb-4">Create your first delegation to enable AI yield optimization</p>
          </div>
        ) : (
          delegations.map((delegation) => (
            <div key={delegation.id} className="glass p-6 rounded-xl border border-white/10">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="text-lg font-semibold text-white">Delegation #{delegation.id}</h3>
                  <p className="text-gray-400 text-sm">Created: {new Date(delegation.createdAt).toLocaleString()}</p>
                </div>
                <div className={`px-3 py-1 rounded-full text-xs font-medium ${
                  delegation.status === 'active' 
                    ? 'bg-green-500/20 text-green-400 border border-green-500/50'
                    : 'bg-red-500/20 text-red-400 border border-red-500/50'
                }`}>
                  {delegation.status.toUpperCase()}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                  <p className="text-gray-400 text-sm">Delegate</p>
                  <p className="text-white font-mono text-sm">{delegation.delegate}</p>
                </div>
                <div>
                  <p className="text-gray-400 text-sm">Token</p>
                  <p className="text-white font-mono text-sm">{delegation.tokenAddress}</p>
                </div>
                <div>
                  <p className="text-gray-400 text-sm">Max Amount</p>
                  <p className="text-white text-sm">{(parseInt(delegation.maxAmount) / 1e18).toFixed(4)} tokens</p>
                </div>
                <div>
                  <p className="text-gray-400 text-sm">Expires</p>
                  <p className="text-white text-sm">{new Date(delegation.expiry * 1000).toLocaleString()}</p>
                </div>
              </div>

              {delegation.status === 'active' && (
                <button
                  onClick={() => handleRevokeDelegation(delegation.id)}
                  className="bg-red-500/20 hover:bg-red-500/30 border border-red-500/50 text-red-400 px-4 py-2 rounded-lg transition-all"
                >
                  Revoke Delegation
                </button>
              )}
            </div>
          ))
        )}
      </div>

      <div className="glass p-4 rounded-xl border border-blue-500/30 bg-blue-500/10">
        <p className="text-blue-400 text-sm">
          <strong>Real Mode:</strong> Delegations are created on Monad Testnet with actual smart contracts. 
          Gas fees in MON tokens are required for all transactions.
        </p>
      </div>
    </div>
  );
}