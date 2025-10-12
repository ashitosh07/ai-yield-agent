'use client';

import { useState, useEffect } from 'react';

export function RealWalletConnect({ onConnect }: { onConnect: (address: string) => void }) {
  const [isConnecting, setIsConnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasExistingConnection, setHasExistingConnection] = useState(false);
  
  // Check for existing connection on mount
  useEffect(() => {
    if (window.ethereum) {
      window.ethereum.request({ method: 'eth_accounts' })
        .then((accounts: string[]) => {
          if (accounts.length > 0) {
            setHasExistingConnection(true);
          }
        })
        .catch(console.error);
    }
  }, []);

  const addMonadTestnet = async () => {
    if (!window.ethereum) return false;
    
    try {
      await window.ethereum.request({
        method: 'wallet_addEthereumChain',
        params: [{
          chainId: '0x279F',
          chainName: 'Monad Testnet',
          nativeCurrency: {
            name: 'Monad',
            symbol: 'MON',
            decimals: 18
          },
          rpcUrls: ['https://testnet-rpc.monad.xyz'],
          blockExplorerUrls: ['https://testnet.monadexplorer.com']
        }]
      });
      return true;
    } catch (error) {
      if (error.code === 4902) {
        console.log('Network already exists');
        return true;
      }
      if (error.code === -32003) {
        throw new Error('Please approve network addition in MetaMask');
      }
      throw error;
    }
  };

  const handleConnect = async () => {
    setIsConnecting(true);
    setError(null);
    
    try {
      // Check for MetaMask specifically
      if (!window.ethereum || !window.ethereum.isMetaMask) {
        setError('MetaMask not found. Please install MetaMask extension.');
        return;
      }

      // If multiple wallets, ensure we use MetaMask
      let ethereum = window.ethereum;
      if (window.ethereum.providers) {
        ethereum = window.ethereum.providers.find((p: any) => p.isMetaMask);
        if (!ethereum) {
          setError('MetaMask not found among wallet providers.');
          return;
        }
      }

      // Check if already connected
      let accounts = await ethereum.request({ 
        method: 'eth_accounts' 
      });
      
      // If no accounts, request connection
      if (accounts.length === 0) {
        accounts = await ethereum.request({ 
          method: 'eth_requestAccounts' 
        });
      }
      
      if (accounts.length === 0) {
        setError('No accounts found');
        return;
      }

      // Try to add/switch to Monad testnet using MetaMask
      try {
        await ethereum.request({
          method: 'wallet_addEthereumChain',
          params: [{
            chainId: '0x279F',
            chainName: 'Monad Testnet',
            nativeCurrency: { name: 'Monad', symbol: 'MON', decimals: 18 },
            rpcUrls: ['https://testnet-rpc.monad.xyz'],
            blockExplorerUrls: ['https://testnet.monadexplorer.com']
          }]
        });
        
        await ethereum.request({
          method: 'wallet_switchEthereumChain',
          params: [{ chainId: '0x279F' }]
        });
      } catch (networkError: any) {
        if (networkError.code === 4902) {
          // Network already exists, just switch
          await ethereum.request({
            method: 'wallet_switchEthereumChain',
            params: [{ chainId: '0x279F' }]
          });
        } else if (networkError.code === -32003) {
          setError('Please approve network addition/switch in MetaMask');
          return;
        } else {
          console.warn('Network switch failed:', networkError);
        }
      }
      
      onConnect(accounts[0]);
    } catch (error: any) {
      console.error('Connection failed:', error);
      setError(error.message || 'Failed to connect wallet');
    } finally {
      setIsConnecting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 bg-grid flex items-center justify-center">
      <div className="text-center max-w-md mx-auto px-6">
        <div className="w-24 h-24 bg-gradient-to-r from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-6">
          <span className="text-4xl">🤖</span>
        </div>
        
        <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent mb-4">
          AI Yield Agent
        </h1>
        
        <p className="text-gray-400 mb-8">Connect MetaMask to Monad Testnet</p>
        
        {error && (
          <div className="bg-red-500/20 border border-red-500/50 text-red-400 p-4 rounded-lg mb-6">
            {error}
          </div>
        )}
        
        <button
          onClick={handleConnect}
          disabled={isConnecting}
          className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white px-8 py-4 rounded-lg font-semibold transition-all disabled:opacity-50"
        >
          {isConnecting ? 'Connecting...' : hasExistingConnection ? 'Connect to Monad Testnet' : 'Connect MetaMask'}
        </button>
        
        <div className="text-gray-500 text-sm mt-4 space-y-2">
          <p>✅ Monad Testnet (Chain ID: 10143)</p>
          <p>✅ Real MON tokens required</p>
          <p>✅ No mock data</p>
        </div>
      </div>
    </div>
  );
}