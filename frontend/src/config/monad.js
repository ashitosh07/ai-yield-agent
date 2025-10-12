// Monad Testnet Configuration for Delegation Toolkit
export const monadTestnet = {
  id: 10143,
  name: 'Monad Testnet',
  network: 'monad-testnet',
  nativeCurrency: {
    decimals: 18,
    name: 'Monad',
    symbol: 'MON',
  },
  rpcUrls: {
    default: {
      http: ['https://testnet-rpc.monad.xyz'],
      webSocket: ['wss://testnet-rpc.monad.xyz'],
    },
    public: {
      http: ['https://testnet-rpc.monad.xyz'],
      webSocket: ['wss://testnet-rpc.monad.xyz'],
    },
  },
  blockExplorers: {
    default: { name: 'Monad Explorer', url: 'https://testnet.monadexplorer.com' },
  },
  contracts: {
    // MetaMask Smart Account contracts
    smartAccountFactory: '0x742d35Cc6634C0532925a3b8D4C9db4C8b9b8b8b',
    delegationManager: '0x853d955aCEf822Db058eb8505911ED77F175b99e',
    entryPoint: '0x5FF137D4b0FDCD49DcA30c7CF57E578a026d2789',
    // Real Monad testnet contracts
    contract1: '0x642672169398C3281A14D063626371eFC30CeF3F',
    contract2: '0x8f5f1F5a93Be3C57f53f85B705f179F936dcDCea',
  },
  testnet: true,
};

export const DELEGATION_CONFIG = {
  bundlerUrl: 'https://bundler.testnet1.monad.xyz',
  paymasterUrl: 'https://paymaster.testnet1.monad.xyz',
  factoryAddress: monadTestnet.contracts.smartAccountFactory,
  entryPointAddress: monadTestnet.contracts.entryPoint,
  delegationManagerAddress: monadTestnet.contracts.delegationManager,
  // AI Agent address that will receive delegations
  aiAgentAddress: '0x742d35Cc6634C0532925a3b8D4C9db4C8b9b8b8b',
};