import React, { useState } from 'react';
import { useTheme } from '../context/ThemeContext';
import { motion, AnimatePresence } from 'framer-motion';
import { Settings, Palette, Trash2, Plus, Check } from 'lucide-react';

const PRESETS = [
    {
        id: 'pink-lambo',
        name: 'Pink Lambo Under Sakura',
        bgValue: 'https://i.ibb.co/tphvpVp3/Pink-Lambo-Under-Sakura.gif'
    },
    {
        id: 'spiderman-web',
        name: 'Spider-Man Black Web',
        bgValue: 'https://i.ibb.co/99CKL8H9/Spider-Man-Black-Web.gif'
    },
    {
        id: 'moonrise-mountain',
        name: 'Moonrise Over a Mountain',
        bgValue: 'https://i.ibb.co/CpppYZ3T/Moonrise-Over-a-Mountain.gif'
    }
];

export const SettingsModal = ({ onClose }) => {
    const { settings, updateSettings, resetSettings } = useTheme();
    
    // Tab control state
    const [activeTab, setActiveTab] = useState('settings'); // 'settings' | 'themes'

    // Form states (General Settings)
    const [bgValue, setBgValue] = useState(settings.bgValue || '');
    const [disableWaves, setDisableWaves] = useState(settings.disableWaves === 'true');
    const [tempBgPreview, setTempBgPreview] = useState(settings.bgValue || '');

    // Custom themes list state
    const [customThemes, setCustomThemes] = useState(() => {
        try {
            const saved = localStorage.getItem('jueguitos_custom_themes');
            return saved ? JSON.parse(saved) : [];
        } catch (e) {
            console.error('Error parsing custom themes:', e);
            return [];
        }
    });

    // Custom theme form states
    const [newThemeName, setNewThemeName] = useState('');
    const [newThemeBg, setNewThemeBg] = useState('');
    const [themeError, setThemeError] = useState('');

    // Save general settings
    const handleSave = () => {
        updateSettings({
            bgType: bgValue.trim() ? 'url' : 'default',
            bgValue: bgValue.trim(),
            disableWaves: disableWaves ? 'true' : 'false'
        });
        onClose();
    };

    // Restore to default
    const handleRestore = async () => {
        if (confirm('¿Restaurar la configuración por defecto?')) {
            await resetSettings();
            setBgValue('');
            setTempBgPreview('');
            onClose();
        }
    };

    // Apply a selected theme (Preset or Custom)
    const handleApplyTheme = (theme) => {
        updateSettings({
            bgType: 'url',
            bgValue: theme.bgValue
        });
        // Sync local states in case user switches back to General Settings tab
        setBgValue(theme.bgValue);
        setTempBgPreview(theme.bgValue);
    };

    // Create a new custom theme
    const handleSaveCustomTheme = (e) => {
        e.preventDefault();
        if (!newThemeName.trim() || !newThemeBg.trim()) return;

        if (!newThemeBg.trim().startsWith('http://') && !newThemeBg.trim().startsWith('https://')) {
            setThemeError('La URL del fondo debe comenzar con http:// o https://');
            return;
        }

        const newTheme = {
            id: Date.now().toString(),
            name: newThemeName.trim(),
            bgValue: newThemeBg.trim()
        };

        const updated = [...customThemes, newTheme];
        setCustomThemes(updated);
        localStorage.setItem('jueguitos_custom_themes', JSON.stringify(updated));
        
        setNewThemeName('');
        setNewThemeBg('');
        setThemeError('');
    };

    // Delete a custom theme
    const handleDeleteTheme = (id, e) => {
        e.stopPropagation();
        const updated = customThemes.filter(t => t.id !== id);
        setCustomThemes(updated);
        localStorage.setItem('jueguitos_custom_themes', JSON.stringify(updated));
    };

    // Helper to auto-fill current backdrop URL into custom theme form
    const handleUseCurrentBg = () => {
        if (bgValue.trim()) {
            setNewThemeBg(bgValue.trim());
        } else if (settings.bgValue) {
            setNewThemeBg(settings.bgValue);
        }
    };

    return (
        <motion.div 
            className="settings-modal-overlay motion-overlay" 
            style={{ 
                display: 'flex',
                background: 'rgba(0, 0, 0, 0.75)',
                backdropFilter: 'blur(16px)',
                WebkitBackdropFilter: 'blur(16px)',
                position: 'fixed',
                inset: 0,
                zIndex: 9999,
                alignItems: 'center',
                justifyContent: 'center'
            }} 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={onClose} 
            role="dialog" 
            aria-modal="true"
        >
            <motion.div 
                className="settings-modal motion-modal" 
                onClick={(e) => e.stopPropagation()}
                style={{ 
                    maxWidth: '440px', 
                    width: '90%',
                    height: 'auto', 
                    background: 'rgba(10, 10, 12, 0.85)',
                    border: '1px solid rgba(255, 255, 255, 0.08)',
                    borderRadius: '24px',
                    boxShadow: '0 30px 60px rgba(0, 0, 0, 0.8), inset 0 1px 0 rgba(255, 255, 255, 0.05)',
                    backdropFilter: 'blur(30px)',
                    WebkitBackdropFilter: 'blur(30px)',
                    display: 'flex',
                    flexDirection: 'column',
                    overflow: 'hidden'
                }}
                initial={{ scale: 0.95, y: 15, opacity: 0 }}
                animate={{ scale: 1, y: 0, opacity: 1 }}
                exit={{ scale: 0.95, y: 15, opacity: 0 }}
                transition={{ type: "spring", damping: 25, stiffness: 350 }}
            >
                {/* Header */}
                <div style={{ padding: '16px 20px', borderBottom: '1px solid rgba(255, 255, 255, 0.05)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <h2 style={{ fontSize: '0.95rem', fontWeight: 'bold', color: '#fff', margin: 0, textTransform: 'uppercase', letterSpacing: '1px' }}>Ajustes</h2>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                        <a 
                            href="https://github.com/HugoAleOlguin/jueguitos-piola" 
                            target="_blank" 
                            rel="noopener noreferrer"
                            title="Ver Repositorio"
                            style={{ color: '#888', transition: 'color 0.2s', display: 'flex', alignItems: 'center' }}
                            onMouseEnter={(e) => e.currentTarget.style.color = 'var(--primary-color, #00f3ff)'}
                            onMouseLeave={(e) => e.currentTarget.style.color = '#888'}
                        >
                            <svg viewBox="0 0 24 24" width="18" height="18" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M15 22v-4a4.8 4.8 0 0 0-1-3.5c3 0 6-2 6-5.5.08-1.25-.27-2.48-1-3.5.28-1.15.28-2.35 0-3.5 0 0-1 0-3 1.5-2.64-.5-5.36-.5-8 0C6 2 5 2 5 2c-.3 1.15-.3 2.35 0 3.5A5.403 5.403 0 0 0 4 9c0 3.5 3 5.5 6 5.5-.39.49-.68 1.05-.85 1.65-.17.6-.22 1.23-.15 1.85v4" />
                                <path d="M9 18c-4.51 2-5-2-7-2" />
                            </svg>
                        </a>
                        <a 
                            href="https://github.com/HugoAleOlguin" 
                            target="_blank" 
                            rel="noopener noreferrer"
                            title="Mi Portafolio"
                            style={{ color: '#888', transition: 'color 0.2s', display: 'flex', alignItems: 'center' }}
                            onMouseEnter={(e) => e.currentTarget.style.color = 'var(--primary-color, #00f3ff)'}
                            onMouseLeave={(e) => e.currentTarget.style.color = '#888'}
                        >
                            <svg viewBox="0 0 24 24" width="18" height="18" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M15 3h6v6" />
                                <path d="M10 14 21 3" />
                                <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
                            </svg>
                        </a>
                        <div style={{ width: '1px', height: '14px', background: 'rgba(255,255,255,0.1)' }} />
                        <button 
                            className="btn-close" 
                            onClick={onClose} 
                            aria-label="Cerrar modal"
                            style={{ margin: 0, width: '24px', height: '24px', fontSize: '0.9rem', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                        >
                            ×
                        </button>
                    </div>
                </div>

                {/* Tabs bar */}
                <div style={{ display: 'flex', borderBottom: '1px solid rgba(255, 255, 255, 0.05)', background: 'rgba(0, 0, 0, 0.2)', padding: '0 8px' }}>
                    <button 
                        onClick={() => setActiveTab('settings')}
                        style={{ 
                            flex: 1,
                            padding: '12px', 
                            background: 'transparent', 
                            border: 'none', 
                            color: activeTab === 'settings' ? 'var(--primary-color, #00f3ff)' : '#888', 
                            borderBottom: activeTab === 'settings' ? '2px solid var(--primary-color, #00f3ff)' : '2px solid transparent', 
                            cursor: 'pointer', 
                            fontWeight: 'bold', 
                            fontSize: '0.85rem', 
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '8px',
                            transition: 'all 0.2s',
                            outline: 'none'
                        }}
                    >
                        <Settings size={15} />
                        General
                    </button>
                    <button 
                        onClick={() => setActiveTab('themes')}
                        style={{ 
                            flex: 1,
                            padding: '12px', 
                            background: 'transparent', 
                            border: 'none', 
                            color: activeTab === 'themes' ? 'var(--primary-color, #00f3ff)' : '#888', 
                            borderBottom: activeTab === 'themes' ? '2px solid var(--primary-color, #00f3ff)' : '2px solid transparent', 
                            cursor: 'pointer', 
                            fontWeight: 'bold', 
                            fontSize: '0.85rem', 
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '8px',
                            transition: 'all 0.2s',
                            outline: 'none'
                        }}
                    >
                        <Palette size={15} />
                        Temas
                    </button>
                </div>

                {/* Content Panel */}
                <div style={{ 
                    padding: '20px', 
                    display: 'flex', 
                    flexDirection: 'column', 
                    gap: '20px', 
                    overflowY: 'auto', 
                    maxHeight: '380px',
                    boxSizing: 'border-box'
                }}>
                    
                    {activeTab === 'settings' ? (
                        <>
                            {/* Section 1: Background Link */}
                            <div>
                                <span style={{ display: 'block', fontSize: '0.75rem', color: '#888', marginBottom: '8px', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                                    Imagen de fondo (URL)
                                </span>
                                <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                                    <input 
                                        type="text" 
                                        placeholder="Pegar enlace de imagen..."
                                        value={bgValue}
                                        onChange={(e) => {
                                            setBgValue(e.target.value);
                                            setTempBgPreview(e.target.value);
                                        }}
                                        style={{ 
                                            width: '100%', 
                                            padding: '12px 35px 12px 14px', 
                                            background: 'rgba(0,0,0,0.5)', 
                                            border: '1px solid rgba(255,255,255,0.08)', 
                                            borderRadius: '12px', 
                                            color: '#fff', 
                                            fontSize: '0.85rem',
                                            outline: 'none',
                                            transition: 'border-color 0.2s',
                                            boxSizing: 'border-box'
                                        }}
                                        onFocus={(e) => e.target.style.borderColor = 'var(--primary-color, #00f3ff)'}
                                        onBlur={(e) => e.target.style.borderColor = 'rgba(255,255,255,0.08)'}
                                    />
                                    {bgValue && (
                                        <button 
                                            onClick={() => { setBgValue(''); setTempBgPreview(''); }}
                                            style={{ 
                                                position: 'absolute', 
                                                right: '12px', 
                                                background: 'transparent', 
                                                border: 'none', 
                                                color: '#666', 
                                                cursor: 'pointer',
                                                fontSize: '1.1rem',
                                                padding: '2px',
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center'
                                            }}
                                            title="Limpiar"
                                        >
                                            ×
                                        </button>
                                    )}
                                </div>

                                <AnimatePresence>
                                    {tempBgPreview && (
                                        <motion.div 
                                            initial={{ opacity: 0, height: 0, marginTop: 0 }}
                                            animate={{ opacity: 1, height: '80px', marginTop: '10px' }}
                                            exit={{ opacity: 0, height: 0, marginTop: 0 }}
                                            style={{ 
                                                backgroundImage: `url('${tempBgPreview}')`, 
                                                backgroundSize: 'cover', 
                                                backgroundPosition: 'center', 
                                                borderRadius: '12px', 
                                                border: '1px solid rgba(255, 255, 255, 0.1)',
                                                position: 'relative',
                                                overflow: 'hidden'
                                            }}
                                        >
                                            <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.3)' }} />
                                            <span style={{ position: 'absolute', bottom: '6px', left: '10px', fontSize: '0.65rem', fontWeight: 'bold', color: '#fff', opacity: 0.7 }}>
                                                Vista Previa
                                            </span>
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </div>

                            {/* Section 2: Waves Style Toggle */}
                            <div>
                                <span style={{ display: 'block', fontSize: '0.75rem', color: '#888', marginBottom: '8px', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                                    Estilo del fondo
                                </span>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', background: 'rgba(0,0,0,0.4)', padding: '4px', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.05)' }}>
                                    <button 
                                        onClick={() => setDisableWaves(false)}
                                        style={{ 
                                            padding: '10px', 
                                            borderRadius: '8px', 
                                            color: !disableWaves ? 'var(--primary-color, #00f3ff)' : '#777', 
                                            background: !disableWaves ? 'rgba(0, 243, 255, 0.08)' : 'transparent', 
                                            border: !disableWaves ? '1px solid rgba(0, 243, 255, 0.15)' : '1px solid transparent', 
                                            cursor: 'pointer', 
                                            fontWeight: 'bold', 
                                            fontSize: '0.8rem', 
                                            display: 'flex', 
                                            alignItems: 'center', 
                                            justifyContent: 'center', 
                                            gap: '6px',
                                            transition: 'all 0.2s'
                                        }}
                                    >
                                        <svg viewBox="0 0 24 24" width="15" height="15" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" style={{ opacity: !disableWaves ? 1 : 0.5 }}>
                                            <path d="M2 6c.6.5 1.2 1 2.5 1C7 7 7 5 9.5 5c2.6 0 2.6 2 5 2 2.5 0 2.5-2 5-2 1.3 0 1.9.5 2.5 1" />
                                            <path d="M2 12c.6.5 1.2 1 2.5 1 2.5 0 2.5-2 5-2 2.6 0 2.6 2 5 2 2.5 0 2.5-2 5-2 1.3 0 1.9.5 2.5 1" />
                                            <path d="M2 18c.6.5 1.2 1 2.5 1 2.5 0 2.5-2 5-2 2.6 0 2.6 2 5 2 2.5 0 2.5-2 5-2 1.3 0 1.9.5 2.5 1" />
                                        </svg>
                                        Animado (Ondas)
                                    </button>
                                    <button 
                                        onClick={() => setDisableWaves(true)}
                                        style={{ 
                                            padding: '10px', 
                                            borderRadius: '8px', 
                                            color: disableWaves ? '#fff' : '#777', 
                                            background: disableWaves ? 'rgba(255, 255, 255, 0.08)' : 'transparent', 
                                            border: disableWaves ? '1px solid rgba(255, 255, 255, 0.15)' : '1px solid transparent', 
                                            cursor: 'pointer', 
                                            fontWeight: 'bold', 
                                            fontSize: '0.8rem', 
                                            display: 'flex', 
                                            alignItems: 'center', 
                                            justifyContent: 'center', 
                                            gap: '6px',
                                            transition: 'all 0.2s'
                                        }}
                                    >
                                        <svg viewBox="0 0 24 24" width="15" height="15" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" style={{ opacity: disableWaves ? 1 : 0.5 }}>
                                            <line x1="3" y1="3" x2="21" y2="21" />
                                            <path d="M2 6c.6.5 1.2 1 2.5 1C7 7 7 5 9.5 5c2.6 0 2.6 2 5 2" style={{ display: disableWaves ? 'none' : 'block' }} />
                                            <path d="M2 12c.6.5 1.2 1 2.5 1c1.3 0 2.1-.5 3-1" style={{ display: disableWaves ? 'none' : 'block' }} />
                                            <path d="M2 18c.6.5 1.2 1 2.5 1" style={{ display: disableWaves ? 'none' : 'block' }} />
                                        </svg>
                                        Estático (Fijo)
                                    </button>
                                </div>
                            </div>
                        </>
                    ) : (
                        <>
                            {/* System Preset Themes */}
                            <div>
                                <span style={{ display: 'block', fontSize: '0.75rem', color: '#888', marginBottom: '10px', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                                    Temas por Defecto
                                </span>
                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(110px, 1fr))', gap: '10px' }}>
                                    {PRESETS.map(theme => {
                                        const isActive = settings.bgValue === theme.bgValue && settings.bgType === 'url';
                                        return (
                                            <motion.div
                                                key={theme.id}
                                                onClick={() => handleApplyTheme(theme)}
                                                whileHover={{ scale: 1.04 }}
                                                whileTap={{ scale: 0.98 }}
                                                style={{
                                                    position: 'relative',
                                                    height: '75px',
                                                    borderRadius: '12px',
                                                    overflow: 'hidden',
                                                    cursor: 'pointer',
                                                    border: isActive ? '2px solid var(--primary-color, #00f3ff)' : '1px solid rgba(255,255,255,0.08)',
                                                    boxShadow: isActive ? '0 0 15px rgba(0, 243, 255, 0.25)' : 'none',
                                                    backgroundImage: `url('${theme.bgValue}')`,
                                                    backgroundSize: 'cover',
                                                    backgroundPosition: 'center',
                                                    display: 'flex',
                                                    alignItems: 'flex-end',
                                                    padding: '6px'
                                                }}
                                            >
                                                <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(0,0,0,0.85) 0%, rgba(0,0,0,0.2) 65%, transparent 100%)', zIndex: 1 }} />
                                                
                                                {isActive && (
                                                    <div style={{
                                                        position: 'absolute',
                                                        top: '6px',
                                                        right: '6px',
                                                        background: 'var(--primary-color, #00f3ff)',
                                                        color: '#000',
                                                        borderRadius: '50%',
                                                        width: '16px',
                                                        height: '16px',
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        justifyContent: 'center',
                                                        zIndex: 2
                                                    }}>
                                                        <Check size={10} strokeWidth={3} />
                                                    </div>
                                                )}
                                                
                                                <span style={{ 
                                                    position: 'relative', 
                                                    zIndex: 2, 
                                                    color: '#fff', 
                                                    fontSize: '0.62rem', 
                                                    fontWeight: 'bold',
                                                    textShadow: '0 1px 2px rgba(0,0,0,0.8)',
                                                    whiteSpace: 'nowrap',
                                                    overflow: 'hidden',
                                                    textOverflow: 'ellipsis',
                                                    width: '100%',
                                                    textAlign: 'left'
                                                }}>
                                                    {theme.name}
                                                </span>
                                            </motion.div>
                                        );
                                    })}
                                </div>
                            </div>

                            {/* Saved Custom Themes */}
                            <div style={{ borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '16px' }}>
                                <span style={{ display: 'block', fontSize: '0.75rem', color: '#888', marginBottom: '10px', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                                    Mis Temas Guardados
                                </span>
                                {customThemes.length === 0 ? (
                                    <div style={{ textAlign: 'center', padding: '16px 20px', background: 'rgba(0,0,0,0.2)', borderRadius: '12px', border: '1px dashed rgba(255,255,255,0.08)' }}>
                                        <span style={{ fontSize: '0.75rem', color: '#666', fontStyle: 'italic' }}>
                                            No tienes temas guardados aún.
                                        </span>
                                    </div>
                                ) : (
                                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(110px, 1fr))', gap: '10px' }}>
                                        {customThemes.map(theme => {
                                            const isActive = settings.bgValue === theme.bgValue && settings.bgType === 'url';
                                            return (
                                                <motion.div
                                                    key={theme.id}
                                                    onClick={() => handleApplyTheme(theme)}
                                                    whileHover={{ scale: 1.04 }}
                                                    whileTap={{ scale: 0.98 }}
                                                    style={{
                                                        position: 'relative',
                                                        height: '75px',
                                                        borderRadius: '12px',
                                                        overflow: 'hidden',
                                                        cursor: 'pointer',
                                                        border: isActive ? '2px solid var(--primary-color, #00f3ff)' : '1px solid rgba(255,255,255,0.08)',
                                                        boxShadow: isActive ? '0 0 15px rgba(0, 243, 255, 0.25)' : 'none',
                                                        backgroundImage: `url('${theme.bgValue}')`,
                                                        backgroundSize: 'cover',
                                                        backgroundPosition: 'center',
                                                        display: 'flex',
                                                        alignItems: 'flex-end',
                                                        padding: '6px'
                                                    }}
                                                >
                                                    <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(0,0,0,0.85) 0%, rgba(0,0,0,0.2) 65%, transparent 100%)', zIndex: 1 }} />
                                                    
                                                    {/* Active Indicator */}
                                                    {isActive && (
                                                        <div style={{
                                                            position: 'absolute',
                                                            top: '6px',
                                                            left: '6px',
                                                            background: 'var(--primary-color, #00f3ff)',
                                                            color: '#000',
                                                            borderRadius: '50%',
                                                            width: '16px',
                                                            height: '16px',
                                                            display: 'flex',
                                                            alignItems: 'center',
                                                            justifyContent: 'center',
                                                            zIndex: 2
                                                        }}>
                                                            <Check size={10} strokeWidth={3} />
                                                        </div>
                                                    )}

                                                    {/* Delete Button */}
                                                    <button
                                                        onClick={(e) => handleDeleteTheme(theme.id, e)}
                                                        style={{
                                                            position: 'absolute',
                                                            top: '6px',
                                                            right: '6px',
                                                            background: 'rgba(255, 69, 58, 0.15)',
                                                            border: '1px solid rgba(255, 69, 58, 0.3)',
                                                            color: '#ff453a',
                                                            borderRadius: '50%',
                                                            width: '20px',
                                                            height: '20px',
                                                            display: 'flex',
                                                            alignItems: 'center',
                                                            justifyContent: 'center',
                                                            zIndex: 3,
                                                            cursor: 'pointer',
                                                            transition: 'all 0.2s',
                                                            padding: 0
                                                        }}
                                                        onMouseEnter={(e) => {
                                                            e.currentTarget.style.background = 'rgba(255, 69, 58, 0.3)';
                                                            e.currentTarget.style.borderColor = '#ff453a';
                                                        }}
                                                        onMouseLeave={(e) => {
                                                            e.currentTarget.style.background = 'rgba(255, 69, 58, 0.15)';
                                                            e.currentTarget.style.borderColor = 'rgba(255, 69, 58, 0.3)';
                                                        }}
                                                        title="Eliminar tema"
                                                    >
                                                        <Trash2 size={11} />
                                                    </button>
                                                    
                                                    <span style={{ 
                                                        position: 'relative', 
                                                        zIndex: 2, 
                                                        color: '#fff', 
                                                        fontSize: '0.62rem', 
                                                        fontWeight: 'bold',
                                                        textShadow: '0 1px 2px rgba(0,0,0,0.8)',
                                                        whiteSpace: 'nowrap',
                                                        overflow: 'hidden',
                                                        textOverflow: 'ellipsis',
                                                        width: '100%',
                                                        textAlign: 'left'
                                                    }}>
                                                        {theme.name}
                                                    </span>
                                                </motion.div>
                                            );
                                        })}
                                    </div>
                                )}
                            </div>

                            {/* Create New Custom Theme */}
                            <div style={{ borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '16px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                                <span style={{ display: 'block', fontSize: '0.75rem', color: '#888', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                                    Guardar Tema Personalizado
                                </span>
                                <form onSubmit={handleSaveCustomTheme} style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                                    <div>
                                        <input
                                            type="text"
                                            placeholder="Nombre del tema (ej: Espacio Profundo)"
                                            value={newThemeName}
                                            onChange={(e) => setNewThemeName(e.target.value)}
                                            style={{
                                                width: '100%',
                                                padding: '10px 12px',
                                                background: 'rgba(0,0,0,0.5)',
                                                border: '1px solid rgba(255,255,255,0.08)',
                                                borderRadius: '10px',
                                                color: '#fff',
                                                fontSize: '0.8rem',
                                                outline: 'none',
                                                boxSizing: 'border-box',
                                                transition: 'border-color 0.2s'
                                            }}
                                            onFocus={(e) => e.target.style.borderColor = 'var(--primary-color, #00f3ff)'}
                                            onBlur={(e) => e.target.style.borderColor = 'rgba(255,255,255,0.08)'}
                                        />
                                    </div>
                                    
                                    <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                                        <input
                                            type="text"
                                            placeholder="Enlace de la imagen o GIF de fondo..."
                                            value={newThemeBg}
                                            onChange={(e) => setNewThemeBg(e.target.value)}
                                            style={{
                                                flexGrow: 1,
                                                padding: '10px 12px',
                                                background: 'rgba(0,0,0,0.5)',
                                                border: '1px solid rgba(255,255,255,0.08)',
                                                borderRadius: '10px',
                                                color: '#fff',
                                                fontSize: '0.8rem',
                                                outline: 'none',
                                                boxSizing: 'border-box',
                                                transition: 'border-color 0.2s'
                                            }}
                                            onFocus={(e) => e.target.style.borderColor = 'var(--primary-color, #00f3ff)'}
                                            onBlur={(e) => e.target.style.borderColor = 'rgba(255,255,255,0.08)'}
                                        />
                                        <button
                                            type="button"
                                            onClick={handleUseCurrentBg}
                                            style={{
                                                padding: '10px 12px',
                                                background: 'rgba(255,255,255,0.05)',
                                                border: '1px solid rgba(255,255,255,0.1)',
                                                borderRadius: '10px',
                                                color: '#ccc',
                                                fontSize: '0.75rem',
                                                cursor: 'pointer',
                                                whiteSpace: 'nowrap',
                                                fontWeight: 'bold',
                                                transition: 'all 0.2s'
                                            }}
                                            onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.1)'}
                                            onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.05)'}
                                            title="Autocompletar con el fondo actual"
                                        >
                                            Usar actual
                                        </button>
                                    </div>

                                    {themeError && (
                                        <span style={{ color: '#ff453a', fontSize: '0.7rem', fontWeight: 'bold' }}>
                                            {themeError}
                                        </span>
                                    )}

                                    <button
                                        type="submit"
                                        disabled={!newThemeName.trim() || !newThemeBg.trim()}
                                        style={{
                                            width: '100%',
                                            padding: '10px',
                                            background: (!newThemeName.trim() || !newThemeBg.trim()) ? 'rgba(255,255,255,0.02)' : 'var(--primary-color, #00f3ff)',
                                            color: (!newThemeName.trim() || !newThemeBg.trim()) ? '#555' : '#000',
                                            border: 'none',
                                            borderRadius: '10px',
                                            fontWeight: 'bold',
                                            fontSize: '0.8rem',
                                            cursor: (!newThemeName.trim() || !newThemeBg.trim()) ? 'not-allowed' : 'pointer',
                                            transition: 'all 0.2s',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            gap: '6px'
                                        }}
                                    >
                                        <Plus size={14} />
                                        Guardar Tema
                                    </button>
                                </form>
                            </div>
                        </>
                    )}

                </div>

                {/* Footer */}
                <div 
                    className="settings-footer" 
                    style={{ 
                        padding: '12px 20px', 
                        background: 'rgba(0,0,0,0.3)', 
                        borderTop: '1px solid rgba(255,255,255,0.05)', 
                        display: 'flex', 
                        justifyContent: 'space-between', 
                        alignItems: 'center',
                        borderBottomLeftRadius: '24px',
                        borderBottomRightRadius: '24px'
                    }}
                >
                    <button 
                        className="btn-ghost danger" 
                        onClick={handleRestore} 
                        style={{ padding: '8px 16px', borderRadius: '8px', cursor: 'pointer', transition: 'all 0.2s', fontSize: '0.8rem' }}
                    >
                        Restaurar
                    </button>
                    <div style={{ display: 'flex', gap: '8px' }}>
                        <button 
                            className="btn-ghost" 
                            onClick={onClose} 
                            style={{ padding: '8px 16px', borderRadius: '8px', cursor: 'pointer', color: '#aaa', fontSize: '0.8rem' }}
                        >
                            Cerrar
                        </button>
                        <button 
                            className="btn-save" 
                            onClick={handleSave} 
                            style={{ padding: '8px 20px', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold', background: 'var(--primary-color, #00f3ff)', color: '#000', fontSize: '0.8rem', transition: 'all 0.2s' }}
                        >
                            Guardar
                        </button>
                    </div>
                </div>
            </motion.div>
        </motion.div>
    );
};
