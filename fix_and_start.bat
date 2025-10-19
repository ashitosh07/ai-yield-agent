@echo off
echo 🔧 Fixing startup issues and starting AI Yield Agent...

echo.
echo 📦 Installing missing dependencies...

echo Installing farcaster dependencies...
cd farcaster
call npm install
cd ..

echo Installing agent dependencies...
cd agent
call pip install -r requirements.txt
cd ..

echo.
echo 🚀 Starting all services...

echo Starting Backend (Port 3002)...
start "Backend" cmd /k "cd backend && npm start"

timeout /t 3 /nobreak >nul

echo Starting AI Agent (Port 3003)...
start "AI Agent" cmd /k "cd agent && python main.py"

timeout /t 3 /nobreak >nul

echo Starting Farcaster Mini App (Port 3006)...
start "Farcaster" cmd /k "cd farcaster && npm start"

timeout /t 3 /nobreak >nul

echo Starting Frontend (Port 3001)...
start "Frontend" cmd /k "cd frontend && npm run dev"

echo.
echo ✅ All services starting...
echo 📱 Open http://localhost:3001 when ready
echo.
echo Press any key to exit...
pause >nul