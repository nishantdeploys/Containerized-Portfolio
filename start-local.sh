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

# 6. Port forward (background)
echo "🔌 Port forwarding to localhost:8080..."
pkill -f "kubectl port-forward svc/portfolio" || true
kubectl port-forward svc/portfolio 8080:80 > /dev/null 2>&1 &

echo ""
echo "✅ App running locally at http://localhost:8080"
echo ""
echo "🌍 To expose on nishxnt.codes (Cloudflare Tunnel):"
echo "   1. cloudflared tunnel login"
echo "   2. cloudflared tunnel create portfolio"
echo "   3. cloudflared tunnel route dns portfolio nishxnt.codes"
echo "   4. cloudflared tunnel run --url http://localhost:8080 portfolio"
