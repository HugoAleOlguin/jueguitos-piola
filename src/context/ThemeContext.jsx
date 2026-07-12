import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { ImageCacheStore } from '../services/backgroundStore';

const ThemeContext = createContext();

export const STORAGE_KEYS = {
    BG_TYPE: 'jueguitos_settings_bg_type',
    BG_VALUE: 'jueguitos_settings_bg_value',
    DISABLE_WAVES: 'jueguitos_settings_disable_waves'
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

    const bgBlobUrlRef = useRef(null);

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
        } catch (e) {
            console.warn('Error clearing IndexedDB assets:', e);
        }
        
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

    // Aplicación del fondo de pantalla
    useEffect(() => {
        const body = document.body;

        body.style.removeProperty('background-image');
        body.style.removeProperty('background-size');
        body.style.removeProperty('background-attachment');
        body.style.removeProperty('background-position');

        let activeUrl = null;

        const applyBackground = async () => {
            if (settings.bgType === 'blob') {
                try {
                    const blob = await ImageCacheStore.getBlob(settings.bgValue || 'custom_bg');
                    if (blob) {
                        const url = URL.createObjectURL(blob);
                        if (bgBlobUrlRef.current) {
                            URL.revokeObjectURL(bgBlobUrlRef.current);
                        }
                        bgBlobUrlRef.current = url;
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
    }, [settings.bgType, settings.bgValue]);

    return (
        <ThemeContext.Provider value={{ settings, updateSettings, resetSettings }}>
            {children}
        </ThemeContext.Provider>
    );
};

export const useTheme = () => useContext(ThemeContext);
