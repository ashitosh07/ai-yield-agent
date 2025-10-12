'use client';

import { useState } from 'react';

export function FarcasterIntegration() {
  const address = '0x742d35Cc6634C0532925a3b8D4C9db4C8b9b8b8b';
  const [shareStatus, setShareStatus] = useState<string>('');

  const shareToFarcaster = async (type: 'portfolio' | 'delegation' | 'action', data?: any) => {
    try {
      setShareStatus('Sharing...');
      
      let frameUrl = '';
      let castText = '';
      
      switch (type) {
        case 'portfolio':
          frameUrl = `http://localhost:3006/frame/portfolio/${address}`;
          castText = '📊 Check out my AI-optimized DeFi portfolio! Real-time yield optimization on Monad 🤖';
          break;
        case 'delegation':
          frameUrl = `http://localhost:3006/frame/delegate`;
          castText = '🔐 Just created a secure delegation for AI yield optimization! Autonomous DeFi is here 🚀';
          break;
        case 'action':
          frameUrl = `http://localhost:3006/frame/approve/${data?.actionId || 'demo'}`;
          castText = `🤖 AI found a ${data?.improvement || '4.2'}% APY improvement opportunity! Should I execute? 🎯`;
          break;
      }

      // In a real implementation, this would use Farcaster API
      // For demo, we'll show the frame URL
      setShareStatus(`Frame ready: ${frameUrl}`);
      
      // Copy to clipboard for easy testing
      navigator.clipboard.writeText(frameUrl);
      
    } catch (error) {
      setShareStatus('Share failed');
    }
  };

  return (
    <div className="glass rounded-xl p-6">
      <h3 className="text-xl font-semibold text-white mb-4">🎭 Farcaster Integration</h3>
      
      <div className="space-y-4">
        <div className="bg-gray-800/50 p-4 rounded-lg">
          <h4 className="text-white font-semibold mb-2">Share Your Portfolio</h4>
          <p className="text-gray-400 text-sm mb-3">
            Create an interactive frame showing your AI-optimized portfolio
          </p>
          <button
            onClick={() => shareToFarcaster('portfolio')}
            className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg transition-all"
          >
            📊 Share Portfolio Frame
          </button>
        </div>

        <div className="bg-gray-800/50 p-4 rounded-lg">
          <h4 className="text-white font-semibold mb-2">Share Delegation</h4>
          <p className="text-gray-400 text-sm mb-3">
            Show others how to set up secure AI delegations
          </p>
          <button
            onClick={() => shareToFarcaster('delegation')}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-all"
          >
            🔐 Share Delegation Frame
          </button>
        </div>

        <div className="bg-gray-800/50 p-4 rounded-lg">
          <h4 className="text-white font-semibold mb-2">Share AI Action</h4>
          <p className="text-gray-400 text-sm mb-3">
            Let the community vote on AI rebalance proposals
          </p>
          <button
            onClick={() => shareToFarcaster('action', { actionId: 'demo-123', improvement: '4.2' })}
            className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg transition-all"
          >
            🤖 Share AI Action Frame
          </button>
        </div>

        {shareStatus && (
          <div className="bg-blue-900/30 border border-blue-500 p-3 rounded-lg">
            <p className="text-blue-400 text-sm">{shareStatus}</p>
            {shareStatus.includes('Frame ready') && (
              <p className="text-gray-400 text-xs mt-1">
                URL copied to clipboard! Paste in Farcaster to test the frame.
              </p>
            )}
          </div>
        )}

        <div className="bg-gray-700/50 p-4 rounded-lg border border-gray-600">
          <h4 className="text-white font-semibold mb-2">🧪 Test Frames</h4>
          <div className="space-y-2">
            <a
              href={`http://localhost:3006/frame/portfolio/${address}`}
              target="_blank"
              rel="noopener noreferrer"
              className="block text-blue-400 hover:text-blue-300 text-sm"
            >
              📊 Portfolio Frame →
            </a>
            <a
              href="http://localhost:3006/frame/delegate"
              target="_blank"
              rel="noopener noreferrer"
              className="block text-blue-400 hover:text-blue-300 text-sm"
            >
              🔐 Delegation Frame →
            </a>
            <a
              href="http://localhost:3006/frame/approve/demo-123"
              target="_blank"
              rel="noopener noreferrer"
              className="block text-blue-400 hover:text-blue-300 text-sm"
            >
              🤖 Action Approval Frame →
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}