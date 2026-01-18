document.addEventListener('DOMContentLoaded', () => {
    const gamesGrid = document.getElementById('gamesGrid');
    const searchInput = document.getElementById('searchInput');

    // === UTILIDADES DE RENDIMIENTO ===
    // Debounce para reducir llamadas durante escritura rápida
    const debounce = (fn, delay) => {
        let timeoutId;
        return (...args) => {
            clearTimeout(timeoutId);
            timeoutId = setTimeout(() => fn(...args), delay);
        };
    };

    // Lazy loading de imágenes con IntersectionObserver
    const imageObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const cardImage = entry.target;
                const bgUrl = cardImage.dataset.bg;
                if (bgUrl) {
                    cardImage.style.backgroundImage = bgUrl;
                    cardImage.classList.add('loaded');
                }
                imageObserver.unobserve(cardImage);
            }
        });
    }, { rootMargin: '50px' });


    // === SISTEMA DE FAVORITOS ===
    // Obtener favoritos del localStorage
    const getFavorites = () => {
        try {
            return JSON.parse(localStorage.getItem('jueguitosFavorites')) || [];
        } catch {
            return [];
        }
    };

    // Guardar favoritos en localStorage
    const saveFavorites = (favorites) => {
        localStorage.setItem('jueguitosFavorites', JSON.stringify(favorites));
    };

    // Verificar si un juego es favorito
    const isFavorite = (gameId) => getFavorites().includes(gameId);

    // Alternar favorito
    const toggleFavorite = (gameId) => {
        const favorites = getFavorites();
        const index = favorites.indexOf(gameId);

        if (index === -1) {
            favorites.push(gameId);
        } else {
            favorites.splice(index, 1);
        }

        saveFavorites(favorites);
        return index === -1; // Retorna true si se agregó, false si se quitó
    };

    // Ordenar juegos: favoritos primero
    const sortGamesWithFavorites = (games) => {
        const favorites = getFavorites();
        return [...games].sort((a, b) => {
            const aFav = favorites.includes(a.id);
            const bFav = favorites.includes(b.id);
            if (aFav && !bFav) return -1;
            if (!aFav && bFav) return 1;
            return 0;
        });
    };

    // === FIN SISTEMA DE FAVORITOS ===

    // Usamos la variable global gamesData cargada desde games.js
    // Restaurar posición del scroll y controlar animación
    const scrollPos = sessionStorage.getItem('scrollPos');
    const shouldAnimate = !scrollPos;

    // Leer parámetro de búsqueda de la URL (viene de game.html)
    const urlParams = new URLSearchParams(window.location.search);
    const searchFromUrl = urlParams.get('search');

    if (typeof gamesData !== 'undefined') {
        // Si hay búsqueda en la URL, filtrar y mostrar
        if (searchFromUrl) {
            searchInput.value = searchFromUrl;
            const filtered = gamesData.filter(game =>
                game.title.toLowerCase().includes(searchFromUrl.toLowerCase()) ||
                game.tags.some(tag => tag.toLowerCase().includes(searchFromUrl.toLowerCase()))
            );
            renderGames(sortGamesWithFavorites(filtered), true);
            // Limpiar la URL sin recargar
            window.history.replaceState({}, '', window.location.pathname);
        } else {
            renderGames(sortGamesWithFavorites(gamesData), shouldAnimate);

            if (scrollPos) {
                setTimeout(() => {
                    window.scrollTo(0, parseInt(scrollPos));
                    sessionStorage.removeItem('scrollPos');
                }, 0);
            }
        }
    } else {
        gamesGrid.innerHTML = '<p style="color: red; text-align: center;">Error: No se pudieron cargar los datos de los juegos.</p>';
    }

    // Función para renderizar las tarjetas
    function renderGames(games, animate = true) {
        gamesGrid.innerHTML = '';

        if (games.length === 0) {
            gamesGrid.innerHTML = '<p style="text-align: center; grid-column: 1/-1; color: #666;">No se encontraron juegos.</p>';
            return;
        }

        games.forEach((game, index) => {
            const card = document.createElement('div');
            const gameIsFavorite = isFavorite(game.id);
            card.className = `game-card${gameIsFavorite ? ' is-favorite' : ''}`;
            card.setAttribute('data-game-id', game.id);

            if (animate) {
                card.style.animationDelay = `${index * 0.05}s`;
            } else {
                card.style.animation = 'none';
                card.style.opacity = '1';
                card.style.transform = 'translateY(0)';
            }

            const bgImage = game.image ? `url('${game.image}')` : 'linear-gradient(45deg, #111, #222)';

            // Función para asignar clase especial según el tag
            const getTagClass = (tag) => {
                const tagLower = tag.toLowerCase();
                if (tagLower === 'coop') return 'tag tag-coop';
                if (tagLower === 'terror') return 'tag tag-terror';
                if (tagLower === 'party') return 'tag tag-party';
                return 'tag';
            };

            // Verificar si es utilidad
            const isUtility = game.tags.some(tag => tag.toLowerCase() === 'utilidad');
            const utilityRibbon = isUtility ? '<div class="utility-ribbon">Utilidad</div>' : '';

            card.innerHTML = `
                <button class="favorite-btn${gameIsFavorite ? ' active' : ''}" data-game-id="${game.id}" title="${gameIsFavorite ? 'Quitar de favoritos' : 'Agregar a favoritos'}">
                    ★
                </button>
                <div class="card-image" data-bg="${bgImage}">
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

            // Observar imagen para lazy loading
            const cardImage = card.querySelector('.card-image');
            if (cardImage) imageObserver.observe(cardImage);

            // Click en el botón de favorito
            const favBtn = card.querySelector('.favorite-btn');
            favBtn.addEventListener('click', (e) => {
                e.stopPropagation(); // Evita que se abra el juego
                const isNowFavorite = toggleFavorite(game.id);

                // Actualizar visualmente
                favBtn.classList.toggle('active', isNowFavorite);
                card.classList.toggle('is-favorite', isNowFavorite);
                favBtn.title = isNowFavorite ? 'Quitar de favoritos' : 'Agregar a favoritos';

                // Re-ordenar después de un pequeño delay para que se vea la animación
                setTimeout(() => {
                    const currentSearch = searchInput.value.toLowerCase();
                    let gamesToRender = gamesData;

                    if (currentSearch) {
                        gamesToRender = gamesData.filter(g =>
                            g.title.toLowerCase().includes(currentSearch) ||
                            g.tags.some(tag => tag.toLowerCase().includes(currentSearch))
                        );
                    }

                    renderGames(sortGamesWithFavorites(gamesToRender), false);
                }, 300);
            });

            // Click en la tarjeta (ir al juego)
            card.addEventListener('click', (e) => {
                // Si hizo click en el botón de favorito, no navegar
                if (e.target.closest('.favorite-btn')) return;

                // Guardar posición del scroll para volver
                sessionStorage.setItem('scrollPos', window.scrollY);

                // =========================================================
                // SISTEMA DE NAVEGACIÓN DINÁMICO
                // =========================================================
                // Determinar a dónde navegar según el tipo de juego:
                //
                // 1. externalLink: Abre el downloadUrl directamente (ej: RadminVPN)
                // 2. customPage: Usa el customUrl del juego (ej: schedule.html)
                // 3. Normal: Usa la plantilla dinámica game.html?id=xxx
                //
                let targetUrl;

                if (game.externalLink && game.downloadUrl) {
                    // Caso 1: Link externo (ej: RadminVPN)
                    targetUrl = game.downloadUrl;
                } else if (game.internalLink && game.downloadUrl) {
                    // Caso 2: Link interno a otra página (ej: tuto.html)
                    targetUrl = game.downloadUrl;
                } else if (game.customPage && game.customUrl) {
                    // Caso 3: Página personalizada (ej: schedule con tabla de mods)
                    targetUrl = game.customUrl;
                } else {
                    // Caso 4: Usar plantilla dinámica (la mayoría de juegos)
                    targetUrl = `games/game.html?id=${game.id}`;
                }

                window.location.href = targetUrl;
            });

            gamesGrid.appendChild(card);
        });
    }

    // Filtrado en tiempo real con debounce (150ms)
    const handleSearch = debounce((term) => {
        if (typeof gamesData === 'undefined') return;

        const filtered = gamesData.filter(game =>
            game.title.toLowerCase().includes(term) ||
            game.tags.some(tag => tag.toLowerCase().includes(term))
        );
        renderGames(sortGamesWithFavorites(filtered), true);
    }, 150);

    searchInput.addEventListener('input', (e) => {
        handleSearch(e.target.value.toLowerCase());
    });
});
