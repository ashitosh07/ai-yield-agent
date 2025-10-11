import { createConfig, http } from 'wagmi'
import { monadTestnet } from './chains'
import { metaMask } from 'wagmi/connectors'

export const config = createConfig({
  chains: [monadTestnet],
  connectors: [
    metaMask({
      dappMetadata: {
        name: 'AI Yield Agent',
        url: 'https://ai-yield-agent.com',
      },
    }),
  ],
  transports: {
    [monadTestnet.id]: http(),
  },
})