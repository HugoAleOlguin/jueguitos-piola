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
        THEME_COLOR: 'jueguitos_settings_color'  // Primary color override
    };

    const DEFAULTS = {
        BG_TYPE: 'default',
        BG_VALUE: '',
        BLUR: '0',
        THEME_COLOR: '#00f3ff'
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
    let inputBgUrl, inputBgFile, previewBg, inputBlur, inputColor;

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
                }
            });
        });

        // Theme Presets
        const btnSavePreset = document.getElementById('btnSavePreset');
        if (btnSavePreset) {
            btnSavePreset.addEventListener('click', savePreset);
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
            themeColor: localStorage.getItem(STORAGE_KEYS.THEME_COLOR) || DEFAULTS.THEME_COLOR
        };
    };

    const applySettings = async () => {
        // Apply Background
        const { bgType, bgValue } = currentSettings;

        if (bgType === 'blob') {
            try {
                // Load from IndexedDB
                // Use stored key (bgValue) if it looks like a key (starts with 'preset_' or is 'custom_bg'), otherwise default
                const key = (bgValue && bgValue !== 'indexeddb') ? bgValue : 'custom_bg';

                const blob = await ImageCacheStore.getBlob(key);
                if (blob) {
                    const url = URL.createObjectURL(blob);
                    document.body.style.backgroundImage = `url('${url}')`;
                    document.body.style.backgroundSize = 'cover';
                    document.body.style.backgroundAttachment = 'fixed';
                    document.body.style.backgroundPosition = 'center';
                } else {
                    console.warn('Background blob not found in DB:', key);
                    document.body.style.backgroundImage = '';
                }
            } catch (e) {
                console.error('Error loading blob bg:', e);
            }
        } else if (bgType === 'url' || bgType === 'custom') {
            document.body.style.backgroundImage = `url('${bgValue}')`;
            document.body.style.backgroundSize = 'cover';
            document.body.style.backgroundAttachment = 'fixed';
            document.body.style.backgroundPosition = 'center';
        } else {
            // Revert to CSS default
            document.body.style.backgroundImage = '';
            document.body.style.backgroundSize = '';
            document.body.style.backgroundAttachment = '';
            document.body.style.backgroundPosition = '';
        }

        // Apply Blur
        const blurVal = currentSettings.blur || '0';
        document.documentElement.style.setProperty('--glass-blur', `${blurVal}px`);

        document.querySelectorAll('.game-card, .game-detail-container, header').forEach(el => {
            el.style.backdropFilter = `blur(${blurVal}px)`;
            el.style.webkitBackdropFilter = `blur(${blurVal}px)`;
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

        // Refresh Presets List
        loadPresetsList();

        // Preview
        // Note: For 'blob' type, we can't easily preview without re-fetching, 
        // so we might leave it blank or fetch it. For perf, let's leave blank or show 'Custom Image Loaded' text.
        if (currentSettings.bgType === 'url') {
            previewBg.style.backgroundImage = `url('${currentSettings.bgValue}')`;
        } else if (currentSettings.bgType === 'blob') {
            previewBg.style.backgroundImage = '';
            // Ideally show a placeholder or fetch blob again. 
            // Skipping for simplicity/perf unless user re-selects.
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
            let type = 'default';
            let value = '';

            // 1. File Upload (Blob)
            if (inputBgFile.files && inputBgFile.files[0]) {
                const file = inputBgFile.files[0];

                // Store in IDB
                await ImageCacheStore.saveBlob('custom_bg', file);

                type = 'blob';
                value = 'indexeddb'; // Placeholder flag

                // 2. URL Input
            } else if (inputBgUrl.value.trim()) {
                type = 'url';
                value = inputBgUrl.value.trim();

                // 3. Current Setting (Preserve if no change)
            } else if (currentSettings.bgType !== 'default') {
                type = currentSettings.bgType;
                value = currentSettings.bgValue;
            }

            // Save Config
            localStorage.setItem(STORAGE_KEYS.BG_TYPE, type);
            localStorage.setItem(STORAGE_KEYS.BG_VALUE, value);
            localStorage.setItem(STORAGE_KEYS.BLUR, blur);
            localStorage.setItem(STORAGE_KEYS.THEME_COLOR, themeColor);

            // Update State
            currentSettings = { bgType: type, bgValue: value, blur, themeColor };

            await applySettings();
            closeModal();
            // location.reload(); // Removed reload for SPA feel, applySettings handles it.

        } catch (err) {
            console.error(err);
            alert('Error al guardar configuración: ' + err.message);
        } finally {
            btnSave.innerText = originalText;
            btnSave.disabled = false;
            // Also refresh presets in case we saved over one (not implemented yet but good practice)
        }
    };

    const resetDefaults = () => {
        localStorage.removeItem(STORAGE_KEYS.BG_TYPE);
        localStorage.removeItem(STORAGE_KEYS.BG_VALUE);
        localStorage.removeItem(STORAGE_KEYS.BLUR);
        localStorage.removeItem(STORAGE_KEYS.THEME_COLOR);
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
            // Capture current state from UI or stored State? Stored state is safer as it represents what's applied.
            // But if user changed UI but didn't click "Save", we might want to capture UI?
            // User flow: Change settings -> Click "Save Preset" or "Save Changes". 
            // Usually "Save Preset" acts as saving the snapshot. I should grab from UI inputs?
            // Actually, safe bet: Grab from currentSettings (APPLIED settings). 
            // If user wants to save what they see in preview, they must Apply first? 
            // Better: Grab from UI Inputs to allow saving "Concept" without applying.

            // Getting values from UI similar to saveFromUI
            const blur = inputBlur ? inputBlur.value : '0';
            const themeColor = inputColor ? inputColor.value : DEFAULTS.THEME_COLOR;
            let type = 'default';
            let value = '';

            // Handle blob logic for PRESET
            if (inputBgFile.files && inputBgFile.files[0]) {
                // User picked a new file for this preset
                const file = inputBgFile.files[0];
                const key = `preset_${Date.now()}`;
                await ImageCacheStore.saveBlob(key, file);
                type = 'blob';
                value = key;
            } else if (currentSettings.bgType === 'blob' && !inputBgUrl.value.trim()) {
                // User is using existing blob. Copy it to new preset key to ensure persistence.
                const currentKey = (currentSettings.bgValue && currentSettings.bgValue !== 'indexeddb') ? currentSettings.bgValue : 'custom_bg';
                const currentBlob = await ImageCacheStore.getBlob(currentKey);
                if (currentBlob) {
                    const key = `preset_${Date.now()}`;
                    await ImageCacheStore.saveBlob(key, currentBlob);
                    type = 'blob';
                    value = key;
                } else {
                    // Fallback
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
                // Try to load blob for preview?
                // For perf, maybe we skip or load generic?
                // Let's try loading it.
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
            themeColor: p.themeColor
        };

        // Save to main storage so it persists as "Current"
        localStorage.setItem(STORAGE_KEYS.BG_TYPE, p.bgType);
        localStorage.setItem(STORAGE_KEYS.BG_VALUE, p.bgValue);
        localStorage.setItem(STORAGE_KEYS.BLUR, p.blur);
        localStorage.setItem(STORAGE_KEYS.THEME_COLOR, p.themeColor);

        await applySettings();
        // Update UI inputs to reflect new state
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
                // Safety Check: Don't delete blob if it's currently active!
                const activeKey = (currentSettings.bgValue && currentSettings.bgValue !== 'indexeddb') ? currentSettings.bgValue : 'custom_bg';

                if (activeKey === target.bgValue) {
                    console.warn('[Settings] Prevented deletion of active background blob!');
                } else {
                    try {
                        await ImageCacheStore.deleteBlob(target.bgValue);
                        console.log('[Settings] Deleted associated blob:', target.bgValue);
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
