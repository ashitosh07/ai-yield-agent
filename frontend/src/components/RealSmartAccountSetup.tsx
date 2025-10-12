'use client';

import { useState, useEffect } from 'react';
import { useRealSmartAccount } from '../hooks/useRealSmartAccount';

interface RealSmartAccountSetupProps {
  userAddress: string;
  onSetupComplete: (account: any, address: string) => void;
}

export default function RealSmartAccountSetup({ userAddress, onSetupComplete }: RealSmartAccountSetupProps) {
  const { smartAccount, isDeployed, isLoading, error, balance, initializeSmartAccount } = useRealSmartAccount();
  const [setupStep, setSetupStep] = useState<'init' | 'deploying' | 'complete'>('init');

  useEffect(() => {
    if (userAddress && setupStep === 'init') {
      handleInitialize();
    }
  }, [userAddress]);

  const handleInitialize = async () => {
    try {
      setSetupStep('deploying');
      const result = await initializeSmartAccount(userAddress);
      
      if (result) {
        setSetupStep('complete');
        onSetupComplete(result.account, result.address);
      }
    } catch (err) {
      console.error('Smart Account setup failed:', err);
      setSetupStep('init');
    }
  };

  if (setupStep === 'complete') {
    return null; // Setup complete, hide component
  }

  return (
    <div className="glass p-6 rounded-xl border border-white/10">
      <div className="flex items-center space-x-4 mb-6">
        <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-pink-600 rounded-lg flex items-center justify-center">
          <span className="text-2xl">🔐</span>
        </div>
        <div>
          <h2 className="text-xl font-bold text-white">Real Smart Account Setup</h2>
          <p className="text-gray-400">Deploy your smart account on Monad Testnet</p>
        </div>
      </div>

      {error && (
        <div className="bg-red-500/20 border border-red-500/50 text-red-400 p-4 rounded-lg mb-6">
          <p className="font-semibold">Setup Error:</p>
          <p className="text-sm">{error}</p>
        </div>
      )}

      <div className="space-y-4">
        <div className="flex items-center justify-between p-4 bg-gray-800/50 rounded-lg">
          <div>
            <p className="text-white font-medium">User Address</p>
            <p className="text-gray-400 text-sm font-mono">{userAddress}</p>
          </div>
          <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center">
            <span className="text-white text-xs">✓</span>
          </div>
        </div>

        <div className="flex items-center justify-between p-4 bg-gray-800/50 rounded-lg">
          <div>
            <p className="text-white font-medium">Smart Account</p>
            <p className="text-gray-400 text-sm">
              {setupStep === 'init' && 'Waiting to initialize...'}
              {setupStep === 'deploying' && 'Initializing smart account...'}
              {smartAccount && (
                <span className="font-mono">{smartAccount.address}</span>
              )}
            </p>
          </div>
          <div className={`w-6 h-6 rounded-full flex items-center justify-center ${
            setupStep === 'deploying' ? 'bg-yellow-500' : 
            smartAccount ? 'bg-green-500' : 'bg-gray-500'
          }`}>
            {setupStep === 'deploying' ? (
              <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
            ) : smartAccount ? (
              <span className="text-white text-xs">✓</span>
            ) : (
              <span className="text-white text-xs">○</span>
            )}
          </div>
        </div>

        <div className="flex items-center justify-between p-4 bg-gray-800/50 rounded-lg">
          <div>
            <p className="text-white font-medium">Balance</p>
            <p className="text-gray-400 text-sm">
              {balance !== '0' ? `${(parseInt(balance) / 1e18).toFixed(4)} MON` : 'Loading...'}
            </p>
          </div>
          <div className={`w-6 h-6 rounded-full flex items-center justify-center ${
            balance !== '0' ? 'bg-green-500' : 'bg-gray-500'
          }`}>
            {balance !== '0' ? (
              <span className="text-white text-xs">✓</span>
            ) : (
              <span className="text-white text-xs">○</span>
            )}
          </div>
        </div>
      </div>

      {setupStep === 'init' && !isLoading && (
        <button
          onClick={handleInitialize}
          className="w-full mt-6 bg-gradient-to-r from-purple-500 to-pink-600 hover:from-purple-600 hover:to-pink-700 text-white py-3 rounded-lg font-semibold transition-all"
        >
          Initialize Smart Account
        </button>
      )}

      {isLoading && (
        <div className="mt-6 text-center">
          <div className="inline-flex items-center space-x-2 text-blue-400">
            <div className="w-4 h-4 border-2 border-blue-400 border-t-transparent rounded-full animate-spin"></div>
            <span>Setting up your smart account...</span>
          </div>
        </div>
      )}

      <div className="mt-6 p-4 bg-blue-500/10 border border-blue-500/30 rounded-lg">
        <p className="text-blue-400 text-sm">
          <strong>Real Mode:</strong> This will create an actual smart account on Monad Testnet. 
          Make sure you have MON tokens for gas fees.
        </p>
      </div>
    </div>
  );
}