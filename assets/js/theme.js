/**
 * THEME.JS - Core UI Logic (Simplified)
 * Handles: Theme Toggling (Prime/Retro), Scroll-to-Top, and basic UI hints.
 * "Readability > Speed"
 */

(function () {
    'use strict';

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
            this.apply(this.getSaved());
            this.setupSearchTrigger();
        },
        getSaved: () => localStorage.getItem(CONFIG.KEYS.THEME) || 'dark',
        apply(theme) {
            if (theme === 'retro') {
                document.documentElement.setAttribute('data-theme', 'retro');
            } else {
                document.documentElement.removeAttribute('data-theme');
            }
        },
        toggleRetro() {
            const current = this.getSaved();
            const newTheme = current === 'retro' ? 'dark' : 'retro';
            localStorage.setItem(CONFIG.KEYS.THEME, newTheme);
            this.apply(newTheme);
            this.notify(`Modo ${newTheme === 'retro' ? 'Prime (Retro)' : 'Normal'} activado`);
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
                'jesse': 'https://i.ibb.co/6cXbs5nx/jesse.png'
            };

            searchInput.addEventListener('input', (e) => {
                const val = e.target.value.toLowerCase().trim();

                // Prime Theme
                if (val === 'prime') {
                    this.toggleRetro();
                    this.clearSearch(searchInput);
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
