/**
 * Canvas-based meteor shower background.
 */
export default class MeteorShower {
    constructor(canvasId) {
        this.canvas = document.getElementById(canvasId);
        this.ctx = this.canvas ? this.canvas.getContext('2d') : null;

        this.width = 0;
        this.height = 0;
        this.dpr = 1;

        this.meteors = [];
        this.stars = [];
        this.starCount = 120;

        // Around 35 degrees from left to right, slanting downward.
        this.angle = (35 * Math.PI) / 180;
        this.dirX = Math.cos(this.angle);
        this.dirY = Math.sin(this.angle);

        this.spawnIntervalMs = 700;
        this.lastSpawnTime = 0;

        this.animationFrameId = null;
        this.initialized = false;

        this.handleResize = this.handleResize.bind(this);
        this.animate = this.animate.bind(this);
    }

    init() {
        if (!this.canvas || !this.ctx || this.initialized) {
            return;
        }

        this.initialized = true;
        this.handleResize();
        window.addEventListener('resize', this.handleResize);

        this.startInitialBurst();
        this.animationFrameId = requestAnimationFrame(this.animate);
    }

    handleResize() {
        this.dpr = Math.min(window.devicePixelRatio || 1, 2);
        this.width = window.innerWidth;
        this.height = window.innerHeight;

        this.canvas.width = Math.floor(this.width * this.dpr);
        this.canvas.height = Math.floor(this.height * this.dpr);

        this.canvas.style.width = `${this.width}px`;
        this.canvas.style.height = `${this.height}px`;

        this.ctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
        this.generateStars();
    }

    generateStars() {
        this.stars = Array.from({ length: this.starCount }, () => ({
            x: Math.random() * this.width,
            y: Math.random() * this.height,
            radius: Math.random() * 1.4 + 0.3,
            alpha: Math.random() * 0.65 + 0.2
        }));
    }

    startInitialBurst() {
        for (let i = 0; i < 5; i += 1) {
            setTimeout(() => {
                this.meteors.push(this.createMeteor());
            }, i * 300);
        }
    }

    createMeteor() {
        const speed = this.randomBetween(3, 7);
        const trailLength = this.randomBetween(60, 140);

        return {
            x: Math.random() * this.width,
            y: -this.randomBetween(20, 180),
            speed,
            trailLength,
            headRadius: this.randomBetween(1.6, 2.8)
        };
    }

    animate(timestamp) {
        if (!this.ctx) {
            return;
        }

        this.ctx.clearRect(0, 0, this.width, this.height);

        this.drawStars();

        if (!this.lastSpawnTime) {
            this.lastSpawnTime = timestamp;
        }

        if (timestamp - this.lastSpawnTime >= this.spawnIntervalMs) {
            this.meteors.push(this.createMeteor());
            this.lastSpawnTime = timestamp;
        }

        this.updateAndDrawMeteors();

        this.animationFrameId = requestAnimationFrame(this.animate);
    }

    drawStars() {
        for (let i = 0; i < this.stars.length; i += 1) {
            const star = this.stars[i];
            this.ctx.beginPath();
            this.ctx.arc(star.x, star.y, star.radius, 0, Math.PI * 2);
            this.ctx.fillStyle = `rgba(255, 255, 255, ${star.alpha})`;
            this.ctx.fill();
        }
    }

    updateAndDrawMeteors() {
        for (let i = this.meteors.length - 1; i >= 0; i -= 1) {
            const meteor = this.meteors[i];
            meteor.x += meteor.speed * this.dirX;
            meteor.y += meteor.speed * this.dirY;

            this.drawMeteor(meteor);

            const offScreen =
                meteor.x - meteor.trailLength > this.width ||
                meteor.y - meteor.trailLength > this.height;

            if (offScreen) {
                this.meteors.splice(i, 1);
            }
        }
    }

    drawMeteor(meteor) {
        const tailX = meteor.x - this.dirX * meteor.trailLength;
        const tailY = meteor.y - this.dirY * meteor.trailLength;

        const gradient = this.ctx.createLinearGradient(tailX, tailY, meteor.x, meteor.y);
        gradient.addColorStop(0, 'rgba(255, 255, 255, 0)');
        gradient.addColorStop(0.6, 'rgba(255, 255, 255, 0.35)');
        gradient.addColorStop(1, 'rgba(255, 255, 255, 0.95)');

        this.ctx.strokeStyle = gradient;
        this.ctx.lineWidth = 1.2;
        this.ctx.lineCap = 'round';

        this.ctx.beginPath();
        this.ctx.moveTo(tailX, tailY);
        this.ctx.lineTo(meteor.x, meteor.y);
        this.ctx.stroke();

        this.ctx.beginPath();
        this.ctx.arc(meteor.x, meteor.y, meteor.headRadius, 0, Math.PI * 2);
        this.ctx.fillStyle = 'rgba(255, 255, 255, 0.95)';
        this.ctx.shadowBlur = 10;
        this.ctx.shadowColor = 'rgba(255, 255, 255, 0.95)';
        this.ctx.fill();
        this.ctx.shadowBlur = 0;
    }

    randomBetween(min, max) {
        return Math.random() * (max - min) + min;
    }
}
