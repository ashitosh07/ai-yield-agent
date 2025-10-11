#!/usr/bin/env python3
"""
Test script to verify all components are working
"""

import subprocess
import time
import requests
import sys
import os

def test_backend():
    """Test backend server"""
    print("🔧 Testing Backend...")
    
    try:
        # Start backend in background
        backend_process = subprocess.Popen(
            ["node", "src/server.js"],
            cwd="backend",
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE
        )
        
        # Wait for startup
        time.sleep(3)
        
        # Test health endpoint
        response = requests.get("http://localhost:3001/health", timeout=5)
        if response.status_code == 200:
            print("✅ Backend is running")
            backend_process.terminate()
            return True
        else:
            print("❌ Backend health check failed")
            backend_process.terminate()
            return False
            
    except Exception as e:
        print(f"❌ Backend test failed: {e}")
        return False

def test_agent():
    """Test AI agent"""
    print("🤖 Testing AI Agent...")
    
    try:
        # Test imports
        sys.path.append('agent')
        from ai_engine import YieldOptimizer
        from blockchain_client import MonadClient
        from delegation_validator import DelegationValidator
        
        # Test AI engine
        optimizer = YieldOptimizer()
        pools_data = [
            {"address": "0x123", "name": "Pool1", "apy": 10.0, "tvl": 1000000, "risk_score": 0.2},
            {"address": "0x456", "name": "Pool2", "apy": 15.0, "tvl": 800000, "risk_score": 0.4}
        ]
        
        action = optimizer.analyze_rebalance_opportunity(pools_data, "0x456", 20.0)
        if action:
            print("✅ AI engine working")
        else:
            print("⚠️ AI engine returned no action (expected for test data)")
        
        print("✅ AI Agent components loaded successfully")
        return True
        
    except Exception as e:
        print(f"❌ AI Agent test failed: {e}")
        return False

def test_frontend():
    """Test frontend build"""
    print("🎨 Testing Frontend...")
    
    try:
        # Test Next.js build
        result = subprocess.run(
            ["npm", "run", "build"],
            cwd="frontend",
            capture_output=True,
            text=True,
            timeout=60
        )
        
        if result.returncode == 0:
            print("✅ Frontend builds successfully")
            return True
        else:
            print(f"❌ Frontend build failed: {result.stderr}")
            return False
            
    except Exception as e:
        print(f"❌ Frontend test failed: {e}")
        return False

def main():
    """Run all tests"""
    print("🚀 Testing AI Yield Agent Components\n")
    
    results = {
        "Backend": test_backend(),
        "AI Agent": test_agent(),
        "Frontend": test_frontend()
    }
    
    print("\n📊 Test Results:")
    for component, passed in results.items():
        status = "✅ PASS" if passed else "❌ FAIL"
        print(f"  {component}: {status}")
    
    all_passed = all(results.values())
    print(f"\n🎯 Overall: {'✅ ALL TESTS PASSED' if all_passed else '❌ SOME TESTS FAILED'}")
    
    return 0 if all_passed else 1

if __name__ == "__main__":
    sys.exit(main())