import React, { useState } from 'react';
import { useTheme } from '../context/ThemeContext';
import { motion } from 'framer-motion';
import { Palette, Cpu, Sliders, Check, Trash2, X, RotateCcw, ExternalLink } from 'lucide-react';

const PRESETS = [
  {
    id: 'default',
    name: 'Oscuro original',
    bgValue: '',
    preview: 'linear-gradient(135deg, #0b0d13 0%, #171b26 100%)'
  },
  {
    id: 'pink-lambo',
    name: 'Pink Lambo',
    bgValue: 'https://i.ibb.co/tphvpVp3/Pink-Lambo-Under-Sakura.gif',
    preview: 'url(https://i.ibb.co/tphvpVp3/Pink-Lambo-Under-Sakura.gif)'
  },
  {
    id: 'spiderman-web',
    name: 'Spider-Man',
    bgValue: 'https://i.ibb.co/99CKL8H9/Spider-Man-Black-Web.gif',
    preview: 'url(https://i.ibb.co/99CKL8H9/Spider-Man-Black-Web.gif)'
  },
  {
    id: 'moonrise-mountain',
    name: 'Moonrise',
    bgValue: 'https://i.ibb.co/CpppYZ3T/Moonrise-Over-a-Mountain.gif',
    preview: 'url(https://i.ibb.co/CpppYZ3T/Moonrise-Over-a-Mountain.gif)'
  }
];

export const SettingsModal = ({ onClose }) => {
  const { settings, updateSettings, resetSettings } = useTheme();
  const [activeTab, setActiveTab] = useState('appearance'); // 'appearance' | 'performance' | 'general'
  const [customUrl, setCustomUrl] = useState('');

  const [customThemes, setCustomThemes] = useState(() => {
    try {
      const saved = localStorage.getItem('jueguitos_custom_themes');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const isCurrentTheme = (bgValue) => {
    if (!bgValue) return !settings.bgValue || settings.bgType === 'default';
    return settings.bgValue === bgValue;
  };

  const handleSelectTheme = (bgValue) => {
    if (!bgValue) {
      updateSettings({ bgType: 'default', bgValue: '' });
    } else {
      updateSettings({ bgType: 'url', bgValue });
    }
  };

  const handleApplyCustomUrl = () => {
    const url = customUrl.trim();
    if (!url) return;
    updateSettings({ bgType: 'url', bgValue: url });
  };

  const handleSaveCustomTheme = () => {
    const url = customUrl.trim();
    if (!url) return;
    const name = window.prompt('Nombre para este tema:');
    if (!name || !name.trim()) return;

    const newTheme = {
      id: Date.now().toString(),
      name: name.trim(),
      bgValue: url
    };

    const next = [...customThemes, newTheme];
    setCustomThemes(next);
    localStorage.setItem('jueguitos_custom_themes', JSON.stringify(next));
    updateSettings({ bgType: 'url', bgValue: url });
    setCustomUrl('');
  };

  const handleDeleteCustomTheme = (id, e) => {
    e.stopPropagation();
    const next = customThemes.filter((t) => t.id !== id);
    setCustomThemes(next);
    localStorage.setItem('jueguitos_custom_themes', JSON.stringify(next));
  };

  const handleToggleWaves = () => {
    const nextVal = settings.disableWaves === 'true' ? 'false' : 'true';
    updateSettings({ disableWaves: nextVal });
  };

  const handleRestartOnboarding = () => {
    try {
      localStorage.removeItem('jueguitos_onboarding_guide');
    } catch {}
    window.dispatchEvent(new CustomEvent('jueguitos_restart_onboarding'));
    onClose();
  };

  const handleResetAll = () => {
    if (window.confirm('¿Restablecer toda la configuracion por defecto?')) {
      resetSettings();
      onClose();
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.18 }}
      onClick={onClose}
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 10000,
        background: 'rgba(0, 0, 0, 0.72)',
        backdropFilter: 'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '16px'
      }}
      role="dialog"
      aria-modal="true"
    >
      <motion.div
        initial={{ scale: 0.96, opacity: 0, y: 10 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.96, opacity: 0, y: 10 }}
        transition={{ duration: 0.2, ease: 'easeOut' }}
        onClick={(e) => e.stopPropagation()}
        style={{
          width: '740px',
          maxWidth: '94vw',
          height: '490px',
          maxHeight: '88vh',
          background: 'rgba(15, 17, 23, 0.96)',
          backdropFilter: 'blur(24px)',
          WebkitBackdropFilter: 'blur(24px)',
          border: '1px solid rgba(255, 255, 255, 0.12)',
          borderRadius: '16px',
          boxShadow: '0 24px 60px rgba(0, 0, 0, 0.8)',
          display: 'flex',
          overflow: 'hidden',
          color: '#ffffff',
          fontFamily: 'Inter, system-ui, -apple-system, sans-serif'
        }}
      >
        {/* Columna Izquierda: Navegacion lateral */}
        <aside
          style={{
            width: '210px',
            minWidth: '210px',
            background: 'rgba(10, 11, 15, 0.85)',
            borderRight: '1px solid rgba(255, 255, 255, 0.08)',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            padding: '20px 14px',
            boxSizing: 'border-box'
          }}
        >
          <div>
            <div style={{ padding: '0 8px 16px 8px', borderBottom: '1px solid rgba(255, 255, 255, 0.08)' }}>
              <h2 style={{ fontSize: '0.95rem', fontWeight: '700', margin: 0, letterSpacing: '-0.2px' }}>
                Ajustes
              </h2>
              <span style={{ fontSize: '0.72rem', color: '#9ca3af' }}>Personalizacion y sistema</span>
            </div>

            <nav style={{ display: 'flex', flexDirection: 'column', gap: '4px', marginTop: '14px' }}>
              <button
                type="button"
                onClick={() => setActiveTab('appearance')}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  padding: '9px 12px',
                  borderRadius: '8px',
                  border: 'none',
                  background: activeTab === 'appearance' ? 'rgba(255, 255, 255, 0.12)' : 'transparent',
                  color: activeTab === 'appearance' ? '#ffffff' : '#9ca3af',
                  fontSize: '0.82rem',
                  fontWeight: activeTab === 'appearance' ? '600' : '500',
                  cursor: 'pointer',
                  textAlign: 'left',
                  transition: 'all 0.15s ease'
                }}
              >
                <Palette size={16} />
                <span>Apariencia</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('performance')}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  padding: '9px 12px',
                  borderRadius: '8px',
                  border: 'none',
                  background: activeTab === 'performance' ? 'rgba(255, 255, 255, 0.12)' : 'transparent',
                  color: activeTab === 'performance' ? '#ffffff' : '#9ca3af',
                  fontSize: '0.82rem',
                  fontWeight: activeTab === 'performance' ? '600' : '500',
                  cursor: 'pointer',
                  textAlign: 'left',
                  transition: 'all 0.15s ease'
                }}
              >
                <Cpu size={16} />
                <span>Rendimiento</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('general')}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  padding: '9px 12px',
                  borderRadius: '8px',
                  border: 'none',
                  background: activeTab === 'general' ? 'rgba(255, 255, 255, 0.12)' : 'transparent',
                  color: activeTab === 'general' ? '#ffffff' : '#9ca3af',
                  fontSize: '0.82rem',
                  fontWeight: activeTab === 'general' ? '600' : '500',
                  cursor: 'pointer',
                  textAlign: 'left',
                  transition: 'all 0.15s ease'
                }}
              >
                <Sliders size={16} />
                <span>General</span>
              </button>
            </nav>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', padding: '0 4px' }}>
            <button
              type="button"
              onClick={handleResetAll}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                background: 'transparent',
                border: 'none',
                color: '#6b7280',
                fontSize: '0.74rem',
                cursor: 'pointer',
                padding: '6px 8px',
                borderRadius: '6px',
                textAlign: 'left'
              }}
              onMouseEnter={(e) => { e.currentTarget.style.color = '#ef4444'; }}
              onMouseLeave={(e) => { e.currentTarget.style.color = '#6b7280'; }}
            >
              <RotateCcw size={13} />
              <span>Restablecer todo</span>
            </button>
          </div>
        </aside>

        {/* Columna Derecha: Contenido de la pestaña */}
        <main
          style={{
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden'
          }}
        >
          {/* Barra superior de cierre */}
          <div
            style={{
              padding: '16px 22px',
              borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between'
            }}
          >
            <span style={{ fontSize: '0.82rem', fontWeight: '600', color: '#e5e7eb' }}>
              {activeTab === 'appearance' && 'Temas y fondos'}
              {activeTab === 'performance' && 'Opciones de rendimiento'}
              {activeTab === 'general' && 'Informacion y tour'}
            </span>

            <button
              type="button"
              onClick={onClose}
              aria-label="Cerrar ventana"
              style={{
                background: 'rgba(255, 255, 255, 0.06)',
                border: 'none',
                color: '#9ca3af',
                width: '28px',
                height: '28px',
                borderRadius: '6px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer'
              }}
              onMouseEnter={(e) => { e.currentTarget.style.color = '#ffffff'; }}
              onMouseLeave={(e) => { e.currentTarget.style.color = '#9ca3af'; }}
            >
              <X size={16} />
            </button>
          </div>

          {/* Area desplazable de contenido */}
          <div style={{ flex: 1, overflowY: 'auto', padding: '22px' }}>
            {activeTab === 'appearance' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                {/* Cuadricula de temas predeterminados */}
                <div>
                  <label style={{ fontSize: '0.78rem', fontWeight: '600', color: '#9ca3af', display: 'block', marginBottom: '10px' }}>
                    Fondos predeterminados
                  </label>

                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '12px' }}>
                    {PRESETS.map((preset) => {
                      const active = isCurrentTheme(preset.bgValue);
                      return (
                        <div
                          key={preset.id}
                          onClick={() => handleSelectTheme(preset.bgValue)}
                          style={{
                            height: '84px',
                            borderRadius: '10px',
                            background: preset.preview,
                            backgroundSize: 'cover',
                            backgroundPosition: 'center',
                            border: active ? '2px solid #ffffff' : '1px solid rgba(255, 255, 255, 0.12)',
                            position: 'relative',
                            cursor: 'pointer',
                            overflow: 'hidden',
                            display: 'flex',
                            alignItems: 'flex-end',
                            padding: '10px',
                            boxSizing: 'border-box'
                          }}
                        >
                          <div style={{ position: 'absolute', inset: 0, background: 'rgba(0, 0, 0, 0.45)' }} />

                          <div style={{ position: 'relative', zIndex: 2, display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
                            <span style={{ fontSize: '0.76rem', fontWeight: '600', color: '#ffffff' }}>
                              {preset.name}
                            </span>
                            {active && (
                              <span style={{ background: '#ffffff', color: '#000000', borderRadius: '50%', width: '18px', height: '18px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                <Check size={12} strokeWidth={3} />
                              </span>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Fondo personalizado por URL */}
                <div style={{ borderTop: '1px solid rgba(255, 255, 255, 0.08)', paddingTop: '16px' }}>
                  <label style={{ fontSize: '0.78rem', fontWeight: '600', color: '#9ca3af', display: 'block', marginBottom: '8px' }}>
                    Enlace de imagen o GIF personalizado
                  </label>

                  <div style={{ display: 'flex', gap: '8px' }}>
                    <input
                      type="url"
                      placeholder="https://ejemplo.com/fondo.gif"
                      value={customUrl}
                      onChange={(e) => setCustomUrl(e.target.value)}
                      style={{
                        flex: 1,
                        background: 'rgba(255, 255, 255, 0.06)',
                        border: '1px solid rgba(255, 255, 255, 0.14)',
                        borderRadius: '8px',
                        padding: '8px 12px',
                        color: '#ffffff',
                        fontSize: '0.8rem',
                        outline: 'none'
                      }}
                    />
                    <button
                      type="button"
                      onClick={handleApplyCustomUrl}
                      style={{
                        background: 'rgba(255, 255, 255, 0.12)',
                        border: '1px solid rgba(255, 255, 255, 0.16)',
                        color: '#ffffff',
                        borderRadius: '8px',
                        padding: '8px 14px',
                        fontSize: '0.78rem',
                        fontWeight: '600',
                        cursor: 'pointer'
                      }}
                    >
                      Aplicar
                    </button>
                    <button
                      type="button"
                      onClick={handleSaveCustomTheme}
                      style={{
                        background: '#ffffff',
                        border: 'none',
                        color: '#0a0b0d',
                        borderRadius: '8px',
                        padding: '8px 14px',
                        fontSize: '0.78rem',
                        fontWeight: '600',
                        cursor: 'pointer'
                      }}
                    >
                      Guardar
                    </button>
                  </div>
                </div>

                {/* Lista de temas guardados */}
                {customThemes.length > 0 && (
                  <div style={{ borderTop: '1px solid rgba(255, 255, 255, 0.08)', paddingTop: '14px' }}>
                    <label style={{ fontSize: '0.74rem', color: '#9ca3af', display: 'block', marginBottom: '8px' }}>
                      Tus temas guardados
                    </label>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                      {customThemes.map((theme) => {
                        const active = isCurrentTheme(theme.bgValue);
                        return (
                          <div
                            key={theme.id}
                            onClick={() => handleSelectTheme(theme.bgValue)}
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: '8px',
                              background: active ? 'rgba(255, 255, 255, 0.16)' : 'rgba(255, 255, 255, 0.06)',
                              border: active ? '1px solid #ffffff' : '1px solid rgba(255, 255, 255, 0.12)',
                              padding: '5px 10px',
                              borderRadius: '6px',
                              cursor: 'pointer',
                              fontSize: '0.76rem'
                            }}
                          >
                            <span>{theme.name}</span>
                            <button
                              type="button"
                              onClick={(e) => handleDeleteCustomTheme(theme.id, e)}
                              aria-label="Borrar tema"
                              style={{ background: 'transparent', border: 'none', color: '#ef4444', cursor: 'pointer', padding: 0 }}
                            >
                              <Trash2 size={12} />
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'performance' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '14px 16px',
                    borderRadius: '10px',
                    background: 'rgba(255, 255, 255, 0.04)',
                    border: '1px solid rgba(255, 255, 255, 0.08)'
                  }}
                >
                  <div>
                    <div style={{ fontSize: '0.84rem', fontWeight: '600', color: '#ffffff' }}>
                      Ondas animadas de fondo
                    </div>
                    <div style={{ fontSize: '0.74rem', color: '#9ca3af', marginTop: '2px' }}>
                      Desactivalas si notas lentitud o caida de FPS.
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={handleToggleWaves}
                    style={{
                      width: '44px',
                      height: '24px',
                      borderRadius: '12px',
                      background: settings.disableWaves !== 'true' ? '#ffffff' : 'rgba(255, 255, 255, 0.16)',
                      border: 'none',
                      cursor: 'pointer',
                      position: 'relative',
                      transition: 'background 0.2s ease'
                    }}
                  >
                    <div
                      style={{
                        width: '18px',
                        height: '18px',
                        borderRadius: '50%',
                        background: settings.disableWaves !== 'true' ? '#0a0b0d' : '#ffffff',
                        position: 'absolute',
                        top: '3px',
                        left: settings.disableWaves !== 'true' ? '23px' : '3px',
                        transition: 'left 0.2s ease'
                      }}
                    />
                  </button>
                </div>
              </div>
            )}

            {activeTab === 'general' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '14px 16px',
                    borderRadius: '10px',
                    background: 'rgba(255, 255, 255, 0.04)',
                    border: '1px solid rgba(255, 255, 255, 0.08)'
                  }}
                >
                  <div>
                    <div style={{ fontSize: '0.84rem', fontWeight: '600', color: '#ffffff' }}>
                      Guia de bienvenida
                    </div>
                    <div style={{ fontSize: '0.74rem', color: '#9ca3af', marginTop: '2px' }}>
                      Vuelve a ver el recorrido guiado por la pagina.
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={handleRestartOnboarding}
                    style={{
                      background: '#ffffff',
                      color: '#0a0b0d',
                      border: 'none',
                      borderRadius: '8px',
                      padding: '8px 14px',
                      fontSize: '0.78rem',
                      fontWeight: '600',
                      cursor: 'pointer'
                    }}
                  >
                    Ver guia
                  </button>
                </div>

                <div
                  style={{
                    padding: '14px 16px',
                    borderRadius: '10px',
                    background: 'rgba(255, 255, 255, 0.03)',
                    border: '1px solid rgba(255, 255, 255, 0.06)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between'
                  }}
                >
                  <div>
                    <div style={{ fontSize: '0.82rem', fontWeight: '600', color: '#ffffff' }}>
                      Jueguitos Piola v2.0
                    </div>
                    <div style={{ fontSize: '0.72rem', color: '#6b7280', marginTop: '2px' }}>
                      Rama de desarrollo activa en Vercel
                    </div>
                  </div>

                  <a
                    href="https://github.com/HugoAleOlguin/jueguitos-piola"
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                      fontSize: '0.74rem',
                      color: '#9ca3af',
                      textDecoration: 'none'
                    }}
                  >
                    <span>Repositorio</span>
                    <ExternalLink size={12} />
                  </a>
                </div>
              </div>
            )}
          </div>
        </main>
      </motion.div>
    </motion.div>
  );
};
