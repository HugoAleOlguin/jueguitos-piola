import React, { useEffect } from 'react';
// placeholder
import { motion } from 'framer-motion';
import { useTheme } from '../context/ThemeContext';
import { getTagClass } from './GameCard';

const detailVariants = {
    hidden: { opacity: 0, scale: 0.96, y: 28, filter: 'blur(6px)' },
    visible: { 
        opacity: 1, 
        scale: 1,
        y: 0,
        filter: 'blur(0px)',
        transition: {
            type: 'spring',
            stiffness: 120,
            damping: 20,
            staggerChildren: 0.08,
            delayChildren: 0.06
        }
    }
};

const itemVariants = {
    hidden: { opacity: 0, y: 18, filter: 'blur(4px)' },
    visible: { 
        opacity: 1, 
        y: 0,
        filter: 'blur(0px)',
        transition: { type: 'spring', stiffness: 130, damping: 20 }
    }
};

export const GameDetail = ({ game, onBack }) => {
    const { updateSettings } = useTheme();
    const desc = game.fullDescription || game.description;

    // Proxy de imagen
    let proxiedUrl = game.image;
    if (game.image && game.image.startsWith('http')) {
        let proxyUrl = `https://wsrv.nl/?url=${encodeURIComponent(game.image)}&w=520&output=webp&q=85`;
        if (game.image.toLowerCase().includes('.gif')) proxyUrl += '&n=-1';
        proxiedUrl = proxyUrl;
    }

    // JSON-LD SEO
    useEffect(() => {
        let script = document.getElementById('game-json-ld');
        if (!script) {
            script = document.createElement('script');
            script.id = 'game-json-ld';
            script.type = 'application/ld+json';
            document.head.appendChild(script);
        }
        script.textContent = JSON.stringify({
            "@context": "https://schema.org",
            "@type": "VideoGame",
            "name": game.title,
            "description": desc,
            "image": game.image,
            "url": window.location.href,
            "genre": game.tags,
            "author": { "@type": "Organization", "name": "Jueguitos Piola" },
            "applicationCategory": "Game",
            "operatingSystem": "Windows"
        });
        return () => {
            const s = document.getElementById('game-json-ld');
            if (s) s.remove();
        };
    }, [game, desc]);

    const handleSetBackground = () => updateSettings({ bgType: 'url', bgValue: game.image });

    const handleDownloadClick = () => {
        const count = parseInt(localStorage.getItem('jueguitos_stat_downloads') || '0', 10);
        localStorage.setItem('jueguitos_stat_downloads', String(count + 1));
        window.dispatchEvent(new CustomEvent('jueguitos_achievement_event', { detail: { type: 'DOWNLOAD_CLICK' } }));
    };

    return (
        <motion.div
            variants={detailVariants}
            initial="hidden"
            animate="visible"
            exit="hidden"
            id="game-view"
        >
            <div className="game-detail-container">
                {/* ── Columna izquierda: Imagen + Usar como fondo ── */}
                <motion.div variants={itemVariants} style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <div style={{
                        borderRadius: '14px',
                        overflow: 'hidden',
                        border: '1px solid rgba(255,255,255,0.1)',
                        boxShadow: '0 16px 48px rgba(0,0,0,0.6)',
                        aspectRatio: '16 / 9',
                        background: '#111'
                    }}>
                        <img
                            src={proxiedUrl}
                            alt={game.title}
                            style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
                            onError={(e) => { e.target.src = 'favicon.png'; }}
                        />
                    </div>

                    <motion.button
                        className="btn-set-bg"
                        onClick={handleSetBackground}
                        whileHover={{ scale: 1.02, y: -0.5 }}
                        whileTap={{ scale: 0.98 }}
                    >
                        Usar como fondo
                    </motion.button>
                </motion.div>

                {/* ── Columna derecha: Info ── */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>

                    {/* Título */}
                    <motion.h1
                        variants={itemVariants}
                        style={{
                            fontFamily: 'var(--font-display)',
                            fontSize: 'clamp(1.8rem, 4vw, 3rem)',
                            fontWeight: 800,
                            margin: 0,
                            letterSpacing: '-0.5px',
                            lineHeight: 1.1,
                            color: '#fff',
                            textTransform: 'uppercase'
                        }}
                    >
                        {game.title}
                    </motion.h1>

                    {/* Tags */}
                    <motion.div
                        variants={itemVariants}
                        style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}
                    >
                        {game.tags.map(tag => (
                            <span key={tag} className={getTagClass(tag)}>{tag}</span>
                        ))}
                    </motion.div>

                    {/* Descripción */}
                    <motion.div
                        variants={itemVariants}
                        style={{
                            fontFamily: 'var(--font-main)',
                            fontSize: '0.95rem',
                            color: 'rgba(255,255,255,0.75)',
                            lineHeight: 1.7,
                            borderLeft: '2px solid rgba(255,255,255,0.12)',
                            paddingLeft: '16px'
                        }}
                        dangerouslySetInnerHTML={{ __html: desc }}
                    />

                    {/* Botones de descarga */}
                    <motion.div
                        variants={itemVariants}
                        style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', marginTop: '8px' }}
                    >
                        {game.buttons && game.buttons.length > 0 ? (
                            game.buttons.map((btn, i) => {
                                let label, url, style;
                                if (Array.isArray(btn)) {
                                    [label, url, style] = btn;
                                } else {
                                    ({ label, url, style } = btn);
                                }
                                const css = style === 'primary' ? 'btn-download' : 'btn-download-secondary';
                                return (
                                    <motion.a
                                        key={i}
                                        href={url}
                                        target="_blank"
                                        rel="noreferrer"
                                        className={css}
                                        onClick={handleDownloadClick}
                                        whileHover={{ scale: 1.04, y: -2 }}
                                        whileTap={{ scale: 0.95 }}
                                    >
                                        {label}
                                    </motion.a>
                                );
                            })
                        ) : (
                            game.downloadUrl && (
                                <motion.a
                                    href={game.downloadUrl}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="btn-download"
                                    onClick={handleDownloadClick}
                                    whileHover={{ scale: 1.04, y: -2 }}
                                    whileTap={{ scale: 0.95 }}
                                >
                                    ↓ Descargar
                                </motion.a>
                            )
                        )}
                    </motion.div>
                </div>
            </div>

            {/* Botón Volver — fuera del panel, alineado a la derecha */}
            <motion.div
                variants={itemVariants}
                style={{ display: 'flex', justifyContent: 'flex-start', marginTop: '18px' }}
            >
                <motion.button
                    className="btn btn-secondary"
                    onClick={onBack}
                    whileHover={{ x: -4, scale: 1.03 }}
                    whileTap={{ scale: 0.96 }}
                    transition={{ type: 'spring', stiffness: 260, damping: 22 }}
                    style={{
                        padding: '10px 22px',
                        cursor: 'pointer',
                        borderRadius: '10px',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '6px',
                        fontSize: '0.82rem',
                        fontWeight: 600,
                        letterSpacing: '0.03em'
                    }}
                >
                    ← Volver
                </motion.button>
            </motion.div>
        </motion.div>
    );
};
