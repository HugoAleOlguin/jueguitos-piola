import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { ACHIEVEMENTS } from '../data/achievementsData';

const AchievementContext = createContext(null);
const STORAGE_KEY = 'jueguitos_achievements';

const NON_SECRET_TOTAL = 11; // 11 logros normales, el 12 es speedrunner

// Reproductor sintetico de audio ligero (Web Audio nativo, sin archivos externos)
const playAchievementSound = () => {
  try {
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    if (!AudioContextClass) return;
    const ctx = new AudioContextClass();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(800, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(1200, ctx.currentTime + 0.1);

    gain.gain.setValueAtTime(0.2, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.1);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start();
    osc.stop(ctx.currentTime + 0.1);
  } catch {}
};

export const AchievementProvider = ({ children }) => {
  const [unlockedIds, setUnlockedIds] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        return parsed.unlocked || [];
      }
    } catch {}
    return [];
  });

  const [stats, setStats] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        return parsed.stats || { logoClicks: 0 };
      }
    } catch {}
    return { logoClicks: 0 };
  });

  const [speedrun, setSpeedrun] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        return parsed.speedrun || { startTime: null, completionTime: null };
      }
    } catch {}
    return { startTime: null, completionTime: null };
  });

  const [activeToast, setActiveToast] = useState(null);
  const toastTimeoutRef = useRef(null);
  const unlockedIdsRef = useRef(unlockedIds);
  const statsRef = useRef(stats);

  useEffect(() => {
    unlockedIdsRef.current = unlockedIds;
  }, [unlockedIds]);

  useEffect(() => {
    statsRef.current = stats;
  }, [stats]);

  // Guardar en almacenamiento local cada vez que cambie el estado
  useEffect(() => {
    try {
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({
          unlocked: unlockedIds,
          stats,
          speedrun
        })
      );
    } catch {}
  }, [unlockedIds, stats, speedrun]);

  // Funcion central de desbloqueo
  const unlock = useCallback((id) => {
    if (unlockedIdsRef.current.includes(id)) return;

    const achievement = ACHIEVEMENTS.find((a) => a.id === id);
    if (!achievement) return;

    // Sonido sintetizado limpio
    playAchievementSound();

    // Disparar aviso flotante animado (dura 6 segundos)
    if (toastTimeoutRef.current) clearTimeout(toastTimeoutRef.current);
    setActiveToast(achievement);
    toastTimeoutRef.current = setTimeout(() => {
      setActiveToast(null);
    }, 6000);

    setUnlockedIds((prev) => {
      if (prev.includes(id)) return prev;
      const nextUnlocked = [...prev, id];

      // Verificacion de condicion de speedrunner: si se desbloquearon los 11 logros normales
      const normalUnlockedCount = nextUnlocked.filter((item) => item !== 'speedrunner').length;
      if (normalUnlockedCount >= NON_SECRET_TOTAL && !nextUnlocked.includes('speedrunner')) {
        setSpeedrun((sp) => {
          const now = Date.now();
          if (sp.startTime && now - sp.startTime < 60000) {
            // Logro de speedrunner completado en menos de 1 minuto
            setTimeout(() => {
              unlock('speedrunner');
            }, 800);
            return { ...sp, completionTime: now };
          }
          return sp;
        });
      }

      return nextUnlocked;
    });
  }, []);

  // Gestor de eventos y contadores
  const trackEvent = useCallback((type, payload = {}) => {
    // Si el temporizador de speedrun no ha iniciado, arranca con la primera accion
    setSpeedrun((sp) => {
      if (!sp.startTime) {
        return { ...sp, startTime: Date.now() };
      }
      return sp;
    });

    switch (type) {
      case 'LOGO_CLICK': {
        const clicks = (statsRef.current.logoClicks || 0) + 1;
        statsRef.current.logoClicks = clicks;
        setStats((prev) => ({ ...prev, logoClicks: clicks }));
        if (clicks >= 50) {
          unlock('pesado');
        }
        break;
      }

      case 'FOOTER_CLICK': {
        unlock('curious_cat');
        break;
      }

      // Logicas reservadas para etapas futuras (dejadas vacias a peticion)
      case 'BLUR_CHANGE':
      case 'SAVE_THEME':
      case 'ROULETTE_SPIN':
      case 'COLOR_CHANGE':
      case 'SEARCH':
      case 'GAME_OPEN':
      case 'DOWNLOAD_CLICK':
      default:
        break;
    }
  }, [unlock]);

  // Restablecer logros (reinicia el progreso e inicia el temporizador de speedrun)
  const resetAchievements = useCallback(() => {
    const now = Date.now();
    unlockedIdsRef.current = [];
    setUnlockedIds([]);
    setStats({ logoClicks: 0 });
    setSpeedrun({
      startTime: now,
      completionTime: null
    });
    try {
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({
          unlocked: [],
          stats: { logoClicks: 0 },
          speedrun: { startTime: now, completionTime: null }
        })
      );
    } catch {}
  }, []);

  const allNormalCompleted = unlockedIds.filter((id) => id !== 'speedrunner').length >= NON_SECRET_TOTAL;

  useEffect(() => {
    if (import.meta.env.DEV) {
      window.__unlockAchievement = unlock;
      window.__resetAchievements = resetAchievements;
    }
  }, [unlock, resetAchievements]);

  return (
    <AchievementContext.Provider
      value={{
        unlockedIds,
        stats,
        speedrun,
        activeToast,
        dismissToast: () => setActiveToast(null),
        unlock,
        trackEvent,
        resetAchievements,
        allNormalCompleted
      }}
    >
      {children}
    </AchievementContext.Provider>
  );
};

export const useAchievements = () => {
  const context = useContext(AchievementContext);
  if (!context) {
    throw new Error('useAchievements debe ser utilizado dentro de AchievementProvider');
  }
  return context;
};
