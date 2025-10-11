import { UniswapV2Factory } from "generated";

// Dynamic contract registration for new pools
UniswapV2Factory.PairCreated.contractRegister(({ event, context }) => {
  // Register the newly created pair contract for indexing
  context.addUniswapV2Pair(event.params.pair);
});

// This allows us to automatically start indexing new pools as they're created
// without having to manually add each pool address to config.yaml