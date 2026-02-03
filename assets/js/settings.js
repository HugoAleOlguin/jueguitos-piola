/**
 * SETTINGS.JS - Advanced Configuration Manager
 * Handles user preferences for background, music, and other visual settings.
 */

const SettingsManager = (() => {
    // Constants
    const STORAGE_KEYS = {
        BG_TYPE: 'jueguitos_settings_bg_type',   // 'default', 'url', 'custom', 'blob'
        BG_VALUE: 'jueguitos_settings_bg_value', // URL string or 'indexeddb'
        BLUR: 'jueguitos_settings_blur',         // Blur intensity
        THEME_COLOR: 'jueguitos_settings_color',  // Primary color override
        LITE_MODE: 'jueguitos_settings_lite'     // Lite Mode (true/false)
    };

    const DEFAULTS = {
        BG_TYPE: 'default',
        BG_VALUE: '',
        BLUR: '0',
        THEME_COLOR: '#00f3ff',
        LITE_MODE: 'false'
    };

    // ========================================================================
    // INDEXED DB MANAGER (For Large Files)
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
                const req = store.put(blob, key);
                req.onsuccess = () => resolve(true);
                req.onerror = () => reject(req.error);
                tx.oncomplete = () => db.close();
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
                const req = store.delete(key);
                req.onsuccess = () => resolve(true);
                req.onerror = () => reject(req.error);
                tx.oncomplete = () => db.close();
            });
        }
    };

    // DOM Elements
    let modal, btnOpen, btnSave, btnReset, btnCancel;
    let inputBgUrl, inputBgFile, previewBg, inputBlur, inputColor, inputLite;

    // State
    let currentSettings = {};

    // ========================================================================
    // INITIALIZATION
    // ========================================================================
    const init = () => {
        loadSettings();
        cacheDOM();
        bindEvents();
        applySettings();
    };

    const cacheDOM = () => {
        modal = document.getElementById('settingsModal');
        btnOpen = document.getElementById('settingsToggle');
        btnSave = document.getElementById('btnSaveSettings');
        btnReset = document.getElementById('btnResetSettings');
        btnCancel = document.getElementById('btnCancelSettings');

        inputBgUrl = document.getElementById('settingBgUrl');
        inputBgFile = document.getElementById('settingBgFile');
        previewBg = document.getElementById('settingBgPreview');
        inputBlur = document.getElementById('settingBlur');
        inputColor = document.getElementById('settingColor');
        inputLite = document.getElementById('settingLiteMode');
    };

    const bindEvents = () => {
        if (!btnOpen) return;

        // Modal Open/Close
        btnOpen.addEventListener('click', openModal);
        btnCancel.addEventListener('click', closeModal);

        // Save & Reset
        btnSave.addEventListener('click', saveFromUI);
        btnReset.addEventListener('click', resetDefaults);

        // Inputs
        inputBgUrl.addEventListener('input', updatePreviewFromUrl);
        inputBgFile.addEventListener('change', updatePreviewFromFile);

        // Live Preview & Presets
        if (inputBlur) {
            inputBlur.addEventListener('input', (e) => {
                updateLivePreview('blur', e.target.value);
            });
        }

        if (inputColor) {
            inputColor.addEventListener('input', (e) => {
                updateLivePreview('color', e.target.value);
                highlightActivePreset(e.target.value);
                if (typeof AchievementManager !== 'undefined') AchievementManager.trackEvent({ type: 'COLOR_CHANGE' });
            });
        }

        // Color Presets
        document.querySelectorAll('.color-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const color = e.target.dataset.color;
                if (inputColor && color) {
                    inputColor.value = color;
                    updateLivePreview('color', color);
                    highlightActivePreset(color);
                    if (typeof AchievementManager !== 'undefined') AchievementManager.trackEvent({ type: 'COLOR_CHANGE' });
                }
            });
        });

        // Theme Presets
        const btnSavePreset = document.getElementById('btnSavePreset');
        if (btnSavePreset) {
            btnSavePreset.addEventListener('click', savePreset);
        }

        // Achievements Reset
        const btnResetAch = document.getElementById('btnResetAchievements');
        if (btnResetAch) {
            btnResetAch.addEventListener('click', () => {
                if (confirm('¿Seguro que querés borrar todos los logros? No hay vuelta atrás.')) {
                    if (typeof AchievementManager !== 'undefined') {
                        AchievementManager.reset();
                        renderAchievements();
                    }
                }
            });
        }
    };

    // ========================================================================
    // LOGIC
    // ========================================================================
    const loadSettings = () => {
        currentSettings = {
            bgType: localStorage.getItem(STORAGE_KEYS.BG_TYPE) || DEFAULTS.BG_TYPE,
            bgValue: localStorage.getItem(STORAGE_KEYS.BG_VALUE) || DEFAULTS.BG_VALUE,
            blur: localStorage.getItem(STORAGE_KEYS.BLUR) || DEFAULTS.BLUR,
            themeColor: localStorage.getItem(STORAGE_KEYS.THEME_COLOR) || DEFAULTS.THEME_COLOR,
            liteMode: localStorage.getItem(STORAGE_KEYS.LITE_MODE) || DEFAULTS.LITE_MODE
        };
    };

    const applySettings = async () => {
        // Apply Lite Mode First (Needs to block heavy effects)
        const isLite = currentSettings.liteMode === 'true';
        if (isLite) {
            document.body.classList.add('lite-mode');
        } else {
            document.body.classList.remove('lite-mode');
        }

        // Apply Background
        const { bgType, bgValue } = currentSettings;

        if (isLite) {
            // In Lite Mode, force simple background or solid color
            document.body.style.backgroundImage = 'none'; // Clear heavy images
            // Maybe set a clean dark color via CSS class, but we clear manual styles here
            document.body.style.backgroundSize = '';
            document.body.style.backgroundAttachment = '';
            document.body.style.backgroundPosition = '';
        } else {
            // Normal Background Logic
            if (bgType === 'blob') {
                try {
                    const key = (bgValue && bgValue !== 'indexeddb') ? bgValue : 'custom_bg';
                    const blob = await ImageCacheStore.getBlob(key);
                    if (blob) {
                        const url = URL.createObjectURL(blob);
                        document.body.style.backgroundImage = `url('${url}')`;
                        document.body.style.backgroundSize = 'cover';
                        document.body.style.backgroundAttachment = 'fixed';
                        document.body.style.backgroundPosition = 'center';
                    } else {
                        document.body.style.backgroundImage = '';
                    }
                } catch (e) { console.error(e); }
            } else if (bgType === 'url' || bgType === 'custom') {
                document.body.style.backgroundImage = `url('${bgValue}')`;
                document.body.style.backgroundSize = 'cover';
                document.body.style.backgroundAttachment = 'fixed';
                document.body.style.backgroundPosition = 'center';
            } else {
                document.body.style.backgroundImage = '';
                document.body.style.backgroundSize = '';
                document.body.style.backgroundAttachment = '';
                document.body.style.backgroundPosition = '';
            }
        }

        // Apply Blur
        // If Lite Mode, Blur should be 0 regardless of setting
        const blurVal = isLite ? '0' : (currentSettings.blur || '0');
        document.documentElement.style.setProperty('--glass-blur', `${blurVal}px`);

        // Optimizing selectors
        const elementsToBlur = document.querySelectorAll('.game-card, .game-detail-container, header');
        elementsToBlur.forEach(el => {
            el.style.backdropFilter = isLite ? 'none' : `blur(${blurVal}px)`;
            el.style.webkitBackdropFilter = isLite ? 'none' : `blur(${blurVal}px)`;
        });

        // Apply Theme Color
        const colorVal = currentSettings.themeColor || DEFAULTS.THEME_COLOR;
        document.documentElement.style.setProperty('--primary-color', colorVal);
    };

    const openModal = () => {
        // Populate UI
        inputBgUrl.value = currentSettings.bgType === 'url' ? currentSettings.bgValue : '';
        if (inputBlur) inputBlur.value = parseInt(currentSettings.blur || 0);
        if (inputColor) {
            inputColor.value = currentSettings.themeColor || DEFAULTS.THEME_COLOR;
            highlightActivePreset(inputColor.value);
        }
        if (inputLite) {
            inputLite.checked = currentSettings.liteMode === 'true';
        }

        loadPresetsList();

        // Preview
        if (currentSettings.bgType === 'url') {
            previewBg.style.backgroundImage = `url('${currentSettings.bgValue}')`;
        } else {
            previewBg.style.backgroundImage = '';
        }

        modal.classList.add('active');
        document.body.style.overflow = 'hidden';


    };

    const closeModal = () => {
        modal.classList.remove('active');
        document.body.style.overflow = '';
    };

    const saveFromUI = async () => {
        const btnSave = document.getElementById('btnSaveSettings');
        const originalText = btnSave.innerText;
        btnSave.innerText = 'Guardando...';
        btnSave.disabled = true;

        try {
            const blur = inputBlur ? inputBlur.value : '0';
            const themeColor = inputColor ? inputColor.value : DEFAULTS.THEME_COLOR;
            const isLite = inputLite ? inputLite.checked : false;
            let type = 'default';
            let value = '';

            // 1. File Upload (Blob)
            if (inputBgFile.files && inputBgFile.files[0]) {
                const file = inputBgFile.files[0];
                await ImageCacheStore.saveBlob('custom_bg', file);
                type = 'blob';
                value = 'indexeddb';
            } else if (inputBgUrl.value.trim()) {
                type = 'url';
                value = inputBgUrl.value.trim();
            } else if (currentSettings.bgType !== 'default') {
                type = currentSettings.bgType;
                value = currentSettings.bgValue;
            }

            // Save Config
            localStorage.setItem(STORAGE_KEYS.BG_TYPE, type);
            localStorage.setItem(STORAGE_KEYS.BG_VALUE, value);
            localStorage.setItem(STORAGE_KEYS.BLUR, blur);
            localStorage.setItem(STORAGE_KEYS.THEME_COLOR, themeColor);
            localStorage.setItem(STORAGE_KEYS.LITE_MODE, isLite);

            // Achievement: Potato (Lite Mode)
            if (isLite && typeof AchievementManager !== 'undefined') AchievementManager.unlock('potato');

            // Achievement: Blur (Max Blur > 18)
            if (blur >= 18 && typeof AchievementManager !== 'undefined') AchievementManager.unlock('blur');

            // Achievement: Custom BG (Designer/Own World from previous list, or just part of 'diseño'?)
            // Users list removed 'custom_bg' but 'diseño' is preset.
            // Let's stick to user list: 'diseño' = preset personalized.

            // Update State
            currentSettings = { bgType: type, bgValue: value, blur, themeColor, liteMode: String(isLite) };

            await applySettings();
            closeModal();
        } catch (err) {
            console.error(err);
            alert('Error al guardar configuración: ' + err.message);
        } finally {
            btnSave.innerText = originalText;
            btnSave.disabled = false;
        }
    };

    const resetDefaults = () => {
        localStorage.removeItem(STORAGE_KEYS.BG_TYPE);
        localStorage.removeItem(STORAGE_KEYS.BG_VALUE);
        localStorage.removeItem(STORAGE_KEYS.BLUR);
        localStorage.removeItem(STORAGE_KEYS.THEME_COLOR);
        localStorage.removeItem(STORAGE_KEYS.LITE_MODE);
        location.reload();
    };

    // ========================================================================
    // PRESETS MANAGER
    // ========================================================================
    const getPresets = () => JSON.parse(localStorage.getItem('jueguitos_presets') || '[]');

    const savePreset = async () => {
        const nameInput = document.getElementById('presetName');
        const name = nameInput.value.trim();
        if (!name) return alert('Escribe un nombre para el tema.');

        const btn = document.getElementById('btnSavePreset');
        btn.disabled = true;
        btn.innerText = '...';

        try {
            const presets = getPresets();

            // Getting values from UI
            const blur = inputBlur ? inputBlur.value : '0';
            const themeColor = inputColor ? inputColor.value : DEFAULTS.THEME_COLOR;
            let type = 'default';
            let value = '';

            // Handle blob logic for PRESET
            if (inputBgFile.files && inputBgFile.files[0]) {
                const file = inputBgFile.files[0];
                const key = `preset_${Date.now()}`;
                await ImageCacheStore.saveBlob(key, file);
                type = 'blob';
                value = key;
            } else if (currentSettings.bgType === 'blob' && !inputBgUrl.value.trim()) {
                const currentKey = (currentSettings.bgValue && currentSettings.bgValue !== 'indexeddb') ? currentSettings.bgValue : 'custom_bg';
                const currentBlob = await ImageCacheStore.getBlob(currentKey);
                if (currentBlob) {
                    const key = `preset_${Date.now()}`;
                    await ImageCacheStore.saveBlob(key, currentBlob);
                    type = 'blob';
                    value = key;
                } else {
                    type = 'default';
                }
            } else if (inputBgUrl.value.trim()) {
                type = 'url';
                value = inputBgUrl.value.trim();
            } else if (currentSettings.bgType !== 'default') {
                type = currentSettings.bgType;
                value = currentSettings.bgValue;
            }

            const newPreset = {
                id: Date.now(),
                name,
                bgType: type,
                bgValue: value,
                blur,
                themeColor
            };

            presets.push(newPreset);
            localStorage.setItem('jueguitos_presets', JSON.stringify(presets));

            // Achievement: Diseño (Save Preset)
            if (typeof AchievementManager !== 'undefined') AchievementManager.unlock('diseño');

            nameInput.value = '';
            loadPresetsList();

        } catch (e) {
            console.error(e);
            alert('Error al guardar preset');
        } finally {
            btn.disabled = false;
            btn.innerText = 'Guardar';
        }
    };

    const loadPresetsList = async () => {
        const container = document.getElementById('presetsGrid');
        if (!container) return;

        const presets = getPresets();
        container.innerHTML = '';
        console.log('[Settings] Loading presets list. Count:', presets.length);

        if (presets.length === 0) {
            container.innerHTML = '<div class="preset-empty" style="text-align: center; padding: 20px; color: #666; font-style: italic; grid-column: 1/-1;">No hay temas guardados</div>';
            return;
        }

        for (const p of presets) {
            const card = document.createElement('div');
            card.className = 'preset-card';

            const isActive = p.bgType === currentSettings.bgType &&
                p.bgValue === currentSettings.bgValue &&
                p.themeColor === currentSettings.themeColor;

            if (isActive) card.classList.add('active-preset');

            // Preview Logic
            let bgStyle = 'background-color: #222;';
            if (p.bgType === 'url') {
                bgStyle = `background-image: url('${p.bgValue}');`;
            } else if (p.bgType === 'blob') {
                try {
                    const blob = await ImageCacheStore.getBlob(p.bgValue);
                    if (blob) {
                        const url = URL.createObjectURL(blob);
                        bgStyle = `background-image: url('${url}');`;
                    }
                } catch (e) { }
            }

            card.innerHTML = `
                <div class="preset-preview" style="${bgStyle}">
                    <div class="preset-color-dot" style="background-color: ${p.themeColor}"></div>
                </div>
                <div class="preset-info">
                    <span class="preset-name" title="${p.name}">${p.name}</span>
                    <button class="preset-delete" title="Borrar">x</button>
                </div>
            `;

            // Apply Click
            card.addEventListener('click', (e) => {
                if (e.target.classList.contains('preset-delete')) return;
                applyPreset(p);
            });

            // Delete Click
            card.querySelector('.preset-delete').addEventListener('click', (e) => {
                e.stopPropagation();
                deletePreset(p.id);
            });

            container.appendChild(card);
        }
    };

    const applyPreset = async (p) => {
        console.log('[Settings] Applying preset:', p.name);
        currentSettings = {
            bgType: p.bgType,
            bgValue: p.bgValue,
            blur: p.blur,
            themeColor: p.themeColor,
            liteMode: currentSettings.liteMode // Keep current Lite Mode status
        };

        // Save to main storage
        localStorage.setItem(STORAGE_KEYS.BG_TYPE, p.bgType);
        localStorage.setItem(STORAGE_KEYS.BG_VALUE, p.bgValue);
        localStorage.setItem(STORAGE_KEYS.BLUR, p.blur);
        localStorage.setItem(STORAGE_KEYS.THEME_COLOR, p.themeColor);
        // Note: Presets don't store "Lite Mode" state, it's global preference.

        await applySettings();
        // Update UI inputs
        if (inputBgUrl) inputBgUrl.value = (p.bgType === 'url') ? p.bgValue : '';
        if (inputBlur) inputBlur.value = p.blur;
        if (inputColor) inputColor.value = p.themeColor;

        closeModal();
    };

    const deletePreset = async (id) => {
        let presets = getPresets();
        const target = presets.find(p => p.id === id);

        if (target) {
            console.log('[Settings] Deleting preset:', target.name);

            if (target.bgType === 'blob') {
                const activeKey = (currentSettings.bgValue && currentSettings.bgValue !== 'indexeddb') ? currentSettings.bgValue : 'custom_bg';
                if (activeKey === target.bgValue) {
                    console.warn('[Settings] Prevented deletion of active background blob!');
                } else {
                    try {
                        await ImageCacheStore.deleteBlob(target.bgValue);
                    } catch (e) { console.error(e); }
                }
            }
        }

        presets = presets.filter(p => p.id !== id);
        localStorage.setItem('jueguitos_presets', JSON.stringify(presets));
        loadPresetsList();
    };

    // ========================================================================
    // HELPERS
    // ========================================================================

    const updateLivePreview = (type, value) => {
        if (type === 'blur') {
            document.documentElement.style.setProperty('--glass-blur', `${value}px`);
        }
        if (type === 'color') {
            document.documentElement.style.setProperty('--primary-color', value);
        }
    };

    const highlightActivePreset = (color) => {
        document.querySelectorAll('.color-btn').forEach(btn => {
            if (btn.dataset.color.toLowerCase() === color.toLowerCase()) {
                btn.classList.add('active');
            } else {
                btn.classList.remove('active');
            }
        });
    };

    const updatePreviewFromUrl = (e) => {
        const url = e.target.value;
        if (url) previewBg.style.backgroundImage = `url('${url}')`;
    };

    const updatePreviewFromFile = (e) => {
        const file = e.target.files[0];
        if (file) {
            const tempUrl = URL.createObjectURL(file);
            previewBg.style.backgroundImage = `url('${tempUrl}')`;
            const label = document.querySelector('label[for="settingBgFile"]');
            if (label) label.innerHTML = `📄 ${file.name}`;
        }
    };



    // Public API
    return {
        init
    };
})();

// Auto-init
document.addEventListener('DOMContentLoaded', SettingsManager.init);
