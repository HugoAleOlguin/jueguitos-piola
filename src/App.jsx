import React, { useState, useEffect, useMemo, useLayoutEffect } from 'react';
import { Header } from './components/Header';
import { GamesGrid } from './components/GamesGrid';
import { GameDetail } from './components/GameDetail';
import { FreeGamesPage } from './components/FreeGamesPage';
import { Waves } from './components/ui/wave-background';
import { gamesData } from './data/gamesData';
import { useTheme } from './context/ThemeContext';
import { SettingsModal } from './components/SettingsModal';
import { AuthModal } from './components/AuthModal';
import { AnimatePresence } from 'framer-motion';
import { ChatWidget } from './components/ChatWidget';
import { OnboardingGuide } from './components/onboarding/OnboardingGuide';
import { AchievementsModal } from './components/AchievementsModal';
import { AchievementToast } from './components/AchievementToast';
import { useAchievements } from './context/AchievementContext';

export default function App() {
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedGameId, setSelectedGameId] = useState(null);
    const [view, setView] = useState('catalog'); // 'catalog' | 'detail' | 'freegames'
    const [catalogScrollY, setCatalogScrollY] = useState(0);
    const [showSettings, setShowSettings] = useState(false);
    const [showAchievements, setShowAchievements] = useState(false);

    const { settings, isPrimeMode, togglePrimeMode } = useTheme();
    const { unlock, trackEvent } = useAchievements();

    const handleSearch = (query) => {
        const val = query.toLowerCase().trim();
        if (val === 'prime') {
            unlock('prime');
            togglePrimeMode();
            // Limpiar buscador a los 400ms para mostrar todos los juegos con el estilo retro
            setTimeout(() => {
                setSearchQuery('');
            }, 400);
            return;
        }
        setSearchQuery(query);
    };

    // Atajo de teclado: Tecla 'L' abre y cierra logros
    useEffect(() => {
        const handleKeyDown = (e) => {
            const tag = document.activeElement?.tagName?.toLowerCase();
            if (tag === 'input' || tag === 'textarea' || document.activeElement?.isContentEditable) {
                return;
            }

            if (e.key === 'l' || e.key === 'L') {
                setShowAchievements((prev) => !prev);
            } else if (e.key === 'Escape') {
                setShowAchievements(false);
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, []);

    // Enrutamiento reactivo basado en Query Params (compatible con GitHub Pages)
    useEffect(() => {
        const handlePopState = () => {
            const params = new URLSearchParams(window.location.search);
            const id = params.get('id');
            const v = params.get('view');
            if (id) {
                setSelectedGameId(id);
                setView('detail');
            } else if (v === 'freegames') {
                setView('freegames');
                setSelectedGameId(null);
            } else {
                setSelectedGameId(null);
                setView('catalog');
            }
        };

        const params = new URLSearchParams(window.location.search);
        const id = params.get('id');
        const v = params.get('view');
        if (id) {
            setSelectedGameId(id);
            setView('detail');
        } else if (v === 'freegames') {
            setView('freegames');
        }

        window.addEventListener('popstate', handlePopState);
        return () => window.removeEventListener('popstate', handlePopState);
    }, []);

    const navigateToGame = (id) => {
        if (id) {
            setCatalogScrollY(window.scrollY);
            window.history.pushState(null, null, `?id=${id}`);
            setSelectedGameId(id);
            setView('detail');
            window.scrollTo(0, 0);
        } else {
            window.history.pushState(null, null, window.location.pathname);
            setSelectedGameId(null);
            setView('catalog');
        }
    };

    const navigateToFreeGames = () => {
        setCatalogScrollY(window.scrollY);
        window.history.pushState(null, null, '?view=freegames');
        setSelectedGameId(null);
        setView('freegames');
        window.scrollTo(0, 0);
    };

    const navigateToCatalog = () => {
        window.history.pushState(null, null, window.location.pathname);
        setSelectedGameId(null);
        setView('catalog');
    };

    const handleRandomGame = () => {
        const activeGames = gamesData.filter(g => !g.hidden);
        if (activeGames.length > 0) {
            const randomIndex = Math.floor(Math.random() * activeGames.length);
            navigateToGame(activeGames[randomIndex].id);
        }
    };

    const filteredGames = useMemo(() => {
        const t = searchQuery.toLowerCase().trim();
        if (!t) return gamesData.filter(g => !g.hidden);
        return gamesData.filter(g => {
            if (g.hidden) return false;
            return g.title.toLowerCase().includes(t) ||
                   g.tags.some(tag => tag.toLowerCase().includes(t));
        });
    }, [searchQuery]);

    const activeGame = useMemo(() => {
        return gamesData.find(g => g.id === selectedGameId) || null;
    }, [selectedGameId]);

    // Restaura scroll position del catálogo al volver de forma síncrona
    useLayoutEffect(() => {
        if (view === 'catalog') {
            window.scrollTo(0, catalogScrollY);
        }
    }, [view, catalogScrollY]);

    return (
        <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', color: 'var(--text-color)', position: 'relative', overflowX: 'hidden' }}>
            {settings.disableWaves !== 'true' && !isPrimeMode && (
                <Waves strokeColor="rgba(255, 255, 255, 0.12)" backgroundColor="transparent" pointerSize={0.4} />
            )}
            <Header
                searchQuery={searchQuery}
                setSearchQuery={handleSearch}
                onRandomGame={handleRandomGame}
                onGoHome={navigateToCatalog}
                showSearch={view === 'catalog'}
                onFreeGames={navigateToFreeGames}
                onOpenSettings={() => setShowSettings(true)}
            />

            {/* Indicador flotante cuando el Modo Prime esta activo */}
            {isPrimeMode && (
                <div 
                    className="prime-mode-indicator" 
                    onClick={togglePrimeMode}
                    title="Haz clic para volver al diseno moderno"
                >
                    <span>MODO PRIME ACTIVO</span>
                    <span style={{ fontSize: '0.65rem', color: '#a3e635' }}>[SALIR]</span>
                </div>
            )}

            <main style={{ flexGrow: 1, width: '100%', paddingTop: '90px' }}>
                {view === 'freegames' && (
                    <div style={{ paddingTop: '40px', width: '100%' }}>
                        <FreeGamesPage onBack={navigateToCatalog} />
                    </div>
                )}

                {view === 'detail' && activeGame && (
                    <div style={{ padding: '40px 20px', maxWidth: '960px', width: '100%', margin: '0 auto' }}>
                        <GameDetail
                            game={activeGame}
                            onBack={navigateToCatalog}
                        />
                    </div>
                )}

                {view === 'catalog' && (
                    <div>
                        <GamesGrid
                            games={filteredGames}
                            onOpenGame={navigateToGame}
                        />
                    </div>
                )}
            </main>

            <AnimatePresence>
                {showSettings && <SettingsModal onClose={() => setShowSettings(false)} />}
            </AnimatePresence>

            {/* Vitrina de Logros (Atajo tecla L) */}
            <AchievementsModal 
                isOpen={showAchievements} 
                onClose={() => setShowAchievements(false)} 
            />

            {/* Notificacion emergente de logro desbloqueado */}
            <AchievementToast />

            {/* Modal Global de Autenticación y Perfil */}
            <AuthModal />

            {/* Widget del Chat */}
            <ChatWidget />

            {/* Guia flotante de bienvenida */}
            <OnboardingGuide />

            <footer
                onClick={() => trackEvent('FOOTER_CLICK')}
                style={{ cursor: 'pointer', userSelect: 'none' }}
                title="Curioso"
            >
                <p>&copy; 2026 Jueguitos Piola. Todos los derechos reservados.</p>
            </footer>
        </div>
    );
}
