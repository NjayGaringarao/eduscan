#!/bin/bash
# Launches the EduScan ml_service detached inside WSL2 Ubuntu.
cd /mnt/c/Users/Njay/repos/eduscan/ml_service
if pgrep -f "uvicorn main:app" > /dev/null; then
  echo "already running"
  exit 0
fi
setsid nohup /root/eduscan-venv/bin/uvicorn main:app --host 0.0.0.0 --port 8000 >> /root/ml_service.log 2>&1 < /dev/null &
sleep 2
pgrep -f "uvicorn main:app" > /dev/null && echo "launched" || { echo "failed to launch"; tail -5 /root/ml_service.log; exit 1; }
