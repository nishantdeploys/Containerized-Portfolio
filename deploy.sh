#!/usr/bin/env bash
set -euo pipefail

# ──────────────────────────────────────────────
# Portfolio – Build, Push & Deploy
# ──────────────────────────────────────────────

DOCKER_USER="nishantdeploys"
IMAGE_NAME="portfolio"
TAG="${1:-latest}"
FULL_IMAGE="${DOCKER_USER}/${IMAGE_NAME}:${TAG}"

echo "──────────────────────────────────────"
echo "  Building image: ${FULL_IMAGE}"
echo "──────────────────────────────────────"
docker build -t "${FULL_IMAGE}" .

echo ""
echo "──────────────────────────────────────"
echo "  Pushing image to Docker Hub"
echo "──────────────────────────────────────"
docker push "${FULL_IMAGE}"

echo ""
echo "──────────────────────────────────────"
echo "  Deploying to Kubernetes"
echo "──────────────────────────────────────"

# Update image tag in deployment on-the-fly
kubectl apply -f k8s/cluster-issuer.yaml
kubectl apply -f k8s/deployment.yaml
kubectl apply -f k8s/service.yaml
kubectl apply -f k8s/ingress.yaml

# Set the pushed image on the deployment
kubectl set image deployment/portfolio portfolio="${FULL_IMAGE}"

echo ""
echo "──────────────────────────────────────"
echo "  Waiting for rollout..."
echo "──────────────────────────────────────"
kubectl rollout status deployment/portfolio --timeout=120s

echo ""
echo "✅ Deployed ${FULL_IMAGE} successfully!"
echo "   https://nishxnt.codes"
