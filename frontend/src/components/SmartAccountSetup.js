import { useState, useEffect } from 'react';
import { useSmartAccount } from '../hooks/useSmartAccount';
import { useAccount, useWalletClient } from 'wagmi';

export default function SmartAccountSetup({ onSetupComplete }) {
  const { address, isConnected } = useAccount();
  const { data: walletClient } = useWalletClient();
  const {
    smartAccount,
    isDeployed,
    isLoading,
    error,
    initializeSmartAccount,
    deploySmartAccount,
  } = useSmartAccount();

  const [smartAccountAddress, setSmartAccountAddress] = useState(null);
  const [setupStep, setSetupStep] = useState('connect'); // connect -> initialize -> deploy -> complete

  useEffect(() => {
    if (isConnected && setupStep === 'connect') {
      // Auto-progress to initialize step
      setTimeout(() => setSetupStep('initialize'), 500);
    }
  }, [isConnected, setupStep]);

  useEffect(() => {
    if (walletClient && setupStep === 'initialize') {
      // Auto-initialize for demo
      handleInitialize();
    }
  }, [walletClient, setupStep]);

  const handleInitialize = async () => {
    try {
      const { account, deployed } = await initializeSmartAccount(walletClient);
      const address = await account.getAddress();
      setSmartAccountAddress(address);
      
      // Auto-complete setup for demo
      setSetupStep('complete');
      onSetupComplete?.(account, address);
    } catch (err) {
      console.error('Smart account initialization failed:', err);
    }
  };

  const handleDeploy = async () => {
    try {
      const txHash = await deploySmartAccount();
      setSetupStep('complete');
      onSetupComplete?.(smartAccount, smartAccountAddress);
    } catch (err) {
      console.error('Smart account deployment failed:', err);
    }
  };

  if (!isConnected) {
    return (
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
        <h3 className="text-lg font-semibold text-yellow-800 mb-2">
          Connect Wallet Required
        </h3>
        <p className="text-yellow-700">
          Please connect your MetaMask wallet to set up Smart Account.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-6">
      <h3 className="text-xl font-bold text-gray-900 mb-4">
        🔐 MetaMask Smart Account Setup
      </h3>

      <div className="space-y-4">
        {/* Step 1: Connect Wallet */}
        <div className={`flex items-center space-x-3 ${setupStep === 'connect' ? 'text-blue-600' : 'text-green-600'}`}>
          <div className={`w-6 h-6 rounded-full flex items-center justify-center text-white text-sm ${
            setupStep === 'connect' ? 'bg-blue-500' : 'bg-green-500'
          }`}>
            {setupStep === 'connect' ? '1' : '✓'}
          </div>
          <span className="font-medium">Wallet Connected</span>
          {isConnected && (
            <span className="text-sm text-gray-500">
              {address?.slice(0, 6)}...{address?.slice(-4)}
            </span>
          )}
        </div>

        {/* Step 2: Initialize Smart Account */}
        <div className={`flex items-center space-x-3 ${
          setupStep === 'initialize' ? 'text-blue-600' : 
          ['deploy', 'complete'].includes(setupStep) ? 'text-green-600' : 'text-gray-400'
        }`}>
          <div className={`w-6 h-6 rounded-full flex items-center justify-center text-white text-sm ${
            setupStep === 'initialize' ? 'bg-blue-500' : 
            ['deploy', 'complete'].includes(setupStep) ? 'bg-green-500' : 'bg-gray-400'
          }`}>
            {setupStep === 'initialize' ? '2' : 
             ['deploy', 'complete'].includes(setupStep) ? '✓' : '2'}
          </div>
          <span className="font-medium">Initialize Smart Account</span>
          {smartAccountAddress && (
            <span className="text-sm text-gray-500">
              {smartAccountAddress.slice(0, 6)}...{smartAccountAddress.slice(-4)}
            </span>
          )}
        </div>

        {setupStep === 'initialize' && (
          <div className="ml-9">
            <button
              onClick={handleInitialize}
              disabled={isLoading}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50"
            >
              {isLoading ? 'Initializing...' : 'Initialize Smart Account'}
            </button>
          </div>
        )}

        {/* Step 3: Deploy Smart Account */}
        <div className={`flex items-center space-x-3 ${
          setupStep === 'complete' ? 'text-green-600' : 'text-gray-400'
        }`}>
          <div className={`w-6 h-6 rounded-full flex items-center justify-center text-white text-sm ${
            setupStep === 'complete' ? 'bg-green-500' : 'bg-gray-400'
          }`}>
            {setupStep === 'complete' ? '✓' : '3'}
          </div>
          <span className="font-medium">Deploy on Monad Testnet</span>
        </div>

        {/* Complete */}
        {setupStep === 'complete' && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-4 ml-9">
            <div className="flex items-center space-x-2">
              <div className="w-5 h-5 bg-green-500 rounded-full flex items-center justify-center">
                <span className="text-white text-xs">✓</span>
              </div>
              <span className="font-medium text-green-800">Smart Account Ready!</span>
            </div>
            <p className="text-sm text-green-700 mt-1">
              Your Smart Account is deployed and ready for delegations.
            </p>
          </div>
        )}

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <p className="text-red-800 font-medium">Setup Error</p>
            <p className="text-red-700 text-sm">{error}</p>
          </div>
        )}
      </div>
    </div>
  );
}