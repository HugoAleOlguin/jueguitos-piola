/**
 * LAZY LOADER
 * Carga módulos pesados dinámicamente según interacción o inactividad
 * para priorizar el FCP y el funcionamiento del chat/galería.
 */

document.addEventListener('DOMContentLoaded', () => {

    const loadedScripts = new Set();

    const loadScript = (src) => {
        return new Promise((resolve, reject) => {
            if (loadedScripts.has(src) || document.querySelector(`script[src="${src}"]`)) {
                resolve();
                return;
            }

            const script = document.createElement('script');
            script.src = src;
            script.async = true;
            script.onload = () => {
                loadedScripts.add(src);
                resolve();
            };
            script.onerror = () => reject(new Error(`Error loading script ${src}`));
            document.body.appendChild(script);
        });
    };

    // 1. Minijuegos (Versus, Gamedle, Modal)
    // Se cargan agresivamente solo si se intenta interactuar con el botón
    const btnMiniGames = document.getElementById('btnMiniGames');
    if (btnMiniGames) {
        let isMiniGamesLoadingPromise = null;
        
        const prefetchMiniGames = () => {
            if (!isMiniGamesLoadingPromise) {
                isMiniGamesLoadingPromise = (async () => {
                    try {
                        await loadScript('assets/js/features/minijuegos/modal.js');
                        await loadScript('assets/js/features/minijuegos/gamedle.js');
                        await loadScript('assets/js/features/minijuegos/versus.js');
                        
                        // Initialize modules if not already initialized
                        if (typeof miniGamesModal !== 'undefined' && miniGamesModal.init) {
                            miniGamesModal.init();
                            miniGamesModal.init = null; // Prevent double init
                        }
                        if (typeof window.initGamedleUI === 'function') {
                            window.initGamedleUI();
                            window.initGamedleUI = null;
                        }
                        if (typeof window.VersusManager !== 'undefined' && window.VersusManager.init) {
                            window.VersusManager.init();
                            window.VersusManager.init = null;
                        }
                    } catch (e) {
                        console.error("Error loading minigames:", e);
                    }
                })();
            }
            return isMiniGamesLoadingPromise;
        };

        const openMiniGames = async (e) => {
            if (e) e.preventDefault();
            await prefetchMiniGames();
            if (typeof miniGamesModal !== 'undefined') {
                miniGamesModal.open();
            }
        };

        btnMiniGames.addEventListener('mouseenter', prefetchMiniGames, { once: true });
        btnMiniGames.addEventListener('touchstart', prefetchMiniGames, { once: true });
        btnMiniGames.addEventListener('click', openMiniGames);
    }

    // 2. Logros — se cargan de forma eager al inicio (no lazy)
    // El archivo es liviano (~15kb) y otros módulos (theme, settings, router)
    // necesitan AchievementManager disponible desde el primer evento del usuario.
    const loadAchievements = async () => {
        try {
            await loadScript('assets/js/features/achievements/main.js');
            if (typeof AchievementManager !== 'undefined' && !AchievementManager._initialized) {
                AchievementManager.init();
                AchievementManager._initialized = true;
            }
        } catch (e) {
            console.error("Error loading achievements:", e);
        }
    };

    // Cargar en idle callback para no bloquear el FCP pero estar disponible rápido
    if ('requestIdleCallback' in window) {
        window.requestIdleCallback(loadAchievements, { timeout: 500 });
    } else {
        setTimeout(loadAchievements, 100);
    }

    // 3. Deferred Scripts (Free Games)
    // Se cargan cuando hay tiempo inactivo para no estorbar a Firebase
    const loadIdleScripts = async () => {
        try {
            await loadScript('assets/js/features/free-games/main.js');
            if (typeof window.setupFreeGamesUI === 'function') {
                window.setupFreeGamesUI();
            }
        } catch(e) {
            console.error("Error loading free games:", e);
        }
    };

    if ('requestIdleCallback' in window) {
        window.requestIdleCallback(loadIdleScripts, { timeout: 2000 });
    } else {
        setTimeout(loadIdleScripts, 2000);
    }
});
