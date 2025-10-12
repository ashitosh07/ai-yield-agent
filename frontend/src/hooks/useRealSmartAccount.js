import { useState, useEffect, useCallback } from 'react';
import { realSmartAccountService } from '../lib/realSmartAccount';

export function useRealSmartAccount() {
  const [smartAccount, setSmartAccount] = useState(null);
  const [isDeployed, setIsDeployed] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [balance, setBalance] = useState('0');

  const initializeSmartAccount = useCallback(async (userAddress) => {
    try {
      setIsLoading(true);
      setError(null);

      console.log('🔄 Initializing Real Smart Account for:', userAddress);

      const result = await realSmartAccountService.initialize(userAddress);
      
      setSmartAccount(result.account);
      setIsDeployed(result.deployed);
      
      // Get balance
      const accountInfo = await realSmartAccountService.getAccountInfo();
      setBalance(accountInfo.balance);

      console.log('✅ Real Smart Account initialized:', {
        address: result.address,
        deployed: result.deployed,
        balance: accountInfo.balance
      });

      return result;
    } catch (err) {
      console.error('❌ Real Smart Account initialization failed:', err);
      setError(err.message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const createDelegation = useCallback(async (delegationParams) => {
    if (!smartAccount) {
      throw new Error('Smart account not initialized');
    }

    try {
      setIsLoading(true);
      setError(null);
      
      console.log('🔄 Creating real delegation with params:', delegationParams);
      
      // Extract parameters from caveats or use direct params
      const tokenAddress = delegationParams.caveats?.find(c => c.type === 'AllowedTargets')?.value[0] 
        || delegationParams.tokenAddress 
        || '0xf817257fed379853cDe0fa4F97AB987181B1E5Ea'; // Default test token
        
      const maxAmount = BigInt(
        delegationParams.caveats?.find(c => c.type === 'MaxAmount')?.value 
        || delegationParams.maxAmount 
        || '1000000000000000000' // 1 token
      );
      
      const result = await realSmartAccountService.createDelegation({
        delegate: delegationParams.delegate,
        tokenAddress,
        maxAmount,
        expiry: delegationParams.expiry
      });
      
      console.log('✅ Real delegation created successfully:', result.hash);
      
      return { delegation: result.delegation, txHash: result.hash };
    } catch (err) {
      console.error('❌ Real delegation creation failed:', err);
      setError(err.message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [smartAccount]);

  const executeWithDelegation = useCallback(async (signedDelegation, target, data, value = 0) => {
    if (!smartAccount) throw new Error('Smart account not initialized');

    try {
      setIsLoading(true);
      setError(null);
      
      console.log('🔄 Executing real delegation:', { signedDelegation, target, data, value });
      
      const txHash = await realSmartAccountService.executeDelegation(
        signedDelegation,
        target,
        data,
        BigInt(value)
      );
      
      console.log('✅ Real delegation executed:', txHash);
      
      // Refresh balance after execution
      const accountInfo = await realSmartAccountService.getAccountInfo();
      setBalance(accountInfo.balance);
      
      return txHash;
    } catch (err) {
      console.error('❌ Real delegation execution failed:', err);
      setError(err.message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [smartAccount]);

  const refreshBalance = useCallback(async () => {
    if (!smartAccount) return;
    
    try {
      const accountInfo = await realSmartAccountService.getAccountInfo();
      setBalance(accountInfo.balance);
    } catch (err) {
      console.error('❌ Failed to refresh balance:', err);
    }
  }, [smartAccount]);

  return {
    smartAccount,
    isDeployed,
    isLoading,
    error,
    balance,
    initializeSmartAccount,
    createDelegation,
    executeWithDelegation,
    refreshBalance,
  };
}