#!/bin/bash
# One-time setup of the EduScan ml_service environment inside WSL2 Ubuntu.
# Run as root:  wsl -d Ubuntu -u root -- bash /mnt/<drive>/<repo>/deploy/ml_setup.sh
set -e

REPO_ROOT="$(cd "$(dirname "$(readlink -f "$0")")/.." && pwd)"

export DEBIAN_FRONTEND=noninteractive
apt-get update -q
apt-get install -y -q build-essential cmake libopenblas-dev liblapack-dev \
  libgl1 libglib2.0-0 curl ca-certificates

# uv provides a pinned CPython 3.10 (tensorflow 2.19 does not support newer
# Ubuntu system Pythons) and fast installs.
if [ ! -x /root/.local/bin/uv ]; then
  curl -LsSf https://astral.sh/uv/install.sh | sh
fi
export PATH=/root/.local/bin:$PATH

uv venv --python 3.10 --allow-existing /root/eduscan-venv
# CPU-only torch first, so the requirements resolution doesn't pull CUDA wheels.
uv pip install --python /root/eduscan-venv/bin/python torch --index-url https://download.pytorch.org/whl/cpu
uv pip install --python /root/eduscan-venv/bin/python -r "$REPO_ROOT/ml_service/requirements.txt"
echo SETUP_DONE
