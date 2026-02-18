// ============================================================================
// APP.JS (VERSIÓN SPA)
// Controlador Central de Jueguitos Piola
// Maneja: Routing, Grilla, Detalle de Juego, Búsqueda, Favoritos
// ============================================================================

document.addEventListener('DOMContentLoaded', () => {
    // === ELEMENTOS DOM ===
    const gamesGrid = document.getElementById('gamesGrid');
    const gameView = document.getElementById('game-view');
    const gameContainer = document.getElementById('game-container');
    const searchInput = document.getElementById('searchInput');
    const searchContainer = document.querySelector('.search-bar');

    // === ESTADO ===
    let allGames = [];

    // === INICIALIZACIÓN ===
    const init = () => {
        if (typeof window.gamesData === 'undefined') {
            gamesGrid.innerHTML = '<p class="error">Error: No se pudieron cargar los datos.</p>';
            return;
        }
        allGames = window.gamesData;

        // 1. Verificar ruta actual
        handleRoute();

        // 2. Bindear eventos
        bindEvents();
    };

    const bindEvents = () => {
        // Navegación (botones Atrás/Adelante del browser)
        window.addEventListener('popstate', handleRoute);

        // Delegación de clicks en la grilla
        gamesGrid.addEventListener('click', (e) => {
            // Botón de favorito se maneja por separado
            if (e.target.closest('.favorite-btn')) {
                handleFavoriteClick(e);
                return;
            }

            const card = e.target.closest('.game-card');
            if (card) {
                e.preventDefault();
                const gameId = card.dataset.gameId;
                const game = allGames.find(g => g.id === gameId);

                if (game) {
                    // Links externos abren en nueva pestaña
                    if (game.externalLink && game.downloadUrl) {
                        window.open(game.downloadUrl, '_blank');
                    } else if (game.internalLink && game.downloadUrl) {
                        window.location.href = game.downloadUrl;
                    } else {
                        // Navegación SPA interna
                        navigateTo(`?id=${gameId}`);
                    }
                }
            }
        });

        // Búsqueda
        if (searchInput) {
            searchInput.addEventListener('input', (e) => {
                const term = e.target.value.toLowerCase().trim();


                handleSearch(e.target.value);
            });
        }

        // Botón Minijuegos (abre modal selector)
        const btnMiniGames = document.getElementById('btnMiniGames');
        if (btnMiniGames) {
            btnMiniGames.addEventListener('click', () => {
                miniGamesModal?.open?.();
            });
        }

        // Botón de Ruleta Random
        const btnRandom = document.getElementById('btnRandom');
        if (btnRandom) {
            btnRandom.addEventListener('click', startRoulette);
        }

        // Logo Click (Achievement / Easter Egg)
        const logo = document.querySelector('.logo');
        if (logo) {
            logo.addEventListener('click', () => {
                const isHomePage = !new URLSearchParams(window.location.search).has('id');

                if (!isHomePage) {
                    // Si estamos en un juego, volver al inicio
                    navigateTo(window.location.pathname);
                } else {
                    // Si estamos en el inicio, farmear logro
                    if (typeof AchievementManager !== 'undefined') {
                        AchievementManager.trackEvent({ type: 'LOGO_CLICK' });
                    }
                }
            });
        }
    };

    // === ROUTING ===
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

        // Alternar vistas
        gameView.style.display = 'none';
        gamesGrid.style.display = 'grid';
        if (searchContainer) searchContainer.style.visibility = 'visible';

        // Restaurar posición de scroll guardada
        const scrollPos = sessionStorage.getItem('homeScrollPos');
        if (scrollPos) {
            window.scrollTo(0, parseInt(scrollPos));
            sessionStorage.removeItem('homeScrollPos');
        } else {
            window.scrollTo(0, 0);
        }

        // Renderizar grilla (sin juegos ocultos)
        const visibleGames = allGames.filter(g => !g.hidden);

        if (gamesGrid.children.length === 0) {
            renderGrid(sortGamesWithFavorites(visibleGames));
        } else {
            // Re-render sin animación para consistencia de estado
            renderGrid(sortGamesWithFavorites(visibleGames), false);
        }
    };

    const showGame = (gameId) => {
        const game = allGames.find(g => g.id === gameId);
        if (!game) {
            // Volver a home si el juego no existe
            navigateTo(window.location.pathname);
            return;
        }

        // SEO: Título y Meta dinámicos
        document.title = `${game.title} | Jueguitos Piola`;

        // Meta description
        let metaDesc = document.querySelector('meta[name="description"]');
        if (!metaDesc) {
            metaDesc = document.createElement('meta');
            metaDesc.name = 'description';
            document.head.appendChild(metaDesc);
        }
        metaDesc.content = `Descargar ${game.title} gratis. ${game.description}`;

        // Open Graph (Facebook/Discord/WhatsApp)
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

        // Canonical URL
        let canonical = document.querySelector('link[rel="canonical"]');
        if (!canonical) {
            canonical = document.createElement('link');
            canonical.rel = 'canonical';
            document.head.appendChild(canonical);
        }
        canonical.href = window.location.href;

        // JSON-LD (Datos estructurados para SEO)
        updateJsonLd(game);

        // Guardar scroll antes de cambiar vista
        if (gamesGrid.style.display !== 'none') {
            sessionStorage.setItem('homeScrollPos', window.scrollY);
        }

        // Alternar vistas
        gamesGrid.style.display = 'none';
        gameView.style.display = 'block';
        if (searchContainer) searchContainer.style.visibility = 'hidden';

        // Renderizar detalle
        renderGameDetail(game);
        window.scrollTo(0, 0);

        // Logro: Window Shopper (tracking de juegos abiertos)
        if (typeof AchievementManager !== 'undefined') AchievementManager.trackEvent({ type: 'GAME_OPEN' });
    };

    // === RENDERIZADO DE GRILLA ===
    const renderGrid = (games, animate = true) => {
        gamesGrid.innerHTML = '';

        if (games.length === 0) {
            gamesGrid.innerHTML = '<p class="no-results">No se encontraron juegos.</p>';
            return;
        }

        games.forEach((game, index) => {
            const card = document.createElement('div');
            const gameIsFavorite = isFavorite(game.id);
            card.className = `game-card${gameIsFavorite ? ' is-favorite' : ''}`;
            card.dataset.gameId = game.id;

            if (animate) card.style.animationDelay = `${index * 0.03}s`;
            else {
                card.style.animation = 'none';
                card.style.opacity = '1';
                card.style.transform = 'none';
            }

            const bgImage = game.image ? `url('${game.image}')` : 'linear-gradient(45deg, #111, #222)';
            const isUtility = game.tags.some(tag => tag.toLowerCase() === 'utilidad');
            const utilityRibbon = isUtility ? '<div class="utility-ribbon">Utilidad</div>' : '';

            card.innerHTML = `
                <button class="favorite-btn${gameIsFavorite ? ' active' : ''}" title="${gameIsFavorite ? 'Quitar' : 'Agregar'}">★</button>
                <div class="card-image loaded" style="background-image: ${bgImage}">
                    ${utilityRibbon}
                </div>
                <div class="card-content">
                    <h3 class="card-title">${game.title}</h3>
                    <p class="card-desc">${game.description}</p>
                    <div class="card-tags">
                        ${game.tags.map(tag => `<span class="${getTagClass(tag)}">${tag}</span>`).join('')}
                    </div>
                </div>
            `;
            gamesGrid.appendChild(card);
        });
    };

    // Mapea tags a clases CSS para estilos diferenciados
    const getTagClass = (tag) => {
        const t = tag.toLowerCase();
        if (['coop', 'cooperativo'].includes(t)) return 'tag tag-coop';
        if (['terror', 'horror'].includes(t)) return 'tag tag-terror';
        if (['party', 'fiesta'].includes(t)) return 'tag tag-party';
        return 'tag';
    };

    // === RENDERIZADO DE DETALLE (vista individual del juego) ===
    const renderGameDetail = (game) => {
        const buttonsHtml = generateButtons(game);
        const tagsHtml = generateTagsRef(game.tags);
        const desc = game.fullDescription || game.description;

        gameContainer.innerHTML = `
            <div class="game-detail-container" style="animation: fadeInUp 0.5s ease;">
                <div class="game-header">
                    <div style="display:flex; flex-direction:column; gap:10px; flex-shrink:0;">
                        <img src="${game.image}" alt="${game.title}" class="game-poster" onerror="this.src='favicon.png'">
                        <button class="set-bg-btn" style="background:rgba(255,255,255,0.05); border:1px solid rgba(255,255,255,0.1); padding:4px 8px; border-radius:4px; cursor:pointer; color:var(--text-muted); font-size:0.75rem; transition:all 0.2s; width:100%; text-align:center;">
                           Usar como fondo
                        </button>
                    </div>
                    <div class="game-info-header">
                        <h1>${game.title}</h1>
                        <div class="game-meta">${tagsHtml}</div>
                        <div class="game-description">${desc}</div>
                        <div class="action-buttons">
                            ${buttonsHtml}
                        </div>
                    </div>
                </div>
            </div>
        `;

        // Botón "Volver" dentro del detalle → navegación SPA
        const backBtn = gameContainer.querySelector('.btn-back-spa');
        if (backBtn) {
            backBtn.addEventListener('click', (e) => {
                e.preventDefault();
                navigateTo(window.location.pathname);
            });
        }

        // Botón "Usar como fondo"
        const bgBtn = gameContainer.querySelector('.set-bg-btn');
        if (bgBtn) {
            bgBtn.addEventListener('click', () => {
                localStorage.setItem('jueguitos_settings_bg_type', 'url');
                localStorage.setItem('jueguitos_settings_bg_value', game.image);
                location.reload();
            });
        }

        // Tracking de descargas para logros
        const dlBtns = gameContainer.querySelectorAll('.btn-download-track');
        dlBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                if (typeof AchievementManager !== 'undefined') AchievementManager.trackEvent({ type: 'DOWNLOAD_CLICK' });
            });
        });
    };

    // Genera los botones de acción (Descargar, links custom, Volver)
    const generateButtons = (game) => {
        let html = '';
        if (game.buttons && game.buttons.length > 0) {
            game.buttons.forEach(btn => {
                let label, url, style;
                if (Array.isArray(btn)) [label, url, style] = btn;
                else ({ label, url, style } = btn);

                let css = 'button';
                if (style === 'primary') css = 'btn btn-primary';
                if (style === 'secondary') css = 'btn btn-secondary';

                html += `<a href="${url}" target="_blank" class="${css}">${label}</a>`;
            });
        } else {
            if (game.downloadUrl) html += `<a href="${game.downloadUrl}" target="_blank" class="btn btn-primary btn-download-track">Descargar</a>`;
        }
        // Botón SPA para volver a la grilla
        html += `<a href="#" class="btn btn-secondary btn-back-spa">Volver</a>`;
        return html;
    };

    const generateTagsRef = (tags) => {
        return tags.map(tag => `<span class="${getTagClass(tag)}">${tag}</span>`).join('');
    };

    // Genera datos estructurados JSON-LD para SEO
    const updateJsonLd = (game) => {
        let script = document.getElementById('game-json-ld');
        if (!script) {
            script = document.createElement('script');
            script.id = 'game-json-ld';
            script.type = 'application/ld+json';
            document.head.appendChild(script);
        }

        const schema = {
            "@context": "https://schema.org",
            "@type": "VideoGame",
            "name": game.title,
            "description": game.fullDescription || game.description,
            "image": game.image,
            "url": window.location.href,
            "genre": game.tags,
            "author": {
                "@type": "Organization",
                "name": "Jueguitos Piola"
            },
            "applicationCategory": "Game",
            "operatingSystem": "Windows"
        };

        script.textContent = JSON.stringify(schema);
    };

    // === UTILIDADES (Búsqueda, Favoritos) ===

    // Búsqueda con debounce — incluye lógica para mostrar juegos ocultos
    const handleSearch = debounce((term) => {
        const t = term.toLowerCase();

        let filtered;
        if (t === 'oculto') {
            // Mostrar SOLO juegos ocultos
            filtered = allGames.filter(g => g.hidden === true);
        } else {
            // Búsqueda normal (excluye ocultos)
            filtered = allGames.filter(g => {
                if (g.hidden) return false;
                return g.title.toLowerCase().includes(t) ||
                    g.tags.some(tag => tag.toLowerCase().includes(t));
            });
        }

        renderGrid(sortGamesWithFavorites(filtered), true);
    }, 150);

    function debounce(fn, delay) {
        let id;
        return (...args) => {
            clearTimeout(id);
            id = setTimeout(() => fn(...args), delay);
        };
    }

    // --- Favoritos ---

    const toggleFavorite = (id) => {
        let favs = JSON.parse(localStorage.getItem('jueguitosFavorites')) || [];
        const idx = favs.indexOf(id);
        if (idx === -1) favs.push(id);
        else favs.splice(idx, 1);
        localStorage.setItem('jueguitosFavorites', JSON.stringify(favs));
        return idx === -1;
    };

    const isFavorite = (id) => {
        const favs = JSON.parse(localStorage.getItem('jueguitosFavorites')) || [];
        return favs.includes(id);
    };

    const handleFavoriteClick = (e) => {
        e.stopPropagation();
        const btn = e.target.closest('.favorite-btn');
        const card = btn.closest('.game-card');
        const id = card.dataset.gameId;

        const isFav = toggleFavorite(id);
        btn.classList.toggle('active', isFav);
        card.classList.toggle('is-favorite', isFav);

        // Re-renderizar la grilla después de un breve delay para la animación
        setTimeout(() => {
            if (gameView.style.display === 'none') {
                handleSearch(searchInput ? searchInput.value : '');
            }
        }, 300);
    };

    // Ordena poniendo favoritos primero
    const sortGamesWithFavorites = (games) => {
        const favs = JSON.parse(localStorage.getItem('jueguitosFavorites')) || [];
        return [...games].sort((a, b) => {
            const aFav = favs.includes(a.id);
            const bFav = favs.includes(b.id);
            if (aFav && !bFav) return -1;
            if (!aFav && bFav) return 1;
            return 0;
        });
    };

    // === RULETA RANDOM ===
    const startRoulette = () => {
        const modal = document.getElementById('rouletteModal');
        const strip = document.getElementById('rouletteStrip');
        const title = document.getElementById('rouletteGameTitle');
        const rouletteWindow = document.querySelector('.roulette-window');

        if (!modal || !strip) return;

        // 1. Obtener candidatos (sin ocultos ni utilidades)
        const candidates = allGames.filter(g => !g.hidden && !g.tags.some(t => t.toLowerCase() === 'utilidad'));
        if (candidates.length === 0) return alert('No hay juegos para sortear.');

        // 2. Elegir ganador al azar
        const winnerIndex = Math.floor(Math.random() * candidates.length);
        const winner = candidates[winnerIndex];

        // 3. Abrir modal
        modal.style.display = 'flex';
        // Force reflow
        void modal.offsetWidth;
        modal.classList.add('active');
        rouletteWindow.classList.remove('winner-pulse');
        title.innerText = "GIRANDO...";
        title.style.color = "var(--primary-color)";

        // 4. Construir la tira de cards
        // El ganador se coloca en la posición TARGET_INDEX
        const CARD_WIDTH = 250;
        const TARGET_INDEX = 50;
        const TOTAL_ITEMS = 60;

        strip.innerHTML = '';
        strip.style.transition = 'none';
        strip.style.transform = 'translateX(0px)';

        for (let i = 0; i < TOTAL_ITEMS; i++) {
            let game;
            if (i === TARGET_INDEX) {
                game = winner;
            } else {
                game = candidates[Math.floor(Math.random() * candidates.length)];
            }

            const card = document.createElement('div');
            card.className = 'roulette-card';
            card.style.backgroundImage = `url('${game.image}')`;
            card.innerHTML = `<span>${game.title}</span>`;
            strip.appendChild(card);
        }

        // 5. Calcular posición de scroll para centrar el ganador en la ventana
        const windowWidth = rouletteWindow.offsetWidth;
        const centerOfCard = (TARGET_INDEX * CARD_WIDTH) + (CARD_WIDTH / 2);
        const targetX = (windowWidth / 2) - centerOfCard;

        // Offset random para que no siempre caiga exacto en el centro
        const randomOffset = (Math.random() * (CARD_WIDTH * 0.8)) - (CARD_WIDTH * 0.4);
        const finalX = targetX + randomOffset;

        // Forzar reflow antes de animar
        strip.offsetHeight;

        // 6. Animar — cubic-bezier simula "giro de ruleta" (rápido al inicio, lento al final)
        setTimeout(() => {
            strip.style.transition = 'transform 6s cubic-bezier(0.1, 0, 0.1, 1)';
            strip.style.transform = `translateX(${finalX}px)`;
        }, 50);

        // Logro: Ludópata (tracking de giros)
        if (typeof AchievementManager !== 'undefined') AchievementManager.trackEvent({ type: 'ROULETTE_SPIN' });

        // 7. Finalizar — mostrar ganador y auto-navegar
        setTimeout(() => {
            rouletteWindow.classList.add('winner-pulse');
            title.innerText = winner.title;
            title.style.color = "var(--secondary-color)";

            // Auto-navegar al juego ganador después de mostrarlo
            setTimeout(() => {
                modal.classList.remove('active');
                setTimeout(() => {
                    modal.style.display = 'none';
                }, 300); // Wait for fade out
                showGame(winner.id);
            }, 2500);

        }, 6050); // 6s de animación + buffer
    };

    // Ejecutar
    init();
});
