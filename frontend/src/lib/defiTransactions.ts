import { encodeFunctionData, parseEther, parseUnits } from 'viem';
import { smartAccountService } from './smartAccount';

// ERC20 ABI for token operations
const ERC20_ABI = [
  {
    name: 'transfer',
    type: 'function',
    inputs: [
      { name: 'to', type: 'address' },
      { name: 'amount', type: 'uint256' }
    ],
    outputs: [{ name: '', type: 'bool' }],
    stateMutability: 'nonpayable'
  },
  {
    name: 'approve',
    type: 'function',
    inputs: [
      { name: 'spender', type: 'address' },
      { name: 'amount', type: 'uint256' }
    ],
    outputs: [{ name: '', type: 'bool' }],
    stateMutability: 'nonpayable'
  },
  {
    name: 'balanceOf',
    type: 'function',
    inputs: [{ name: 'account', type: 'address' }],
    outputs: [{ name: '', type: 'uint256' }],
    stateMutability: 'view'
  }
];

// Uniswap V3 Router ABI (simplified)
const UNISWAP_V3_ROUTER_ABI = [
  {
    name: 'exactInputSingle',
    type: 'function',
    inputs: [{
      name: 'params',
      type: 'tuple',
      components: [
        { name: 'tokenIn', type: 'address' },
        { name: 'tokenOut', type: 'address' },
        { name: 'fee', type: 'uint24' },
        { name: 'recipient', type: 'address' },
        { name: 'deadline', type: 'uint256' },
        { name: 'amountIn', type: 'uint256' },
        { name: 'amountOutMinimum', type: 'uint256' },
        { name: 'sqrtPriceLimitX96', type: 'uint160' }
      ]
    }],
    outputs: [{ name: 'amountOut', type: 'uint256' }],
    stateMutability: 'payable'
  }
];

// Monad testnet contract addresses
export const CONTRACTS = {
  USDC: '0xf817257fed379853cDe0fa4F97AB987181B1E5Ea',
  USDT: '0x88b8E2161DEDC77EF4ab7585569D2415a1C1055D',
  WBTC: '0xcf5a6076cfa32686c0Df13aBaDa2b40dec133F1d',
  WETH: '0xB5a30b0FDc42e3E9760Cb8449Fb37',
  UNISWAP_V3_ROUTER: '0x3ae6d8a282d67893e17aa70ebffb33ee5aa65893',
  UNISWAP_V3_FACTORY: '0x961235a9020b05c44df1026d956d1f4d78014276',
};

export class DeFiTransactionService {
  /**
   * Transfer ERC20 tokens
   */
  static async transferToken(
    tokenAddress: string,
    to: string,
    amount: string,
    decimals: number = 18
  ) {
    try {
      console.log('🔄 Preparing token transfer:', { tokenAddress, to, amount, decimals });

      const transferData = encodeFunctionData({
        abi: ERC20_ABI,
        functionName: 'transfer',
        args: [to, parseUnits(amount, decimals)]
      });

      const txHash = await smartAccountService.sendUserOperation([{
        to: tokenAddress,
        data: transferData
      }]);

      console.log('✅ Token transfer executed:', txHash);
      return txHash;
    } catch (error) {
      console.error('❌ Token transfer failed:', error);
      throw error;
    }
  }

  /**
   * Approve token spending
   */
  static async approveToken(
    tokenAddress: string,
    spender: string,
    amount: string,
    decimals: number = 18
  ) {
    try {
      console.log('🔄 Preparing token approval:', { tokenAddress, spender, amount, decimals });

      const approveData = encodeFunctionData({
        abi: ERC20_ABI,
        functionName: 'approve',
        args: [spender, parseUnits(amount, decimals)]
      });

      const txHash = await smartAccountService.sendUserOperation([{
        to: tokenAddress,
        data: approveData
      }]);

      console.log('✅ Token approval executed:', txHash);
      return txHash;
    } catch (error) {
      console.error('❌ Token approval failed:', error);
      throw error;
    }
  }

  /**
   * Swap tokens on Uniswap V3
   */
  static async swapTokens(
    tokenIn: string,
    tokenOut: string,
    amountIn: string,
    amountOutMinimum: string,
    fee: number = 3000, // 0.3%
    decimalsIn: number = 18,
    decimalsOut: number = 18
  ) {
    try {
      console.log('🔄 Preparing token swap:', {
        tokenIn,
        tokenOut,
        amountIn,
        amountOutMinimum,
        fee
      });

      const accountInfo = await smartAccountService.getAccountInfo();
      if (!accountInfo) {
        throw new Error('Smart account not initialized');
      }

      const swapParams = {
        tokenIn,
        tokenOut,
        fee,
        recipient: accountInfo.address,
        deadline: Math.floor(Date.now() / 1000) + 1800, // 30 minutes
        amountIn: parseUnits(amountIn, decimalsIn),
        amountOutMinimum: parseUnits(amountOutMinimum, decimalsOut),
        sqrtPriceLimitX96: 0n
      };

      const swapData = encodeFunctionData({
        abi: UNISWAP_V3_ROUTER_ABI,
        functionName: 'exactInputSingle',
        args: [swapParams]
      });

      // First approve the router to spend tokens
      await this.approveToken(tokenIn, CONTRACTS.UNISWAP_V3_ROUTER, amountIn, decimalsIn);

      // Then execute the swap
      const txHash = await smartAccountService.sendUserOperation([{
        to: CONTRACTS.UNISWAP_V3_ROUTER,
        data: swapData
      }]);

      console.log('✅ Token swap executed:', txHash);
      return txHash;
    } catch (error) {
      console.error('❌ Token swap failed:', error);
      throw error;
    }
  }

  /**
   * Execute yield optimization strategy
   */
  static async executeYieldStrategy(
    fromToken: string,
    toToken: string,
    amount: string,
    strategy: 'swap' | 'lend' | 'stake' = 'swap'
  ) {
    try {
      console.log('🔄 Executing yield strategy:', { fromToken, toToken, amount, strategy });

      let txHash: string;

      switch (strategy) {
        case 'swap':
          // Simple swap strategy
          txHash = await this.swapTokens(
            fromToken,
            toToken,
            amount,
            '0', // Accept any amount of tokens out
            3000 // 0.3% fee
          );
          break;

        case 'lend':
          // Lending strategy (placeholder - would integrate with lending protocols)
          txHash = await this.transferToken(fromToken, toToken, amount);
          break;

        case 'stake':
          // Staking strategy (placeholder - would integrate with staking protocols)
          txHash = await this.transferToken(fromToken, toToken, amount);
          break;

        default:
          throw new Error(`Unknown strategy: ${strategy}`);
      }

      console.log('✅ Yield strategy executed:', txHash);
      return {
        txHash,
        strategy,
        fromToken,
        toToken,
        amount,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      console.error('❌ Yield strategy failed:', error);
      throw error;
    }
  }

  /**
   * Batch execute multiple transactions
   */
  static async batchExecute(transactions: Array<{
    to: string;
    data?: string;
    value?: bigint;
  }>) {
    try {
      console.log('🔄 Executing batch transactions:', transactions.length);

      const txHash = await smartAccountService.sendUserOperation(transactions);

      console.log('✅ Batch execution completed:', txHash);
      return txHash;
    } catch (error) {
      console.error('❌ Batch execution failed:', error);
      throw error;
    }
  }

  /**
   * Get token balance
   */
  static async getTokenBalance(tokenAddress: string, accountAddress: string) {
    try {
      // This would typically use the public client to read from the contract
      // For now, return mock data
      return {
        balance: '1000000000', // 1000 tokens
        decimals: 18,
        symbol: 'TOKEN'
      };
    } catch (error) {
      console.error('❌ Failed to get token balance:', error);
      throw error;
    }
  }
}

// Export common token addresses for easy access
export const TOKENS = {
  USDC: {
    address: CONTRACTS.USDC,
    symbol: 'USDC',
    decimals: 6
  },
  USDT: {
    address: CONTRACTS.USDT,
    symbol: 'USDT',
    decimals: 6
  },
  WBTC: {
    address: CONTRACTS.WBTC,
    symbol: 'WBTC',
    decimals: 8
  },
  WETH: {
    address: CONTRACTS.WETH,
    symbol: 'WETH',
    decimals: 18
  }
};