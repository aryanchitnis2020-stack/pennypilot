@echo off
cd /d "%~dp0"
if not exist "backend\.env" (
    echo [ERROR] backend\.env is missing. See README.md for setup.
    pause
    exit /b 1
)
start "PennyPilot Backend" /D "%~dp0backend" cmd /k npm start
start "PennyPilot Frontend" /D "%~dp0" cmd /k npm run dev
timeout /t 5 /nobreak >nul
start "" "http://localhost:5173"
