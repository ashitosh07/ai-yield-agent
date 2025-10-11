import {
  Pool,
  Swap,
  PoolDayData,
  AIAction,
  User,
  Factory,
  ActionType,
  ActionStatus,
} from "generated";
import { BigDecimal } from "../generated/src/BigDecimal.js";

// Pool creation handler
UniswapV2Factory.PairCreated.handler(async ({ event, context }) => {
  const poolId = event.params.pair.toLowerCase();
  const factoryId = event.srcAddress.toLowerCase();
  
  // Get or create factory
  let factory = await context.Factory.get(factoryId);
  if (!factory) {
    factory = {
      id: factoryId,
      poolCount: 0n,
      totalVolumeUSD: new BigDecimal("0"),
      totalFeesUSD: new BigDecimal("0"),
    };
  }
  
  // Update factory pool count
  factory.poolCount = factory.poolCount + 1n;
  context.Factory.set(factory);
  
  // Create new pool
  const pool = {
    id: poolId,
    factory_id: factoryId,
    token0: event.params.token0.toLowerCase(),
    token1: event.params.token1.toLowerCase(),
    token0Symbol: await getTokenSymbol(event.params.token0),
    token1Symbol: await getTokenSymbol(event.params.token1),
    reserve0: 0n,
    reserve1: 0n,
    totalSupply: 0n,
    txCount: 0n,
    createdAtTimestamp: BigInt(event.block.timestamp),
    createdAtBlockNumber: BigInt(event.block.number),
    lastSyncTimestamp: BigInt(event.block.timestamp),
    lastSyncBlockNumber: BigInt(event.block.number),
    volumeUSD: new BigDecimal("0"),
    feesUSD: new BigDecimal("0"),
    apy: new BigDecimal("0"),
    tvlUSD: new BigDecimal("0"),
    isActive: true,
  };

  context.Pool.set(pool);
  
  // Create AI action for new pool
  const aiActionId = `${poolId}-pool-created-${event.block.timestamp}`;
  const aiAction = {
    id: aiActionId,
    pool_id: poolId,
    actionType: "POOL_CREATED" as ActionType,
    status: "PENDING" as ActionStatus,
    amount: new BigDecimal("0"),
    confidence: new BigDecimal("0.95"),
    rationale: `New ${pool.token0Symbol}/${pool.token1Symbol} pool created - monitoring for yield opportunities`,
    timestamp: BigInt(event.block.timestamp),
    blockNumber: BigInt(event.block.number),
    userAddress: event.params.token0, // Placeholder
  };
  
  context.AIAction.set(aiAction);
  
  // Trigger AI analysis webhook
  if (!context.isPreload) {
    await triggerAIAnalysis(poolId, "POOL_CREATED", event.block.timestamp);
  }
});

// Swap event handler
UniswapV2Pair.Swap.handler(async ({ event, context }) => {
  const poolId = event.srcAddress.toLowerCase();
  const swapId = `${event.transaction.hash}-${event.logIndex}`;
  
  // Load existing pool with preload optimization
  const pool = await context.Pool.getOrThrow(poolId, `Pool ${poolId} should exist`);

  // Calculate volume in USD using BigDecimal for precision
  const volumeUSD = calculateVolumeUSD(
    event.params.amount0In,
    event.params.amount1In,
    event.params.amount0Out,
    event.params.amount1Out
  );

  // Create swap entity with proper types
  const swap = {
    id: swapId,
    pool_id: poolId,
    sender: event.params.sender.toLowerCase(),
    recipient: event.params.to.toLowerCase(),
    amount0In: event.params.amount0In,
    amount1In: event.params.amount1In,
    amount0Out: event.params.amount0Out,
    amount1Out: event.params.amount1Out,
    volumeUSD,
    timestamp: BigInt(event.block.timestamp),
    blockNumber: BigInt(event.block.number),
    txHash: event.transaction.hash,
    gasUsed: BigInt(event.transaction.gasUsed || 0),
    logIndex: event.logIndex,
  };

  context.Swap.set(swap);

  // Update pool stats with BigDecimal precision
  const feeAmount = volumeUSD.times(new BigDecimal("0.003")); // 0.3% fee
  const updatedPool = {
    ...pool,
    txCount: pool.txCount + 1n,
    volumeUSD: pool.volumeUSD.plus(volumeUSD),
    feesUSD: pool.feesUSD.plus(feeAmount),
    lastSyncTimestamp: BigInt(event.block.timestamp),
    lastSyncBlockNumber: BigInt(event.block.number),
  };

  // Recalculate APY with proper precision
  updatedPool.apy = calculateAPY(updatedPool);
  context.Pool.set(updatedPool);

  // Check if significant APY change occurred
  const apyChange = updatedPool.apy.minus(pool.apy).abs();
  const threshold = new BigDecimal("2.0"); // 2% threshold
  
  if (apyChange.gt(threshold)) {
    // Create AI action for APY change
    const aiActionId = `${poolId}-apy-change-${event.block.timestamp}`;
    const aiAction = {
      id: aiActionId,
      pool_id: poolId,
      actionType: "APY_CHANGED" as ActionType,
      status: "PENDING" as ActionStatus,
      amount: volumeUSD,
      confidence: new BigDecimal("0.85"),
      rationale: `APY changed by ${apyChange.toFixed(2)}% - from ${pool.apy.toFixed(2)}% to ${updatedPool.apy.toFixed(2)}%`,
      timestamp: BigInt(event.block.timestamp),
      blockNumber: BigInt(event.block.number),
      userAddress: event.params.sender.toLowerCase(),
    };
    
    context.AIAction.set(aiAction);
    
    // Trigger AI analysis webhook (skip during preload)
    if (!context.isPreload) {
      await triggerAIAnalysis(poolId, "APY_CHANGE", event.block.timestamp, {
        oldAPY: pool.apy.toString(),
        newAPY: updatedPool.apy.toString(),
        volumeUSD: volumeUSD.toString()
      });
    }
  }
});

// Sync event handler (reserves update)
UniswapV2Pair.Sync.handler(async ({ event, context }) => {
  const poolId = event.srcAddress.toLowerCase();
  
  const pool = await context.Pool.getOrThrow(poolId, `Pool ${poolId} should exist`);

  // Update reserves and recalculate TVL with BigDecimal precision
  const tvlUSD = calculateTVL(event.params.reserve0, event.params.reserve1);
  
  const updatedPool = {
    ...pool,
    reserve0: event.params.reserve0,
    reserve1: event.params.reserve1,
    tvlUSD,
    lastSyncTimestamp: BigInt(event.block.timestamp),
    lastSyncBlockNumber: BigInt(event.block.number),
  };

  context.Pool.set(updatedPool);
});

// Helper functions
async function getTokenSymbol(tokenAddress: string): Promise<string> {
  // In a real implementation, this would query the token contract
  const knownTokens: { [key: string]: string } = {
    "0xa0b86a33e6441e6c7d3e4c5b4b6b6b6b6b6b6b6b": "USDC",
    "0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2": "WETH",
    "0x6b175474e89094c44da98b954eedeac495271d0f": "DAI",
  };
  
  return knownTokens[tokenAddress.toLowerCase()] || "UNKNOWN";
}

function calculateVolumeUSD(
  amount0In: bigint,
  amount1In: bigint,
  amount0Out: bigint,
  amount1Out: bigint
): BigDecimal {
  // Calculate total amounts with proper precision
  const totalAmount0 = amount0In + amount0Out;
  const totalAmount1 = amount1In + amount1Out;
  
  // Convert to BigDecimal with 18 decimal precision
  const amount0USD = new BigDecimal(totalAmount0.toString()).div(new BigDecimal("1e18"));
  const amount1USD = new BigDecimal(totalAmount1.toString()).div(new BigDecimal("1e18"));
  
  // Simplified: assume 1:1 USD ratio for demo (would use price oracles in production)
  return amount0USD.plus(amount1USD);
}

function calculateTVL(reserve0: bigint, reserve1: bigint): BigDecimal {
  // Convert reserves to USD with proper precision
  const reserve0USD = new BigDecimal(reserve0.toString()).div(new BigDecimal("1e18"));
  const reserve1USD = new BigDecimal(reserve1.toString()).div(new BigDecimal("1e18"));
  
  // Simplified: assume 1:1 USD ratio for demo
  return reserve0USD.plus(reserve1USD);
}

function calculateAPY(pool: any): BigDecimal {
  // Simplified APY calculation based on fees and TVL
  if (pool.tvlUSD.isZero()) return new BigDecimal("0");
  
  // Calculate daily fees (assume 30 days of data)
  const dailyFees = pool.feesUSD.div(new BigDecimal("30"));
  const dailyYield = dailyFees.div(pool.tvlUSD);
  const apy = dailyYield.times(new BigDecimal("365")).times(new BigDecimal("100"));
  
  // Cap at 1000% APY
  const maxAPY = new BigDecimal("1000");
  return apy.gt(maxAPY) ? maxAPY : apy;
}

async function triggerAIAnalysis(
  poolId: string,
  eventType: string,
  timestamp: number,
  data?: any
) {
  // Send webhook to AI agent
  try {
    await fetch('http://localhost:3003/envio-webhook', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        poolId,
        eventType,
        timestamp,
        data,
        source: 'envio-indexer'
      })
    });
  } catch (error) {
    console.error('Failed to trigger AI analysis:', error);
  }
}