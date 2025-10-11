'use client';

import { useState } from 'react';
import { useAccount, useConnect, useDisconnect } from 'wagmi';
import { DelegationManager } from '../components/DelegationManager';
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
                <span className="text-gray-400 text-sm">Connected:</span>
                <span className="text-white font-mono ml-2">{address?.slice(0, 6)}...{address?.slice(-4)}</span>
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
        {/* Advanced Tab Navigation */}
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
          {activeTab === 'delegations' && <DelegationManager />}
          {activeTab === 'audit' && <AuditLog />}
          {activeTab === 'farcaster' && <FarcasterIntegration />}
          {activeTab === 'envio' && <EnvioRealTime />}
        </div>
      </div>
    </ClientOnly>
  );
}