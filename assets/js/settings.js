/**
 * SETTINGS.JS - Gestor de Configuración (v2.0)
 * Maneja: Fondo, Blur, Color, Cursores, Partículas y Modo Lite
 */

if (typeof window.SettingsManager === 'undefined') {
    window.SettingsManager = (() => {

        // Configuración y Defaults
        const STORAGE_KEYS = {
            BG_TYPE: 'jueguitos_settings_bg_type',
            BG_VALUE: 'jueguitos_settings_bg_value',
            BLUR: 'jueguitos_settings_blur',
            THEME_COLOR: 'jueguitos_settings_color',
            LITE_MODE: 'jueguitos_settings_lite',
            CURSOR: 'jueguitos_settings_cursor',
            PARTICLES: 'jueguitos_settings_particles',
            TRAIL: 'jueguitos_settings_trail',
            UI_SOUNDS: 'jueguitos_settings_uisounds'
        };

        const DEFAULTS = {
            BG_TYPE: 'default',
            BG_VALUE: '',
            BLUR: '0',
            THEME_COLOR: '#00f3ff',
            LITE_MODE: 'false',
            CURSOR: 'default',
            PARTICLES: 'true', // Activado por default
            TRAIL: 'false',
            UI_SOUNDS: 'false'
        };

        // Estado actual
        let currentSettings = {};
        let particleAnimationId = null;
        let trailCleanup = null; // Referencia para limpiar la estela

        // ========================================================================
        // INDEXED DB (Mismo de antes - optimizado)
        // ========================================================================
        const ImageCacheStore = {
            dbName: 'JueguitosDB',
            storeName: 'backgrounds',
            dbVersion: 1,

            async open() {
                return new Promise((resolve, reject) => {
                    const request = indexedDB.open(this.dbName, this.dbVersion);
                    request.onupgradeneeded = (e) => {
                        const db = e.target.result;
                        if (!db.objectStoreNames.contains(this.storeName)) {
                            db.createObjectStore(this.storeName);
                        }
                    };
                    request.onsuccess = (e) => resolve(e.target.result);
                    request.onerror = (e) => reject(e.target.error);
                });
            },

            async saveBlob(key, blob) {
                const db = await this.open();
                return new Promise((resolve, reject) => {
                    const tx = db.transaction(this.storeName, 'readwrite');
                    const store = tx.objectStore(this.storeName);
                    store.put(blob, key);
                    tx.oncomplete = () => db.close();
                    resolve(true); // Optimistic resolve
                });
            },

            async getBlob(key) {
                const db = await this.open();
                return new Promise((resolve, reject) => {
                    const tx = db.transaction(this.storeName, 'readonly');
                    const store = tx.objectStore(this.storeName);
                    const req = store.get(key);
                    req.onsuccess = () => resolve(req.result);
                    req.onerror = () => reject(req.error);
                    tx.oncomplete = () => db.close();
                });
            },

            async deleteBlob(key) {
                const db = await this.open();
                return new Promise((resolve, reject) => {
                    const tx = db.transaction(this.storeName, 'readwrite');
                    const store = tx.objectStore(this.storeName);
                    store.delete(key);
                    tx.oncomplete = () => db.close();
                    resolve(true);
                });
            }
        };

        // ========================================================================
        // CORE FUNCTIONS
        // ========================================================================

        const init = () => {
            loadSettings();
            // Force clear file input on init
            const fileInput = document.getElementById('settingBgFile');
            if (fileInput) fileInput.value = '';
            bindGlobalEvents();
            applySettings();
        };



        const loadSettings = () => {
            currentSettings = {
                bgType: localStorage.getItem(STORAGE_KEYS.BG_TYPE) || DEFAULTS.BG_TYPE,
                bgValue: localStorage.getItem(STORAGE_KEYS.BG_VALUE) || DEFAULTS.BG_VALUE,
                blur: localStorage.getItem(STORAGE_KEYS.BLUR) || DEFAULTS.BLUR,
                themeColor: localStorage.getItem(STORAGE_KEYS.THEME_COLOR) || DEFAULTS.THEME_COLOR,
                liteMode: localStorage.getItem(STORAGE_KEYS.LITE_MODE) || DEFAULTS.LITE_MODE,
                cursor: localStorage.getItem(STORAGE_KEYS.CURSOR) || DEFAULTS.CURSOR,
                particles: localStorage.getItem(STORAGE_KEYS.PARTICLES) || DEFAULTS.PARTICLES,
                trail: localStorage.getItem(STORAGE_KEYS.TRAIL) || DEFAULTS.TRAIL,
                uiSounds: localStorage.getItem(STORAGE_KEYS.UI_SOUNDS) || DEFAULTS.UI_SOUNDS
            };
        };

        const applySettings = async () => {
            const isLite = currentSettings.liteMode === 'true';

            document.body.classList.toggle('lite-mode', isLite);

            // 1. FONDO
            await applyBackground(isLite);

            // 2. EFECTOS VISUALES (Blur & Color)
            applyVisuals(isLite);

            // 3. CURSOR
            applyCursor(currentSettings.cursor);

            // 4. PARTÍCULAS (Disable in Lite Mode)
            applyParticles(currentSettings.particles === 'true' && !isLite);

            // 5. ESTELA DEL CURSOR
            applyTrail(currentSettings.trail === 'true' && !isLite);

            // 6. SONIDOS UI
            applyUiSounds(currentSettings.uiSounds === 'true');
        };

        const applyBackground = async (isLite) => {
            const { bgType, bgValue } = currentSettings;
            const body = document.body;

            // Reset props
            body.style.removeProperty('background-image');
            body.style.removeProperty('background-size');
            body.style.removeProperty('background-attachment');
            body.style.removeProperty('background-position');

            if (isLite) return; // Lite mode = default dark bg

            if (bgType === 'blob') {
                try {
                    const key = (bgValue && bgValue !== 'indexeddb') ? bgValue : 'custom_bg';
                    const blob = await ImageCacheStore.getBlob(key);
                    if (blob) {
                        const url = URL.createObjectURL(blob);
                        body.style.setProperty('background-image', `url('${url}')`, 'important');
                        body.style.backgroundSize = 'cover';
                        body.style.backgroundAttachment = 'fixed';
                        body.style.backgroundPosition = 'center';
                    }
                } catch (e) {
                    console.error('Err bg blob:', e);
                }
            } else if (bgType === 'url' && bgValue) {
                body.style.setProperty('background-image', `url('${bgValue}')`, 'important');
                body.style.backgroundSize = 'cover';
                body.style.backgroundAttachment = 'fixed';
                body.style.backgroundPosition = 'center';
            }
        };

        const applyVisuals = (isLite) => {
            const blurVal = isLite ? '0' : (currentSettings.blur || '0');
            const colorVal = currentSettings.themeColor || DEFAULTS.THEME_COLOR;

            document.documentElement.style.setProperty('--glass-blur', `${blurVal}px`);
            document.documentElement.style.setProperty('--primary-color', colorVal);

            // Apply blur to cards
            const elements = document.querySelectorAll('.game-card, .game-detail-container, header');
            elements.forEach(el => {
                el.style.backdropFilter = isLite ? 'none' : `blur(${blurVal}px)`;
            });
        };

        const applyCursor = async (type) => {
            // Limpiar clases anteriores
            document.body.classList.remove('cursor-crosshair', 'cursor-troll', 'static-cursor');

            // Limpiar inline style si existe (para custom/troll)
            document.body.style.cursor = '';

            if (!type || type === 'default') return;

            // Para cualquier cursor personalizado, aplicamos 'static-cursor' para forzar la herencia
            document.body.classList.add('static-cursor');

            if (type === 'custom') {
                try {
                    const blob = await ImageCacheStore.getBlob('custom_cursor');
                    if (blob) {
                        const url = URL.createObjectURL(blob);
                        document.body.style.cursor = `url('${url}'), auto`;
                    }
                } catch (e) {
                    console.error('Error loading custom cursor:', e);
                }
            } else if (type === 'troll') {
                // Force inline style using local hidden asset (moved to css/features as requested)
                document.body.style.cursor = "url('assets/css/features/null_.png'), auto";
            } else {
                // Para los tipos predefinidos (clases CSS)
                document.body.classList.add(`cursor-${type}`);
            }
        };

        // ========================================================================
        // FOLLOWING DOT (cursor follower con lag suave)
        // ========================================================================
        const applyTrail = (enabled) => {
            if (trailCleanup) {
                trailCleanup();
                trailCleanup = null;
            }

            if (!enabled) return;

            const color = currentSettings.themeColor || '#00f3ff';

            // Dot principal: anillo que sigue al mouse
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

            // Punto interior más pequeño que sigue exacto (sin lag)
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

            // Posición objetivo (mouse real) y posición actual (con lag)
            let targetX = -100, targetY = -100;
            let currentX = -100, currentY = -100;
            let animId;

            // Selectores de elementos que agrandan el dot al hover
            const HOVER_SELECTOR = '.game-card, .btn, .theme-toggle, .floating-fab, .minigame-card, .vs-mode-btn, a';

            const onMove = (e) => {
                targetX = e.clientX;
                targetY = e.clientY;

                // Mover el dot interior inmediatamente (sin lag)
                dotInner.style.transform = `translate(${targetX}px, ${targetY}px) translate(-50%, -50%)`;

                // Agrandar dot si está sobre un elemento interactivo
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
                // Lerp suave (lag natural)
                currentX += (targetX - currentX) * 0.1;
                currentY += (targetY - currentY) * 0.1;
                dot.style.transform = `translate(${currentX}px, ${currentY}px) translate(-50%, -50%)`;
                animId = requestAnimationFrame(animate);
            };

            animId = requestAnimationFrame(animate);
            document.addEventListener('mousemove', onMove);

            trailCleanup = () => {
                cancelAnimationFrame(animId);
                document.removeEventListener('mousemove', onMove);
                dot.remove();
                dotInner.remove();
            };
        };

        // ========================================================================
        // SONIDOS DE INTERFAZ (modernos, no 8-bit)
        // ========================================================================
        let uiSoundsCleanup = null;

        const applyUiSounds = (enabled) => {
            if (uiSoundsCleanup) {
                uiSoundsCleanup();
                uiSoundsCleanup = null;
            }

            if (!enabled) return;

            let audioCtx = null;
            const getCtx = () => {
                if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
                return audioCtx;
            };

            /**
             * Pop suave: sine puro, sin filtros ni sweeps fuertes.
             * Apenas perceptible — más un "toque" que un sonido.
             */
            const playPop = () => {
                try {
                    const ctx = getCtx();
                    const t = ctx.currentTime;
                    const osc = ctx.createOscillator();
                    const gain = ctx.createGain();

                    osc.type = 'sine';
                    osc.frequency.setValueAtTime(520, t);
                    osc.frequency.linearRampToValueAtTime(480, t + 0.1);

                    gain.gain.setValueAtTime(0, t);
                    gain.gain.linearRampToValueAtTime(0.06, t + 0.012);
                    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.12);

                    osc.connect(gain);
                    gain.connect(ctx.destination);
                    osc.start(t);
                    osc.stop(t + 0.14);
                } catch (_) { }
            };

            /** Click: ligeramente más agudo, igual de sutil */
            const playClick = () => {
                try {
                    const ctx = getCtx();
                    const t = ctx.currentTime;
                    const osc = ctx.createOscillator();
                    const gain = ctx.createGain();

                    osc.type = 'sine';
                    osc.frequency.setValueAtTime(680, t);
                    osc.frequency.linearRampToValueAtTime(560, t + 0.05);

                    gain.gain.setValueAtTime(0, t);
                    gain.gain.linearRampToValueAtTime(0.08, t + 0.006);
                    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.09);

                    osc.connect(gain);
                    gain.connect(ctx.destination);
                    osc.start(t);
                    osc.stop(t + 0.1);
                } catch (_) { }
            };


            // Selectores de elementos que disparan sonido
            const HOVER_SELECTOR = '.game-card, .btn, .theme-toggle, .floating-fab, .vs-mode-btn, .minigame-card, .color-btn, .option-card';

            /**
             * Detecta si el mouse ENTRÓ al elemento desde afuera
             * (no desde un hijo del mismo elemento).
             * Evita sonidos al moverse entre hijos de la misma card.
             */
            const isEnteringFromOutside = (e) => {
                const target = e.target.closest(HOVER_SELECTOR);
                if (!target) return false;
                const from = e.relatedTarget?.closest(HOVER_SELECTOR);
                // Solo dispara si entramos desde fuera del mismo elemento
                return target !== from;
            };

            const abortCtrl = new AbortController();

            // Hover: solo al entrar al elemento desde fuera
            document.body.addEventListener('mouseover', (e) => {
                if (isEnteringFromOutside(e)) playPop(480, 0.1);
            }, { signal: abortCtrl.signal });

            // Click: en cualquier elemento interactivo
            document.body.addEventListener('click', (e) => {
                if (e.target.closest(HOVER_SELECTOR)) playClick(0.13);
            }, { signal: abortCtrl.signal });

            uiSoundsCleanup = () => abortCtrl.abort();
        };

        // ========================================================================
        // SISTEMA DE PARTÍCULAS (Canvas Lightweight)
        // ========================================================================
        const applyParticles = (enabled) => {
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

            // Init Canvas
            const ctx = canvas.getContext('2d');
            let particles = [];

            const resize = () => {
                canvas.width = window.innerWidth;
                canvas.height = window.innerHeight;
            };
            window.addEventListener('resize', resize);
            resize();

            // Create Particles
            const particleCount = 50; // Keep it low for performance
            const color = currentSettings.themeColor || '#00f3ff';

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
                // Connect particles (optional, maybe too expensive? lets keep it simple)
                particleAnimationId = requestAnimationFrame(animate);
            };

            canvas.classList.add('active');
            animate();
        };

        // ========================================================================
        // UI HANDLERS (Modal)
        // ========================================================================
        const bindGlobalEvents = () => {
            const btnOpen = document.getElementById('settingsToggle');
            if (btnOpen) btnOpen.addEventListener('click', openModal);
        };

        const bindModalEvents = () => {
            // Guardar
            document.getElementById('btnSaveSettings').onclick = saveFromUI;
            document.getElementById('btnResetSettings').onclick = resetDefaults;
            document.getElementById('btnCancelSettings').onclick = closeModal;

            // Inputs Live Preview
            const inputs = {
                url: document.getElementById('settingBgUrl'),
                file: document.getElementById('settingBgFile'),
                blur: document.getElementById('settingBlur'),
                color: document.getElementById('settingColor'),
                presets: document.querySelectorAll('.color-btn'),
                cursorCards: document.querySelectorAll('.option-card'),
                particles: document.getElementById('settingParticles'),
                trail: document.getElementById('settingCursorTrail'),
                uiSounds: document.getElementById('settingUiSounds')
            };

            if (inputs.url) inputs.url.oninput = (e) => updatePreviewLocally(e.target.value);
            if (inputs.file) inputs.file.onchange = (e) => updatePreviewLocally(null, e.target.files[0]);

            if (inputs.blur) inputs.blur.oninput = (e) => document.documentElement.style.setProperty('--glass-blur', `${e.target.value}px`);

            if (inputs.color) inputs.color.oninput = (e) => updateColor(e.target.value);
            inputs.presets.forEach(btn => btn.onclick = () => updateColor(btn.dataset.color, btn));

            // Cursor Selector Logic
            const cursorCards = document.querySelectorAll('.option-card[data-cursor]');
            cursorCards.forEach(card => card.onclick = () => {
                document.querySelectorAll('.option-card').forEach(c => c.classList.remove('active'));
                card.classList.add('active');

                const cursorVal = card.dataset.cursor;
                document.getElementById('settingCursor').value = cursorVal;

                // Preview immediately (except custom, which needs save)
                if (cursorVal !== 'custom') applyCursor(cursorVal);
            });

            // Custom Cursor Upload
            const btnCustom = document.getElementById('btnCustomCursor');
            const fileInput = document.getElementById('settingCursorFile');

            if (btnCustom && fileInput) {
                btnCustom.onclick = () => fileInput.click();

                fileInput.onchange = (e) => {
                    if (e.target.files && e.target.files[0]) {
                        // Visually select the custom card
                        document.querySelectorAll('.option-card').forEach(c => c.classList.remove('active'));
                        btnCustom.classList.add('active');

                        // We use a special value 'custom' to denote we want to load from DB
                        document.getElementById('settingCursor').value = 'custom';

                        // Optional: Preview locally? 
                        // It's complex because we need to save to DB first or create blob url. 
                        // Let's just create blob URL for preview.
                        const tempUrl = URL.createObjectURL(e.target.files[0]);
                        document.documentElement.style.cursor = `url('${tempUrl}'), auto`;
                        document.body.style.cursor = `url('${tempUrl}'), auto`;

                        // Make sure we denote this card has data
                        btnCustom.dataset.cursor = 'custom';
                    }
                };
            }

            // Presets Logic
            document.getElementById('btnSavePreset').onclick = savePreset;
            loadPresetsList();
        };

        const updateColor = (color, btnElement = null) => {
            document.documentElement.style.setProperty('--primary-color', color);
            if (document.getElementById('settingColor')) document.getElementById('settingColor').value = color;

            // Update active state in preset buttons
            document.querySelectorAll('.color-btn').forEach(b => b.classList.remove('active'));
            if (btnElement) btnElement.classList.add('active');

            // Track for Achievements (Indeciso)
            if (typeof AchievementManager !== 'undefined') {
                AchievementManager.trackEvent({ type: 'COLOR_CHANGE' });
            }
        };

        const updatePreviewLocally = (url, file) => {
            const preview = document.getElementById('settingBgPreview');
            if (file) {
                const tempUrl = URL.createObjectURL(file);
                preview.style.backgroundImage = `url('${tempUrl}')`;
            } else if (url) {
                preview.style.backgroundImage = `url('${url}')`;
            }
        };

        // ========================================================================
        // MODAL STATE
        // ========================================================================
        const openModal = () => {
            const modal = document.getElementById('settingsModal');
            if (!modal) return;

            // Reload settings to get latest changes (e.g. "Use as Background" from app.js)
            loadSettings();

            // Force Clear file input to prevent "revert to blob"
            const fileInput = document.getElementById('settingBgFile');
            if (fileInput) fileInput.value = '';

            // Populate UI
            document.getElementById('settingBgUrl').value = currentSettings.bgType === 'url' ? currentSettings.bgValue : '';
            document.getElementById('settingBlur').value = currentSettings.blur;
            document.getElementById('settingColor').value = currentSettings.themeColor;
            document.getElementById('settingLiteMode').checked = currentSettings.liteMode === 'true';
            document.getElementById('settingParticles').checked = currentSettings.particles === 'true';
            document.getElementById('settingCursorTrail').checked = currentSettings.trail === 'true';
            document.getElementById('settingUiSounds').checked = currentSettings.uiSounds === 'true';

            // Set Active Cursor Card
            document.querySelectorAll('.option-card').forEach(c => {
                c.classList.toggle('active', c.dataset.cursor === currentSettings.cursor);
            });
            document.getElementById('settingCursor').value = currentSettings.cursor;

            // Visual Init
            const isUrl = currentSettings.bgType === 'url';
            document.getElementById('settingBgPreview').style.backgroundImage = isUrl ? `url('${currentSettings.bgValue}')` : '';

            bindModalEvents(); // Re-bind to ensure fresh logic
            modal.style.display = 'flex';
            void modal.offsetWidth;
            modal.classList.add('active');
            document.body.style.overflow = 'hidden';
        };

        const closeModal = () => {
            const modal = document.getElementById('settingsModal');
            modal.classList.remove('active');

            // Clear inputs for safety
            const fileInput = document.getElementById('settingBgFile');
            if (fileInput) fileInput.value = '';

            document.body.style.overflow = '';
            setTimeout(() => modal.style.display = 'none', 300);

            // Re-apply saved settings (cancel preview changes)
            // applySettings(); // actually, better not to reset everything if user just cancels, but ideally yes.
        };

        const saveFromUI = async () => {
            const btn = document.getElementById('btnSaveSettings');
            btn.innerHTML = 'Guardando...';
            btn.disabled = true;

            try {
                // Get values
                const bgFile = document.getElementById('settingBgFile').files[0];
                const bgUrl = document.getElementById('settingBgUrl').value.trim();
                const blur = document.getElementById('settingBlur').value;
                const color = document.getElementById('settingColor').value;
                const isLite = document.getElementById('settingLiteMode').checked;
                const cursor = document.getElementById('settingCursor').value;
                const particles = document.getElementById('settingParticles').checked;
                const trail = document.getElementById('settingCursorTrail').checked;
                const uiSounds = document.getElementById('settingUiSounds').checked;

                let type = 'default';
                let value = '';

                // Handle Background Priority
                if (bgFile) {
                    await ImageCacheStore.saveBlob('custom_bg', bgFile);
                    type = 'blob';
                    value = 'indexeddb';
                } else if (bgUrl) {
                    type = 'url';
                    value = bgUrl;
                } else if (currentSettings.bgType !== 'default') {
                    type = currentSettings.bgType;
                    value = currentSettings.bgValue;
                }

                // Handle Custom Cursor Upload
                // If user selected 'custom' via the UI flow (file input)
                const cursorFile = document.getElementById('settingCursorFile').files[0];
                if (cursorFile) {
                    await ImageCacheStore.saveBlob('custom_cursor', cursorFile);
                    // We don't change 'cursor' variable here because it's already 'custom' from the UI selection
                }

                // Save
                localStorage.setItem(STORAGE_KEYS.BG_TYPE, type);
                localStorage.setItem(STORAGE_KEYS.BG_VALUE, value);
                localStorage.setItem(STORAGE_KEYS.BLUR, blur);
                localStorage.setItem(STORAGE_KEYS.THEME_COLOR, color);
                localStorage.setItem(STORAGE_KEYS.LITE_MODE, isLite);
                localStorage.setItem(STORAGE_KEYS.CURSOR, cursor);
                localStorage.setItem(STORAGE_KEYS.PARTICLES, particles);
                localStorage.setItem(STORAGE_KEYS.TRAIL, trail);
                localStorage.setItem(STORAGE_KEYS.UI_SOUNDS, uiSounds);

                // --- ACHIEVEMENTS CHECK ---
                if (typeof AchievementManager !== 'undefined') {
                    // Logro: No Veo Un Carajo (Max Blur)
                    if (parseInt(blur) >= 20) AchievementManager.unlock('blur');

                    // Logro: PC del Gobierno (Lite Mode)
                    if (isLite) AchievementManager.unlock('potato');
                }

                // Update State
                currentSettings = {
                    bgType: type, bgValue: value, blur, themeColor: color,
                    liteMode: String(isLite), cursor, particles: String(particles),
                    trail: String(trail), uiSounds: String(uiSounds)
                };

                await applySettings();
                closeModal();

            } catch (e) {
                console.error(e);
                alert('Error al guardar.');
            } finally {
                btn.innerHTML = 'Guardar Cambios';
                btn.disabled = false;
            }
        };

        const resetDefaults = () => {
            if (confirm('¿Restaurar todo a fábrica?')) {
                Object.values(STORAGE_KEYS).forEach(k => localStorage.removeItem(k));
                location.reload();
            }
        };

        // ========================================================================
        // PRESETS LOGIC (Simplificada)
        // ========================================================================
        const getPresets = () => JSON.parse(localStorage.getItem('jueguitos_presets') || '[]');

        const savePreset = async () => {
            const name = document.getElementById('presetName').value.trim();
            if (!name) return;

            // Current UI values as source of truth for preset
            const bgFile = document.getElementById('settingBgFile').files[0];
            const bgUrl = document.getElementById('settingBgUrl').value.trim();

            let type = currentSettings.bgType;
            let value = currentSettings.bgValue;

            // Priority: File > URL > Current Saved
            if (bgFile) {
                // Generate a unique key for this preset's background to ensure persistence
                // and avoid overwriting the main 'custom_bg' or other presets.
                const uniqueKey = `preset_bg_${Date.now()}`;

                await ImageCacheStore.saveBlob(uniqueKey, bgFile);
                type = 'blob';
                value = uniqueKey; // Store the unique key as the value
            } else if (bgUrl) {
                type = 'url';
                value = bgUrl;
            }

            const preset = {
                id: Date.now(),
                name,
                bgType: type,
                bgValue: value,
                blur: document.getElementById('settingBlur').value,
                themeColor: document.getElementById('settingColor').value,
                cursor: document.getElementById('settingCursor').value
            };

            const list = getPresets();
            list.push(preset);
            localStorage.setItem('jueguitos_presets', JSON.stringify(list));
            loadPresetsList();
            document.getElementById('presetName').value = '';

            // Logro: Aesthetic (Crear tema propio)
            if (typeof AchievementManager !== 'undefined') {
                AchievementManager.unlock('diseño');
            }
        };

        const loadPresetsList = async () => {
            const container = document.getElementById('presetsGrid');
            const list = getPresets();
            container.innerHTML = '';

            if (list.length === 0) {
                container.innerHTML = '<div style="grid-column:1/-1; text-align:center; color:#666; font-style:italic; padding:10px;">Sin temas guardados</div>';
                return;
            }

            for (const p of list) {
                const div = document.createElement('div');
                div.className = 'preset-card';

                let bgStyle = '#333';
                if (p.bgType === 'url') {
                    bgStyle = `url('${p.bgValue}')`;
                } else if (p.bgType === 'blob') {
                    // Try to get blob for preview
                    try {
                        const blob = await ImageCacheStore.getBlob(p.bgValue);
                        if (blob) {
                            const url = URL.createObjectURL(blob);
                            bgStyle = `url('${url}')`;
                        }
                    } catch (e) {
                        console.warn('Error loading preset preview:', e);
                    }
                }

                div.innerHTML = `
                <div class="preset-preview" style="background-color: #222;">
                    <div style="width:100%; height:100%; background: ${bgStyle} center/cover no-repeat;"></div>
                    <div style="position:absolute; bottom:5px; left:5px; width:15px; height:15px; background:${p.themeColor}; border-radius:50%; border:1px solid #fff;"></div>
                </div>
                <div class="preset-info">
                    <span>${p.name}</span>
                    <span class="preset-delete" style="color:red; cursor:pointer;" title="Borrar">&times;</span>
                </div>
            `;

                // Apply Click
                div.onclick = (e) => {
                    if (e.target.classList.contains('preset-delete')) return;
                    applyPreset(p);
                };

                // Delete Click
                div.querySelector('.preset-delete').onclick = async () => {
                    if (!confirm('¿Borrar este tema?')) return;

                    // If it's a blob, delete from DB to save space
                    if (p.bgType === 'blob') {
                        await ImageCacheStore.deleteBlob(p.bgValue);
                    }

                    const newList = getPresets().filter(item => item.id !== p.id);
                    localStorage.setItem('jueguitos_presets', JSON.stringify(newList));
                    loadPresetsList();
                };

                container.appendChild(div);
            }
        };

        const applyPreset = async (p) => {
            // Update State
            currentSettings = {
                ...currentSettings,
                bgType: p.bgType,
                bgValue: p.bgValue,
                blur: p.blur,
                themeColor: p.themeColor,
                cursor: p.cursor || 'default'
            };

            // Save to Storage
            localStorage.setItem(STORAGE_KEYS.BG_TYPE, p.bgType);
            localStorage.setItem(STORAGE_KEYS.BG_VALUE, p.bgValue);
            localStorage.setItem(STORAGE_KEYS.BLUR, p.blur);
            localStorage.setItem(STORAGE_KEYS.THEME_COLOR, p.themeColor);
            localStorage.setItem(STORAGE_KEYS.CURSOR, p.cursor || 'default');

            // Apply & Refresh UI
            await applySettings();
            openModal();
        };

        return {
            init,
            applySettings
        };
    })();
}

document.addEventListener('DOMContentLoaded', () => {
    if (window.SettingsManager) window.SettingsManager.init();
});
