@echo off
setlocal
title Deploy PipeLab to Vercel
cd /d "%~dp0"

echo ========================================================
echo         PipeLab - Vercel Production Deployment
echo ========================================================
echo.
echo Step 1: Connecting your Vercel account...
echo (A browser window will open if you are not already logged in)
echo.

call npx vercel login

echo.
echo Step 2: Uploading and publishing PipeLab...
echo.

call npx vercel --prod --yes

echo.
if %ERRORLEVEL% EQU 0 (
    echo ========================================================
    echo   [SUCCESS] Deployment complete!
    echo   Live URL: https://pipelab-simulator.vercel.app
    echo ========================================================
    echo Opening browser...
    start https://pipelab-simulator.vercel.app
) else (
    echo.
    echo Deployment encountered an error. Please review the output above.
)

pause
