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
