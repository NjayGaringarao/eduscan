# Switches the admin app from whatever's currently running (production
# build or a previous dev session) to `npm run dev` (Turbopack, hot reload,
# unminified) for active development on this machine.
#
# This is NOT the production mode used day-to-day - run Start EduScan.bat
# again afterward (which rebuilds and restarts in production mode) when
# you're done developing.

$ErrorActionPreference = "Stop"
$RepoRoot = Split-Path -Parent $PSScriptRoot

Write-Host "Stopping whatever is currently serving port 3000..."
$existing = Get-NetTCPConnection -LocalPort 3000 -State Listen -ErrorAction SilentlyContinue
if ($existing) {
    $existing | ForEach-Object { Stop-Process -Id $_.OwningProcess -Force -ErrorAction SilentlyContinue }
    Start-Sleep -Seconds 2
    Write-Host "      Stopped."
} else {
    Write-Host "      Nothing was running."
}

Write-Host "Starting admin in DEV MODE (hot reload)..."
Start-Process -WorkingDirectory (Join-Path $RepoRoot "admin") -FilePath "cmd.exe" `
    -ArgumentList "/c", "title EduScan Admin Server [DEV MODE] - DO NOT CLOSE THIS WINDOW && npm run dev"

Write-Host ""
Write-Host "Dev server starting at http://localhost:3000 (takes a few seconds)."
Write-Host "This is the unminified dev build, not production - run Start EduScan.bat"
Write-Host "to rebuild and switch back to production mode when you're done."
