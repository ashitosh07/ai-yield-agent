# Envio WSL Setup Script for Windows
# Run as Administrator

Write-Host "🚀 Setting up Envio with WSL for AI Yield Agent" -ForegroundColor Green

# Step 1: Install WSL
Write-Host "📦 Installing WSL..." -ForegroundColor Yellow
wsl --install

Write-Host "⚠️  Please restart your computer and run this script again after WSL installation completes." -ForegroundColor Red
Write-Host "Press any key to continue with WSL setup (only if WSL is already installed)..."
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")

# Step 2: Setup Ubuntu in WSL
Write-Host "🐧 Setting up Ubuntu environment..." -ForegroundColor Yellow
wsl -e bash -c "sudo apt update && sudo apt install -y curl git"

# Step 3: Install Node.js
Write-Host "📦 Installing Node.js..." -ForegroundColor Yellow
wsl -e bash -c "curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash - && sudo apt-get install -y nodejs"

# Step 4: Install pnpm
Write-Host "📦 Installing pnpm..." -ForegroundColor Yellow
wsl -e bash -c "npm install -g pnpm"

# Step 5: Navigate to project and install Envio
Write-Host "⚡ Installing Envio in project directory..." -ForegroundColor Yellow
$projectPath = "/mnt/c/Personal/monad\ hackathon/ai-yield-agent/envio"
wsl -e bash -c "cd '$projectPath' && pnpm install"
wsl -e bash -c "cd '$projectPath' && pnpm add -g envio"

# Step 6: Start Envio indexer
Write-Host "🔥 Starting Envio indexer..." -ForegroundColor Green
Write-Host "GraphQL will be available at: http://localhost:8080" -ForegroundColor Cyan
Write-Host "Admin password: testing" -ForegroundColor Cyan

wsl -e bash -c "cd '$projectPath' && envio dev"