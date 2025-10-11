@echo off
echo 🚀 Starting AI Yield Agent - Complete Hackathon Demo
echo.

REM Check if required directories exist
if not exist "frontend" (
    echo ❌ Frontend directory not found
    pause
    exit /b 1
)

if not exist "backend" (
    echo ❌ Backend directory not found
    pause
    exit /b 1
)

if not exist "agent" (
    echo ❌ Agent directory not found
    pause
    exit /b 1
)

echo 📋 Starting services in order...
echo.

REM Start Backend (Node.js)
echo 🔧 Starting Backend API Server...
start "AI Yield Agent - Backend" cmd /k "cd backend && npm install && npm start"
timeout /t 5 /nobreak > nul

REM Start AI Agent (Python)
echo 🤖 Starting AI Agent Service...
start "AI Yield Agent - AI Service" cmd /k "cd agent && pip install -r requirements.txt && python main.py"
timeout /t 5 /nobreak > nul

REM Start Frontend (Next.js)
echo 🌐 Starting Frontend Application...
start "AI Yield Agent - Frontend" cmd /k "cd frontend && npm install && npm run dev"
timeout /t 3 /nobreak > nul

REM Start Farcaster Mini App
echo 🎭 Starting Farcaster Mini App...
start "AI Yield Agent - Farcaster" cmd /k "cd farcaster && npm install && npm start"
timeout /t 3 /nobreak > nul

echo.
echo ✅ All services started successfully!
echo.
echo 📊 Service URLs:
echo    Frontend:  http://localhost:3000
echo    Backend:   http://localhost:3002
echo    AI Agent:  http://localhost:3003
echo    Farcaster: http://localhost:3004
echo.
echo 🎯 Demo Flow:
echo    1. Open http://localhost:3000 in your browser
echo    2. Connect your MetaMask wallet
echo    3. Create a delegation with constraints
echo    4. Watch AI analyze and execute yield optimization
echo    5. Check audit log for complete transparency
echo.
echo 🏆 Hackathon Features Demonstrated:
echo    ✓ AI Agent with ML-based decisions
echo    ✓ Scoped delegations with constraints
echo    ✓ Real-time Envio integration
echo    ✓ MetaMask Smart Accounts
echo    ✓ Monad testnet deployment
echo    ✓ Farcaster social notifications
    ✓ Interactive Farcaster Mini App
echo.
echo Press any key to open the application...
pause > nul

REM Open the application in default browser
start http://localhost:3000

echo.
echo 🎉 AI Yield Agent is now running!
echo    Close this window to stop all services.
echo.
pause