'use client';

import { useState } from 'react';

const MON_TOKEN_ADDRESS = '0x8f5f1F5a93Be3C57f53f85B705f179F936dcDCea';

interface MONTokenCheckerProps {
  userAddress: string;
}

export function MONTokenChecker({ userAddress }: MONTokenCheckerProps) {
  const [balance, setBalance] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>('');

  const checkBalance = async () => {
    if (!window.ethereum) return;
    
    setLoading(true);
    setError('');
    
    try {
      console.log('🔍 Checking MON token balance...');
      
      // balanceOf(address) function call
      const balanceData = '0x70a08231' + userAddress.slice(2).padStart(64, '0');
      
      const result = await window.ethereum.request({
        method: 'eth_call',
        params: [{
          to: MON_TOKEN_ADDRESS,
          data: balanceData
        }, 'latest']
      });
      
      const balanceWei = BigInt(result);
      const balanceFormatted = (Number(balanceWei) / 1e18).toFixed(4);
      
      setBalance(balanceFormatted);
      console.log('✅ MON Balance:', balanceFormatted);
      
    } catch (err: any) {
      console.error('❌ Balance check failed:', err);
      setError(err.message || 'Failed to check balance');
    } finally {
      setLoading(false);
    }
  };

  const testTransfer = async () => {
    if (!window.ethereum) return;
    
    console.log('🧪 Testing MON transfer...');
    
    try {
      // Test with 0.001 MON
      const amount = '0.001';
      const amountWei = '0x' + (BigInt(Math.floor(parseFloat(amount) * 1e18))).toString(16);
      const testAddress = '0x742d35Cc6634C0532925a3b8D4C9db96590b5c8e';
      
      const transferData = '0xa9059cbb' + // transfer(address,uint256)
        testAddress.slice(2).padStart(64, '0') + // to address
        amountWei.slice(2).padStart(64, '0'); // amount
      
      console.log('📤 Transfer data:', transferData);
      console.log('📤 Amount Wei:', amountWei);
      console.log('📤 To address:', testAddress);
      
      const txHash = await window.ethereum.request({
        method: 'eth_sendTransaction',
        params: [{
          from: userAddress,
          to: MON_TOKEN_ADDRESS,
          data: transferData,
          gas: '0x7530' // 30000 gas
        }]
      });
      
      console.log('✅ Test transfer sent:', txHash);
      
    } catch (err: any) {
      console.error('❌ Test transfer failed:', err);
    }
  };

  return (
    <div className="glass p-6 rounded-xl border border-blue-500/30">
      <h3 className="text-xl font-bold text-white mb-4">MON Token Checker</h3>
      
      <div className="space-y-4">
        <div className="bg-white/5 p-4 rounded-lg">
          <div className="text-gray-400 text-sm">Contract Address</div>
          <div className="text-white font-mono text-sm">{MON_TOKEN_ADDRESS}</div>
        </div>
        
        <div className="bg-white/5 p-4 rounded-lg">
          <div className="text-gray-400 text-sm">Your Address</div>
          <div className="text-white font-mono text-sm">{userAddress}</div>
        </div>
        
        <div className="bg-white/5 p-4 rounded-lg">
          <div className="text-gray-400 text-sm">MON Balance</div>
          <div className="text-white font-bold text-lg">
            {loading ? 'Checking...' : balance ? `${balance} MON` : 'Click to check'}
          </div>
          {error && <div className="text-red-400 text-sm mt-1">{error}</div>}
        </div>
        
        <div className="flex space-x-4">
          <button
            onClick={checkBalance}
            disabled={loading}
            className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 text-white px-4 py-2 rounded-lg"
          >
            {loading ? 'Checking...' : 'Check Balance'}
          </button>
          
          <button
            onClick={testTransfer}
            className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg"
          >
            Test Transfer (0.001 MON)
          </button>
        </div>
      </div>
    </div>
  );
}