import React, { createContext, useContext, useState, useEffect } from 'react';

const ThemeContext = createContext();

export const STORAGE_KEYS = {
    BG_TYPE: 'jueguitos_settings_bg_type',
    BG_VALUE: 'jueguitos_settings_bg_value',
    DISABLE_WAVES: 'jueguitos_settings_disable_waves',
    PRIME_MODE: 'jueguitos_prime_mode'
};

export const DEFAULTS = {
    BG_TYPE: 'default',
    BG_VALUE: '',
    DISABLE_WAVES: 'false'
};

export const ThemeProvider = ({ children }) => {
    const [settings, setSettings] = useState(() => {
        return {
            bgType: localStorage.getItem(STORAGE_KEYS.BG_TYPE) || DEFAULTS.BG_TYPE,
            bgValue: localStorage.getItem(STORAGE_KEYS.BG_VALUE) || DEFAULTS.BG_VALUE,
            disableWaves: localStorage.getItem(STORAGE_KEYS.DISABLE_WAVES) || DEFAULTS.DISABLE_WAVES
        };
    });

    const [isPrimeMode, setIsPrimeMode] = useState(() => {
        try {
            return localStorage.getItem(STORAGE_KEYS.PRIME_MODE) === 'true';
        } catch {
            return false;
        }
    });

    const togglePrimeMode = () => {
        setIsPrimeMode(prev => {
            const next = !prev;
            try {
                localStorage.setItem(STORAGE_KEYS.PRIME_MODE, String(next));
            } catch {}
            return next;
        });
    };

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
    const resetSettings = () => {
        Object.values(STORAGE_KEYS).forEach(k => localStorage.removeItem(k));
        setSettings({
            bgType: DEFAULTS.BG_TYPE,
            bgValue: DEFAULTS.BG_VALUE,
            disableWaves: DEFAULTS.DISABLE_WAVES
        });
    };

    // Efecto principal para aplicar los cambios estáticos a la UI
    useEffect(() => {
        const root = document.documentElement;
        // Colores y desenfoque (Variables CSS fijas para diseño limpio)
        root.style.setProperty('--glass-blur', '0px');
        root.style.setProperty('--primary-color', '#00f3ff');
        
        // Limpiar cualquier residuo de canvas o elementos obsoletos si existían
        return () => {
            const canvas = document.getElementById('particles-canvas');
            if (canvas) canvas.remove();
            const followDot = document.getElementById('cursor-follow-dot');
            if (followDot) followDot.remove();
        };
    }, []);

    // Aplicación del modo prime y sincronizacion de clases
    useEffect(() => {
        const body = document.body;
        if (isPrimeMode) {
            body.classList.add('prime-mode');
            body.style.removeProperty('background-image');
            body.style.removeProperty('background-size');
            body.style.removeProperty('background-attachment');
            body.style.removeProperty('background-position');
        } else {
            body.classList.remove('prime-mode');
        }
    }, [isPrimeMode]);

    // Aplicación del fondo de pantalla personalizado
    useEffect(() => {
        const body = document.body;

        if (isPrimeMode) return;

        body.style.removeProperty('background-image');
        body.style.removeProperty('background-size');
        body.style.removeProperty('background-attachment');
        body.style.removeProperty('background-position');

        if (settings.bgType === 'url' && settings.bgValue) {
            body.style.setProperty('background-image', `url('${settings.bgValue}')`, 'important');
            body.style.backgroundSize = 'cover';
            body.style.backgroundAttachment = 'fixed';
            body.style.backgroundPosition = 'center';
        }
    }, [settings.bgType, settings.bgValue, isPrimeMode]);

    return (
        <ThemeContext.Provider value={{ settings, updateSettings, resetSettings, isPrimeMode, togglePrimeMode }}>
            {children}
        </ThemeContext.Provider>
    );
};

export const useTheme = () => useContext(ThemeContext);
