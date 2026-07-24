@echo off
REM Double-click this file to cleanly stop EduScan (admin app, ml_service, Supabase).
powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0stop-eduscan.ps1"
echo.
echo Press any key to close this window.
pause >nul
