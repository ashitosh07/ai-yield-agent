import { describe, it, expect, beforeEach } from "vitest";
import { MockDb, UniswapV2Factory, UniswapV2Pair } from "generated/src/TestHelpers";
import { BigDecimal } from "generated/src/BigDecimal";

describe("AI Yield Agent Event Handlers", () => {
  let mockDb: MockDb;

  beforeEach(() => {
    mockDb = MockDb.createMockDb();
  });

  describe("PairCreated Handler", () => {
    it("should create pool and factory entities", async () => {
      const mockEvent = UniswapV2Factory.PairCreated.createMockEvent({
        token0: "0xa0b86a33e6441e6c7d3e4c5b4b6b6b6b6b6b6b6b",
        token1: "0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2",
        pair: "0x742d35Cc6634C0532925a3b8D4C9db4C8b9b8b8b",
        param3: 1n,
      });

      await UniswapV2Factory.PairCreated.processEvent({
        event: mockEvent,
        mockDb,
      });

      // Check that pool was created
      const pool = mockDb.entities.Pool.get("0x742d35cc6634c0532925a3b8d4c9db4c8b9b8b8b");
      expect(pool).toBeDefined();
      expect(pool?.token0).toBe("0xa0b86a33e6441e6c7d3e4c5b4b6b6b6b6b6b6b6b");
      expect(pool?.token1).toBe("0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2");
      expect(pool?.isActive).toBe(true);

      // Check that factory was created/updated
      const factory = mockDb.entities.Factory.get(mockEvent.srcAddress.toLowerCase());
      expect(factory).toBeDefined();
      expect(factory?.poolCount).toBe(1n);

      // Check that AI action was created
      const aiActions = Array.from(mockDb.entities.AIAction.values());
      expect(aiActions).toHaveLength(1);
      expect(aiActions[0].actionType).toBe("POOL_CREATED");
      expect(aiActions[0].status).toBe("PENDING");
    });
  });

  describe("Swap Handler", () => {
    it("should process swap and update pool metrics", async () => {
      // First create a pool
      const poolId = "0x742d35cc6634c0532925a3b8d4c9db4c8b9b8b8b";
      mockDb.entities.Pool.set({
        id: poolId,
        token0: "0xa0b86a33e6441e6c7d3e4c5b4b6b6b6b6b6b6b6b",
        token1: "0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2",
        token0Symbol: "USDC",
        token1Symbol: "ETH",
        reserve0: 1000000n,
        reserve1: 400n,
        totalSupply: 20000n,
        txCount: 0n,
        createdAtTimestamp: 1000000n,
        createdAtBlockNumber: 1000n,
        lastSyncTimestamp: 1000000n,
        lastSyncBlockNumber: 1000n,
        volumeUSD: new BigDecimal("0"),
        feesUSD: new BigDecimal("0"),
        apy: new BigDecimal("0"),
        tvlUSD: new BigDecimal("1000000"),
        isActive: true,
      });

      const mockSwapEvent = UniswapV2Pair.Swap.createMockEvent({
        sender: "0x1234567890123456789012345678901234567890",
        amount0In: 1000n * 10n ** 18n,
        amount1In: 0n,
        amount0Out: 0n,
        amount1Out: 1n * 10n ** 18n,
        to: "0x0987654321098765432109876543210987654321",
      });

      await UniswapV2Pair.Swap.processEvent({
        event: mockSwapEvent,
        mockDb,
      });

      // Check that swap was created
      const swapId = `${mockSwapEvent.transaction.hash}-${mockSwapEvent.logIndex}`;
      const swap = mockDb.entities.Swap.get(swapId);
      expect(swap).toBeDefined();
      expect(swap?.pool_id).toBe(poolId);
      expect(swap?.sender).toBe("0x1234567890123456789012345678901234567890");

      // Check that pool metrics were updated
      const updatedPool = mockDb.entities.Pool.get(poolId);
      expect(updatedPool?.txCount).toBe(1n);
      expect(updatedPool?.volumeUSD.gt(new BigDecimal("0"))).toBe(true);
      expect(updatedPool?.feesUSD.gt(new BigDecimal("0"))).toBe(true);
    });
  });
});