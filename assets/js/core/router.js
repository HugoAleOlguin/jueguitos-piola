const Router = (() => {
    const navigateTo = (url) => {
        history.pushState(null, null, url);
        handleRoute();
    };

    const handleRoute = () => {
        const params = new URLSearchParams(window.location.search);
        const gameId = params.get('id');

        if (gameId) {
            showGame(gameId);
        } else {
            showHome();
        }
    };

    const showHome = () => {
        document.title = 'Jueguitos Piola';
        let canonical = document.querySelector('link[rel="canonical"]');
        if (canonical) {
            const baseUrl = window.location.origin + window.location.pathname;
            canonical.href = baseUrl;
        }

        if (typeof window.hideFreeGamesView === 'function') window.hideFreeGamesView();

        const gameView = document.getElementById('game-view');
        const gamesGrid = document.getElementById('gamesGrid');
        const searchContainer = document.querySelector('.search-bar');

        if (gameView) gameView.style.display = 'none';
        if (gamesGrid) gamesGrid.style.display = 'grid';
        if (searchContainer) searchContainer.style.visibility = 'visible';

        const scrollPos = sessionStorage.getItem('homeScrollPos');
        if (scrollPos) {
            window.scrollTo(0, parseInt(scrollPos));
            sessionStorage.removeItem('homeScrollPos');
        } else {
            window.scrollTo(0, 0);
        }

        if (window.gamesData) {
            const visibleGames = window.gamesData.filter(g => !g.hidden);
            if (gamesGrid && gamesGrid.children.length === 0) {
                GridRenderer.render(visibleGames);
            } else if (gamesGrid) {
                GridRenderer.render(visibleGames, false);
            }
        }
    };

    const showGame = (gameId) => {
        const game = window.gamesData?.find(g => g.id === gameId);
        if (!game) {
            navigateTo(window.location.pathname);
            return;
        }

        document.title = `${game.title} | Jueguitos Piola`;

        let canonical = document.querySelector('link[rel="canonical"]');
        if (!canonical) {
            canonical = document.createElement('link');
            canonical.rel = 'canonical';
            document.head.appendChild(canonical);
        }
        const baseUrl = window.location.origin + window.location.pathname;
        canonical.href = `${baseUrl}?id=${game.id}`;

        let metaDesc = document.querySelector('meta[name="description"]');
        if (!metaDesc) {
            metaDesc = document.createElement('meta');
            metaDesc.name = 'description';
            document.head.appendChild(metaDesc);
        }
        metaDesc.content = `Descargar ${game.title} gratis. ${game.description}`;

        const updateMeta = (prop, content) => {
            let tag = document.querySelector(`meta[property="${prop}"]`);
            if (!tag) {
                tag = document.createElement('meta');
                tag.setAttribute('property', prop);
                document.head.appendChild(tag);
            }
            tag.content = content;
        };

        updateMeta('og:title', `${game.title} - Jueguitos Piola`);
        updateMeta('og:description', game.fullDescription || game.description);
        updateMeta('og:image', game.image);
        updateMeta('og:url', window.location.href);

        GameDetail.updateJsonLd(game);

        const gamesGrid = document.getElementById('gamesGrid');
        if (gamesGrid && gamesGrid.style.display !== 'none') {
            sessionStorage.setItem('homeScrollPos', window.scrollY);
        }

        if (typeof window.hideFreeGamesView === 'function') window.hideFreeGamesView();

        const gameView = document.getElementById('game-view');
        const searchContainer = document.querySelector('.search-bar');

        if (gamesGrid) gamesGrid.style.display = 'none';
        if (gameView) gameView.style.display = 'block';
        if (searchContainer) searchContainer.style.visibility = 'hidden';

        GameDetail.render(game);
        window.scrollTo(0, 0);

        if (typeof AchievementManager !== 'undefined') AchievementManager.trackEvent({ type: 'GAME_OPEN' });
    };

    const init = () => {
        window.addEventListener('popstate', handleRoute);
    };

    return { init, navigateTo, handleRoute, showHome, showGame };
})();
