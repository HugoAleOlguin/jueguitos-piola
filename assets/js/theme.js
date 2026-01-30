/**
 * THEME.JS - Core UI Functionality & Easter Eggs
 * Optimized Version
 */

(function () {
    'use strict';

    // ============================================================================
    // CONFIGURATION & CONSTANTS
    // ============================================================================
    const CONFIG = {
        KEYS: {
            THEME: 'jueguitosTheme',
            CACHE: 'jueguitosGamesCache',
            VERSION: 'jueguitosVersion',
            FAVS: 'jueguitosFavorites',
            HINT: 'primeHintShown'
        },
        ICONS: {
            RETRO: '<svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><rect x="2" y="4" width="20" height="16" rx="2"/><rect x="5" y="7" width="8" height="6" fill="none" stroke="currentColor"/><circle cx="17" cy="10" r="2"/><circle cx="17" cy="15" r="1"/></svg>',
            ARROW_UP: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 15l-6-6-6 6"/></svg>'
        },
        URLS: {
            TROLLFACE: '/jueguitos-piola/favicon.png',
            IMAGES: {
                'tormenta': 'https://i.ibb.co/LWw3SJc/tormenta.png',
                'vecina': 'https://i.ibb.co/HTtGBHVq/vecina.png',
                'rem': 'https://i.ibb.co/HfQ63z7M/rem.png',
                'el mismo': 'https://i.ibb.co/ycf4B6my/el-mismo-1.png',
                'jesse': 'https://i.ibb.co/6cXbs5nx/jesse.png'
            }
        },
        MESSAGES: {
            LOGO: [
                "deja de joder", "sos pesado eh", "ya para", "que queres?",
                "no hay nada aca", "en serio seguis?", "ok, me rindo",
                "felicidades, rompiste algo en el codigo"
            ],
            VOID: [
                "NO DEBERIAS ESTAR DESPIERTO", "ALGO TE OBSERVA", "ESCUCHASTE ESO?",
                "DETRAS DE TI", "NO MIRES", "LA SEÑAL SE PIERDE...",
                "ERROR DE TRANSMISION", "NO HAY NADIE AQUI", "POR QUE SEGUIS ACA?",
                "LA CINTA SE REBOBINA", "YA ME DIO MIEDITO", "3:33", "...",
                "ANDA A DORMIR", "VAYA VAYA", "HMM..."
            ]
        }
    };

    // Consolidated CSS Styles
    const DYNAMIC_STYLES = `
        /* Retro Notifications */
        .retro-notification {
            position: fixed; top: 100px; left: 50%; transform: translateX(-50%);
            padding: 15px 30px; border-radius: 10px; font-weight: bold; z-index: 10000;
            animation: slideDown 0.3s ease;
        }
        @keyframes slideDown { from { opacity: 0; transform: translateX(-50%) translateY(-20px); } to { opacity: 1; transform: translateX(-50%) translateY(0); } }
        @keyframes slideUp { from { opacity: 1; transform: translateX(-50%) translateY(0); } to { opacity: 0; transform: translateX(-50%) translateY(-20px); } }

        /* Logo Messages */
        .logo-message {
            position: fixed; background: rgba(0, 0, 0, 0.9); color: #fff;
            padding: 10px 20px; border-radius: 8px; font-size: 13px; z-index: 10000;
            animation: logoMsgIn 0.3s ease; border: 1px solid rgba(255, 255, 255, 0.1); white-space: nowrap;
        }
        @keyframes logoMsgIn { from { opacity: 0; transform: translateX(-50%) translateY(-10px); } to { opacity: 1; transform: translateX(-50%) translateY(0); } }
        @keyframes logoMsgOut { from { opacity: 1; transform: translateX(-50%) translateY(0); } to { opacity: 0; transform: translateX(-50%) translateY(-10px); } }

        /* Prime Hint */
        .prime-hint {
            position: fixed; bottom: 20px; left: 20px; background: rgba(20, 20, 25, 0.95);
            border: 1px solid rgba(213, 51, 105, 0.4); border-radius: 8px; padding: 12px 16px;
            color: #ccc; font-size: 13px; z-index: 9000; display: flex; align-items: center; gap: 12px;
            animation: slideInHint 0.4s ease; backdrop-filter: blur(8px);
        }
        .prime-hint-close { background: none; border: none; color: #666; cursor: pointer; font-size: 16px; padding: 0 4px; }
        @keyframes slideInHint { from { opacity: 0; transform: translateX(-20px); } to { opacity: 1; transform: translateX(0); } }
        @keyframes slideOutHint { from { opacity: 1; transform: translateX(0); } to { opacity: 0; transform: translateX(-20px); } }

        /* Scroll Top Button */
        .scroll-top-btn {
            position: fixed; bottom: 80px; right: 20px; width: 44px; height: 44px;
            background: var(--glass-bg, rgba(30, 30, 35, 0.9)); border: 1px solid var(--glass-border, rgba(255,255,255,0.1));
            border-radius: 50%; color: var(--text-color, #fff); cursor: pointer; opacity: 0; visibility: hidden;
            transform: translateY(20px); transition: all 0.3s ease; z-index: 9000;
            display: flex; align-items: center; justify-content: center;
        }
        .scroll-top-btn.show { opacity: 0.7; visibility: visible; transform: translateY(0); }
        .scroll-top-btn:hover { opacity: 1; transform: translateY(-3px); background: var(--primary-color, #00f3ff); color: #fff; }

        /* VOID MODE STYLES */
        :root { --void-red: #ff3333; --void-shadow: 2px 2px 0px rgba(0,0,0,0.8); }
        [data-void="true"] { --bg-color: #050505 !important; --card-bg: #111 !important; --text-color: #aaa !important; }
        [data-void="true"] body { background-color: #050505 !important; }
        body[data-glitch="true"] { filter: hue-rotate(90deg) contrast(1.5); transform: scale(1.01); }
        [data-void="true"] .game-card { filter: grayscale(1) brightness(0.7); transition: filter 0.3s; }
        [data-void="true"] .game-card:hover { filter: grayscale(0) brightness(1); outline: 1px solid var(--void-red); }
        
        .void-overlay {
            position: fixed; top: 0; left: 0; width: 100%; height: 100%; pointer-events: none; z-index: 9990;
            background: linear-gradient(rgba(18, 16, 16, 0) 50%, rgba(0, 0, 0, 0.25) 50%), linear-gradient(90deg, rgba(255, 0, 0, 0.06), rgba(0, 255, 0, 0.02), rgba(0, 0, 255, 0.06));
            background-size: 100% 2px, 3px 100%; box-shadow: inset 0 0 100px rgba(0,0,0,0.9);
        }
        .void-clock-ui {
            position: fixed; top: 30px; right: 40px; font-family: 'Courier New', monospace; z-index: 10000;
            color: #fff; font-size: 24px; text-shadow: 2px 2px 4px rgba(0,0,0,0.9); pointer-events: none;
            display: flex; flex-direction: column; align-items: flex-end; gap: 5px;
        }
        .void-rec-indicator { color: var(--void-red); font-weight: bold; font-size: 18px; text-transform: uppercase; animation: blinkRec 2s infinite step-start; }
        .void-dot { display: inline-block; margin-right: 5px; }
        .void-time-display { font-size: 32px; font-weight: bold; letter-spacing: 2px; background: rgba(0,0,0,0.3); padding: 5px 10px; }
        @keyframes blinkRec { 50% { opacity: 0; } }
        .void-message-container {
            position: fixed; bottom: 15%; left: 50%; transform: translateX(-50%); width: 80%;
            text-align: center; font-family: 'Courier New', monospace; font-size: 28px;
            color: #ccc; text-transform: uppercase; letter-spacing: 3px; z-index: 10000;
            text-shadow: 2px 2px 0 #000, 0 0 20px rgba(255,255,255,0.2); pointer-events: none;
            opacity: 0; transition: opacity 2s ease-in-out;
        }
        .void-message-container.visible { opacity: 1; }
        @media (max-width: 768px) {
            .void-clock-ui { top: 20px; right: 20px; transform: scale(0.8); transform-origin: top right; }
            .void-message-container { font-size: 20px; bottom: 20%; }
        }
    `;

    // ============================================================================
    // UTILITIES
    // ============================================================================
    const Utils = {
        injectStyle: (css) => {
            const style = document.createElement('style');
            style.textContent = css;
            document.head.appendChild(style);
        },
        randomChoice: (arr) => arr[Math.floor(Math.random() * arr.length)]
    };

    // ============================================================================
    // THEME MANAGER
    // ============================================================================
    const ThemeManager = {
        init() {
            this.apply(this.getSaved());
            // Inject styles once
            Utils.injectStyle(DYNAMIC_STYLES);
        },
        getSaved: () => localStorage.getItem(CONFIG.KEYS.THEME) || 'dark',
        apply(theme) {
            if (theme === 'retro') {
                document.documentElement.setAttribute('data-theme', 'retro');
            } else {
                document.documentElement.removeAttribute('data-theme');
            }
        },
        setRetro(active) {
            const theme = active ? 'retro' : 'dark';
            localStorage.setItem(CONFIG.KEYS.THEME, theme);
            this.apply(theme);
        }
    };

    // ============================================================================
    // CACHE MANAGER
    // ============================================================================
    const CacheManager = {
        init() {
            this.checkForUpdates();
            if (typeof gamesData !== 'undefined') {
                this.save(gamesData);
            }
        },
        async checkForUpdates() {
            try {
                const response = await fetch(`assets/data/version.json?t=${Date.now()}`);
                if (!response.ok) return;
                const data = await response.json();
                const localVersion = localStorage.getItem(CONFIG.KEYS.VERSION);

                if (localVersion && localVersion !== data.version) {
                    console.log(`Nueva versión: ${localVersion} → ${data.version}`);
                    localStorage.removeItem(CONFIG.KEYS.CACHE);
                    localStorage.setItem(CONFIG.KEYS.VERSION, data.version);
                    location.reload(true);
                    return;
                }
                if (!localVersion) localStorage.setItem(CONFIG.KEYS.VERSION, data.version);

            } catch (e) {
                console.log('Modo offline');
            }
        },
        save(data) {
            try {
                const cache = { timestamp: Date.now(), games: data };
                localStorage.setItem(CONFIG.KEYS.CACHE, JSON.stringify(cache));
            } catch (e) { console.warn('Cache error:', e); }
        }
    };

    // ============================================================================
    // EASTER EGGS
    // ============================================================================
    const EasterEggs = {
        init() {
            this.setupSearch();
            this.setupLogo();
            this.showHint();
        },
        setupSearch() {
            const searchInput = document.getElementById('searchInput');
            if (!searchInput) return;

            let retroMode = localStorage.getItem(CONFIG.KEYS.THEME) === 'retro';

            // Debounced input handler for images
            searchInput.addEventListener('input', (e) => {
                const val = e.target.value.toLowerCase().trim();

                // Retro Mode Trigger
                if (val === 'prime') {
                    retroMode = !retroMode;
                    ThemeManager.setRetro(retroMode);
                    this.notify(retroMode ? 'Modo Prime activado' : 'Modo Prime desactivado', retroMode ? 'retro' : 'normal');
                    setTimeout(() => {
                        searchInput.value = '';
                        searchInput.dispatchEvent(new Event('input', { bubbles: true }));
                    }, 500);
                    return;
                }

                // Secret Images
                if (CONFIG.URLS.IMAGES[val]) {
                    this.showImage(val, CONFIG.URLS.IMAGES[val]);
                } else {
                    this.hideImage();
                }
            });

            searchInput.addEventListener('blur', () => setTimeout(() => this.hideImage(), 150));
        },
        setupLogo() {
            const logo = document.querySelector('.logo');
            if (!logo) return;

            logo.style.cursor = 'pointer';
            logo.style.userSelect = 'none';

            let clicks = 0;
            let lastClick = 0;

            logo.addEventListener('click', (e) => {
                e.preventDefault();
                const now = Date.now();
                if (now - lastClick > 2000) clicks = 0;
                lastClick = now;
                clicks++;

                if (clicks >= 7) {
                    this.showLogoMsg(Utils.randomChoice(CONFIG.MESSAGES.LOGO));
                    clicks = 0;
                }
            });
        },
        showHint() {
            if (localStorage.getItem(CONFIG.KEYS.HINT)) return;
            if (Math.random() > 0.9) return; // 10% chance provided via logic inversion? Original was > 0.9 return (10% runs? No, original was > 0.9 return means 90% it returns, so 10% chance. Wait.. PROBABILITY = 0.9. If random > 0.9. 10% chance. Correct.) 
            // Original code: if (Math.random() > PROBABILITY) return; (PROBABILITY=0.9). Random is 0..1. So 10% chance.

            setTimeout(() => {
                const hint = document.createElement('div');
                hint.className = 'prime-hint';
                hint.innerHTML = `<span>Escribe "prime" en el buscador para una sorpresa</span><button class="prime-hint-close">x</button>`;
                document.body.appendChild(hint);

                const close = () => {
                    localStorage.setItem(CONFIG.KEYS.HINT, 'true');
                    hint.style.animation = 'slideOutHint 0.3s ease forwards';
                    setTimeout(() => hint.remove(), 300);
                };

                hint.querySelector('.prime-hint-close').addEventListener('click', close);
                setTimeout(() => { if (hint.parentNode) close(); }, 15000);
            }, 2000);
        },
        notify(msg, type) {
            const existing = document.querySelector('.retro-notification');
            if (existing) existing.remove();

            const notif = document.createElement('div');
            notif.className = 'retro-notification';
            notif.textContent = msg;
            notif.style.background = type === 'retro' ? 'linear-gradient(45deg, #d53369, #daae51)' : 'var(--primary-color)';
            notif.style.color = type === 'retro' ? '#000' : '#000';

            document.body.appendChild(notif);
            setTimeout(() => {
                notif.style.animation = 'slideUp 0.3s ease forwards';
                setTimeout(() => notif.remove(), 300);
            }, 2000);
        },
        // Image overlay logic
        eggContainer: null,
        currentWord: null,
        showImage(word, url) {
            if (this.currentWord === word) return;
            this.currentWord = word;

            if (!this.eggContainer) {
                this.eggContainer = document.createElement('div');
                this.eggContainer.id = 'easter-egg-image';
                this.eggContainer.style.cssText = 'position: fixed; top: 50%; left: 50%; transform: translate(-50%, -50%); z-index: 9998; pointer-events: none; opacity: 0; transition: opacity 0.25s ease;';
                const img = document.createElement('img');
                img.style.cssText = 'max-width: 80vw; max-height: 70vh; border-radius: 16px; box-shadow: 0 20px 60px rgba(0, 0, 0, 0.5);';
                this.eggContainer.appendChild(img);
                document.body.appendChild(this.eggContainer);
            }

            const img = this.eggContainer.querySelector('img');
            img.src = url;
            this.eggContainer.style.opacity = '1';
        },
        hideImage() {
            if (this.currentWord && this.eggContainer) {
                this.currentWord = null;
                this.eggContainer.style.opacity = '0';
            }
        },
        showLogoMsg(text) {
            const old = document.querySelector('.logo-message');
            if (old) old.remove();

            const logo = document.querySelector('.logo');
            const rect = logo.getBoundingClientRect();

            const msg = document.createElement('div');
            msg.className = 'logo-message';
            msg.textContent = text;
            msg.style.top = `${rect.bottom + 10}px`;
            msg.style.left = `${rect.left + rect.width / 2}px`;

            document.body.appendChild(msg);
            setTimeout(() => {
                msg.style.animation = 'logoMsgOut 0.3s ease forwards';
                setTimeout(() => msg.remove(), 300);
            }, 2000);
        }
    };

    // ============================================================================
    // VOID MODE (3AM)
    // ============================================================================
    const VoidMode = {
        init() {
            // Check time (3:00 - 3:59 AM)
            // Use 3 for 3AM. 
            if (new Date().getHours() !== 3) return;

            console.log('🌑 VOID MODE ACTIVATED 🌑');
            document.documentElement.setAttribute('data-void', 'true');

            this.createOverlay();
            this.createUI();
            this.startLoop();
        },
        createOverlay() {
            const d = document.createElement('div');
            d.className = 'void-overlay';
            document.body.appendChild(d);
        },
        createUI() {
            // Clock
            const clock = document.createElement('div');
            clock.className = 'void-clock-ui';
            clock.innerHTML = `<div class="void-rec-indicator"><span class="void-dot">●</span> REC</div><div class="void-time-display"></div>`;
            document.body.appendChild(clock);

            const updateTime = () => {
                const now = new Date();
                clock.querySelector('.void-time-display').textContent =
                    [now.getHours(), now.getMinutes(), now.getSeconds()]
                        .map(n => String(n).padStart(2, '0')).join(':');
            };
            setInterval(updateTime, 1000);
            updateTime();

            // Messages
            this.msgBox = document.createElement('div');
            this.msgBox.className = 'void-message-container';
            document.body.appendChild(this.msgBox);
        },
        startLoop() {
            // Message Loop
            const msgLoop = () => {
                this.msgBox.classList.remove('visible');

                setTimeout(() => {
                    if (Math.random() > 0.3) {
                        this.msgBox.textContent = Utils.randomChoice(CONFIG.MESSAGES.VOID);
                        this.msgBox.classList.add('visible');
                    }
                }, 1000);

                setTimeout(msgLoop, 5000 + Math.random() * 8000);
            };
            setTimeout(msgLoop, 3000);

            // Hallucinations Loop
            const hallucinate = () => {
                this.triggerHallucination();
                setTimeout(hallucinate, 2000 + Math.random() * 2000);
            };
            setTimeout(hallucinate, 2000);

            // Subtle Body Glitch
            setInterval(() => {
                if (Math.random() > 0.85) {
                    document.body.dataset.glitch = "true";
                    setTimeout(() => delete document.body.dataset.glitch, 150 + Math.random() * 200);
                }
            }, 4000);
        },
        triggerHallucination() {
            // Performance constraints
            const active = document.querySelectorAll('[data-void-active="true"]');
            if (active.length >= 12) return;

            const cards = Array.from(document.querySelectorAll('.card-image:not([data-void-active])'));
            if (!cards.length) return;

            // Pick random batch
            const batchSize = Math.floor(Math.random() * 4) + 3; // 3-6
            const targets = cards.sort(() => 0.5 - Math.random()).slice(0, batchSize);

            targets.forEach(el => {
                el.dataset.voidActive = "true";
                const originalBg = el.style.backgroundImage;

                el.style.backgroundImage = `url('${CONFIG.URLS.TROLLFACE}')`;
                el.style.backgroundSize = 'cover';
                el.style.backgroundPosition = 'center';

                setTimeout(() => {
                    if (el.dataset.voidActive) {
                        el.style.backgroundImage = originalBg;
                        // Clean styles
                        el.style.backgroundSize = '';
                        el.style.backgroundPosition = '';
                        delete el.dataset.voidActive;
                    }
                }, 4000 + Math.random() * 3000);
            });
        }
    };

    // ============================================================================
    // UI ENHANCEMENTS
    // ============================================================================
    const UIEnhancements = {
        init() {
            this.setupScrollToTop();
        },
        setupScrollToTop() {
            const btn = document.createElement('button');
            btn.className = 'scroll-top-btn';
            btn.innerHTML = CONFIG.ICONS.ARROW_UP;
            btn.title = 'Volver arriba';
            document.body.appendChild(btn);

            window.addEventListener('scroll', () => {
                btn.classList.toggle('show', window.scrollY > 400);
            });

            btn.addEventListener('click', () => window.scrollTo({ top: 0, behavior: 'smooth' }));
        }
    };

    // ============================================================================
    // INITIALIZATION
    // ============================================================================
    // Apply theme immediately to prevent flash
    ThemeManager.apply(ThemeManager.getSaved());

    document.addEventListener('DOMContentLoaded', () => {
        ThemeManager.init(); // Re-bind buttons and inject styles
        CacheManager.init();
        EasterEggs.init();
        UIEnhancements.init();
        VoidMode.init();
    });

})();
