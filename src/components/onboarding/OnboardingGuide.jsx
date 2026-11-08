import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight, Check } from 'lucide-react';

const STORAGE_KEY = 'jueguitos_onboarding_guide';

const DEFAULT_STEPS = [
  {
    id: 1,
    tag: 'CATALOGO',
    badge: '1 de 3',
    title: 'Explora o prueba tu suerte',
    description: 'Busca por nombre, filtra por categorias o usa la ruleta para elegir un juego al azar.'
  },
  {
    id: 2,
    tag: 'COMUNIDAD',
    badge: '2 de 3',
    title: 'Chat en tiempo real',
    description: 'Comparte con otros jugadores, personaliza tu avatar y cambia el color de tu nombre.'
  },
  {
    id: 3,
    tag: 'BENEFICIOS Y AJUSTES',
    badge: '3 de 3',
    title: 'Juegos gratis y personalizacion',
    description: 'Revisa ofertas de Steam o Epic en la seccion de Juegos Gratis y cambia el fondo animado desde Ajustes.'
  }
];

export const OnboardingGuide = ({ steps = DEFAULT_STEPS }) => {
  const [currentStep, setCurrentStep] = useState(0);
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

  useEffect(() => {
    const handleResize = () => {
      setIsDesktop(window.innerWidth >= 1024);
    };

    const handleRestart = () => {
      setCurrentStep(0);
      if (window.innerWidth >= 1024) {
        setIsVisible(true);
      }
    };

    const handleStorageChange = (e) => {
      if (e.key === STORAGE_KEY && !e.newValue) {
        handleRestart();
      }
    };

    window.addEventListener('resize', handleResize);
    window.addEventListener('jueguitos_restart_onboarding', handleRestart);
    window.addEventListener('storage', handleStorageChange);

    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('jueguitos_restart_onboarding', handleRestart);
      window.removeEventListener('storage', handleStorageChange);
    };
  }, []);

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

  const step = steps[currentStep] || steps[0];
  const isLastStep = currentStep === steps.length - 1;

  return (
    <AnimatePresence>
      {isDesktop && isVisible && (
        <motion.aside
          role="region"
          aria-label="Guia de bienvenida"
          initial={{ opacity: 0, y: 18, scale: 0.96 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 18, scale: 0.96 }}
          transition={{ duration: 0.24, ease: 'easeOut' }}
          style={{
            position: 'fixed',
            bottom: '24px',
            right: '24px',
            zIndex: 9000,
            width: '360px',
            maxWidth: 'calc(100vw - 48px)',
            background: 'rgba(15, 17, 23, 0.9)',
            backdropFilter: 'blur(16px)',
            WebkitBackdropFilter: 'blur(16px)',
            border: '1px solid rgba(0, 243, 255, 0.2)',
            borderRadius: '16px',
            boxShadow: '0 18px 40px rgba(0, 0, 0, 0.5), 0 0 0 1px rgba(0, 243, 255, 0.08)',
            padding: '18px 20px',
            color: '#ffffff',
            boxSizing: 'border-box',
            pointerEvents: 'auto'
          }}
        >
          {/* Fila superior: etiqueta, indicador y boton omitir */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: '12px'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span
                style={{
                  fontSize: '0.68rem',
                  fontWeight: '700',
                  letterSpacing: '0.8px',
                  color: '#00f3ff',
                  background: 'rgba(0, 243, 255, 0.1)',
                  border: '1px solid rgba(0, 243, 255, 0.25)',
                  padding: '2px 8px',
                  borderRadius: '6px'
                }}
              >
                {step.tag}
              </span>
              <span
                style={{
                  fontSize: '0.72rem',
                  fontWeight: '600',
                  color: '#8b949e'
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
                color: '#8b949e',
                fontSize: '0.75rem',
                cursor: 'pointer',
                padding: '4px 6px',
                borderRadius: '4px',
                transition: 'color 0.15s ease'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.color = '#ffffff';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.color = '#8b949e';
              }}
            >
              Omitir
            </button>
          </div>

          {/* Cuerpo interactivo del paso */}
          <div style={{ minHeight: '84px', marginBottom: '14px' }}>
            <h3
              style={{
                fontSize: '0.95rem',
                fontWeight: '700',
                color: '#ffffff',
                margin: '0 0 6px 0',
                lineHeight: '1.3'
              }}
            >
              {step.title}
            </h3>
            <p
              style={{
                fontSize: '0.82rem',
                color: '#cbd5e1',
                margin: 0,
                lineHeight: '1.45'
              }}
            >
              {step.description}
            </p>
          </div>

          {/* Fila inferior: progreso y navegacion */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              paddingTop: '10px',
              borderTop: '1px solid rgba(255, 255, 255, 0.08)'
            }}
          >
            {/* Indicadores de paso */}
            <div
              style={{
                display: 'flex',
                gap: '6px',
                alignItems: 'center'
              }}
            >
              {steps.map((_, idx) => (
                <span
                  key={idx}
                  style={{
                    display: 'block',
                    height: '4px',
                    width: idx === currentStep ? '20px' : '6px',
                    borderRadius: '2px',
                    background:
                      idx === currentStep
                        ? '#00f3ff'
                        : 'rgba(255, 255, 255, 0.18)',
                    transition: 'all 0.25s ease'
                  }}
                />
              ))}
            </div>

            {/* Botones de accion */}
            <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
              {currentStep > 0 && (
                <button
                  type="button"
                  onClick={handlePrev}
                  style={{
                    background: 'rgba(255, 255, 255, 0.06)',
                    border: '1px solid rgba(255, 255, 255, 0.12)',
                    borderRadius: '8px',
                    color: '#e2e8f0',
                    fontSize: '0.78rem',
                    fontWeight: '600',
                    padding: '6px 12px',
                    cursor: 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '4px',
                    transition: 'all 0.15s ease'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = 'rgba(255, 255, 255, 0.12)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = 'rgba(255, 255, 255, 0.06)';
                  }}
                >
                  <ChevronLeft size={13} />
                  Anterior
                </button>
              )}

              <button
                type="button"
                onClick={handleNext}
                style={{
                  background: '#00f3ff',
                  border: 'none',
                  borderRadius: '8px',
                  color: '#080d14',
                  fontSize: '0.78rem',
                  fontWeight: '700',
                  padding: '6px 14px',
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '4px',
                  boxShadow: '0 0 14px rgba(0, 243, 255, 0.3)',
                  transition: 'all 0.15s ease'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = '#38f6ff';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = '#00f3ff';
                }}
              >
                {isLastStep ? (
                  <>
                    <Check size={13} strokeWidth={2.5} />
                    Entendido
                  </>
                ) : (
                  <>
                    Siguiente
                    <ChevronRight size={13} />
                  </>
                )}
              </button>
            </div>
          </div>
        </motion.aside>
      )}
    </AnimatePresence>
  );
};
