# EduScan local database reset script
# WARNING: destructive. Wipes ALL local data (users, students, employees,
# sessions, attendance logs, admin/kiosk auth accounts, config, schedules,
# announcements) and rebuilds the schema fresh from supabase/migrations.
# Intended for testing / starting over before real deployment - not for
# routine use once real attendance data exists.

$ErrorActionPreference = "Stop"
$RepoRoot = Split-Path -Parent $PSScriptRoot
$SupabaseCliVersion = "2.109.1"

Write-Host "================================================================"
Write-Host "  WARNING: This PERMANENTLY DELETES the local EduScan database"
Write-Host "================================================================"
Write-Host ""
Write-Host "This wipes ALL local data, including:"
Write-Host "  - Every user (students, employees) and their face encodings"
Write-Host "  - All attendance logs and sessions"
Write-Host "  - The admin login and kiosk login accounts"
Write-Host "  - Schedules, announcements, and system config"
Write-Host ""
Write-Host "The schema is rebuilt fresh from migrations. Afterward you must"
Write-Host "re-initialize the admin account at http://localhost:3000/auth"
Write-Host "(this also recreates the kiosk account automatically)."
Write-Host ""
Write-Host "This does NOT touch the kiosk installer, ml_service setup, or code."
Write-Host ""

$confirm = Read-Host "Type RESET (all caps) to continue, or anything else to cancel"
if ($confirm -cne "RESET") {
    Write-Host ""
    Write-Host "Cancelled. No changes were made."
    exit 0
}

Write-Host ""
Write-Host "Checking Docker is running..."
$engineUp = $false
try { if (docker info --format "{{.ServerVersion}}" 2>$null) { $engineUp = $true } } catch {}
if (-not $engineUp) {
    Write-Host "      Not running - starting Docker Desktop..."
    Start-Process "C:\Program Files\Docker\Docker\Docker Desktop.exe"
    for ($i = 0; $i -lt 60; $i++) {
        Start-Sleep -Seconds 5
        try { if (docker info --format "{{.ServerVersion}}" 2>$null) { $engineUp = $true; break } } catch {}
    }
    if (-not $engineUp) { throw "Docker engine did not become ready within 5 minutes." }
}
Write-Host "      Docker is up."

# The Docker API can answer before the container runtime is actually ready
# to run new containers - seen in practice as "error running container:
# exit 1" during `db reset`'s schema step, moments after a cold Docker
# Desktop start. Confirm it can really run something before trusting it.
Write-Host "      Confirming Docker's container runtime is ready..."
$runtimeReady = $false
for ($i = 0; $i -lt 12; $i++) {
    docker run --rm hello-world | Out-Null
    if ($LASTEXITCODE -eq 0) { $runtimeReady = $true; break }
    Start-Sleep -Seconds 5
}
if (-not $runtimeReady) { throw "Docker's container runtime did not become ready within 1 minute." }
Write-Host "      Docker is ready."

Write-Host "Checking the local Supabase deployment is up..."
Set-Location $RepoRoot
npx -y "supabase@$SupabaseCliVersion" status | Out-Null
if ($LASTEXITCODE -ne 0) {
    Write-Host "      Not running - starting Supabase..."
    $startOk = $false
    for ($attempt = 1; $attempt -le 3; $attempt++) {
        npx -y "supabase@$SupabaseCliVersion" start
        if ($LASTEXITCODE -eq 0) { $startOk = $true; break }
        if ($attempt -lt 3) {
            Write-Warning "supabase start failed (attempt $attempt of 3) - retrying in 10 seconds..."
            Start-Sleep -Seconds 10
        }
    }
    if (-not $startOk) { throw "supabase start failed after 3 attempts." }
}
# Known CLI quirk (supabase 2.109.1): edge_runtime can be left stopped after
# a start. Reset needs a healthy stack, so self-heal before proceeding.
$edgeStatus = docker inspect -f "{{.State.Status}}" supabase_edge_runtime_eduscan 2>$null
if ($edgeStatus -ne "running") {
    Write-Host "      Restarting edge runtime container..."
    docker start supabase_edge_runtime_eduscan | Out-Null
    Start-Sleep -Seconds 3
}
$dbStatus = docker inspect -f "{{.State.Status}}" supabase_db_eduscan 2>$null
if ($dbStatus -ne "running") {
    throw "The Supabase database container still isn't running (status: '$dbStatus'). Check Docker Desktop for errors."
}
Write-Host "      Supabase is up."

Write-Host "Resetting database..."
$resetOk = $false
for ($attempt = 1; $attempt -le 3; $attempt++) {
    npx -y "supabase@$SupabaseCliVersion" db reset --local
    if ($LASTEXITCODE -eq 0) { $resetOk = $true; break }
    if ($attempt -lt 3) {
        Write-Warning "Database reset failed (attempt $attempt of 3) - this can happen right after Docker starts, while its container runtime is still settling. Retrying in 10 seconds..."
        Start-Sleep -Seconds 10
    }
}
if (-not $resetOk) {
    throw "Database reset failed after 3 attempts. Run 'npx supabase@$SupabaseCliVersion db reset --local --debug' directly for details."
}

# Same CLI quirk guarded against in start-eduscan.ps1: confirm edge functions
# (face match, attendance logging) are still up after the reset.
$edgeStatus = docker inspect -f "{{.State.Status}}" supabase_edge_runtime_eduscan 2>$null
if ($edgeStatus -ne "running") {
    Write-Host "Restarting edge runtime container..."
    docker start supabase_edge_runtime_eduscan | Out-Null
}

Write-Host ""
Write-Host "Database reset complete."
Write-Host "Next: open http://localhost:3000/auth (use a fresh/incognito window if the"
Write-Host "admin app was already open) and initialize the admin account."
