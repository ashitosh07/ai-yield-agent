@echo off
echo ========================================
echo 🚀 AI Yield Agent - Advanced Startup
echo ========================================
echo.

echo 📦 Installing dependencies...
echo.

REM Install backend dependencies
echo Installing backend dependencies...
cd backend
call npm install
cd ..

REM Install frontend dependencies  
echo Installing frontend dependencies...
cd frontend
call npm install
cd ..

REM Install Farcaster dependencies
echo Installing Farcaster dependencies...
cd farcaster
call npm install
cd ..

REM Install Python dependencies for AI agent
echo Installing AI agent dependencies...
cd agent
pip install -r requirements-advanced.txt
cd ..

echo.
echo ✅ Dependencies installed successfully!
echo.

echo 🔧 Creating models directory...
mkdir agent\models 2>nul

echo.
echo 🌟 Starting all services with advanced features...
echo.

REM Start Backend (Advanced)
echo Starting Advanced Backend Server...
start "Backend Server" cmd /k "cd backend && npm start"
timeout /t 3 /nobreak >nul

REM Start Advanced AI Agent
echo Starting Advanced AI Agent...
start "AI Agent" cmd /k "cd agent && python advanced_main.py"
timeout /t 3 /nobreak >nul

REM Start Advanced Farcaster Mini App
echo Starting Advanced Farcaster Mini App...
start "Farcaster App" cmd /k "cd farcaster && npm start"
timeout /t 3 /nobreak >nul

REM Start Frontend
echo Starting Frontend...
start "Frontend" cmd /k "cd frontend && npm run dev"
timeout /t 5 /nobreak >nul

echo.
echo ========================================
echo 🎉 ALL ADVANCED SERVICES STARTED!
echo ========================================
echo.
echo 🌐 Frontend:           http://localhost:3000
echo 🔧 Backend API:        http://localhost:3002
echo 🤖 AI Agent:           http://localhost:3003
echo 🎭 Farcaster Mini App: http://localhost:3006
echo.
echo 📊 Advanced Features:
echo   ✅ Real-time Envio HyperSync integration
echo   ✅ Machine Learning yield optimization
echo   ✅ WebSocket live data streaming
echo   ✅ Advanced SVG frame generation
echo   ✅ Comprehensive analytics dashboard
echo   ✅ AI performance monitoring
echo   ✅ Multi-chart visualizations
echo.
echo 🔍 Health Checks:
echo   Backend:   http://localhost:3002/api/pools/health
echo   AI Agent:  http://localhost:3003/status
echo   Farcaster: http://localhost:3006/health
echo.
echo 📱 Farcaster Frames:
echo   Portfolio: http://localhost:3006/frame/portfolio/[address]
echo   Delegate:  http://localhost:3006/frame/delegate
echo   Approve:   http://localhost:3006/frame/approve/[actionId]
echo.
echo ⚡ Real-time Features:
echo   WebSocket: ws://localhost:3002/api/pools/ws
echo   Live Data: Auto-updating every 10 seconds
echo   AI Monitoring: Continuous market analysis
echo.
echo Press any key to open the application...
pause >nul

start http://localhost:3000

echo.
echo 🎯 Ready for hackathon demo!
echo All advanced features are now active.
echo.
pause