const ParticleSystem = (() => {
    let particleAnimationId = null;

    const start = (enabled, themeColor) => {
        const canvasId = 'particles-canvas';
        let canvas = document.getElementById(canvasId);

        if (!enabled) {
            if (canvas) {
                canvas.classList.remove('active');
                setTimeout(() => canvas.remove(), 1000); // Remove after fade out
            }
            if (particleAnimationId) cancelAnimationFrame(particleAnimationId);
            return;
        }

        if (!canvas) {
            canvas = document.createElement('canvas');
            canvas.id = canvasId;
            document.body.appendChild(canvas);
        }

        const ctx = canvas.getContext('2d');
        let particles = [];

        const resize = () => {
            canvas.width = window.innerWidth;
            canvas.height = window.innerHeight;
        };
        window.addEventListener('resize', resize);
        resize();

        const particleCount = 50;
        const color = themeColor || '#00f3ff';

        class Particle {
            constructor() {
                this.x = Math.random() * canvas.width;
                this.y = Math.random() * canvas.height;
                this.size = Math.random() * 2 + 0.5;
                this.speedX = Math.random() * 0.5 - 0.25;
                this.speedY = Math.random() * 0.5 - 0.25;
                this.alpha = Math.random();
            }
            update() {
                this.x += this.speedX;
                this.y += this.speedY;
                if (this.x > canvas.width) this.x = 0;
                if (this.x < 0) this.x = canvas.width;
                if (this.y > canvas.height) this.y = 0;
                if (this.y < 0) this.y = canvas.height;
            }
            draw() {
                ctx.globalAlpha = this.alpha;
                ctx.fillStyle = color;
                ctx.beginPath();
                ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
                ctx.fill();
            }
        }

        for (let i = 0; i < particleCount; i++) particles.push(new Particle());

        const animate = () => {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            particles.forEach(p => {
                p.update();
                p.draw();
            });
            particleAnimationId = requestAnimationFrame(animate);
        };

        canvas.classList.add('active');
        animate();
    };

    const stop = () => start(false);

    return { start, stop };
})();
