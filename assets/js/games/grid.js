const GridRenderer = (() => {
    const render = (games, animate = true) => {
        const gamesGrid = document.getElementById('gamesGrid');
        if (!gamesGrid) return;
        
        gamesGrid.innerHTML = '';

        if (games.length === 0) {
            gamesGrid.innerHTML = '<p class="no-results">No se encontraron juegos.</p>';
            return;
        }

        games.forEach((game, index) => {
            const card = document.createElement('div');
            card.className = 'game-card';
            card.dataset.gameId = game.id;
            card.tabIndex = 0; // Para navegación por teclado
            card.setAttribute('role', 'button');

            if (animate) card.style.animationDelay = `${index * 0.03}s`;
            else {
                card.style.animation = 'none';
                card.style.opacity = '1';
                card.style.transform = 'none';
            }

            // Optimización vía Proxy: Compresión automática al vuelo sin lazy loading
            let proxiedUrl = game.image;
            if (game.image && game.image.startsWith('http')) {
                // Generar URL WebP optimizada (400px de ancho suele ser suficiente para cards)
                let proxyUrl = `https://wsrv.nl/?url=${encodeURIComponent(game.image)}&w=400&output=webp&q=80`;
                if (game.image.toLowerCase().includes('.gif')) {
                    proxyUrl += '&n=-1'; // Preservar animación (GIF -> WebP animado)
                }
                proxiedUrl = proxyUrl;
            }
            const bgImage = proxiedUrl ? `url('${proxiedUrl}')` : 'linear-gradient(45deg, #111, #222)';
            const isUtility = game.tags.some(tag => tag.toLowerCase() === 'utilidad');
            const utilityRibbon = isUtility ? '<div class="utility-ribbon">Utilidad</div>' : '';

            card.innerHTML = `
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

    const init = () => {
        const gamesGrid = document.getElementById('gamesGrid');
        if (gamesGrid) {
            gamesGrid.addEventListener('click', (e) => {
                const card = e.target.closest('.game-card');
                if (card) {
                    e.preventDefault();
                    const gameId = card.dataset.gameId;
                    const game = window.gamesData?.find(g => g.id === gameId);

                    if (game) {
                        if (game.externalLink && game.downloadUrl) {
                            window.open(game.downloadUrl, '_blank');
                        } else if (game.internalLink && game.downloadUrl) {
                            window.location.href = game.downloadUrl;
                        } else {
                            Router.navigateTo(`?id=${gameId}`);
                        }
                    }
                }
            });
        }
    };

    return { init, render, getTagClass };
})();
