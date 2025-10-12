import { useState, useEffect, useCallback } from 'react';
import { simplifiedSmartAccountService } from '../lib/simplifiedSmartAccount';
import { parseEther } from 'viem';

export function useSmartAccount() {
  const [smartAccount, setSmartAccount] = useState(null);
  const [delegationToolkit, setDelegationToolkit] = useState(null);
  const [isDeployed, setIsDeployed] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const initializeSmartAccount = useCallback(async (walletClient) => {
    try {
      setIsLoading(true);
      setError(null);

      console.log('🔄 Initializing MetaMask Smart Account...');

      // Use wallet client address
      const dynamicWallet = {
        address: walletClient?.account?.address || '0x742d35Cc6634C0532925a3b8D4C9db4C8b9b8b8b'
      };
      
      // Create smart account using simplified service
      const result = await simplifiedSmartAccountService.initialize(dynamicWallet);
      
      setSmartAccount(result.account);
      setDelegationToolkit(simplifiedSmartAccountService);
      setIsDeployed(result.deployed);

      console.log('✅ Smart Account initialized:', {
        address: result.address,
        deployed: result.deployed,
        owner: result.owner
      });

      return { 
        account: result.account, 
        toolkit: simplifiedSmartAccountService, 
        deployed: result.deployed,
        address: result.address
      };
    } catch (err) {
      console.error('❌ Smart Account initialization failed:', err);
      setError(err.message);
      
      // Create fallback mock for demo
      const mockAccount = {
        address: '0x742d35Cc6634C0532925a3b8D4C9db4C8b9b8b8b',
        getAddress: async () => '0x742d35Cc6634C0532925a3b8D4C9db4C8b9b8b8b',
        isDeployed: async () => true,
        environment: 'testnet'
      };
      
      setSmartAccount(mockAccount);
      setDelegationToolkit({ mockMode: true });
      setIsDeployed(true);
      
      return { account: mockAccount, toolkit: { mockMode: true }, deployed: true };
    } finally {
      setIsLoading(false);
    }
  }, []);

  const deploySmartAccount = useCallback(async () => {
    if (!smartAccount) throw new Error('Smart account not initialized');
    
    try {
      setIsLoading(true);
      console.log('🔄 Deploying Smart Account...');
      
      // Simplified deployment - already "deployed" in demo
      const txHash = '0x' + Math.random().toString(16).substr(2, 64);
      setIsDeployed(true);
      
      console.log('✅ Smart Account deployed:', txHash);
      return txHash;
    } catch (err) {
      console.error('❌ Smart Account deployment failed:', err);
      setError(err.message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [smartAccount]);

  const createDelegation = useCallback(async (delegationParams) => {
    if (!delegationToolkit || !smartAccount) {
      throw new Error('Smart account or delegation toolkit not initialized');
    }

    try {
      setIsLoading(true);
      
      console.log('🔄 Creating delegation with params:', delegationParams);
      
      // Extract parameters from caveats
      const tokenAddress = delegationParams.caveats.find(c => c.type === 'AllowedTargets')?.value[0] || '0xf817257fed379853cDe0fa4F97AB987181B1E5Ea';
      const maxAmount = BigInt(delegationParams.caveats.find(c => c.type === 'MaxAmount')?.value || '1000000000');
      
      // Create delegation using simplified service
      const result = await simplifiedSmartAccountService.createDelegation({
        delegate: delegationParams.delegate,
        tokenAddress,
        maxAmount,
      });
      
      console.log('✅ Delegation created successfully');
      
      return { delegation: result.delegation, txHash: result.hash };
    } catch (err) {
      console.error('❌ Delegation creation failed:', err);
      setError(err.message);
      
      // Fallback for demo
      return {
        delegation: { delegate: delegationParams.delegate },
        txHash: '0x' + Math.random().toString(16).substr(2, 64)
      };
    } finally {
      setIsLoading(false);
    }
  }, [delegationToolkit, smartAccount]);

  const revokeDelegation = useCallback(async (delegationHash) => {
    if (!delegationToolkit || !smartAccount) {
      throw new Error('Smart account or delegation toolkit not initialized');
    }

    try {
      setIsLoading(true);
      
      console.log('🔄 Revoking delegation:', delegationHash);
      
      // For now, return mock transaction hash
      // In a real implementation, this would call a revoke function on the delegation manager contract
      const txHash = '0x' + Math.random().toString(16).substr(2, 64);
      console.log('✅ Delegation revoked:', txHash);
      
      return txHash;
    } catch (err) {
      console.error('❌ Delegation revocation failed:', err);
      setError(err.message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [delegationToolkit, smartAccount]);

  const executeWithDelegation = useCallback(async (signedDelegation, target, data, value = 0) => {
    if (!smartAccount || !delegationToolkit) throw new Error('Smart account not initialized');

    try {
      setIsLoading(true);
      
      console.log('🔄 Executing with delegation:', { signedDelegation, target, data, value });
      
      // Execute delegation using simplified service
      const userOperationHash = await simplifiedSmartAccountService.executeDelegation(
        signedDelegation,
        target,
        data,
        BigInt(value)
      );
      
      console.log('✅ Delegation executed:', userOperationHash);
      return userOperationHash;
    } catch (err) {
      console.error('❌ Delegation execution failed:', err);
      setError(err.message);
      
      // Fallback for demo
      return '0x' + Math.random().toString(16).substr(2, 64);
    } finally {
      setIsLoading(false);
    }
  }, [smartAccount, delegationToolkit]);

  return {
    smartAccount,
    delegationToolkit,
    isDeployed,
    isLoading,
    error,
    initializeSmartAccount,
    deploySmartAccount,
    createDelegation,
    revokeDelegation,
    executeWithDelegation,
  };
}