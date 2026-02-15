# Nishant Kumar - Portfolio Website 🚀

A modern, vibrant, and interactive portfolio website showcasing my skills as a Software & Cloud Engineer. Built with pure HTML, CSS, and JavaScript.

This project also serves as a **DevOps Learning Lab**, featuring a complete local Kubernetes setup with Minikube and Cloudflare Tunnel integration.

## ✨ Features

- **Responsive Design** - Fully responsive across all devices (mobile, tablet, desktop)
- **Dark/Light Mode** - Auto-detects system preference with manual toggle
- **Smooth Animations** - Intersection Observer for scroll-triggered animations
- **Interactive Components** - Typewriter effect, animated skill bars, 3D card tilts
- **Modular Architecture** - Clean, maintainable ES6 module structure
- **Vibrant Theme** - Sunset gradient color palette (coral → magenta → purple)

## 🎨 Design

- **Color Palette**: Coral (#FF6B6B), Magenta (#C44569), Purple (#6C5CE7), Lime Accent (#00D9A5)
- **Typography**: Modern sans-serif with gradient text effects
- **Effects**: Glassmorphism, floating shapes, hover animations

## 🛠️ Tech Stack

### Frontend
- **HTML5** - Semantic markup
- **CSS3** - Custom properties, Grid, Flexbox, animations
- **JavaScript (ES6)** - Modules, classes, async/await

### DevOps & Infrastructure
- **Docker** - Containerization (Alpine-based Nginx image)
- **Kubernetes (K8s)** - Orchestration (Deployments, Services, Ingress)
- **Minikube** - Local K8s cluster environment
- **Cloudflare Tunnel** - Secure public exposure without port forwarding

## 📁 Project Structure

```
Portfolio Website/
├── k8s/                  # Kubernetes Manifests
│   ├── deployment.yaml   # App deployment configuration
│   ├── service.yaml      # Service exposure
│   ├── ingress.yaml      # Ingress rules (Cloudflare/Nginx)
│   └── cluster-issuer.yaml # TLS Cert Manager config
├── start-local.sh        # ✨ One-click local K8s deploy script
├── deploy.sh             # Production deployment script
├── Dockerfile            # Container definition
├── nginx.conf            # Nginx server configuration
├── index.html            # Main HTML file
└── css/, js/, data/      # Frontend source code
```

## 🚀 Getting Started

### Option 1: Quick Look (Frontend Only)
Since this is a static site, you can view it immediately without any tools:

```bash
# Clone the repo
git clone https://github.com/nishantdeploys/Portfolio.git
cd Portfolio

# Open directly in browser
open index.html

# OR run a simple local server
python3 -m http.server 8000
```

---

### Option 2: The DevOps Way (Local Kubernetes) 🐳☸️
This project includes a script to spin up a full local Kubernetes environment using Minikube. This is great for learning how K8s works!

**Prerequisites:** 
- [Docker](https://docs.docker.com/get-docker/)
- [Minikube](https://minikube.sigs.k8s.io/docs/start/)
- [kubectl](https://kubernetes.io/docs/tasks/tools/)

**Step-by-step:**

1.  **Run the automated script**:
    ```bash
    chmod +x start-local.sh
    ./start-local.sh
    ```
    This script will:
    - Start Minikube (if not running)
    - Build the Docker image *inside* Minikube (no registry push needed)
    - Apply all Kubernetes manifests
    - Port-forward the app to `localhost:8080`

2.  **View your app**:
    Open [http://localhost:8080](http://localhost:8080)

---

### Option 3: Expose to the World (Cloudflare Tunnel) 🌍
Want to show your local running app to a friend? Use Cloudflare Tunnel.

1.  **Install Cloudflared**:
    ```bash
    # Linux (Arch)
    sudo pacman -S cloudflared
    # macOS
    brew install cloudflared
    # Windows
    winget install Cloudflare.cloudflared
    ```

2.  **Login & Create Tunnel**:
    ```bash
    cloudflared tunnel login
    cloudflared tunnel create portfolio
    ```

3.  **Route DNS (if you have a domain like nishxnt.codes)**:
    ```bash
    cloudflared tunnel route dns portfolio nishxnt.codes
    ```

4.  **Start the Tunnel**:
    ```bash
    cloudflared tunnel run --url http://localhost:8080 portfolio
    ```
    
    *Now your local Minikube cluster is accessible globally via SSL!*

## 📝 Customization

All content is centralized in `data/content.json`. Update this file to customize:
- Skills & proficiency levels
- Projects & descriptions
- Experience timeline
- Education history
- Achievements & certifications
- Contact information

## 📧 Contact

- **Email**: nishant098097@gmail.com
- **Phone**: +91 7480985252
- **GitHub**: [@nishantdeploys](https://github.com/nishantdeploys)
- **LinkedIn**: [Nishant Kumar](https://www.linkedin.com/in/nishxnt/)

## 📄 License

This project is open source and available under the [MIT License](LICENSE).

---

**Built with ❤️ using HTML, CSS, JavaScript & Kubernetes**
