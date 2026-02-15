#!/usr/bin/env bash
set -e

echo "🚀 Starting Local Kubernetes Deployment..."

# 1. Start Minikube (if not running)
if ! minikube status | grep -q "Running"; then
    minikube start --driver=docker
fi

# 2. Point Docker CLI to Minikube's Docker daemon
echo "📦 Building image inside Minikube..."
eval $(minikube -p minikube docker-env)

# 3. Build the image directly in Minikube registry
docker build -t portfolio:latest .

# 4. Apply Kubernetes manifests
echo "☸️  Applying manifests..."
kubectl apply -f k8s/deployment.yaml
kubectl apply -f k8s/service.yaml

# 5. Wait for deployment
echo "⏳ Waiting for pod to be ready..."
kubectl wait --for=condition=ready pod -l app=portfolio --timeout=60s || true

# 6. Port forward (background, persistent)
echo "🔌 Port forwarding to localhost:8080..."
pkill -f "kubectl port-forward svc/portfolio" || true
nohup kubectl port-forward svc/portfolio 8080:80 > port-forward.log 2>&1 &

echo ""
echo "✅ App running locally at http://localhost:8080"
echo ""

echo "🌍 Starting Cloudflare Tunnel (background)..."
pkill -f "cloudflared tunnel run" || true
# Using config file created at ~/.cloudflared/config.yml
nohup cloudflared tunnel run portfolio > cloudflared.log 2>&1 &

echo "🎉 Setup complete! The tunnel is running in the background."
echo "   Logs: port-forward.log, cloudflared.log"
echo "   You can now close this terminal."
echo "   To stop later, run: pkill -f cloudflared && pkill -f 'kubectl port-forward'"
