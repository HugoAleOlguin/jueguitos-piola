/**
 * ACHIEVEMENTS.JS
 * Sistema de Logros "Piola"
 * Maneja: Definiciones, Desbloqueo, Notificaciones, Speedrun, UI del Modal
 */

const AchievementManager = (() => {
    // === CONFIGURACIÓN ===
    const VISIBLE_DURATION = 4000; // Duración del toast en milisegundos
    const STORAGE_KEY = 'jueguitos_achievements';

    // === DEFINICIONES DE LOGROS ===
    const ACHIEVEMENTS = [
        // Secretos
        { id: 'prime', title: 'El Prime', desc: 'Activaste el diseño original. Esta bonito :,(', icon: '📺' },
        { id: 'pesado', title: 'Sos Re Pesado', desc: 'Deja al pobre logo en paz.', icon: '📢' },

        { id: 'egg', title: '¿Qué Carajo?', desc: 'Buscaste lo que no debías.', icon: '🥚' },
        { id: 'cochino', title: 'Cochino', desc: 'Andá a buscar eso a otro lado.', icon: '🐷' },
        { id: 'curious_cat', title: 'Curioso', desc: '¿Qué esperabas encontrar acá abajo?', icon: '🐱' },

        // Ajustes
        { id: 'potato', title: 'PC del Gobierno', desc: 'Más FPS, menos dignidad.', icon: '🥔' },
        { id: 'colores', title: 'Indeciso', desc: 'No te decidís por un color.', icon: '🎨' },
        { id: 'blur', title: 'No Veo Un Carajo', desc: 'Pusiste el Blur al máximo.', icon: '👓' },
        { id: 'diseño', title: 'Aesthetic', desc: 'Creaste tu propio tema.', icon: '🖌️' },

        // Juegos
        { id: 'ludopath', title: 'Ludópata', desc: 'Te gusta girar la ruleta eh?', icon: '🎰' },
        { id: 'window_shopper', title: 'Mirar y No Tocar', desc: 'Abriste 10 juegos sin descargar ninguno.', icon: '👀' },

        // Súper Secreto — solo visible si se desbloquea
        { id: 'speedrunner', title: 'SPEEDRUNNER', desc: 'Completaste todos los logros en menos de 1 minuto. Tocá pasto.', icon: '⚡', secret: true }
    ];

    // === ESTADO ===
    let unlocked = new Set();
    let stats = {
        logoClicks: 0,
        colorChanges: 0,
        lastColorChange: 0,
        rouletteSpins: 0,
        gamesOpened: 0,
        downloadsClicked: 0
    };
    let speedrun = {
        startTime: null,
        completionTime: null
    };

    // === INICIALIZACIÓN ===
    const init = () => {
        loadProgress();
        setupGlobalTriggers();
        injectStyles();
        setupUI();
    };

    // Inyecta CSS del card Speedrunner (no tiene equivalente en archivos CSS)
    // Los estilos de toast están en achievements.css
    const injectStyles = () => {
        const style = document.createElement('style');
        style.textContent = `
            /* Card Especial del Speedrunner — diseño premium */
            .achievement-card.speedrunner {
                grid-column: 1 / -1;
                background: linear-gradient(135deg, rgba(10, 5, 5, 0.98), rgba(30, 0, 0, 0.95));
                border: 1px solid rgba(255, 215, 0, 0.3);
                border-left: 4px solid #ffd700;
                box-shadow: 0 10px 30px rgba(0, 0, 0, 0.5), inset 0 0 20px rgba(255, 0, 0, 0.05);
                transform: scale(1.0);
                margin-top: 20px;
                padding: 30px;
                position: relative;
                overflow: hidden;
            }
            .achievement-card.speedrunner:hover {
                transform: translateY(-2px);
                box-shadow: 0 15px 40px rgba(255, 215, 0, 0.1);
                border-color: #ffd700;
            }
            
            /* Efecto de grilla de puntos en el fondo */
            .achievement-card.speedrunner::after {
                content: '';
                position: absolute;
                top: 0; left: 0; width: 100%; height: 100%;
                background-image: radial-gradient(rgba(255, 215, 0, 0.1) 1px, transparent 1px);
                background-size: 20px 20px;
                opacity: 0.1;
                pointer-events: none;
            }

            .achievement-card.speedrunner h4 {
                font-size: 2rem !important;
                background: linear-gradient(to right, #ffd700, #ff8c00, #ff0080);
                -webkit-background-clip: text;
                color: transparent !important;
                text-shadow: 0 2px 20px rgba(255, 215, 0, 0.1);
                letter-spacing: 4px;
                text-transform: uppercase;
                margin-bottom: 8px;
                font-weight: 900;
            }
            
            .achievement-card.speedrunner p {
                color: #bbb !important;
                font-size: 1rem;
                font-family: 'Consolas', monospace;
                letter-spacing: 1px;
                border-top: 1px solid rgba(255, 255, 255, 0.1);
                padding-top: 10px;
                display: inline-block;
            }

            .achievement-card.speedrunner .ach-icon-large {
                font-size: 4.5rem;
                filter: drop-shadow(0 0 15px rgba(255, 215, 0, 0.4));
                animation: floatIcon 3s ease-in-out infinite;
            }

            @keyframes floatIcon {
                0%, 100% { transform: translateY(0) rotate(0deg); }
                50% { transform: translateY(-10px) rotate(5deg); }
            }
        `;
        document.head.appendChild(style);
    };

    // Carga progreso guardado desde localStorage
    const loadProgress = () => {
        try {
            const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
            // Soporte para formato legacy (array) — migración automática
            if (Array.isArray(saved)) {
                unlocked = new Set(saved);
            } else {
                unlocked = new Set(saved.unlocked || []);
                stats = { ...stats, ...(saved.stats || {}) };
                // Los contadores persisten entre sesiones para acumularse correctamente
                speedrun = { ...speedrun, ...(saved.speedrun || {}) };
            }
        } catch (e) {
            console.error('Error cargando logros:', e);
        }
    };

    const saveProgress = () => {
        const data = {
            unlocked: [...unlocked],
            stats: stats,
            speedrun: speedrun
        };
        localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    };

    // === API PÚBLICA ===

    // Desbloquea un logro por ID (ignora si ya fue desbloqueado)
    const unlock = (id) => {
        if (unlocked.has(id)) return;

        const achievement = ACHIEVEMENTS.find(a => a.id === id);
        if (!achievement) return;

        // Speedrun: marcar inicio con el primer logro desbloqueado
        if (unlocked.size === 0) {
            speedrun.startTime = Date.now();
        }

        unlocked.add(id);

        // Speedrun: verificar si se completaron todos los logros no-secretos
        const nonSecretCount = ACHIEVEMENTS.filter(a => !a.secret).length;
        const unlockedNonSecret = ACHIEVEMENTS.filter(a => !a.secret && unlocked.has(a.id)).length;

        if (unlockedNonSecret === nonSecretCount && !speedrun.completionTime) {
            speedrun.completionTime = Date.now();

            // Si se completó en menos de 1 minuto, desbloquear "Speedrunner"
            const duration = speedrun.completionTime - speedrun.startTime;
            if (duration < 60000) {
                setTimeout(() => unlock('speedrunner'), 1000); // Delay dramático
            }
        }

        saveProgress();
        showNotification(achievement);
    };

    // === UI: NOTIFICACIONES ===

    // Sonido sintético de "pop" al desbloquear un logro
    const playPopSound = () => {
        try {
            const AudioContext = window.AudioContext || window.webkitAudioContext;
            if (!AudioContext) return;

            const ctx = new AudioContext();
            const oscillator = ctx.createOscillator();
            const gainNode = ctx.createGain();

            oscillator.type = 'sine';
            oscillator.frequency.setValueAtTime(800, ctx.currentTime);
            oscillator.frequency.exponentialRampToValueAtTime(1200, ctx.currentTime + 0.1);

            gainNode.gain.setValueAtTime(0.3, ctx.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.1);

            oscillator.connect(gainNode);
            gainNode.connect(ctx.destination);

            oscillator.start();
            oscillator.stop(ctx.currentTime + 0.15);
        } catch (e) {
            // Ignorar errores de audio (requiere interacción del usuario)
        }
    };

    // Muestra el toast de notificación de logro desbloqueado
    const showNotification = (a) => {
        playPopSound();

        const div = document.createElement('div');
        div.className = 'achievement-toast';
        div.innerHTML = `
            <div class="ach-icon">${a.icon}</div>
            <div class="ach-content">
                <div class="ach-title">${a.title}</div>
                <div class="ach-desc">${a.desc}</div>
            </div>
        `;

        document.body.appendChild(div);

        // Forzar reflow para que la animación de entrada funcione
        void div.offsetWidth;
        div.classList.add('toast-visible');

        // Auto-remover después de VISIBLE_DURATION
        setTimeout(() => {
            div.classList.remove('toast-visible');
            setTimeout(() => div.remove(), 500);
        }, VISIBLE_DURATION);
    };

    // === TRIGGERS GLOBALES ===
    const setupGlobalTriggers = () => {
        // 1. Click en footer → Logro "Curioso"
        const footer = document.querySelector('footer');
        if (footer) {
            footer.addEventListener('click', () => unlock('curious_cat'));
        }


    };

    // === TRACKING DE EVENTOS (llamado desde otros módulos) ===
    const trackEvent = (details) => {
        switch (details.type) {
            case 'LOGO_CLICK':
                stats.logoClicks++;
                if (stats.logoClicks >= 50) unlock('pesado');
                break;

            case 'COLOR_CHANGE':
                stats.colorChanges++;
                if (stats.colorChanges >= 5) unlock('colores');
                break;

            case 'ROULETTE_SPIN':
                stats.rouletteSpins++;
                if (stats.rouletteSpins >= 10) unlock('ludopath');
                break;

            case 'GAME_OPEN':
                // Debounce: Evitar doble conteo si el evento se dispara dos veces (ej. router)
                const now = Date.now();
                if (stats.lastGameOpen && (now - stats.lastGameOpen < 500)) return;
                stats.lastGameOpen = now;

                stats.gamesOpened++;
                // Logro: Mirar y No Tocar (10+ juegos, 0 descargas)
                // >= en vez de === para que funcione aunque el usuario abra más de 10
                if (stats.gamesOpened >= 10 && stats.downloadsClicked === 0) unlock('window_shopper');
                break;

            case 'DOWNLOAD_CLICK':
                stats.downloadsClicked++;
                break;
        }
    };

    // Estadísticas públicas (usadas por el modal)
    const getStats = () => {
        return {
            unlockedCount: unlocked.size,
            totalCount: ACHIEVEMENTS.length,
            allAchievements: ACHIEVEMENTS,
            unlockedSet: unlocked
        };
    };

    // Resetear todo el progreso de logros
    const reset = () => {
        unlocked.clear();
        speedrun.startTime = null;
        speedrun.completionTime = null;

        stats = {
            logoClicks: 0,
            colorChanges: 0,
            lastColorChange: 0,
            rouletteSpins: 0,
            gamesOpened: 0,
            downloadsClicked: 0
        };

        saveProgress();
        return true;
    };

    // Formatea milisegundos como "Xm YYs"
    const formatTime = (ms) => {
        if (!ms) return '--:--';
        const totalSeconds = Math.floor(ms / 1000);
        const minutes = Math.floor(totalSeconds / 60);
        const seconds = totalSeconds % 60;
        return `${minutes}m ${seconds.toString().padStart(2, '0')}s`;
    };

    // === UI: MODAL DE LOGROS ===
    const setupUI = () => {
        const fab = document.getElementById('btnAchievementsFab');
        const modal = document.getElementById('achievementsModal');
        const btnClose = document.getElementById('btnCloseAchievements');
        const btnReset = document.getElementById('btnResetAchievementsModal');

        if (fab && modal) {
            fab.addEventListener('click', () => {
                renderModalContent();
                modal.style.display = 'flex';
            });
        }

        if (btnClose && modal) {
            btnClose.addEventListener('click', () => {
                modal.style.display = 'none';
            });
        }

        if (btnReset) {
            btnReset.addEventListener('click', () => {
                if (confirm('¿Borrar todo el progreso?')) {
                    reset();
                    renderModalContent();
                }
            });
        }
    };

    // Renderiza las cards de logros dentro del modal
    const renderModalContent = () => {
        const container = document.getElementById('achievementsListLarge');
        const titleCount = document.getElementById('achTitleCount');

        if (!container) return;

        container.innerHTML = '';
        if (titleCount) {
            const nonSecretTotal = ACHIEVEMENTS.filter(a => !a.secret).length;
            let text = `(${unlocked.size}/${nonSecretTotal})`;

            // Mostrar tiempo de speedrun si se completaron todos
            const unlockedNonSecret = ACHIEVEMENTS.filter(a => !a.secret && unlocked.has(a.id)).length;

            if (unlockedNonSecret === nonSecretTotal && speedrun.startTime && speedrun.completionTime) {
                const duration = speedrun.completionTime - speedrun.startTime;
                text += ` <span style="color: #00ff88; font-size: 0.8em; margin-left: 10px;">⏱️ ${formatTime(duration)}</span>`;
            }

            titleCount.innerHTML = text;
        }

        ACHIEVEMENTS.forEach(ach => {
            // Ocultar logros secretos si están bloqueados
            if (ach.secret && !unlocked.has(ach.id)) return;

            const isUnlocked = unlocked.has(ach.id);
            const card = document.createElement('div');

            let className = `achievement-card ${isUnlocked ? 'unlocked' : 'locked'}`;
            if (ach.id === 'speedrunner') className += ' speedrunner';

            card.className = className;

            const lockedSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" style="opacity:0.4"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path></svg>`;
            card.innerHTML = `
                <div class="ach-icon-large">${isUnlocked ? ach.icon : lockedSvg}</div>
                <div class="ach-info">
                    <h4>${ach.title}</h4>
                    <p>${isUnlocked ? ach.desc : '???'}</p>
                </div>
            `;
            container.appendChild(card);
        });
    };

    return {
        init,
        unlock,
        trackEvent,
        getStats,
        reset,
        _initialized: false
    };

})();

