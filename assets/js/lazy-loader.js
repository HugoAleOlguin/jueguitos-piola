/**
 * LAZY LOADER
 * Carga módulos pesados dinámicamente según interacción o inactividad
 * para priorizar el FCP y el funcionamiento del chat/galería.
 */

document.addEventListener('DOMContentLoaded', () => {
    
    const loadedScripts = new Set();
    
    const loadScript = (src) => {
        if (loadedScripts.has(src) || document.querySelector(`script[src="${src}"]`)) return;
        
        const script = document.createElement('script');
        script.src = src;
        script.async = true;
        document.body.appendChild(script);
        loadedScripts.add(src);
    };

    // 1. Minijuegos (Versus, Gamedle, Modal)
    // Se cargan agresivamente solo si se intenta interactuar con el botón
    const btnMiniGames = document.getElementById('btnMiniGames');
    if (btnMiniGames) {
        const loadMiniGames = () => {
            loadScript('assets/js/minigames-modal.js');
            loadScript('assets/js/gamedle.js');
            loadScript('assets/js/versus.js');
        };
        
        btnMiniGames.addEventListener('mouseenter', loadMiniGames, { once: true });
        btnMiniGames.addEventListener('touchstart', loadMiniGames, { once: true });
        btnMiniGames.addEventListener('click', loadMiniGames);
    }

    // 2. Logros (Modal explícito)
    const btnAchievements = document.getElementById('btnAchievementsFab');
    if (btnAchievements) {
        const loadAchievements = () => {
            loadScript('assets/js/achievements.js');
        };
        
        btnAchievements.addEventListener('mouseenter', loadAchievements, { once: true });
        btnAchievements.addEventListener('touchstart', loadAchievements, { once: true });
    }

    // 3. Deferred Scripts (Achievements globales y Free Games)
    // Se cargan cuando hay tiempo inactivo para no estorbar a Firebase
    const loadIdleScripts = () => {
        loadScript('assets/js/achievements.js');
        loadScript('assets/js/free-games.js');
    };

    if ('requestIdleCallback' in window) {
        window.requestIdleCallback(loadIdleScripts, { timeout: 2000 });
    } else {
        setTimeout(loadIdleScripts, 2000);
    }
});
