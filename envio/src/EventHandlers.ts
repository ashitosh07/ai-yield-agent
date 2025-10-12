import {
  USDCToken,
  UniswapV3Factory,
  UniswapV3Pool,
  Transfer,
  Approval,
  PoolCreated,
  Swap,
  Mint,
  Burn,
} from "generated";

// USDC Token Transfer handler
USDCToken.Transfer.handler(async ({ event, context }) => {
  const transfer: Transfer = {
    id: `${event.chainId}_${event.block.number}_${event.logIndex}`,
    from: event.params.from,
    to: event.params.to,
    value: event.params.value,
    contract: event.srcAddress,
    blockNumber: event.block.number,
    timestamp: new Date(event.block.timestamp * 1000),
    transactionHash: event.transaction.hash,
  };

  context.Transfer.set(transfer);
  
  // Trigger AI analysis for large transfers
  if (event.params.value > BigInt("1000000000")) { // > 1000 USDC
    await triggerAIAnalysis('LARGE_TRANSFER', {
      from: event.params.from,
      to: event.params.to,
      value: event.params.value.toString(),
      token: 'USDC',
      blockNumber: event.block.number
    });
  }
});

// USDC Token Approval handler
USDCToken.Approval.handler(async ({ event, context }) => {
  const approval: Approval = {
    id: `${event.chainId}_${event.block.number}_${event.logIndex}`,
    owner: event.params.owner,
    spender: event.params.spender,
    value: event.params.value,
    contract: event.srcAddress,
    blockNumber: event.block.number,
    timestamp: new Date(event.block.timestamp * 1000),
    transactionHash: event.transaction.hash,
  };

  context.Approval.set(approval);
});

// Uniswap V3 Factory PoolCreated handler
UniswapV3Factory.PoolCreated.handler(async ({ event, context }) => {
  const poolCreated: PoolCreated = {
    id: `${event.chainId}_${event.block.number}_${event.logIndex}`,
    token0: event.params.token0,
    token1: event.params.token1,
    fee: event.params.fee,
    tickSpacing: event.params.tickSpacing,
    pool: event.params.pool,
    contract: event.srcAddress,
    blockNumber: event.block.number,
    timestamp: new Date(event.block.timestamp * 1000),
    transactionHash: event.transaction.hash,
  };

  context.PoolCreated.set(poolCreated);
  
  // Notify AI agent of new pool for yield opportunities
  await triggerAIAnalysis('NEW_POOL', {
    pool: event.params.pool,
    token0: event.params.token0,
    token1: event.params.token1,
    fee: event.params.fee,
    blockNumber: event.block.number
  });
});

// Uniswap V3 Pool Swap handler
UniswapV3Pool.Swap.handler(async ({ event, context }) => {
  const swap: Swap = {
    id: `${event.chainId}_${event.block.number}_${event.logIndex}`,
    sender: event.params.sender,
    recipient: event.params.recipient,
    amount0: event.params.amount0,
    amount1: event.params.amount1,
    sqrtPriceX96: event.params.sqrtPriceX96,
    liquidity: event.params.liquidity,
    tick: event.params.tick,
    contract: event.srcAddress,
    blockNumber: event.block.number,
    timestamp: new Date(event.block.timestamp * 1000),
    transactionHash: event.transaction.hash,
  };

  context.Swap.set(swap);
  
  // Trigger AI analysis for significant swaps
  const swapValue = event.params.amount0 > 0 ? event.params.amount0 : event.params.amount1;
  if (swapValue > BigInt("1000000000")) { // Large swap threshold
    await triggerAIAnalysis('LARGE_SWAP', {
      pool: event.srcAddress,
      amount0: event.params.amount0.toString(),
      amount1: event.params.amount1.toString(),
      newPrice: event.params.sqrtPriceX96.toString(),
      blockNumber: event.block.number
    });
  }
});

// Uniswap V3 Pool Mint handler
UniswapV3Pool.Mint.handler(async ({ event, context }) => {
  const mint: Mint = {
    id: `${event.chainId}_${event.block.number}_${event.logIndex}`,
    sender: event.params.sender,
    owner: event.params.owner,
    tickLower: event.params.tickLower,
    tickUpper: event.params.tickUpper,
    amount: event.params.amount,
    amount0: event.params.amount0,
    amount1: event.params.amount1,
    contract: event.srcAddress,
    blockNumber: event.block.number,
    timestamp: new Date(event.block.timestamp * 1000),
    transactionHash: event.transaction.hash,
  };

  context.Mint.set(mint);
});

// Uniswap V3 Pool Burn handler
UniswapV3Pool.Burn.handler(async ({ event, context }) => {
  const burn: Burn = {
    id: `${event.chainId}_${event.block.number}_${event.logIndex}`,
    owner: event.params.owner,
    tickLower: event.params.tickLower,
    tickUpper: event.params.tickUpper,
    amount: event.params.amount,
    amount0: event.params.amount0,
    amount1: event.params.amount1,
    contract: event.srcAddress,
    blockNumber: event.block.number,
    timestamp: new Date(event.block.timestamp * 1000),
    transactionHash: event.transaction.hash,
  };

  context.Burn.set(burn);
});

// Helper function to trigger AI analysis
async function triggerAIAnalysis(eventType: string, data: any) {
  try {
    const response = await fetch('http://localhost:3002/api/webhooks/envio', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        type: eventType,
        data,
        source: 'envio-hyperindex',
        timestamp: Date.now()
      })
    });
    
    if (!response.ok) {
      console.warn(`AI webhook failed: ${response.status}`);
    }
  } catch (error) {
    console.warn('AI webhook error:', error.message);
  }
}