import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export const UserProfileViewModal = ({ user, onClose }) => {
    if (!user) return null;

    return (
        <AnimatePresence>
            <motion.div 
                className="user-profile-view-overlay"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
                style={{
                    position: 'fixed',
                    inset: 0,
                    backgroundColor: 'rgba(0, 0, 0, 0.55)',
                    backdropFilter: 'blur(12px)',
                    WebkitBackdropFilter: 'blur(12px)',
                    zIndex: 10000,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: '16px'
                }}
                onClick={(e) => {
                    if (e.target === e.currentTarget) onClose();
                }}
            >
                <motion.div
                    initial={{ opacity: 0, scale: 0.94, y: 15 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.94, y: 15 }}
                    transition={{ ease: [0.16, 1, 0.3, 1], duration: 0.28 }}
                    style={{
                        position: 'relative',
                        width: '360px',
                        maxWidth: '92vw',
                        background: 'rgba(12, 14, 20, 0.92)',
                        backdropFilter: 'blur(24px) saturate(1.3)',
                        WebkitBackdropFilter: 'blur(24px) saturate(1.3)',
                        border: '1px solid rgba(255, 255, 255, 0.12)',
                        borderRadius: '20px',
                        padding: '24px',
                        boxShadow: '0 24px 60px rgba(0, 0, 0, 0.75), 0 0 1px 1px rgba(255, 255, 255, 0.08)',
                        color: '#fff',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        textAlign: 'center'
                    }}
                >
                    {/* Botón Cerrar */}
                    <button
                        onClick={onClose}
                        aria-label="Cerrar perfil"
                        style={{
                            position: 'absolute',
                            top: '14px',
                            right: '14px',
                            background: 'rgba(255, 255, 255, 0.05)',
                            border: '1px solid rgba(255, 255, 255, 0.1)',
                            borderRadius: '50%',
                            width: '28px',
                            height: '28px',
                            color: 'rgba(255, 255, 255, 0.7)',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            transition: 'all 0.2s ease'
                        }}
                    >
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                            <line x1="18" y1="6" x2="6" y2="18"></line>
                            <line x1="6" y1="6" x2="18" y2="18"></line>
                        </svg>
                    </button>

                    {/* Glow de acento personalizado */}
                    <div style={{
                        position: 'absolute',
                        top: 0,
                        left: '50%',
                        transform: 'translateX(-50%)',
                        width: '180px',
                        height: '60px',
                        background: `radial-gradient(ellipse at center, ${user.authorColor || user.nameColor || '#00f3ff'}33, transparent 70%)`,
                        pointerEvents: 'none'
                    }} />

                    {/* Avatar Grande */}
                    <div style={{
                        position: 'relative',
                        width: '84px',
                        height: '84px',
                        borderRadius: '22px',
                        padding: '3px',
                        background: `linear-gradient(135deg, ${user.authorColor || user.nameColor || '#00f3ff'}, transparent)`,
                        boxShadow: `0 0 24px ${(user.authorColor || user.nameColor || '#00f3ff')}44`,
                        marginBottom: '14px'
                    }}>
                        <img 
                            src={user.authorAvatar || user.avatar} 
                            alt={user.authorName || user.name}
                            style={{
                                width: '100%',
                                height: '100%',
                                borderRadius: '19px',
                                objectFit: 'cover',
                                background: '#090a0f',
                                display: 'block'
                            }}
                        />
                    </div>

                    {/* Nombre de Usuario */}
                    <h3 style={{
                        margin: '0 0 4px 0',
                        fontSize: '1.25rem',
                        fontWeight: '800',
                        color: user.authorColor || user.nameColor || '#00f3ff',
                        fontFamily: 'Space Grotesk, sans-serif',
                        letterSpacing: '-0.3px'
                    }}>
                        @{user.authorName || user.name}
                    </h3>

                    {/* Rol / Badge */}
                    <span style={{
                        fontSize: '0.68rem',
                        textTransform: 'uppercase',
                        fontFamily: 'Space Mono, monospace',
                        letterSpacing: '0.8px',
                        color: 'rgba(255, 255, 255, 0.45)',
                        marginBottom: '16px'
                    }}>
                        Jugador Piola
                    </span>

                    {/* Tarjeta de Biografía y Datos */}
                    <div style={{
                        width: '100%',
                        background: 'rgba(255, 255, 255, 0.03)',
                        border: '1px solid rgba(255, 255, 255, 0.08)',
                        borderRadius: '14px',
                        padding: '12px 14px',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '10px',
                        textAlign: 'left'
                    }}>
                        <div>
                            <div style={{ fontSize: '0.65rem', color: 'rgba(255, 255, 255, 0.4)', textTransform: 'uppercase', letterSpacing: '0.7px', fontFamily: 'Space Mono, monospace', marginBottom: '2px' }}>
                                Biografía / Estado
                            </div>
                            <div style={{ fontSize: '0.8rem', color: 'rgba(255, 255, 255, 0.85)', lineHeight: 1.4, wordBreak: 'break-word' }}>
                                {user.description || 'Explorando jueguitos piola.'}
                            </div>
                        </div>

                        {user.favoriteGame && (
                            <div style={{ borderTop: '1px solid rgba(255, 255, 255, 0.05)', paddingTop: '8px' }}>
                                <div style={{ fontSize: '0.65rem', color: 'rgba(255, 255, 255, 0.4)', textTransform: 'uppercase', letterSpacing: '0.7px', fontFamily: 'Space Mono, monospace', marginBottom: '2px' }}>
                                    Juego Favorito
                                </div>
                                <div style={{ fontSize: '0.8rem', color: '#ffd700', fontWeight: '600', fontFamily: 'Space Grotesk, sans-serif' }}>
                                    {user.favoriteGame}
                                </div>
                            </div>
                        )}
                    </div>
                </motion.div>
            </motion.div>
        </AnimatePresence>
    );
};
