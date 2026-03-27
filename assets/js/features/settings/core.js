const SettingsCore = (() => {
    const STORAGE_KEYS = {
        BG_TYPE: 'jueguitos_settings_bg_type',
        BG_VALUE: 'jueguitos_settings_bg_value',
        BLUR: 'jueguitos_settings_blur',
        THEME_COLOR: 'jueguitos_settings_color',
        LITE_MODE: 'jueguitos_settings_lite',
        CURSOR: 'jueguitos_settings_cursor',
        PARTICLES: 'jueguitos_settings_particles',
        TRAIL: 'jueguitos_settings_trail',
        UI_SOUNDS: 'jueguitos_settings_uisounds',
        CARD_STYLE: 'jueguitos_settings_card_style'
    };

    const DEFAULTS = {
        BG_TYPE: 'default',
        BG_VALUE: '',
        BLUR: '0',
        THEME_COLOR: '#00f3ff',
        LITE_MODE: 'false',
        CURSOR: 'default',
        PARTICLES: 'true',
        TRAIL: 'false',
        UI_SOUNDS: 'false',
        CARD_STYLE: 'default'
    };

    let currentSettings = {};

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
            uiSounds: localStorage.getItem(STORAGE_KEYS.UI_SOUNDS) || DEFAULTS.UI_SOUNDS,
            cardStyle: localStorage.getItem(STORAGE_KEYS.CARD_STYLE) || DEFAULTS.CARD_STYLE
        };
    };

    const getSetting = (key) => currentSettings[key];
    const setSetting = (key, value) => { currentSettings[key] = value; };
    const getAll = () => currentSettings;
    const setAll = (newSettings) => { currentSettings = { ...newSettings }; };

    return { loadSettings, getSetting, setSetting, getAll, setAll, STORAGE_KEYS, DEFAULTS };
})();
