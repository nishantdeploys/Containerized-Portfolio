# Containerized Portfolio

Interactive portfolio website with a static frontend (HTML/CSS/JS) and DevOps workflow (Docker, Kubernetes, Minikube, optional Cloudflare Tunnel).

Repository: https://github.com/nishantdeploys/Containerized-Portfolio

## What This Project Includes

- Responsive single-page portfolio UI
- Animated sections (skills, cards, timeline, hero effects)
- Docker image packaging with Nginx
- Local Kubernetes deployment via Minikube
- Optional Cloudflare Tunnel exposure

## Project Structure

```text
Containerized-Portfolio/
├── css/
├── data/
├── js/
├── k8s/
├── Dockerfile
├── nginx.conf
├── index.html
├── start-local.sh
├── stop-local.sh
└── deploy.sh
```

## Prerequisites

Local run (Kubernetes path):

- Docker
- Minikube
- kubectl

Optional public tunnel:

- cloudflared
- Existing Cloudflare tunnel config at `~/.cloudflared/config.yml`

Production-style deploy (push image + apply manifests):

- Docker Hub login (`docker login`)
- Valid kubectl context for your target cluster

## Quick Start (Recommended)

```bash
git clone https://github.com/nishantdeploys/Containerized-Portfolio.git
cd Containerized-Portfolio
chmod +x start-local.sh stop-local.sh deploy.sh
./start-local.sh
```

Open:

- Local app: http://localhost:8080

Stop background forwarding/tunnel later:

```bash
./stop-local.sh
```

## Script Behavior

### start-local.sh

What it does:

1. Starts Minikube if needed
2. Builds a fresh image with a unique local tag (`portfolio:local-<timestamp>`)
3. Applies Kubernetes manifests
4. Updates deployment image and waits for rollout
5. Starts `kubectl port-forward` to `localhost:8080`
6. Starts Cloudflare tunnel only when available/configured

Tunnel control:

- `ENABLE_TUNNEL=auto` (default): starts tunnel only if cloudflared and config are present
- `ENABLE_TUNNEL=true`: requires tunnel setup; fails if missing
- `ENABLE_TUNNEL=false`: always skip tunnel

Examples:

```bash
./start-local.sh
ENABLE_TUNNEL=false ./start-local.sh
ENABLE_TUNNEL=true ./start-local.sh
```

### deploy.sh

What it does:

1. Builds Docker image with timestamp tag
2. Pushes to Docker Hub
3. Applies Kubernetes manifests
4. Updates deployment image to pushed tag
5. Waits for rollout

Important behavior:

- If `DOCKER_USER` is not set, it auto-detects your Docker Hub username from your login
- If your kubectl context is `minikube`, it warns that this is local, not necessarily your public live origin
- Skips `k8s/cluster-issuer.yaml` if cert-manager CRD is not installed

Examples:

```bash
./deploy.sh
./deploy.sh v1.2.0
DOCKER_USER=mydockerhubuser ./deploy.sh
```

## Troubleshooting

### I deployed, but my domain still shows old content

Common causes:

- Cloudflare tunnel is down
- Domain points to a different origin than current kubectl context
- Browser/CDN cache still serving old asset URLs

Checks:

```bash
kubectl config current-context
tail -n 50 cloudflared.log
tail -n 50 port-forward.log
```

Fix flow:

1. Run `./start-local.sh` again
2. Hard-refresh browser (Ctrl+Shift+R)
3. Verify domain responds with expected `main.js?v=...` marker

### Docker push fails with insufficient_scope

You are logged in as a user that cannot push to the target repo namespace.

Fix:

```bash
docker login
DOCKER_USER=<your-dockerhub-username> ./deploy.sh
```

### cluster-issuer apply error

If cert-manager is not installed, `deploy.sh` skips cluster issuer automatically. This is expected.

## Customization

Edit content in `data/content.json` to update:

- Skills
- Projects
- Experience
- Education
- Achievements
- Contact info

## Contact

- Email: nishant098097@gmail.com
- GitHub: https://github.com/nishantdeploys
- LinkedIn: https://www.linkedin.com/in/nishxnt/
