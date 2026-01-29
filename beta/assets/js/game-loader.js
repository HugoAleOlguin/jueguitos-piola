// ============================================================================
// GAME-LOADER.JS - CARGADOR DINÁMICO DE PÁGINAS DE JUEGOS
// ============================================================================
//
// Este script lee el ID del juego desde la URL y renderiza toda la página
// usando los datos de games.js
//
// ============================================================================

document.addEventListener('DOMContentLoaded', () => {
    const urlParams = new URLSearchParams(window.location.search);
    const gameId = urlParams.get('id');

    if (!gameId) {
        mostrarError('No se especificó ningún juego');
        return;
    }

    if (typeof gamesData === 'undefined') {
        mostrarError('Error al cargar los datos');
        return;
    }

    const game = gamesData.find(g => g.id === gameId);

    if (!game) {
        mostrarError(`Juego "${gameId}" no encontrado`);
        return;
    }

    console.log(`✅ Cargando juego: ${game.title}`);
    renderizarPagina(game);
});


// =============================================================================
// FUNCIÓN: renderizarPagina
// =============================================================================

function renderizarPagina(game) {
    document.title = `${game.title} | Jueguitos Piola`;
    const container = document.getElementById('game-container');

    const botones = generarBotones(game);
    const tagsHTML = generarTags(game.tags);
    const descripcion = game.fullDescription || game.description;

    container.innerHTML = `
        <div class="game-detail-container">
            <div class="game-header">
                <img 
                    src="${game.image}" 
                    alt="${game.title}" 
                    class="game-poster"
                    loading="eager"
                    onerror="this.src='../favicon.png'; this.style.objectFit='contain';"
                >
                
                <div class="game-info-header">
                    <h1>${game.title}</h1>
                    
                    <div class="game-meta">
                        ${tagsHTML}
                    </div>
                    
                    <div class="game-description">
                        <p>${descripcion}</p>
                    </div>
                    
                    <div class="action-buttons">
                        ${botones}
                    </div>
                </div>
            </div>
        </div>
    `;
}


// =============================================================================
// FUNCIONES AUXILIARES
// =============================================================================

function generarBotones(game) {
    let html = '';

    // Nueva estructura: Array de botones dinámicos
    if (game.buttons && Array.isArray(game.buttons) && game.buttons.length > 0) {
        game.buttons.forEach(btn => {
            let cssClass = 'button'; // Default style
            
            // Map styles
            if (btn.style === 'primary') cssClass = 'btn btn-primary';
            else if (btn.style === 'secondary') cssClass = 'btn btn-secondary';
            else if (btn.style === 'danger') cssClass = 'btn btn-danger'; // Need to ensure this exists or use style attr
            else if (btn.style === 'outline') cssClass = 'button'; 

            html += `<a href="${btn.url}" target="_blank" class="${cssClass}">${btn.label}</a>`;
        });
    } 
    // Fallback: Estructura legacy (para juegos viejos no migrados aún)
    else {
        if (game.downloadUrl) {
            html += `<a href="${game.downloadUrl}" target="_blank" class="btn btn-primary">Descargar</a>`;
        }

        if (game.fixOnlineUrl) {
            html += `<a href="${game.fixOnlineUrl}" target="_blank" class="button">Fix Online</a>`;
        }

        if (game.modsUrl) {
            html += `<a href="${game.modsUrl}" target="_blank" class="button">Mods</a>`;
        }
    }

    // Botón Volver siempre al final (hardcoded por consistencia de navegación, o configurable si se desea)
    html += `<a href="../index.html" class="btn btn-secondary">Volver</a>`;

    return html;
}

function generarTags(tags) {
    if (!tags || tags.length === 0) return '';

    return tags.map(tag => {
        let colorClass = '';
        const tagLower = tag.toLowerCase();

        if (tagLower === 'coop' || tagLower === 'cooperativo') {
            colorClass = 'tag-coop';
        } else if (tagLower === 'terror' || tagLower === 'horror') {
            colorClass = 'tag-terror';
        } else if (tagLower === 'party' || tagLower === 'fiesta') {
            colorClass = 'tag-party';
        }

        return `<span class="${colorClass}">${tag}</span>`;
    }).join('');
}

function mostrarError(mensaje) {
    const container = document.getElementById('game-container');
    document.title = 'Error | Jueguitos Piola';

    container.innerHTML = `
        <div class="game-detail-container" style="text-align: center; padding: 4rem;">
            <h1 style="color: var(--accent-red); margin-bottom: 1rem; font-size: 3rem;">⚠️</h1>
            <h2 style="color: var(--accent-red); margin-bottom: 1rem;">Error</h2>
            <p style="color: #888; margin-bottom: 2rem;">${mensaje}</p>
            <a href="../index.html" class="btn btn-primary">Volver al Hub</a>
        </div>
    `;
}
