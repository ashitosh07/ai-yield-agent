@echo off
echo 🧪 Testing AI Yield Agent Services...

echo.
echo Testing Backend (Port 3002)...
curl -s http://localhost:3002/health || echo ❌ Backend not responding

echo.
echo Testing AI Agent (Port 3003)...
curl -s http://localhost:3003/ || echo ❌ AI Agent not responding

echo.
echo Testing Farcaster Mini App (Port 3006)...
curl -s http://localhost:3006/ || echo ❌ Farcaster not responding

echo.
echo Testing Frontend (Port 3000)...
curl -s -I http://localhost:3000 || echo ❌ Frontend not responding

echo.
echo 📊 Service Status Complete
pause