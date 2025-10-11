import numpy as np
import pandas as pd
from sklearn.ensemble import RandomForestRegressor, GradientBoostingClassifier
from sklearn.preprocessing import StandardScaler
from sklearn.model_selection import train_test_split
from sklearn.metrics import mean_squared_error, accuracy_score
import joblib
import logging
from datetime import datetime, timedelta
from typing import Dict, List, Tuple, Optional
import asyncio
import aiohttp
import json
from dataclasses import dataclass

@dataclass
class PoolMetrics:
    address: str
    name: str
    apy: float
    tvl: float
    volume_24h: float
    fees_24h: float
    risk_score: float
    health_score: float
    liquidity_depth: float
    volatility: float
    trend_score: float
    timestamp: datetime

@dataclass
class RebalanceRecommendation:
    from_pool: str
    to_pool: str
    amount: float
    confidence: float
    expected_gain: float
    risk_assessment: float
    rationale: str
    execution_priority: int
    estimated_gas: int
    slippage_tolerance: float

class AdvancedAIEngine:
    def __init__(self):
        self.logger = logging.getLogger(__name__)
        self.apy_predictor = None
        self.risk_classifier = None
        self.scaler = StandardScaler()
        self.historical_data = []
        self.model_trained = False
        self.confidence_threshold = 0.75
        self.max_risk_tolerance = 0.6
        
        # Market indicators
        self.market_fear_greed_index = 50  # 0-100 scale
        self.defi_tvl_trend = 0.0  # -1 to 1
        self.gas_price_trend = 0.0  # -1 to 1
        
        # Performance tracking
        self.prediction_accuracy = 0.0
        self.total_predictions = 0
        self.successful_rebalances = 0
        
    async def initialize(self):
        """Initialize the AI engine with historical data and train models"""
        try:
            await self.load_historical_data()
            await self.train_models()
            await self.load_market_indicators()
            self.logger.info("✅ Advanced AI Engine initialized successfully")
            return True
        except Exception as e:
            self.logger.error(f"❌ Failed to initialize AI engine: {e}")
            return False
    
    async def load_historical_data(self):
        """Load historical pool data for training"""
        try:
            # In production, this would load from a database or API
            # For now, generate synthetic historical data
            self.historical_data = self.generate_synthetic_data(1000)
            self.logger.info(f"📊 Loaded {len(self.historical_data)} historical data points")
        except Exception as e:
            self.logger.error(f"Error loading historical data: {e}")
            raise
    
    def generate_synthetic_data(self, n_samples: int) -> List[Dict]:
        """Generate synthetic historical data for training"""
        np.random.seed(42)  # For reproducibility
        
        data = []
        base_date = datetime.now() - timedelta(days=365)
        
        for i in range(n_samples):
            # Simulate different pool types
            pool_type = np.random.choice(['stable', 'volatile', 'exotic'], p=[0.4, 0.5, 0.1])
            
            if pool_type == 'stable':
                base_apy = np.random.normal(8, 2)
                volatility = np.random.uniform(0.05, 0.15)
                risk_score = np.random.uniform(0.1, 0.3)
            elif pool_type == 'volatile':
                base_apy = np.random.normal(15, 5)
                volatility = np.random.uniform(0.2, 0.5)
                risk_score = np.random.uniform(0.3, 0.7)
            else:  # exotic
                base_apy = np.random.normal(25, 10)
                volatility = np.random.uniform(0.4, 0.8)
                risk_score = np.random.uniform(0.6, 0.9)
            
            # Market conditions effect
            market_multiplier = 1 + np.random.normal(0, 0.1)
            
            data.append({
                'timestamp': base_date + timedelta(hours=i),
                'pool_type': pool_type,
                'apy': max(0, base_apy * market_multiplier),
                'tvl': np.random.lognormal(15, 1),  # Log-normal distribution for TVL
                'volume_24h': np.random.lognormal(12, 1.5),
                'fees_24h': np.random.lognormal(8, 1),
                'risk_score': risk_score,
                'volatility': volatility,
                'liquidity_depth': np.random.uniform(0.1, 1.0),
                'trend_score': np.random.uniform(-1, 1),
                'health_score': np.random.uniform(60, 100),
                'gas_price': np.random.uniform(20, 200),
                'market_sentiment': np.random.uniform(0, 100),
                # Target variables
                'future_apy': max(0, base_apy * market_multiplier * (1 + np.random.normal(0, 0.05))),
                'profitable_rebalance': np.random.choice([0, 1], p=[0.3, 0.7])
            })
        
        return data
    
    async def train_models(self):
        """Train ML models for APY prediction and rebalance classification"""
        if not self.historical_data:
            raise ValueError("No historical data available for training")
        
        df = pd.DataFrame(self.historical_data)
        
        # Prepare features
        feature_columns = [
            'apy', 'tvl', 'volume_24h', 'fees_24h', 'risk_score', 
            'volatility', 'liquidity_depth', 'trend_score', 'health_score',
            'gas_price', 'market_sentiment'
        ]
        
        X = df[feature_columns].fillna(0)
        
        # Scale features
        X_scaled = self.scaler.fit_transform(X)
        
        # Train APY predictor
        y_apy = df['future_apy'].fillna(0)
        X_train, X_test, y_train, y_test = train_test_split(
            X_scaled, y_apy, test_size=0.2, random_state=42
        )
        
        self.apy_predictor = RandomForestRegressor(
            n_estimators=100,
            max_depth=10,
            random_state=42,
            n_jobs=-1
        )
        self.apy_predictor.fit(X_train, y_train)
        
        # Evaluate APY predictor
        y_pred = self.apy_predictor.predict(X_test)
        apy_mse = mean_squared_error(y_test, y_pred)
        self.logger.info(f"📈 APY Predictor MSE: {apy_mse:.4f}")
        
        # Train rebalance classifier
        y_rebalance = df['profitable_rebalance']
        self.risk_classifier = GradientBoostingClassifier(
            n_estimators=100,
            learning_rate=0.1,
            max_depth=6,
            random_state=42
        )
        self.risk_classifier.fit(X_train, y_rebalance)
        
        # Evaluate classifier
        y_pred_class = self.risk_classifier.predict(X_test)
        class_accuracy = accuracy_score(y_test, y_pred_class)
        self.logger.info(f"🎯 Rebalance Classifier Accuracy: {class_accuracy:.4f}")
        
        self.model_trained = True
        
        # Save models
        await self.save_models()
    
    async def save_models(self):
        """Save trained models to disk"""
        try:
            joblib.dump(self.apy_predictor, 'models/apy_predictor.pkl')
            joblib.dump(self.risk_classifier, 'models/risk_classifier.pkl')
            joblib.dump(self.scaler, 'models/scaler.pkl')
            self.logger.info("💾 Models saved successfully")
        except Exception as e:
            self.logger.error(f"Error saving models: {e}")
    
    async def load_models(self):
        """Load pre-trained models from disk"""
        try:
            self.apy_predictor = joblib.load('models/apy_predictor.pkl')
            self.risk_classifier = joblib.load('models/risk_classifier.pkl')
            self.scaler = joblib.load('models/scaler.pkl')
            self.model_trained = True
            self.logger.info("📂 Models loaded successfully")
        except Exception as e:
            self.logger.warning(f"Could not load models: {e}")
            await self.train_models()
    
    async def load_market_indicators(self):
        """Load current market indicators"""
        try:
            # In production, fetch from real APIs
            self.market_fear_greed_index = np.random.uniform(20, 80)
            self.defi_tvl_trend = np.random.uniform(-0.2, 0.2)
            self.gas_price_trend = np.random.uniform(-0.3, 0.3)
            
            self.logger.info(f"📊 Market indicators loaded - Fear/Greed: {self.market_fear_greed_index:.1f}")
        except Exception as e:
            self.logger.error(f"Error loading market indicators: {e}")
    
    async def analyze_pools(self, pools_data: List[Dict]) -> List[PoolMetrics]:
        """Analyze pool data and extract metrics"""
        analyzed_pools = []
        
        for pool in pools_data:
            try:
                # Calculate advanced metrics
                volatility = self.calculate_volatility(pool)
                trend_score = self.calculate_trend_score(pool)
                liquidity_depth = self.calculate_liquidity_depth(pool)
                
                metrics = PoolMetrics(
                    address=pool.get('address', ''),
                    name=pool.get('name', ''),
                    apy=float(pool.get('apy', 0)),
                    tvl=float(pool.get('tvl', 0)),
                    volume_24h=float(pool.get('volume24h', 0)),
                    fees_24h=float(pool.get('fees24h', 0)),
                    risk_score=float(pool.get('riskScore', 0)),
                    health_score=float(pool.get('healthScore', 100)),
                    liquidity_depth=liquidity_depth,
                    volatility=volatility,
                    trend_score=trend_score,
                    timestamp=datetime.now()
                )
                
                analyzed_pools.append(metrics)
                
            except Exception as e:
                self.logger.error(f"Error analyzing pool {pool.get('address', 'unknown')}: {e}")
        
        return analyzed_pools
    
    def calculate_volatility(self, pool: Dict) -> float:
        """Calculate pool volatility based on volume/TVL ratio and other factors"""
        try:
            tvl = float(pool.get('tvl', 1))
            volume_24h = float(pool.get('volume24h', 0))
            
            if tvl == 0:
                return 1.0  # Maximum volatility for zero TVL
            
            volume_ratio = volume_24h / tvl
            
            # Normalize to 0-1 scale
            volatility = min(volume_ratio / 2.0, 1.0)
            
            # Adjust based on token pair type
            name = pool.get('name', '').upper()
            if any(stable in name for stable in ['USDC', 'USDT', 'DAI']):
                volatility *= 0.5  # Reduce volatility for stable pairs
            
            return volatility
            
        except Exception:
            return 0.5  # Default volatility
    
    def calculate_trend_score(self, pool: Dict) -> float:
        """Calculate trend score based on recent performance"""
        try:
            # In production, this would analyze historical APY changes
            # For now, use a simplified calculation
            apy = float(pool.get('apy', 0))
            volume_24h = float(pool.get('volume24h', 0))
            fees_24h = float(pool.get('fees24h', 0))
            
            # Higher APY and fees indicate positive trend
            trend = (apy / 20.0) + (fees_24h / 1000.0) - 0.5
            
            # Normalize to -1 to 1 scale
            return max(-1.0, min(1.0, trend))
            
        except Exception:
            return 0.0  # Neutral trend
    
    def calculate_liquidity_depth(self, pool: Dict) -> float:
        """Calculate liquidity depth score"""
        try:
            tvl = float(pool.get('tvl', 0))
            lp_count = int(pool.get('lpCount', 1))
            
            # Higher TVL and more LPs indicate better liquidity
            depth_score = (tvl / 1000000.0) + (lp_count / 100.0)
            
            # Normalize to 0-1 scale
            return min(depth_score / 2.0, 1.0)
            
        except Exception:
            return 0.5  # Default depth
    
    async def predict_apy_changes(self, pools: List[PoolMetrics]) -> Dict[str, float]:
        """Predict future APY changes for pools"""
        if not self.model_trained:
            await self.train_models()
        
        predictions = {}
        
        for pool in pools:
            try:
                # Prepare features
                features = np.array([[
                    pool.apy,
                    pool.tvl,
                    pool.volume_24h,
                    pool.fees_24h,
                    pool.risk_score,
                    pool.volatility,
                    pool.liquidity_depth,
                    pool.trend_score,
                    pool.health_score,
                    100,  # Mock gas price
                    self.market_fear_greed_index
                ]])
                
                # Scale features
                features_scaled = self.scaler.transform(features)
                
                # Predict future APY
                predicted_apy = self.apy_predictor.predict(features_scaled)[0]
                
                # Calculate expected change
                apy_change = predicted_apy - pool.apy
                predictions[pool.address] = apy_change
                
            except Exception as e:
                self.logger.error(f"Error predicting APY for {pool.address}: {e}")
                predictions[pool.address] = 0.0
        
        return predictions
    
    async def generate_rebalance_recommendations(
        self, 
        pools: List[PoolMetrics], 
        user_address: str,
        current_positions: List[Dict],
        risk_tolerance: float = 0.5
    ) -> List[RebalanceRecommendation]:
        """Generate intelligent rebalance recommendations"""
        
        if not self.model_trained:
            await self.train_models()
        
        recommendations = []
        
        # Get APY predictions
        apy_predictions = await self.predict_apy_changes(pools)
        
        # Analyze current positions
        for position in current_positions:
            current_pool_address = position.get('poolAddress', '')
            current_pool = next((p for p in pools if p.address == current_pool_address), None)
            
            if not current_pool:
                continue
            
            current_apy_prediction = apy_predictions.get(current_pool_address, 0)
            
            # Find better opportunities
            for target_pool in pools:
                if target_pool.address == current_pool_address:
                    continue
                
                target_apy_prediction = apy_predictions.get(target_pool.address, 0)
                
                # Calculate potential gain
                potential_gain = target_apy_prediction - current_apy_prediction
                
                if potential_gain <= 0.5:  # Minimum 0.5% gain threshold
                    continue
                
                # Assess rebalance viability
                recommendation = await self.assess_rebalance(
                    current_pool, target_pool, position, potential_gain, risk_tolerance
                )
                
                if recommendation and recommendation.confidence >= self.confidence_threshold:
                    recommendations.append(recommendation)
        
        # Sort by expected gain and confidence
        recommendations.sort(key=lambda x: (x.expected_gain * x.confidence), reverse=True)
        
        return recommendations[:3]  # Return top 3 recommendations
    
    async def assess_rebalance(
        self,
        from_pool: PoolMetrics,
        to_pool: PoolMetrics,
        position: Dict,
        potential_gain: float,
        risk_tolerance: float
    ) -> Optional[RebalanceRecommendation]:
        """Assess a specific rebalance opportunity"""
        
        try:
            # Calculate confidence using ML model
            features = np.array([[
                from_pool.apy,
                from_pool.tvl,
                from_pool.volume_24h,
                from_pool.fees_24h,
                from_pool.risk_score,
                from_pool.volatility,
                from_pool.liquidity_depth,
                from_pool.trend_score,
                from_pool.health_score,
                100,  # Mock gas price
                self.market_fear_greed_index
            ]])
            
            features_scaled = self.scaler.transform(features)
            confidence = self.risk_classifier.predict_proba(features_scaled)[0][1]
            
            # Risk assessment
            risk_increase = to_pool.risk_score - from_pool.risk_score
            
            # Check risk tolerance
            if to_pool.risk_score > risk_tolerance:
                return None
            
            # Calculate optimal amount (simplified)
            position_value = float(position.get('valueUSD', 0))
            max_rebalance_amount = position_value * 0.5  # Max 50% of position
            
            # Adjust amount based on confidence and risk
            confidence_factor = min(confidence / self.confidence_threshold, 1.0)
            risk_factor = max(0.1, 1.0 - risk_increase)
            
            recommended_amount = max_rebalance_amount * confidence_factor * risk_factor
            
            # Generate rationale
            rationale = self.generate_rationale(
                from_pool, to_pool, potential_gain, confidence, risk_increase
            )
            
            # Estimate gas costs
            estimated_gas = self.estimate_gas_cost()
            
            return RebalanceRecommendation(
                from_pool=from_pool.name,
                to_pool=to_pool.name,
                amount=recommended_amount / 2000,  # Convert to ETH (mock price)
                confidence=confidence,
                expected_gain=potential_gain,
                risk_assessment=to_pool.risk_score,
                rationale=rationale,
                execution_priority=self.calculate_priority(potential_gain, confidence),
                estimated_gas=estimated_gas,
                slippage_tolerance=self.calculate_slippage_tolerance(to_pool)
            )
            
        except Exception as e:
            self.logger.error(f"Error assessing rebalance: {e}")
            return None
    
    def generate_rationale(
        self,
        from_pool: PoolMetrics,
        to_pool: PoolMetrics,
        potential_gain: float,
        confidence: float,
        risk_increase: float
    ) -> str:
        """Generate human-readable rationale for rebalance recommendation"""
        
        rationale_parts = []
        
        # APY comparison
        if potential_gain > 2:
            rationale_parts.append(f"Significant APY improvement of {potential_gain:.1f}%")
        else:
            rationale_parts.append(f"Modest APY improvement of {potential_gain:.1f}%")
        
        # Risk assessment
        if risk_increase < 0:
            rationale_parts.append("with reduced risk exposure")
        elif risk_increase < 0.1:
            rationale_parts.append("with similar risk profile")
        else:
            rationale_parts.append(f"with {risk_increase:.1f} higher risk score")
        
        # Liquidity considerations
        if to_pool.liquidity_depth > from_pool.liquidity_depth:
            rationale_parts.append("Target pool has superior liquidity depth")
        
        # Market conditions
        if self.market_fear_greed_index > 70:
            rationale_parts.append("Market sentiment is favorable for rebalancing")
        elif self.market_fear_greed_index < 30:
            rationale_parts.append("Conservative approach recommended due to market conditions")
        
        # Confidence level
        if confidence > 0.9:
            rationale_parts.append("High confidence prediction based on historical patterns")
        elif confidence > 0.8:
            rationale_parts.append("Good confidence level supported by data analysis")
        else:
            rationale_parts.append("Moderate confidence - monitor closely")
        
        return ". ".join(rationale_parts) + "."
    
    def calculate_priority(self, potential_gain: float, confidence: float) -> int:
        """Calculate execution priority (1-10, higher is more urgent)"""
        score = (potential_gain * confidence) / 2
        
        if score > 5:
            return 10  # Highest priority
        elif score > 3:
            return 8
        elif score > 2:
            return 6
        elif score > 1:
            return 4
        else:
            return 2
    
    def estimate_gas_cost(self) -> int:
        """Estimate gas cost for rebalance transaction"""
        # Base gas for complex DeFi transaction
        base_gas = 150000
        
        # Add gas based on current network conditions
        gas_multiplier = 1 + abs(self.gas_price_trend)
        
        return int(base_gas * gas_multiplier)
    
    def calculate_slippage_tolerance(self, pool: PoolMetrics) -> float:
        """Calculate appropriate slippage tolerance"""
        base_slippage = 0.005  # 0.5%
        
        # Increase slippage for volatile pools
        volatility_adjustment = pool.volatility * 0.01
        
        # Decrease slippage for high liquidity pools
        liquidity_adjustment = -pool.liquidity_depth * 0.002
        
        slippage = base_slippage + volatility_adjustment + liquidity_adjustment
        
        return max(0.001, min(0.05, slippage))  # Clamp between 0.1% and 5%
    
    async def update_performance_metrics(self, prediction_accuracy: float, rebalance_success: bool):
        """Update AI performance tracking"""
        self.total_predictions += 1
        
        # Update rolling accuracy
        alpha = 0.1  # Learning rate
        self.prediction_accuracy = (1 - alpha) * self.prediction_accuracy + alpha * prediction_accuracy
        
        if rebalance_success:
            self.successful_rebalances += 1
        
        self.logger.info(f"📊 AI Performance - Accuracy: {self.prediction_accuracy:.3f}, Success Rate: {self.successful_rebalances}/{self.total_predictions}")
    
    def get_ai_status(self) -> Dict:
        """Get current AI engine status"""
        return {
            'model_trained': self.model_trained,
            'confidence_threshold': self.confidence_threshold,
            'prediction_accuracy': self.prediction_accuracy,
            'total_predictions': self.total_predictions,
            'successful_rebalances': self.successful_rebalances,
            'market_fear_greed_index': self.market_fear_greed_index,
            'defi_tvl_trend': self.defi_tvl_trend,
            'gas_price_trend': self.gas_price_trend,
            'last_updated': datetime.now().isoformat()
        }

# Global AI engine instance
ai_engine = AdvancedAIEngine()