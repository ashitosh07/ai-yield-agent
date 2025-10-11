@echo off
echo ========================================
echo 🚀 AI Yield Agent - Simple Startup
echo ========================================
echo.

echo 🌟 Starting services...
echo.

REM Start Backend
echo Starting Backend Server...
start "Backend Server" cmd /k "cd backend && npm start"
timeout /t 3 /nobreak >nul

REM Start Simple AI Agent
echo Starting AI Agent...
start "AI Agent" cmd /k "cd agent && python simple_main.py"
timeout /t 3 /nobreak >nul

REM Start Farcaster Mini App
echo Starting Farcaster Mini App...
start "Farcaster App" cmd /k "cd farcaster && npm start"
timeout /t 3 /nobreak >nul

REM Start Frontend
echo Starting Frontend...
start "Frontend" cmd /k "cd frontend && npm run dev"
timeout /t 5 /nobreak >nul

echo.
echo ========================================
echo 🎉 ALL SERVICES STARTED!
echo ========================================
echo.
echo 🌐 Frontend:           http://localhost:3000
echo 🔧 Backend API:        http://localhost:3002
echo 🤖 AI Agent:           http://localhost:3003
echo 🎭 Farcaster Mini App: http://localhost:3004
echo.
echo Press any key to open the application...
pause >nul

start http://localhost:3000

echo.
echo 🎯 Ready for demo!
pause