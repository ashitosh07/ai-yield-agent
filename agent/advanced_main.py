#!/usr/bin/env python3

import asyncio
import json
import logging
import os
from datetime import datetime
from typing import Dict, List, Optional

import aiohttp
from fastapi import FastAPI, HTTPException, BackgroundTasks
from pydantic import BaseModel
import uvicorn
import numpy as np

from advanced_ai_engine import ai_engine
from blockchain_client import MonadClient
from delegation_validator import DelegationValidator

# Setup logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(
    title="Advanced AI Yield Agent",
    description="Intelligent DeFi yield optimization with machine learning",
    version="2.0.0"
)

class AnalysisRequest(BaseModel):
    poolAddress: str
    oldAPY: float
    newAPY: float
    timestamp: str
    userAddress: Optional[str] = None
    trigger: Optional[str] = "automatic"
    eventType: Optional[str] = "sync"
    blockNumber: Optional[int] = None

class RecommendationRequest(BaseModel):
    userAddress: str
    riskTolerance: float = 0.5
    maxPositions: int = 5
    includeNewPools: bool = True

class ExecutionRequest(BaseModel):
    recommendationId: str
    userAddress: str
    confirmRisk: bool = False

# Initialize components
monad_client = MonadClient()
delegation_validator = DelegationValidator()

@app.on_event("startup")
async def startup_event():
    """Initialize AI engine on startup"""
    logger.info("🚀 Starting Advanced AI Yield Agent...")
    
    # Initialize AI engine
    success = await ai_engine.initialize()
    if success:
        logger.info("✅ AI Engine initialized successfully")
    else:
        logger.error("❌ Failed to initialize AI Engine")
    
    # Start background tasks
    asyncio.create_task(periodic_market_analysis())
    asyncio.create_task(performance_monitoring())

@app.get("/")
async def root():
    """Health check endpoint"""
    return {
        "service": "Advanced AI Yield Agent",
        "version": "2.0.0",
        "status": "active",
        "ai_status": ai_engine.get_ai_status(),
        "timestamp": datetime.now().isoformat()
    }

@app.get("/status")
async def get_status():
    """Get detailed service status"""
    return {
        "ai_engine": ai_engine.get_ai_status(),
        "services": {
            "monad_client": "active",
            "delegation_validator": "active",
            "background_tasks": "running"
        },
        "performance": {
            "uptime": "active",
            "last_analysis": datetime.now().isoformat()
        }
    }

@app.post("/analyze")
async def analyze_yield_opportunity(request: AnalysisRequest, background_tasks: BackgroundTasks):
    """Advanced yield opportunity analysis with ML predictions"""
    
    logger.info(f"🔍 Advanced analysis: {request.poolAddress} ({request.oldAPY}% → {request.newAPY}%)")
    
    try:
        # Get comprehensive pool data
        pools_data = await get_comprehensive_pools_data()
        
        # Analyze pools with AI
        analyzed_pools = await ai_engine.analyze_pools(pools_data)
        
        # Get APY predictions
        apy_predictions = await ai_engine.predict_apy_changes(analyzed_pools)
        
        # Find the specific pool
        target_pool = next((p for p in analyzed_pools if p.address.lower() == request.poolAddress.lower()), None)
        
        if not target_pool:
            return {"status": "pool_not_found", "reason": f"Pool {request.poolAddress} not found"}
        
        # Get user positions if available
        user_positions = []
        if request.userAddress:
            user_positions = await get_user_positions(request.userAddress)
        
        # Generate recommendations
        recommendations = await ai_engine.generate_rebalance_recommendations(
            analyzed_pools, 
            request.userAddress or "0x0000000000000000000000000000000000000000",
            user_positions,
            0.5  # Default risk tolerance
        )
        
        # Check if immediate execution is warranted
        high_confidence_recs = [r for r in recommendations if r.confidence >= ai_engine.confidence_threshold]
        
        if high_confidence_recs and request.trigger == "automatic":
            # Execute highest priority recommendation
            best_rec = max(high_confidence_recs, key=lambda x: x.execution_priority)
            
            background_tasks.add_task(execute_recommendation, best_rec, request.userAddress)
            
            return {
                "status": "executing",
                "recommendation": {
                    "from_pool": best_rec.from_pool,
                    "to_pool": best_rec.to_pool,
                    "amount": best_rec.amount,
                    "confidence": best_rec.confidence,
                    "expected_gain": best_rec.expected_gain,
                    "rationale": best_rec.rationale
                },
                "execution_priority": best_rec.execution_priority,
                "all_recommendations": len(recommendations)
            }
        
        return {
            "status": "analysis_complete",
            "pool_analysis": {
                "address": target_pool.address,
                "name": target_pool.name,
                "current_apy": target_pool.apy,
                "predicted_apy": apy_predictions.get(target_pool.address, target_pool.apy),
                "risk_score": target_pool.risk_score,
                "health_score": target_pool.health_score,
                "volatility": target_pool.volatility,
                "trend_score": target_pool.trend_score
            },
            "recommendations": [
                {
                    "from_pool": r.from_pool,
                    "to_pool": r.to_pool,
                    "amount": r.amount,
                    "confidence": r.confidence,
                    "expected_gain": r.expected_gain,
                    "risk_assessment": r.risk_assessment,
                    "rationale": r.rationale,
                    "execution_priority": r.execution_priority
                } for r in recommendations
            ],
            "market_conditions": {
                "fear_greed_index": ai_engine.market_fear_greed_index,
                "defi_tvl_trend": ai_engine.defi_tvl_trend,
                "gas_price_trend": ai_engine.gas_price_trend
            }
        }
        
    except Exception as e:
        logger.error(f"Advanced analysis failed: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/recommendations")
async def get_recommendations(request: RecommendationRequest):
    """Get personalized AI recommendations for a user"""
    
    logger.info(f"🎯 Generating recommendations for {request.userAddress}")
    
    try:
        # Get comprehensive data
        pools_data = await get_comprehensive_pools_data()
        analyzed_pools = await ai_engine.analyze_pools(pools_data)
        user_positions = await get_user_positions(request.userAddress)
        
        # Generate recommendations
        recommendations = await ai_engine.generate_rebalance_recommendations(
            analyzed_pools,
            request.userAddress,
            user_positions,
            request.riskTolerance
        )
        
        # Filter and sort
        filtered_recs = recommendations[:request.maxPositions]
        
        return {
            "success": True,
            "user_address": request.userAddress,
            "risk_tolerance": request.riskTolerance,
            "recommendations": [
                {
                    "id": f"rec_{i}_{int(datetime.now().timestamp())}",
                    "from_pool": r.from_pool,
                    "to_pool": r.to_pool,
                    "amount": r.amount,
                    "confidence": r.confidence,
                    "expected_gain": r.expected_gain,
                    "risk_assessment": r.risk_assessment,
                    "rationale": r.rationale,
                    "execution_priority": r.execution_priority,
                    "estimated_gas": r.estimated_gas,
                    "slippage_tolerance": r.slippage_tolerance
                } for i, r in enumerate(filtered_recs)
            ],
            "portfolio_analysis": {
                "current_positions": len(user_positions),
                "total_value": sum(pos.get('valueUSD', 0) for pos in user_positions),
                "avg_apy": np.mean([pos.get('currentAPY', 0) for pos in user_positions]) if user_positions else 0,
                "risk_score": np.mean([pos.get('riskScore', 0) for pos in user_positions]) if user_positions else 0
            },
            "ai_insights": {
                "model_confidence": ai_engine.prediction_accuracy,
                "market_sentiment": "bullish" if ai_engine.market_fear_greed_index > 60 else "bearish" if ai_engine.market_fear_greed_index < 40 else "neutral",
                "recommendation_strength": "high" if len(filtered_recs) > 0 and max(r.confidence for r in filtered_recs) > 0.8 else "moderate"
            },
            "timestamp": datetime.now().isoformat()
        }
        
    except Exception as e:
        logger.error(f"Recommendation generation failed: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/execute")
async def execute_recommendation_endpoint(request: ExecutionRequest, background_tasks: BackgroundTasks):
    """Execute a specific recommendation"""
    
    logger.info(f"⚡ Executing recommendation {request.recommendationId} for {request.userAddress}")
    
    try:
        # In production, retrieve recommendation from database
        # For now, generate a mock recommendation
        mock_recommendation = {
            "from_pool": "USDC/ETH",
            "to_pool": "DAI/USDC", 
            "amount": 1.5,
            "confidence": 0.85,
            "expected_gain": 3.2,
            "rationale": "Higher APY with lower risk profile"
        }
        
        # Validate user has delegation
        validation_result = await delegation_validator.validate_action(mock_recommendation, request.userAddress)
        if not validation_result.is_valid:
            return {
                "success": False,
                "error": "delegation_invalid",
                "reason": validation_result.reason
            }
        
        # Execute in background
        background_tasks.add_task(execute_recommendation, mock_recommendation, request.userAddress)
        
        return {
            "success": True,
            "status": "executing",
            "recommendation_id": request.recommendationId,
            "estimated_completion": "2-5 minutes",
            "tx_hash": None  # Will be updated when execution completes
        }
        
    except Exception as e:
        logger.error(f"Execution failed: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/performance")
async def get_performance_metrics():
    """Get AI performance metrics"""
    
    return {
        "ai_performance": ai_engine.get_ai_status(),
        "execution_stats": {
            "total_recommendations": ai_engine.total_predictions,
            "successful_executions": ai_engine.successful_rebalances,
            "success_rate": ai_engine.successful_rebalances / max(ai_engine.total_predictions, 1),
            "avg_confidence": ai_engine.prediction_accuracy
        },
        "model_info": {
            "model_trained": ai_engine.model_trained,
            "confidence_threshold": ai_engine.confidence_threshold,
            "last_training": "2024-01-01T00:00:00Z"  # Mock timestamp
        }
    }

async def get_comprehensive_pools_data() -> List[Dict]:
    """Fetch comprehensive pool data from backend"""
    
    try:
        async with aiohttp.ClientSession() as session:
            async with session.get('http://localhost:3002/api/pools/real-time') as response:
                if response.status == 200:
                    data = await response.json()
                    return data.get('data', {}).get('pools', [])
                else:
                    logger.warning("Failed to fetch real-time pool data, using fallback")
                    return get_fallback_pools_data()
    except Exception as e:
        logger.error(f"Error fetching pool data: {e}")
        return get_fallback_pools_data()

def get_fallback_pools_data() -> List[Dict]:
    """Fallback pool data for when API is unavailable"""
    
    return [
        {
            "address": "0x742d35Cc6634C0532925a3b8D4C9db4C8b9b8b8b",
            "name": "USDC/ETH",
            "apy": 12.5 + np.random.normal(0, 1),
            "tvl": 2000000 + np.random.normal(0, 200000),
            "volume24h": 150000 + np.random.normal(0, 30000),
            "fees24h": 1500 + np.random.normal(0, 300),
            "riskScore": 0.25,
            "healthScore": 92,
            "isActive": True
        },
        {
            "address": "0x853d955aCEf822Db058eb8505911ED77F175b99e",
            "name": "DAI/USDC",
            "apy": 8.3 + np.random.normal(0, 0.5),
            "tvl": 4000000 + np.random.normal(0, 400000),
            "volume24h": 200000 + np.random.normal(0, 40000),
            "fees24h": 2000 + np.random.normal(0, 400),
            "riskScore": 0.1,
            "healthScore": 98,
            "isActive": True
        },
        {
            "address": "0x1f9840a85d5aF5bf1D1762F925BDADdC4201F984",
            "name": "WETH/USDT",
            "apy": 15.2 + np.random.normal(0, 2),
            "tvl": 1600000 + np.random.normal(0, 300000),
            "volume24h": 120000 + np.random.normal(0, 25000),
            "fees24h": 1200 + np.random.normal(0, 250),
            "riskScore": 0.35,
            "healthScore": 88,
            "isActive": True
        }
    ]

async def get_user_positions(user_address: str) -> List[Dict]:
    """Get user's current positions"""
    
    try:
        async with aiohttp.ClientSession() as session:
            async with session.get(f'http://localhost:3002/api/pools/positions/{user_address}') as response:
                if response.status == 200:
                    data = await response.json()
                    return data.get('data', [])
                else:
                    return []
    except Exception as e:
        logger.error(f"Error fetching user positions: {e}")
        return []

async def execute_recommendation(recommendation: Dict, user_address: str):
    """Execute a recommendation in the background"""
    
    try:
        logger.info(f"🔄 Executing recommendation: {recommendation}")
        
        # Simulate execution time
        await asyncio.sleep(2)
        
        # Execute via Monad client
        tx_hash = await monad_client.execute_rebalance(recommendation)
        
        # Update AI performance metrics
        await ai_engine.update_performance_metrics(0.9, True)  # Mock success
        
        # Log execution
        await log_execution(recommendation, tx_hash, user_address)
        
        # Send notifications
        await send_notifications(recommendation, tx_hash, user_address)
        
        logger.info(f"✅ Recommendation executed successfully: {tx_hash}")
        
    except Exception as e:
        logger.error(f"❌ Recommendation execution failed: {e}")
        await ai_engine.update_performance_metrics(0.1, False)  # Record failure

async def log_execution(recommendation: Dict, tx_hash: str, user_address: str):
    """Log execution to audit trail"""
    
    audit_data = {
        "action": "ai_rebalance",
        "details": {
            "rationale": recommendation.get("rationale", "AI-driven optimization"),
            "fromPool": recommendation.get("from_pool", "Unknown"),
            "toPool": recommendation.get("to_pool", "Unknown"),
            "amount": str(recommendation.get("amount", 0)),
            "confidence": recommendation.get("confidence", 0),
            "expected_gain": recommendation.get("expected_gain", 0)
        },
        "txHash": tx_hash,
        "status": "success",
        "userAddress": user_address,
        "timestamp": datetime.now().isoformat(),
        "source": "advanced_ai_engine"
    }
    
    try:
        async with aiohttp.ClientSession() as session:
            await session.post(
                "http://localhost:3002/api/audit",
                json=audit_data
            )
    except Exception as e:
        logger.error(f"Failed to log execution: {e}")

async def send_notifications(recommendation: Dict, tx_hash: str, user_address: str):
    """Send notifications via multiple channels"""
    
    notification_data = {
        "type": "rebalance_executed",
        "action": f"AI rebalanced {recommendation.get('amount', 0)} ETH",
        "txHash": tx_hash,
        "user": user_address,
        "fromPool": recommendation.get("from_pool", "Unknown"),
        "toPool": recommendation.get("to_pool", "Unknown"),
        "confidence": recommendation.get("confidence", 0),
        "expectedGain": recommendation.get("expected_gain", 0),
        "timestamp": datetime.now().isoformat()
    }
    
    try:
        async with aiohttp.ClientSession() as session:
            # Send to Farcaster
            await session.post(
                "http://localhost:3002/webhooks/farcaster",
                json=notification_data
            )
            
            # Send to frontend WebSocket
            await session.post(
                "http://localhost:3002/webhooks/frontend",
                json=notification_data
            )
    except Exception as e:
        logger.error(f"Failed to send notifications: {e}")

async def periodic_market_analysis():
    """Background task for periodic market analysis"""
    
    while True:
        try:
            logger.info("🔍 Running periodic market analysis...")
            
            # Update market indicators
            await ai_engine.load_market_indicators()
            
            # Retrain models if needed (weekly)
            if datetime.now().weekday() == 0:  # Monday
                logger.info("📚 Weekly model retraining...")
                await ai_engine.train_models()
            
            # Sleep for 1 hour
            await asyncio.sleep(3600)
            
        except Exception as e:
            logger.error(f"Periodic analysis error: {e}")
            await asyncio.sleep(300)  # Retry in 5 minutes

async def performance_monitoring():
    """Background task for performance monitoring"""
    
    while True:
        try:
            # Log performance metrics
            status = ai_engine.get_ai_status()
            logger.info(f"📊 AI Performance - Accuracy: {status['prediction_accuracy']:.3f}, "
                       f"Success Rate: {status['successful_rebalances']}/{status['total_predictions']}")
            
            # Sleep for 10 minutes
            await asyncio.sleep(600)
            
        except Exception as e:
            logger.error(f"Performance monitoring error: {e}")
            await asyncio.sleep(300)

if __name__ == "__main__":
    uvicorn.run(
        "advanced_main:app",
        host="0.0.0.0",
        port=3003,
        reload=True,
        log_level="info"
    )