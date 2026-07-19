# EduScan — Single-Machine Windows Deployment Manual

This guide sets up the **entire EduScan stack on one Windows 11 machine**:

| Component | Runs on | Port |
|---|---|---|
| Supabase (DB, auth, edge functions) | Docker Desktop | API **54331**, DB 54332, Studio 54333 |
| ml_service (FastAPI face recognition) | WSL2 Ubuntu | 8000 |
| Admin dashboard (Next.js) | Node on Windows | 3000 |
| Kiosk (Tauri) + receipt printer sidecar | Windows, **pre-built installer** | — |

```
Kiosk ──────────────┐
Admin (:3000) ──────┤→ http://127.0.0.1:54331  (Supabase API / edge functions)
                    │
Edge runtime (Docker) ──http://host.docker.internal:8000──→ ml_service (WSL2)
ml_service ──http://localhost:54331──→ Supabase
```

The kiosk app is **not built on the target machine**. Use the pre-built installer
`eduscan-kiosk_<version>_x64-setup.exe` (built once from `kiosk/` — it already
bundles the receipt-printer sidecar). It is portable to any machine that runs
local Supabase on port 54331, because the Supabase CLI uses the same well-known
local development keys everywhere.

---

## 0. What to bring to the new machine

1. This repository (clone or copy). The path can be anywhere; scripts detect it.
2. The pre-built kiosk installer:
   `kiosk/src-tauri/target/release/bundle/nsis/eduscan-kiosk_<version>_x64-setup.exe`
   (copy it from the build machine — build outputs are not committed to git).
   Use the **NSIS** `-setup.exe` (installs per-user, no admin rights needed);
   the `.msi` requires an elevated install.

> **Rebuilding the kiosk** (only needed if the Supabase URL/port or anon key in
> `kiosk/src/constant/env.ts` changes): requires Rust (MSVC), VS 2022 C++ Build
> Tools, and Node — then `cd kiosk && npm install && npm run tauri build`.
> The sidecar comes from `dotnet publish` of `reciept_printer/` renamed to
> `reciept_printer-x86_64-pc-windows-msvc.exe` in `kiosk/src-tauri/binaries/`
> (see `kiosk/src-tauri/binaries/README.md`). Neither toolchain is needed for
> deployment itself.

## 1. Install Windows prerequisites

- **Docker Desktop** (WSL2 backend — the default)
- **Node.js** LTS (18+)
- **Google Chrome** (used by the admin app to render DTR PDFs)
- **EPSON TM-T82X printer driver** — the installed Windows printer name must be
  exactly **`EPSON TM-T82X Receipt`** (hardcoded in the sidecar; check
  Settings → Bluetooth & devices → Printers). Using a different printer means
  editing `reciept_printer/reciept_printer/Program.cs` and rebuilding the
  sidecar + kiosk.
- **Git** (if cloning)

## 2. Install WSL2 Ubuntu + mirrored networking

```powershell
wsl --install -d Ubuntu --no-launch
```

Create `C:\Users\<you>\.wslconfig` with:

```ini
[wsl2]
networkingMode=mirrored
```

Then restart WSL and (re)start Docker Desktop:

```powershell
wsl --shutdown
# start Docker Desktop from the Start Menu and wait for "Engine running"
```

Mirrored networking (Windows 11 22H2+) lets the WSL service reach the
Windows-hosted Supabase via `localhost:54331`.

> **Note:** with mirrored networking, connections **from Windows into WSL**
> (e.g. `curl http://localhost:8000` in PowerShell) are blocked by the Hyper-V
> firewall by default. This does not affect EduScan — the edge functions reach
> ml_service through Docker's `host.docker.internal`, which works regardless.
> Health-check ml_service from inside WSL instead (see §8). To unblock it
> anyway, run in an **elevated** PowerShell:
> `Set-NetFirewallHyperVVMSetting -Name '{40E0AC32-46A5-438A-A0B2-2B479E8F2E90}' -DefaultInboundAction Allow -LoopbackEnabled True`

## 3. Create the secret/env files (not in git)

Generate one shared password (any random string) — it authenticates the edge
functions to ml_service. It appears in two files below as `<SHARED_SECRET>`.

**`supabase/functions/.env`**

```env
FACEID_URL=http://host.docker.internal:8000
FACEID_PASSWORD=<SHARED_SECRET>
ENABLE_MESSAGING=FALSE
```

(Set `ENABLE_MESSAGING=TRUE` and add `SEMAPHORE_KEY=<key>` to enable SMS.)

**`ml_service/.env`**

```env
SUPABASE_URL=http://localhost:54331
SUPABASE_SERVICE_ROLE=<service_role key from step 4>
SERVICE_PASSWORD=<SHARED_SECRET>
VERIFY_AUTHENTICITY=False
MATCH_THRESHOLD=0.8
```

**`admin/.env.local`**

```env
NEXT_PUBLIC_SUPABASE_URL=http://127.0.0.1:54331
NEXT_PUBLIC_SUPABASE_ANON_KEY=<anon key from step 4>
SUPABASE_SERVICE_ROLE=<service_role key from step 4>
NEXT_PUBLIC_SITE_URL=http://localhost:3000
CHROME_PATH=C:\Program Files\Google\Chrome\Application\chrome.exe
```

## 4. Start Supabase and apply the database

From the repo root:

```powershell
npx -y supabase@2.109.1 start        # first run pulls ~3 GB of images
npx -y supabase@2.109.1 db reset --local   # applies all migrations
npx -y supabase@2.109.1 status       # shows ANON_KEY and SERVICE_ROLE_KEY
```

Copy `ANON_KEY` and `SERVICE_ROLE_KEY` from the status output into the env
files of step 3. (These are the standard Supabase local-development keys —
identical on every machine, which is why the pre-built kiosk works unchanged.)

**Create the admin login** (Studio → http://localhost:54333 → Authentication →
Add user → email + password, or via API):

```powershell
$sr = "<SERVICE_ROLE_KEY>"
$body = @{email="admin@example.com"; password="<choose one>"; email_confirm=$true} | ConvertTo-Json
Invoke-RestMethod -Method Post -Uri "http://127.0.0.1:54331/auth/v1/admin/users" `
  -Headers @{apikey=$sr; Authorization="Bearer $sr"} -ContentType "application/json" -Body $body
```

(The app's own sign-up page expects a reCAPTCHA key and is best avoided locally.)

## 5. Set up ml_service (one-time, ~10–20 min)

```powershell
wsl -d Ubuntu -u root -- bash "<repo path as /mnt/...>/deploy/ml_setup.sh"
# e.g. wsl -d Ubuntu -u root -- bash /mnt/c/Users/Njay/repos/eduscan/deploy/ml_setup.sh
```

This installs build tools, a pinned Python 3.10 (via uv), and all Python
dependencies (dlib is compiled from source — the long part) into
`/root/eduscan-venv`.

## 6. Build the admin app (one-time per code change)

```powershell
cd admin
npm install
npm run build
```

## 7. Install the kiosk

Run `eduscan-kiosk_<version>_x64-setup.exe` (silent: add `/S`). It installs
per-user to `%LOCALAPPDATA%\eduscan-kiosk\` with the receipt-printer sidecar
included. Sanity-check the printer directly:

```powershell
& "$env:LOCALAPPDATA\eduscan-kiosk\reciept_printer.exe" --reference_id "TEST-001" `
  --activity "TIME-IN" --user_id "00-0-0-0000" --name "DEPLOYMENT TEST" `
  --date "JANUARY 1, 2026 (THU)" --time "8:00 AM"
```

Expected output: `Printed successfully!` (and a physical receipt).

## 8. Day-to-day startup

```powershell
powershell -ExecutionPolicy Bypass -File deploy\start-eduscan.ps1
```

This starts, in order: Docker Desktop → Supabase → ml_service (detached in WSL,
log at `/root/ml_service.log`) → admin app. ml_service **must** start after
Supabase — it loads the user face-encoding cache from the database at startup
and exits if the database is unreachable. Launch the kiosk from its Start Menu
shortcut.

To auto-start at logon: Task Scheduler → Create Task → trigger *At log on* →
action `powershell.exe -ExecutionPolicy Bypass -File <repo>\deploy\start-eduscan.ps1`.

## 9. Verification checklist

```powershell
# 1. Supabase healthy
npx -y supabase@2.109.1 status

# 2. ml_service up (checked from inside WSL — see §2 firewall note)
wsl -d Ubuntu -u root -- curl -s -o /dev/null -w "%{http_code}" http://localhost:8000/docs   # 200

# 3. Edge function -> ml_service round trip (proves the shared secret + Docker->WSL path)
$anon = "<ANON_KEY>"
Invoke-RestMethod -Method Post -Uri "http://127.0.0.1:54331/functions/v1/update_user_cache" `
  -Headers @{Authorization="Bearer $anon"}   # {"success":true,...}
```

Then in the UI: log in at http://localhost:3000, register a user with a face
photo (exercises `encode_face`), do a live face-match at the kiosk (exercises
`match_face` + `log_attendance` + receipt printing), and export a DTR PDF.

## 10. Troubleshooting

| Symptom | Cause / fix |
|---|---|
| `supabase start` fails: *port is already allocated* | Another local Supabase project or app owns the port. EduScan already uses a shifted range (54331–54339) for this reason; check `Get-NetTCPConnection -LocalPort <port> -State Listen` and adjust `supabase/config.toml` if needed. Changing the API port requires rebuilding the kiosk (URL is baked in) and updating all env files. |
| Edge function returns 500 *Configuration error* | `supabase/functions/.env` missing or created after `supabase start` — recreate it and run `npx supabase@2.109.1 stop` / `start`. |
| Edge function 500 *Connection refused* to `host.docker.internal:8000` | ml_service not running — `wsl -d Ubuntu -u root -- bash <repo>/deploy/ml_start.sh`, then check `/root/ml_service.log`. |
| ml_service log: *permission denied for table user* | Migration `20250101000001_grant_api_role_privileges.sql` not applied — run `npx supabase@2.109.1 db reset --local`. |
| ml_service exits immediately at startup | Supabase wasn't up yet (startup loads the user cache). Start Supabase first. |
| `curl localhost:8000` from **Windows** times out but everything works | Expected: Hyper-V firewall blocks Windows→WSL loopback (§2 note). Not a fault. |
| Receipt doesn't print | Printer must be named exactly `EPSON TM-T82X Receipt` and be online. Test with the §7 command. |
| DTR PDF export fails | Chrome not installed / `CHROME_PATH` in `admin/.env.local` wrong. |
| Admin "train model" errors | Known gap: the `train_model` edge function does not exist in the repo. |
