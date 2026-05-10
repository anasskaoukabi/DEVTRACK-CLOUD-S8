@echo off
echo Starting DevTrack...
echo.

start "DevTrack Backend" cmd /k "cd /d %~dp0backend && npm run dev"
timeout /t 2 /noisy > nul
start "DevTrack Frontend" cmd /k "cd /d %~dp0frontend && npm run dev"

echo.
echo DevTrack is starting...
echo   Backend:  http://localhost:3001
echo   Frontend: http://localhost:3000
echo.
echo Press any key to exit this window (servers will keep running)
pause > nul
