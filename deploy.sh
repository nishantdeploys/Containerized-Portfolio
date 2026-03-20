#!/usr/bin/env bash
set -euo pipefail

# ──────────────────────────────────────────────
# Portfolio – Build, Push & Deploy
# ──────────────────────────────────────────────

DEFAULT_DOCKER_USER="nishantdeploys"
IMAGE_NAME="portfolio"
TAG="${1:-$(date +%Y%m%d%H%M%S)}"

require_cmd() {
  command -v "$1" >/dev/null 2>&1 || {
    echo "❌ Missing required command: $1"
    exit 1
  }
}

require_cmd docker
require_cmd kubectl

DOCKER_CONFIG_FILE="${DOCKER_CONFIG:-$HOME/.docker}/config.json"

if [[ ! -f "${DOCKER_CONFIG_FILE}" ]]; then
  echo "❌ Docker config not found at ${DOCKER_CONFIG_FILE}."
  echo "   Run: docker login"
  exit 1
fi

if ! grep -q 'index.docker.io/v1/\|credsStore\|credHelpers' "${DOCKER_CONFIG_FILE}"; then
  echo "❌ Docker Hub login not found in ${DOCKER_CONFIG_FILE}."
  echo "   Run: docker login"
  exit 1
fi

DOCKER_LOGGED_IN_USER=""
DOCKER_AUTH_B64="$(grep -A3 'https://index.docker.io/v1/' "${DOCKER_CONFIG_FILE}" | grep '"auth"' | head -n1 | sed -E 's/.*"auth"[[:space:]]*:[[:space:]]*"([^"]+)".*/\1/' || true)"

if [[ -n "${DOCKER_AUTH_B64}" ]]; then
  DOCKER_LOGGED_IN_USER="$(printf '%s' "${DOCKER_AUTH_B64}" | base64 --decode 2>/dev/null | cut -d: -f1 || true)"
fi

if [[ -z "${DOCKER_LOGGED_IN_USER}" ]]; then
  DOCKER_LOGGED_IN_USER="$(docker info 2>/dev/null | sed -n 's/^ Username: //p' | head -n1 | tr -d '[:space:]' || true)"
fi

if [[ -z "${DOCKER_USER:-}" ]]; then
  if [[ -n "${DOCKER_LOGGED_IN_USER}" ]]; then
    DOCKER_USER="${DOCKER_LOGGED_IN_USER}"
  else
    DOCKER_USER="${DEFAULT_DOCKER_USER}"
  fi
fi

FULL_IMAGE="${DOCKER_USER}/${IMAGE_NAME}:${TAG}"

if [[ -n "${DOCKER_LOGGED_IN_USER}" && "${DOCKER_LOGGED_IN_USER}" != "${DOCKER_USER}" ]]; then
  echo "⚠️  Logged in as '${DOCKER_LOGGED_IN_USER}', pushing to '${DOCKER_USER}'."
  echo "   If push is denied, run: DOCKER_USER=${DOCKER_LOGGED_IN_USER} ./deploy.sh ${TAG}"
fi

kubectl cluster-info >/dev/null 2>&1 || {
  echo "❌ kubectl cannot reach a Kubernetes cluster/context."
  echo "   Check: kubectl config current-context"
  exit 1
}

KUBE_CONTEXT="$(kubectl config current-context 2>/dev/null || true)"
if [[ "${KUBE_CONTEXT}" == "minikube" ]]; then
  echo "⚠️  Current context is 'minikube' (local cluster)."
  echo "   This deploy updates local Kubernetes, not necessarily the live origin behind nishxnt.codes."
fi

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

# Apply ClusterIssuer only when cert-manager CRD exists
if kubectl get crd clusterissuers.cert-manager.io >/dev/null 2>&1; then
  kubectl apply -f k8s/cluster-issuer.yaml
else
  echo "ℹ️  cert-manager CRD not found; skipping k8s/cluster-issuer.yaml"
fi

# Update image tag in deployment on-the-fly
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
