/*
    assets/js/free-games.js
    Sección de Giveaways usando GamerPower API (con CORS habilitado)
*/

// Exponer setup globalmente para que lazy-loader lo invoque
window.setupFreeGamesUI = () => {
    // Inyectar el botón en el Nav
    const nav = document.querySelector('header nav');
    if (nav && !document.getElementById('btnFreeGames')) {
        const btnFreeGames = document.createElement('button');
        btnFreeGames.className = 'theme-toggle';
        btnFreeGames.id = 'btnFreeGames';
        btnFreeGames.title = 'Juegos y Giveaways 100% Gratis';
        btnFreeGames.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 12 20 22 4 22 4 12"></polyline><rect x="2" y="7" width="20" height="5"></rect><line x1="12" y1="22" x2="12" y2="7"></line><path d="M12 7H7.5a2.5 2.5 0 0 1 0-5C11 2 12 7 12 7z"></path><path d="M12 7h4.5a2.5 2.5 0 0 0 0-5C13 2 12 7 12 7z"></path></svg>';
        nav.insertBefore(btnFreeGames, document.getElementById('btnMiniGames'));

        btnFreeGames.addEventListener('click', () => {
            history.pushState(null, '', '?view=juegos-gratis');
            openFreeGamesView();
        });
    }

    // Interceptar el logo para ocultar la vista si estamos en ella
    const logo = document.querySelector('.logo');
    if (logo) {
        // Avoid double binding if called multiple times by accident
        logo.removeEventListener('click', closeFreeGamesView);
        logo.addEventListener('click', closeFreeGamesView);
    }

    // Inyectar el contenedor en main si no existe
    const main = document.querySelector('main');
    if (main && !document.getElementById('free-games-view')) {
        const freeGamesView = document.createElement('section');
        freeGamesView.id = 'free-games-view';
        freeGamesView.style.display = 'none';
        freeGamesView.innerHTML = `
            <div class="fg-header">
                <div class="fg-title-wrapper">
                    <span class="fg-icon"><svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 12 20 22 4 22 4 12"></polyline><rect x="2" y="7" width="20" height="5"></rect><line x1="12" y1="22" x2="12" y2="7"></line><path d="M12 7H7.5a2.5 2.5 0 0 1 0-5C11 2 12 7 12 7z"></path><path d="M12 7h4.5a2.5 2.5 0 0 0 0-5C13 2 12 7 12 7z"></path></svg></span>
                    <div>
                        <h2>Juegos Gratis (100% Descuento)</h2>
                        <p class="fg-subtitle">Regalos activos</p>
                    </div>
                </div>
                <button id="btnFgBackHome" class="fg-back-btn">← Volver al Inicio</button>
            </div>
            <div id="fgContainer"></div>

            <p class="fg-attribution">Data powered by <a href="https://www.gamerpower.com" target="_blank" rel="noopener">GamerPower.com</a></p>
        `;
        main.appendChild(freeGamesView);

        document.getElementById('btnFgBackHome').addEventListener('click', closeFreeGamesView);
    }
}

function openFreeGamesView() {
    // Ocultar la SPA principal para que no interfiera
    const gamesGrid = document.getElementById('gamesGrid');
    const gameView = document.getElementById('game-view');
    const freeGamesView = document.getElementById('free-games-view');

    if (gamesGrid) gamesGrid.style.display = 'none';
    if (gameView) gameView.style.display = 'none';

    if (freeGamesView) {
        freeGamesView.style.display = 'block';

        // Verificar si ya se cargaron las tarjetas (no el placeholder del HTML)
        const fgContainer = document.getElementById('fgContainer');
        const alreadyLoaded = fgContainer && fgContainer.querySelector('.fg-card');

        if (!alreadyLoaded) {
            fetchFreeGames();
        }
    }

    window.scrollTo({ top: 0, behavior: 'smooth' });
}

function closeFreeGamesView() {
    const freeGamesView = document.getElementById('free-games-view');
    if (freeGamesView) freeGamesView.style.display = 'none';

    // Restaurar URL y grilla principal
    history.pushState(null, '', window.location.pathname);
    const gamesGrid = document.getElementById('gamesGrid');
    if (gamesGrid) gamesGrid.style.display = 'grid';

    window.scrollTo({ top: 0, behavior: 'smooth' });
}

// Cierre silencioso: solo oculta el elemento, sin tocar URL ni gamesGrid.
// Llamado desde app.js cuando la ruleta o el router necesitan tomar control.
function hideFreeGamesView() {
    const freeGamesView = document.getElementById('free-games-view');
    if (freeGamesView) freeGamesView.style.display = 'none';
}

async function fetchFreeGames() {
    const container = document.getElementById('fgContainer');
    if (!container) return;

    container.innerHTML = '<div class="fg-loading">Buscando giveaways activos...</div>';

    // =====================================================================
    // WORKER PROPIO: una vez que actualices el código en Cloudflare Dashboard,
    // descomentá la línea de abajo y comentá el null.
    // Ver instrucciones en: .agent/scripts/cf-worker-cors-proxy.js
    // =====================================================================
    // const WORKER_URL = 'https://gentle-firefly-a8c1.thehugo300iambot.workers.dev';
    const WORKER_URL = null; // Lo desactivamos hasta que el Worker tenga el código correcto

    // URL directa de GamerPower (CORS bloqueado en navegadores sin proxy)
    const GAMERPOWER_URL = 'https://www.gamerpower.com/api/giveaways?type=game&platform=pc';

    // Proxies en orden de confiabilidad — el Worker propio va primero una vez activo
    const proxies = [
        WORKER_URL, // null = se omite con el .filter(Boolean)
        `https://corsproxy.io/?${encodeURIComponent(GAMERPOWER_URL)}`,
        `https://api.codetabs.com/v1/proxy?quest=${encodeURIComponent(GAMERPOWER_URL)}`,
    ].filter(Boolean);

    let lastError = null;

    for (const proxyUrl of proxies) {
        try {
            // Timeout de 5s — si un proxy no responde, probamos el siguiente rápido
            const response = await fetch(proxyUrl, { signal: AbortSignal.timeout(5000) });

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}`);
            }

            const data = await response.json();

            // GamerPower devuelve objeto (no array) cuando no hay resultados
            if (!Array.isArray(data)) {
                container.innerHTML = '<div class="fg-error">No hay giveaways activos en este momento. ¡Volvé más tarde!</div>';
                return;
            }

            // Éxito: renderizar y salir del loop
            renderFreeGames(data);
            return;

        } catch (err) {
            console.warn('[free-games] Proxy falló:', proxyUrl, '->', err.message);
            lastError = err;
        }
    }

    // Todos los proxies fallaron
    console.error('[free-games] Todos los proxies fallaron. Último error:', lastError);
    container.innerHTML = `<div class="fg-error">
        <h3>No se pudo cargar la lista de giveaways.</h3>
        <p>Todos los proxies CORS fallaron en este momento.</p>
        <p style="font-size:0.8rem; color:#888; margin-top:8px;">
            Para una solución permanente, configurá un Cloudflare Worker
            siguiendo las instrucciones en <code>.agent/scripts/cf-worker-cors-proxy.js</code>
        </p>
        <button onclick="fetchFreeGames()" style="margin-top:12px; padding:8px 16px; background:rgba(0,243,255,0.15); border:1px solid var(--primary-color,#00f3ff); color:var(--primary-color,#00f3ff); border-radius:6px; cursor:pointer; font-family:inherit; display:inline-flex; align-items:center; gap:6px;"><svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="1 4 1 10 7 10"></polyline><path d="M3.51 15a9 9 0 1 0 .49-3.52"></path></svg> Reintentar</button>
    </div>`;
}

// Logos de plataforma via CDN confiable (Simpleicons - sin CORS para img)
const PLATFORM_META = {
    'Steam': {
        label: 'Steam',
        color: '#1b2838',
        textColor: '#c7d5e0',
        logo: 'https://cdn.simpleicons.org/steam/c7d5e0',
    },
    'Epic Games': {
        label: 'Epic Games',
        color: '#2d2d2d',
        textColor: '#ffffff',
        logo: 'https://cdn.simpleicons.org/epicgames/ffffff',
    },
    'GOG': {
        label: 'GOG',
        color: '#86328a',
        textColor: '#ffffff',
        logo: 'https://cdn.simpleicons.org/gogdotcom/ffffff',
    },
    'Itch.io': {
        label: 'Itch.io',
        color: '#fa5c5c',
        textColor: '#ffffff',
        logo: 'https://cdn.simpleicons.org/itchdotio/ffffff',
    },
    'PC': {
        label: 'PC',
        color: '#1a1a2e',
        textColor: '#aaa',
        logo: null,
    },
    'DRM-Free': {
        label: 'DRM-Free',
        color: '#1a1a2e',
        textColor: '#aaa',
        logo: null,
    },
};

// Orden de prioridad — PC y DRM-Free excluidos (juegos genéricos de baja calidad)
const PLATFORM_ORDER = ['Steam', 'Epic Games', 'GOG', 'Itch.io'];

function detectPlatformKey(platformsStr) {
    // Detecta qué plataforma prioritaria contiene el giveaway
    for (const key of PLATFORM_ORDER) {
        if (platformsStr && platformsStr.toLowerCase().includes(key.toLowerCase())) {
            return key;
        }
    }
    return 'PC'; // Fallback
}

/**
 * Formatea la fecha de expiración en hora Argentina (UTC-3).
 * La API de GamerPower devuelve fechas en formato "YYYY-MM-DD HH:mm:ss" (UTC).
 * Retorna HTML: badge rojo si tiene fecha, texto gris si es permanente.
 */
function formatExpiryAR(endDateStr) {
    if (!endDateStr || endDateStr === 'N/A') {
        return `<span class="fg-expiry-none">Sin expiración definida</span>`;
    }

    // Parsear la fecha UTC de la API (formato: "2026-03-04 23:59:00")
    const utcDate = new Date(endDateStr.replace(' ', 'T') + 'Z');
    if (isNaN(utcDate.getTime())) {
        return `<span class="fg-expiry-none">${endDateStr}</span>`;
    }

    // Formatear en zona horaria de Argentina (America/Argentina/Buenos_Aires = UTC-3, sin DST)
    const formatted = utcDate.toLocaleString('es-AR', {
        timeZone: 'America/Argentina/Buenos_Aires',
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
    });

    return `<span class="fg-expiry-badge"><svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="vertical-align:middle;margin-right:3px"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg> Vence ${formatted} (ARG)</span>`;
}

function renderFreeGames(gamesList) {

    const container = document.getElementById('fgContainer');
    if (!container) return;

    container.innerHTML = '';

    if (!Array.isArray(gamesList) || gamesList.length === 0) {
        container.innerHTML = '<div class="fg-error">No hay giveaways activos en este momento. ¡Volvé más tarde!</div>';
        return;
    }

    // Agrupar juegos por plataforma detectada
    const grouped = {};
    for (const key of PLATFORM_ORDER) {
        grouped[key] = [];
    }

    gamesList.forEach(game => {
        const key = detectPlatformKey(game.platforms);
        // Solo agregar si la plataforma es una de las que mostramos
        if (grouped[key] !== undefined) {
            grouped[key].push(game);
        }
    });

    // Renderizar cada sección de plataforma en orden
    for (const platformKey of PLATFORM_ORDER) {
        const games = grouped[platformKey];
        if (!games || games.length === 0) continue;

        const meta = PLATFORM_META[platformKey];
        const logoHtml = meta.logo
            ? `<img src="${meta.logo}" alt="${meta.label}" class="fg-platform-logo" onerror="this.style.display='none'">`
            : '';

        // Header de sección con barra de color lateral
        const sectionHeader = document.createElement('div');
        sectionHeader.className = 'fg-section-header';
        sectionHeader.style.borderLeftColor = meta.color;
        sectionHeader.innerHTML = `
            <div class="fg-platform-label" style="background:${meta.color}">
                ${logoHtml}
                <span style="color:${meta.textColor}">${meta.label}</span>
            </div>
            <span class="fg-platform-count">${games.length} giveaway${games.length !== 1 ? 's' : ''}</span>
        `;
        container.appendChild(sectionHeader);

        // Grid de tarjetas de esta plataforma
        const sectionGrid = document.createElement('div');
        sectionGrid.className = 'fg-grid fg-section-grid';
        container.appendChild(sectionGrid);

        games.forEach(game => {
            const card = document.createElement('div');
            card.className = 'fg-card';

            const expiryHtml = formatExpiryAR(game.end_date);

            card.innerHTML = `
                <div class="fg-card-img-wrapper">
                    <img src="${game.image}" alt="${game.title}" class="fg-card-img">
                    <span class="fg-platform-badge" style="background:${meta.color}; color:${meta.textColor};">
                        ${meta.logo ? `<img src="${meta.logo}" class="fg-badge-logo" alt="">` : ''}
                        ${meta.label}
                    </span>
                </div>
                <div class="fg-card-body">
                    <h3 class="fg-card-title">${game.title}</h3>
                    <div class="fg-tags">
                        <span class="fg-tag genre">${game.type === 'Game' ? 'Juego' : 'DLC'}</span>
                    </div>
                    <p class="fg-description">${game.description}</p>
                    <div class="fg-status">
                        <span class="fg-free-badge">¡100% GRATIS!</span>
                        ${expiryHtml}
                    </div>
                </div>
                <div class="fg-card-actions">
                    <a href="${game.open_giveaway}" target="_blank" rel="noopener noreferrer" class="fg-btn fg-btn-play">
                        Obtener Ahora
                    </a>
                </div>
            `;

            sectionGrid.appendChild(card);
        });
    }
}

// Exponer globalmente para que app.js y el logo puedan controlar la vista
window.closeFreeGamesView = closeFreeGamesView;
window.openFreeGamesView = openFreeGamesView;
window.hideFreeGamesView = hideFreeGamesView;

// Detectar ?view=juegos-gratis al cargar la página
window.addEventListener('load', () => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('view') === 'juegos-gratis') {
        setTimeout(openFreeGamesView, 150);
    }
});
