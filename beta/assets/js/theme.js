// ============================================================================
// THEME.JS - MANEJO DE TEMA CLARO/OSCURO + CACHÉ OFFLINE
// ============================================================================
//
// Este script maneja:
// 1. Toggle entre tema claro y oscuro
// 2. Persistencia del tema en localStorage
// 3. Respeta la preferencia del sistema operativo
//
// ============================================================================

(function () {
    // =========================================================================
    // SISTEMA DE TEMAS
    // =========================================================================

    // Clave para guardar la preferencia en localStorage
    const THEME_KEY = 'jueguitosTheme';

    // Obtener el tema guardado o usar la preferencia del sistema
    const getSavedTheme = () => {
        const saved = localStorage.getItem(THEME_KEY);
        if (saved) return saved;

        // Si no hay tema guardado, usar preferencia del sistema
        if (window.matchMedia('(prefers-color-scheme: light)').matches) {
            return 'light';
        }
        return 'dark';
    };

    // Aplicar el tema al documento
    const applyTheme = (theme) => {
        if (theme === 'light') {
            document.documentElement.setAttribute('data-theme', 'light');
        } else {
            document.documentElement.removeAttribute('data-theme');
        }

        // Actualizar el ícono del botón si existe
        const toggleBtn = document.getElementById('themeToggle');
        if (toggleBtn) {
            toggleBtn.textContent = theme === 'light' ? '☀️' : '🌙';
            toggleBtn.title = theme === 'light' ? 'Cambiar a tema oscuro' : 'Cambiar a tema claro';
        }
    };

    // Guardar la preferencia
    const saveTheme = (theme) => {
        localStorage.setItem(THEME_KEY, theme);
    };

    // Alternar entre temas
    const toggleTheme = () => {
        const currentTheme = document.documentElement.hasAttribute('data-theme') ? 'light' : 'dark';
        const newTheme = currentTheme === 'light' ? 'dark' : 'light';

        applyTheme(newTheme);
        saveTheme(newTheme);
    };

    // =========================================================================
    // INICIALIZACIÓN
    // =========================================================================

    // Aplicar tema inmediatamente (antes de que cargue el DOM completo)
    // Esto evita el "flash" de cambio de tema
    applyTheme(getSavedTheme());

    // Cuando el DOM esté listo, configurar el botón
    document.addEventListener('DOMContentLoaded', () => {
        const toggleBtn = document.getElementById('themeToggle');

        if (toggleBtn) {
            // Actualizar ícono inicial
            const currentTheme = getSavedTheme();
            toggleBtn.textContent = currentTheme === 'light' ? '☀️' : '🌙';

            // Agregar evento de click
            toggleBtn.addEventListener('click', toggleTheme);
        }
    });

    // Escuchar cambios en la preferencia del sistema
    window.matchMedia('(prefers-color-scheme: light)').addEventListener('change', (e) => {
        // Solo cambiar automáticamente si el usuario no ha elegido manualmente
        if (!localStorage.getItem(THEME_KEY)) {
            applyTheme(e.matches ? 'light' : 'dark');
        }
    });

})();


// ============================================================================
// CACHÉ OFFLINE BÁSICO
// ============================================================================
//
// Guarda los datos de juegos en localStorage para cargar más rápido
// y tener algo que mostrar si la conexión falla
//
// ============================================================================

(function () {
    const CACHE_KEY = 'jueguitosGamesCache';
    const CACHE_EXPIRY = 24 * 60 * 60 * 1000; // 24 horas en milisegundos

    // Guardar datos en caché
    window.cacheGamesData = (data) => {
        try {
            const cacheData = {
                timestamp: Date.now(),
                games: data
            };
            localStorage.setItem(CACHE_KEY, JSON.stringify(cacheData));
        } catch (e) {
            console.warn('No se pudo guardar en caché:', e);
        }
    };

    // Obtener datos del caché
    window.getCachedGamesData = () => {
        try {
            const cached = localStorage.getItem(CACHE_KEY);
            if (!cached) return null;

            const data = JSON.parse(cached);

            // Verificar si el caché expiró
            if (Date.now() - data.timestamp > CACHE_EXPIRY) {
                localStorage.removeItem(CACHE_KEY);
                return null;
            }

            return data.games;
        } catch (e) {
            return null;
        }
    };

    // Guardar los datos cuando se cargan
    document.addEventListener('DOMContentLoaded', () => {
        if (typeof gamesData !== 'undefined') {
            cacheGamesData(gamesData);
        }
    });

})();


// ============================================================================
// 🕹️ EASTER EGG: MODO RETRO / LEGACY
// ============================================================================
//
// Escribí "legacy" en el buscador para activar el modo retro
// Escribí "legacy" de nuevo para desactivarlo
//
// ============================================================================

(function () {
    let retroMode = false;

    document.addEventListener('DOMContentLoaded', () => {
        const searchInput = document.getElementById('searchInput');

        if (!searchInput) return;

        // Escuchar cambios en el buscador
        searchInput.addEventListener('input', (e) => {
            const value = e.target.value.toLowerCase().trim();

            // Detectar si escribieron "prime"
            if (value === 'prime') {
                toggleRetroMode();

                // Limpiar el buscador después de un momento
                setTimeout(() => {
                    searchInput.value = '';
                    // Disparar evento para actualizar la lista de juegos
                    searchInput.dispatchEvent(new Event('input', { bubbles: true }));
                }, 500);
            }
        });
    });

    // Alternar modo retro
    function toggleRetroMode() {
        retroMode = !retroMode;

        if (retroMode) {
            // Activar modo retro
            document.documentElement.setAttribute('data-theme', 'retro');
            localStorage.setItem('jueguitosTheme', 'retro');

            // Actualizar botón de tema
            const toggleBtn = document.getElementById('themeToggle');
            if (toggleBtn) {
                toggleBtn.textContent = '🕹️';
                toggleBtn.title = 'Modo Legacy activado';
            }

            // Notificación
            mostrarNotificacion('🕹️ ¡Modo Legacy activado!', 'retro');
            console.log('🕹️ Easter egg activado: Modo Legacy');

        } else {
            // Volver al modo normal (oscuro)
            document.documentElement.removeAttribute('data-theme');
            localStorage.setItem('jueguitosTheme', 'dark');

            // Actualizar botón de tema
            const toggleBtn = document.getElementById('themeToggle');
            if (toggleBtn) {
                toggleBtn.textContent = '🌙';
                toggleBtn.title = 'Cambiar a tema claro';
            }

            // Notificación
            mostrarNotificacion('👋 Modo Legacy desactivado', 'normal');
        }
    }

    // Mostrar notificación temporal
    function mostrarNotificacion(mensaje, tipo) {
        // Remover notificación existente
        const existente = document.querySelector('.retro-notification');
        if (existente) existente.remove();

        const notif = document.createElement('div');
        notif.className = 'retro-notification';
        notif.textContent = mensaje;
        notif.style.cssText = `
            position: fixed;
            top: 100px;
            left: 50%;
            transform: translateX(-50%);
            padding: 15px 30px;
            border-radius: 10px;
            font-weight: bold;
            z-index: 10000;
            animation: slideDown 0.3s ease;
            ${tipo === 'retro'
                ? 'background: linear-gradient(45deg, #d53369, #daae51); color: #000;'
                : 'background: var(--primary-color); color: #000;'}
        `;

        document.body.appendChild(notif);

        // Remover después de 2 segundos
        setTimeout(() => {
            notif.style.animation = 'slideUp 0.3s ease forwards';
            setTimeout(() => notif.remove(), 300);
        }, 2000);
    }

    // Agregar estilos de animación
    const style = document.createElement('style');
    style.textContent = `
        @keyframes slideDown {
            from { opacity: 0; transform: translateX(-50%) translateY(-20px); }
            to { opacity: 1; transform: translateX(-50%) translateY(0); }
        }
        @keyframes slideUp {
            from { opacity: 1; transform: translateX(-50%) translateY(0); }
            to { opacity: 0; transform: translateX(-50%) translateY(-20px); }
        }
    `;
    document.head.appendChild(style);

    // Verificar si el modo retro estaba guardado
    if (localStorage.getItem('jueguitosTheme') === 'retro') {
        retroMode = true;
        document.documentElement.setAttribute('data-theme', 'retro');
    }

})();


// ============================================================================
// 🖼️ EASTER EGGS: IMÁGENES SECRETAS
// ============================================================================
//
// Escribí una palabra exacta en el buscador para ver la imagen
// La imagen desaparece cuando el texto cambia
//
// CÓMO AGREGAR MÁS:
// Añadir una entrada al objeto IMAGE_EGGS con: palabra: 'url'
//
// ============================================================================

(function () {
    // Diccionario de easter eggs (palabra exacta -> URL de imagen)
    // Solo se activan con la palabra EXACTA (case insensitive)
    const IMAGE_EGGS = {
        'tormenta': 'https://i.ibb.co/LWw3SJc/tormenta.png',
        'vecina': 'https://i.ibb.co/HTtGBHVq/vecina.png',
        'rem': 'https://i.ibb.co/HfQ63z7M/rem.png'
    };

    // Elemento contenedor de la imagen (se crea una sola vez)
    let eggContainer = null;
    let currentEgg = null; // Track cual egg está activo

    // Crear el contenedor de la imagen (lazy load)
    function getEggContainer() {
        if (!eggContainer) {
            eggContainer = document.createElement('div');
            eggContainer.id = 'easter-egg-image';
            eggContainer.style.cssText = `
                position: fixed;
                top: 50%;
                left: 50%;
                transform: translate(-50%, -50%);
                z-index: 9998;
                pointer-events: none;
                opacity: 0;
                transition: opacity 0.3s ease;
            `;

            const img = document.createElement('img');
            img.style.cssText = `
                max-width: 80vw;
                max-height: 70vh;
                border-radius: 16px;
                box-shadow: 0 20px 60px rgba(0, 0, 0, 0.5);
            `;
            eggContainer.appendChild(img);
            document.body.appendChild(eggContainer);
        }
        return eggContainer;
    }

    // Mostrar imagen
    function showEgg(word, url) {
        if (currentEgg === word) return; // Ya está mostrando esta

        const container = getEggContainer();
        const img = container.querySelector('img');

        // Ocultar imagen actual primero
        container.style.opacity = '0';

        // Esperar a que cargue la nueva imagen antes de mostrar
        const newImg = new Image();
        newImg.onload = () => {
            // Solo mostrar si todavía es el egg que queremos
            if (currentEgg === word) {
                img.src = url;
                img.alt = word;
                requestAnimationFrame(() => {
                    container.style.opacity = '1';
                });
            }
        };
        newImg.src = url;
        currentEgg = word;

        console.log(`🥚 Easter egg encontrado: ${word}`);
    }

    // Ocultar imagen
    function hideEgg() {
        if (!currentEgg) return; // No hay nada que ocultar

        if (eggContainer) {
            eggContainer.style.opacity = '0';
        }
        currentEgg = null;
    }

    // Inicializar listener
    document.addEventListener('DOMContentLoaded', () => {
        const searchInput = document.getElementById('searchInput');
        if (!searchInput) return;

        searchInput.addEventListener('input', (e) => {
            const value = e.target.value.toLowerCase().trim();

            // Buscar coincidencia exacta
            if (IMAGE_EGGS[value]) {
                showEgg(value, IMAGE_EGGS[value]);
            } else {
                hideEgg();
            }
        });

        // Ocultar al perder foco del buscador
        searchInput.addEventListener('blur', () => {
            setTimeout(hideEgg, 200);
        });
    });

})();
