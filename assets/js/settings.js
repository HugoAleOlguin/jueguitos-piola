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
            CURSOR: 'jueguitos_settings_cursor',     // Nuevo
            PARTICLES: 'jueguitos_settings_particles' // Nuevo
        };

        const DEFAULTS = {
            BG_TYPE: 'default',
            BG_VALUE: '',
            BLUR: '0',
            THEME_COLOR: '#00f3ff',
            LITE_MODE: 'false',
            CURSOR: 'default',
            PARTICLES: 'false'
        };

        // Estado actual
        let currentSettings = {};
        let particleAnimationId = null; // Para detener la animación

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
                particles: localStorage.getItem(STORAGE_KEYS.PARTICLES) || DEFAULTS.PARTICLES
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

        const applyCursor = (type) => {
            document.body.classList.remove('cursor-retro', 'cursor-crosshair', 'cursor-neon');
            if (type && type !== 'default') {
                document.body.classList.add(`cursor-${type}`);
            }
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
                cursorCards: document.querySelectorAll('.option-card'), // Cursors
                particles: document.getElementById('settingParticles') // Particles Toggle
            };

            if (inputs.url) inputs.url.oninput = (e) => updatePreviewLocally(e.target.value);
            if (inputs.file) inputs.file.onchange = (e) => updatePreviewLocally(null, e.target.files[0]);

            if (inputs.blur) inputs.blur.oninput = (e) => document.documentElement.style.setProperty('--glass-blur', `${e.target.value}px`);

            if (inputs.color) inputs.color.oninput = (e) => updateColor(e.target.value);
            inputs.presets.forEach(btn => btn.onclick = () => updateColor(btn.dataset.color, btn));

            // Cursor Selector Logic
            inputs.cursorCards.forEach(card => card.onclick = () => {
                document.querySelectorAll('.option-card').forEach(c => c.classList.remove('active'));
                card.classList.add('active');
                document.getElementById('settingCursor').value = card.dataset.cursor;
                // Optional: Apply immediately? No, wait for save. But we can preview.
                applyCursor(card.dataset.cursor);
            });

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

                let type = 'default';
                let value = '';

                // Handle Background Priority
                if (bgFile) {
                    await ImageCacheStore.saveBlob('custom_bg', bgFile);
                    type = 'blob'; // 'indexeddb'
                    value = 'indexeddb';
                } else if (bgUrl) {
                    type = 'url';
                    value = bgUrl;
                } else if (currentSettings.bgType !== 'default') {
                    type = currentSettings.bgType;
                    value = currentSettings.bgValue;
                }

                // Save
                localStorage.setItem(STORAGE_KEYS.BG_TYPE, type);
                localStorage.setItem(STORAGE_KEYS.BG_VALUE, value);
                localStorage.setItem(STORAGE_KEYS.BLUR, blur);
                localStorage.setItem(STORAGE_KEYS.THEME_COLOR, color);
                localStorage.setItem(STORAGE_KEYS.LITE_MODE, isLite);
                localStorage.setItem(STORAGE_KEYS.CURSOR, cursor);
                localStorage.setItem(STORAGE_KEYS.PARTICLES, particles);

                // Update State
                currentSettings = {
                    bgType: type, bgValue: value, blur, themeColor: color,
                    liteMode: String(isLite), cursor, particles: String(particles)
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

        return { init };
    })();
}

document.addEventListener('DOMContentLoaded', () => {
    if (window.SettingsManager) window.SettingsManager.init();
});
