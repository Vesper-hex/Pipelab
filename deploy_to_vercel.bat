@echo off
setlocal
title Deploy PipeLab to Vercel

cd /d "%~dp0"

echo ========================================================
echo         Deploying PipeLab to Vercel Production
echo ========================================================
echo.
echo Project: pipelab-simulator
echo URL:     https://pipelab-simulator.vercel.app
echo.

npx vercel --prod

echo.
if %ERRORLEVEL% EQU 0 (
    echo ========================================================
    echo   [SUCCESS] Deployment complete!
    echo   Live at: https://pipelab-simulator.vercel.app
    echo ========================================================
) else (
    echo.
    echo If prompted to login, please complete the login in your browser
    echo and re-run this script.
)

pause
