#!/usr/bin/env python3
"""
Advanced Feature Testing Suite for AI Yield Agent
Tests all real implementations and integrations
"""

import asyncio
import aiohttp
import json
import time
from datetime import datetime
from typing import Dict, List

class AdvancedFeatureTester:
    def __init__(self):
        self.backend_url = "http://localhost:3002"
        self.ai_agent_url = "http://localhost:3003"
        self.farcaster_url = "http://localhost:3004"
        self.frontend_url = "http://localhost:3000"
        
        self.test_results = []
        self.test_user_address = "0xfB0A5Ebf31A15Ee3cD51080F1bCAC39Cd676343f"
    
    async def run_all_tests(self):
        """Run comprehensive test suite"""
        print("🧪 Starting Advanced Feature Testing Suite")
        print("=" * 60)
        
        # Test categories
        test_categories = [
            ("🔧 Backend API Tests", self.test_backend_apis),
            ("🤖 AI Agent Tests", self.test_ai_agent),
            ("🎭 Farcaster Integration Tests", self.test_farcaster_features),
            ("⚡ Real-time Features Tests", self.test_realtime_features),
            ("📊 Analytics Tests", self.test_analytics_features),
            ("🔗 Integration Tests", self.test_cross_service_integration)
        ]
        
        for category_name, test_function in test_categories:
            print(f"\n{category_name}")
            print("-" * 40)
            await test_function()
        
        # Print summary
        self.print_test_summary()
    
    async def test_backend_apis(self):
        """Test all backend API endpoints"""
        
        endpoints = [
            ("Health Check", "GET", "/health"),
            ("Real-time Pools", "GET", "/api/pools/real-time"),
            ("Pool Analytics", "GET", "/api/pools/analytics"),
            ("Envio Stats", "GET", "/api/envio/stats"),
            ("Envio Events", "GET", "/api/envio/events?limit=10"),
            ("User Positions", "GET", f"/api/pools/positions/{self.test_user_address}"),
            ("Pool Comparison", "GET", "/api/pools/compare?pools=0x742d35Cc6634C0532925a3b8D4C9db4C8b9b8b8b"),
            ("Advanced Health", "GET", "/api/pools/health")
        ]
        
        async with aiohttp.ClientSession() as session:
            for name, method, endpoint in endpoints:
                success = await self.test_endpoint(session, self.backend_url + endpoint, name, method)
                self.test_results.append(("Backend", name, success))
    
    async def test_ai_agent(self):
        """Test AI agent advanced features"""
        
        endpoints = [
            ("AI Status", "GET", "/status"),
            ("Performance Metrics", "GET", "/performance"),
            ("Health Check", "GET", "/")
        ]
        
        # Test POST endpoints
        post_tests = [
            ("Pool Analysis", "POST", "/analyze", {
                "poolAddress": "0x742d35Cc6634C0532925a3b8D4C9db4C8b9b8b8b",
                "oldAPY": 10.5,
                "newAPY": 12.8,
                "timestamp": datetime.now().isoformat(),
                "userAddress": self.test_user_address
            }),
            ("AI Recommendations", "POST", "/recommendations", {
                "userAddress": self.test_user_address,
                "riskTolerance": 0.5,
                "maxPositions": 3
            })
        ]
        
        async with aiohttp.ClientSession() as session:
            # Test GET endpoints
            for name, method, endpoint in endpoints:
                success = await self.test_endpoint(session, self.ai_agent_url + endpoint, name, method)
                self.test_results.append(("AI Agent", name, success))
            
            # Test POST endpoints
            for name, method, endpoint, data in post_tests:
                success = await self.test_endpoint(session, self.ai_agent_url + endpoint, name, method, data)
                self.test_results.append(("AI Agent", name, success))
    
    async def test_farcaster_features(self):
        """Test Farcaster mini app features"""
        
        # Test frame endpoints
        frame_tests = [
            ("Portfolio Frame", f"/frame/portfolio/{self.test_user_address}"),
            ("Delegation Frame", "/frame/delegate"),
            ("Action Frame", "/frame/approve/demo-123")
        ]
        
        # Test image generation APIs
        image_tests = [
            ("Portfolio Image", f"/api/frame/portfolio-image/{self.test_user_address}"),
            ("Delegation Image", "/api/frame/delegate-image"),
            ("Action Image", "/api/frame/action-image/demo-123"),
            ("Success Image", "/api/frame/success-image")
        ]
        
        # Test utility endpoints
        utility_tests = [
            ("Health Check", "/health"),
            ("Stats", "/stats")
        ]
        
        async with aiohttp.ClientSession() as session:
            # Test frames
            for name, endpoint in frame_tests:
                success = await self.test_endpoint(session, self.farcaster_url + endpoint, f"Frame: {name}")
                self.test_results.append(("Farcaster", f"Frame: {name}", success))
            
            # Test images
            for name, endpoint in image_tests:
                success = await self.test_endpoint(session, self.farcaster_url + endpoint, f"Image: {name}")
                self.test_results.append(("Farcaster", f"Image: {name}", success))
            
            # Test utilities
            for name, endpoint in utility_tests:
                success = await self.test_endpoint(session, self.farcaster_url + endpoint, name)
                self.test_results.append(("Farcaster", name, success))
    
    async def test_realtime_features(self):
        """Test real-time features"""
        
        print("Testing WebSocket connection...")
        try:
            import websockets
            
            # Test WebSocket connection
            uri = "ws://localhost:3002/api/pools/ws"
            async with websockets.connect(uri, timeout=5) as websocket:
                # Send subscription message
                await websocket.send(json.dumps({
                    "type": "subscribe_pool",
                    "poolAddress": "0x742d35Cc6634C0532925a3b8D4C9db4C8b9b8b8b"
                }))
                
                # Wait for initial data
                try:
                    message = await asyncio.wait_for(websocket.recv(), timeout=3)
                    data = json.loads(message)
                    
                    if data.get("type") == "initial_data":
                        print("✅ WebSocket: Initial data received")
                        self.test_results.append(("Real-time", "WebSocket Connection", True))
                    else:
                        print("⚠️ WebSocket: Unexpected message format")
                        self.test_results.append(("Real-time", "WebSocket Connection", False))
                        
                except asyncio.TimeoutError:
                    print("⚠️ WebSocket: Timeout waiting for data")
                    self.test_results.append(("Real-time", "WebSocket Connection", False))
                    
        except ImportError:
            print("⚠️ WebSocket: websockets library not installed")
            self.test_results.append(("Real-time", "WebSocket Connection", False))
        except Exception as e:
            print(f"❌ WebSocket: Connection failed - {e}")
            self.test_results.append(("Real-time", "WebSocket Connection", False))
    
    async def test_analytics_features(self):
        """Test analytics and dashboard features"""
        
        analytics_endpoints = [
            ("Market Analytics", f"{self.backend_url}/api/pools/analytics"),
            ("Pool History", f"{self.backend_url}/api/pools/0x742d35Cc6634C0532925a3b8D4C9db4C8b9b8b8b/history?days=7"),
            ("AI Performance", f"{self.ai_agent_url}/performance")
        ]
        
        async with aiohttp.ClientSession() as session:
            for name, url in analytics_endpoints:
                success = await self.test_endpoint(session, url, name)
                self.test_results.append(("Analytics", name, success))
    
    async def test_cross_service_integration(self):
        """Test integration between services"""
        
        print("Testing cross-service integration...")
        
        # Test AI trigger from backend webhook
        webhook_data = {
            "event": "pool_apy_change",
            "data": {
                "poolAddress": "0x742d35Cc6634C0532925a3b8D4C9db4C8b9b8b8b",
                "oldAPY": 10.0,
                "newAPY": 12.5,
                "timestamp": int(time.time()),
                "blockNumber": 12345
            }
        }
        
        async with aiohttp.ClientSession() as session:
            try:
                async with session.post(
                    f"{self.backend_url}/webhooks/envio",
                    json=webhook_data,
                    timeout=10
                ) as response:
                    if response.status == 200:
                        print("✅ Integration: Envio webhook processed")
                        self.test_results.append(("Integration", "Envio Webhook", True))
                    else:
                        print(f"⚠️ Integration: Webhook returned {response.status}")
                        self.test_results.append(("Integration", "Envio Webhook", False))
            except Exception as e:
                print(f"❌ Integration: Webhook failed - {e}")
                self.test_results.append(("Integration", "Envio Webhook", False))
    
    async def test_endpoint(self, session: aiohttp.ClientSession, url: str, name: str, method: str = "GET", data: Dict = None):
        """Test a single endpoint"""
        
        try:
            if method == "GET":
                async with session.get(url, timeout=10) as response:
                    success = response.status < 400
            else:  # POST
                async with session.post(url, json=data, timeout=10) as response:
                    success = response.status < 400
            
            if success:
                print(f"✅ {name}")
            else:
                print(f"❌ {name} (Status: {response.status})")
            
            return success
            
        except asyncio.TimeoutError:
            print(f"⏰ {name} (Timeout)")
            return False
        except Exception as e:
            print(f"❌ {name} (Error: {str(e)[:50]})")
            return False
    
    def print_test_summary(self):
        """Print comprehensive test summary"""
        
        print("\n" + "=" * 60)
        print("📊 TEST SUMMARY")
        print("=" * 60)
        
        # Group results by category
        categories = {}
        for category, test_name, success in self.test_results:
            if category not in categories:
                categories[category] = {"passed": 0, "failed": 0, "tests": []}
            
            if success:
                categories[category]["passed"] += 1
            else:
                categories[category]["failed"] += 1
            
            categories[category]["tests"].append((test_name, success))
        
        total_passed = 0
        total_failed = 0
        
        for category, results in categories.items():
            passed = results["passed"]
            failed = results["failed"]
            total = passed + failed
            
            total_passed += passed
            total_failed += failed
            
            print(f"\n{category}:")
            print(f"  ✅ Passed: {passed}/{total}")
            print(f"  ❌ Failed: {failed}/{total}")
            
            if failed > 0:
                print("  Failed tests:")
                for test_name, success in results["tests"]:
                    if not success:
                        print(f"    - {test_name}")
        
        print(f"\n🎯 OVERALL RESULTS:")
        print(f"  Total Tests: {total_passed + total_failed}")
        print(f"  ✅ Passed: {total_passed}")
        print(f"  ❌ Failed: {total_failed}")
        
        success_rate = (total_passed / (total_passed + total_failed)) * 100 if (total_passed + total_failed) > 0 else 0
        print(f"  📈 Success Rate: {success_rate:.1f}%")
        
        if success_rate >= 90:
            print("\n🏆 EXCELLENT! Ready for hackathon demo!")
        elif success_rate >= 75:
            print("\n👍 GOOD! Most features working correctly.")
        elif success_rate >= 50:
            print("\n⚠️ NEEDS WORK! Some critical features failing.")
        else:
            print("\n🚨 CRITICAL ISSUES! Major features not working.")
        
        print("\n" + "=" * 60)

async def main():
    """Main test runner"""
    
    print("🚀 AI Yield Agent - Advanced Feature Testing")
    print("Testing all real implementations and integrations")
    print()
    
    # Wait for services to be ready
    print("⏳ Waiting for services to start...")
    await asyncio.sleep(5)
    
    tester = AdvancedFeatureTester()
    await tester.run_all_tests()

if __name__ == "__main__":
    try:
        asyncio.run(main())
    except KeyboardInterrupt:
        print("\n\n⏹️ Testing interrupted by user")
    except Exception as e:
        print(f"\n\n💥 Testing failed with error: {e}")