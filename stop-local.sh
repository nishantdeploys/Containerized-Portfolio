#!/usr/bin/env bash
set -euo pipefail

echo "Stopping local forwarding/tunnel processes..."
pkill -f "cloudflared tunnel run" || true
pkill -f "kubectl port-forward svc/portfolio" || true

echo "Local background processes stopped."
