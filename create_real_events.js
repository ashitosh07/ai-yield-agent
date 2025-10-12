const { ethers } = require('ethers');

class MonadEventGenerator {
  constructor() {
    this.provider = new ethers.JsonRpcProvider('https://testnet-rpc.monad.xyz');
    this.tokenAddress = '0x8f5f1F5a93Be3C57f53f85B705f179F936dcDCea';
    
    // You need to add your private key here (testnet only!)
    this.privateKey = 'a21ec11ec900314ec5d03c5a4c592b022d20cab52039765c9ee0460fa0012fa4'; // Replace with your testnet private key
    this.wallet = new ethers.Wallet(this.privateKey, this.provider);
    
    // MON Token ABI
    this.tokenABI = [
      'function transfer(address to, uint256 amount) returns (bool)',
      'function approve(address spender, uint256 amount) returns (bool)',
      'function balanceOf(address account) view returns (uint256)',
      'function allowance(address owner, address spender) view returns (uint256)',
      'event Transfer(address indexed from, address indexed to, uint256 value)',
      'event Approval(address indexed owner, address indexed spender, uint256 value)'
    ];
    
    this.tokenContract = new ethers.Contract(this.tokenAddress, this.tokenABI, this.wallet);
    
    // Test addresses for transactions
    this.testAddresses = [
      '0x742d35Cc6634C0532925a3b8D4C9db96590b5c8e',
      '0x8ba1f109551bD432803012645Hac136c22C177e9',
      '0x1234567890123456789012345678901234567890',
      '0xabcdefabcdefabcdefabcdefabcdefabcdefabcd'
    ];
  }

  async checkBalance() {
    try {
      const balance = await this.tokenContract.balanceOf(this.wallet.address);
      const ethBalance = await this.provider.getBalance(this.wallet.address);
      
      console.log(`💰 Wallet: ${this.wallet.address}`);
      console.log(`💰 MON Balance: ${ethers.formatEther(balance)} MON`);
      console.log(`⛽ ETH Balance: ${ethers.formatEther(ethBalance)} ETH`);
      
      return { monBalance: balance, ethBalance };
    } catch (error) {
      console.error('❌ Error checking balance:', error.message);
      return null;
    }
  }

  async createTransferEvent(toAddress, amount) {
    try {
      console.log(`📤 Creating Transfer event: ${amount} MON to ${toAddress.slice(0,8)}...`);
      
      const tx = await this.tokenContract.transfer(toAddress, ethers.parseEther(amount.toString()));
      console.log(`⏳ Transaction sent: ${tx.hash}`);
      
      const receipt = await tx.wait();
      console.log(`✅ Transfer confirmed in block ${receipt.blockNumber}`);
      
      return {
        type: 'Transfer',
        hash: tx.hash,
        blockNumber: receipt.blockNumber,
        from: this.wallet.address,
        to: toAddress,
        amount: amount
      };
      
    } catch (error) {
      console.error('❌ Transfer failed:', error.message);
      return null;
    }
  }

  async createApprovalEvent(spenderAddress, amount) {
    try {
      console.log(`✅ Creating Approval event: ${amount} MON for ${spenderAddress.slice(0,8)}...`);
      
      const tx = await this.tokenContract.approve(spenderAddress, ethers.parseEther(amount.toString()));
      console.log(`⏳ Transaction sent: ${tx.hash}`);
      
      const receipt = await tx.wait();
      console.log(`✅ Approval confirmed in block ${receipt.blockNumber}`);
      
      return {
        type: 'Approval',
        hash: tx.hash,
        blockNumber: receipt.blockNumber,
        owner: this.wallet.address,
        spender: spenderAddress,
        amount: amount
      };
      
    } catch (error) {
      console.error('❌ Approval failed:', error.message);
      return null;
    }
  }

  async generateRandomEvents(count = 5) {
    console.log(`🎲 Generating ${count} random events...`);
    
    const events = [];
    
    for (let i = 0; i < count; i++) {
      const eventType = Math.random() > 0.5 ? 'transfer' : 'approval';
      const randomAddress = this.testAddresses[Math.floor(Math.random() * this.testAddresses.length)];
      const randomAmount = (Math.random() * 10 + 1).toFixed(2); // 1-10 MON
      
      let result;
      if (eventType === 'transfer') {
        result = await this.createTransferEvent(randomAddress, randomAmount);
      } else {
        result = await this.createApprovalEvent(randomAddress, randomAmount);
      }
      
      if (result) {
        events.push(result);
      }
      
      // Wait 2 seconds between transactions
      await new Promise(resolve => setTimeout(resolve, 2000));
    }
    
    return events;
  }

  async continuousEventGeneration() {
    console.log('🔄 Starting continuous event generation...');
    console.log('⚠️  Press Ctrl+C to stop');
    
    while (true) {
      try {
        // Generate 1-3 random events every 30 seconds
        const eventCount = Math.floor(Math.random() * 3) + 1;
        await this.generateRandomEvents(eventCount);
        
        console.log(`⏰ Waiting 30 seconds before next batch...`);
        await new Promise(resolve => setTimeout(resolve, 30000));
        
      } catch (error) {
        console.error('❌ Error in continuous generation:', error.message);
        await new Promise(resolve => setTimeout(resolve, 60000)); // Wait 1 minute on error
      }
    }
  }
}

// Usage
async function main() {
  console.log('🚀 Monad Event Generator Starting...');
  console.log('📊 Contract: 0x8f5f1F5a93Be3C57f53f85B705f179F936dcDCea');
  console.log('🌐 Network: Monad Testnet');
  console.log('');
  
  const generator = new MonadEventGenerator();
  
  // Check if private key is set
  if (generator.privateKey === 'a21ec11ec900314ec5d03c5a4c592b022d20cab52039765c9ee0460fa0012fa4') {
    console.log('❌ Please set your private key in the script!');
    console.log('⚠️  Use a testnet-only wallet with MON tokens');
    return;
  }
  
  // Check balances
  const balances = await generator.checkBalance();
  if (!balances) return;
  
  if (balances.monBalance === 0n) {
    console.log('❌ No MON tokens found! Get tokens from faucet first.');
    return;
  }
  
  if (balances.ethBalance < ethers.parseEther('0.01')) {
    console.log('❌ Low ETH balance! Get testnet ETH for gas fees.');
    return;
  }
  
  console.log('');
  console.log('Choose an option:');
  console.log('1. Generate 5 random events');
  console.log('2. Start continuous event generation');
  console.log('3. Create single transfer');
  console.log('4. Create single approval');
  
  // For demo, let's generate 5 random events
  console.log('🎯 Generating 5 random events...');
  const events = await generator.generateRandomEvents(5);
  
  console.log('');
  console.log('✅ Event generation complete!');
  console.log(`📊 Created ${events.length} events`);
  console.log('🔍 Check your indexer - events should appear shortly!');
}

// Run if called directly
if (require.main === module) {
  main().catch(console.error);
}

module.exports = MonadEventGenerator;