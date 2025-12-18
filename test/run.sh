#!/usr/bin/env bash
set -euo pipefail

# repo root (one level above this script)
ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)/.."

# Parse flags
SCRIPT_FLAG=""
while [[ $# -gt 0 ]]; do
  case $1 in
    --script)
      SCRIPT_FLAG="$2"
      shift 2
      ;;
    *)
      echo "Unknown option: $1" >&2
      echo "Usage: $0 [--script <script_name>]" >&2
      echo "Available scripts: main, face_match, face_encoding, admin_endpoint" >&2
      exit 1
      ;;
  esac
done

# Prefer .env.test located at repo root, but fall back to test/.env.test
ENV_FILE="${ROOT_DIR}/.env.test"
if [ ! -f "${ENV_FILE}" ]; then
  ENV_FILE="${ROOT_DIR}/test/.env.test"
fi

if [ -f "${ENV_FILE}" ]; then
  echo "Loading env from ${ENV_FILE}"
  set -a
  # shellcheck disable=SC1090
  source "${ENV_FILE}"
  set +a
else
  echo "No .env.test found; relying on environment variables if set"
fi

# Defaults
RATE_VAL=${RATE:-5}
MAX_RATE=${MAX_RATE:-20}
DURATION_VAL=${DURATION:-30s}

# Default k6 script location (relative to repo root)
DEFAULT_SCRIPT="${ROOT_DIR}/test/k6/main.js"

# Resolve script path from flag or env var
if [[ -n "${SCRIPT_FLAG}" ]]; then
  # If script flag is just a name (no path), resolve to test/k6/<name>.js
  if [[ "${SCRIPT_FLAG}" != *"/"* && "${SCRIPT_FLAG}" != *".js" ]]; then
    RESOLVED_SCRIPT="${ROOT_DIR}/test/k6/${SCRIPT_FLAG}.js"
  elif [[ "${SCRIPT_FLAG:0:1}" == "/" ]]; then
    RESOLVED_SCRIPT="${SCRIPT_FLAG}"
  else
    RESOLVED_SCRIPT="${ROOT_DIR}/${SCRIPT_FLAG}"
  fi
elif [[ -n "${K6_SCRIPT:-}" ]]; then
  if [[ "${K6_SCRIPT:0:1}" == "/" ]]; then
    RESOLVED_SCRIPT="${K6_SCRIPT}"
  else
    RESOLVED_SCRIPT="${ROOT_DIR}/${K6_SCRIPT}"
  fi
else
  RESOLVED_SCRIPT="${DEFAULT_SCRIPT}"
fi

# Resolve image env vars to absolute paths (relative to repo root)
# Provide sane defaults if not set in env
REGISTERED_IMAGE="${REGISTERED_IMAGE:-test/data/registered_face.jpeg}"
UNKNOWN_IMAGE="${UNKNOWN_IMAGE:-test/data/unknown_face.jpeg}"
if [[ "${REGISTERED_IMAGE:0:1}" != "/" ]]; then
  REGISTERED_IMAGE="${ROOT_DIR}/${REGISTERED_IMAGE}"
fi
if [[ "${UNKNOWN_IMAGE:0:1}" != "/" ]]; then
  UNKNOWN_IMAGE="${ROOT_DIR}/${UNKNOWN_IMAGE}"
fi

echo "DEBUG: RESOLVED_SCRIPT=${RESOLVED_SCRIPT}"
echo "DEBUG: RATE=${RATE_VAL}, DURATION=${DURATION_VAL}, BASE_URL=${BASE_URL:-<not set>}"
echo "DEBUG: REGISTERED_IMAGE=${REGISTERED_IMAGE}"
echo "DEBUG: UNKNOWN_IMAGE=${UNKNOWN_IMAGE}"

if [ "${RATE_VAL}" -gt "${MAX_RATE}" ]; then
  echo "ERROR: RATE (${RATE_VAL}) exceeds allowed MAX_RATE (${MAX_RATE}). Aborting to protect live services." >&2
  exit 1
fi

if ! command -v k6 >/dev/null 2>&1; then
  echo "ERROR: k6 is not installed or not in PATH. Install it first: https://k6.io/docs/getting-started/installation" >&2
  exit 2
fi

if [ ! -f "${RESOLVED_SCRIPT}" ]; then
  echo "ERROR: K6 script not found at: ${RESOLVED_SCRIPT}" >&2
  exit 3
fi

if [ ! -f "${REGISTERED_IMAGE}" ]; then
  echo "ERROR: Registered image not found at: ${REGISTERED_IMAGE}" >&2
  exit 4
fi
if [ ! -f "${UNKNOWN_IMAGE}" ]; then
  echo "ERROR: Unknown image not found at: ${UNKNOWN_IMAGE}" >&2
  exit 4
fi

echo "Running k6: script=${RESOLVED_SCRIPT}, RATE=${RATE_VAL}, DURATION=${DURATION_VAL}, BASE_URL=${BASE_URL:-<not set>}"

# Run k6 with explicit env variables
k6 run \
  -e RATE="${RATE_VAL}" \
  -e DURATION="${DURATION_VAL}" \
  -e BASE_URL="${BASE_URL:-}" \
  -e ADMIN_BASE_URL="${ADMIN_BASE_URL:-}" \
  -e SERVICE_PASSWORD="${SERVICE_PASSWORD:-}" \
  -e REGISTERED_IMAGE="${REGISTERED_IMAGE}" \
  -e UNKNOWN_IMAGE="${UNKNOWN_IMAGE}" \
  "${RESOLVED_SCRIPT}"
