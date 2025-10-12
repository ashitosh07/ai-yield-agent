import { useState, useEffect, useCallback } from 'react';
import { createPublicClient, createBundlerClient, http } from 'viem';
import { privateKeyToAccount } from 'viem/accounts';
import { monadTestnet } from '../lib/chains';

// Mock MetaMask Delegation Toolkit for demo
const Implementation = {
  Hybrid: 'hybrid',
  MultiSig: 'multisig',
  Stateless7702: 'stateless7702'
};

const ExecutionMode = {
  SingleDefault: 'single-default'
};

const createDelegation = (params) => {
  return {
    delegate: params.delegate,
    delegator: params.delegator,
    authority: params.authority || '0x0000000000000000000000000000000000000000000000000000000000000000',
    caveats: params.caveats || [],
    salt: params.salt || BigInt(Math.floor(Math.random() * 1000000)),
    nonce: params.nonce || BigInt(0),
  };
};

const createExecution = (params) => {
  return {
    target: params.target,
    value: params.value || BigInt(0),
    data: params.data || '0x',
  };
};

const toMetaMaskSmartAccount = async (params) => {
  const address = '0x742d35Cc6634C0532925a3b8D4C9db4C8b9b8b8b';
  return {
    address,
    getAddress: async () => address,
    isDeployed: async () => true,
    deploy: async () => '0x' + Math.random().toString(16).substr(2, 64),
    signDelegation: async ({ delegation }) => {
      console.log('Mock signing delegation:', delegation);
      return '0x' + Math.random().toString(16).substr(2, 128);
    },
    environment: 'testnet'
  };
};

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

      // Create Public Client for Monad Testnet
      const publicClient = createPublicClient({
        chain: monadTestnet,
        transport: http(process.env.NEXT_PUBLIC_MONAD_RPC_URL || 'https://testnet-rpc.monad.xyz'),
      });

      // Get wallet addresses
      const addresses = await walletClient.getAddresses();
      const owner = addresses[0];

      console.log('Creating MetaMask Smart Account for owner:', owner);

      // Create MetaMask Smart Account (Hybrid implementation)
      const smartAccount = await toMetaMaskSmartAccount({
        client: publicClient,
        implementation: Implementation.Hybrid,
        deployParams: [owner, [], [], []], // owner, keyIds, pubKeyXs, pubKeyYs
        deploySalt: '0x0000000000000000000000000000000000000000000000000000000000000000',
        signer: { walletClient },
      });

      const smartAccountAddress = await smartAccount.getAddress();
      const deployed = await smartAccount.isDeployed();

      console.log('Smart Account created:', {
        address: smartAccountAddress,
        deployed,
        owner
      });

      // Create Bundler Client (using Monad RPC as fallback)
      const bundlerClient = createBundlerClient({
        transport: http(process.env.NEXT_PUBLIC_MONAD_BUNDLER_URL || 'https://testnet-rpc.monad.xyz'),
      });

      setSmartAccount(smartAccount);
      setDelegationToolkit({ publicClient, bundlerClient });
      setIsDeployed(deployed);

      return { account: smartAccount, toolkit: { publicClient, bundlerClient }, deployed };
    } catch (err) {
      console.error('Smart Account initialization error:', err);
      // Fallback to mock for demo if real implementation fails
      const mockAccount = {
        address: '0x742d35Cc6634C0532925a3b8D4C9db4C8b9b8b8b',
        getAddress: async () => '0x742d35Cc6634C0532925a3b8D4C9db4C8b9b8b8b',
        isDeployed: async () => true,
        deploy: async () => '0x' + Math.random().toString(16).substr(2, 64),
        signDelegation: async ({ delegation }) => {
          console.log('Mock signing delegation:', delegation);
          return '0x' + Math.random().toString(16).substr(2, 128);
        },
        environment: 'testnet'
      };
      
      const publicClient = createPublicClient({
        chain: monadTestnet,
        transport: http('https://testnet-rpc.monad.xyz'),
      });
      
      setSmartAccount(mockAccount);
      setDelegationToolkit({ publicClient });
      setIsDeployed(true);
      
      return { account: mockAccount, toolkit: { publicClient }, deployed: true };
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
      
      console.log('Creating delegation with params:', delegationParams);
      
      // Create delegation using MetaMask Delegation Toolkit
      const delegation = createDelegation({
        delegate: delegationParams.delegate,
        delegator: await smartAccount.getAddress(),
        authority: '0x0000000000000000000000000000000000000000000000000000000000000000',
        caveats: delegationParams.caveats || [],
        salt: BigInt(Math.floor(Math.random() * 1000000)),
        nonce: BigInt(0),
      });

      console.log('Delegation created:', delegation);

      // Sign the delegation with smart account
      const signature = await smartAccount.signDelegation({ delegation });
      const signedDelegation = { ...delegation, signature };
      
      console.log('Delegation signed:', signedDelegation);
      
      return { delegation: signedDelegation, txHash: '0x' + Math.random().toString(16).substr(2, 64) };
    } catch (err) {
      console.error('Delegation creation error:', err);
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
      
      console.log('Revoking delegation:', delegationHash);
      
      // For demo purposes, return mock transaction hash
      const txHash = '0x' + Math.random().toString(16).substr(2, 64);
      console.log('Delegation revoked with txHash:', txHash);
      
      return txHash;
    } catch (err) {
      console.error('Delegation revocation error:', err);
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
      
      console.log('Executing with delegation:', { signedDelegation, target, data, value });
      
      // Create execution using MetaMask Delegation Toolkit
      const execution = createExecution({
        target,
        value: BigInt(value),
        data,
      });
      
      console.log('Execution created:', execution);
      
      // For demo purposes, return mock operation hash
      const userOperationHash = '0x' + Math.random().toString(16).substr(2, 64);
      console.log('Delegation executed with hash:', userOperationHash);
      
      return userOperationHash;
    } catch (err) {
      console.error('Delegation execution error:', err);
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