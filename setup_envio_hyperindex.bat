@echo off
echo 🚀 Setting up Envio HyperIndex for Monad Testnet
echo ================================================

cd envio

echo.
echo 📦 Installing Envio dependencies...
call npm install

echo.
echo 🔧 Generating Envio types and schema...
call npx envio codegen

echo.
echo 🏗️ Building the indexer...
call npx envio build

echo.
echo ⚡ Starting Envio HyperIndex indexer...
echo 📡 This will index Monad Testnet events in real-time
echo 🔗 GraphQL endpoint will be available at: http://localhost:8080/v1/graphql
echo.

start "Envio HyperIndex" cmd /k "npx envio start"

echo.
echo ✅ Envio HyperIndex setup complete!
echo.
echo 📊 Available endpoints:
echo   - GraphQL: http://localhost:8080/v1/graphql
echo   - GraphiQL: http://localhost:8080/v1/graphiql
echo   - Health: http://localhost:8080/health
echo.
echo 🎯 The indexer is now processing Monad Testnet events:
echo   - USDC Token transfers and approvals
echo   - Uniswap V3 pool creations
echo   - Uniswap V3 swaps, mints, and burns
echo.
echo 🤖 Events will trigger AI analysis automatically!

pause