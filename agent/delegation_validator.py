import asyncio
import json
import logging
from typing import Dict, List, Optional, Tuple
from dataclasses import dataclass
from datetime import datetime, timedelta
import aiohttp
import os

logger = logging.getLogger(__name__)

@dataclass
class DelegationConstraints:
    max_amount: float
    allowed_pools: List[str]
    expiry: datetime
    risk_tolerance: str
    daily_limit: Optional[float] = None
    transaction_limit: Optional[int] = None

@dataclass
class ValidationResult:
    is_valid: bool
    reason: str
    remaining_amount: float
    remaining_transactions: int

class DelegationValidator:
    def __init__(self):
        self.backend_url = os.getenv('BACKEND_URL', 'http://localhost:3002')
        self.delegation_cache = {}
        self.usage_tracking = {}
    
    async def validate_action(self, action, user_address: str = None) -> ValidationResult:
        """
        Comprehensive validation of AI agent action against delegation constraints
        """
        try:
            # Get delegation constraints
            constraints = await self._get_delegation_constraints(user_address or action.user_address)
            
            if not constraints:
                return ValidationResult(
                    is_valid=False,
                    reason="No active delegation found",
                    remaining_amount=0,
                    remaining_transactions=0
                )
            
            # Perform all validation checks
            validation_checks = [
                self._validate_expiry(constraints),
                self._validate_amount_limit(action, constraints, user_address),
                self._validate_pool_allowlist(action, constraints),
                self._validate_risk_tolerance(action, constraints),
                self._validate_daily_limits(action, constraints, user_address),
                self._validate_transaction_limits(action, constraints, user_address)
            ]
            
            # Execute all validations
            results = await asyncio.gather(*validation_checks, return_exceptions=True)
            
            # Check for any validation failures
            for result in results:
                if isinstance(result, Exception):
                    logger.error(f"Validation error: {str(result)}")
                    return ValidationResult(
                        is_valid=False,
                        reason=f"Validation error: {str(result)}",
                        remaining_amount=0,
                        remaining_transactions=0
                    )
                
                if not result.is_valid:
                    return result
            
            # All validations passed
            return ValidationResult(
                is_valid=True,
                reason="All constraints satisfied",
                remaining_amount=constraints.max_amount - self._get_used_amount(user_address),
                remaining_transactions=self._get_remaining_transactions(constraints, user_address)
            )
            
        except Exception as e:
            logger.error(f"Validation failed: {str(e)}")
            return ValidationResult(
                is_valid=False,
                reason=f"Validation system error: {str(e)}",
                remaining_amount=0,
                remaining_transactions=0
            )
    
    async def _get_delegation_constraints(self, user_address: str) -> Optional[DelegationConstraints]:
        """
        Fetch delegation constraints from backend
        """
        try:
            # Check cache first
            cache_key = f"delegation_{user_address}"
            if cache_key in self.delegation_cache:
                cached_data, cache_time = self.delegation_cache[cache_key]
                if datetime.now() - cache_time < timedelta(minutes=5):
                    return cached_data
            
            async with aiohttp.ClientSession() as session:
                async with session.get(f"{self.backend_url}/api/delegations/{user_address}") as response:
                    if response.status == 200:
                        data = await response.json()
                        
                        if data.get('success') and data.get('data'):
                            # Get the most recent active delegation
                            active_delegations = [
                                d for d in data['data'] 
                                if d.get('status') == 'active'
                            ]
                            
                            if not active_delegations:
                                return None
                            
                            delegation = active_delegations[0]  # Most recent
                            
                            constraints = DelegationConstraints(
                                max_amount=float(delegation.get('maxAmount', 0)),
                                allowed_pools=delegation.get('allowedPools', []),
                                expiry=datetime.fromisoformat(delegation.get('expiry', '').replace('Z', '+00:00')),
                                risk_tolerance=delegation.get('riskTolerance', 'medium'),
                                daily_limit=float(delegation.get('dailyLimit', 0)) if delegation.get('dailyLimit') else None,
                                transaction_limit=int(delegation.get('transactionLimit', 0)) if delegation.get('transactionLimit') else None
                            )
                            
                            # Cache the result
                            self.delegation_cache[cache_key] = (constraints, datetime.now())
                            
                            return constraints
                    
                    return None
                    
        except Exception as e:
            logger.error(f"Error fetching delegation constraints: {str(e)}")
            return None
    
    async def _validate_expiry(self, constraints: DelegationConstraints) -> ValidationResult:
        """
        Validate delegation hasn't expired
        """
        now = datetime.now(constraints.expiry.tzinfo) if constraints.expiry.tzinfo else datetime.now()
        
        if now > constraints.expiry:
            return ValidationResult(
                is_valid=False,
                reason=f"Delegation expired at {constraints.expiry}",
                remaining_amount=0,
                remaining_transactions=0
            )
        
        return ValidationResult(
            is_valid=True,
            reason="Delegation still active",
            remaining_amount=0,
            remaining_transactions=0
        )
    
    async def _validate_amount_limit(self, action, constraints: DelegationConstraints, user_address: str) -> ValidationResult:
        """
        Validate action amount doesn't exceed delegation limits
        """
        action_amount = float(getattr(action, 'amount', 0))
        used_amount = self._get_used_amount(user_address)
        remaining_amount = constraints.max_amount - used_amount
        
        if action_amount > remaining_amount:
            return ValidationResult(
                is_valid=False,
                reason=f"Amount {action_amount} exceeds remaining limit {remaining_amount}",
                remaining_amount=remaining_amount,
                remaining_transactions=0
            )
        
        return ValidationResult(
            is_valid=True,
            reason="Amount within limits",
            remaining_amount=remaining_amount - action_amount,
            remaining_transactions=0
        )
    
    async def _validate_pool_allowlist(self, action, constraints: DelegationConstraints) -> ValidationResult:
        """
        Validate pools are in the allowed list
        """
        from_pool = getattr(action, 'from_pool', None)
        to_pool = getattr(action, 'to_pool', None)
        
        if from_pool and from_pool not in constraints.allowed_pools:
            return ValidationResult(
                is_valid=False,
                reason=f"Source pool {from_pool} not in allowed list",
                remaining_amount=0,
                remaining_transactions=0
            )
        
        if to_pool and to_pool not in constraints.allowed_pools:
            return ValidationResult(
                is_valid=False,
                reason=f"Target pool {to_pool} not in allowed list",
                remaining_amount=0,
                remaining_transactions=0
            )
        
        return ValidationResult(
            is_valid=True,
            reason="Pools are allowed",
            remaining_amount=0,
            remaining_transactions=0
        )
    
    async def _validate_risk_tolerance(self, action, constraints: DelegationConstraints) -> ValidationResult:
        """
        Validate action aligns with risk tolerance
        """
        risk_increase = getattr(action, 'risk_adjustment', 0)
        
        risk_limits = {
            'low': 0.1,      # Max 0.1 risk score increase
            'medium': 0.2,   # Max 0.2 risk score increase  
            'high': 0.5      # Max 0.5 risk score increase
        }
        
        max_risk_increase = risk_limits.get(constraints.risk_tolerance, 0.2)
        
        if risk_increase > max_risk_increase:
            return ValidationResult(
                is_valid=False,
                reason=f"Risk increase {risk_increase} exceeds tolerance {max_risk_increase}",
                remaining_amount=0,
                remaining_transactions=0
            )
        
        return ValidationResult(
            is_valid=True,
            reason="Risk within tolerance",
            remaining_amount=0,
            remaining_transactions=0
        )
    
    async def _validate_daily_limits(self, action, constraints: DelegationConstraints, user_address: str) -> ValidationResult:
        """
        Validate daily transaction limits
        """
        if not constraints.daily_limit:
            return ValidationResult(
                is_valid=True,
                reason="No daily limit set",
                remaining_amount=0,
                remaining_transactions=0
            )
        
        daily_usage = self._get_daily_usage(user_address)
        action_amount = float(getattr(action, 'amount', 0))
        
        if daily_usage + action_amount > constraints.daily_limit:
            return ValidationResult(
                is_valid=False,
                reason=f"Daily limit exceeded: {daily_usage + action_amount} > {constraints.daily_limit}",
                remaining_amount=0,
                remaining_transactions=0
            )
        
        return ValidationResult(
            is_valid=True,
            reason="Within daily limits",
            remaining_amount=0,
            remaining_transactions=0
        )
    
    async def _validate_transaction_limits(self, action, constraints: DelegationConstraints, user_address: str) -> ValidationResult:
        """
        Validate transaction count limits
        """
        if not constraints.transaction_limit:
            return ValidationResult(
                is_valid=True,
                reason="No transaction limit set",
                remaining_amount=0,
                remaining_transactions=999
            )
        
        transaction_count = self._get_transaction_count(user_address)
        remaining_transactions = constraints.transaction_limit - transaction_count
        
        if remaining_transactions <= 0:
            return ValidationResult(
                is_valid=False,
                reason=f"Transaction limit reached: {transaction_count}/{constraints.transaction_limit}",
                remaining_amount=0,
                remaining_transactions=0
            )
        
        return ValidationResult(
            is_valid=True,
            reason="Within transaction limits",
            remaining_amount=0,
            remaining_transactions=remaining_transactions - 1
        )
    
    def _get_used_amount(self, user_address: str) -> float:
        """
        Get total amount used by user (mock implementation)
        """
        # In production, this would query the database
        return self.usage_tracking.get(f"{user_address}_amount", 0.5)  # Mock used amount
    
    def _get_daily_usage(self, user_address: str) -> float:
        """
        Get daily usage for user (mock implementation)
        """
        # In production, this would query today's transactions
        return self.usage_tracking.get(f"{user_address}_daily", 0.2)  # Mock daily usage
    
    def _get_transaction_count(self, user_address: str) -> int:
        """
        Get transaction count for user (mock implementation)
        """
        # In production, this would query the database
        return self.usage_tracking.get(f"{user_address}_tx_count", 3)  # Mock transaction count
    
    def _get_remaining_transactions(self, constraints: DelegationConstraints, user_address: str) -> int:
        """
        Calculate remaining transactions
        """
        if not constraints.transaction_limit:
            return 999  # Unlimited
        
        used_count = self._get_transaction_count(user_address)
        return max(0, constraints.transaction_limit - used_count)
    
    async def update_usage_tracking(self, user_address: str, action) -> None:
        """
        Update usage tracking after successful action
        """
        try:
            amount = float(getattr(action, 'amount', 0))
            
            # Update total used amount
            current_amount = self.usage_tracking.get(f"{user_address}_amount", 0)
            self.usage_tracking[f"{user_address}_amount"] = current_amount + amount
            
            # Update daily usage
            current_daily = self.usage_tracking.get(f"{user_address}_daily", 0)
            self.usage_tracking[f"{user_address}_daily"] = current_daily + amount
            
            # Update transaction count
            current_tx_count = self.usage_tracking.get(f"{user_address}_tx_count", 0)
            self.usage_tracking[f"{user_address}_tx_count"] = current_tx_count + 1
            
            # Log usage update
            await self._log_usage_update(user_address, action, amount)
            
        except Exception as e:
            logger.error(f"Error updating usage tracking: {str(e)}")
    
    async def _log_usage_update(self, user_address: str, action, amount: float) -> None:
        """
        Log usage update to backend
        """
        try:
            async with aiohttp.ClientSession() as session:
                log_data = {
                    "user_address": user_address,
                    "action": "usage_update",
                    "amount": amount,
                    "action_type": getattr(action, 'action_type', 'rebalance'),
                    "timestamp": datetime.now().isoformat()
                }
                
                async with session.post(f"{self.backend_url}/api/audit", json=log_data) as response:
                    if response.status != 200:
                        logger.warning(f"Failed to log usage update: {response.status}")
                        
        except Exception as e:
            logger.error(f"Error logging usage update: {str(e)}")
    
    async def get_delegation_status(self, user_address: str) -> Dict:
        """
        Get comprehensive delegation status
        """
        try:
            constraints = await self._get_delegation_constraints(user_address)
            
            if not constraints:
                return {
                    "active": False,
                    "reason": "No active delegation"
                }
            
            used_amount = self._get_used_amount(user_address)
            daily_usage = self._get_daily_usage(user_address)
            tx_count = self._get_transaction_count(user_address)
            
            return {
                "active": True,
                "max_amount": constraints.max_amount,
                "used_amount": used_amount,
                "remaining_amount": constraints.max_amount - used_amount,
                "daily_limit": constraints.daily_limit,
                "daily_usage": daily_usage,
                "transaction_limit": constraints.transaction_limit,
                "transaction_count": tx_count,
                "remaining_transactions": self._get_remaining_transactions(constraints, user_address),
                "expiry": constraints.expiry.isoformat(),
                "risk_tolerance": constraints.risk_tolerance,
                "allowed_pools": constraints.allowed_pools
            }
            
        except Exception as e:
            logger.error(f"Error getting delegation status: {str(e)}")
            return {
                "active": False,
                "reason": f"Error: {str(e)}"
            }
    
    def clear_cache(self, user_address: str = None) -> None:
        """
        Clear delegation cache
        """
        if user_address:
            cache_key = f"delegation_{user_address}"
            self.delegation_cache.pop(cache_key, None)
        else:
            self.delegation_cache.clear()
    
    def reset_daily_usage(self, user_address: str) -> None:
        """
        Reset daily usage tracking (called by scheduler)
        """
        self.usage_tracking[f"{user_address}_daily"] = 0
        logger.info(f"Reset daily usage for {user_address}")