import { useState, useEffect, useCallback } from 'react';
import { 
  Implementation, 
  toMetaMaskSmartAccount, 
  createDelegation,
  createExecution,
  ExecutionMode
} from '@metamask/delegation-toolkit';
import { DelegationManager } from '@metamask/delegation-toolkit/contracts';
import { createPublicClient, createBundlerClient, http } from 'viem';
import { privateKeyToAccount } from 'viem/accounts';
import { monadTestnet } from '../config/monad';

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

      // Create Public Client
      const publicClient = createPublicClient({
        chain: monadTestnet,
        transport: http(),
      });

      // Create Bundler Client (fallback to mock for demo)
      const bundlerClient = {
        sendUserOperation: async (params) => {
          console.log('Mock bundler operation:', params);
          return '0x' + Math.random().toString(16).substr(2, 64);
        }
      };

      // Create mock Smart Account for demo
      const smartAccount = {
        address: '0x' + Math.random().toString(16).substr(2, 40),
        getAddress: async () => '0x' + Math.random().toString(16).substr(2, 40),
        isDeployed: async () => false,
        deploy: async () => '0x' + Math.random().toString(16).substr(2, 64),
        signDelegation: async ({ delegation }) => {
          console.log('Signing delegation:', delegation);
          return '0x' + Math.random().toString(16).substr(2, 128);
        },
        environment: 'testnet'
      };

      setSmartAccount(smartAccount);
      setDelegationToolkit({ publicClient, bundlerClient });
      setIsDeployed(false);

      return { account: smartAccount, toolkit: { publicClient, bundlerClient }, deployed: false };
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const deploySmartAccount = useCallback(async () => {
    if (!smartAccount) throw new Error('Smart account not initialized');
    
    try {
      setIsLoading(true);
      const txHash = await smartAccount.deploy();
      setIsDeployed(true);
      return txHash;
    } catch (err) {
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
      
      // Create delegation using official toolkit
      const delegation = createDelegation({
        to: delegationParams.delegate,
        from: smartAccount.address,
        environment: smartAccount.environment,
        scope: {
          type: 'erc20TransferAmount',
          tokenAddress: delegationParams.caveats.find(c => c.type === 'AllowedTargets')?.value[0] || '0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238',
          maxAmount: BigInt(delegationParams.caveats.find(c => c.type === 'MaxAmount')?.value || '1000000'),
        },
      });

      // Sign the delegation
      const signature = await smartAccount.signDelegation({ delegation });
      const signedDelegation = { ...delegation, signature };
      
      return { delegation: signedDelegation, txHash: '0x' + Math.random().toString(16).substr(2, 64) };
    } catch (err) {
      setError(err.message);
      throw err;
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
      
      const txHash = await smartAccount.sendUserOperation({
        target: monadTestnet.contracts.delegationManager,
        data: delegationToolkit.encodeRevocationData(delegationHash),
        value: 0,
      });
      return txHash;
    } catch (err) {
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
      
      const delegations = [signedDelegation];
      const executions = createExecution({ target });
      
      const redeemDelegationCalldata = DelegationManager.encode.redeemDelegations({
        delegations: [delegations],
        modes: [ExecutionMode.SingleDefault],
        executions: [executions],
      });

      const userOperationHash = await delegationToolkit.bundlerClient.sendUserOperation({
        account: smartAccount,
        calls: [{
          to: smartAccount.address,
          data: redeemDelegationCalldata,
        }],
        maxFeePerGas: 1n,
        maxPriorityFeePerGas: 1n,
      });
      
      return userOperationHash;
    } catch (err) {
      setError(err.message);
      throw err;
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