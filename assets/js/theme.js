/**
 * THEME.JS - Easter Eggs & Retro Features
 * Note: Core settings (colors, wallpapers) are handled by settings.js.
 * This file handles specific "Prime/Retro" modes and secret easter eggs.
 * "Readability > Speed"
 */

(function () {
    'use strict';

    // NUCLEAR IDEMPOTENCY CHECK
    if (window.JueguitosThemeInitialized) return;
    window.JueguitosThemeInitialized = true;

    const CONFIG = {
        KEYS: { THEME: 'jueguitosTheme' },
        ICONS: {
            ARROW_UP: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 15l-6-6-6 6"/></svg>'
        }
    };

    // ============================================================================
    // THEME MANAGER
    // ============================================================================
    const ThemeManager = {
        init() {
            // Restore Prime Mode if saved
            if (localStorage.getItem('jueguitos_prime_mode') === 'true') {
                document.body.classList.add('prime-mode');
            }
            this.setupSearchTrigger();
        },

        togglePrimeMode() {
            const body = document.body;
            body.classList.toggle('prime-mode');
            const isActive = body.classList.contains('prime-mode');

            if (isActive) {
                // FAILSAFE: Proactively remove custom background
                body.style.backgroundImage = 'none';
                body.style.backgroundColor = '#050505';
            } else {
                // Restore settings
                if (window.SettingsManager && window.SettingsManager.applySettings) {
                    window.SettingsManager.applySettings();
                }
            }

            localStorage.setItem('jueguitos_prime_mode', isActive);
            this.notify(isActive ? 'Modo Prime ACTIVADO 🕹️' : 'Modo Prime DESACTIVADO');
        },

        notify(msg) {
            const existing = document.querySelector('.retro-notification');
            if (existing) existing.remove();

            const notif = document.createElement('div');
            notif.className = 'retro-notification';
            notif.textContent = msg;
            document.body.appendChild(notif);

            setTimeout(() => {
                notif.style.animation = 'slideUp 0.3s ease forwards';
                setTimeout(() => notif.remove(), 300);
            }, 2000);
        },
        setupSearchTrigger() {
            // "Prime" easter egg trigger via search
            const searchInput = document.getElementById('searchInput');
            if (!searchInput) return;

            const EGGS = {
                'vecina': 'https://i.ibb.co/HTtGBHVq/vecina.png',
                'tormenta': 'https://i.ibb.co/LWw3SJc/tormenta.png',
                'rem': 'https://i.ibb.co/HfQ63z7M/rem.png',
                'jesse': 'https://i.ibb.co/6cXbs5nx/jesse.png',
                'milf': 'https://images.steamusercontent.com/ugc/889882349869764993/D4D2A7BF8CE74CB368F9DC1C395A8595484E02AB/?imw=5000&imh=5000&ima=fit&impolicy=Letterbox&imcolor=%23000000&letterbox=false'
            };

            searchInput.addEventListener('input', (e) => {
                const val = e.target.value.toLowerCase().trim();
                console.log('[Theme] Input:', val); // DEBUG

                // Prime Theme (CSS Override Implementation)
                if (val === 'prime') {
                    if (typeof AchievementManager !== 'undefined') AchievementManager.unlock('prime');
                    this.togglePrimeMode();
                    this.clearSearch(searchInput);
                    return;
                }

                // Cochino (Naughty Words)
                const NAUGHTY = ['hentai', 'porno', 'xxx', 'sexo', 'pene', 'puta', 'milf'];
                if (NAUGHTY.some(word => val.includes(word))) {
                    if (typeof AchievementManager !== 'undefined') AchievementManager.unlock('cochino');
                    this.clearSearch(searchInput, 1000);
                    return;
                }

                // Image Easter Eggs
                if (EGGS[val]) {
                    this.showImage(EGGS[val]);
                    if (typeof AchievementManager !== 'undefined') AchievementManager.unlock('egg');
                    this.clearSearch(searchInput, 1500); // Delay clear so user sees they typed it
                }
            });
        },
        clearSearch(input, delay = 500) {
            setTimeout(() => {
                input.value = '';
                input.dispatchEvent(new Event('input', { bubbles: true }));
            }, delay);
        },
        showImage(url) {
            const id = 'egg-overlay';
            const existing = document.getElementById(id);
            if (existing) existing.remove();

            const overlay = document.createElement('div');
            overlay.id = id;
            overlay.style.cssText = 'position:fixed; top:0; left:0; width:100%; height:100%; background:rgba(0,0,0,0.8); z-index:10000; display:flex; justify-content:center; align-items:center; cursor:pointer;';
            overlay.innerHTML = `<img src="${url}" style="max-width:90%; max-height:90%; border-radius:10px; box-shadow:0 0 20px rgba(0,0,0,0.5);">`;

            overlay.onclick = () => overlay.remove();
            document.body.appendChild(overlay);
        }
    };

    // ============================================================================
    // UI ENHANCEMENTS (Scroll To Top)
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
    // INIT
    // ============================================================================
    document.addEventListener('DOMContentLoaded', () => {
        ThemeManager.init();
        UIEnhancements.init();
    });

})();
