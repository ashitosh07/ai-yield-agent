# Envio PowerShell Scripts

## 🚀 Full Setup (First Time)
```powershell
# Run as Administrator
.\setup-envio.ps1
```

**What it does:**
- Installs WSL + Ubuntu
- Installs Node.js + pnpm
- Installs Envio CLI
- Starts indexer

## ⚡ Quick Start (After Setup)
```powershell
.\start-envio.ps1
```

**What it does:**
- Starts Envio indexer in WSL
- Shows connection info

## 📋 Manual Commands
```powershell
# Check WSL status
wsl --list --verbose

# Enter WSL
wsl

# In WSL terminal:
cd /mnt/c/Personal/monad\ hackathon/ai-yield-agent/envio
envio dev
```

## ✅ Success Indicators
- GraphQL at http://localhost:8080
- Backend status: OFFLINE → LIVE
- Real events in dashboard
- No "Envio indexer not running" errors

## 🔧 Troubleshooting
- **WSL not installed**: Restart after `wsl --install`
- **Permission denied**: Run PowerShell as Administrator
- **Path not found**: Check project location
- **Port 8080 busy**: Stop other services