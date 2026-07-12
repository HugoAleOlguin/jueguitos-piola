import confetti from 'canvas-confetti';

const STORAGE_KEY = 'jueguitos_achievements';

export const ACHIEVEMENTS = [
    // Secretos
    { id: 'prime', title: 'El Prime', desc: 'Activaste el diseño original. Esta bonito :,(', icon: '📺' },
    { id: 'pesado', title: 'Sos Re Pesado', desc: 'Deja al logo en paz.', icon: '📢' },
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

let state = {
    unlocked: new Set(),
    stats: {
        logoClicks: 0,
        colorChanges: 0,
        lastColorChange: 0,
        rouletteSpins: 0,
        gamesOpened: 0,
        downloadsClicked: 0
    },
    speedrun: {
        startTime: null,
        completionTime: null
    }
};

// Cargar progreso al importar
const loadProgress = () => {
    try {
        const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
        if (Array.isArray(saved)) {
            state.unlocked = new Set(saved);
        } else {
            state.unlocked = new Set(saved.unlocked || []);
            state.stats = { ...state.stats, ...(saved.stats || {}) };
            state.speedrun = { ...state.speedrun, ...(saved.speedrun || {}) };
        }
    } catch (e) {
        console.error('Error loading achievements:', e);
    }
};

const saveProgress = () => {
    const data = {
        unlocked: [...state.unlocked],
        stats: state.stats,
        speedrun: state.speedrun
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
};

// Sonido sintético de "pop" al desbloquear
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
    } catch {}
};

// Desbloquear logro
export const unlockAchievement = (id) => {
    loadProgress();
    if (state.unlocked.has(id)) return;

    const ach = ACHIEVEMENTS.find(a => a.id === id);
    if (!ach) return;

    // Iniciar cronómetro de speedrun
    if (state.unlocked.size === 0) {
        state.speedrun.startTime = Date.now();
    }

    state.unlocked.add(id);

    // Verificar si se completó el speedrun
    const nonSecretCount = ACHIEVEMENTS.filter(a => !a.secret).length;
    const unlockedNonSecret = ACHIEVEMENTS.filter(a => !a.secret && state.unlocked.has(a.id)).length;

    if (unlockedNonSecret === nonSecretCount && !state.speedrun.completionTime) {
        state.speedrun.completionTime = Date.now();
        const duration = state.speedrun.completionTime - state.speedrun.startTime;
        if (duration < 60000) {
            setTimeout(() => unlockAchievement('speedrunner'), 1000);
        }
    }

    saveProgress();
    playPopSound();

    // Celebración con confeti
    try {
        confetti({
            particleCount: 80,
            spread: 60,
            origin: { y: 0.8 },
            colors: ['#00f3ff', '#00ff88', '#ffd700']
        });
    } catch {}

    // Dispatch evento para notificar al componente Toast
    const event = new CustomEvent('jueguitos_achievement_unlocked', { detail: ach });
    window.dispatchEvent(event);
};

// Seguir eventos
export const trackAchievementEvent = (type) => {
    loadProgress();
    switch (type) {
        case 'LOGO_CLICK':
            state.stats.logoClicks++;
            if (state.stats.logoClicks >= 50) unlockAchievement('pesado');
            break;

        case 'COLOR_CHANGE':
            state.stats.colorChanges++;
            if (state.stats.colorChanges >= 5) unlockAchievement('colores');
            break;

        case 'ROULETTE_SPIN':
            state.stats.rouletteSpins++;
            if (state.stats.rouletteSpins >= 10) unlockAchievement('ludopath');
            break;

        case 'GAME_OPEN':
            const now = Date.now();
            if (state.stats.lastGameOpen && (now - state.stats.lastGameOpen < 500)) return;
            state.stats.lastGameOpen = now;

            state.stats.gamesOpened++;
            if (state.stats.gamesOpened >= 10 && state.stats.downloadsClicked === 0) {
                unlockAchievement('window_shopper');
            }
            break;

        case 'DOWNLOAD_CLICK':
            state.stats.downloadsClicked++;
            break;
            
        default:
            break;
    }
    saveProgress();
};

export const getAchievementsState = () => {
    loadProgress();
    return {
        unlockedCount: state.unlocked.size,
        totalCount: ACHIEVEMENTS.length,
        allAchievements: ACHIEVEMENTS,
        unlockedSet: state.unlocked,
        stats: state.stats
    };
};

// Inicialización de eventos globales
export const initAchievementsListeners = () => {
    loadProgress();
    
    // Escuchar el evento de tracking enviado por componentes
    const handleEvent = (e) => {
        if (e.detail?.type) {
            trackAchievementEvent(e.detail.type);
        }
    };
    
    window.addEventListener('jueguitos_achievement_event', handleEvent);
    
    return () => {
        window.removeEventListener('jueguitos_achievement_event', handleEvent);
    };
};
