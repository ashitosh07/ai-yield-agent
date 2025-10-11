import numpy as np
import pandas as pd
from typing import Dict, List, Optional, Tuple
from dataclasses import dataclass
from datetime import datetime, timedelta
import logging

logger = logging.getLogger(__name__)

@dataclass
class PoolData:
    address: str
    name: str
    apy: float
    tvl: float
    volume24h: float
    risk_score: float
    liquidity_depth: float = 0.0
    volatility: float = 0.0

@dataclass
class UserPosition:
    pool_address: str
    balance: float
    value_usd: float

@dataclass
class RebalanceAction:
    from_pool: str
    to_pool: str
    amount: float
    confidence: float
    rationale: str
    expected_apy_improvement: float
    risk_adjustment: float

class YieldOptimizer:
    def __init__(self):
        self.confidence_threshold = 0.8
        self.min_apy_improvement = 0.5  # Minimum 0.5% APY improvement
        self.max_risk_increase = 0.2    # Maximum 0.2 risk score increase
        self.gas_cost_threshold = 50    # USD
        
    def analyze_rebalance_opportunity(
        self, 
        pools_data: List[Dict], 
        user_positions: List[Dict],
        trigger_pool: str = None
    ) -> Optional[RebalanceAction]:
        """
        Advanced AI-driven yield optimization analysis
        """
        try:
            # Convert to structured data
            pools = [PoolData(**pool) for pool in pools_data]
            positions = [UserPosition(**pos) for pos in user_positions]
            
            # Find optimal rebalance
            best_action = self._find_optimal_rebalance(pools, positions, trigger_pool)
            
            if best_action:
                logger.info(f"🎯 Optimal rebalance found: {best_action.rationale}")
                return best_action
            
            return None
            
        except Exception as e:
            logger.error(f"Error in yield analysis: {str(e)}")
            return None
    
    def _find_optimal_rebalance(
        self, 
        pools: List[PoolData], 
        positions: List[UserPosition],
        trigger_pool: str = None
    ) -> Optional[RebalanceAction]:
        """
        Find the optimal rebalance using advanced algorithms
        """
        best_action = None
        best_score = 0
        
        # Create pool lookup
        pool_map = {pool.address: pool for pool in pools}
        
        # Analyze each position for rebalance opportunities
        for position in positions:
            if position.balance == 0:
                continue
                
            current_pool = pool_map.get(position.pool_address)
            if not current_pool:
                continue
            
            # Find better pools
            for target_pool in pools:
                if target_pool.address == position.pool_address:
                    continue
                
                action = self._evaluate_rebalance(
                    current_pool, target_pool, position
                )
                
                if action and action.confidence > best_score:
                    best_action = action
                    best_score = action.confidence
        
        return best_action if best_score > self.confidence_threshold else None
    
    def _evaluate_rebalance(
        self, 
        from_pool: PoolData, 
        to_pool: PoolData, 
        position: UserPosition
    ) -> Optional[RebalanceAction]:
        """
        Evaluate a specific rebalance opportunity
        """
        # Calculate APY improvement
        apy_improvement = to_pool.apy - from_pool.apy
        
        if apy_improvement < self.min_apy_improvement:
            return None
        
        # Calculate risk adjustment
        risk_increase = to_pool.risk_score - from_pool.risk_score
        
        if risk_increase > self.max_risk_increase:
            return None
        
        # Calculate confidence score
        confidence = self._calculate_confidence(
            from_pool, to_pool, position, apy_improvement, risk_increase
        )
        
        # Determine optimal amount to rebalance
        optimal_amount = self._calculate_optimal_amount(
            from_pool, to_pool, position
        )
        
        # Generate rationale
        rationale = self._generate_rationale(
            from_pool, to_pool, apy_improvement, risk_increase, optimal_amount
        )
        
        return RebalanceAction(
            from_pool=from_pool.address,
            to_pool=to_pool.address,
            amount=optimal_amount,
            confidence=confidence,
            rationale=rationale,
            expected_apy_improvement=apy_improvement,
            risk_adjustment=risk_increase
        )
    
    def _calculate_confidence(
        self, 
        from_pool: PoolData, 
        to_pool: PoolData, 
        position: UserPosition,
        apy_improvement: float,
        risk_increase: float
    ) -> float:
        """
        Calculate confidence score using multiple factors
        """
        confidence_factors = []
        
        # APY improvement factor (0-0.3)
        apy_factor = min(apy_improvement / 10.0, 0.3)
        confidence_factors.append(apy_factor)
        
        # TVL stability factor (0-0.25)
        tvl_factor = min(to_pool.tvl / 10000000, 0.25)  # Higher TVL = more confidence
        confidence_factors.append(tvl_factor)
        
        # Risk factor (0-0.2)
        risk_factor = max(0, 0.2 - risk_increase)
        confidence_factors.append(risk_factor)
        
        # Volume/liquidity factor (0-0.15)
        volume_factor = min(to_pool.volume24h / to_pool.tvl, 0.15)
        confidence_factors.append(volume_factor)
        
        # Position size factor (0-0.1)
        position_factor = min(position.value_usd / 100000, 0.1)
        confidence_factors.append(position_factor)
        
        # Base confidence
        base_confidence = 0.5
        
        total_confidence = base_confidence + sum(confidence_factors)
        
        return min(total_confidence, 1.0)
    
    def _calculate_optimal_amount(
        self, 
        from_pool: PoolData, 
        to_pool: PoolData, 
        position: UserPosition
    ) -> float:
        """
        Calculate optimal amount to rebalance using portfolio theory
        """
        # Simple strategy: rebalance percentage based on APY improvement
        apy_improvement = to_pool.apy - from_pool.apy
        risk_increase = to_pool.risk_score - from_pool.risk_score
        
        # Base percentage (30-80% based on improvement)
        base_percentage = min(0.3 + (apy_improvement / 20.0), 0.8)
        
        # Adjust for risk
        risk_adjustment = max(0.1, 1.0 - risk_increase * 2)
        
        # Adjust for TVL (prefer higher TVL pools)
        tvl_adjustment = min(to_pool.tvl / from_pool.tvl, 2.0) * 0.5 + 0.5
        
        final_percentage = base_percentage * risk_adjustment * tvl_adjustment
        final_percentage = max(0.1, min(final_percentage, 0.9))
        
        return position.balance * final_percentage
    
    def _generate_rationale(
        self, 
        from_pool: PoolData, 
        to_pool: PoolData, 
        apy_improvement: float,
        risk_increase: float,
        amount: float
    ) -> str:
        """
        Generate human-readable rationale for the rebalance
        """
        rationale_parts = []
        
        # APY improvement
        rationale_parts.append(f"Moving from {from_pool.name} ({from_pool.apy:.1f}% APY) to {to_pool.name} ({to_pool.apy:.1f}% APY)")
        rationale_parts.append(f"Expected APY improvement: +{apy_improvement:.1f}%")
        
        # Risk assessment
        if risk_increase > 0:
            rationale_parts.append(f"Risk increase: +{risk_increase:.2f} (acceptable)")
        else:
            rationale_parts.append(f"Risk decrease: {abs(risk_increase):.2f} (favorable)")
        
        # TVL comparison
        if to_pool.tvl > from_pool.tvl:
            rationale_parts.append(f"Moving to higher TVL pool (${to_pool.tvl/1000000:.1f}M vs ${from_pool.tvl/1000000:.1f}M)")
        
        # Amount
        rationale_parts.append(f"Optimal rebalance amount: {amount:.3f} ETH")
        
        return " | ".join(rationale_parts)
    
    def calculate_portfolio_metrics(
        self, 
        pools_data: List[Dict], 
        user_positions: List[Dict]
    ) -> Dict:
        """
        Calculate comprehensive portfolio metrics
        """
        if not user_positions:
            return {
                "total_value": 0,
                "weighted_apy": 0,
                "portfolio_risk": 0,
                "diversification_score": 0,
                "daily_earnings": 0
            }
        
        pools = [PoolData(**pool) for pool in pools_data]
        positions = [UserPosition(**pos) for pos in user_positions]
        pool_map = {pool.address: pool for pool in pools}
        
        total_value = sum(pos.value_usd for pos in positions)
        
        if total_value == 0:
            return {
                "total_value": 0,
                "weighted_apy": 0,
                "portfolio_risk": 0,
                "diversification_score": 0,
                "daily_earnings": 0
            }
        
        # Weighted APY
        weighted_apy = sum(
            (pos.value_usd / total_value) * pool_map[pos.pool_address].apy
            for pos in positions if pos.pool_address in pool_map
        )
        
        # Portfolio risk (weighted average)
        portfolio_risk = sum(
            (pos.value_usd / total_value) * pool_map[pos.pool_address].risk_score
            for pos in positions if pos.pool_address in pool_map
        )
        
        # Diversification score (simple: 1 - Herfindahl index)
        weights = [pos.value_usd / total_value for pos in positions]
        herfindahl = sum(w**2 for w in weights)
        diversification_score = 1 - herfindahl
        
        # Daily earnings
        daily_earnings = total_value * (weighted_apy / 100) / 365
        
        return {
            "total_value": total_value,
            "weighted_apy": weighted_apy,
            "portfolio_risk": portfolio_risk,
            "diversification_score": diversification_score,
            "daily_earnings": daily_earnings,
            "position_count": len(positions),
            "pool_distribution": {
                pos.pool_address: pos.value_usd / total_value 
                for pos in positions
            }
        }
    
    def generate_recommendations(
        self, 
        pools_data: List[Dict], 
        user_positions: List[Dict]
    ) -> List[Dict]:
        """
        Generate AI recommendations for portfolio optimization
        """
        recommendations = []
        
        pools = [PoolData(**pool) for pool in pools_data]
        positions = [UserPosition(**pos) for pos in user_positions]
        
        # Portfolio metrics
        metrics = self.calculate_portfolio_metrics(pools_data, user_positions)
        
        # Risk-based recommendations
        if metrics["portfolio_risk"] > 0.6:
            recommendations.append({
                "type": "risk_warning",
                "priority": "high",
                "title": "High Portfolio Risk Detected",
                "description": f"Current portfolio risk score: {metrics['portfolio_risk']:.2f}. Consider rebalancing to lower-risk pools.",
                "confidence": 0.9
            })
        
        # Diversification recommendations
        if metrics["diversification_score"] < 0.3:
            recommendations.append({
                "type": "diversification",
                "priority": "medium",
                "title": "Improve Diversification",
                "description": f"Portfolio is concentrated (diversification score: {metrics['diversification_score']:.2f}). Consider spreading across more pools.",
                "confidence": 0.8
            })
        
        # APY optimization
        if len(positions) > 0:
            avg_apy = metrics["weighted_apy"]
            high_apy_pools = [p for p in pools if p.apy > avg_apy + 2 and p.risk_score < 0.5]
            
            if high_apy_pools:
                best_pool = max(high_apy_pools, key=lambda p: p.apy - p.risk_score * 10)
                recommendations.append({
                    "type": "yield_opportunity",
                    "priority": "medium",
                    "title": "Higher Yield Opportunity",
                    "description": f"Consider {best_pool.name} with {best_pool.apy:.1f}% APY (current avg: {avg_apy:.1f}%)",
                    "confidence": 0.75
                })
        
        return sorted(recommendations, key=lambda x: x["confidence"], reverse=True)