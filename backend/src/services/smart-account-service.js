const { ethers } = require('ethers');

class SmartAccountService {
  constructor() {
    this.provider = new ethers.JsonRpcProvider('https://testnet1.monad.xyz');
    this.delegations = new Map(); // In production, use database
    this.executionHistory = [];
    this.auditLog = []; // Track all actions for audit
  }

  async validateDelegation(delegationHash, target, data, value) {
    const delegation = this.delegations.get(delegationHash);
    
    if (!delegation) {
      throw new Error('Delegation not found');
    }

    if (delegation.status !== 'active') {
      throw new Error('Delegation is not active');
    }

    // Check expiry
    if (Date.now() > delegation.expiryTimestamp) {
      delegation.status = 'expired';
      throw new Error('Delegation has expired');
    }

    // Validate caveats
    for (const caveat of delegation.caveats) {
      switch (caveat.type) {
        case 'MaxAmount':
          if (value > ethers.parseEther(caveat.value)) {
            throw new Error(`Amount ${value} exceeds max allowed ${caveat.value}`);
          }
          break;
        
        case 'AllowedTargets':
          if (!caveat.value.includes(target.toLowerCase())) {
            throw new Error(`Target ${target} not in allowed list`);
          }
          break;
        
        case 'Expiry':
          if (Math.floor(Date.now() / 1000) > caveat.value) {
            throw new Error('Delegation expired');
          }
          break;
      }
    }

    return true;
  }

  async executeDelegatedTransaction(params) {
    const { delegationHash, target, data, value = 0, smartAccountAddress } = params;

    try {
      // Validate delegation constraints
      await this.validateDelegation(delegationHash, target, data, value);

      // Create user operation for Smart Account
      const userOp = {
        sender: smartAccountAddress,
        nonce: await this.getNonce(smartAccountAddress),
        initCode: '0x',
        callData: this.encodeExecuteCall(target, value, data),
        callGasLimit: 200000,
        verificationGasLimit: 150000,
        preVerificationGas: 50000,
        maxFeePerGas: ethers.parseUnits('20', 'gwei'),
        maxPriorityFeePerGas: ethers.parseUnits('2', 'gwei'),
        paymasterAndData: '0x',
        signature: '0x',
      };

      // In production, this would be sent to bundler
      const txHash = '0x' + Math.random().toString(16).substr(2, 64);
      
      // Log execution
      const execution = {
        id: Date.now().toString(),
        delegationHash,
        target,
        data,
        value: value.toString(),
        txHash,
        timestamp: new Date().toISOString(),
        status: 'success',
        gasUsed: 150000,
        smartAccount: smartAccountAddress,
      };

      this.executionHistory.push(execution);

      return {
        txHash,
        userOpHash: '0x' + Math.random().toString(16).substr(2, 64),
        execution,
      };
    } catch (error) {
      const execution = {
        id: Date.now().toString(),
        delegationHash,
        target,
        data,
        value: value.toString(),
        txHash: null,
        timestamp: new Date().toISOString(),
        status: 'failed',
        error: error.message,
        smartAccount: smartAccountAddress,
      };

      this.executionHistory.push(execution);
      throw error;
    }
  }

  async storeDelegation(delegation) {
    this.delegations.set(delegation.hash, {
      ...delegation,
      status: 'active',
      createdAt: new Date().toISOString(),
    });
    
    // Add to audit log
    this.auditLog.push({
      id: Date.now().toString(),
      action: 'delegation_created',
      details: {
        delegate: delegation.delegate,
        maxAmount: delegation.maxAmount,
        authority: delegation.authority,
        expiryHours: delegation.expiryHours
      },
      txHash: '0x' + Math.random().toString(16).substr(2, 64),
      status: 'success',
      timestamp: new Date().toISOString(),
      userAddress: delegation.userAddress
    });
  }

  async revokeDelegation(delegationHash) {
    const delegation = this.delegations.get(delegationHash);
    if (delegation) {
      delegation.status = 'revoked';
      delegation.revokedAt = new Date().toISOString();
      
      // Add to audit log
      this.auditLog.push({
        id: Date.now().toString(),
        action: 'delegation_revoked',
        details: {
          delegationHash,
          delegate: delegation.delegate,
          authority: delegation.authority
        },
        txHash: '0x' + Math.random().toString(16).substr(2, 64),
        status: 'success',
        timestamp: new Date().toISOString(),
        userAddress: delegation.userAddress
      });
    }
  }

  async getDelegations(smartAccountAddress) {
    return Array.from(this.delegations.values())
      .filter(d => d.delegator === smartAccountAddress);
  }

  async getExecutionHistory(smartAccountAddress) {
    return this.executionHistory
      .filter(e => e.smartAccount === smartAccountAddress)
      .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
  }

  encodeExecuteCall(target, value, data) {
    // Encode call to Smart Account's execute function
    const iface = new ethers.Interface([
      'function execute(address target, uint256 value, bytes calldata data)'
    ]);
    
    return iface.encodeFunctionData('execute', [target, value, data]);
  }

  async getNonce(smartAccountAddress) {
    // In production, query the Smart Account contract
    return Math.floor(Math.random() * 1000000);
  }
  
  async getAuditLog(userAddress) {
    return this.auditLog
      .filter(entry => entry.userAddress === userAddress)
      .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
  }
  
  // Simulate AI agent actions for demo
  async simulateAIAction(userAddress) {
    const actions = [
      {
        action: 'rebalance',
        details: {
          rationale: 'WETH/USDT APY increased from 8.2% to 16.5%, moving 1.5 ETH for 4% improvement',
          fromPool: 'USDC/ETH',
          toPool: 'WETH/USDT',
          amount: '1.5'
        },
        confidence: 0.87
      },
      {
        action: 'analysis',
        details: {
          trigger: 'Pool APY change detected',
          poolsAnalyzed: 3,
          recommendation: 'No action - insufficient improvement'
        },
        confidence: 0.65
      }
    ];
    
    const randomAction = actions[Math.floor(Math.random() * actions.length)];
    
    this.auditLog.push({
      id: Date.now().toString(),
      action: randomAction.action,
      details: randomAction.details,
      txHash: randomAction.action === 'rebalance' ? '0x' + Math.random().toString(16).substr(2, 64) : undefined,
      confidence: randomAction.confidence,
      status: 'success',
      timestamp: new Date().toISOString(),
      userAddress,
      gasUsed: randomAction.action === 'rebalance' ? '0.0023' : undefined,
      gasPrice: randomAction.action === 'rebalance' ? '20' : undefined
    });
  }
}

module.exports = SmartAccountService;