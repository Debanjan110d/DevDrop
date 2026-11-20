@echo off
title Stop DevDrop Server
echo ====================================================
echo             Stopping DevDrop Server...
echo ====================================================
echo.

powershell -NoProfile -ExecutionPolicy Bypass -Command "$c = Get-NetTCPConnection -LocalPort 4545 -ErrorAction SilentlyContinue | Where-Object { $_.OwningProcess -gt 0 }; if ($c) { Stop-Process -Id $c.OwningProcess -Force -ErrorAction SilentlyContinue; Write-Host '✓ DevDrop server stopped successfully. All RAM & CPU freed.' -ForegroundColor Green } else { Write-Host 'DevDrop server is not running.' -ForegroundColor Yellow }"

echo.
timeout /t 3
