// ============================================================================
// MUSIC.JS - Música de fondo con YouTube
// ============================================================================
//
// - Desactivado por defecto
// - Persiste entre páginas con prompt de continuar
//
// ============================================================================

(function () {
    const MUSIC_KEY = 'jueguitosMusicEnabled';
    const VIDEO_ID = localStorage.getItem('jueguitos_settings_music_id') || '_HY9wyLjRDE'; // Dynamic ID

    let iframe = null;
    let isEnabled = localStorage.getItem(MUSIC_KEY) === 'true';

    // Inject styles once
    const style = document.createElement('style');
    style.textContent = `
        #musicResumePrompt {
            position: fixed; bottom: 20px; right: 20px; background: rgba(0, 243, 255, 0.15);
            border: 1px solid rgba(0, 243, 255, 0.4); color: #00f3ff;
            padding: 10px 16px; border-radius: 25px; cursor: pointer;
            font-size: 0.85rem; z-index: 9999; backdrop-filter: blur(8px);
            display: flex; align-items: center; gap: 8px;
            animation: slideIn 0.3s ease; transition: all 0.2s;
        }
        #musicResumePrompt:hover { background: rgba(0, 243, 255, 0.25); transform: scale(1.02); }
        @keyframes slideIn { from { opacity: 0; transform: translateX(20px); } to { opacity: 1; transform: translateX(0); } }
        @keyframes fadeOut { to { opacity: 0; transform: scale(0.9); } }
    `;
    document.head.appendChild(style);

    // Crear botón de música en el header
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

    // Mostrar prompt para continuar música
    function showResumePrompt() {
        const prompt = document.createElement('div');
        prompt.id = 'musicResumePrompt';
        prompt.innerHTML = '🎵 <span>Continuar música</span>';

        prompt.addEventListener('click', () => {
            createPlayer();
            prompt.style.animation = 'fadeOut 0.2s ease forwards';
            setTimeout(() => prompt.remove(), 200);
        });

        document.body.appendChild(prompt);
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

        // Remover prompt si existe
        const prompt = document.getElementById('musicResumePrompt');
        if (prompt) prompt.remove();

        if (isEnabled) {
            createPlayer();
        } else {
            destroyPlayer();
        }
    }

    // Crear iframe
    function createPlayer() {
        if (iframe) return;

        // Empezar en un punto aleatorio del video (0 a ~7000 segundos = 2 horas)
        const randomStart = Math.floor(Math.random() * 7000);

        const container = document.createElement('div');
        container.id = 'musicPlayerContainer';
        container.style.cssText = 'position: fixed; bottom: 0; right: 0; width: 1px; height: 1px; overflow: hidden; opacity: 0; pointer-events: none;';

        container.innerHTML = `
            <iframe 
                id="musicIframe"
                width="1" 
                height="1" 
                src="https://www.youtube.com/embed/${VIDEO_ID}?autoplay=1&loop=1&playlist=${VIDEO_ID}&controls=0&start=${randomStart}"
                allow="autoplay; encrypted-media"
                frameborder="0"
            ></iframe>
        `;

        document.body.appendChild(container);
        iframe = container;

        // Actualizar botón
        const btn = document.getElementById('musicToggle');
        if (btn) {
            btn.innerHTML = '🔊';
            btn.title = 'Desactivar música';
        }
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

        // Si la música estaba activa, mostrar prompt para continuar
        if (isEnabled) {
            showResumePrompt();
        }
    });

})();
