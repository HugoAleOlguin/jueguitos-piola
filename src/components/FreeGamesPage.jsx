import React, { useState, useEffect, useCallback } from 'react';
// placeholder
import { motion, AnimatePresence } from 'framer-motion';

// URL con sort por popularidad para mostrar lo mejor primero
const GAMERPOWER_URL = 'https://www.gamerpower.com/api/giveaways?type=game&sort-by=popularity';

// Fuentes de datos: Intentar llamada directa primero (GamerPower tiene CORS habilitado) y usar proxies como respaldo
const SOURCES = [
    GAMERPOWER_URL,
    `https://corsproxy.io/?url=${encodeURIComponent(GAMERPOWER_URL)}`,
    `https://api.codetabs.com/v1/proxy?quest=${encodeURIComponent(GAMERPOWER_URL)}`,
];

// Mapa completo de plataformas soportadas por GamerPower
const PLATFORM_META = {
    'Steam':          { color: '#1b2838', accent: '#c7d5e0', logo: 'https://cdn.simpleicons.org/steam/c7d5e0' },
    'Epic Games':     { color: '#1a1a1a', accent: '#ffffff', logo: 'https://cdn.simpleicons.org/epicgames/ffffff' },
    'GOG':            { color: '#86328a', accent: '#ffffff', logo: 'https://cdn.simpleicons.org/gogdotcom/ffffff' },
    'Xbox':           { color: '#107c10', accent: '#ffffff', logo: 'https://cdn.simpleicons.org/xbox/ffffff' },
    'Itch.io':        { color: '#fa5c5c', accent: '#ffffff', logo: 'https://cdn.simpleicons.org/itchdotio/ffffff' },
    'Ubisoft':        { color: '#0070d1', accent: '#ffffff', logo: 'https://cdn.simpleicons.org/ubisoft/ffffff' },
    'Battle.net':     { color: '#148eff', accent: '#ffffff', logo: 'https://cdn.simpleicons.org/blizzard/ffffff' },
    'DRM-Free':       { color: '#252525', accent: '#aaa',    logo: null },
    'Otras':          { color: '#1e1e1e', accent: '#888',    logo: null },
};

const PLATFORM_ORDER = ['Steam', 'Epic Games', 'GOG', 'Xbox', 'Itch.io', 'Ubisoft', 'Battle.net', 'DRM-Free', 'Otras'];
const EXPANDED_DEFAULT = new Set(['Steam', 'Epic Games']);

function detectPlatform(str) {
    if (!str) return 'Otras';
    const p = str.toLowerCase();
    if (p.includes('steam'))   return 'Steam';
    if (p.includes('epic'))    return 'Epic Games';
    if (p.includes('gog'))     return 'GOG';
    if (p.includes('xbox') || p.includes('microsoft')) return 'Xbox';
    if (p.includes('itch'))    return 'Itch.io';
    if (p.includes('ubisoft') || p.includes('uplay'))  return 'Ubisoft';
    if (p.includes('battle') || p.includes('blizzard')) return 'Battle.net';
    if (p.includes('drm'))     return 'DRM-Free';
    return 'Otras';
}

function parseWorth(str) {
    if (!str || str === 'N/A' || str === '$0.00') return null;
    return str.startsWith('$') ? str : `$${str}`;
}

function daysLeft(endDateStr) {
    if (!endDateStr || endDateStr === 'N/A') return null;
    const d = new Date(endDateStr.replace(' ', 'T') + 'Z');
    if (isNaN(d)) return null;
    const diff = Math.ceil((d - Date.now()) / 86400000);
    return diff >= 0 ? diff : null;
}

// ── Card de giveaway ─────────────────────────────────────────────────────────
function GiveawayCard({ game, index }) {
    const worth = parseWorth(game.worth);
    const remaining = daysLeft(game.end_date);
    const urgent = remaining !== null && remaining <= 3;

    return (
        <motion.a
            href={game.open_giveaway_url}
            target="_blank"
            rel="noreferrer"
            initial={{ opacity: 0, y: 12, filter: 'blur(4px)' }}
            animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
            transition={{ type: 'spring', stiffness: 130, damping: 18, delay: Math.min(index * 0.035, 0.35) }}
            whileHover={{ y: -4, boxShadow: '0 20px 56px rgba(0,0,0,0.7)' }}
            whileTap={{ scale: 0.97 }}
            style={{
                display: 'flex',
                flexDirection: 'column',
                textDecoration: 'none',
                color: 'inherit',
                background: 'rgba(5,5,5,0.94)',
                backdropFilter: 'blur(14px)',
                WebkitBackdropFilter: 'blur(14px)',
                border: `1px solid ${urgent ? 'rgba(220,38,38,0.3)' : 'rgba(255,255,255,0.09)'}`,
                borderRadius: '12px',
                overflow: 'hidden',
                cursor: 'pointer',
                transition: 'border-color 0.2s ease',
            }}
        >
            {/* Thumbnail */}
            <div style={{ position: 'relative', aspectRatio: '16/9', background: '#0a0a0a', overflow: 'hidden', flexShrink: 0 }}>
                {game.thumbnail && (
                    <img
                        src={game.thumbnail}
                        alt={game.title}
                        loading="lazy"
                        style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
                        onError={(e) => { e.target.style.display = 'none'; }}
                    />
                )}

                {/* Fila de badges sobre la imagen */}
                <div style={{ position: 'absolute', top: 0, left: 0, right: 0, padding: '8px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    {/* Valor original */}
                    {worth && (
                        <span style={{
                            background: 'rgba(0,0,0,0.78)',
                            backdropFilter: 'blur(8px)',
                            border: '1px solid rgba(255,255,255,0.12)',
                            borderRadius: '6px',
                            padding: '3px 8px',
                            fontSize: '0.7rem',
                            fontFamily: 'var(--font-display)',
                            fontWeight: 700,
                            color: '#a3e635',
                            letterSpacing: '0.02em',
                            textDecoration: 'line-through',
                            textDecorationColor: 'rgba(163,230,53,0.4)'
                        }}>
                            {worth}
                        </span>
                    )}

                    {/* Urgencia */}
                    {urgent && (
                        <span style={{
                            background: 'rgba(220,38,38,0.85)',
                            border: '1px solid rgba(220,38,38,0.5)',
                            borderRadius: '6px',
                            padding: '3px 8px',
                            fontSize: '0.68rem',
                            fontFamily: 'var(--font-display)',
                            fontWeight: 700,
                            color: '#fff',
                            marginLeft: 'auto'
                        }}>
                            {remaining === 0 ? 'Último día' : `${remaining}d`}
                        </span>
                    )}
                </div>
            </div>

            {/* Info mínima */}
            <div style={{ padding: '11px 13px', display: 'flex', flexDirection: 'column', gap: '7px' }}>
                <p style={{
                    margin: 0,
                    fontSize: '0.82rem',
                    fontWeight: 700,
                    fontFamily: 'var(--font-display)',
                    color: '#f1f1f1',
                    lineHeight: 1.3,
                    display: '-webkit-box',
                    WebkitLineClamp: 2,
                    WebkitBoxOrient: 'vertical',
                    overflow: 'hidden',
                    minHeight: '2.1em'
                }}>
                    {game.title}
                </p>

                {/* Usuarios que lo reclamaron */}
                {game.users > 0 && (
                    <span style={{ fontSize: '0.68rem', color: 'rgba(255,255,255,0.3)', fontFamily: 'var(--font-main)' }}>
                        {game.users.toLocaleString('es-AR')} reclamaron
                    </span>
                )}

                <div style={{ marginTop: 'auto' }}>
                    <span style={{
                        fontSize: '0.68rem',
                        fontFamily: 'var(--font-display)',
                        fontWeight: 700,
                        color: 'rgba(255,255,255,0.25)',
                        letterSpacing: '0.06em',
                        textTransform: 'uppercase'
                    }}>
                        Reclamar &rarr;
                    </span>
                </div>
            </div>
        </motion.a>
    );
}

// ── Sección colapsable ───────────────────────────────────────────────────────
function PlatformSection({ platformKey, games, defaultOpen, totalWorth }) {
    const [open, setOpen] = useState(defaultOpen);
    const meta = PLATFORM_META[platformKey];

    return (
        <div>
            <button
                onClick={() => setOpen(v => !v)}
                style={{
                    width: '100%',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    padding: '13px 16px',
                    background: open ? 'rgba(0,0,0,0.82)' : 'rgba(0,0,0,0.72)',
                    backdropFilter: 'blur(16px)',
                    WebkitBackdropFilter: 'blur(16px)',
                    border: '1px solid rgba(255,255,255,0.09)',
                    borderRadius: open ? '12px 12px 0 0' : '12px',
                    cursor: 'pointer',
                    textAlign: 'left',
                    transition: 'background 0.15s ease, border-radius 0.15s ease',
                    boxShadow: '0 4px 20px rgba(0,0,0,0.4)',
                }}
            >
                {/* Badge de plataforma */}
                <div style={{
                    display: 'flex', alignItems: 'center', gap: '6px',
                    background: meta.color, borderRadius: '6px', padding: '4px 10px', flexShrink: 0
                }}>
                    {meta.logo && (
                        <img src={meta.logo} alt={platformKey} style={{ width: '13px', height: '13px' }}
                            onError={(e) => { e.target.style.display = 'none'; }} />
                    )}
                    <span style={{ color: meta.accent, fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '0.78rem' }}>
                        {platformKey}
                    </span>
                </div>

                <span style={{ color: 'rgba(255,255,255,0.45)', fontFamily: 'var(--font-main)', fontSize: '0.72rem' }}>
                    {games.length} {games.length === 1 ? 'juego' : 'juegos'}
                </span>

                {totalWorth && (
                    <span style={{
                        marginLeft: 'auto', fontSize: '0.7rem', fontFamily: 'var(--font-display)',
                        fontWeight: 700, color: '#a3e635', opacity: 0.7
                    }}>
                        ~{totalWorth} en valor
                    </span>
                )}

                {/* Flecha animada */}
                <motion.span
                    animate={{ rotate: open ? 180 : 0 }}
                    transition={{ type: 'spring', stiffness: 280, damping: 24 }}
                    style={{ color: 'rgba(255,255,255,0.3)', display: 'flex', flexShrink: 0, marginLeft: totalWorth ? 0 : 'auto' }}
                >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="6 9 12 15 18 9" />
                    </svg>
                </motion.span>
            </button>

            <AnimatePresence initial={false}>
                {open && (
                    <motion.div
                        key="panel"
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ type: 'spring', stiffness: 220, damping: 28, opacity: { duration: 0.18 } }}
                        style={{ overflow: 'hidden' }}
                    >
                        <div style={{
                            border: '1px solid rgba(255,255,255,0.09)',
                            borderTop: 'none',
                            borderRadius: '0 0 12px 12px',
                            padding: '14px',
                            background: 'rgba(0,0,0,0.84)',
                            backdropFilter: 'blur(16px)',
                            WebkitBackdropFilter: 'blur(16px)',
                        }}>
                            <div style={{
                                display: 'grid',
                                gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
                                gap: '12px'
                            }}>
                                {games.map((game, i) => <GiveawayCard key={game.id} game={game} index={i} />)}
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}

// ── Componente principal ─────────────────────────────────────────────────────
export const FreeGamesPage = ({ onBack }) => {
    const [status, setStatus] = useState('loading');
    const [grouped, setGrouped] = useState({});
    const [summary, setSummary] = useState({ total: 0, platforms: 0 });

    const fetchGames = useCallback(async () => {
        setStatus('loading');
        let lastError = null;

        for (const sourceUrl of SOURCES) {
            try {
                const res = await fetch(sourceUrl, { signal: AbortSignal.timeout(6000) });
                if (!res.ok) throw new Error(`HTTP ${res.status}`);
                const raw = await res.json();
                if (!Array.isArray(raw)) { setStatus('empty'); return; }

                const g = {};
                PLATFORM_ORDER.forEach(k => { g[k] = []; });

                raw.forEach(game => {
                    const key = detectPlatform(game.platforms);
                    if (g[key]) g[key].push(game);
                });

                const activePlatforms = PLATFORM_ORDER.filter(k => g[k]?.length > 0);
                setGrouped(g);
                setSummary({ total: raw.length, platforms: activePlatforms.length });
                setStatus('ok');
                return;
            } catch (err) {
                lastError = err;
            }
        }
        setStatus('error');
    }, []);

    useEffect(() => { fetchGames(); }, [fetchGames]);

    const activePlatforms = PLATFORM_ORDER.filter(k => grouped[k]?.length > 0);

    // Calcula valor total por plataforma
    function platformWorth(games) {
        let total = 0;
        let counted = 0;
        games.forEach(g => {
            const n = parseFloat((g.worth || '').replace('$', ''));
            if (!isNaN(n) && n > 0) { total += n; counted++; }
        });
        return counted > 0 ? `$${total.toFixed(2)}` : null;
    }

    return (
        <motion.div
            initial={{ opacity: 0, y: 18, filter: 'blur(6px)' }}
            animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
            exit={{ opacity: 0, y: -12, filter: 'blur(4px)' }}
            transition={{ type: 'spring', stiffness: 110, damping: 20 }}
            style={{ padding: '0 20px 70px', maxWidth: '1100px', margin: '0 auto', width: '100%', boxSizing: 'border-box' }}
        >
            {/* ── Header ── */}
            <div style={{
                marginBottom: '24px',
                background: 'rgba(0,0,0,0.85)',
                backdropFilter: 'blur(20px)',
                WebkitBackdropFilter: 'blur(20px)',
                border: '1px solid rgba(255,255,255,0.08)',
                borderRadius: '14px',
                padding: '20px 24px',
            }}>
                <h1 style={{
                    fontFamily: 'var(--font-display)',
                    fontSize: 'clamp(1.4rem, 3vw, 2rem)',
                    fontWeight: 800,
                    margin: '0 0 4px',
                    color: '#fff',
                    textTransform: 'uppercase',
                    letterSpacing: '-0.3px'
                }}>
                    Juegos Gratis
                </h1>
                <p style={{ margin: 0, color: 'rgba(255,255,255,0.4)', fontFamily: 'var(--font-main)', fontSize: '0.75rem' }}>
                    {status === 'ok'
                        ? `${summary.total} giveaway${summary.total !== 1 ? 's' : ''} activo${summary.total !== 1 ? 's' : ''} · ${summary.platforms} plataforma${summary.platforms !== 1 ? 's' : ''} · via GamerPower`
                        : status === 'loading' ? 'Buscando giveaways activos...'
                        : 'GamerPower API'}
                </p>
            </div>

            {/* ── Contenido ── */}
            <AnimatePresence mode="wait">
                {status === 'loading' && (
                    <motion.div key="loading" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                        style={{
                            padding: '48px', textAlign: 'center',
                            background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(16px)',
                            border: '1px solid rgba(255,255,255,0.07)', borderRadius: '14px',
                            color: 'rgba(255,255,255,0.4)', fontFamily: 'var(--font-main)', fontSize: '0.8rem'
                        }}>
                        Buscando giveaways...
                    </motion.div>
                )}

                {status === 'error' && (
                    <motion.div key="error" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                        style={{
                            padding: '40px 24px', textAlign: 'center',
                            background: 'rgba(0,0,0,0.82)', backdropFilter: 'blur(16px)',
                            border: '1px solid rgba(220,38,38,0.2)', borderRadius: '14px'
                        }}>
                        <p style={{ color: 'rgba(255,255,255,0.55)', fontFamily: 'var(--font-main)', margin: '0 0 14px', fontSize: '0.82rem' }}>
                            No se pudo contactar la API.
                        </p>
                        <motion.button onClick={fetchGames} className="btn btn-secondary"
                            whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.96 }}
                            style={{ padding: '9px 20px', cursor: 'pointer', borderRadius: '10px', fontWeight: 600, fontSize: '0.8rem' }}>
                            Reintentar
                        </motion.button>
                    </motion.div>
                )}

                {status === 'empty' && (
                    <motion.div key="empty" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                        style={{
                            padding: '48px', textAlign: 'center',
                            background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(16px)',
                            border: '1px solid rgba(255,255,255,0.07)', borderRadius: '14px',
                            color: 'rgba(255,255,255,0.35)', fontFamily: 'var(--font-main)', fontSize: '0.8rem'
                        }}>
                        No hay giveaways activos en este momento.
                    </motion.div>
                )}

                {status === 'ok' && (
                    <motion.div key="content" initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                        style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                        {activePlatforms.map(platform => (
                            <PlatformSection
                                key={platform}
                                platformKey={platform}
                                games={grouped[platform]}
                                defaultOpen={EXPANDED_DEFAULT.has(platform)}
                                totalWorth={platformWorth(grouped[platform])}
                            />
                        ))}
                    </motion.div>
                )}
            </AnimatePresence>

            {/* ── Botón Volver ── */}
            <motion.button
                className="btn btn-secondary"
                onClick={onBack}
                whileHover={{ x: -3, scale: 1.02 }}
                whileTap={{ scale: 0.96 }}
                transition={{ type: 'spring', stiffness: 260, damping: 22 }}
                style={{
                    marginTop: '20px',
                    padding: '10px 22px',
                    cursor: 'pointer',
                    borderRadius: '10px',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                    fontSize: '0.8rem',
                    fontWeight: 600,
                    background: 'rgba(0,0,0,0.82)',
                    backdropFilter: 'blur(12px)',
                    WebkitBackdropFilter: 'blur(12px)',
                }}
            >
                &larr; Volver
            </motion.button>
        </motion.div>
    );
};
