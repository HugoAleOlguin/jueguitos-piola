// ============================================================================
// 🎂 TEMA DE ANIVERSARIO - 1 AÑO DE JUEGUITOS PIOLA
// ============================================================================
//
// Fecha de nacimiento: 25 de enero de 2025
// Para desactivar: cambiar ANNIVERSARY_ENABLED a false
//
// ============================================================================

(function () {
    // ===== CONFIGURACIÓN =====
    const ANNIVERSARY_ENABLED = true;  // Cambiar a false para desactivar todo
    const BIRTHDAY = new Date('2025-01-25');
    const YEARS_CELEBRATING = 1;

    if (!ANNIVERSARY_ENABLED) return;

    // =========================================================================
    // PARTÍCULAS PREMIUM
    // =========================================================================

    const particleColors = [
        '#00f3ff', '#bc13fe', '#ff007f', '#00ff88',
        '#ffd700', '#ff6b6b', '#a855f7', '#22d3ee'
    ];

    let particleCanvas = null;
    let particleCtx = null;
    let particles = [];
    let animationId = null;

    class Particle {
        constructor() {
            this.reset();
        }

        reset() {
            this.x = Math.random() * window.innerWidth;
            this.y = -20;
            this.size = Math.random() * 8 + 3;
            this.speedY = Math.random() * 2 + 1;
            this.speedX = Math.random() * 2 - 1;
            this.rotation = Math.random() * 360;
            this.rotationSpeed = Math.random() * 10 - 5;
            this.color = particleColors[Math.floor(Math.random() * particleColors.length)];
            this.opacity = Math.random() * 0.7 + 0.3;
            this.shape = Math.random() > 0.5 ? 'circle' : 'square';
            this.wobble = Math.random() * Math.PI * 2;
            this.wobbleSpeed = Math.random() * 0.1;
        }

        update() {
            this.y += this.speedY;
            this.wobble += this.wobbleSpeed;
            this.x += this.speedX + Math.sin(this.wobble) * 0.5;
            this.rotation += this.rotationSpeed;

            if (this.y > window.innerHeight + 20) {
                this.reset();
            }
        }

        draw(ctx) {
            ctx.save();
            ctx.translate(this.x, this.y);
            ctx.rotate(this.rotation * Math.PI / 180);
            ctx.globalAlpha = this.opacity;
            ctx.fillStyle = this.color;
            ctx.shadowColor = this.color;
            ctx.shadowBlur = 10;

            if (this.shape === 'circle') {
                ctx.beginPath();
                ctx.arc(0, 0, this.size / 2, 0, Math.PI * 2);
                ctx.fill();
            } else {
                ctx.fillRect(-this.size / 2, -this.size / 2, this.size, this.size);
            }

            ctx.restore();
        }
    }

    function initParticleSystem() {
        particleCanvas = document.createElement('canvas');
        particleCanvas.id = 'anniversary-particles';
        particleCanvas.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            pointer-events: none;
            z-index: 9998;
        `;
        document.body.appendChild(particleCanvas);
        particleCtx = particleCanvas.getContext('2d');

        resizeCanvas();
        window.addEventListener('resize', resizeCanvas);

        // Crear partículas iniciales
        for (let i = 0; i < 50; i++) {
            const p = new Particle();
            p.y = Math.random() * window.innerHeight; // Distribuir en pantalla
            particles.push(p);
        }

        animateParticles();

        // Detener después de 15 segundos
        setTimeout(() => {
            if (animationId) {
                cancelAnimationFrame(animationId);
                particleCanvas.style.transition = 'opacity 1s ease';
                particleCanvas.style.opacity = '0';
                setTimeout(() => particleCanvas.remove(), 1000);
            }
        }, 15000);
    }

    function resizeCanvas() {
        if (particleCanvas) {
            particleCanvas.width = window.innerWidth;
            particleCanvas.height = window.innerHeight;
        }
    }

    function animateParticles() {
        particleCtx.clearRect(0, 0, particleCanvas.width, particleCanvas.height);

        particles.forEach(p => {
            p.update();
            p.draw(particleCtx);
        });

        animationId = requestAnimationFrame(animateParticles);
    }

    // Pausar animación cuando la tab no está visible (ahorra CPU)
    document.addEventListener('visibilitychange', () => {
        if (document.hidden && animationId) {
            cancelAnimationFrame(animationId);
            animationId = null;
        } else if (!document.hidden && particleCanvas && !animationId) {
            animateParticles();
        }
    });

    // =========================================================================
    // BANNER PREMIUM DE ANIVERSARIO
    // =========================================================================

    function createBanner() {
        const banner = document.createElement('div');
        banner.id = 'anniversary-banner';
        banner.innerHTML = `
            <div class="anniversary-glow"></div>
            <div class="anniversary-inner">
                <div class="anniversary-badge">
                    <span class="badge-number">1</span>
                    <span class="badge-text">AÑO</span>
                </div>
                <div class="anniversary-info">
                    <div class="anniversary-title">
                        <span class="title-icon">🎉</span>
                        ¡Feliz Aniversario!
                        <span class="title-icon">🎉</span>
                    </div>
                    <div class="anniversary-subtitle">
                        Jueguitos Piola cumple <strong>1 añito</strong> el 25 de enero
                    </div>
                </div>
                <button class="anniversary-close" title="Cerrar">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M18 6L6 18M6 6l12 12"/>
                    </svg>
                </button>
            </div>
            <div class="anniversary-shimmer"></div>
        `;

        document.body.appendChild(banner);

        // Animación de entrada
        requestAnimationFrame(() => {
            banner.classList.add('show');
        });

        // Botón cerrar
        banner.querySelector('.anniversary-close').addEventListener('click', (e) => {
            e.stopPropagation();
            banner.classList.remove('show');
            banner.classList.add('hide');
            setTimeout(() => banner.remove(), 500);
            sessionStorage.setItem('anniversaryBannerClosed', 'true');
        });
    }

    // =========================================================================
    // EFECTO ESPECIAL EN EL LOGO
    // =========================================================================

    function enhanceLogo() {
        const logo = document.querySelector('.logo');
        if (!logo) return;

        logo.classList.add('anniversary-logo');

        // Corona o gorrito
        const crown = document.createElement('div');
        crown.className = 'logo-crown';
        crown.innerHTML = '👑';
        logo.style.position = 'relative';
        logo.appendChild(crown);

        // Partículas alrededor del logo
        const sparkles = document.createElement('div');
        sparkles.className = 'logo-sparkles';
        for (let i = 0; i < 5; i++) {
            const spark = document.createElement('span');
            spark.textContent = '✨';
            spark.style.animationDelay = `${i * 0.3}s`;
            sparkles.appendChild(spark);
        }
        logo.appendChild(sparkles);
    }

    // =========================================================================
    // CONTADOR PREMIUM
    // =========================================================================

    function createCountdown() {
        const today = new Date();
        const thisYearBirthday = new Date(today.getFullYear(), BIRTHDAY.getMonth(), BIRTHDAY.getDate());

        if (today > thisYearBirthday) {
            thisYearBirthday.setFullYear(thisYearBirthday.getFullYear() + 1);
        }

        const daysUntil = Math.ceil((thisYearBirthday - today) / (1000 * 60 * 60 * 24));

        const footer = document.querySelector('footer');
        if (!footer || daysUntil > 30) return;

        const countdown = document.createElement('div');
        countdown.className = 'anniversary-countdown';

        if (daysUntil === 0) {
            countdown.innerHTML = `
                <div class="countdown-celebration">
                    <span class="celebration-emoji">🎂</span>
                    <span class="celebration-text">¡HOY CUMPLIMOS 1 AÑO!</span>
                    <span class="celebration-emoji">🎂</span>
                </div>
            `;
            countdown.classList.add('is-today');
        } else {
            countdown.innerHTML = `
                <div class="countdown-content">
                    <div class="countdown-label">Aniversario en</div>
                    <div class="countdown-number">${daysUntil}</div>
                    <div class="countdown-unit">${daysUntil === 1 ? 'día' : 'días'}</div>
                </div>
                <div class="countdown-progress">
                    <div class="progress-bar" style="width: ${((30 - daysUntil) / 30) * 100}%"></div>
                </div>
            `;
        }

        footer.insertBefore(countdown, footer.firstChild);
    }

    // =========================================================================
    // EFECTO DE FONDO ESPECIAL
    // =========================================================================

    function createAmbientEffect() {
        const ambient = document.createElement('div');
        ambient.className = 'anniversary-ambient';
        ambient.innerHTML = `
            <div class="ambient-orb orb-1"></div>
            <div class="ambient-orb orb-2"></div>
            <div class="ambient-orb orb-3"></div>
        `;
        document.body.appendChild(ambient);
    }

    // =========================================================================
    // ESTILOS PREMIUM
    // =========================================================================

    function injectStyles() {
        const style = document.createElement('style');
        style.id = 'anniversary-styles';
        style.textContent = `
            /* ========== BANNER PREMIUM ========== */
            #anniversary-banner {
                position: fixed;
                top: 90px;
                right: 20px;
                background: linear-gradient(135deg, 
                    rgba(15, 15, 20, 0.95) 0%, 
                    rgba(25, 15, 35, 0.95) 100%);
                border: 1px solid transparent;
                border-radius: 16px;
                padding: 0;
                z-index: 9990;
                backdrop-filter: blur(20px);
                box-shadow: 
                    0 20px 60px rgba(0, 0, 0, 0.5),
                    0 0 40px rgba(188, 19, 254, 0.15),
                    inset 0 1px 0 rgba(255, 255, 255, 0.1);
                opacity: 0;
                transform: translateX(50px) scale(0.9);
                transition: all 0.5s cubic-bezier(0.34, 1.56, 0.64, 1);
                overflow: hidden;
                max-width: 320px;
            }
            
            #anniversary-banner.show {
                opacity: 1;
                transform: translateX(0) scale(1);
            }
            
            #anniversary-banner.hide {
                opacity: 0;
                transform: translateX(50px) scale(0.8);
            }
            
            .anniversary-glow {
                position: absolute;
                inset: -1px;
                border-radius: 16px;
                background: linear-gradient(135deg, #00f3ff, #bc13fe, #ff007f, #ffd700);
                background-size: 300% 300%;
                animation: glowRotate 4s ease infinite;
                z-index: -1;
                opacity: 0.8;
            }
            
            @keyframes glowRotate {
                0%, 100% { background-position: 0% 50%; }
                50% { background-position: 100% 50%; }
            }
            
            .anniversary-inner {
                display: flex;
                align-items: center;
                gap: 15px;
                padding: 16px 20px;
                background: linear-gradient(135deg, 
                    rgba(15, 15, 20, 0.98) 0%, 
                    rgba(25, 15, 35, 0.98) 100%);
                border-radius: 15px;
                position: relative;
            }
            
            .anniversary-badge {
                width: 50px;
                height: 50px;
                background: linear-gradient(135deg, #ffd700, #ffaa00);
                border-radius: 50%;
                display: flex;
                flex-direction: column;
                align-items: center;
                justify-content: center;
                box-shadow: 
                    0 4px 15px rgba(255, 215, 0, 0.4),
                    inset 0 2px 0 rgba(255, 255, 255, 0.3);
                flex-shrink: 0;
                animation: badgePulse 2s ease-in-out infinite;
            }
            
            @keyframes badgePulse {
                0%, 100% { transform: scale(1); box-shadow: 0 4px 15px rgba(255, 215, 0, 0.4); }
                50% { transform: scale(1.05); box-shadow: 0 6px 25px rgba(255, 215, 0, 0.6); }
            }
            
            .badge-number {
                font-size: 1.4rem;
                font-weight: 900;
                color: #1a1a2e;
                line-height: 1;
                text-shadow: 0 1px 0 rgba(255, 255, 255, 0.3);
            }
            
            .badge-text {
                font-size: 0.55rem;
                font-weight: 700;
                color: #1a1a2e;
                letter-spacing: 1px;
                margin-top: -2px;
            }
            
            .anniversary-info {
                flex: 1;
            }
            
            .anniversary-title {
                font-size: 1rem;
                font-weight: 700;
                color: #fff;
                margin-bottom: 4px;
                display: flex;
                align-items: center;
                gap: 6px;
            }
            
            .title-icon {
                font-size: 0.9rem;
                animation: iconBounce 1s ease-in-out infinite;
            }
            
            .title-icon:last-child {
                animation-delay: 0.5s;
            }
            
            @keyframes iconBounce {
                0%, 100% { transform: translateY(0) rotate(0deg); }
                25% { transform: translateY(-3px) rotate(-10deg); }
                75% { transform: translateY(-3px) rotate(10deg); }
            }
            
            .anniversary-subtitle {
                font-size: 0.8rem;
                color: #888;
                line-height: 1.3;
            }
            
            .anniversary-subtitle strong {
                color: var(--primary-color, #00f3ff);
            }
            
            .anniversary-close {
                position: absolute;
                top: 8px;
                right: 8px;
                background: rgba(255, 255, 255, 0.05);
                border: none;
                color: #666;
                width: 28px;
                height: 28px;
                border-radius: 8px;
                cursor: pointer;
                display: flex;
                align-items: center;
                justify-content: center;
                transition: all 0.2s ease;
            }
            
            .anniversary-close:hover {
                background: rgba(255, 255, 255, 0.1);
                color: #fff;
                transform: scale(1.1);
            }
            
            .anniversary-shimmer {
                position: absolute;
                top: 0;
                left: -100%;
                width: 100%;
                height: 100%;
                background: linear-gradient(90deg, 
                    transparent, 
                    rgba(255, 255, 255, 0.1), 
                    transparent);
                animation: shimmer 3s ease-in-out infinite;
                pointer-events: none;
            }
            
            @keyframes shimmer {
                0% { left: -100%; }
                50%, 100% { left: 100%; }
            }
            
            /* ========== LOGO MEJORADO ========== */
            .anniversary-logo {
                animation: logoGlow 3s ease-in-out infinite;
            }
            
            @keyframes logoGlow {
                0%, 100% { 
                    filter: drop-shadow(0 0 10px rgba(0, 243, 255, 0.3));
                }
                50% { 
                    filter: drop-shadow(0 0 20px rgba(188, 19, 254, 0.4));
                }
            }
            
            .logo-crown {
                position: absolute;
                top: -18px;
                left: 50%;
                transform: translateX(-50%);
                font-size: 1.3rem;
                animation: crownFloat 2s ease-in-out infinite;
                filter: drop-shadow(0 2px 4px rgba(255, 215, 0, 0.5));
            }
            
            @keyframes crownFloat {
                0%, 100% { transform: translateX(-50%) translateY(0) rotate(-5deg); }
                50% { transform: translateX(-50%) translateY(-5px) rotate(5deg); }
            }
            
            .logo-sparkles {
                position: absolute;
                top: -10px;
                left: -10px;
                right: -10px;
                bottom: -10px;
                pointer-events: none;
            }
            
            .logo-sparkles span {
                position: absolute;
                font-size: 0.8rem;
                animation: sparkle 2s ease-in-out infinite;
                opacity: 0;
            }
            
            .logo-sparkles span:nth-child(1) { top: 0; left: 10%; }
            .logo-sparkles span:nth-child(2) { top: 20%; right: 0; }
            .logo-sparkles span:nth-child(3) { bottom: 0; left: 30%; }
            .logo-sparkles span:nth-child(4) { top: 50%; left: 0; }
            .logo-sparkles span:nth-child(5) { bottom: 20%; right: 10%; }
            
            @keyframes sparkle {
                0%, 100% { opacity: 0; transform: scale(0.5); }
                50% { opacity: 1; transform: scale(1); }
            }
            
            /* ========== COUNTDOWN PREMIUM ========== */
            .anniversary-countdown {
                margin: 0 auto 15px;
                padding: 15px 30px;
                background: linear-gradient(135deg, 
                    rgba(188, 19, 254, 0.1) 0%, 
                    rgba(0, 243, 255, 0.1) 100%);
                border: 1px solid rgba(188, 19, 254, 0.2);
                border-radius: 50px;
                display: inline-block;
                position: relative;
                overflow: hidden;
            }
            
            .countdown-content {
                display: flex;
                align-items: center;
                gap: 12px;
            }
            
            .countdown-label {
                font-size: 0.75rem;
                color: #888;
                text-transform: uppercase;
                letter-spacing: 1px;
            }
            
            .countdown-number {
                font-size: 1.8rem;
                font-weight: 900;
                background: linear-gradient(135deg, #00f3ff, #bc13fe);
                -webkit-background-clip: text;
                -webkit-text-fill-color: transparent;
                background-clip: text;
                line-height: 1;
            }
            
            .countdown-unit {
                font-size: 0.85rem;
                color: #aaa;
                font-weight: 500;
            }
            
            .countdown-progress {
                position: absolute;
                bottom: 0;
                left: 0;
                right: 0;
                height: 3px;
                background: rgba(255, 255, 255, 0.1);
            }
            
            .progress-bar {
                height: 100%;
                background: linear-gradient(90deg, #00f3ff, #bc13fe);
                border-radius: 0 3px 3px 0;
                transition: width 0.5s ease;
            }
            
            .anniversary-countdown.is-today {
                animation: celebrationPulse 1s ease-in-out infinite;
                border-color: rgba(255, 215, 0, 0.5);
                background: linear-gradient(135deg, 
                    rgba(255, 215, 0, 0.15) 0%, 
                    rgba(255, 100, 100, 0.15) 100%);
            }
            
            @keyframes celebrationPulse {
                0%, 100% { transform: scale(1); }
                50% { transform: scale(1.02); }
            }
            
            .countdown-celebration {
                display: flex;
                align-items: center;
                gap: 10px;
            }
            
            .celebration-emoji {
                font-size: 1.5rem;
                animation: celebrateEmoji 1s ease-in-out infinite;
            }
            
            .celebration-text {
                font-size: 1rem;
                font-weight: 700;
                background: linear-gradient(135deg, #ffd700, #ff6b6b);
                -webkit-background-clip: text;
                -webkit-text-fill-color: transparent;
                background-clip: text;
            }
            
            @keyframes celebrateEmoji {
                0%, 100% { transform: rotate(-10deg) scale(1); }
                50% { transform: rotate(10deg) scale(1.2); }
            }
            
            /* ========== AMBIENT ORBS ========== */
            .anniversary-ambient {
                position: fixed;
                inset: 0;
                pointer-events: none;
                z-index: -1;
                overflow: hidden;
            }
            
            .ambient-orb {
                position: absolute;
                border-radius: 50%;
                filter: blur(80px);
                opacity: 0.15;
                animation: orbFloat 20s ease-in-out infinite;
            }
            
            .orb-1 {
                width: 400px;
                height: 400px;
                background: #bc13fe;
                top: -100px;
                right: -100px;
                animation-delay: 0s;
            }
            
            .orb-2 {
                width: 300px;
                height: 300px;
                background: #00f3ff;
                bottom: -50px;
                left: -50px;
                animation-delay: -7s;
            }
            
            .orb-3 {
                width: 250px;
                height: 250px;
                background: #ffd700;
                top: 50%;
                left: 50%;
                animation-delay: -14s;
            }
            
            @keyframes orbFloat {
                0%, 100% { transform: translate(0, 0) scale(1); }
                25% { transform: translate(50px, -30px) scale(1.1); }
                50% { transform: translate(-30px, 50px) scale(0.9); }
                75% { transform: translate(-50px, -20px) scale(1.05); }
            }
            
            /* ========== RESPONSIVE ========== */
            @media (max-width: 768px) {
                #anniversary-banner {
                    right: 10px;
                    left: 10px;
                    top: auto;
                    bottom: 80px;
                    max-width: none;
                }
                
                .anniversary-badge {
                    width: 45px;
                    height: 45px;
                }
                
                .badge-number {
                    font-size: 1.2rem;
                }
                
                .anniversary-countdown {
                    padding: 12px 20px;
                }
                
                .countdown-number {
                    font-size: 1.5rem;
                }
            }
        `;
        document.head.appendChild(style);
    }

    // =========================================================================
    // INICIALIZACIÓN
    // =========================================================================

    document.addEventListener('DOMContentLoaded', () => {
        injectStyles();
        createAmbientEffect();

        // Banner con delay
        if (!sessionStorage.getItem('anniversaryBannerClosed')) {
            setTimeout(createBanner, 800);
        }

        // Efectos del logo
        setTimeout(enhanceLogo, 500);

        // Countdown
        createCountdown();

        // Partículas (solo una vez por sesión)
        if (!sessionStorage.getItem('anniversaryParticlesShown')) {
            setTimeout(initParticleSystem, 1000);
            sessionStorage.setItem('anniversaryParticlesShown', 'true');
        }
    });

})();
