/**
 * SETTINGS.JS - Gestor de Configuración
 * Maneja: Fondo, Blur, Color, Modo Lite, Presets de Tema
 */

const SettingsManager = (() => {
    // Claves de localStorage
    const STORAGE_KEYS = {
        BG_TYPE: 'jueguitos_settings_bg_type',   // 'default', 'url', 'custom', 'blob'
        BG_VALUE: 'jueguitos_settings_bg_value', // URL string o 'indexeddb'
        BLUR: 'jueguitos_settings_blur',         // Intensidad de blur
        THEME_COLOR: 'jueguitos_settings_color', // Color primario personalizado
        LITE_MODE: 'jueguitos_settings_lite'     // Modo Lite (true/false)
    };

    const DEFAULTS = {
        BG_TYPE: 'default',
        BG_VALUE: '',
        BLUR: '0',
        THEME_COLOR: '#00f3ff',
        LITE_MODE: 'false'
    };

    // ========================================================================
    // INDEXED DB (Almacenamiento de archivos grandes como imágenes/GIFs)
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

    // Elementos DOM (se cachean en init)
    let modal, btnOpen, btnSave, btnReset, btnCancel;
    let inputBgUrl, inputBgFile, previewBg, inputBlur, inputColor, inputLite;

    // Estado actual
    let currentSettings = {};

    // ========================================================================
    // INICIALIZACIÓN
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

        // Modal: Abrir / Cerrar
        btnOpen.addEventListener('click', openModal);
        btnCancel.addEventListener('click', closeModal);

        // Guardar y Resetear
        btnSave.addEventListener('click', saveFromUI);
        btnReset.addEventListener('click', resetDefaults);

        // Inputs de fondo
        inputBgUrl.addEventListener('input', updatePreviewFromUrl);
        inputBgFile.addEventListener('change', updatePreviewFromFile);

        // Vista previa en vivo: Blur
        if (inputBlur) {
            inputBlur.addEventListener('input', (e) => {
                updateLivePreview('blur', e.target.value);
            });
        }

        // Vista previa en vivo: Color
        if (inputColor) {
            inputColor.addEventListener('input', (e) => {
                updateLivePreview('color', e.target.value);
                highlightActivePreset(e.target.value);
                if (typeof AchievementManager !== 'undefined') AchievementManager.trackEvent({ type: 'COLOR_CHANGE' });
            });
        }

        // Botones de colores predefinidos
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

        // Guardar Preset de Tema
        const btnSavePreset = document.getElementById('btnSavePreset');
        if (btnSavePreset) {
            btnSavePreset.addEventListener('click', savePreset);
        }

        // Reset de Logros
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
    // LÓGICA PRINCIPAL
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

    /**
     * Aplica el fondo al body.
     * Usa setProperty con 'important' para ganarle a reglas CSS como
     * lite-mode.css y retro.css que usan !important en background.
     */
    const setBodyBg = (imageValue, size, attachment, position) => {
        const body = document.body;
        body.style.setProperty('background-image', imageValue, 'important');
        body.style.setProperty('background-size', size || '', 'important');
        body.style.setProperty('background-attachment', attachment || '');
        body.style.setProperty('background-position', position || '');
    };

    const applySettings = async () => {
        // Modo Lite primero (bloquea efectos pesados)
        const isLite = currentSettings.liteMode === 'true';
        if (isLite) {
            document.body.classList.add('lite-mode');
        } else {
            document.body.classList.remove('lite-mode');
        }

        // Aplicar fondo
        const { bgType, bgValue } = currentSettings;

        if (isLite) {
            // En Modo Lite, forzar fondo sólido
            setBodyBg('none', '', '', '');
        } else {
            if (bgType === 'blob') {
                try {
                    const key = (bgValue && bgValue !== 'indexeddb') ? bgValue : 'custom_bg';
                    const blob = await ImageCacheStore.getBlob(key);
                    if (blob) {
                        const url = URL.createObjectURL(blob);
                        setBodyBg(`url('${url}')`, 'cover', 'fixed', 'center');
                    } else {
                        // Blob no encontrado — volver a default
                        console.warn('[Settings] Blob no encontrado para key:', key);
                        setBodyBg('', '', '', '');
                    }
                } catch (e) {
                    console.error('[Settings] Error cargando fondo blob:', e);
                    setBodyBg('', '', '', '');
                }
            } else if (bgType === 'url' || bgType === 'custom') {
                setBodyBg(`url('${bgValue}')`, 'cover', 'fixed', 'center');
            } else {
                // Modo default — quitar overrides inline para que se vean los gradientes CSS
                document.body.style.removeProperty('background-image');
                document.body.style.removeProperty('background-size');
                document.body.style.removeProperty('background-attachment');
                document.body.style.removeProperty('background-position');
            }
        }

        // Aplicar Blur (en Modo Lite siempre es 0)
        const blurVal = isLite ? '0' : (currentSettings.blur || '0');
        document.documentElement.style.setProperty('--glass-blur', `${blurVal}px`);

        const elementsToBlur = document.querySelectorAll('.game-card, .game-detail-container, header');
        elementsToBlur.forEach(el => {
            el.style.backdropFilter = isLite ? 'none' : `blur(${blurVal}px)`;
            el.style.webkitBackdropFilter = isLite ? 'none' : `blur(${blurVal}px)`;
        });

        // Aplicar color primario
        const colorVal = currentSettings.themeColor || DEFAULTS.THEME_COLOR;
        document.documentElement.style.setProperty('--primary-color', colorVal);
    };

    const openModal = () => {
        // Poblar UI con valores actuales
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

        // Vista previa del fondo actual
        if (currentSettings.bgType === 'url') {
            previewBg.style.backgroundImage = `url('${currentSettings.bgValue}')`;
        } else {
            previewBg.style.backgroundImage = '';
        }

        modal.style.display = 'flex';
        // Force reflow
        void modal.offsetWidth;
        modal.classList.add('active');
        document.body.style.overflow = 'hidden';
    };

    const closeModal = () => {
        modal.classList.remove('active');
        document.body.style.overflow = '';
        setTimeout(() => {
            modal.style.display = 'none';
        }, 300); // Wait for transition
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

            // Prioridad: 1) Archivo subido, 2) URL ingresada, 3) Mantener actual
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

            // Guardar en localStorage
            localStorage.setItem(STORAGE_KEYS.BG_TYPE, type);
            localStorage.setItem(STORAGE_KEYS.BG_VALUE, value);
            localStorage.setItem(STORAGE_KEYS.BLUR, blur);
            localStorage.setItem(STORAGE_KEYS.THEME_COLOR, themeColor);
            localStorage.setItem(STORAGE_KEYS.LITE_MODE, isLite);

            // Logros condicionales
            if (isLite && typeof AchievementManager !== 'undefined') AchievementManager.unlock('potato');
            if (blur >= 18 && typeof AchievementManager !== 'undefined') AchievementManager.unlock('blur');

            // Actualizar estado y aplicar
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
    // PRESETS DE TEMA
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

            // Obtener valores actuales de la UI
            const blur = inputBlur ? inputBlur.value : '0';
            const themeColor = inputColor ? inputColor.value : DEFAULTS.THEME_COLOR;
            let type = 'default';
            let value = '';

            // Determinar tipo de fondo para el preset
            if (inputBgFile.files && inputBgFile.files[0]) {
                // Nuevo archivo subido — guardarlo con key única
                const file = inputBgFile.files[0];
                const key = `preset_${Date.now()}`;
                await ImageCacheStore.saveBlob(key, file);
                type = 'blob';
                value = key;
            } else if (currentSettings.bgType === 'blob' && !inputBgUrl.value.trim()) {
                // Copiar el blob actual al preset
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

            // Logro: Diseño (Crear un preset personalizado)
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

        if (presets.length === 0) {
            container.innerHTML = '<div class="preset-empty" style="text-align: center; padding: 20px; color: #666; font-style: italic; grid-column: 1/-1;">No hay temas guardados</div>';
            return;
        }

        for (const p of presets) {
            const card = document.createElement('div');
            card.className = 'preset-card';

            // Marcar preset activo
            const isActive = p.bgType === currentSettings.bgType &&
                p.bgValue === currentSettings.bgValue &&
                p.themeColor === currentSettings.themeColor;

            if (isActive) card.classList.add('active-preset');

            // Vista previa del fondo
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

            // Click: Aplicar preset
            card.addEventListener('click', (e) => {
                if (e.target.classList.contains('preset-delete')) return;
                applyPreset(p);
            });

            // Click: Borrar preset
            card.querySelector('.preset-delete').addEventListener('click', (e) => {
                e.stopPropagation();
                deletePreset(p.id);
            });

            container.appendChild(card);
        }
    };

    const applyPreset = async (p) => {
        currentSettings = {
            bgType: p.bgType,
            bgValue: p.bgValue,
            blur: p.blur,
            themeColor: p.themeColor,
            liteMode: currentSettings.liteMode // Modo Lite es preferencia global, no del preset
        };

        // Guardar en localStorage principal
        localStorage.setItem(STORAGE_KEYS.BG_TYPE, p.bgType);
        localStorage.setItem(STORAGE_KEYS.BG_VALUE, p.bgValue);
        localStorage.setItem(STORAGE_KEYS.BLUR, p.blur);
        localStorage.setItem(STORAGE_KEYS.THEME_COLOR, p.themeColor);

        await applySettings();

        // Actualizar inputs del modal
        if (inputBgUrl) inputBgUrl.value = (p.bgType === 'url') ? p.bgValue : '';
        if (inputBlur) inputBlur.value = p.blur;
        if (inputColor) inputColor.value = p.themeColor;

        closeModal();
    };

    const deletePreset = async (id) => {
        let presets = getPresets();
        const target = presets.find(p => p.id === id);

        if (target) {
            // Si el preset usa blob, borrar el blob de IndexedDB
            // (pero no si es el fondo activo actual)
            if (target.bgType === 'blob') {
                const activeKey = (currentSettings.bgValue && currentSettings.bgValue !== 'indexeddb') ? currentSettings.bgValue : 'custom_bg';
                if (activeKey === target.bgValue) {
                    console.warn('[Settings] No se borra el blob porque es el fondo activo');
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

    // Aplicación en vivo de blur y color mientras se ajustan los sliders
    const updateLivePreview = (type, value) => {
        if (type === 'blur') {
            document.documentElement.style.setProperty('--glass-blur', `${value}px`);
        }
        if (type === 'color') {
            document.documentElement.style.setProperty('--primary-color', value);
        }
    };

    // Resalta el botón de color activo
    const highlightActivePreset = (color) => {
        document.querySelectorAll('.color-btn').forEach(btn => {
            if (btn.dataset.color.toLowerCase() === color.toLowerCase()) {
                btn.classList.add('active');
            } else {
                btn.classList.remove('active');
            }
        });
    };

    // Actualizar vista previa al escribir URL
    const updatePreviewFromUrl = (e) => {
        const url = e.target.value;
        if (url) previewBg.style.backgroundImage = `url('${url}')`;
    };

    // Actualizar vista previa al subir archivo
    const updatePreviewFromFile = (e) => {
        const file = e.target.files[0];
        if (file) {
            const tempUrl = URL.createObjectURL(file);
            previewBg.style.backgroundImage = `url('${tempUrl}')`;
            const label = document.querySelector('label[for="settingBgFile"]');
            if (label) label.innerHTML = `📄 ${file.name}`;
        }
    };

    // API Pública
    return {
        init
    };
})();

// Auto-inicializar al cargar DOM
document.addEventListener('DOMContentLoaded', SettingsManager.init);
