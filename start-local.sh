#!/usr/bin/env bash
set -euo pipefail

IMAGE_NAME="portfolio"
IMAGE_TAG="local-$(date +%Y%m%d%H%M%S)"
FULL_IMAGE="${IMAGE_NAME}:${IMAGE_TAG}"
ENABLE_TUNNEL="${ENABLE_TUNNEL:-auto}"

require_cmd() {
    command -v "$1" >/dev/null 2>&1 || {
        echo "❌ Missing required command: $1"
        exit 1
    }
}

require_cmd docker
require_cmd minikube
require_cmd kubectl

echo "🚀 Starting Local Kubernetes Deployment..."

# 1. Start Minikube (if not running)
if ! minikube status | grep -q "Running"; then
    minikube start --driver=docker
fi

# 2. Point Docker CLI to Minikube's Docker daemon
echo "📦 Building image inside Minikube..."
eval "$(minikube -p minikube docker-env)"

# 3. Build a fresh image inside Minikube's Docker daemon.
# Use a unique tag each run so Kubernetes always rolls out new pods.
docker build --pull -t "${FULL_IMAGE}" .

# 4. Apply Kubernetes manifests
echo "☸️  Applying manifests..."
kubectl apply -f k8s/deployment.yaml
kubectl apply -f k8s/service.yaml

# 5. Force deployment to use the freshly built image tag
echo "🔄 Updating deployment image to ${FULL_IMAGE}..."
kubectl set image deployment/portfolio portfolio="${FULL_IMAGE}"

# 6. Wait for rollout to complete
echo "⏳ Waiting for rollout to finish..."
kubectl rollout status deployment/portfolio --timeout=120s

# 7. Confirm deployment is available
echo "⏳ Verifying deployment availability..."
kubectl wait --for=condition=available deployment/portfolio --timeout=60s

# 8. Port forward (background, persistent)
echo "🔌 Port forwarding to localhost:8080..."
pkill -f "kubectl port-forward svc/portfolio" || true
nohup kubectl port-forward svc/portfolio 8080:80 > port-forward.log 2>&1 &

echo ""
echo "✅ App running locally at http://localhost:8080"
echo "   Deployed image: ${FULL_IMAGE}"
echo ""

case "${ENABLE_TUNNEL}" in
    true)
        if ! command -v cloudflared >/dev/null 2>&1; then
                echo "❌ ENABLE_TUNNEL=true but cloudflared is not installed."
                exit 1
        fi
        echo "🌍 Starting Cloudflare Tunnel (background)..."
        pkill -f "cloudflared tunnel run" || true
        nohup cloudflared tunnel run portfolio > cloudflared.log 2>&1 &
        ;;
    false)
        echo "ℹ️  Skipping Cloudflare tunnel (ENABLE_TUNNEL=false)."
        ;;
    auto)
        if command -v cloudflared >/dev/null 2>&1 && [[ -f "$HOME/.cloudflared/config.yml" ]]; then
                echo "🌍 Starting Cloudflare Tunnel (background)..."
                pkill -f "cloudflared tunnel run" || true
                nohup cloudflared tunnel run portfolio > cloudflared.log 2>&1 &
        else
                echo "ℹ️  Cloudflare tunnel not started (cloudflared/config missing)."
        fi
        ;;
    *)
        echo "❌ Invalid ENABLE_TUNNEL value: ${ENABLE_TUNNEL} (use: auto|true|false)"
        exit 1
        ;;
esac

echo "🎉 Setup complete!"
echo "   Logs: port-forward.log, cloudflared.log"
echo "   You can now close this terminal."
echo "   To stop later, run: pkill -f cloudflared && pkill -f 'kubectl port-forward'"
