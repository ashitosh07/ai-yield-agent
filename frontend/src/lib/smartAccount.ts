import { createPublicClient, createWalletClient, http, parseEther } from 'viem';
import { createBundlerClient } from 'viem/account-abstraction';
import { monadTestnet } from './chains';
import {
  Implementation,
  toMetaMaskSmartAccount,
  createDelegation,
  createExecution,
  ExecutionMode
} from '@metamask/delegation-toolkit';
import { DelegationManager } from '@metamask/delegation-toolkit/contracts';

export class SmartAccountService {
  private publicClient;
  private bundlerClient;
  private smartAccount;

  constructor() {
    // Initialize clients for Monad testnet
    this.publicClient = createPublicClient({
      chain: monadTestnet,
      transport: http(process.env.NEXT_PUBLIC_MONAD_RPC_URL || 'https://testnet-rpc.monad.xyz'),
    });

    this.bundlerClient = createBundlerClient({
      client: this.publicClient,
      transport: http(process.env.NEXT_PUBLIC_MONAD_BUNDLER_URL || 'https://testnet-rpc.monad.xyz'),
    });
  }

  /**
   * Create a MetaMask Smart Account
   */
  async createSmartAccount(walletClient: any) {
    try {
      // Handle Dynamic Labs wallet client
      let owner;
      if (walletClient.account?.address) {
        owner = walletClient.account.address;
      } else if (walletClient.getAddresses) {
        const addresses = await walletClient.getAddresses();
        owner = addresses[0];
      } else {
        throw new Error('Unable to get wallet address');
      }

      console.log('🔄 Creating MetaMask Smart Account for:', owner);

      // Create Hybrid Smart Account with wallet client signer
      this.smartAccount = await toMetaMaskSmartAccount({
        client: this.publicClient,
        implementation: Implementation.Hybrid,
        deployParams: [owner, [], [], []], // owner, keyIds, pubKeyXs, pubKeyYs
        deploySalt: '0x',
        signer: walletClient,
      });

      const smartAccountAddress = await this.smartAccount.getAddress();
      const isDeployed = await this.smartAccount.isDeployed();

      console.log('✅ Smart Account created:', {
        address: smartAccountAddress,
        deployed: isDeployed,
        owner
      });

      return {
        account: this.smartAccount,
        address: smartAccountAddress,
        deployed: isDeployed,
        owner
      };
    } catch (error) {
      console.error('❌ Smart Account creation failed:', error);
      throw error;
    }
  }

  /**
   * Deploy the smart account if not already deployed
   */
  async deploySmartAccount() {
    if (!this.smartAccount) {
      throw new Error('Smart account not initialized');
    }

    try {
      const isDeployed = await this.smartAccount.isDeployed();
      if (isDeployed) {
        console.log('✅ Smart Account already deployed');
        return null;
      }

      console.log('🔄 Deploying Smart Account...');

      // Send deployment transaction
      const userOperationHash = await this.bundlerClient.sendUserOperation({
        account: this.smartAccount,
        calls: [{
          to: await this.smartAccount.getAddress(),
          value: 0n,
          data: '0x',
        }],
        maxFeePerGas: 1000000n, // 0.001 gwei (Monad optimized)
        maxPriorityFeePerGas: 1000000n, // 0.001 gwei
      });

      console.log('✅ Smart Account deployment initiated:', userOperationHash);
      return userOperationHash;
    } catch (error) {
      console.error('❌ Smart Account deployment failed:', error);
      throw error;
    }
  }

  /**
   * Create a delegation with proper scope
   */
  async createDelegation(params: {
    delegate: string;
    tokenAddress: string;
    maxAmount: bigint;
    expiry?: number;
  }) {
    if (!this.smartAccount) {
      throw new Error('Smart account not initialized');
    }

    try {
      const smartAccountAddress = await this.smartAccount.getAddress();
      
      console.log('🔄 Creating delegation:', params);

      // Create delegation with ERC20 transfer scope
      const delegation = createDelegation({
        to: params.delegate,
        from: smartAccountAddress,
        environment: this.smartAccount.environment,
        scope: {
          type: 'erc20TransferAmount',
          tokenAddress: params.tokenAddress,
          maxAmount: params.maxAmount,
        },
      });

      console.log('✅ Delegation created:', delegation);

      // Sign the delegation
      const signature = await this.smartAccount.signDelegation({ delegation });
      const signedDelegation = { ...delegation, signature };

      console.log('✅ Delegation signed');

      return {
        delegation: signedDelegation,
        hash: delegation.hash || '0x' + Math.random().toString(16).substr(2, 64)
      };
    } catch (error) {
      console.error('❌ Delegation creation failed:', error);
      throw error;
    }
  }

  /**
   * Execute a transaction using delegation
   */
  async executeDelegation(
    signedDelegation: any,
    target: string,
    data: string = '0x',
    value: bigint = 0n
  ) {
    if (!this.smartAccount) {
      throw new Error('Smart account not initialized');
    }

    try {
      console.log('🔄 Executing delegation:', { target, data, value });

      // Create execution
      const execution = createExecution({ target, value, data });

      // Prepare delegation redemption calldata
      const redeemDelegationCalldata = DelegationManager.encode.redeemDelegations({
        delegations: [[signedDelegation]],
        modes: [ExecutionMode.SingleDefault],
        executions: [execution],
      });

      // Send user operation
      const userOperationHash = await this.bundlerClient.sendUserOperation({
        account: this.smartAccount,
        calls: [{
          to: await this.smartAccount.getAddress(),
          data: redeemDelegationCalldata,
        }],
        maxFeePerGas: 1000000n, // 0.001 gwei (Monad optimized)
        maxPriorityFeePerGas: 1000000n, // 0.001 gwei
      });

      console.log('✅ Delegation executed:', userOperationHash);
      return userOperationHash;
    } catch (error) {
      console.error('❌ Delegation execution failed:', error);
      throw error;
    }
  }

  /**
   * Send a regular user operation
   */
  async sendUserOperation(calls: Array<{ to: string; value?: bigint; data?: string }>) {
    if (!this.smartAccount) {
      throw new Error('Smart account not initialized');
    }

    try {
      console.log('🔄 Sending user operation:', calls);

      const userOperationHash = await this.bundlerClient.sendUserOperation({
        account: this.smartAccount,
        calls: calls.map(call => ({
          to: call.to,
          value: call.value || 0n,
          data: call.data || '0x',
        })),
        maxFeePerGas: 1000000n, // 0.001 gwei (Monad optimized)
        maxPriorityFeePerGas: 1000000n, // 0.001 gwei
      });

      console.log('✅ User operation sent:', userOperationHash);
      return userOperationHash;
    } catch (error) {
      console.error('❌ User operation failed:', error);
      throw error;
    }
  }

  /**
   * Get smart account details
   */
  async getAccountInfo() {
    if (!this.smartAccount) {
      return null;
    }

    try {
      const address = await this.smartAccount.getAddress();
      const deployed = await this.smartAccount.isDeployed();
      const balance = await this.publicClient.getBalance({ address });

      return {
        address,
        deployed,
        balance: balance.toString(),
        environment: this.smartAccount.environment
      };
    } catch (error) {
      console.error('❌ Failed to get account info:', error);
      return null;
    }
  }
}

// Export singleton instance
export const smartAccountService = new SmartAccountService();