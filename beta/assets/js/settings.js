/**
 * SETTINGS.JS - Advanced Configuration Manager
 * Handles user preferences for background, music, and other visual settings.
 */

const SettingsManager = (() => {
    // Constants
    const STORAGE_KEYS = {
        BG_TYPE: 'jueguitos_settings_bg_type',   // 'default', 'url', 'custom'
        BG_VALUE: 'jueguitos_settings_bg_value', // URL string or Base64
        MUSIC_ID: 'jueguitos_settings_music_id', // YouTube Video ID
        BLUR: 'jueguitos_settings_blur',         // Blur intensity
        THEME_COLOR: 'jueguitos_settings_color'  // Primary color override
    };

    const DEFAULTS = {
        BG_TYPE: 'default',
        BG_VALUE: '',
        MUSIC_ID: '_HY9wyLjRDE', // Default lofi/ambient track
        BLUR: '0',
        THEME_COLOR: '#00f3ff'
    };

    // DOM Elements
    let modal, btnOpen, btnSave, btnReset, btnCancel;
    let inputBgUrl, inputBgFile, inputMusicId, previewBg;

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
        inputMusicId = document.getElementById('settingMusicId');
        previewBg = document.getElementById('settingBgPreview');
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
    };

    // ========================================================================
    // LOGIC
    // ========================================================================
    const loadSettings = () => {
        currentSettings = {
            bgType: localStorage.getItem(STORAGE_KEYS.BG_TYPE) || DEFAULTS.BG_TYPE,
            bgValue: localStorage.getItem(STORAGE_KEYS.BG_VALUE) || DEFAULTS.BG_VALUE,
            musicId: localStorage.getItem(STORAGE_KEYS.MUSIC_ID) || DEFAULTS.MUSIC_ID,
            blur: localStorage.getItem(STORAGE_KEYS.BLUR) || DEFAULTS.BLUR
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
    };

    const openModal = () => {
        // Populate UI with current settings
        inputBgUrl.value = currentSettings.bgType === 'url' ? currentSettings.bgValue : '';
        inputMusicId.value = currentSettings.musicId;

        // Show Modal
        modal.classList.add('active');
        document.body.style.overflow = 'hidden'; // Prevent scrolling
    };

    const closeModal = () => {
        modal.classList.remove('active');
        document.body.style.overflow = '';
    };

    const saveFromUI = () => {
        // Music
        const rawMusicInfo = inputMusicId.value.trim();
        const musicId = extractVideoID(rawMusicInfo) || currentSettings.musicId;

        // Background
        // If file input has a file, it takes precedence if valid
        if (inputBgFile.files && inputBgFile.files[0]) {
            const file = inputBgFile.files[0];
            const reader = new FileReader();

            reader.onload = (e) => {
                const base64 = e.target.result;
                // Compression/Validation check could go here

                // Save
                saveSettings(musicId, 'custom', base64);
                closeModal();
                alert('Configuración guardada correctamente.');
            };

            if (file.size > 3000000) { // 3MB limit
                alert('La imagen es demasiado pesada (Máx 3MB). Intenta con una URL.');
                return;
            }

            reader.readAsDataURL(file);
        } else if (inputBgUrl.value.trim()) {
            saveSettings(musicId, 'url', inputBgUrl.value.trim());
            closeModal();
        } else {
            // Default background
            saveSettings(musicId, 'default', '');
            closeModal();
        }
    };

    const saveSettings = (musicId, bgType, bgValue) => {
        currentSettings = { musicId, bgType, bgValue };

        localStorage.setItem(STORAGE_KEYS.MUSIC_ID, musicId);
        localStorage.setItem(STORAGE_KEYS.BG_TYPE, bgType);
        localStorage.setItem(STORAGE_KEYS.BG_VALUE, bgValue);

        applySettings();

        // Reload page to apply music changes cleanly
        location.reload();
    };

    const resetDefaults = () => {
        if (confirm('¿Restablecer toda la configuración?')) {
            localStorage.removeItem(STORAGE_KEYS.BG_TYPE);
            localStorage.removeItem(STORAGE_KEYS.BG_VALUE);
            localStorage.removeItem(STORAGE_KEYS.MUSIC_ID);

            // Reload
            location.reload();
        }
    };

    // ========================================================================
    // HELPERS
    // ========================================================================
    const extractVideoID = (url) => {
        const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
        const match = url.match(regExp);
        return (match && match[2].length === 11) ? match[2] : null; // Return ID or null if not found
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
        init,
        getMusicId: () => currentSettings.musicId
    };
})();

// Auto-init
document.addEventListener('DOMContentLoaded', SettingsManager.init);
