# Quick Start Envio Indexer (after setup is complete)

Write-Host "⚡ Starting Envio Indexer..." -ForegroundColor Green

$projectPath = "/mnt/c/Personal/monad\ hackathon/ai-yield-agent/envio"

Write-Host "📍 Project path: $projectPath" -ForegroundColor Yellow
Write-Host "🌐 GraphQL endpoint: http://localhost:8080" -ForegroundColor Cyan
Write-Host "🔑 Admin password: testing" -ForegroundColor Cyan
Write-Host "🔗 Network: Monad Testnet (ID: 10143)" -ForegroundColor Cyan

wsl -e bash -c "cd '$projectPath' && envio dev"