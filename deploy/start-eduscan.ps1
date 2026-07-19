# EduScan single-machine startup script
# Starts, in order: Docker Desktop -> local Supabase -> ml_service (WSL2 Ubuntu) -> admin app.
# The kiosk app is launched separately from its installed shortcut.

$ErrorActionPreference = "Stop"
$RepoRoot = Split-Path -Parent $PSScriptRoot
$SupabaseCliVersion = "2.109.1"

Write-Host "[1/4] Ensuring Docker Desktop is running..."
$engineUp = $false
try { if (docker info --format "{{.ServerVersion}}" 2>$null) { $engineUp = $true } } catch {}
if (-not $engineUp) {
    Start-Process "C:\Program Files\Docker\Docker\Docker Desktop.exe"
    for ($i = 0; $i -lt 60; $i++) {
        Start-Sleep -Seconds 5
        try { if (docker info --format "{{.ServerVersion}}" 2>$null) { $engineUp = $true; break } } catch {}
    }
    if (-not $engineUp) { throw "Docker engine did not become ready within 5 minutes." }
}
Write-Host "      Docker engine is up."

Write-Host "[2/4] Starting local Supabase..."
Set-Location $RepoRoot
npx -y "supabase@$SupabaseCliVersion" start
if ($LASTEXITCODE -ne 0) { throw "supabase start failed." }

Write-Host "[3/4] Starting ml_service in WSL2 Ubuntu (port 8000)..."
# Runs detached inside WSL via setsid; logs to /root/ml_service.log
wsl -d Ubuntu -u root -- bash /mnt/c/Users/Njay/repos/eduscan/deploy/ml_start.sh

# Wait for ml_service to answer (startup loads the user cache from Supabase).
# Checked from inside WSL: the Hyper-V firewall blocks Windows->WSL loopback,
# but Docker's edge runtime reaches it via host.docker.internal regardless.
$mlUp = $false
for ($i = 0; $i -lt 36; $i++) {
    Start-Sleep -Seconds 5
    $code = wsl -d Ubuntu -u root -- curl -s -o /dev/null -w "%{http_code}" --max-time 3 http://localhost:8000/docs
    if ($code -eq "200") { $mlUp = $true; break }
}
if ($mlUp) { Write-Host "      ml_service is up." }
else { Write-Warning "ml_service did not respond within 3 minutes - check: wsl -d Ubuntu -u root cat /root/ml_service.log" }

Write-Host "[4/4] Starting admin app (port 3000)..."
Start-Process -WorkingDirectory (Join-Path $RepoRoot "admin") -FilePath "cmd.exe" -ArgumentList "/c", "npm run start"

Write-Host ""
Write-Host "EduScan is starting:"
Write-Host "  Admin dashboard : http://localhost:3000"
Write-Host "  Supabase Studio : http://localhost:54333"
Write-Host "  ML service      : http://localhost:8000/docs"
Write-Host "Launch the kiosk from its installed shortcut."
