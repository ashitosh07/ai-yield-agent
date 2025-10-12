@echo off
echo 🚀 Starting Envio HyperIndex Demo
echo ================================

echo.
echo 📡 Starting mock GraphQL server on port 8080...
cd backend
start "Envio GraphQL Mock" cmd /k "node -e \"const express = require('express'); const app = express(); app.use(express.json()); app.get('/health', (req,res) => res.json({status:'healthy'})); app.post('/v1/graphql', (req,res) => res.json({data:{Transfer:[{id:'demo',from:'0x123',to:'0x456',value:'1000000000'}]}})); app.listen(8080, () => console.log('📊 Mock Envio GraphQL running on http://localhost:8080'));\""

echo.
echo 🔄 Starting all services...
cd ..
call start_all.bat

echo.
echo ✅ Demo setup complete!
echo.
echo 📊 Available endpoints:
echo   - Mock GraphQL: http://localhost:8080/v1/graphql
echo   - Backend API: http://localhost:3002/api/envio/stats
echo   - Frontend: http://localhost:3000
echo.
echo 🎯 Envio integration is now running in demo mode!

pause