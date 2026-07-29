@echo off
REM Stops whatever is currently serving the admin dashboard (production or a
REM previous dev session) and restarts it in DEV MODE (hot reload, unminified
REM - for active development only). Run "Start EduScan.bat" afterward to
REM rebuild and switch back to production mode.
powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0dev-admin.ps1"
echo.
echo Press any key to close this window.
pause >nul
