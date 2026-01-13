// ============================================================================
// GAME-LOADER.JS - CARGADOR DINÁMICO DE PÁGINAS DE JUEGOS
// ============================================================================
//
// Este script lee el ID del juego desde la URL y renderiza toda la página
// usando los datos de games.js
//
// ============================================================================

document.addEventListener('DOMContentLoaded', () => {
    // =========================================================================
    // PASO 1: Obtener el ID del juego desde la URL
    // =========================================================================
    // 
    // Si la URL es: game.html?id=lethal-company
    // Entonces gameId será: "lethal-company"
    //
    const urlParams = new URLSearchParams(window.location.search);
    const gameId = urlParams.get('id');

    // =========================================================================
    // PASO 2: Validar que tenemos un ID
    // =========================================================================
    if (!gameId) {
        // Si no hay ID en la URL, redirigir al hub
        console.error('No se especificó un ID de juego en la URL');
        mostrarError('No se especificó ningún juego');
        return;
    }

    // =========================================================================
    // PASO 3: Buscar el juego en la base de datos
    // =========================================================================
    //
    // gamesData viene de games.js (se carga antes que este script)
    // Buscamos el juego que tenga el ID que coincida
    //
    if (typeof gamesData === 'undefined') {
        console.error('No se pudo cargar la base de datos de juegos (games.js)');
        mostrarError('Error al cargar los datos');
        return;
    }

    const game = gamesData.find(g => g.id === gameId);

    // =========================================================================
    // PASO 4: Verificar que el juego existe
    // =========================================================================
    if (!game) {
        console.error(`No se encontró el juego con ID: ${gameId}`);
        mostrarError(`Juego "${gameId}" no encontrado`);
        return;
    }

    // =========================================================================
    // PASO 5: Renderizar la página
    // =========================================================================
    renderizarPagina(game);
});


// =============================================================================
// FUNCIÓN: renderizarPagina
// =============================================================================
// Toma los datos del juego y genera todo el HTML de la página
//
function renderizarPagina(game) {
    // Actualizar el título de la pestaña del navegador
    document.title = `${game.title} | Jueguitos Piola`;

    // Obtener el contenedor donde vamos a poner todo
    const container = document.getElementById('game-container');

    // -------------------------------------------------------------------------
    // Generar los botones de acción
    // -------------------------------------------------------------------------
    // Solo mostramos los botones que tienen URL válida
    //
    let botonesHTML = '';

    // Botón de descarga (siempre presente si hay URL)
    if (game.downloadUrl) {
        botonesHTML += `
            <a href="${game.downloadUrl}" target="_blank" class="btn btn-primary">
                Descargar
            </a>
        `;
    }

    // Botón de Fix Online (solo si existe)
    if (game.fixOnlineUrl) {
        botonesHTML += `
            <a href="${game.fixOnlineUrl}" target="_blank" class="button">
                Fix Online
            </a>
        `;
    }

    // Botón de Mods (solo si existe)
    if (game.modsUrl) {
        botonesHTML += `
            <a href="${game.modsUrl}" target="_blank" class="button">
                Mods
            </a>
        `;
    }

    // Botón de volver (siempre presente)
    botonesHTML += `
        <a href="../index.html" class="btn btn-secondary">
            Volver
        </a>
    `;

    // -------------------------------------------------------------------------
    // Generar los tags
    // -------------------------------------------------------------------------
    const tagsHTML = game.tags.map(tag => `<span>${tag}</span>`).join('');

    // -------------------------------------------------------------------------
    // Generar la descripción
    // -------------------------------------------------------------------------
    // Usamos fullDescription si existe, sino usamos description
    const descripcion = game.fullDescription || game.description;

    // -------------------------------------------------------------------------
    // RENDERIZAR TODO EL HTML
    // -------------------------------------------------------------------------
    container.innerHTML = `
        <div class="game-detail-container">
            <!-- Cabecera del juego: imagen + info -->
            <div class="game-header">
                <!-- Imagen del juego -->
                <img 
                    src="${game.image}" 
                    alt="${game.title}" 
                    class="game-poster" 
                    loading="eager" 
                    decoding="async" 
                    fetchpriority="high"
                >
                
                <!-- Información del juego -->
                <div class="game-info-header">
                    <!-- Título -->
                    <h1>${game.title}</h1>
                    
                    <!-- Tags/etiquetas -->
                    <div class="game-meta">
                        ${tagsHTML}
                    </div>
                    
                    <!-- Descripción -->
                    <div class="game-description">
                        <p>${descripcion}</p>
                    </div>
                    
                    <!-- Botones de acción -->
                    <div class="action-buttons">
                        ${botonesHTML}
                    </div>
                </div>
            </div>

            <!-- Especificaciones del juego -->
            <div class="game-specs">
                <div class="spec-item">
                    <h3>Sistema</h3>
                    <p>Windows 7 o superior</p>
                </div>
                <div class="spec-item">
                    <h3>Procesador</h3>
                    <p>Intel Core i3 / AMD Ryzen 3</p>
                </div>
                <div class="spec-item">
                    <h3>Memoria</h3>
                    <p>4GB RAM</p>
                </div>
                <div class="spec-item">
                    <h3>Gráficos</h3>
                    <p>Compatible con DirectX 11</p>
                </div>
            </div>
        </div>
    `;
}


// =============================================================================
// FUNCIÓN: mostrarError
// =============================================================================
// Muestra un mensaje de error y un botón para volver al hub
//
function mostrarError(mensaje) {
    const container = document.getElementById('game-container');

    document.title = 'Error | Jueguitos Piola';

    container.innerHTML = `
        <div class="game-detail-container" style="text-align: center; padding: 4rem;">
            <h1 style="color: var(--accent-red); margin-bottom: 1rem;">⚠️ Error</h1>
            <p style="color: #888; margin-bottom: 2rem;">${mensaje}</p>
            <a href="../index.html" class="btn btn-primary">Volver al Hub</a>
        </div>
    `;
}


// =============================================================================
// NOTA PARA DESARROLLADORES:
// =============================================================================
//
// Si querés agregar más contenido dinámico (como una sección de mods),
// podés agregar campos en games.js y renderizarlos aquí.
//
// Ejemplo: si agregás "modsInfo" en games.js, podés renderizarlo así:
//
//   if (game.modsInfo) {
//       container.innerHTML += `<div class="mods-section">...</div>`;
//   }
//
// =============================================================================
