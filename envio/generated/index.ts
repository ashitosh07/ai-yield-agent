// Mock generated types for Envio HyperIndex demo
export interface Transfer {
  id: string;
  from: string;
  to: string;
  value: bigint;
  contract: string;
  blockNumber: number;
  timestamp: Date;
  transactionHash: string;
}

export interface Approval {
  id: string;
  owner: string;
  spender: string;
  value: bigint;
  contract: string;
  blockNumber: number;
  timestamp: Date;
  transactionHash: string;
}

export interface PoolCreated {
  id: string;
  token0: string;
  token1: string;
  fee: number;
  tickSpacing: number;
  pool: string;
  contract: string;
  blockNumber: number;
  timestamp: Date;
  transactionHash: string;
}

export interface Swap {
  id: string;
  sender: string;
  recipient: string;
  amount0: bigint;
  amount1: bigint;
  sqrtPriceX96: bigint;
  liquidity: bigint;
  tick: number;
  contract: string;
  blockNumber: number;
  timestamp: Date;
  transactionHash: string;
}

export interface Mint {
  id: string;
  sender: string;
  owner: string;
  tickLower: number;
  tickUpper: number;
  amount: bigint;
  amount0: bigint;
  amount1: bigint;
  contract: string;
  blockNumber: number;
  timestamp: Date;
  transactionHash: string;
}

export interface Burn {
  id: string;
  owner: string;
  tickLower: number;
  tickUpper: number;
  amount: bigint;
  amount0: bigint;
  amount1: bigint;
  contract: string;
  blockNumber: number;
  timestamp: Date;
  transactionHash: string;
}

// Mock contract handlers
export const USDCToken = {
  Transfer: {
    handler: (fn: any) => console.log('USDCToken.Transfer handler registered')
  },
  Approval: {
    handler: (fn: any) => console.log('USDCToken.Approval handler registered')
  }
};

export const UniswapV3Factory = {
  PoolCreated: {
    handler: (fn: any) => console.log('UniswapV3Factory.PoolCreated handler registered')
  }
};

export const UniswapV3Pool = {
  Swap: {
    handler: (fn: any) => console.log('UniswapV3Pool.Swap handler registered')
  },
  Mint: {
    handler: (fn: any) => console.log('UniswapV3Pool.Mint handler registered')
  },
  Burn: {
    handler: (fn: any) => console.log('UniswapV3Pool.Burn handler registered')
  }
};