const GameDetail = (() => {
    const render = (game) => {
        const gameContainer = document.getElementById('game-container');
        if (!gameContainer) return;
        
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

        const backBtn = gameContainer.querySelector('.btn-back-spa');
        if (backBtn) {
            backBtn.addEventListener('click', (e) => {
                e.preventDefault();
                Router.navigateTo(window.location.pathname);
            });
        }

        const bgBtn = gameContainer.querySelector('.set-bg-btn');
        if (bgBtn) {
            bgBtn.addEventListener('click', () => {
                localStorage.setItem('jueguitos_settings_bg_type', 'url');
                localStorage.setItem('jueguitos_settings_bg_value', game.image);
                location.reload();
            });
        }

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

                // Agregar btn-download-track a todos para que DOWNLOAD_CLICK se trackee siempre
                html += `<a href="${url}" target="_blank" class="${css} btn-download-track">${label}</a>`;
            });
        } else {
            if (game.downloadUrl) html += `<a href="${game.downloadUrl}" target="_blank" class="btn btn-primary btn-download-track">Descargar</a>`;
        }
        html += `<a href="#" class="btn btn-secondary btn-back-spa">Volver</a>`;
        return html;
    };

    const generateTagsRef = (tags) => {
        return tags.map(tag => `<span class="${GridRenderer.getTagClass(tag)}">${tag}</span>`).join('');
    };

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

    return { render, updateJsonLd };
})();
