import requests
import json
from typing import Dict, List, Optional
from web3 import Web3
from eth_account import Account

class SmartAccountExecutor:
    def __init__(self, backend_url: str = "http://localhost:3001"):
        self.backend_url = backend_url
        self.w3 = Web3(Web3.HTTPProvider('https://testnet1.monad.xyz'))
        
    def execute_rebalance(self, 
                         delegation_hash: str,
                         smart_account: str,
                         pool_address: str,
                         amount: int,
                         action: str) -> Dict:
        """Execute a rebalance operation using delegated Smart Account"""
        
        try:
            # Encode the rebalance transaction data
            if action == 'deposit':
                # Encode deposit call
                call_data = self._encode_deposit(pool_address, amount)
            elif action == 'withdraw':
                # Encode withdraw call
                call_data = self._encode_withdraw(pool_address, amount)
            else:
                raise ValueError(f"Unknown action: {action}")
            
            # Execute via backend Smart Account service
            response = requests.post(f"{self.backend_url}/api/smart-account/execute", json={
                'delegationHash': delegation_hash,
                'target': pool_address,
                'data': call_data,
                'value': amount if action == 'deposit' else 0,
                'smartAccountAddress': smart_account
            })
            
            if response.status_code != 200:
                raise Exception(f"Execution failed: {response.text}")
            
            result = response.json()
            
            # Log the execution
            print(f"✅ Executed {action} via Smart Account")
            print(f"   Delegation: {delegation_hash[:10]}...")
            print(f"   Pool: {pool_address}")
            print(f"   Amount: {amount}")
            print(f"   Tx Hash: {result['txHash']}")
            
            return result
            
        except Exception as e:
            print(f"❌ Smart Account execution failed: {e}")
            raise
    
    def validate_delegation_constraints(self, 
                                      delegation_hash: str,
                                      pool_address: str,
                                      amount: int) -> bool:
        """Validate that the proposed action is within delegation constraints"""
        
        try:
            response = requests.post(f"{self.backend_url}/api/delegations/validate", json={
                'delegationHash': delegation_hash,
                'target': pool_address,
                'amount': amount
            })
            
            return response.status_code == 200
            
        except Exception as e:
            print(f"❌ Delegation validation failed: {e}")
            return False
    
    def get_active_delegations(self, smart_account: str) -> List[Dict]:
        """Get active delegations for a Smart Account"""
        
        try:
            response = requests.get(f"{self.backend_url}/api/delegations/{smart_account}")
            
            if response.status_code == 200:
                return response.json()
            else:
                return []
                
        except Exception as e:
            print(f"❌ Failed to get delegations: {e}")
            return []
    
    def _encode_deposit(self, pool_address: str, amount: int) -> str:
        """Encode deposit function call"""
        # This would encode the actual pool contract deposit function
        # For demo purposes, using a simple transfer
        return self.w3.keccak(text="deposit(uint256)")[:4].hex() + \
               self.w3.to_hex(amount)[2:].zfill(64)
    
    def _encode_withdraw(self, pool_address: str, amount: int) -> str:
        """Encode withdraw function call"""
        # This would encode the actual pool contract withdraw function
        return self.w3.keccak(text="withdraw(uint256)")[:4].hex() + \
               self.w3.to_hex(amount)[2:].zfill(64)

# Example usage in AI agent
if __name__ == "__main__":
    executor = SmartAccountExecutor()
    
    # Mock delegation and Smart Account
    delegation_hash = "0x1234567890abcdef"
    smart_account = "0x742d35Cc6634C0532925a3b8D4C9db4C8b9b8b8b"
    pool_address = "0x853d955aCEf822Db058eb8505911ED77F175b99e"
    
    # Validate constraints first
    if executor.validate_delegation_constraints(delegation_hash, pool_address, 1000):
        # Execute the rebalance
        result = executor.execute_rebalance(
            delegation_hash=delegation_hash,
            smart_account=smart_account,
            pool_address=pool_address,
            amount=1000,
            action="deposit"
        )
        print(f"Rebalance executed: {result['txHash']}")
    else:
        print("❌ Delegation constraints not met")