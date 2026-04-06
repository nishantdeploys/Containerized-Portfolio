# Containerized Portfolio

Production-grade portfolio website: static frontend (HTML/CSS/JS) served via Nginx, containerized with Docker, orchestrated on K3s (lightweight Kubernetes) on a single AWS EC2 instance, with automated CI/CD via GitHub Actions.

**Live:** https://nishxnt.codes
**Repo:** https://github.com/nishantdeploys/Containerized-Portfolio

## Architecture

```text
GitHub (push to main)
    │
    ▼
GitHub Actions ──► Docker Hub (nishantdeploys/portfolio:<sha>)
    │
    ▼ SSH
EC2 (t2.micro, Ubuntu)
    │
    ├─ K3s (lightweight Kubernetes)
    │   ├─ Nginx Ingress Controller
    │   ├─ cert-manager (Let's Encrypt HTTPS)
    │   └─ Portfolio Deployment + Service
    │
    ▼
nishxnt.codes ◄── DNS A Record ──► EC2 Elastic IP
```

## Project Structure

```text
Containerized-Portfolio/
├── .github/workflows/
│   └── deploy.yml          # CI/CD pipeline
├── css/
├── data/
├── js/
├── k8s/
│   ├── deployment.yaml     # Pod spec (1 replica, health probes)
│   ├── service.yaml        # ClusterIP service
│   ├── ingress.yaml        # Nginx Ingress + TLS
│   └── cluster-issuer.yaml # Let's Encrypt ClusterIssuer
├── Dockerfile              # nginx:1.27-alpine based
├── nginx.conf
├── index.html
├── deploy.sh               # Manual deploy script
├── start-local.sh          # Local Minikube dev
└── stop-local.sh
```

---

# Production Deployment Guide

Complete step-by-step instructions to deploy on AWS EC2.

## Step 1: Launch EC2 Instance

1. Go to **AWS Console → EC2 → Launch Instance**
2. Settings:
   - **AMI:** Ubuntu 24.04 LTS (free tier eligible)
   - **Instance type:** t2.micro
   - **Key pair:** Create a new key pair (e.g., `portfolio-key`), download the `.pem` file
   - **Security Group** — allow these inbound rules:

     | Type  | Port | Source    |
     |-------|------|-----------|
     | SSH   | 22   | Your IP   |
     | HTTP  | 80   | 0.0.0.0/0 |
     | HTTPS | 443  | 0.0.0.0/0 |

3. Launch the instance

4. **Allocate an Elastic IP** (critical — prevents IP change on reboot):
   ```
   AWS Console → EC2 → Elastic IPs → Allocate → Associate with your instance
   ```
   Note down your Elastic IP address (e.g., `3.110.xx.xx`).

## Step 2: SSH into EC2

```bash
chmod 400 portfolio-key.pem
ssh -i portfolio-key.pem ubuntu@<YOUR_ELASTIC_IP>
```

## Step 3: Install K3s

K3s is installed **without Traefik** (we use Nginx Ingress instead):

```bash
curl -sfL https://get.k3s.io | INSTALL_K3S_EXEC="--disable traefik" sh -
```

Configure kubectl to work without sudo:

```bash
mkdir -p ~/.kube
sudo cp /etc/rancher/k3s/k3s.yaml ~/.kube/config
sudo chown $(id -u):$(id -g) ~/.kube/config
export KUBECONFIG=~/.kube/config
echo 'export KUBECONFIG=~/.kube/config' >> ~/.bashrc
```

Verify:

```bash
kubectl get nodes
# Should output: your-node   Ready   control-plane,master   ...
```

## Step 4: Install Nginx Ingress Controller

```bash
kubectl apply -f https://raw.githubusercontent.com/kubernetes/ingress-nginx/controller-v1.12.0/deploy/static/provider/cloud/deploy.yaml
```

K3s needs the Ingress controller to use host ports (since there's no cloud load balancer). Patch it:

```bash
kubectl -n ingress-nginx patch deployment ingress-nginx-controller \
  --type=json \
  -p='[
    {"op":"add","path":"/spec/template/spec/hostNetwork","value":true},
    {"op":"replace","path":"/spec/template/spec/containers/0/ports","value":[
      {"containerPort":80,"hostPort":80,"protocol":"TCP"},
      {"containerPort":443,"hostPort":443,"protocol":"TCP"}
    ]}
  ]'
```

Wait for it to become ready:

```bash
kubectl -n ingress-nginx rollout status deployment/ingress-nginx-controller --timeout=120s
```

Verify:

```bash
kubectl -n ingress-nginx get pods
# Should show ingress-nginx-controller   Running
```

## Step 5: Install cert-manager (HTTPS)

```bash
kubectl apply -f https://github.com/cert-manager/cert-manager/releases/download/v1.17.1/cert-manager.yaml
```

Wait for cert-manager pods to be ready:

```bash
kubectl -n cert-manager rollout status deployment/cert-manager --timeout=120s
kubectl -n cert-manager rollout status deployment/cert-manager-webhook --timeout=120s
kubectl -n cert-manager rollout status deployment/cert-manager-cainjector --timeout=120s
```

## Step 6: Deploy the Application

Clone the repo on the EC2 instance:

```bash
cd ~
git clone https://github.com/nishantdeploys/Containerized-Portfolio.git
cd Containerized-Portfolio
```

Apply all manifests:

```bash
kubectl apply -f k8s/cluster-issuer.yaml
kubectl apply -f k8s/deployment.yaml
kubectl apply -f k8s/service.yaml
kubectl apply -f k8s/ingress.yaml
```

Verify:

```bash
kubectl get pods
# portfolio-xxxxx   1/1   Running

kubectl get ingress
# portfolio-ingress   nginx   nishxnt.codes   ...

kubectl get certificate
# portfolio-tls   True   (may take 1-2 minutes)
```

## Step 7: Configure DNS

Go to your domain registrar (wherever you bought `nishxnt.codes`) and create:

| Type | Host | Value            | TTL  |
|------|------|------------------|------|
| A    | @    | YOUR_ELASTIC_IP  | 300  |

If you also want `www.nishxnt.codes`:

| Type  | Host | Value         | TTL  |
|-------|------|---------------|------|
| CNAME | www  | nishxnt.codes | 300  |

**Remove any existing Cloudflare tunnel DNS records** (CNAME pointing to `*.cfargotunnel.com`).

DNS propagation takes 5–30 minutes. Test with:

```bash
dig nishxnt.codes +short
# Should return your Elastic IP
```

## Step 8: Set Up GitHub Actions Secrets

Go to **GitHub → Repository → Settings → Secrets and variables → Actions** and add:

| Secret Name      | Value                                    |
|------------------|------------------------------------------|
| `DOCKER_USERNAME`| `nishantdeploys`                         |
| `DOCKER_PASSWORD`| Docker Hub access token (Settings → Security → New Access Token) |
| `EC2_HOST`       | Your Elastic IP address                  |
| `EC2_SSH_KEY`    | Entire contents of `portfolio-key.pem`   |

**Important:** For `EC2_SSH_KEY`, copy the ENTIRE `.pem` file content including `-----BEGIN RSA PRIVATE KEY-----` and `-----END RSA PRIVATE KEY-----` lines.

## Step 9: Test the Pipeline

Push any commit to `main`:

```bash
git add .
git commit -m "ci: add GitHub Actions deploy pipeline"
git push origin main
```

Monitor at: `https://github.com/nishantdeploys/Containerized-Portfolio/actions`

The workflow will:
1. Build Docker image tagged with commit SHA
2. Push to Docker Hub
3. SSH into EC2
4. Run `kubectl set image` to trigger rolling update
5. Wait for rollout to complete

---

## Verification Checklist

Run on EC2 after full setup:

```bash
# Cluster health
kubectl get nodes                  # Ready
kubectl get pods -A                # All Running

# Application
kubectl get pods                   # portfolio pod Running
kubectl get svc                    # portfolio ClusterIP :80
kubectl get ingress                # nishxnt.codes assigned
kubectl get certificate            # portfolio-tls True

# Quick test
curl -I https://nishxnt.codes      # HTTP/2 200
```

---

## Troubleshooting

### Certificate not issuing (stuck at False)

```bash
# Check certificate status
kubectl describe certificate portfolio-tls

# Check cert-manager logs
kubectl -n cert-manager logs deployment/cert-manager

# Check challenge status
kubectl get challenges
kubectl describe challenge <name>
```

Common fix: DNS hasn't propagated yet. Wait and retry.

### Pods stuck in ImagePullBackOff

```bash
kubectl describe pod <pod-name>
```

The image might not exist on Docker Hub. Verify:

```bash
docker pull nishantdeploys/portfolio:latest
```

### SSH connection refused (GitHub Actions)

- Verify EC2 security group allows port 22 from `0.0.0.0/0` (GitHub Actions IPs vary)
- Verify `EC2_SSH_KEY` secret contains the complete PEM key
- Verify `EC2_HOST` is the Elastic IP (not the old instance IP)

### Ingress not routing traffic

```bash
# Check ingress controller is running
kubectl -n ingress-nginx get pods

# Check ingress controller logs
kubectl -n ingress-nginx logs deployment/ingress-nginx-controller

# Verify hostNetwork is active
kubectl -n ingress-nginx get pod -o jsonpath='{.items[0].spec.hostNetwork}'
# Should output: true
```

### kubectl requires sudo

```bash
sudo cp /etc/rancher/k3s/k3s.yaml ~/.kube/config
sudo chown $(id -u):$(id -g) ~/.kube/config
export KUBECONFIG=~/.kube/config
```

---

## Local Development

For local development using Minikube:

```bash
chmod +x start-local.sh stop-local.sh
./start-local.sh          # Starts Minikube + deploys + port-forwards to localhost:8080
./stop-local.sh           # Stops port-forward and tunnel
```

## Manual Deploy (via deploy.sh)

```bash
./deploy.sh               # Build, push, deploy with timestamp tag
./deploy.sh v1.2.0        # Custom tag
```

## Customization

Edit `data/content.json` to update: Skills, Projects, Experience, Education, Achievements, Contact info.

## Contact

- Email: nishant098097@gmail.com
- GitHub: https://github.com/nishantdeploys
- LinkedIn: https://www.linkedin.com/in/nishxnt/
