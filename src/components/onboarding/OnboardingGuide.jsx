import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ONBOARDING_STEPS } from '../../data/onboardingSteps';

const STORAGE_KEY = 'jueguitos_onboarding_guide';

export const OnboardingGuide = ({ steps = ONBOARDING_STEPS }) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [targetRect, setTargetRect] = useState(null);
  const [isDesktop, setIsDesktop] = useState(() => {
    if (typeof window === 'undefined') return true;
    return window.innerWidth >= 1024;
  });
  const [isVisible, setIsVisible] = useState(() => {
    if (typeof window === 'undefined') return false;
    if (window.innerWidth < 1024) return false;
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      return saved !== 'completed' && saved !== 'dismissed';
    } catch {
      return false;
    }
  });

  const step = steps[currentStep] || steps[0];
  const isLastStep = currentStep === steps.length - 1;

  // Actualizar coordenadas del elemento objetivo
  const updateTargetRect = useCallback(() => {
    if (!step?.targetId) {
      setTargetRect(null);
      return;
    }

    const el = document.getElementById(step.targetId);
    if (!el) {
      setTargetRect(null);
      return;
    }

    const rect = el.getBoundingClientRect();
    setTargetRect({
      top: rect.top,
      left: rect.left,
      width: rect.width,
      height: rect.height,
      bottom: rect.bottom,
      right: rect.right
    });
  }, [step]);

  // Manejo de eventos de redimension, scroll y reinicio
  useEffect(() => {
    const handleResize = () => {
      const desktop = window.innerWidth >= 1024;
      setIsDesktop(desktop);
      if (!desktop) {
        setIsVisible(false);
      } else {
        updateTargetRect();
      }
    };

    const handleScroll = () => {
      updateTargetRect();
    };

    const handleRestart = () => {
      setCurrentStep(0);
      if (window.innerWidth >= 1024) {
        setIsVisible(true);
      }
    };

    const handleKeyDown = (e) => {
      if (!isVisible) return;
      if (e.key === 'Escape') {
        handleSkip();
      } else if (e.key === 'ArrowRight') {
        handleNext();
      } else if (e.key === 'ArrowLeft') {
        handlePrev();
      }
    };

    window.addEventListener('resize', handleResize);
    window.addEventListener('scroll', handleScroll, { passive: true });
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('jueguitos_restart_onboarding', handleRestart);

    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('scroll', handleScroll);
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('jueguitos_restart_onboarding', handleRestart);
    };
  }, [isVisible, updateTargetRect]);

  // Recalcular rect al cambiar de paso o al hacerse visible
  useEffect(() => {
    if (!isVisible || !isDesktop) return;

    // Pequeño retardo para asegurar que el DOM este completamente montado
    const timeoutId = setTimeout(() => {
      updateTargetRect();
      const el = document.getElementById(step?.targetId);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      }
    }, 60);

    return () => clearTimeout(timeoutId);
  }, [currentStep, isVisible, isDesktop, step, updateTargetRect]);

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep((prev) => prev + 1);
    } else {
      try {
        localStorage.setItem(STORAGE_KEY, 'completed');
      } catch (e) {
        console.warn('No se pudo guardar el estado de la guia:', e);
      }
      setIsVisible(false);
    }
  };

  const handlePrev = () => {
    if (currentStep > 0) {
      setCurrentStep((prev) => prev - 1);
    }
  };

  const handleSkip = () => {
    try {
      localStorage.setItem(STORAGE_KEY, 'dismissed');
    } catch (e) {
      console.warn('No se pudo guardar el estado de la guia:', e);
    }
    setIsVisible(false);
  };

  if (!isDesktop || !isVisible) {
    return null;
  }

  // Calcular la posicion exacta de la tarjeta segun el elemento objetivo
  const getCardStyle = () => {
    const cardWidth = Math.min(350, window.innerWidth - 32);
    const padding = 16;

    if (!targetRect) {
      return {
        position: 'fixed',
        bottom: `${padding}px`,
        right: `${padding}px`,
        width: `${cardWidth}px`,
        maxWidth: `calc(100vw - ${padding * 2}px)`,
        boxSizing: 'border-box'
      };
    }

    if (step.placement === 'bottom') {
      // Posicion debajo del buscador (centrado horizontalmente con el input)
      const idealLeft = targetRect.left + (targetRect.width / 2) - (cardWidth / 2);
      const safeLeft = Math.max(padding, Math.min(idealLeft, window.innerWidth - cardWidth - padding));
      const safeTop = Math.max(padding, Math.min(targetRect.bottom + 14, window.innerHeight - 240));
      return {
        position: 'fixed',
        top: `${Math.round(safeTop)}px`,
        left: `${Math.round(safeLeft)}px`,
        width: `${cardWidth}px`,
        maxWidth: `calc(100vw - ${padding * 2}px)`,
        boxSizing: 'border-box'
      };
    }

    if (step.placement === 'top-left' || step.placement === 'chat') {
      // Posicion arriba del boton de chat (que esta en la esquina inferior izquierda)
      const idealLeft = targetRect.left;
      const safeLeft = Math.max(padding, Math.min(idealLeft, window.innerWidth - cardWidth - padding));
      const safeBottom = Math.max(padding, Math.min(window.innerHeight - targetRect.top + 14, window.innerHeight - 100));
      return {
        position: 'fixed',
        bottom: `${Math.round(safeBottom)}px`,
        left: `${Math.round(safeLeft)}px`,
        width: `${cardWidth}px`,
        maxWidth: `calc(100vw - ${padding * 2}px)`,
        boxSizing: 'border-box'
      };
    }

    if (step.placement === 'bottom-right') {
      // Posicion debajo de ofertas y configuracion (alineado con el borde derecho)
      const idealLeft = targetRect.right - cardWidth;
      const safeLeft = Math.max(padding, Math.min(idealLeft, window.innerWidth - cardWidth - padding));
      const safeTop = Math.max(padding, Math.min(targetRect.bottom + 14, window.innerHeight - 240));
      return {
        position: 'fixed',
        top: `${Math.round(safeTop)}px`,
        left: `${Math.round(safeLeft)}px`,
        width: `${cardWidth}px`,
        maxWidth: `calc(100vw - ${padding * 2}px)`,
        boxSizing: 'border-box'
      };
    }

    return {
      position: 'fixed',
      bottom: `${padding}px`,
      right: `${padding}px`,
      width: `${cardWidth}px`,
      maxWidth: `calc(100vw - ${padding * 2}px)`,
      boxSizing: 'border-box'
    };
  };

  return (
    <AnimatePresence>
      <div style={{ position: 'fixed', inset: 0, zIndex: 9990, pointerEvents: 'none', overflow: 'hidden', width: '100vw', height: '100vh', maxWidth: '100vw', maxHeight: '100vh' }}>
        {/* Recorte del foco (Spotlight sobrio con sombra oscura expansiva) */}
        {targetRect && (
          <div
            style={{
              position: 'fixed',
              top: `${Math.round(Math.max(0, targetRect.top - 6))}px`,
              left: `${Math.round(Math.max(0, targetRect.left - 6))}px`,
              width: `${Math.round(Math.min(window.innerWidth - Math.max(0, targetRect.left - 6), targetRect.width + 12))}px`,
              height: `${Math.round(Math.min(window.innerHeight - Math.max(0, targetRect.top - 6), targetRect.height + 12))}px`,
              borderRadius: '12px',
              border: '1.5px solid rgba(255, 255, 255, 0.45)',
              boxShadow: '0 0 0 9999px rgba(0, 0, 0, 0.65)',
              pointerEvents: 'none',
              transition: 'all 0.28s cubic-bezier(0.16, 1, 0.3, 1)',
              zIndex: 9991
            }}
          />
        )}

        {/* Tarjeta de la guia posicionada dinamicamente */}
        <motion.aside
          role="region"
          aria-label="Guia paso a paso"
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          transition={{ duration: 0.22, ease: 'easeOut' }}
          style={{
            ...getCardStyle(),
            zIndex: 9995,
            background: 'rgba(18, 20, 24, 0.96)',
            backdropFilter: 'blur(20px)',
            WebkitBackdropFilter: 'blur(20px)',
            border: '1px solid rgba(255, 255, 255, 0.12)',
            borderRadius: '14px',
            boxShadow: '0 24px 48px rgba(0, 0, 0, 0.7)',
            padding: '18px 20px',
            color: '#ffffff',
            boxSizing: 'border-box',
            pointerEvents: 'auto',
            fontFamily: 'Inter, system-ui, -apple-system, sans-serif'
          }}
        >
          {/* Cabecera: Etiqueta, Indicador y Boton Omitir */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: '10px'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span
                style={{
                  fontSize: '0.68rem',
                  fontWeight: '700',
                  letterSpacing: '0.8px',
                  color: '#e5e7eb',
                  background: 'rgba(255, 255, 255, 0.08)',
                  border: '1px solid rgba(255, 255, 255, 0.14)',
                  padding: '2px 8px',
                  borderRadius: '5px'
                }}
              >
                {step.tag}
              </span>
              <span
                style={{
                  fontSize: '0.72rem',
                  fontWeight: '500',
                  color: '#9ca3af'
                }}
              >
                {currentStep + 1} de {steps.length}
              </span>
            </div>

            <button
              type="button"
              onClick={handleSkip}
              aria-label="Omitir guia"
              style={{
                background: 'transparent',
                border: 'none',
                color: '#9ca3af',
                fontSize: '0.75rem',
                cursor: 'pointer',
                padding: '4px 6px',
                borderRadius: '4px',
                transition: 'color 0.15s ease'
              }}
              onMouseEnter={(e) => { e.currentTarget.style.color = '#ffffff'; }}
              onMouseLeave={(e) => { e.currentTarget.style.color = '#9ca3af'; }}
            >
              Omitir
            </button>
          </div>

          {/* Cuerpo */}
          <div style={{ minHeight: '68px', marginBottom: '14px' }}>
            <h3
              style={{
                fontSize: '0.98rem',
                fontWeight: '600',
                color: '#ffffff',
                margin: '0 0 6px 0',
                letterSpacing: '-0.2px'
              }}
            >
              {step.title}
            </h3>
            <p
              style={{
                fontSize: '0.84rem',
                lineHeight: '1.45',
                color: '#9ca3af',
                margin: 0
              }}
            >
              {step.description}
            </p>
          </div>

          {/* Pie de controles */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              paddingTop: '12px',
              borderTop: '1px solid rgba(255, 255, 255, 0.08)'
            }}
          >
            {/* Puntos de avance */}
            <div style={{ display: 'flex', gap: '5px' }}>
              {steps.map((_, index) => (
                <div
                  key={index}
                  style={{
                    width: index === currentStep ? '16px' : '6px',
                    height: '6px',
                    borderRadius: '3px',
                    background: index === currentStep ? '#ffffff' : 'rgba(255, 255, 255, 0.2)',
                    transition: 'all 0.2s ease'
                  }}
                />
              ))}
            </div>

            {/* Botones de navegacion */}
            <div style={{ display: 'flex', gap: '8px' }}>
              {currentStep > 0 && (
                <button
                  type="button"
                  onClick={handlePrev}
                  style={{
                    background: 'transparent',
                    border: '1px solid rgba(255, 255, 255, 0.16)',
                    color: '#e5e7eb',
                    borderRadius: '8px',
                    padding: '6px 12px',
                    fontSize: '0.78rem',
                    fontWeight: '500',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease'
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.35)'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.16)'; }}
                >
                  Anterior
                </button>
              )}

              <button
                type="button"
                onClick={handleNext}
                style={{
                  background: '#ffffff',
                  border: 'none',
                  color: '#0f1117',
                  borderRadius: '8px',
                  padding: '6px 14px',
                  fontSize: '0.78rem',
                  fontWeight: '600',
                  cursor: 'pointer',
                  transition: 'background 0.15s ease'
                }}
                onMouseEnter={(e) => { e.currentTarget.style.background = '#e5e7eb'; }}
                onMouseLeave={(e) => { e.currentTarget.style.background = '#ffffff'; }}
              >
                {isLastStep ? 'Entendido' : 'Siguiente'}
              </button>
            </div>
          </div>
        </motion.aside>
      </div>
    </AnimatePresence>
  );
};
