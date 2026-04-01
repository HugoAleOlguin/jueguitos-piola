// ============================================================================
// APP.JS (VERSIÓN SPA MODULAR)
// Controlador Central de Jueguitos Piola
// ============================================================================

document.addEventListener('DOMContentLoaded', () => {
    if (typeof window.gamesData === 'undefined') {
        const gamesGrid = document.getElementById('gamesGrid');
        if (gamesGrid) gamesGrid.innerHTML = '<p class="error">Error: No se pudieron cargar los datos.</p>';
        return;
    }

    // Inicializar submódulos
    Router.init();
    GridRenderer.init();
    SearchManager.init();
    RouletteManager.init();

    // 1. Verificar ruta actual
    Router.handleRoute();

    // === Eventos globales adicionales ===
    
    // Botón Minijuegos (abre modal selector)
    const btnMiniGames = document.getElementById('btnMiniGames');
    if (btnMiniGames) {
        btnMiniGames.addEventListener('click', () => {
            if (typeof miniGamesModal !== 'undefined') miniGamesModal?.open?.();
        });
    }

    // === Menú Hamburguesa Mobile ===
    const mobileMenuBtn = document.getElementById('mobileMenuBtn');
    const navMenu = document.getElementById('navMenu');
    
    if (mobileMenuBtn && navMenu) {
        mobileMenuBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            mobileMenuBtn.classList.toggle('active');
            navMenu.classList.toggle('active');
            document.body.style.overflow = navMenu.classList.contains('active') ? 'hidden' : '';
        });

        // Cerrar al clickear cualquier botón dentro (usamos delegación para los dinámicos)
        navMenu.addEventListener('click', (e) => {
            const isClickable = e.target.closest('button') || e.target.closest('.theme-toggle');
            
            if (isClickable) {
                mobileMenuBtn.classList.remove('active');
                navMenu.classList.remove('active');
                document.body.style.overflow = '';
            }
        });

        // Cerrar al clickear fuera si está abierto
        document.addEventListener('click', (e) => {
            if (navMenu.classList.contains('active') && !navMenu.contains(e.target) && !mobileMenuBtn.contains(e.target)) {
                mobileMenuBtn.classList.remove('active');
                navMenu.classList.remove('active');
                document.body.style.overflow = '';
            }
        });
    }

    // Logo Click (Achievement / Easter Egg)
    const logo = document.querySelector('.logo');
    if (logo) {
        logo.addEventListener('click', () => {
            const isHomePage = !new URLSearchParams(window.location.search).has('id');

            if (!isHomePage) {
                // Si estamos en un juego, volver al inicio
                Router.navigateTo(window.location.pathname);
            } else {
                // Si estamos en el inicio, farmear logro
                if (typeof AchievementManager !== 'undefined') {
                    AchievementManager.trackEvent({ type: 'LOGO_CLICK' });
                }
            }
        });
    }
});
