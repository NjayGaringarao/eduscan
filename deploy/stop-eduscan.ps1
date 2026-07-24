# EduScan single-machine shutdown script
# Stops, in order: admin app -> ml_service (WSL2 Ubuntu) -> Supabase.
# Docker Desktop itself is left running (fast to leave on; close it from the
# system tray, or shut down the PC, to release those resources).

$ErrorActionPreference = "SilentlyContinue"
$RepoRoot = Split-Path -Parent $PSScriptRoot
$SupabaseCliVersion = "2.109.1"

Write-Host "[1/3] Stopping admin app (port 3000)..."
$conns = Get-NetTCPConnection -LocalPort 3000 -State Listen -ErrorAction SilentlyContinue
if ($conns) {
    $conns | ForEach-Object { Stop-Process -Id $_.OwningProcess -Force -ErrorAction SilentlyContinue }
    Write-Host "      Stopped."
} else {
    Write-Host "      Was not running."
}

Write-Host "[2/3] Stopping ml_service (WSL2 Ubuntu)..."
wsl -d Ubuntu -u root -- pkill -f "uvicorn main:app" 2>$null
Write-Host "      Stopped."

Write-Host "[3/3] Stopping Supabase..."
Set-Location $RepoRoot
npx -y "supabase@$SupabaseCliVersion" stop | Out-Null
Write-Host "      Stopped."

Write-Host ""
Write-Host "EduScan is stopped. Docker Desktop is still running (see system tray)."
Write-Host "Remember to also close the kiosk app if it's open."
