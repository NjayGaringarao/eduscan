@echo off
REM Double-click this file to wipe the local EduScan database and rebuild
REM it fresh from migrations. WARNING: deletes ALL local data. You will be
REM asked to type RESET to confirm before anything happens.
powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0reset-database.ps1"
echo.
echo Press any key to close this window.
pause >nul
