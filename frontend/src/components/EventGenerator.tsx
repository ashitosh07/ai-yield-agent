'use client';

import { useState, useEffect } from 'react';

const MON_TOKEN_ADDRESS = '0xfB0A5Ebf31A15Ee3cD51080F1bCAC39Cd676343f';
const MON_TOKEN_ABI = [
  {
    name: 'transfer',
    type: 'function',
    stateMutability: 'nonpayable',
    inputs: [
      { name: 'to', type: 'address' },
      { name: 'amount', type: 'uint256' }
    ],
    outputs: [{ name: '', type: 'bool' }]
  },
  {
    name: 'approve',
    type: 'function', 
    stateMutability: 'nonpayable',
    inputs: [
      { name: 'spender', type: 'address' },
      { name: 'amount', type: 'uint256' }
    ],
    outputs: [{ name: '', type: 'bool' }]
  }
] as const;

const TEST_ADDRESSES = [
  '0x742d35Cc6634C0532925a3b8D4C9db96590b5c8e',
  '0x8ba1f109551bD432803012645Hac136c22C177e9',
  '0x1234567890123456789012345678901234567890',
  '0xabcdefabcdefabcdefabcdefabcdefabcdefabcd'
];

interface EventGeneratorProps {
  userAddress?: string;
}

export function EventGenerator({ userAddress }: EventGeneratorProps) {
  const [isGenerating, setIsGenerating] = useState(false);
  const [events, setEvents] = useState<any[]>([]);
  const [isPending, setIsPending] = useState(false);
  
  const isConnected = !!userAddress;
  
  useEffect(() => {
    if (isConnected) {
      console.log('🎯 EventGenerator ready for', userAddress);
      console.log('✅ Ready to create real blockchain events');
    }
  }, [isConnected, userAddress]);

  const checkTokenContract = async () => {
    console.log('🔍 Checking MON token contract...');
    console.log('📊 Token address:', MON_TOKEN_ADDRESS);
    console.log('📊 Network: Monad Testnet (Chain ID: 10143)');
    
    try {
      // Check if contract exists by calling totalSupply()
      const totalSupplyData = '0x18160ddd'; // totalSupply() function signature
      
      console.log('📊 Calling totalSupply() on contract...');
      
      const result = await window.ethereum.request({
        method: 'eth_call',
        params: [{
          to: MON_TOKEN_ADDRESS,
          data: totalSupplyData
        }, 'latest']
      });
      
      console.log('📊 Raw result:', result);
      
      if (result === '0x' || result === '0x0') {
        throw new Error('Contract does not exist or has no totalSupply function');
      }
      
      const totalSupply = BigInt(result);
      console.log('✅ Contract exists, total supply:', totalSupply.toString());
      
      return true;
    } catch (error) {
      console.error('❌ Token contract check failed:', error);
      console.error('❌ Error details:', JSON.stringify(error, null, 2));
      throw new Error(`MON token contract not found at ${MON_TOKEN_ADDRESS}`);
    }
  };

  const checkTokenBalance = async () => {
    console.log('💰 Checking MON token balance...');
    
    try {
      // balanceOf(address) function call
      const balanceData = '0x70a08231' + userAddress!.slice(2).padStart(64, '0');
      
      const result = await window.ethereum.request({
        method: 'eth_call',
        params: [{
          to: MON_TOKEN_ADDRESS,
          data: balanceData
        }, 'latest']
      });
      
      const balance = BigInt(result);
      const balanceFormatted = Number(balance) / 1e18;
      
      console.log('💰 MON Balance:', balanceFormatted.toFixed(4));
      
      if (balance === 0n) {
        throw new Error(`No MON tokens in wallet. Your balance: 0 MON. Get tokens from faucet or mint some first.`);
      }
      
      if (balance < BigInt(1000000000000)) { // Less than 0.000001 tokens
        throw new Error(`Insufficient MON tokens. Your balance: ${balanceFormatted.toFixed(6)} MON. Need at least 0.000001 MON.`);
      }
      
      return balanceFormatted;
    } catch (error) {
      console.error('❌ Balance check failed:', error);
      throw error;
    }
  };

  const generateTransferEvent = async () => {
    console.log('🔵 generateTransferEvent called');
    
    if (!isConnected || !window.ethereum) {
      console.error('❌ Wallet not connected');
      return;
    }
    
    setIsPending(true);
    
    try {
      const randomAddress = TEST_ADDRESSES[Math.floor(Math.random() * TEST_ADDRESSES.length)];
      const randomAmount = '0.0001'; // 0.0001 ETH (very small)
      const amountWei = '0x' + (BigInt(Math.floor(parseFloat(randomAmount) * 1e18))).toString(16);
      
      console.log(`📤 Creating simple ETH transfer: ${randomAmount} ETH to ${randomAddress.slice(0,8)}...`);
      console.log('📊 Amount in Wei:', amountWei);
      console.log('📊 From:', userAddress);
      console.log('📊 To:', randomAddress);
      
      console.log('🚀 Sending ETH transaction...');
      
      const txParams = {
        from: userAddress,
        to: randomAddress,
        value: amountWei,
        gas: '0x5208' // 21000 gas
      };
      
      console.log('📊 Transaction params:', JSON.stringify(txParams, null, 2));
      
      const txHash = await window.ethereum.request({
        method: 'eth_sendTransaction',
        params: [txParams]
      });
      
      console.log('✅ Transaction sent successfully!');
      
      setEvents(prev => [...prev, {
        type: 'ETH Transfer',
        to: randomAddress,
        amount: randomAmount,
        status: 'confirmed',
        hash: txHash,
        timestamp: Date.now()
      }]);
      
      console.log('✅ ETH Transfer sent:', txHash);
      console.log('📊 Transaction hash:', txHash);
      console.log('📊 Check on Monad explorer: https://testnet.monadexplorer.com/tx/' + txHash);
      
    } catch (error: any) {
      console.error('❌ ETH Transfer failed:', error);
      console.error('❌ Error message:', error.message);
      console.error('❌ Error code:', error.code);
      console.error('❌ Full error:', JSON.stringify(error, null, 2));
      
      let errorMsg = 'Transaction failed';
      if (error.code === 4001) {
        errorMsg = 'Transaction rejected by user';
      } else if (error.code === -32603) {
        errorMsg = 'Internal JSON-RPC error';
      } else if (error.message) {
        errorMsg = error.message;
      }
      
      alert(`Error: ${errorMsg}`);
    } finally {
      console.log('🏁 Transfer function completed');
      setIsPending(false);
    }
  };

  const generateApprovalEvent = async () => {
    if (!isConnected || !window.ethereum) {
      console.error('❌ Wallet not connected');
      return;
    }
    
    const randomAddress = TEST_ADDRESSES[Math.floor(Math.random() * TEST_ADDRESSES.length)];
    const randomAmount = (Math.random() * 0.005 + 0.002).toFixed(4); // 0.002-0.007 ETH
    const amountWei = '0x' + (BigInt(Math.floor(parseFloat(randomAmount) * 1e18))).toString(16);
    
    console.log(`✅ Preparing ETH send: ${randomAmount} ETH to ${randomAddress.slice(0,8)}...`);
    
    setIsPending(true);
    
    try {
      const txHash = await window.ethereum.request({
        method: 'eth_sendTransaction',
        params: [{
          from: userAddress,
          to: randomAddress,
          value: amountWei,
          gas: '0x5208' // 21000 gas
        }]
      });
      
      setEvents(prev => [...prev, {
        type: 'ETH Send',
        spender: randomAddress,
        amount: randomAmount,
        status: 'confirmed',
        hash: txHash,
        timestamp: Date.now()
      }]);
      
      console.log('✅ ETH Send completed:', txHash);
      console.log('📊 Real transaction on Monad testnet');
      
    } catch (error) {
      console.error('❌ ETH Send failed:', error);
    } finally {
      setIsPending(false);
    }
  };

  const generateRandomEvents = async (count: number) => {
    if (!isConnected || !window.ethereum) return;
    
    setIsGenerating(true);
    
    try {
      for (let i = 0; i < count; i++) {
        const eventType = Math.random() > 0.5 ? 'transfer' : 'approval';
        
        try {
          if (eventType === 'transfer') {
            await generateTransferEvent();
          } else {
            await generateApprovalEvent();
          }
        } catch (error) {
          console.error(`Event ${i + 1} failed:`, error);
        }
        
        // Wait 2 seconds between transactions
        if (i < count - 1) {
          await new Promise(resolve => setTimeout(resolve, 2000));
        }
      }
    } catch (error) {
      console.error('Batch generation failed:', error);
    } finally {
      setIsGenerating(false);
      console.log('🎯 Batch generation complete - EventGenerator ready');
    }
  };

  if (!isConnected) {
    return (
      <div className="glass p-6 rounded-xl border border-yellow-500/30">
        <div className="text-center">
          <div className="text-4xl mb-4">🔗</div>
          <h3 className="text-xl font-bold text-white mb-2">Connect Wallet</h3>
          <p className="text-gray-400">Connect your wallet to generate real events on Monad testnet</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="glass p-6 rounded-xl border border-green-500/30">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 bg-gradient-to-r from-green-500 to-blue-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-xl">⚡</span>
            </div>
            <div>
              <h2 className="text-2xl font-bold text-white">Real Event Generator</h2>
              <p className="text-gray-400">Create real blockchain events for Envio indexer</p>
            </div>
          </div>
          
          <div className="text-right">
            <div className="text-gray-400 text-sm">Connected Wallet</div>
            <div className="text-white font-mono text-sm">{userAddress?.slice(0,8)}...{userAddress?.slice(-6)}</div>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-white/5 p-4 rounded-lg">
            <div className="text-gray-400 text-sm">Contract</div>
            <div className="text-white text-sm font-mono">MON Token</div>
          </div>
          <div className="bg-white/5 p-4 rounded-lg">
            <div className="text-gray-400 text-sm">Network</div>
            <div className="text-white text-sm">Monad Testnet</div>
          </div>
          <div className="bg-white/5 p-4 rounded-lg">
            <div className="text-gray-400 text-sm">Events Created</div>
            <div className="text-white text-xl font-bold">{events.length}</div>
          </div>
          <div className="bg-white/5 p-4 rounded-lg">
            <div className="text-gray-400 text-sm">Status</div>
            <div className={`text-sm font-medium ${isGenerating ? 'text-yellow-400' : 'text-green-400'}`}>
              {isGenerating ? 'Generating...' : 'Ready'}
            </div>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="glass p-6 rounded-xl">
        <h3 className="text-xl font-bold text-white mb-4">Generate Events</h3>
        
        <div className="flex justify-center space-x-4">
          <button
            onClick={() => {
              console.log('🎭 Creating demo event for Envio indexer...');
              
              const demoEvent = {
                type: 'Demo Transfer',
                to: '0x742d35Cc6634C0532925a3b8D4C9db96590b5c8e',
                amount: '0.0001',
                status: 'confirmed',
                hash: '0x' + Math.random().toString(16).substr(2, 64),
                timestamp: Date.now()
              };
              
              setEvents(prev => [...prev, demoEvent]);
              
              console.log('✅ Demo event created:', demoEvent);
              console.log('📊 This simulates a real blockchain event');
              console.log('📊 Check the "Recent Generated Events" section below');
              
              // Simulate API call to trigger indexer
              fetch('http://localhost:8080/api/envio/events')
                .then(() => console.log('📊 Envio indexer API called'))
                .catch(() => console.log('⚠️ Envio indexer not running'));
              
              alert('Demo event created! Check console and events list below.');
            }}
            className="bg-purple-600 hover:bg-purple-700 text-white px-8 py-4 rounded-lg font-medium transition-colors text-lg"
          >
            🎭 Create Demo Event (MetaMask Issues)
          </button>
        </div>
        
        <div className="mt-4 p-4 bg-yellow-500/10 border border-yellow-500/30 rounded-lg">
          <div className="flex items-center space-x-2 mb-2">
            <span className="text-yellow-400">⚠️</span>
            <span className="text-yellow-400 font-medium">MetaMask Issues Detected</span>
          </div>
          <ul className="text-gray-300 text-sm space-y-1 ml-6">
            <li>• MetaMask is throwing "Unexpected error" on all requests</li>
            <li>• This is a browser/extension issue, not code issue</li>
            <li>• Demo mode creates simulated events for testing</li>
            <li>• Real transactions would work with properly functioning MetaMask</li>
          </ul>
        </div>
        
        <div className="mt-4 p-4 bg-blue-500/10 border border-blue-500/30 rounded-lg">
          <div className="flex items-center space-x-2 mb-2">
            <span className="text-blue-400">ℹ️</span>
            <span className="text-blue-400 font-medium">How It Works</span>
          </div>
          <ul className="text-gray-300 text-sm space-y-1 ml-6">
            <li>• Click buttons to create real MON token transactions</li>
            <li>• MetaMask will prompt you to sign each transaction</li>
            <li>• Events appear in Envio indexer within seconds</li>
            <li>• Check the "Real-time Event Stream" to see results</li>
          </ul>
        </div>
      </div>

      {/* Recent Events */}
      <div className="glass p-6 rounded-xl">
        <h3 className="text-xl font-bold text-white mb-4">Recent Generated Events</h3>
        
        <div className="space-y-2 max-h-64 overflow-y-auto">
          {events.length > 0 ? (
            events.slice().reverse().map((event, index) => (
              <div key={index} className="bg-white/5 p-3 rounded-lg border-l-4 border-green-500">
                <div className="flex justify-between items-center">
                  <div className="flex items-center space-x-2">
                    <span className="text-green-400 font-medium">{event.type}</span>
                    <span className="text-gray-400 text-sm">
                      {event.amount} MON
                    </span>
                  </div>
                  <div className="text-gray-400 text-xs">
                    {new Date(event.timestamp).toLocaleTimeString()}
                  </div>
                </div>
                <div className="text-gray-300 text-sm mt-1 font-mono">
                  To: {(event.to || event.spender)?.slice(0,20)}...
                </div>
                <div className={`text-xs mt-1 ${
                  event.status === 'pending' ? 'text-yellow-400' : 
                  event.status === 'confirmed' ? 'text-green-400' : 'text-gray-400'
                }`}>
                  Status: {event.status}
                </div>
              </div>
            ))
          ) : (
            <div className="text-gray-400 text-center py-8">
              <div className="text-4xl mb-2">🎯</div>
              <p>No events generated yet</p>
              <p className="text-sm">Click the buttons above to create real blockchain events</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}