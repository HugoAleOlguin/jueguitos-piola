// ============================================================================
// APP.JS (SPA VERSION)
// Central Controller for Jueguitos Piola
// Handles: Routing, Grid Rendering, Game Details, Search, Favorites
// ============================================================================

document.addEventListener('DOMContentLoaded', () => {
    // === DOM ELEMENTS ===
    const gamesGrid = document.getElementById('gamesGrid');
    const gameView = document.getElementById('game-view');
    const gameContainer = document.getElementById('game-container');
    const searchInput = document.getElementById('searchInput');
    const searchContainer = document.querySelector('.search-bar'); // To hide search in game view if desired

    // === STATE ===
    let allGames = []; // Will hold gamesData

    // === INITIALIZATION ===
    const init = () => {
        if (typeof gamesData === 'undefined') {
            gamesGrid.innerHTML = '<p class="error">Error: No se pudieron cargar los datos.</p>';
            return;
        }
        allGames = gamesData;

        // 1. Initial Route Check
        handleRoute();

        // 2. Event Listeners
        bindEvents();
    };

    const bindEvents = () => {
        // Popstate (Back/Forward button)
        window.addEventListener('popstate', handleRoute);

        // Grid Click Delegation (Navigate to Game)
        gamesGrid.addEventListener('click', (e) => {
            // Handle Favorite Button separately
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
                    // Logic for external/custom links vs SPA
                    if (game.externalLink && game.downloadUrl) {
                        window.open(game.downloadUrl, '_blank');
                    } else if (game.internalLink && game.downloadUrl) {
                        window.location.href = game.downloadUrl; // Real navigation for internal HTMLs
                    } else if (game.customPage && game.customUrl) {
                        window.location.href = game.customUrl; // Real navigation for custom pages
                    } else {
                        // SPA Navigation
                        navigateTo(`?id=${gameId}`);
                    }
                }
            }
        });

        // Search Input
        if (searchInput) {
            searchInput.addEventListener('input', (e) => {
                const term = e.target.value.toLowerCase().trim();

                // 🕵️ SECRET ADMIN ACCESS
                if (term === 'admin') {
                    window.location.href = 'pages/admin.html';
                    return;
                }

                handleSearch(e.target.value);
            });
        }

        // Randomizer Button
        const btnRandom = document.getElementById('btnRandom');
        if (btnRandom) {
            btnRandom.addEventListener('click', startRoulette);
        }
    };

    // === ROUTING LOGIC ===
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
        // Update Title
        document.title = 'Jueguitos Piola';

        // Toggle Views
        gameView.style.display = 'none';
        gamesGrid.style.display = 'grid'; // Restore grid
        if (searchContainer) searchContainer.style.visibility = 'visible';

        // Restore Scroll Position?
        const scrollPos = sessionStorage.getItem('homeScrollPos');
        if (scrollPos) {
            window.scrollTo(0, parseInt(scrollPos));
            sessionStorage.removeItem('homeScrollPos');
        } else {
            window.scrollTo(0, 0);
        }

        // Render Grid (if empty or needs refresh)
        // Filter out hidden games for default view
        const visibleGames = allGames.filter(g => !g.hidden);

        if (gamesGrid.children.length === 0) {
            renderGrid(sortGamesWithFavorites(visibleGames));
        } else {
            // Ensure favorites are sorted correctly if returning
            // (Optional: simple re-append to avoid flicker, or full re-render)
            // Full re-render is safer for state consistency
            renderGrid(sortGamesWithFavorites(visibleGames), false); // false = no animation
        }
    };

    const showGame = (gameId) => {
        const game = allGames.find(g => g.id === gameId);
        if (!game) {
            // Fix: Use location.pathname to stay in the repository/project root
            // instead of jumping to the domain root ('/')
            navigateTo(window.location.pathname);
            return;
        }

        // Save Scroll Position before switching
        if (gamesGrid.style.display !== 'none') {
            sessionStorage.setItem('homeScrollPos', window.scrollY);
        }

        // Update Title
        document.title = `${game.title} | Jueguitos Piola`;

        // Toggle Views
        gamesGrid.style.display = 'none';
        gameView.style.display = 'block';
        if (searchContainer) searchContainer.style.visibility = 'hidden';

        // Render Game Detail
        renderGameDetail(game);

        // Scroll top
        window.scrollTo(0, 0);

        // Achievement: Game Open (Window Shopper tracking)
        if (typeof AchievementManager !== 'undefined') AchievementManager.trackEvent({ type: 'GAME_OPEN' });
    };

    // === RENDER LOGIC (GRID) ===
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

    const getTagClass = (tag) => {
        const t = tag.toLowerCase();
        if (['coop', 'cooperativo'].includes(t)) return 'tag tag-coop';
        if (['terror', 'horror'].includes(t)) return 'tag tag-terror';
        if (['party', 'fiesta'].includes(t)) return 'tag tag-party';
        return 'tag';
    };

    // === RENDER LOGIC (GAME DETAIL - Merged from game-loader.js) ===
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

        // Bind "Volver" button inside Game Detail to SPA back
        const backBtn = gameContainer.querySelector('.btn-back-spa');
        if (backBtn) {
            backBtn.addEventListener('click', (e) => {
                e.preventDefault();
                navigateTo(window.location.pathname);
            });
        }

        // Bind Set Background
        const bgBtn = gameContainer.querySelector('.set-bg-btn');
        if (bgBtn) {
            bgBtn.addEventListener('click', () => {
                // Direct apply without confirmation
                localStorage.setItem('jueguitos_settings_bg_type', 'custom');
                localStorage.setItem('jueguitos_settings_bg_value', game.image);
                location.reload();
            });
        }


        // Track Downloads
        const dlBtns = gameContainer.querySelectorAll('.btn-download-track');
        dlBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                if (typeof AchievementManager !== 'undefined') AchievementManager.trackEvent({ type: 'DOWNLOAD_CLICK' });
            });
        });
    };

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
        // Custom SPA Back Button
        html += `<a href="#" class="btn btn-secondary btn-back-spa">Volver</a>`;
        return html;
    };

    const generateTagsRef = (tags) => {
        return tags.map(tag => `<span class="${getTagClass(tag)}">${tag}</span>`).join('');
    };

    // === UTILS (Search, Favorites) ===
    const handleSearch = debounce((term) => {
        const t = term.toLowerCase();

        // Logic for Hidden Games
        let filtered;
        if (t === 'oculto') {
            // Show ONLY hidden games
            filtered = allGames.filter(g => g.hidden === true);
        } else {
            // Normal Search (Excludes hidden)
            filtered = allGames.filter(g => {
                if (g.hidden) return false; // Hide hidden games by default
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

    // Favorites Logic (Simplified)
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

        // Re-sort/Re-render if needed? Maybe just visual toggle is enough for speed.
        // Let's re-sort after delay for animation
        setTimeout(() => {
            // Only re-render if we are in Home view
            if (gameView.style.display === 'none') {
                handleSearch(searchInput ? searchInput.value : '');
            }
        }, 300);
    };

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

    // === RANDOMIZER ROULETTE ===
    const startRoulette = () => {
        const modal = document.getElementById('rouletteModal');
        const strip = document.getElementById('rouletteStrip');
        const title = document.getElementById('rouletteGameTitle');
        const win = document.querySelector('.roulette-window');

        if (!modal || !strip) return;

        // 1. Get Candidates
        const candidates = allGames.filter(g => !g.hidden && !g.tags.some(t => t.toLowerCase() === 'utilidad'));
        if (candidates.length === 0) return alert('No hay juegos para sortear.');

        // 2. Setup Winner
        const winnerIndex = Math.floor(Math.random() * candidates.length);
        const winner = candidates[winnerIndex];

        // 3. open Modal
        modal.classList.add('active');
        win.classList.remove('winner-pulse');
        title.innerText = "GIRANDO...";
        title.style.color = "var(--primary-color)";

        // 4. Build Strip
        // We need a long strip. Let's say 60 items.
        // Target index for winner: 50.
        // Format: [Random... * 49] [WINNER] [Random... * 10]
        const CARD_WIDTH = 250; // Defined in CSS
        const TARGET_INDEX = 50;
        const TOTAL_ITEMS = 60;

        strip.innerHTML = '';
        strip.style.transition = 'none';
        strip.style.transform = 'translateX(0px)';

        const stripItems = [];

        for (let i = 0; i < TOTAL_ITEMS; i++) {
            let game;
            if (i === TARGET_INDEX) {
                game = winner;
            } else {
                game = candidates[Math.floor(Math.random() * candidates.length)];
            }
            stripItems.push(game);

            const card = document.createElement('div');
            card.className = 'roulette-card';
            card.style.backgroundImage = `url('${game.image}')`;
            card.innerHTML = `<span>${game.title}</span>`;

            // Highlight winner for debugging? No.
            strip.appendChild(card);
        }

        // 5. Calculate Scroll Position
        // Center the winner. 
        // Window Width = ~800px (max) or 90%
        // We need the center of the window to align with the center of the winner card.
        // But window width varies. 
        // Actually, the marker is at 50% of the window.
        // So we need: (TARGET_INDEX * CARD_WIDTH) + (CARD_WIDTH/2) should be at center.
        // But transform uses top-left.
        // strip is inside window.
        // center of window = windowWidth / 2.
        // center of card = (TARGET_INDEX * w) + w/2.
        // translateX = center_of_window - center_of_card

        const windowWidth = document.querySelector('.roulette-window').offsetWidth;
        const centerOfCard = (TARGET_INDEX * CARD_WIDTH) + (CARD_WIDTH / 2);
        const targetX = (windowWidth / 2) - centerOfCard;

        // Add some random offset within the card to make it realistic ( +/- 40% of card width)
        const randomOffset = (Math.random() * (CARD_WIDTH * 0.8)) - (CARD_WIDTH * 0.4);
        const finalX = targetX + randomOffset;

        // Force Reflow
        strip.offsetHeight;

        // 6. ANIMATE
        // Long duration cubic bezier for "Spinning" feel
        setTimeout(() => {
            strip.style.transition = 'transform 6s cubic-bezier(0.1, 0, 0.1, 1)'; // Fast start, very slow end
            strip.style.transform = `translateX(${finalX}px)`;
        }, 50);

        // Achievement: Ludopath
        if (typeof AchievementManager !== 'undefined') AchievementManager.trackEvent({ type: 'ROULETTE_SPIN' });

        // 7. Finish
        setTimeout(() => {
            // Animation finished
            win.classList.add('winner-pulse');
            title.innerText = winner.title;
            title.style.color = "var(--secondary-color)";

            // Confetti or Sound? (For now just pulse)

            // Auto Navigate after delay
            setTimeout(() => {
                modal.classList.remove('active');
                showGame(winner.id);
            }, 2500); // Wait 2.5s to see the winner

        }, 6050); // 6s duration + buffer
    };

    // Run
    init();
});
