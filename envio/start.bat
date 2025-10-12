@echo off
echo Starting Envio indexer for Monad testnet...

cd /d "%~dp0"

echo Installing dependencies...
npm install

echo Generating code...
npx envio codegen

echo Starting indexer...
npx envio dev

pause