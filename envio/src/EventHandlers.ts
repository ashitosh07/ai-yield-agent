import {
  Pool,
  SyncEvent,
  SwapEvent,
  UserPosition,
  YieldMetrics,
  AIAction,
} from "generated";

// Pool addresses mapping
const POOL_INFO = {
  "0x1234567890123456789012345678901234567890": {
    name: "USDC/ETH",
    token0: "0x4567890123456789012345678901234567890123",
    token1: "0x6789012345678901234567890123456789012345"
  },
  "0x2345678901234567890123456789012345678901": {
    name: "DAI/USDC", 
    token0: "0x5678901234567890123456789012345678901234",
    token1: "0x4567890123456789012345678901234567890123"
  },
  "0x3456789012345678901234567890123456789012": {
    name: "WETH/USDT",
    token0: "0x6789012345678901234567890123456789012345",
    token1: "0x7890123456789012345678901234567890123456"
  }
};

// Calculate APY from reserves and fees
function calculateAPY(reserve0: bigint, reserve1: bigint, feesUSD24h: number): number {
  const tvlUSD = calculateTVL(reserve0, reserve1);
  if (tvlUSD === 0) return 0;
  
  const dailyYield = feesUSD24h / tvlUSD;
  const apy = (Math.pow(1 + dailyYield, 365) - 1) * 100;
  
  return Math.min(apy, 1000); // Cap at 1000%
}

// Calculate TVL in USD
function calculateTVL(reserve0: bigint, reserve1: bigint): number {
  // Mock price calculation - in production would use oracle
  const ethPrice = 2000;
  const reserve0USD = Number(reserve0) / 1e18 * ethPrice;
  const reserve1USD = Number(reserve1) / 1e18 * ethPrice;
  
  return reserve0USD + reserve1USD;
}

// Calculate risk score
function calculateRiskScore(tvlUSD: number, apy: number): number {
  let risk = 0;
  
  if (tvlUSD < 100000) risk += 0.4;
  else if (tvlUSD < 1000000) risk += 0.2;
  else risk += 0.1;
  
  if (apy > 20) risk += 0.3;
  else if (apy > 10) risk += 0.1;
  
  return Math.min(risk, 1.0);
}

// Sync event handler - updates pool reserves and metrics
UniswapV2Pool.Sync.handler(async ({ event, context }) => {
  const poolAddress = event.srcAddress.toLowerCase();
  const poolInfo = POOL_INFO[poolAddress];
  
  if (!poolInfo) return;

  // Create or update pool entity
  const pool = await context.Pool.get(poolAddress) || {
    id: poolAddress,
    address: poolAddress,
    token0: poolInfo.token0,
    token1: poolInfo.token1,
    name: poolInfo.name,
    totalSupply: 0n,
    volumeUSD24h: 0,
    feesUSD24h: 0,
  };

  // Update reserves
  pool.reserve0 = event.params.reserve0;
  pool.reserve1 = event.params.reserve1;
  pool.lastUpdated = event.block.timestamp;

  // Calculate metrics
  const tvlUSD = calculateTVL(pool.reserve0, pool.reserve1);
  const apy = calculateAPY(pool.reserve0, pool.reserve1, pool.feesUSD24h);
  const riskScore = calculateRiskScore(tvlUSD, apy);

  pool.tvlUSD = tvlUSD;
  pool.apy = apy;
  pool.riskScore = riskScore;

  await context.Pool.set(pool);

  // Create sync event record
  const syncEvent: SyncEvent = {
    id: `${event.transaction.hash}-${event.logIndex}`,
    pool_id: poolAddress,
    reserve0: event.params.reserve0,
    reserve1: event.params.reserve1,
    blockNumber: event.block.number,
    blockTimestamp: event.block.timestamp,
    transactionHash: event.transaction.hash,
  };

  await context.SyncEvent.set(syncEvent);

  // Trigger AI analysis webhook if significant change
  const prevMetrics = await context.YieldMetrics.get(`${poolAddress}-${getDateString(event.block.timestamp)}`);
  if (!prevMetrics || Math.abs(apy - prevMetrics.apy) > 1.0) {
    await triggerAIAnalysis(poolAddress, prevMetrics?.apy || 0, apy, event.block.timestamp);
  }

  // Update daily metrics
  await updateDailyMetrics(context, poolAddress, pool, event.block);
});

// Swap event handler - tracks volume and fees
UniswapV2Pool.Swap.handler(async ({ event, context }) => {
  const poolAddress = event.srcAddress.toLowerCase();
  const poolInfo = POOL_INFO[poolAddress];
  
  if (!poolInfo) return;

  // Calculate swap volume in USD
  const amount0 = event.params.amount0In > 0n ? event.params.amount0In : event.params.amount0Out;
  const amount1 = event.params.amount1In > 0n ? event.params.amount1In : event.params.amount1Out;
  const volumeUSD = calculateSwapVolumeUSD(amount0, amount1);

  // Create swap event record
  const swapEvent: SwapEvent = {
    id: `${event.transaction.hash}-${event.logIndex}`,
    pool_id: poolAddress,
    sender: event.params.sender,
    amount0In: event.params.amount0In,
    amount1In: event.params.amount1In,
    amount0Out: event.params.amount0Out,
    amount1Out: event.params.amount1Out,
    to: event.params.to,
    volumeUSD,
    blockNumber: event.block.number,
    blockTimestamp: event.block.timestamp,
    transactionHash: event.transaction.hash,
  };

  await context.SwapEvent.set(swapEvent);

  // Update pool volume
  const pool = await context.Pool.get(poolAddress);
  if (pool) {
    pool.volumeUSD24h += volumeUSD;
    pool.feesUSD24h += volumeUSD * 0.003; // 0.3% fee
    await context.Pool.set(pool);
  }
});

// ERC20 Transfer handler - tracks user positions
ERC20.Transfer.handler(async ({ event, context }) => {
  const tokenAddress = event.srcAddress.toLowerCase();
  
  // Only track pool token transfers
  const isPoolToken = Object.keys(POOL_INFO).includes(tokenAddress);
  if (!isPoolToken) return;

  const from = event.params.from.toLowerCase();
  const to = event.params.to.toLowerCase();
  const value = event.params.value;

  // Update sender position
  if (from !== "0x0000000000000000000000000000000000000000") {
    await updateUserPosition(context, from, tokenAddress, -Number(value), event.block.timestamp);
  }

  // Update receiver position  
  if (to !== "0x0000000000000000000000000000000000000000") {
    await updateUserPosition(context, to, tokenAddress, Number(value), event.block.timestamp);
  }
});

// Helper functions
function calculateSwapVolumeUSD(amount0: bigint, amount1: bigint): number {
  const ethPrice = 2000;
  return (Number(amount0) / 1e18 * ethPrice + Number(amount1) / 1e18 * ethPrice) / 2;
}

function getDateString(timestamp: bigint): string {
  const date = new Date(Number(timestamp) * 1000);
  return date.toISOString().split('T')[0];
}

async function updateUserPosition(
  context: any,
  user: string,
  poolAddress: string,
  balanceChange: number,
  timestamp: bigint
) {
  const positionId = `${user}-${poolAddress}`;
  
  let position = await context.UserPosition.get(positionId);
  if (!position) {
    position = {
      id: positionId,
      user,
      pool_id: poolAddress,
      balance: 0n,
      valueUSD: 0,
      lastUpdated: timestamp,
    };
  }

  position.balance = BigInt(Number(position.balance) + balanceChange);
  position.lastUpdated = timestamp;

  // Calculate USD value
  const pool = await context.Pool.get(poolAddress);
  if (pool) {
    const tokenPrice = pool.tvlUSD / (Number(pool.reserve0) + Number(pool.reserve1)) * 1e18;
    position.valueUSD = Number(position.balance) / 1e18 * tokenPrice;
  }

  await context.UserPosition.set(position);
}

async function updateDailyMetrics(
  context: any,
  poolAddress: string,
  pool: any,
  block: any
) {
  const dateString = getDateString(block.timestamp);
  const metricsId = `${poolAddress}-${dateString}`;

  const metrics: YieldMetrics = {
    id: metricsId,
    pool_id: poolAddress,
    date: dateString,
    apy: pool.apy,
    tvlUSD: pool.tvlUSD,
    volumeUSD: pool.volumeUSD24h,
    feesUSD: pool.feesUSD24h,
    blockNumber: block.number,
    blockTimestamp: block.timestamp,
  };

  await context.YieldMetrics.set(metrics);
}

async function triggerAIAnalysis(
  poolAddress: string,
  oldAPY: number,
  newAPY: number,
  timestamp: bigint
) {
  try {
    const response = await fetch('http://localhost:3002/webhooks/envio', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        event: 'pool_apy_change',
        data: {
          poolAddress,
          oldAPY,
          newAPY,
          timestamp: Number(timestamp),
          blockNumber: 0 // Would be actual block number
        }
      })
    });
    
    console.log(`🤖 AI analysis triggered for ${poolAddress}: ${oldAPY}% → ${newAPY}%`);
  } catch (error) {
    console.error('Failed to trigger AI analysis:', error);
  }
}