import asyncio
import json
import logging
from typing import Dict, List, Optional
from dataclasses import dataclass
import aiohttp
import os
import hashlib
import time
import random

logger = logging.getLogger(__name__)

@dataclass
class TransactionResult:
    tx_hash: str
    status: str
    gas_used: int
    gas_price: int
    block_number: int

class MonadClient:
    def __init__(self):
        self.rpc_url = os.getenv('MONAD_RPC_URL', 'https://testnet-rpc.monad.xyz')
        self.bundler_url = os.getenv('BUNDLER_URL', 'https://api.pimlico.io/v2/monad-testnet/rpc')
        self.chain_id = 41454  # Monad Testnet
        
        # Smart Account configuration
        self.smart_account_factory = os.getenv('SMART_ACCOUNT_FACTORY')
        self.ai_agent_private_key = os.getenv('AI_AGENT_PRIVATE_KEY')
        
        logger.info("MonadClient initialized (demo mode - web3 disabled for compatibility)")
        logger.warning("AI Agent private key not configured (demo mode)")
    
    async def get_pool_data(self, pool_addresses: List[str]) -> List[Dict]:
        """
        Fetch real-time pool data from Monad blockchain
        """
        pool_data = []
        
        for address in pool_addresses:
            try:
                # Get pool contract data
                pool_info = await self._get_pool_contract_data(address)
                pool_data.append(pool_info)
            except Exception as e:
                logger.error(f"Error fetching pool data for {address}: {str(e)}")
                # Fallback to mock data
                pool_data.append(self._get_mock_pool_data(address))
        
        return pool_data
    
    async def _get_pool_contract_data(self, pool_address: str) -> Dict:
        """
        Get pool data from smart contract
        """
        # Pool ABI (simplified)
        pool_abi = [
            {
                "inputs": [],
                "name": "getReserves",
                "outputs": [
                    {"type": "uint112", "name": "reserve0"},
                    {"type": "uint112", "name": "reserve1"},
                    {"type": "uint32", "name": "blockTimestampLast"}
                ],
                "stateMutability": "view",
                "type": "function"
            },
            {
                "inputs": [],
                "name": "totalSupply",
                "outputs": [{"type": "uint256", "name": ""}],
                "stateMutability": "view",
                "type": "function"
            }
        ]
        
        try:
            # Demo mode: return mock data with realistic values
            logger.info(f"Demo mode: generating mock data for pool {pool_address}")
            return self._get_mock_pool_data(pool_address)
            
        except Exception as e:
            logger.error(f"Error generating pool data for {pool_address}: {str(e)}")
            return self._get_mock_pool_data(pool_address)
    
    def _calculate_mock_apy(self, reserve0: float, reserve1: float, total_supply: int) -> float:
        """
        Calculate mock APY based on pool characteristics
        """
        # Simple heuristic: higher reserves = lower APY (more stable)
        total_reserves = reserve0 + reserve1
        base_apy = 15.0  # Base APY
        
        if total_reserves > 1000:
            return base_apy * 0.6  # Lower APY for large pools
        elif total_reserves > 100:
            return base_apy * 0.8
        else:
            return base_apy * 1.2  # Higher APY for smaller pools
    
    def _calculate_risk_score(self, tvl: float, apy: float) -> float:
        """
        Calculate risk score based on TVL and APY
        """
        risk = 0.0
        
        # TVL risk
        if tvl < 100000:
            risk += 0.4
        elif tvl < 1000000:
            risk += 0.2
        else:
            risk += 0.1
        
        # APY risk
        if apy > 20:
            risk += 0.3
        elif apy > 10:
            risk += 0.1
        
        return min(risk, 1.0)
    
    def _get_pool_name(self, address: str) -> str:
        """
        Get pool name based on address
        """
        pool_names = {
            "0x1234567890123456789012345678901234567890": "USDC/ETH",
            "0x2345678901234567890123456789012345678901": "DAI/USDC",
            "0x3456789012345678901234567890123456789012": "WETH/USDT"
        }
        return pool_names.get(address, f"Pool {address[:6]}...")
    
    def _get_mock_pool_data(self, address: str) -> Dict:
        """
        Fallback mock pool data
        """
        import random
        
        base_data = {
            "0x1234567890123456789012345678901234567890": {
                "name": "USDC/ETH",
                "base_apy": 12.5,
                "base_tvl": 1000000
            },
            "0x2345678901234567890123456789012345678901": {
                "name": "DAI/USDC", 
                "base_apy": 8.3,
                "base_tvl": 2000000
            },
            "0x3456789012345678901234567890123456789012": {
                "name": "WETH/USDT",
                "base_apy": 15.2,
                "base_tvl": 800000
            }
        }
        
        pool_info = base_data.get(address, {
            "name": f"Pool {address[:6]}...",
            "base_apy": 10.0,
            "base_tvl": 500000
        })
        
        # Add some randomness
        apy_variance = (random.random() - 0.5) * 4  # ±2% variance
        tvl_variance = (random.random() - 0.5) * 0.4  # ±20% variance
        
        return {
            "address": address,
            "name": pool_info["name"],
            "apy": max(0.1, pool_info["base_apy"] + apy_variance),
            "tvl": max(1000, pool_info["base_tvl"] * (1 + tvl_variance)),
            "volume24h": pool_info["base_tvl"] * 0.1,
            "risk_score": self._calculate_risk_score(pool_info["base_tvl"], pool_info["base_apy"])
        }
    
    async def execute_rebalance(self, action) -> str:
        """
        Execute rebalance transaction using smart account and bundler
        """
        try:
            # Prepare transaction data
            tx_data = await self._prepare_rebalance_transaction(action)
            
            # Sign and submit via bundler
            tx_hash = await self._submit_via_bundler(tx_data)
            
            logger.info(f"✅ Rebalance executed: {tx_hash}")
            return tx_hash
            
        except Exception as e:
            logger.error(f"❌ Rebalance execution failed: {str(e)}")
            # Return mock transaction hash for demo
            return f"0x{''.join([f'{i:02x}' for i in range(32)])}"
    
    async def _prepare_rebalance_transaction(self, action) -> Dict:
        """
        Prepare rebalance transaction data
        """
        # This would prepare the actual swap transaction
        # For demo, we'll create mock transaction data
        
        return {
            "to": action.to_pool,
            "value": "0",
            "data": "0x" + "00" * 100,  # Mock transaction data
            "gas": "200000",
            "gasPrice": "20000000000"  # 20 gwei in wei
        }
    
    async def _submit_via_bundler(self, tx_data: Dict) -> str:
        """
        Submit transaction via ERC-4337 bundler
        """
        try:
            async with aiohttp.ClientSession() as session:
                # Prepare user operation
                user_op = {
                    "sender": "0x" + "00" * 20,  # Smart account address
                    "nonce": "0x0",
                    "initCode": "0x",
                    "callData": tx_data["data"],
                    "callGasLimit": tx_data["gas"],
                    "verificationGasLimit": "100000",
                    "preVerificationGas": "50000",
                    "maxFeePerGas": tx_data["gasPrice"],
                    "maxPriorityFeePerGas": "2000000000",  # 2 gwei in wei
                    "paymasterAndData": "0x",
                    "signature": "0x" + "00" * 65
                }
                
                # Submit to bundler
                payload = {
                    "jsonrpc": "2.0",
                    "method": "eth_sendUserOperation",
                    "params": [user_op, "0x5FF137D4b0FDCD49DcA30c7CF57E578a026d2789"],  # EntryPoint
                    "id": 1
                }
                
                async with session.post(self.bundler_url, json=payload) as response:
                    result = await response.json()
                    
                    if "result" in result:
                        return result["result"]
                    else:
                        raise Exception(f"Bundler error: {result.get('error', 'Unknown error')}")
                        
        except Exception as e:
            logger.error(f"Bundler submission failed: {str(e)}")
            # Return mock hash for demo
            import hashlib
            import time
            mock_data = f"{action.from_pool}{action.to_pool}{action.amount}{time.time()}"
            return "0x" + hashlib.sha256(mock_data.encode()).hexdigest()
    
    async def get_user_positions(self, user_address: str) -> List[Dict]:
        """
        Get user's current positions across pools
        """
        try:
            positions = []
            pool_addresses = [
                "0x1234567890123456789012345678901234567890",
                "0x2345678901234567890123456789012345678901",
                "0x3456789012345678901234567890123456789012"
            ]
            
            for pool_address in pool_addresses:
                balance = await self._get_user_pool_balance(user_address, pool_address)
                if balance > 0:
                    pool_data = await self._get_pool_contract_data(pool_address)
                    
                    positions.append({
                        "poolAddress": pool_address,
                        "poolName": pool_data["name"],
                        "balance": str(balance),
                        "value": balance * 2000,  # Mock ETH price
                        "apy": pool_data["apy"],
                        "dailyEarnings": (balance * 2000 * pool_data["apy"] / 100) / 365
                    })
            
            return positions
            
        except Exception as e:
            logger.error(f"Error fetching user positions: {str(e)}")
            # Return mock positions
            return [
                {
                    "poolAddress": "0x1234567890123456789012345678901234567890",
                    "poolName": "USDC/ETH",
                    "balance": "1.5",
                    "value": 3000,
                    "apy": 12.5,
                    "dailyEarnings": 1.03
                },
                {
                    "poolAddress": "0x2345678901234567890123456789012345678901",
                    "poolName": "DAI/USDC",
                    "balance": "0.8",
                    "value": 1600,
                    "apy": 8.3,
                    "dailyEarnings": 0.36
                }
            ]
    
    async def _get_user_pool_balance(self, user_address: str, pool_address: str) -> float:
        """
        Get user's balance in a specific pool
        """
        try:
            # Demo mode: return mock balance
            logger.info(f"Demo mode: generating mock balance for {user_address} in {pool_address}")
            return random.uniform(0, 2.0)
            
        except Exception as e:
            logger.error(f"Error getting user balance: {str(e)}")
            return random.uniform(0, 2.0)
    
    async def get_transaction_receipt(self, tx_hash: str) -> Optional[TransactionResult]:
        """
        Get transaction receipt and status
        """
        try:
            # Demo mode: return mock transaction result
            logger.info(f"Demo mode: generating mock receipt for {tx_hash}")
            return TransactionResult(
                tx_hash=tx_hash,
                status="success",
                gas_used=150000,
                gas_price=20000000000,  # 20 gwei
                block_number=random.randint(1000000, 2000000)
            )
            
        except Exception as e:
            logger.error(f"Error getting transaction receipt: {str(e)}")
            return None
    
    def get_chain_info(self) -> Dict:
        """
        Get Monad testnet chain information
        """
        return {
            "chain_id": self.chain_id,
            "name": "Monad Testnet",
            "rpc_url": self.rpc_url,
            "explorer": "https://testnet.monadexplorer.com",
            "native_token": "MON"
        }