# Load Tests (k6)

This folder contains k6 load-test scripts and data for the ML service. The tests are designed to be safe for live environments with short durations and low RPS by default.

**Important:** Avoid including `/api/update-user-cache` in load tests to prevent unintended Supabase billing.

## Quick Start (Local)

1. Copy `.env.example` to `.env.test` and configure the following:
   - `BASE_URL`: The base URL of the ML service.
   - `SERVICE_PASSWORD`: The service password for authentication.
   - `REGISTERED_IMAGE` and `UNKNOWN_IMAGE`: Paths to sample images (use paths under `test/k6/data/` for consistency).
2. Make the runner executable:
   ```bash
   chmod +x test/run.sh
   ```
3. Run the default combined load test:
   ```bash
   ./test/run.sh
   ```

### Examples

- Run the default main script (tests `/api/face-match`, `/api/face-encoding`, and admin pages):
  ```bash
  ./test/run.sh
  ```
- Run only the face-encoding script:
  ```bash
  ./test/run.sh --script face_encoding
  ```
- Run only the face-match script:
  ```bash
  ./test/run.sh --script face_match
  ```
- Run only the admin endpoint script:
  ```bash
  ./test/run.sh --script admin_endpoint
  ```
- Override the registered image path:
  ```bash
  REGISTERED_IMAGE=test/k6/data/my_registered.jpg ./test/run.sh
  ```

## Sample Images

- Place test assets in `test/k6/data/`.
- Default paths in `.env.example`:
  - `test/k6/data/registered_face.jpg`
  - `test/k6/data/unknown_face.jpg`
- To use custom images, update `REGISTERED_IMAGE` and `UNKNOWN_IMAGE` in `.env.test` with absolute or relative paths.

## Safety Defaults

- **Rate:** 5 RPS
- **Duration:** 30 seconds
- **Max Rate:** Enforced in `run.sh` to prevent accidental overload.
- The runner checks for `k6` installation and validates script and image paths.

## Admin endpoints

- Frontend base URL for admin pages defaults to `http://localhost:3000` (override with `ADMIN_BASE_URL`).
- Admin coverage (via `main.js` or `admin_endpoint.js`): `/auth`, `/dashboard`, `/announcement`, `/config`, `/dtr`, `/session_log`, `/user`, `/user/create`, `/user/edit/123`.

## CI Integration

- A manual GitHub Action is available at `.github/workflows/load-test.yml`.
- Use repository secrets for `LOAD_TEST_BASE_URL` and `LOAD_TEST_SERVICE_PASSWORD`.

## Notes

- Monitor Supabase billing when running tests against production.
- For debugging, consider adding a small script to send a single request and print the full response details.
