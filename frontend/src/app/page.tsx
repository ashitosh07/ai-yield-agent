'use client';

import { useState } from 'react';
import { useAccount, useConnect, useDisconnect } from 'wagmi';
import SmartAccountSetup from '../components/SmartAccountSetup';
import DelegationManager from '../components/DelegationManager';
import { YieldDashboard } from '../components/YieldDashboard';
import { AuditLog } from '../components/AuditLog';
import { ConnectWallet } from '../components/ConnectWallet';
import { FarcasterIntegration } from '../components/FarcasterIntegration';
import { EnvioRealTime } from '../components/EnvioRealTime';
import { SimpleDashboard } from '../components/SimpleDashboard';
import { ClientOnly } from '../components/ClientOnly';

export default function Home() {
  const { address, isConnected } = useAccount();
  const { disconnect } = useDisconnect();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [smartAccount, setSmartAccount] = useState(null);
  const [smartAccountAddress, setSmartAccountAddress] = useState(null);
  const [setupComplete, setSetupComplete] = useState(false);

  if (!isConnected) {
    return <ConnectWallet />;
  }

  return (
    <ClientOnly fallback={<div className="min-h-screen bg-gray-900 flex items-center justify-center"><div className="text-white">Loading...</div></div>}>
      <div className="min-h-screen bg-gray-900 bg-grid">
        {/* Advanced Navigation */}
        <nav className="glass border-b border-white/10 sticky top-0 z-50">
          <div className="container mx-auto px-6 py-4">
            <div className="flex justify-between items-center">
              <div className="flex items-center space-x-4">
                <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                  <span className="text-white font-bold text-xl">🤖</span>
                </div>
                <div>
                  <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
                    AI Yield Agent
                  </h1>
                  <p className="text-xs text-gray-400">Autonomous DeFi Optimization</p>
                </div>
              </div>
              
              <div className="flex items-center space-x-4">
                <div className="glass px-3 py-2 rounded-lg">
                  <div className="text-gray-400 text-sm">EOA:</div>
                  <div className="text-white font-mono text-xs">{address?.slice(0, 6)}...{address?.slice(-4)}</div>
                  {smartAccountAddress && (
                    <>
                      <div className="text-blue-400 text-sm mt-1">Smart Account:</div>
                      <div className="text-blue-300 font-mono text-xs">{smartAccountAddress.slice(0, 6)}...{smartAccountAddress.slice(-4)}</div>
                    </>
                  )}
                </div>
                <button
                  onClick={() => disconnect()}
                  className="bg-red-500/20 hover:bg-red-500/30 border border-red-500/50 text-red-400 px-4 py-2 rounded-lg transition-all"
                >
                  Disconnect
                </button>
              </div>
            </div>
          </div>
        </nav>

        <div className="container mx-auto px-6 py-8">
          {/* Smart Account Setup */}
          {!setupComplete && (
            <div className="mb-8">
              <SmartAccountSetup 
                onSetupComplete={(account, address) => {
                  setSmartAccount(account);
                  setSmartAccountAddress(address);
                  setSetupComplete(true);
                }}
              />
            </div>
          )}

          {/* Advanced Tab Navigation - Always show for demo */}
          {true && (
            <>
              <div className="flex space-x-2 mb-8 glass p-2 rounded-xl w-fit">
                {[
                  { id: 'dashboard', label: 'Dashboard', icon: '📊' },
                  { id: 'delegations', label: 'Delegations', icon: '🔐' },
                  { id: 'audit', label: 'Audit Log', icon: '📋' },
                  { id: 'farcaster', label: 'Social', icon: '🎭' },
                  { id: 'envio', label: 'Envio', icon: '⚡' }
                ].map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`px-6 py-3 rounded-lg transition-all flex items-center space-x-2 ${
                      activeTab === tab.id
                        ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white shadow-lg'
                        : 'text-gray-400 hover:text-white hover:bg-white/5'
                    }`}
                  >
                    <span>{tab.icon}</span>
                    <span className="font-medium">{tab.label}</span>
                  </button>
                ))}
              </div>

              {/* Content with animations */}
              <div className="animate-fade-in">
                {activeTab === 'dashboard' && <SimpleDashboard />}
                {activeTab === 'delegations' && <DelegationManager smartAccount={smartAccount} />}
                {activeTab === 'audit' && <AuditLog />}
                {activeTab === 'farcaster' && <FarcasterIntegration />}
                {activeTab === 'envio' && <EnvioRealTime />}
              </div>
            </>
          )}
          
          {/* Show setup completion button if not complete */}
          {!setupComplete && (
            <div className="mb-8 text-center">
              <button
                onClick={() => {
                  setSmartAccount({ address: '0x742d35Cc6634C0532925a3b8D4C9db4C8b9b8b8b' });
                  setSmartAccountAddress('0x742d35Cc6634C0532925a3b8D4C9db4C8b9b8b8b');
                  setSetupComplete(true);
                }}
                className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700"
              >
                Skip Setup & Show Full UI
              </button>
            </div>
          )}
        </div>
      </div>
    </ClientOnly>
  );
}