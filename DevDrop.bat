@echo off
title DevDrop - Local File Sharing
echo ====================================================
echo               DevDrop Local Sharing
echo ====================================================
echo.
echo Starting DevDrop server...
cd /d "%~dp0"

:: Start the browser dashboard after a 1.5-second pause
start /b cmd /c "timeout /t 2 /nobreak >nul && start http://localhost:4545"

:: Launch the DevDrop Node.js server
node apps\server\dist\index.js

echo.
echo DevDrop server has stopped.
pause

