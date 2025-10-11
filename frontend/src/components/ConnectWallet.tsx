'use client';

import { useConnect } from 'wagmi';

export function ConnectWallet() {
  const { connect, connectors } = useConnect();

  return (
    <div className="min-h-screen bg-gray-900 bg-grid flex items-center justify-center relative overflow-hidden">
      {/* Animated background elements */}
      <div className="absolute inset-0">
        <div className="absolute top-20 left-20 w-72 h-72 bg-blue-500/10 rounded-full blur-3xl animate-float"></div>
        <div className="absolute bottom-20 right-20 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl animate-float" style={{animationDelay: '2s'}}></div>
        <div className="absolute top-1/2 left-1/2 w-64 h-64 bg-green-500/10 rounded-full blur-3xl animate-float" style={{animationDelay: '4s'}}></div>
      </div>

      <div className="relative z-10 text-center max-w-2xl mx-auto px-6">
        {/* Logo and branding */}
        <div className="mb-8">
          <div className="w-24 h-24 bg-gradient-to-r from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-6 animate-pulse-slow">
            <span className="text-4xl">🤖</span>
          </div>
          <h1 className="text-6xl font-bold bg-gradient-to-r from-blue-400 via-purple-400 to-green-400 bg-clip-text text-transparent mb-4">
            AI Yield Agent
          </h1>
          <p className="text-xl text-gray-400 mb-2">Autonomous DeFi Yield Optimization</p>
          <p className="text-gray-500">Powered by MetaMask Smart Accounts × Monad × Envio</p>
        </div>

        {/* Features showcase */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          <div className="glass p-6 rounded-xl">
            <div className="text-3xl mb-3">🧠</div>
            <h3 className="text-lg font-semibold text-white mb-2">AI-Powered</h3>
            <p className="text-gray-400 text-sm">Smart yield optimization with ML-based decisions</p>
          </div>
          <div className="glass p-6 rounded-xl">
            <div className="text-3xl mb-3">🔐</div>
            <h3 className="text-lg font-semibold text-white mb-2">Delegated</h3>
            <p className="text-gray-400 text-sm">Secure, scoped permissions with time limits</p>
          </div>
          <div className="glass p-6 rounded-xl">
            <div className="text-3xl mb-3">⚡</div>
            <h3 className="text-lg font-semibold text-white mb-2">Real-time</h3>
            <p className="text-gray-400 text-sm">Instant response to market changes via Envio</p>
          </div>
        </div>

        {/* Connect button */}
        <div className="space-y-4">
          <p className="text-gray-400 mb-6">Connect your wallet to start optimizing yields</p>
          {connectors.map((connector) => (
            <button
              key={connector.uid}
              onClick={() => connect({ connector })}
              className="group relative w-full max-w-md mx-auto block"
            >
              <div className="gradient-border">
                <div className="px-8 py-4 rounded-lg bg-gray-900 group-hover:bg-gray-800 transition-all">
                  <div className="flex items-center justify-center space-x-3">
                    <div className="w-8 h-8 bg-gradient-to-r from-orange-500 to-yellow-500 rounded-lg flex items-center justify-center">
                      <span className="text-white font-bold text-sm">M</span>
                    </div>
                    <span className="text-white font-semibold text-lg">Connect {connector.name}</span>
                  </div>
                  <p className="text-gray-400 text-sm mt-2">Deploy Smart Account on Monad Testnet</p>
                </div>
              </div>
            </button>
          ))}
        </div>

        {/* Footer info */}
        <div className="mt-12 text-center">
          <p className="text-gray-500 text-sm">
            Built for MetaMask Smart Accounts × Monad Dev Cook Off
          </p>
          <div className="flex justify-center space-x-6 mt-4 text-xs text-gray-600">
            <span>• ERC-4337 Account Abstraction</span>
            <span>• Delegation Toolkit</span>
            <span>• Envio HyperSync</span>
          </div>
        </div>
      </div>
    </div>
  );
}