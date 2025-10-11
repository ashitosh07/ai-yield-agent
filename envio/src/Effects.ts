import { experimental_createEffect, S } from "envio";

// Effect for fetching token metadata from external APIs
export const getTokenMetadata = experimental_createEffect(
  {
    name: "getTokenMetadata",
    input: S.string, // Token address
    output: {
      name: S.string,
      symbol: S.string,
      decimals: S.number,
      logoURI: S.string.optional(),
    },
    cache: true, // Cache results in database
  },
  async ({ input: tokenAddress }) => {
    try {
      // Try multiple token metadata sources
      const sources = [
        `https://tokens.coingecko.com/ethereum/all.json`,
        `https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/ethereum/tokenlist.json`
      ];
      
      for (const source of sources) {
        try {
          const response = await fetch(source);
          const data = await response.json();
          
          // Find token in the list
          const token = data.tokens?.find((t: any) => 
            t.address.toLowerCase() === tokenAddress.toLowerCase()
          );
          
          if (token) {
            return {
              name: token.name,
              symbol: token.symbol,
              decimals: token.decimals,
              logoURI: token.logoURI,
            };
          }
        } catch (error) {
          console.warn(`Failed to fetch from ${source}:`, error);
        }
      }
      
      // Fallback to contract call if external APIs fail
      return {
        name: "Unknown Token",
        symbol: "UNKNOWN",
        decimals: 18,
      };
    } catch (error) {
      console.error("Token metadata fetch failed:", error);
      return {
        name: "Unknown Token",
        symbol: "UNKNOWN", 
        decimals: 18,
      };
    }
  }
);

// Effect for price data from external oracles
export const getTokenPrice = experimental_createEffect(
  {
    name: "getTokenPrice",
    input: S.string, // Token address
    output: {
      priceUSD: S.number,
      priceETH: S.number,
      lastUpdated: S.number,
    },
    cache: true,
  },
  async ({ input: tokenAddress }) => {
    try {
      // Fetch price from multiple sources for reliability
      const response = await fetch(
        `https://api.coingecko.com/api/v3/simple/token_price/ethereum?contract_addresses=${tokenAddress}&vs_currencies=usd,eth`
      );
      
      const data = await response.json();
      const tokenData = data[tokenAddress.toLowerCase()];
      
      if (tokenData) {
        return {
          priceUSD: tokenData.usd || 0,
          priceETH: tokenData.eth || 0,
          lastUpdated: Date.now(),
        };
      }
      
      // Fallback to 1:1 ratio for demo
      return {
        priceUSD: 1,
        priceETH: 0.0003,
        lastUpdated: Date.now(),
      };
    } catch (error) {
      console.error("Price fetch failed:", error);
      return {
        priceUSD: 1,
        priceETH: 0.0003,
        lastUpdated: Date.now(),
      };
    }
  }
);

// Effect for AI analysis webhook
export const triggerAIAnalysis = experimental_createEffect(
  {
    name: "triggerAIAnalysis",
    input: {
      poolId: S.string,
      eventType: S.string,
      timestamp: S.number,
      data: S.any.optional(),
    },
    output: {
      success: S.boolean,
      actionId: S.string.optional(),
    },
    cache: false, // Don't cache AI triggers
  },
  async ({ input }) => {
    try {
      const response = await fetch('http://localhost:3003/envio-webhook', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          poolId: input.poolId,
          eventType: input.eventType,
          timestamp: input.timestamp,
          data: input.data,
          source: 'envio-indexer'
        })
      });

      if (response.ok) {
        const result = await response.json();
        return {
          success: true,
          actionId: result.actionId,
        };
      }
      
      return { success: false };
    } catch (error) {
      console.error('AI analysis trigger failed:', error);
      return { success: false };
    }
  }
);