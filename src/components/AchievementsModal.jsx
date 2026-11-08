import React, { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Tv, 
  Volume2, 
  HelpCircle, 
  ShieldAlert, 
  Eye, 
  Cpu, 
  Palette, 
  EyeOff, 
  Brush, 
  Dices, 
  ShoppingBag, 
  Zap, 
  Lock, 
  Check, 
  X, 
  Trophy,
  RotateCcw,
  Sparkles
} from 'lucide-react';
import { ACHIEVEMENTS } from '../data/achievementsData';
import { useAchievements } from '../context/AchievementContext';

const ICON_MAP = {
  Tv,
  Volume2,
  HelpCircle,
  ShieldAlert,
  Eye,
  Cpu,
  Palette,
  EyeOff,
  Brush,
  Dices,
  ShoppingBag,
  Zap
};

export const AchievementsModal = ({ isOpen, onClose }) => {
  const { unlockedIds, resetAchievements, allNormalCompleted } = useAchievements();
  const [filter, setFilter] = useState('all'); // 'all' | 'unlocked' | 'locked'

  // Bloquear scroll de la pagina de atras cuando el modal esta abierto
  useEffect(() => {
    if (!isOpen) return;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prevOverflow;
    };
  }, [isOpen]);

  const totalCount = ACHIEVEMENTS.length;
  const unlockedCount = unlockedIds.length;
  const progressPercent = Math.round((unlockedCount / totalCount) * 100);

  const filteredAchievements = useMemo(() => {
    return ACHIEVEMENTS.filter((item) => {
      const isUnlocked = unlockedIds.includes(item.id);
      if (filter === 'unlocked') return isUnlocked;
      if (filter === 'locked') return !isUnlocked;
      return true;
    });
  }, [filter, unlockedIds]);

  const handleReset = () => {
    const ok = window.confirm(
      '¿Restablecer todos los logros?\nEsto borrara tu progreso y activara el temporizador para que puedas intentar el logro SPEEDRUNNER en menos de 1 minuto.'
    );
    if (ok) {
      resetAchievements();
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.15 }}
        onClick={onClose}
        style={{
          position: 'fixed',
          inset: 0,
          zIndex: 10000,
          background: 'rgba(0, 0, 0, 0.78)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '24px'
        }}
        role="dialog"
        aria-modal="true"
        aria-label="Ventana de logros"
      >
        <motion.div
          initial={{ scale: 0.97, opacity: 0, y: 12 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.97, opacity: 0, y: 12 }}
          transition={{ duration: 0.18, ease: 'easeOut' }}
          onClick={(e) => e.stopPropagation()}
          style={{
            width: '980px',
            maxWidth: '95vw',
            height: '660px',
            maxHeight: '90vh',
            background: '#0d1017',
            border: '1px solid #232938',
            borderRadius: '18px',
            boxShadow: '0 30px 90px rgba(0, 0, 0, 0.95)',
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
            color: '#ffffff',
            fontFamily: 'Inter, system-ui, -apple-system, sans-serif',
            position: 'relative'
          }}
        >
          {/* Barra superior integrada directamente en la ventana */}
          <div
            style={{
              padding: '20px 28px',
              background: '#141822',
              borderBottom: '1px solid #222836',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              boxSizing: 'border-box'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
              <div
                style={{
                  width: '42px',
                  height: '42px',
                  borderRadius: '10px',
                  background: 'rgba(255, 215, 0, 0.12)',
                  border: '1px solid rgba(255, 215, 0, 0.3)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
              >
                <Trophy size={22} color="#ffd700" />
              </div>
              <div>
                <h2 style={{ fontSize: '1.15rem', fontWeight: '700', margin: 0, letterSpacing: '-0.2px', color: '#ffffff' }}>
                  Logros y Medallas
                </h2>
                <span style={{ fontSize: '0.78rem', color: '#8c95a6' }}>
                  Atajo: presiona L para abrir o cerrar
                </span>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <span
                style={{
                  fontSize: '0.74rem',
                  color: '#64748b',
                  background: '#1b202c',
                  padding: '4px 8px',
                  borderRadius: '6px',
                  border: '1px solid #283042'
                }}
              >
                Tecla L
              </span>

              <button
                type="button"
                onClick={onClose}
                aria-label="Cerrar ventana"
                style={{
                  background: '#1e2432',
                  border: '1px solid #2d3648',
                  color: '#8c95a6',
                  width: '34px',
                  height: '34px',
                  borderRadius: '8px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.color = '#ffffff';
                  e.currentTarget.style.borderColor = '#ffffff';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.color = '#8c95a6';
                  e.currentTarget.style.borderColor = '#2d3648';
                }}
              >
                <X size={18} />
              </button>
            </div>
          </div>

          {/* Barra de progreso global y filtros de visualizacion */}
          <div
            style={{
              padding: '16px 28px',
              background: '#10131a',
              borderBottom: '1px solid #1c212c',
              display: 'flex',
              flexDirection: 'column',
              gap: '12px',
              boxSizing: 'border-box'
            }}
          >
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                <span style={{ fontSize: '0.84rem', fontWeight: '600', color: '#e5e7eb' }}>
                  Progreso global: {unlockedCount} de {totalCount} completados
                </span>
                <span style={{ fontSize: '0.84rem', color: '#00f3ff', fontWeight: '700' }}>
                  {progressPercent}%
                </span>
              </div>

              <div
                style={{
                  width: '100%',
                  height: '8px',
                  borderRadius: '4px',
                  background: '#181d28',
                  overflow: 'hidden',
                  border: '1px solid #262e40'
                }}
              >
                <div
                  style={{
                    width: `${progressPercent}%`,
                    height: '100%',
                    background: 'linear-gradient(90deg, #00f3ff, #00ff88)',
                    transition: 'width 0.3s ease'
                  }}
                />
              </div>
            </div>

            {/* Pestañas de filtrado */}
            <div style={{ display: 'flex', gap: '8px' }}>
              <button
                type="button"
                onClick={() => setFilter('all')}
                style={{
                  padding: '7px 16px',
                  borderRadius: '8px',
                  border: filter === 'all' ? '1px solid #3d475f' : '1px solid transparent',
                  background: filter === 'all' ? '#1f2636' : 'transparent',
                  color: filter === 'all' ? '#ffffff' : '#8c95a6',
                  fontSize: '0.78rem',
                  fontWeight: filter === 'all' ? '600' : '500',
                  cursor: 'pointer'
                }}
              >
                Todos ({totalCount})
              </button>

              <button
                type="button"
                onClick={() => setFilter('unlocked')}
                style={{
                  padding: '7px 16px',
                  borderRadius: '8px',
                  border: filter === 'unlocked' ? '1px solid #3d475f' : '1px solid transparent',
                  background: filter === 'unlocked' ? '#1f2636' : 'transparent',
                  color: filter === 'unlocked' ? '#ffffff' : '#8c95a6',
                  fontSize: '0.78rem',
                  fontWeight: filter === 'unlocked' ? '600' : '500',
                  cursor: 'pointer'
                }}
              >
                Desbloqueados ({unlockedCount})
              </button>

              <button
                type="button"
                onClick={() => setFilter('locked')}
                style={{
                  padding: '7px 16px',
                  borderRadius: '8px',
                  border: filter === 'locked' ? '1px solid #3d475f' : '1px solid transparent',
                  background: filter === 'locked' ? '#1f2636' : 'transparent',
                  color: filter === 'locked' ? '#ffffff' : '#8c95a6',
                  fontSize: '0.78rem',
                  fontWeight: filter === 'locked' ? '600' : '500',
                  cursor: 'pointer'
                }}
              >
                Bloqueados ({totalCount - unlockedCount})
              </button>
            </div>
          </div>

          {/* Lista de logros tipo Steam */}
          <div
            style={{
              flex: 1,
              overflowY: 'auto',
              padding: '20px 28px',
              display: 'flex',
              flexDirection: 'column',
              gap: '12px',
              background: '#0d1017',
              boxSizing: 'border-box'
            }}
          >
            {filteredAchievements.map((item) => {
              const isUnlocked = unlockedIds.includes(item.id);
              const IconComponent = ICON_MAP[item.icon] || Trophy;
              const accentColor = item.color || '#00f3ff';

              // Regla especial de speedrunner:
              // Si no esta desbloqueado y los otros 11 no estan completados, la descripcion es ????
              // Si los otros 11 estan completados (o ya se desbloqueo), revela la sugerencia de como ganarlo en menos de 1 minuto
              const isSpeedrunner = item.id === 'speedrunner';
              const isRevealedSpeedrunner = isSpeedrunner && allNormalCompleted && !isUnlocked;

              return (
                <div
                  key={item.id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '18px',
                    padding: '16px 20px',
                    borderRadius: '12px',
                    background: isUnlocked 
                      ? '#141822' 
                      : (isRevealedSpeedrunner ? 'rgba(0, 255, 136, 0.04)' : '#11141c'),
                    border: isUnlocked 
                      ? `1px solid ${accentColor}44` 
                      : (isRevealedSpeedrunner ? '1px dashed #00ff8855' : '1px solid #1c212c'),
                    transition: 'border-color 0.15s ease'
                  }}
                >
                  {/* Icono de la medalla con espacio y sin candado amontonado */}
                  <div
                    style={{
                      width: '56px',
                      height: '56px',
                      minWidth: '56px',
                      borderRadius: '12px',
                      background: isUnlocked 
                        ? `${accentColor}18` 
                        : (isRevealedSpeedrunner ? 'rgba(0, 255, 136, 0.08)' : '#161922'),
                      border: isUnlocked 
                        ? `1.5px solid ${accentColor}` 
                        : (isRevealedSpeedrunner ? '1.5px solid #00ff8877' : '1.5px solid #232938'),
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}
                  >
                    <IconComponent
                      size={28}
                      color={isUnlocked ? accentColor : (isRevealedSpeedrunner ? '#00ff88' : '#3e4659')}
                      strokeWidth={isUnlocked ? 2.2 : 1.5}
                    />
                  </div>

                  {/* Informacion del logro */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '5px' }}>
                      <span
                        style={{
                          fontSize: '0.98rem',
                          fontWeight: '700',
                          color: isUnlocked ? '#ffffff' : (isRevealedSpeedrunner ? '#00ff88' : '#cbd5e1')
                        }}
                      >
                        {item.title}
                      </span>

                      {isRevealedSpeedrunner && (
                        <span
                          style={{
                            fontSize: '0.68rem',
                            color: '#00ff88',
                            background: 'rgba(0, 255, 136, 0.12)',
                            padding: '2px 8px',
                            borderRadius: '4px',
                            fontWeight: '600'
                          }}
                        >
                          Desafio final disponible
                        </span>
                      )}
                    </div>

                    <p
                      style={{
                        fontSize: '0.84rem',
                        lineHeight: '1.45',
                        color: isUnlocked ? '#94a3b8' : (isRevealedSpeedrunner ? '#a7f3d0' : '#475569'),
                        margin: 0,
                        fontWeight: isUnlocked || isRevealedSpeedrunner ? '400' : '600',
                        letterSpacing: isUnlocked || isRevealedSpeedrunner ? 'normal' : '1.5px'
                      }}
                    >
                      {isUnlocked
                        ? item.description
                        : isRevealedSpeedrunner
                        ? 'Desafio revelado: Debes desbloquear todos los demas logros en menos de 1 minuto. Puedes usar el boton de restablecer abajo para iniciar el intento.'
                        : '????'}
                    </p>
                  </div>

                  {/* Estado lateral */}
                  <div style={{ display: 'flex', alignItems: 'center' }}>
                    {isUnlocked ? (
                      <span
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '6px',
                          fontSize: '0.78rem',
                          fontWeight: '700',
                          color: accentColor,
                          background: `${accentColor}18`,
                          border: `1px solid ${accentColor}44`,
                          padding: '6px 14px',
                          borderRadius: '8px'
                        }}
                      >
                        <Check size={14} strokeWidth={3} />
                        <span>Desbloqueado</span>
                      </span>
                    ) : (
                      <span
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '8px',
                          fontSize: '0.78rem',
                          color: isRevealedSpeedrunner ? '#00ff88' : '#64748b',
                          background: isRevealedSpeedrunner ? 'rgba(0, 255, 136, 0.1)' : '#151922',
                          border: isRevealedSpeedrunner ? '1px solid rgba(0, 255, 136, 0.3)' : '1px solid #222836',
                          padding: '6px 14px',
                          borderRadius: '8px',
                          fontWeight: '500'
                        }}
                      >
                        {isRevealedSpeedrunner ? (
                          <>
                            <Sparkles size={13} color="#00ff88" />
                            <span>Disponible</span>
                          </>
                        ) : (
                          <>
                            <Lock size={13} color="#64748b" />
                            <span>Bloqueado</span>
                          </>
                        )}
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Barra inferior con boton de restablecimiento (para intentar el speedrunner) */}
          <div
            style={{
              padding: '14px 28px',
              borderTop: '1px solid #1c212c',
              background: '#10131a',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              boxSizing: 'border-box'
            }}
          >
            <span style={{ fontSize: '0.78rem', color: '#64748b' }}>
              Al restablecer, se reinicia el temporizador de 1 minuto para el logro SPEEDRUNNER.
            </span>

            <button
              type="button"
              onClick={handleReset}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                background: '#1f2636',
                border: '1px solid #333d52',
                color: '#e5e7eb',
                borderRadius: '8px',
                padding: '7px 16px',
                fontSize: '0.78rem',
                fontWeight: '600',
                cursor: 'pointer',
                transition: 'all 0.15s ease'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = '#ef4444';
                e.currentTarget.style.color = '#ef4444';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = '#333d52';
                e.currentTarget.style.color = '#e5e7eb';
              }}
            >
              <RotateCcw size={14} />
              <span>Restablecer logros</span>
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};
