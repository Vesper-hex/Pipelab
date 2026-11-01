@echo off
setlocal

:: Switch to script directory
cd /d "%~dp0"

:: Convert backslashes to forward slashes for valid file URI
set "DIR=%~dp0"
set "DIR=%DIR:\=/%"
set "APP_URL=file:///%DIR%index.html"
set "USER_DIR=%TEMP%\pipelab-profile"

:: 1. Check for Microsoft Edge (Installed by default on Windows 10/11)
if exist "%ProgramFiles(x86)%\Microsoft\Edge\Application\msedge.exe" (
    start "" "%ProgramFiles(x86)%\Microsoft\Edge\Application\msedge.exe" --app="%APP_URL%" --window-size=1600,950 --user-data-dir="%USER_DIR%"
    exit /b 0
)

if exist "%ProgramFiles%\Microsoft\Edge\Application\msedge.exe" (
    start "" "%ProgramFiles%\Microsoft\Edge\Application\msedge.exe" --app="%APP_URL%" --window-size=1600,950 --user-data-dir="%USER_DIR%"
    exit /b 0
)

:: 2. Check for Google Chrome
if exist "%ProgramFiles%\Google\Chrome\Application\chrome.exe" (
    start "" "%ProgramFiles%\Google\Chrome\Application\chrome.exe" --app="%APP_URL%" --window-size=1600,950 --user-data-dir="%USER_DIR%"
    exit /b 0
)

if exist "%ProgramFiles(x86)%\Google\Chrome\Application\chrome.exe" (
    start "" "%ProgramFiles(x86)%\Google\Chrome\Application\chrome.exe" --app="%APP_URL%" --window-size=1600,950 --user-data-dir="%USER_DIR%"
    exit /b 0
)

:: 3. Fallback to default browser
start "" "%APP_URL%"
exit /b 0
