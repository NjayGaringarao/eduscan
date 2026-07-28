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

Do **not** create the admin login yet, and never create it directly via the
Studio UI or the Supabase Admin API. The admin account is created later,
through the app's own "Initialize Admin Console" wizard (see §8) — that is
the only step that also creates the required kiosk account and seeds the
`config` table the rest of the app depends on. Creating it any other way
leaves the kiosk unable to log in and several admin features broken, with no
obvious error pointing back to the cause.

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

## 8. Day-to-day startup and shutdown

No PowerShell knowledge is needed for this part — two double-clickable files
in `deploy\` do it:

- **`Start EduScan.bat`** — starts everything
- **`Stop EduScan.bat`** — stops everything cleanly

Right-click each and choose *Send to → Desktop (create shortcut)* once, so an
operator can start/stop the system from the desktop without opening the
`deploy` folder.

### Starting

Double-click **`Start EduScan.bat`**. A console window opens and prints five
numbered steps as it works through them:

1. Makes sure Docker Desktop is running (launches it if not — on a cold boot
   this alone can take 1–2 minutes).
2. Starts Supabase (first run of the day is slower; already-running is instant).
3. Starts ml_service inside WSL2 Ubuntu and waits for it to answer — this can
   take up to ~30 seconds because it loads the face-recognition cache from the
   database on every start.
4. Starts the admin app in its **own separate window**, titled
   *"EduScan Admin Server - DO NOT CLOSE THIS WINDOW"*. That window must stay
   open (minimized is fine) for the whole time EduScan is in use — closing it
   stops the dashboard.
5. Waits for the admin app to respond, then **opens your browser automatically**
   to http://localhost:3000.

When the browser opens, EduScan is fully up. Total cold-start time is
typically 2–4 minutes; re-running it when everything is already up finishes
in a few seconds and is safe to do (e.g. if you're not sure whether something
crashed).

**First time only:** the browser will show an **"Initialize Admin Console"**
wizard instead of a login form (no admin account exists yet). Fill in an
email, password, and repeat password — 8+ characters with at least one
uppercase, one lowercase, one digit, and one special character
(`!@#$%^&*.,_`) — and click **Initialize**. No captcha to solve locally.
This single step creates both the admin account *and* the kiosk account, and
seeds the config the app needs — don't create the admin account any other
way. Afterward, go to **Config → Kiosk Authentication** to see the
auto-generated kiosk credentials; you'll enter those on the kiosk's own login
screen. Every subsequent start shows the normal login form instead.

At the end, launch the kiosk from its Start Menu shortcut ("eduscan-kiosk").

**Windows now open, for reference:**
- The `Start EduScan.bat` console window — safe to close once it says "EduScan is ready".
- The "EduScan Admin Server" window — **keep this open**.
- The browser tab with the dashboard.
- The kiosk window, once launched separately.

### Stopping

Double-click **`Stop EduScan.bat`**. It stops the admin app, ml_service, and
Supabase's containers, in that order, and reports each step. It intentionally
leaves Docker Desktop itself running (fast to leave on). Close the kiosk
window yourself before or after running it. To fully release resources
(e.g. before shutting down the PC for the night), also quit Docker Desktop
from its system tray icon — or just shut down/restart the PC, which stops
everything regardless.

### Auto-start at logon (optional)

Task Scheduler → Create Task → trigger *At log on* → action:
`"C:\path\to\repo\deploy\Start EduScan.bat"` (Program/script field — the
`.bat` needs no extra arguments).

### Resetting the database

**`Reset Database.bat`** wipes the local database back to empty and rebuilds
the schema from migrations — every user, attendance log, the admin login, and
the kiosk login are all deleted. It asks you to type `RESET` before doing
anything, so an accidental double-click is harmless. It brings Docker and
Supabase up itself if they aren't already running (same as `Start EduScan.bat`),
so there's no need to run that first.

This is for testing or starting over before real deployment, not routine use.
After running it, you must go through the "Initialize Admin Console" wizard
again at http://localhost:3000/auth (use a fresh/incognito browser window) —
that single step recreates both the admin account and the kiosk account
together, correctly, in one shot. Don't create the admin account by any other
means (e.g. directly via the Supabase Admin API) — only the app's own
initialization flow also seeds the kiosk account and `config` table that the
rest of the app depends on.

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
| Edge function returns 500 *Configuration error* | `supabase/functions/.env` missing or was created after Supabase's first start. Recreate it, then fully cycle Supabase: `Stop EduScan.bat`, then `Start EduScan.bat`. |
| Edge function 500 *Connection refused* to `host.docker.internal:8000` | ml_service not running — `wsl -d Ubuntu -u root -- bash <repo>/deploy/ml_start.sh`, then check `/root/ml_service.log`. |
| Edge function 500 / edge functions unreachable, but `supabase status` looks fine | Known CLI quirk: re-running `supabase start` while already running can stop the `edge_runtime` container without restarting it. `start-eduscan.ps1` checks for and self-heals this automatically (§8) — if it's still down, run `docker start supabase_edge_runtime_eduscan` directly. |
| ml_service log: *permission denied for table user* | Migration `20250101000001_grant_api_role_privileges.sql` not applied — run `npx supabase@2.109.1 db reset --local`. |
| ml_service exits immediately at startup | Supabase wasn't up yet (startup loads the user cache). Start Supabase first — this is why `Start EduScan.bat` always brings Supabase up before ml_service. |
| `curl localhost:8000` from **Windows** times out but everything works | Expected: Hyper-V firewall blocks Windows→WSL loopback (§2 note). Not a fault. |
| Receipt doesn't print | Printer must be named exactly `EPSON TM-T82X Receipt` and be online. Test with the §7 command. |
| DTR PDF export fails | Chrome not installed / `CHROME_PATH` in `admin/.env.local` wrong. |
| Admin "train model" errors | Known gap: the `train_model` edge function does not exist in the repo. |
| Dashboard didn't open automatically / "admin app did not respond" | Look at the "EduScan Admin Server" window for a crash message. Common cause: `admin/.env.local` missing or wrong keys. |

## 11. Updating an existing deployment

`Reset Database.bat` (§8) wipes the database back to empty — don't use it to
apply routine code/schema updates once real attendance data exists. Use this
instead; every step here preserves existing data.

1. **Get the new code**: `git pull` (or copy the updated files over).

2. **Apply new migrations, without wiping data**:
   ```powershell
   npx -y supabase@2.109.1 db push --local --dry-run   # preview what would apply
   npx -y supabase@2.109.1 db push --local              # apply it
   ```
   `db push` only applies migrations not yet in the local history table — it
   never touches existing rows. This is different from `db reset`, which
   recreates the database from scratch.

3. **If `admin/` changed** (most updates do): rebuild and restart it.
   ```powershell
   cd admin
   npm install   # only needed if package.json changed
   npm run build
   ```
   Then close the "EduScan Admin Server" window and run `Start EduScan.bat`
   again — it detects the admin app is down and starts a fresh one with the
   new build.

4. **If `supabase/functions/*` changed** (edge functions): no build step —
   the running container reads them directly off disk via a bind mount. Just
   restart it so it picks up the new code:
   ```powershell
   docker restart supabase_edge_runtime_eduscan
   ```

5. **If `ml_service/` changed**: re-run setup only if `requirements.txt`
   changed (`deploy/ml_setup.sh`, same as §5 — safe to re-run, it reuses the
   existing venv). Either way, restart it: `Stop EduScan.bat` then
   `Start EduScan.bat` (or `wsl -d Ubuntu -u root -- pkill -f "uvicorn main:app"`
   followed by `deploy/ml_start.sh`).

6. **If `kiosk/` changed**: the installed kiosk app is a separate build, not
   something updated in place. Rebuild it (§0's note) on a machine with the
   Rust/Tauri toolchain and reinstall the new `-setup.exe` on each kiosk
   terminal.

When in doubt, just run all of steps 2–4 — `db push` and the rebuilds are
cheap and idempotent when there's nothing new to apply.
