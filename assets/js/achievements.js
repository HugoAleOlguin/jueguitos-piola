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
        { id: 'cochino', title: 'Cochino', desc: 'Andá a buscar eso a otro lado...', icon: '🐷' },
        { id: 'curious_cat', title: 'Curioso', desc: '¿Qué esperabas encontrar acá abajo?', icon: '🐱' },

        // Ajustes
        { id: 'potato', title: 'PC del Gobierno', desc: 'Más FPS, menos dignidad.', icon: '🥔' },
        { id: 'colores', title: 'Indeciso', desc: 'No te decidís por un color.', icon: '🎨' },
        { id: 'blur', title: 'No Veo Un Carajo', desc: 'Pusiste el Blur al máximo.', icon: '👓' },
        { id: 'diseño', title: 'Aesthetic', desc: 'Creaste tu propio tema.', icon: '🖌️' },

        // Juegos
        { id: 'ludopath', title: 'Ludópata', desc: 'Te gusta girar la ruleta eh?', icon: '🎰' },
        { id: 'window_shopper', title: 'Mirar y No Tocar', desc: 'Abriste 10 juegos sin descargar ninguno.', icon: '👀' }
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

    // === INIT ===
    const init = () => {
        loadProgress();
        setupGlobalTriggers();
    };

    const loadProgress = () => {
        try {
            const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
            unlocked = new Set(saved);
        } catch (e) {
            console.error('Error loading achievements', e);
        }
    };

    const saveProgress = () => {
        localStorage.setItem(STORAGE_KEY, JSON.stringify([...unlocked]));
    };

    // === PUBLIC API ===
    const unlock = (id) => {
        if (unlocked.has(id)) return; // Ya desbloqueado

        const achievement = ACHIEVEMENTS.find(a => a.id === id);
        if (!achievement) return;

        unlocked.add(id);
        saveProgress();
        showNotification(achievement);
    };

    // === UI ===
    const showNotification = (a) => {
        const sound = new Audio('assets/sounds/pop.mp3'); // Opcional, si existiera
        // sound.play().catch(() => {});

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

        // Animation Entrance
        requestAnimationFrame(() => {
            div.classList.add('show');
        });

        // Auto Remove
        setTimeout(() => {
            div.classList.remove('show');
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
        const now = new Date();
        const hour = now.getHours();
        if (hour === 3) unlock('void');

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

    return {
        init,
        unlock,
        trackEvent
    };

})();

document.addEventListener('DOMContentLoaded', AchievementManager.init);
