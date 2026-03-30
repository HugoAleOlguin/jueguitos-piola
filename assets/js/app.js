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
    
    // Menú Hamburguesa Mobile
    const menuToggle = document.getElementById('menuToggleMobile');
    const mainNav = document.getElementById('mainNav');

    if (menuToggle && mainNav) {
        menuToggle.addEventListener('click', () => {
            mainNav.classList.toggle('active');
            const icon = menuToggle.querySelector('i');
            if (mainNav.classList.contains('active')) {
                icon.setAttribute('data-lucide', 'x');
            } else {
                icon.setAttribute('data-lucide', 'menu');
            }
            lucide.createIcons();
        });

        // Cerrar menú al hacer click en cualquier botón del nav
        mainNav.querySelectorAll('button').forEach(btn => {
            btn.addEventListener('click', () => mainNav.classList.remove('active'));
        });
    }

    // Botón Minijuegos (abre modal selector)
    const btnMiniGames = document.getElementById('btnMiniGames');
    if (btnMiniGames) {
        btnMiniGames.addEventListener('click', () => {
            if (typeof miniGamesModal !== 'undefined') miniGamesModal?.open?.();
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
