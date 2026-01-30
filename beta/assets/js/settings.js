/**
 * SETTINGS.JS - Advanced Configuration Manager
 * Handles user preferences for background, music, and other visual settings.
 */

const SettingsManager = (() => {
    // Constants
    // Constants
    const STORAGE_KEYS = {
        BG_TYPE: 'jueguitos_settings_bg_type',   // 'default', 'url', 'custom'
        BG_VALUE: 'jueguitos_settings_bg_value', // URL string or Base64
        BLUR: 'jueguitos_settings_blur',         // Blur intensity
        THEME_COLOR: 'jueguitos_settings_color'  // Primary color override
    };

    const DEFAULTS = {
        BG_TYPE: 'default',
        BG_VALUE: '',
        BLUR: '0',
        THEME_COLOR: '#00f3ff'
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
        // Removed overlay click close to prevent missclicks


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

    const applySettings = () => {
        // Apply Background
        if (currentSettings.bgType === 'url' || currentSettings.bgType === 'custom') {
            document.body.style.backgroundImage = `url('${currentSettings.bgValue}')`;
            document.body.style.backgroundSize = 'cover';
            document.body.style.backgroundAttachment = 'fixed';
            document.body.style.backgroundPosition = 'center';
        } else {
            // Revert to CSS default (remove inline styles)
            document.body.style.backgroundImage = '';
            document.body.style.backgroundSize = '';
            document.body.style.backgroundAttachment = '';
            document.body.style.backgroundPosition = '';
        }

        // Apply Blur
        const blurVal = currentSettings.blur || '0';
        document.documentElement.style.setProperty('--glass-blur', `${blurVal}px`);

        // HACK: Update backdrop-filter on specific elements if CSS variable isn't enough (depending on CSS impl)
        // Ideally, CSS should use var(--glass-blur). We'll assume CSS is updated or we force it here if needed.
        // For now, let's inject a style rule if we want to be 100% sure, or just rely on CSS var.
        // Let's rely on CSS var, but we need to ensure style.css uses it. 
        // If not using style.css edit, we can force it on common classes:
        document.querySelectorAll('.game-card, .game-detail-container, header').forEach(el => {
            el.style.backdropFilter = `blur(${blurVal}px)`;
            el.style.webkitBackdropFilter = `blur(${blurVal}px)`;
        });

        // Apply Theme Color
        const colorVal = currentSettings.themeColor || DEFAULTS.THEME_COLOR;
        document.documentElement.style.setProperty('--primary-color', colorVal);
    };

    const openModal = () => {
        // Populate UI with current settings
        inputBgUrl.value = currentSettings.bgType === 'url' ? currentSettings.bgValue : '';
        if (inputBlur) inputBlur.value = parseInt(currentSettings.blur || 0);
        if (inputColor) {
            inputColor.value = currentSettings.themeColor || DEFAULTS.THEME_COLOR;
            highlightActivePreset(inputColor.value);
        }

        // Fix: Load preview
        if (currentSettings.bgType === 'url' || currentSettings.bgType === 'custom') {
            previewBg.style.backgroundImage = `url('${currentSettings.bgValue}')`;
        } else {
            previewBg.style.backgroundImage = '';
        }

        // Show Modal
        modal.classList.add('active');
        document.body.style.overflow = 'hidden'; // Prevent scrolling
    };

    const closeModal = () => {
        modal.classList.remove('active');
        document.body.style.overflow = '';
    };

    const saveFromUI = () => {
        // Background
        // If file input has a file, it takes precedence if valid
        if (inputBgFile.files && inputBgFile.files[0]) {
            const file = inputBgFile.files[0];
            const reader = new FileReader();

            reader.onload = (e) => {
                const base64 = e.target.result;
                // Compression/Validation check could go here

                // Save
                saveSettings('custom', base64);
                closeModal();
                alert('Configuración guardada correctamente.');
            };

            if (file.size > 3000000) { // 3MB limit
                alert('La imagen es demasiado pesada (Máx 3MB). Intenta con una URL.');
                return;
            }

            reader.readAsDataURL(file);
        } else if (inputBgUrl.value.trim()) {
            saveSettings('url', inputBgUrl.value.trim());
            closeModal();
        } else {
            // Default background
            saveSettings('default', '');
            closeModal();
        }
    };

    const saveSettings = (bgType, bgValue) => {
        const blur = inputBlur ? inputBlur.value : '0';
        const themeColor = inputColor ? inputColor.value : DEFAULTS.THEME_COLOR;

        currentSettings = { bgType, bgValue, blur, themeColor };

        localStorage.setItem(STORAGE_KEYS.BG_TYPE, bgType);
        localStorage.setItem(STORAGE_KEYS.BG_VALUE, bgValue);
        localStorage.setItem(STORAGE_KEYS.BLUR, blur);
        localStorage.setItem(STORAGE_KEYS.THEME_COLOR, themeColor);

        applySettings();

        // No reload needed for CSS vars, but might be safer for deep changes. 
        // Actually, CSS vars update instantly. Let's try avoiding reload for smooth UX?
        // But the background image change logic above used reload. Let's keep it consistent or remove reload if possible.
        // The original code did reload. Let's keep reload for now to ensure clean state, or ideally remove it if we can.
        // User requested "configure menu", persistence is key.
        // Let's stick to reload for robust ness, or try to be smooth. The prompt implied "put more configuration".
        // Let's remove reload for better clicking experience if possible, but the original `saveSettings` had it.
        // I will keep reload to ensure `theme.js` and other scripts dependent on stored configs re-init properly if needed.
        location.reload();
    };

    const resetDefaults = () => {
        if (confirm('¿Restablecer toda la configuración?')) {
            localStorage.removeItem(STORAGE_KEYS.BG_TYPE);
            localStorage.removeItem(STORAGE_KEYS.BG_VALUE);
            localStorage.removeItem(STORAGE_KEYS.BLUR);
            localStorage.removeItem(STORAGE_KEYS.THEME_COLOR);

            // Reload
            location.reload();
        }
    };

    // ========================================================================
    // HELPERS
    // ========================================================================


    const updateLivePreview = (type, value) => {
        if (type === 'blur') {
            document.documentElement.style.setProperty('--glass-blur', `${value}px`);
            document.querySelectorAll('.game-card, .game-detail-container, header').forEach(el => {
                el.style.backdropFilter = `blur(${value}px)`;
                el.style.webkitBackdropFilter = `blur(${value}px)`;
            });
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
        if (url) {
            previewBg.style.backgroundImage = `url('${url}')`;
        } else {
            previewBg.style.backgroundImage = '';
        }
    };

    const updatePreviewFromFile = (e) => {
        const file = e.target.files[0];
        if (file) {
            const tempUrl = URL.createObjectURL(file);
            previewBg.style.backgroundImage = `url('${tempUrl}')`;
            // Update label to show filename
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
