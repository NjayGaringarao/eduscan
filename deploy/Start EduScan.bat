@echo off
REM Double-click this file to start EduScan (Supabase, ml_service, admin app).
REM No PowerShell knowledge needed - this just runs the real script for you.
powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0start-eduscan.ps1"
echo.
echo Press any key to close this window (EduScan keeps running).
pause >nul
