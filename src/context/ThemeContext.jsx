import React, { createContext, useContext, useState, useEffect } from 'react';
// placeholder
import { ImageCacheStore } from '../services/backgroundStore';

const ThemeContext = createContext();

export const STORAGE_KEYS = {
    BG_TYPE: 'jueguitos_settings_bg_type',
    BG_VALUE: 'jueguitos_settings_bg_value',
    BLUR: 'jueguitos_settings_blur',
    THEME_COLOR: 'jueguitos_settings_color',
    LITE_MODE: 'jueguitos_settings_lite',
    CURSOR: 'jueguitos_settings_cursor',
    PARTICLES: 'jueguitos_settings_particles',
    TRAIL: 'jueguitos_settings_trail',
    UI_SOUNDS: 'jueguitos_settings_uisounds',
    CARD_STYLE: 'jueguitos_settings_card_style',
    DISABLE_WAVES: 'jueguitos_settings_disable_waves'
};

export const DEFAULTS = {
    BG_TYPE: 'default',
    BG_VALUE: '',
    BLUR: '0',
    THEME_COLOR: '#00f3ff',
    LITE_MODE: 'false',
    CURSOR: 'default',
    PARTICLES: 'false',
    TRAIL: 'false',
    UI_SOUNDS: 'false',
    CARD_STYLE: 'default',
    DISABLE_WAVES: 'false'
};

export const ThemeProvider = ({ children }) => {
    const [settings, setSettings] = useState(() => {
        return {
            bgType: localStorage.getItem(STORAGE_KEYS.BG_TYPE) || DEFAULTS.BG_TYPE,
            bgValue: localStorage.getItem(STORAGE_KEYS.BG_VALUE) || DEFAULTS.BG_VALUE,
            blur: localStorage.getItem(STORAGE_KEYS.BLUR) || DEFAULTS.BLUR,
            themeColor: localStorage.getItem(STORAGE_KEYS.THEME_COLOR) || DEFAULTS.THEME_COLOR,
            liteMode: localStorage.getItem(STORAGE_KEYS.LITE_MODE) || DEFAULTS.LITE_MODE,
            cursor: localStorage.getItem(STORAGE_KEYS.CURSOR) || DEFAULTS.CURSOR,
            particles: localStorage.getItem(STORAGE_KEYS.PARTICLES) || DEFAULTS.PARTICLES,
            trail: localStorage.getItem(STORAGE_KEYS.TRAIL) || DEFAULTS.TRAIL,
            uiSounds: localStorage.getItem(STORAGE_KEYS.UI_SOUNDS) || DEFAULTS.UI_SOUNDS,
            cardStyle: localStorage.getItem(STORAGE_KEYS.CARD_STYLE) || DEFAULTS.CARD_STYLE,
            disableWaves: localStorage.getItem(STORAGE_KEYS.DISABLE_WAVES) || DEFAULTS.DISABLE_WAVES
        };
    });



    // Guardar configuraciones individuales o en bloque
    const updateSettings = (newSettings) => {
        setSettings(prev => {
            const updated = { ...prev, ...newSettings };
            Object.keys(newSettings).forEach(key => {
                const storageKey = STORAGE_KEYS[key.replace(/([A-Z])/g, "_$1").toUpperCase()];
                if (storageKey) {
                    localStorage.setItem(storageKey, String(newSettings[key]));
                }
            });
            return updated;
        });
    };

    // Restaurar valores por defecto
    const resetSettings = async () => {
        Object.values(STORAGE_KEYS).forEach(k => localStorage.removeItem(k));
        try {
            await ImageCacheStore.deleteBlob('custom_bg');
            await ImageCacheStore.deleteBlob('custom_cursor');
        } catch (e) {
            console.warn('Error clearing IndexedDB assets:', e);
        }
        
        setSettings({
            bgType: DEFAULTS.BG_TYPE,
            bgValue: DEFAULTS.BG_VALUE,
            blur: DEFAULTS.BLUR,
            themeColor: DEFAULTS.THEME_COLOR,
            liteMode: DEFAULTS.LITE_MODE,
            cursor: DEFAULTS.CURSOR,
            particles: DEFAULTS.PARTICLES,
            trail: DEFAULTS.TRAIL,
            uiSounds: DEFAULTS.UI_SOUNDS,
            cardStyle: DEFAULTS.CARD_STYLE,
            disableWaves: DEFAULTS.DISABLE_WAVES
        });
    };

    // Efecto principal para aplicar los cambios a la UI
    useEffect(() => {
        const isLite = settings.liteMode === 'true';
        const root = document.documentElement;
        const body = document.body;

        // 1. Lite Mode
        body.classList.toggle('lite-mode', isLite);

        // 2. Colores y desenfoque (Variables CSS)
        const blurVal = isLite ? '0' : settings.blur;
        root.style.setProperty('--glass-blur', `${blurVal}px`);
        root.style.setProperty('--primary-color', settings.themeColor);

        // 3. Estilo de tarjetas
        const allCardStyles = ['default', 'compact', 'rainbow', 'cyber'];
        body.classList.remove(...allCardStyles.map(s => `card-style-${s}`));
        body.classList.add(`card-style-${settings.cardStyle}`);

        // Manejar líneas de escaneo del modo Cyber
        const handleCyberScanLines = () => {
            const isCyber = settings.cardStyle === 'cyber';
            const cards = document.querySelectorAll('.game-card');
            
            if (isCyber && !isLite) {
                cards.forEach(card => {
                    if (card.querySelector('.cyber-scan-line')) return;
                    const scan = document.createElement('div');
                    scan.className = 'cyber-scan-line';
                    const line1 = document.createElement('div');
                    line1.className = 'cyber-line';
                    const line2 = document.createElement('div');
                    line2.className = 'cyber-line';
                    const line3 = document.createElement('div');
                    line3.className = 'cyber-line';
                    card.append(scan, line1, line2, line3);
                });
            } else {
                document.querySelectorAll('.cyber-scan-line, .cyber-line').forEach(el => el.remove());
            }
        };

        // Dar un pequeño delay para asegurar la existencia del DOM
        const timeoutId = setTimeout(handleCyberScanLines, 100);

        return () => clearTimeout(timeoutId);
    }, [settings.cardStyle, settings.liteMode, settings.blur, settings.themeColor]);

    // Aplicación del fondo de pantalla
    useEffect(() => {
        const isLite = settings.liteMode === 'true';
        const body = document.body;

        body.style.removeProperty('background-image');
        body.style.removeProperty('background-size');
        body.style.removeProperty('background-attachment');
        body.style.removeProperty('background-position');

        if (isLite) return;

        let activeUrl = null;

        const applyBackground = async () => {
            if (settings.bgType === 'blob') {
                try {
                    const blob = await ImageCacheStore.getBlob(settings.bgValue || 'custom_bg');
                    if (blob) {
                        const url = URL.createObjectURL(blob);
                        setBgBlobUrl(prevUrl => {
                            if (prevUrl) URL.revokeObjectURL(prevUrl);
                            return url;
                        });
                        activeUrl = url;
                    }
                } catch (e) {
                    console.error('Error loading background blob:', e);
                }
            } else if (settings.bgType === 'url' && settings.bgValue) {
                activeUrl = settings.bgValue;
            }

            if (activeUrl) {
                body.style.setProperty('background-image', `url('${activeUrl}')`, 'important');
                body.style.backgroundSize = 'cover';
                body.style.backgroundAttachment = 'fixed';
                body.style.backgroundPosition = 'center';
            }
        };

        applyBackground();
    }, [settings.bgType, settings.bgValue, settings.liteMode]);

    // Aplicación del Cursor Personalizado
    useEffect(() => {
        const body = document.body;
        body.classList.remove('cursor-crosshair', 'cursor-troll', 'static-cursor');
        body.style.cursor = '';
        document.documentElement.style.cursor = '';

        if (!settings.cursor || settings.cursor === 'default') return;

        body.classList.add('static-cursor');

        const applyCursor = async () => {
            if (settings.cursor === 'custom') {
                try {
                    const blob = await ImageCacheStore.getBlob('custom_cursor');
                    if (blob) {
                        const url = URL.createObjectURL(blob);
                        setCustomCursorUrl(prevUrl => {
                            if (prevUrl) URL.revokeObjectURL(prevUrl);
                            return url;
                        });
                        body.style.cursor = `url('${url}'), auto`;
                    }
                } catch (e) {
                    console.error('Error loading custom cursor:', e);
                }
            } else if (settings.cursor === 'troll') {
                // Troll cursor oculta el cursor original
                body.style.cursor = "url('/styles/features/null_.png'), auto";
            } else {
                body.classList.add(`cursor-${settings.cursor}`);
            }
        };

        applyCursor();
    }, [settings.cursor]);

    // Estilo del trail/estela del cursor (Canvas/DOM)
    useEffect(() => {
        const isLite = settings.liteMode === 'true';
        const enabled = settings.trail === 'true' && !isLite;
        
        if (!enabled) return;

        const color = settings.themeColor;
        const dot = document.createElement('div');
        dot.id = 'cursor-follow-dot';
        dot.style.cssText = `
            position: fixed;
            top: 0; left: 0;
            width: 28px; height: 28px;
            border-radius: 50%;
            border: 2px solid ${color};
            background: transparent;
            pointer-events: none;
            z-index: 99999;
            opacity: 0.7;
            transform: translate(-50%, -50%);
            transition: width 0.2s ease, height 0.2s ease,
                        opacity 0.2s ease, background 0.2s ease,
                        border-color 0.3s ease;
            will-change: transform;
        `;
        document.body.appendChild(dot);

        const dotInner = document.createElement('div');
        dotInner.style.cssText = `
            position: fixed;
            top: 0; left: 0;
            width: 5px; height: 5px;
            border-radius: 50%;
            background: ${color};
            pointer-events: none;
            z-index: 99999;
            opacity: 0.9;
            transform: translate(-50%, -50%);
            will-change: transform;
        `;
        document.body.appendChild(dotInner);

        let targetX = -100, targetY = -100;
        let currentX = -100, currentY = -100;
        let animId;

        const HOVER_SELECTOR = '.game-card, button, .theme-toggle, .floating-fab, .minigame-card, .vs-mode-btn, a';

        const onMove = (e) => {
            targetX = e.clientX;
            targetY = e.clientY;

            dotInner.style.transform = `translate(${targetX}px, ${targetY}px) translate(-50%, -50%)`;

            const hovering = document.elementFromPoint(targetX, targetY)?.closest(HOVER_SELECTOR);
            if (hovering) {
                dot.style.width = '44px';
                dot.style.height = '44px';
                dot.style.opacity = '0.4';
                dot.style.background = `${color}22`;
            } else {
                dot.style.width = '28px';
                dot.style.height = '28px';
                dot.style.opacity = '0.7';
                dot.style.background = 'transparent';
            }
        };

        const animate = () => {
            currentX += (targetX - currentX) * 0.1;
            currentY += (targetY - currentY) * 0.1;
            dot.style.transform = `translate(${currentX}px, ${currentY}px) translate(-50%, -50%)`;
            animId = requestAnimationFrame(animate);
        };

        animId = requestAnimationFrame(animate);
        document.addEventListener('mousemove', onMove);

        return () => {
            cancelAnimationFrame(animId);
            document.removeEventListener('mousemove', onMove);
            dot.remove();
            dotInner.remove();
        };
    }, [settings.trail, settings.themeColor, settings.liteMode]);

    // Canvas de partículas de fondo
    useEffect(() => {
        const isLite = settings.liteMode === 'true';
        const enabled = settings.particles === 'true' && !isLite;
        
        if (!enabled) {
            const existing = document.getElementById('particles-canvas');
            if (existing) {
                existing.classList.remove('active');
                setTimeout(() => existing.remove(), 1000);
            }
            return;
        }

        let canvas = document.getElementById('particles-canvas');
        if (!canvas) {
            canvas = document.createElement('canvas');
            canvas.id = 'particles-canvas';
            document.body.appendChild(canvas);
        }

        const ctx = canvas.getContext('2d');
        let particles = [];
        let animId;

        const resize = () => {
            canvas.width = window.innerWidth;
            canvas.height = window.innerHeight;
        };
        window.addEventListener('resize', resize);
        resize();

        const particleCount = 50;
        const color = settings.themeColor;

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

        for (let i = 0; i < particleCount; i++) {
            particles.push(new Particle());
        }

        const animate = () => {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            particles.forEach(p => {
                p.update();
                p.draw();
            });
            animId = requestAnimationFrame(animate);
        };

        canvas.classList.add('active');
        animate();

        return () => {
            cancelAnimationFrame(animId);
            window.removeEventListener('resize', resize);
        };
    }, [settings.particles, settings.themeColor, settings.liteMode]);

    return (
        <ThemeContext.Provider value={{ settings, updateSettings, resetSettings }}>
            {children}
        </ThemeContext.Provider>
    );
};

export const useTheme = () => useContext(ThemeContext);
