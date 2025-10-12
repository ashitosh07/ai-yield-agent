@echo off
echo ========================================
echo   HyperIndex - Real-time Monad Indexer
echo ========================================
echo.
echo Starting HyperIndex with:
echo ✅ Monad Testnet RPC: https://testnet-rpc.monad.xyz
echo ✅ Pool Contract: 0x642672169398C3281A14D063626371eFC30CeF3F
echo ✅ Token Contract: 0x8f5f1F5a93Be3C57f53f85B705f179F936dcDCea
echo ✅ GraphQL API: http://localhost:8000
echo.

cd /d "%~dp0"

echo Installing dependencies...
call pnpm install

echo Starting HyperIndex indexer...
call pnpm dev

pause