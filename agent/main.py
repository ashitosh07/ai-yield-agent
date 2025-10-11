#!/usr/bin/env python3

import asyncio
import json
import logging
import os
from datetime import datetime
from typing import Dict, List, Optional

import aiohttp
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
import uvicorn

from ai_engine import YieldOptimizer
from advanced_ai_engine import ai_engine as advanced_ai_engine
from blockchain_client import MonadClient
from delegation_validator import DelegationValidator

# Setup logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(title="AI Yield Agent")

class AnalysisRequest(BaseModel):
    poolAddress: str
    oldAPY: float
    newAPY: float
    timestamp: str

class RebalanceAction(BaseModel):
    fromPool: str
    toPool: str
    amount: str
    confidence: float
    rationale: str

# Initialize components
yield_optimizer = YieldOptimizer()
monad_client = MonadClient()
delegation_validator = DelegationValidator()

@app.post("/analyze")
async def analyze_yield_opportunity(request: AnalysisRequest):
    """Analyze yield opportunity and execute if confidence is high enough"""
    
    logger.info(f"🔍 Analyzing yield change: {request.poolAddress}")
    
    try:
        # Get current pool data
        pools_data = await get_pools_data()
        
        # AI decision making
        action = yield_optimizer.analyze_rebalance_opportunity(
            pools_data, request.poolAddress, request.newAPY
        )
        
        if not action:
            return {"status": "no_action", "reason": "No profitable rebalance found"}
        
        # Check confidence threshold
        if action.confidence < float(os.getenv('CONFIDENCE_THRESHOLD', 0.8)):
            await notify_user_for_approval(action)
            return {"status": "pending_approval", "action": action}
        
        # Get user address from request or delegation context
        user_address = request.dict().get('userAddress', '0x1234567890123456789012345678901234567890')
        
        # Execute delegated transaction
        result = await execute_delegated_rebalance(action, user_address)
        
        return {
            "status": "executed", 
            "action": action, 
            "txHash": result.get('txHash'),
            "validation": result.get('validation')
        }
        
    except Exception as e:
        logger.error(f"Analysis failed: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

async def get_pools_data() -> List[Dict]:
    """Fetch current pool data from Monad testnet"""
    
    # Mock pool data for demo
    return [
        {
            "address": "0x1234...",
            "name": "USDC/ETH",
            "apy": 12.5,
            "tvl": 1000000,
            "risk_score": 0.3
        },
        {
            "address": "0x5678...",
            "name": "DAI/USDC", 
            "apy": 8.3,
            "tvl": 2000000,
            "risk_score": 0.1
        },
        {
            "address": "0x9abc...",
            "name": "WETH/USDT",
            "apy": 15.2,
            "tvl": 800000,
            "risk_score": 0.5
        }
    ]

async def execute_delegated_rebalance(action: RebalanceAction, user_address: str) -> Dict:
    """Execute rebalance using delegated authority"""
    
    # Validate delegation
    validation_result = await delegation_validator.validate_action(action, user_address)
    if not validation_result.is_valid:
        raise Exception(f"Delegation validation failed: {validation_result.reason}")
    
    # Execute via Monad bundler
    tx_hash = await monad_client.execute_rebalance(action)
    
    # Update usage tracking
    await delegation_validator.update_usage_tracking(user_address, action)
    
    # Log to audit trail
    await log_execution(action, tx_hash, user_address)
    
    # Send notifications
    await send_notifications(action, tx_hash, user_address)
    
    return {"txHash": tx_hash, "validation": validation_result}

async def log_execution(action: RebalanceAction, tx_hash: str, user_address: str):
    """Log execution to audit trail"""
    
    audit_data = {
        "action": "rebalance",
        "details": {
            "rationale": action.rationale,
            "fromPool": action.fromPool,
            "toPool": action.toPool,
            "amount": str(action.amount)
        },
        "txHash": tx_hash,
        "confidence": action.confidence,
        "status": "success",
        "userAddress": user_address
    }
    
    async with aiohttp.ClientSession() as session:
        await session.post(
            "http://localhost:3002/api/audit",
            json=audit_data
        )

async def send_notifications(action: RebalanceAction, tx_hash: str, user_address: str):
    """Send notifications via backend webhooks"""
    
    notification_data = {
        "action": f"Rebalanced {action.amount} ETH",
        "txHash": tx_hash,
        "user": user_address,
        "fromPool": action.fromPool,
        "toPool": action.toPool
    }
    
    async with aiohttp.ClientSession() as session:
        await session.post(
            "http://localhost:3002/webhooks/farcaster",
            json=notification_data
        )

async def notify_user_for_approval(action: RebalanceAction):
    """Notify user when manual approval is needed"""
    
    logger.info(f"⚠️ Low confidence ({action.confidence}), requesting user approval")
    
    # Send notification to frontend
    # Implementation would depend on WebSocket or polling mechanism

if __name__ == "__main__":
    import os
    uvicorn.run(app, host="0.0.0.0", port=3003)