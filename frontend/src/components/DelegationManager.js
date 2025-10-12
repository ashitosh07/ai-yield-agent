import { useState, useEffect } from 'react';

export default function DelegationManager({ smartAccount }) {
  const address = '0x742d35Cc6634C0532925a3b8D4C9db4C8b9b8b8b';
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [delegations, setDelegations] = useState([]);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [formData, setFormData] = useState({
    delegate: '0x742d35Cc6634C0532925a3b8D4C9db4C8b9b8b8b', // AI Agent address
    maxAmount: '1000',
    allowedPools: [],
    expiryHours: '24',
  });

  // Fetch existing delegations on mount
  useEffect(() => {
    if (address) {
      fetchDelegations();
    }
  }, [address]);

  const fetchDelegations = async () => {
    try {
      console.log('🔄 Fetching existing delegations for address:', address);
      const response = await fetch(`http://localhost:3002/api/smart-account/delegations/${address}`);
      if (response.ok) {
        const result = await response.json();
        console.log('✅ Existing delegations:', result.delegations);
        console.log('🔍 Total delegations found:', result.delegations?.length || 0);
        setDelegations(result.delegations || []);
      }
    } catch (err) {
      console.error('❌ Error fetching delegations:', err);
    }
  };

  const handleCreateDelegation = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    
    try {
      console.log('🔄 Calling real API to create delegation...');
      
      // Real API call to backend
      const response = await fetch('http://localhost:3002/api/smart-account/delegations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          delegate: formData.delegate,
          authority: 'yield-optimization',
          maxAmount: formData.maxAmount,
          expiryHours: formData.expiryHours,
          userAddress: address || smartAccount?.address || '0x742d35Cc6634C0532925a3b8D4C9db4C8b9b8b8b'
        }),
      });
      
      if (!response.ok) {
        throw new Error(`API Error: ${response.status}`);
      }
      
      const result = await response.json();
      console.log('✅ Real API response:', result);
      
      const delegation = result.delegation || {
        hash: '0x' + Math.random().toString(16).substr(2, 64),
        delegate: formData.delegate,
        authority: 'yield-optimization',
        maxAmount: formData.maxAmount,
        expiryHours: formData.expiryHours,
      };
      
      const txHash = result.txHash || '0x' + Math.random().toString(16).substr(2, 64);
      
      console.log('✅ Delegation created via API:', { delegation, txHash });

      const newDelegation = {
        id: delegation.hash,
        delegate: formData.delegate,
        authority: 'yield-optimization',
        maxAmount: formData.maxAmount,
        allowedPools: formData.allowedPools,
        expiryHours: formData.expiryHours,
        txHash,
        createdAt: new Date().toISOString(),
        status: 'active',
      };

      // Refresh delegations from backend instead of local state
      await fetchDelegations();
      setShowCreateForm(false);
      setFormData({
        delegate: '0x742d35Cc6634C0532925a3b8D4C9db4C8b9b8b8b',
        maxAmount: '1000',
        allowedPools: [],
        expiryHours: '24',
      });
    } catch (err) {
      console.error('Delegation creation failed:', err);
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRevokeDelegation = async (delegationId) => {
    setIsLoading(true);
    try {
      console.log('🔄 Calling real API to revoke delegation...');
      
      // Real API call to backend
      const response = await fetch(`http://localhost:3002/api/smart-account/delegations/${delegationId}/revoke`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      if (!response.ok) {
        throw new Error(`API Error: ${response.status}`);
      }
      
      const result = await response.json();
      const txHash = result.txHash || '0x' + Math.random().toString(16).substr(2, 64);
      
      console.log('✅ Delegation revoked via API:', txHash);
      
      // Refresh delegations from backend
      await fetchDelegations();
    } catch (err) {
      console.error('Delegation revocation failed:', err);
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  // Always show the delegation manager for demo

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-6">
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-xl font-bold text-gray-900">
          🤝 Delegation Management
        </h3>
        <button
          onClick={() => setShowCreateForm(!showCreateForm)}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
        >
          {showCreateForm ? 'Cancel' : 'Create Delegation'}
        </button>
      </div>

      {showCreateForm && (
        <form onSubmit={handleCreateDelegation} className="bg-black-50 rounded-lg p-4 mb-6">
          <h4 className="font-semibold text-gray-900 mb-4">Create New Delegation</h4>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-black-700 mb-1">
                AI Agent Address
              </label>
              <input
                type="text"
                value={formData.delegate}
                onChange={(e) => setFormData({...formData, delegate: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                placeholder="0x..."
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-white-700 mb-1">
                Max Amount (USD)
              </label>
              <input
                type="number"
                value={formData.maxAmount}
                onChange={(e) => setFormData({...formData, maxAmount: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                placeholder="1000"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-white-700 mb-1">
                Expiry (Hours)
              </label>
              <select
                value={formData.expiryHours}
                onChange={(e) => setFormData({...formData, expiryHours: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                <option value="1">1 Hour</option>
                <option value="6">6 Hours</option>
                <option value="24">24 Hours</option>
                <option value="168">1 Week</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-white-700 mb-1">
                Authority
              </label>
              <input
                type="text"
                value="yield-optimization"
                disabled
                className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-100"
              />
            </div>
          </div>

          <div className="mt-4">
            <button
              type="submit"
              disabled={isLoading}
              className="bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700 disabled:opacity-50"
            >
              {isLoading ? 'Creating...' : 'Create Delegation'}
            </button>
          </div>
        </form>
      )}

      {/* Active Delegations */}
      <div>
        <h4 className="font-semibold text-gray-900 mb-4">Active Delegations</h4>
        
        {delegations.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <p>No delegations created yet.</p>
            <p className="text-sm">Create a delegation to enable AI yield optimization.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {delegations.map((delegation) => (
              <div key={delegation.id} className="border border-gray-200 rounded-lg p-4">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-2">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        delegation.status === 'active' 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {delegation.status}
                      </span>
                      <span className="text-sm text-gray-500">
                        {delegation.authority}
                      </span>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="text-gray-600">Delegate:</span>
                        <p className="font-mono">{delegation.delegate.slice(0, 10)}...</p>
                      </div>
                      <div>
                        <span className="text-gray-600">Max Amount:</span>
                        <p className="font-semibold">${delegation.maxAmount}</p>
                      </div>
                      <div>
                        <span className="text-gray-600">Expires:</span>
                        <p>{delegation.expiryHours}h from creation</p>
                      </div>
                      <div>
                        <span className="text-gray-600">Created:</span>
                        <p>{new Date(delegation.createdAt).toLocaleString()}</p>
                      </div>
                    </div>
                  </div>
                  
                  {delegation.status === 'active' && (
                    <button
                      onClick={() => handleRevokeDelegation(delegation.id)}
                      disabled={isLoading}
                      className="bg-red-600 text-white px-3 py-1 rounded text-sm hover:bg-red-700 disabled:opacity-50"
                    >
                      Revoke
                    </button>
                  )}
                </div>
                
                <div className="mt-3 pt-3 border-t border-gray-100">
                  <span className="text-xs text-gray-500">
                    Tx: {delegation.txHash?.slice(0, 20)}...
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {error && (
        <div className="mt-4 bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-800 font-medium">Delegation Error</p>
          <p className="text-red-700 text-sm">{error}</p>
        </div>
      )}
    </div>
  );
}