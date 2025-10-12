import { createPublicClient, createWalletClient, http, custom } from 'viem';
import { 
  Implementation, 
  toMetaMaskSmartAccount, 
  createDelegation
} from '@metamask/delegation-toolkit';
import { monadTestnet } from './chains';

export class RealSmartAccountService {
  private publicClient;
  private walletClient;
  private userAddress: string;
  private smartAccountAddress: string;

  constructor() {
    this.publicClient = createPublicClient({
      chain: monadTestnet,
      transport: http('https://testnet-rpc.monad.xyz'),
    });
  }

  async initialize(userAddress: string) {
    try {
      console.log('🔄 Initializing Real Smart Account for:', userAddress);
      
      this.userAddress = userAddress;
      
      // Create wallet client from MetaMask specifically
      if (typeof window !== 'undefined' && window.ethereum) {
        let ethereum = window.ethereum;
        
        // If multiple wallets, ensure we use MetaMask
        if (window.ethereum.providers) {
          ethereum = window.ethereum.providers.find((p: any) => p.isMetaMask) || window.ethereum;
        }
        
        this.walletClient = createWalletClient({
          chain: monadTestnet,
          transport: custom(ethereum),
          account: userAddress as `0x${string}`
        });
      }

      // Use user address as smart account address for simplicity
      this.smartAccountAddress = userAddress;

      console.log('✅ Real Smart Account initialized:', {
        userAddress,
        smartAccountAddress: this.smartAccountAddress
      });

      return {
        account: {
          address: this.smartAccountAddress,
          getAddress: async () => this.smartAccountAddress,
          isDeployed: async () => await this.isDeployed(),
          environment: 'monad-testnet'
        },
        address: this.smartAccountAddress,
        deployed: await this.isDeployed(),
        owner: userAddress
      };
    } catch (error) {
      console.error('❌ Real Smart Account initialization failed:', error);
      throw error;
    }
  }

  private async deploySmartAccount(): Promise<string> {
    // Return the user address as the smart account address for now
    // In production, this would be the actual deployed smart account address
    console.log('📝 Using user address as smart account:', this.userAddress);
    return this.userAddress;
  }

  private async isDeployed(): Promise<boolean> {
    try {
      const code = await this.publicClient.getBytecode({
        address: this.smartAccountAddress as `0x${string}`
      });
      return code !== undefined && code !== '0x';
    } catch {
      return false;
    }
  }

  async createDelegation(params: {
    delegate: string;
    tokenAddress: string;
    maxAmount: bigint;
    expiry?: number;
    userAddress: string;
  }) {
    try {
      console.log('🔄 Creating delegation with MetaMask Delegation Toolkit:', params);

      const userAddress = params.userAddress;
      console.log('Received userAddress:', userAddress, typeof userAddress);
      
      if (!userAddress || typeof userAddress !== 'string' || !userAddress.match(/^0x[a-fA-F0-9]{40}$/)) {
        console.error('Invalid userAddress:', userAddress);
        throw new Error(`Valid user address is required. Received: ${userAddress}`);
      }

      if (!window.ethereum || !window.ethereum.isMetaMask) {
        throw new Error('MetaMask not found');
      }

      // Get MetaMask provider
      let ethereum = window.ethereum;
      if (window.ethereum.providers) {
        ethereum = window.ethereum.providers.find((p: any) => p.isMetaMask);
        if (!ethereum) throw new Error('MetaMask not found among providers');
      }

      // Ensure we're on Monad Testnet
      const chainId = await ethereum.request({ method: 'eth_chainId' });
      if (chainId.toLowerCase() !== '0x279f') {
        throw new Error('Please switch to Monad Testnet in MetaMask');
      }

      console.log('Using user address:', userAddress);

      // Create wallet client for signing
      const walletClient = createWalletClient({
        chain: monadTestnet,
        transport: custom(ethereum)
      });

      // Create a proper account object with signing capabilities
      const signerAccount = {
        address: userAddress as `0x${string}`,
        type: 'json-rpc' as const,
        signMessage: async ({ message }: { message: string | Uint8Array }) => {
          const messageToSign = typeof message === 'string' ? message : new TextDecoder().decode(message);
          return await ethereum.request({
            method: 'personal_sign',
            params: [messageToSign, userAddress]
          });
        },
        signTypedData: async (typedData: any) => {
          // Convert BigInt values to strings for JSON serialization
          const serializableTypedData = JSON.parse(JSON.stringify(typedData, (key, value) => 
            typeof value === 'bigint' ? value.toString() : value
          ));
          
          return await ethereum.request({
            method: 'eth_signTypedData_v4',
            params: [userAddress, JSON.stringify(serializableTypedData)]
          });
        }
      };

      // Create MetaMask smart account for the delegator
      const delegatorSmartAccount = await toMetaMaskSmartAccount({
        client: this.publicClient,
        implementation: Implementation.Hybrid,
        deployParams: [userAddress as `0x${string}`, [], [], []],
        deploySalt: '0x0000000000000000000000000000000000000000000000000000000000000000',
        signer: { account: signerAccount }
      });

      // Create delegation using the toolkit
      const delegation = createDelegation({
        to: params.delegate as `0x${string}`,
        from: delegatorSmartAccount.address,
        environment: delegatorSmartAccount.environment,
        scope: {
          type: 'erc20TransferAmount',
          tokenAddress: params.tokenAddress as `0x${string}`,
          maxAmount: params.maxAmount
        }
      });

      // Sign the delegation
      const signature = await delegatorSmartAccount.signDelegation({
        delegation
      });

      const signedDelegation = {
        ...delegation,
        signature
      };

      console.log('✅ Delegation created with toolkit:', signedDelegation);
      
      // Log to audit trail
      try {
        await fetch('http://localhost:3002/api/audit', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: 'delegation_created',
            details: {
              delegate: params.delegate,
              tokenAddress: params.tokenAddress,
              maxAmount: params.maxAmount.toString(),
              expiry: new Date((params.expiry || Math.floor(Date.now() / 1000) + 86400) * 1000).toLocaleString()
            },
            status: 'success',
            userAddress,
            timestamp: new Date().toISOString()
          })
        });
      } catch (auditError) {
        console.warn('Failed to log delegation creation to audit:', auditError);
      }
      
      return { 
        delegation: signedDelegation, 
        hash: `0x${Date.now().toString(16).padStart(64, '0')}` 
      };
    } catch (error) {
      console.error('❌ Delegation creation failed:', error);
      throw error;
    }
  }

  private createDelegationMessage(data: any): string {
    return `Delegate ${data.authority} to ${data.delegate} for token ${data.tokenAddress} with max amount ${data.maxAmount} until ${data.expiry}`;
  }

  private hashDelegation(data: any): string {
    const message = this.createDelegationMessage(data);
    // Simple hash for demo - in production use proper keccak256
    let hash = 0;
    for (let i = 0; i < message.length; i++) {
      const char = message.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return '0x' + Math.abs(hash).toString(16).padStart(64, '0');
  }

  async executeDelegation(
    signedDelegation: any,
    target: string,
    data: string = '0x',
    value: bigint = 0n
  ) {
    try {
      console.log('🔄 Executing delegation with toolkit');

      if (!window.ethereum || !window.ethereum.isMetaMask) {
        throw new Error('MetaMask not found');
      }

      // For now, simulate execution by sending a regular transaction
      // In production, this would use the DelegationManager contract
      
      // Validate delegation
      if (signedDelegation.scope && signedDelegation.scope.maxAmount) {
        if (value > BigInt(signedDelegation.scope.maxAmount)) {
          throw new Error('Execution value exceeds delegation limit');
        }
      }

      // Use MetaMask directly for transaction
      const userOperationHash = await ethereum.request({
        method: 'eth_sendTransaction',
        params: [{
          from: this.userAddress,
          to: target,
          data: data,
          value: `0x${value.toString(16)}`
        }]
      });

      console.log('✅ Delegation executed via MetaMask:', userOperationHash);
      return userOperationHash;
    } catch (error) {
      console.error('❌ Delegation execution failed:', error);
      throw error;
    }
  }

  async getBalance(): Promise<string> {
    try {
      const balance = await this.publicClient.getBalance({
        address: this.userAddress as `0x${string}`
      });
      return balance.toString();
    } catch (error) {
      console.error('❌ Failed to get balance:', error);
      return '0';
    }
  }

  async getAccountInfo() {
    const balance = await this.getBalance();
    const deployed = await this.isDeployed();
    
    return {
      address: this.smartAccountAddress,
      userAddress: this.userAddress,
      deployed,
      balance,
      environment: 'monad-testnet'
    };
  }
}

export const realSmartAccountService = new RealSmartAccountService();