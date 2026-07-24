# EduScan single-machine startup script
# Starts, in order: Docker Desktop -> local Supabase -> ml_service (WSL2 Ubuntu) -> admin app.
# The kiosk app is launched separately from its installed shortcut.

$ErrorActionPreference = "Stop"
$RepoRoot = Split-Path -Parent $PSScriptRoot
$SupabaseCliVersion = "2.109.1"

# Repo path as seen from inside WSL (C:\foo\bar -> /mnt/c/foo/bar)
$WslRepoRoot = "/mnt/" + $RepoRoot.Substring(0, 1).ToLower() + ($RepoRoot.Substring(2) -replace "\\", "/")

Write-Host "[1/5] Ensuring Docker Desktop is running..."
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

Write-Host "[2/5] Starting local Supabase..."
Set-Location $RepoRoot
# Known CLI quirk (supabase 2.109.1): re-running `start` while already running
# stops the edge_runtime/imgproxy/pooler containers and does not bring them
# back. So only call `start` when Supabase isn't already up.
npx -y "supabase@$SupabaseCliVersion" status | Out-Null
if ($LASTEXITCODE -ne 0) {
    npx -y "supabase@$SupabaseCliVersion" start
    if ($LASTEXITCODE -ne 0) { throw "supabase start failed." }
} else {
    Write-Host "      Already running."
}
# Safety net regardless of how we got here: edge functions (face match,
# attendance logging) run in this container - without it the kiosk silently fails.
$edgeStatus = docker inspect -f "{{.State.Status}}" supabase_edge_runtime_eduscan 2>$null
if ($edgeStatus -ne "running") {
    Write-Host "      Restarting edge runtime container..."
    docker start supabase_edge_runtime_eduscan | Out-Null
    Start-Sleep -Seconds 3
}

Write-Host "[3/5] Starting ml_service in WSL2 Ubuntu (port 8000)..."
# Runs detached inside WSL via setsid; logs to /root/ml_service.log
wsl -d Ubuntu -u root -- bash "$WslRepoRoot/deploy/ml_start.sh"

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

Write-Host "[4/5] Starting admin app (port 3000)..."
$adminAlreadyUp = $false
try { Invoke-WebRequest -Uri "http://localhost:3000" -UseBasicParsing -TimeoutSec 2 | Out-Null; $adminAlreadyUp = $true } catch { if ($_.Exception.Response) { $adminAlreadyUp = $true } }
if ($adminAlreadyUp) {
    Write-Host "      Already running."
} else {
    # Runs in its own window, titled so it's identifiable in the taskbar.
    # This window must stay open (minimizing is fine) - closing it stops the admin app.
    Start-Process -WorkingDirectory (Join-Path $RepoRoot "admin") -FilePath "cmd.exe" `
        -ArgumentList "/c", "title EduScan Admin Server - DO NOT CLOSE THIS WINDOW && npm run start"
}

Write-Host "[5/5] Waiting for admin app to become ready..."
$adminUp = $false
for ($i = 0; $i -lt 24; $i++) {
    Start-Sleep -Seconds 5
    try { Invoke-WebRequest -Uri "http://localhost:3000" -UseBasicParsing -TimeoutSec 3 | Out-Null; $adminUp = $true; break }
    catch { if ($_.Exception.Response) { $adminUp = $true; break } }
}

Write-Host ""
if ($adminUp) {
    Write-Host "EduScan is ready:"
    Write-Host "  Admin dashboard : http://localhost:3000"
    Write-Host "  Supabase Studio : http://localhost:54333"
    Write-Host "  ML service      : http://localhost:8000/docs"
    Write-Host "Launch the kiosk from its installed shortcut."
    Start-Process "http://localhost:3000"
} else {
    Write-Warning "Admin app did not respond within 2 minutes. Check the 'EduScan Admin Server' window for errors."
}
