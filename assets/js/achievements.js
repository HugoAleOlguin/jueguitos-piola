/**
 * ACHIEVEMENTS.JS
 * Sistema de Logros "Piola"
 */

const AchievementManager = (() => {
    // === CONFIG ===
    const VISIBLE_DURATION = 4000;
    const STORAGE_KEY = 'jueguitos_achievements';

    // === DEFINITIONS ===
    const ACHIEVEMENTS = [
        // Secretos
        { id: 'prime', title: 'El Prime', desc: 'Activaste el diseño original. Esta bonito :,(', icon: '📺' },
        { id: 'pesado', title: 'Sos Re Pesado', desc: 'Deja al pobre logo en paz.', icon: '📢' },
        { id: 'void', title: 'No Deberías Estar Aquí', desc: '3:33 AM.', icon: '🌑' },
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

        // Super Secreto
        { id: 'speedrunner', title: 'SPEEDRUNNER', desc: 'Completaste todos los logros en menos de 30 segundos. Tocá pasto.', icon: '⚡', secret: true }
    ];

    // === STATE ===
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

    // === INIT ===
    const init = () => {
        loadProgress();
        loadProgress();
        setupGlobalTriggers();
        injectStyles();
        setupUI();
    };

    const injectStyles = () => {
        const style = document.createElement('style');
        style.textContent = `
            .achievement-toast {
                position: fixed;
                bottom: 30px;
                left: 50%;
                transform: translateX(-50%) translateY(100px);
                background: rgba(10, 10, 10, 0.98);
                border: 1px solid #ffd700;
                border-radius: 12px;
                padding: 15px 25px;
                display: flex;
                align-items: center;
                gap: 15px;
                box-shadow: 0 10px 40px rgba(0,0,0,0.8);
                z-index: 99999;
                opacity: 0;
                transition: all 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275);
                min-width: 300px;
            }
            .achievement-toast.toast-visible {
                opacity: 1;
                transform: translateX(-50%) translateY(0);
            }
            .achievement-toast .ach-icon { font-size: 2.5rem; }
            .achievement-toast .ach-content { display: flex; flex-direction: column; }
            .achievement-toast .ach-title { color: #ffd700; font-weight: bold; font-size: 1rem; text-transform: uppercase; letter-spacing: 1px; }
            .achievement-toast .ach-desc { color: #ccc; font-size: 0.85rem; }
            .achievement-toast .ach-desc { color: #ccc; font-size: 0.85rem; }

            /* Speedrunner Special Card - Premium Design */
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
            
            /* Background Grid Effect */
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

    const loadProgress = () => {
        try {
            const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
            // Support for legacy array format (migration)
            if (Array.isArray(saved)) {
                unlocked = new Set(saved);
            } else {
                unlocked = new Set(saved.unlocked || []);
                stats = { ...stats, ...(saved.stats || {}) };
                // Session-based achievements reset
                stats.rouletteSpins = 0;

                speedrun = { ...speedrun, ...(saved.speedrun || {}) };
            }
        } catch (e) {
            console.error('Error loading achievements', e);
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

    // === PUBLIC API ===
    const unlock = (id) => {
        if (unlocked.has(id)) return; // Ya desbloqueado

        const achievement = ACHIEVEMENTS.find(a => a.id === id);
        if (!achievement) return;

        // Speedrun Start Logic
        if (unlocked.size === 0) {
            speedrun.startTime = Date.now();
        }

        unlocked.add(id);

        // Speedrun End Logic (Check against non-secret achievements)
        const nonSecretCount = ACHIEVEMENTS.filter(a => !a.secret).length;
        const unlockedNonSecret = ACHIEVEMENTS.filter(a => !a.secret && unlocked.has(a.id)).length;

        if (unlockedNonSecret === nonSecretCount && !speedrun.completionTime) {
            speedrun.completionTime = Date.now();

            // Check for Speedrunner Achievement (< 30s displayed)
            const duration = speedrun.completionTime - speedrun.startTime;
            // Allow up to 31000ms (30.9s) because UI floors the seconds (shows 30s)
            if (duration < 31000) {
                setTimeout(() => unlock('speedrunner'), 1000); // Dramatic delay
            }
        }

        saveProgress();
        showNotification(achievement);
    };

    // === UI ===
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
            // Ignore audio errors (user interact requirement etc)
        }
    };

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

        // Force Reflow
        void div.offsetWidth;

        // Animation Entrance
        div.classList.add('toast-visible');

        // Auto Remove
        setTimeout(() => {
            div.classList.remove('toast-visible');
            setTimeout(() => div.remove(), 500);
        }, VISIBLE_DURATION);
    };

    // === TRIGGERS (Global) ===
    const setupGlobalTriggers = () => {
        // 1. Footer Click (Curioso)
        const footer = document.querySelector('footer');
        if (footer) {
            footer.addEventListener('click', () => unlock('curious_cat'));
        }

        // 2. Void Check (Time)
        const checkVoidTime = () => {
            const now = new Date();
            const hour = now.getHours();
            if (hour === 3) unlock('void');
        };
        checkVoidTime();
        // Check every minute just in case
        setInterval(checkVoidTime, 60000);

        // 3. Konami Code (Speedrun Bypass)
        let konamiCode = ['ArrowUp', 'ArrowUp', 'ArrowDown', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'ArrowLeft', 'ArrowRight', 'b', 'a'];
        let konamiIndex = 0;

        document.addEventListener('keydown', (e) => {
            if (e.key.toLowerCase() === konamiCode[konamiIndex].toLowerCase()) { // Case insensitive for b/a
                konamiIndex++;
                if (konamiIndex === konamiCode.length) {
                    unlock('void');
                    konamiIndex = 0;
                }
            } else {
                konamiIndex = 0;
            }
        });
    };

    // === EXTENSIONS (For External Calls) ===
    const trackEvent = (details) => {
        switch (details.type) {
            case 'LOGO_CLICK':
                stats.logoClicks++;
                if (stats.logoClicks >= 50) unlock('pesado');
                break;

            case 'COLOR_CHANGE':
                const now = Date.now();
                if (now - stats.lastColorChange < 2000) { // 2 seconds threshold
                    stats.colorChanges++;
                } else {
                    stats.colorChanges = 1;
                }
                stats.lastColorChange = now;
                if (stats.colorChanges >= 5) unlock('colores');
                break;

            case 'ROULETTE_SPIN':
                stats.rouletteSpins++;
                if (stats.rouletteSpins >= 5) unlock('ludopath');
                break;

            case 'GAME_OPEN':
                stats.gamesOpened++;
                if (stats.gamesOpened >= 10 && stats.downloadsClicked === 0) unlock('window_shopper');
                break;

            case 'DOWNLOAD_CLICK':
                stats.downloadsClicked++;
                // Reset window shopper progress if valid download happens? 
                // Description says "Open 10 without downloading". 
                // So if they download, maybe we shouldn't reset, but check logic. 
                // Let's just track it.
                break;
        }
    };

    // Public API Extras
    const getStats = () => {
        return {
            unlockedCount: unlocked.size,
            totalCount: ACHIEVEMENTS.length,
            allAchievements: ACHIEVEMENTS,
            unlockedSet: unlocked
        };
    };

    const reset = () => {
        unlocked.clear();
        speedrun.startTime = null;
        speedrun.completionTime = null;

        // Reset all stats manually
        stats = {
            logoClicks: 0,
            colorChanges: 0,
            lastColorChange: 0,
            rouletteSpins: 0,
            gamesOpened: 0,
            downloadsClicked: 0
        };

        saveProgress();
        // Reload page to reflect changes or return true to let UI handle it
        return true;
    };

    const formatTime = (ms) => {
        if (!ms) return '--:--';
        const totalSeconds = Math.floor(ms / 1000);
        const minutes = Math.floor(totalSeconds / 60);
        const seconds = totalSeconds % 60;
        return `${minutes}m ${seconds.toString().padStart(2, '0')}s`;
    };

    // === UI MANAGER ===
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

    const renderModalContent = () => {
        const container = document.getElementById('achievementsListLarge');
        const titleCount = document.getElementById('achTitleCount');

        if (!container) return;

        container.innerHTML = '';
        if (titleCount) {
            const nonSecretTotal = ACHIEVEMENTS.filter(a => !a.secret).length;
            let text = `(${unlocked.size}/${nonSecretTotal})`;

            // Show Speedrun Time if completed
            // Check if all non-secrets are unlocked
            const unlockedNonSecret = ACHIEVEMENTS.filter(a => !a.secret && unlocked.has(a.id)).length;

            if (unlockedNonSecret === nonSecretTotal && speedrun.startTime && speedrun.completionTime) {
                const duration = speedrun.completionTime - speedrun.startTime;
                text += ` <span style="color: #00ff88; font-size: 0.8em; margin-left: 10px;">⏱️ ${formatTime(duration)}</span>`;
            } else if (speedrun.startTime) {
                // Optional: Show current run time? No, requested "Silent Run"
            }

            titleCount.innerHTML = text;
        }

        ACHIEVEMENTS.forEach(ach => {
            if (ach.secret && !unlocked.has(ach.id)) return; // Hide secret if locked

            const isUnlocked = unlocked.has(ach.id);
            const card = document.createElement('div');

            let className = `achievement-card ${isUnlocked ? 'unlocked' : 'locked'}`;
            if (ach.id === 'speedrunner') className += ' speedrunner';

            card.className = className;

            card.innerHTML = `
                <div class="ach-icon-large">${isUnlocked ? ach.icon : '🔒'}</div>
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
        reset
    };

})();

document.addEventListener('DOMContentLoaded', AchievementManager.init);
