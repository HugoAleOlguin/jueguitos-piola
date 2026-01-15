// ============================================================================
// MUSIC.JS - Música de fondo con YouTube (versión simple)
// ============================================================================
//
// - Desactivado por defecto
// - Usa iframe simple sin API compleja
// - Guarda estado en localStorage
//
// ============================================================================

(function () {
    const MUSIC_KEY = 'jueguitosMusicEnabled';
    const VIDEO_ID = '_HY9wyLjRDE';

    let iframe = null;
    let isEnabled = localStorage.getItem(MUSIC_KEY) === 'true';

    // Crear botón de música
    function createMusicButton() {
        const header = document.querySelector('header > div:last-child');
        if (!header) return;

        const btn = document.createElement('button');
        btn.id = 'musicToggle';
        btn.className = 'theme-toggle';
        btn.innerHTML = isEnabled ? '🔊' : '🔇';
        btn.title = isEnabled ? 'Desactivar música' : 'Activar música';
        btn.style.cssText = 'opacity: 0.7; font-size: 1.1rem;';

        btn.addEventListener('click', toggleMusic);

        const themeBtn = document.getElementById('themeToggle');
        if (themeBtn) {
            header.insertBefore(btn, themeBtn);
        } else {
            header.appendChild(btn);
        }
    }

    // Toggle música
    function toggleMusic() {
        isEnabled = !isEnabled;
        localStorage.setItem(MUSIC_KEY, isEnabled);

        const btn = document.getElementById('musicToggle');
        if (btn) {
            btn.innerHTML = isEnabled ? '🔊' : '🔇';
            btn.title = isEnabled ? 'Desactivar música' : 'Activar música';
        }

        if (isEnabled) {
            createPlayer();
        } else {
            destroyPlayer();
        }
    }

    // Crear iframe simple
    function createPlayer() {
        if (iframe) return;

        const container = document.createElement('div');
        container.id = 'musicPlayerContainer';
        container.style.cssText = 'position: fixed; bottom: 10px; right: 10px; width: 0; height: 0; overflow: hidden; opacity: 0; pointer-events: none;';

        // Iframe simple con autoplay y loop
        container.innerHTML = `
            <iframe 
                id="musicIframe"
                width="1" 
                height="1" 
                src="https://www.youtube.com/embed/${VIDEO_ID}?autoplay=1&loop=1&playlist=${VIDEO_ID}&controls=0"
                allow="autoplay; encrypted-media"
                frameborder="0"
            ></iframe>
        `;

        document.body.appendChild(container);
        iframe = container;
    }

    // Destruir player
    function destroyPlayer() {
        if (iframe) {
            iframe.remove();
            iframe = null;
        }
    }

    // Inicializar
    document.addEventListener('DOMContentLoaded', () => {
        createMusicButton();

        if (isEnabled) {
            createPlayer();
        }
    });

})();
