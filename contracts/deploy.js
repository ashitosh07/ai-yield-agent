const { ethers } = require('hardhat');

async function main() {
  console.log('🚀 Deploying DelegationManager to Monad Testnet...');

  // Get the contract factory
  const DelegationManager = await ethers.getContractFactory('DelegationManager');

  // Deploy the contract
  const delegationManager = await DelegationManager.deploy();
  await delegationManager.deployed();

  console.log('✅ DelegationManager deployed to:', delegationManager.address);
  console.log('📋 Transaction hash:', delegationManager.deployTransaction.hash);

  // Verify deployment
  const code = await ethers.provider.getCode(delegationManager.address);
  if (code === '0x') {
    console.log('❌ Contract deployment failed');
  } else {
    console.log('✅ Contract deployed successfully');
    console.log('🔗 Explorer:', `https://testnet.monadexplorer.com/address/${delegationManager.address}`);
  }

  // Save deployment info
  const deploymentInfo = {
    address: delegationManager.address,
    txHash: delegationManager.deployTransaction.hash,
    network: 'monad-testnet',
    timestamp: new Date().toISOString(),
  };

  console.log('\n📝 Add to .env.local:');
  console.log(`NEXT_PUBLIC_DELEGATION_MANAGER_ADDRESS=${delegationManager.address}`);

  return delegationManager;
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('❌ Deployment failed:', error);
    process.exit(1);
  });