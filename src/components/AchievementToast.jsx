import React from 'react';
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
  Trophy, 
  X 
} from 'lucide-react';
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

export const AchievementToast = () => {
  const { activeToast, dismissToast } = useAchievements();

  const IconComponent = activeToast ? (ICON_MAP[activeToast.icon] || Trophy) : Trophy;
  const accentColor = activeToast?.color || '#00f3ff';

  return (
    <AnimatePresence>
      {activeToast && (
        <div
          style={{
            position: 'fixed',
            bottom: '24px',
            right: '24px',
            zIndex: 11000,
            pointerEvents: 'none'
          }}
        >
          <motion.div
            key={activeToast.id}
            initial={{ opacity: 0, y: 24, scale: 0.92 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.92 }}
            transition={{ duration: 0.26, ease: [0.16, 1, 0.3, 1] }}
            style={{
            pointerEvents: 'auto',
            width: '340px',
            maxWidth: 'calc(100vw - 32px)',
            background: '#12151e',
            border: `1.5px solid ${accentColor}`,
            borderRadius: '14px',
            boxShadow: `0 20px 50px rgba(0, 0, 0, 0.85), 0 0 25px ${accentColor}25`,
            padding: '14px 16px',
            display: 'flex',
            alignItems: 'center',
            gap: '14px',
            color: '#ffffff',
            boxSizing: 'border-box',
            fontFamily: 'Inter, system-ui, -apple-system, sans-serif'
          }}
        >
          {/* Icono con marco de color */}
          <div
            style={{
              width: '46px',
              height: '46px',
              minWidth: '46px',
              borderRadius: '10px',
              background: `${accentColor}18`,
              border: `1px solid ${accentColor}55`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            <IconComponent size={24} color={accentColor} strokeWidth={2.2} />
          </div>

          {/* Textos del aviso */}
          <div style={{ flex: 1, minWidth: 0 }}>
            <span
              style={{
                display: 'block',
                fontSize: '0.68rem',
                fontWeight: '700',
                textTransform: 'uppercase',
                letterSpacing: '0.8px',
                color: accentColor,
                marginBottom: '2px'
              }}
            >
              Logro desbloqueado
            </span>
            <h4
              style={{
                fontSize: '0.92rem',
                fontWeight: '700',
                color: '#ffffff',
                margin: '0 0 2px 0',
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis'
              }}
            >
              {activeToast.title}
            </h4>
            <p
              style={{
                fontSize: '0.74rem',
                color: '#94a3b8',
                margin: 0,
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis'
              }}
            >
              {activeToast.description}
            </p>
          </div>

          {/* Boton cerrar */}
          <button
            type="button"
            onClick={dismissToast}
            aria-label="Cerrar aviso"
            style={{
              background: 'transparent',
              border: 'none',
              color: '#64748b',
              cursor: 'pointer',
              padding: '4px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              borderRadius: '4px'
            }}
            onMouseEnter={(e) => { e.currentTarget.style.color = '#ffffff'; }}
            onMouseLeave={(e) => { e.currentTarget.style.color = '#64748b'; }}
          >
            <X size={15} />
          </button>
        </motion.div>
      </div>
      )}
    </AnimatePresence>
  );
};
