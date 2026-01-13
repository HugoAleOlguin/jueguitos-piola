// ============================================================================
// GAME-LOADER.JS - CARGADOR DINÁMICO DE PÁGINAS DE JUEGOS
// ============================================================================
//
// Este script lee el ID del juego desde la URL y renderiza toda la página
// usando los datos de games.js
//
// CÓMO FUNCIONA:
// 1. Lee el parámetro ?id=xxx de la URL
// 2. Busca el juego en gamesData (de games.js)
// 3. Genera el HTML de la página dinámicamente
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
        console.error('❌ No se especificó un ID de juego en la URL');
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
        console.error('❌ No se pudo cargar la base de datos de juegos (games.js)');
        mostrarError('Error al cargar los datos');
        return;
    }

    const game = gamesData.find(g => g.id === gameId);

    // =========================================================================
    // PASO 4: Verificar que el juego existe
    // =========================================================================
    if (!game) {
        console.error(`❌ No se encontró el juego con ID: ${gameId}`);
        mostrarError(`Juego "${gameId}" no encontrado`);
        return;
    }

    // =========================================================================
    // PASO 5: Renderizar la página
    // =========================================================================
    console.log(`✅ Cargando juego: ${game.title}`);
    renderizarPagina(game);
});


// =============================================================================
// FUNCIÓN: renderizarPagina
// =============================================================================
// Toma los datos del juego y genera todo el HTML de la página
//
function renderizarPagina(game) {
    // -------------------------------------------------------------------------
    // Actualizar el título de la pestaña del navegador
    // -------------------------------------------------------------------------
    document.title = `${game.title} | Jueguitos Piola`;

    // Obtener el contenedor donde vamos a poner todo
    const container = document.getElementById('game-container');

    // -------------------------------------------------------------------------
    // Generar los botones de acción
    // -------------------------------------------------------------------------
    // Solo mostramos los botones que tienen URL válida
    //
    const botones = generarBotones(game);

    // -------------------------------------------------------------------------
    // Generar los tags con clases de color
    // -------------------------------------------------------------------------
    const tagsHTML = generarTags(game.tags);

    // -------------------------------------------------------------------------
    // Generar la descripción
    // -------------------------------------------------------------------------
    // Usamos fullDescription si existe, sino usamos description
    const descripcion = game.fullDescription || game.description;

    // -------------------------------------------------------------------------
    // Generar las especificaciones
    // -------------------------------------------------------------------------
    // Si el juego tiene specs personalizadas, las usamos
    // Si no, mostramos las specs por defecto
    const specsHTML = generarSpecs(game.specs);

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
                    onerror="this.src='../favicon.png'; this.style.objectFit='contain';"
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
                        ${botones}
                    </div>
                </div>
            </div>

            <!-- Especificaciones del juego -->
            <div class="game-specs">
                ${specsHTML}
            </div>
        </div>
    `;
}


// =============================================================================
// FUNCIÓN: generarBotones
// =============================================================================
// Genera el HTML de los botones según los datos disponibles
//
function generarBotones(game) {
    let html = '';

    // Botón de descarga (siempre presente si hay URL)
    if (game.downloadUrl) {
        html += `
            <a href="${game.downloadUrl}" target="_blank" class="btn btn-primary">
                Descargar
            </a>
        `;
    }

    // Botón de Fix Online (solo si existe)
    if (game.fixOnlineUrl) {
        html += `
            <a href="${game.fixOnlineUrl}" target="_blank" class="button">
                Fix Online
            </a>
        `;
    }

    // Botón de Mods (solo si existe)
    if (game.modsUrl) {
        html += `
            <a href="${game.modsUrl}" target="_blank" class="button">
                Mods
            </a>
        `;
    }

    // Botón de volver (siempre presente)
    html += `
        <a href="../index.html" class="btn btn-secondary">
            Volver
        </a>
    `;

    return html;
}


// =============================================================================
// FUNCIÓN: generarTags
// =============================================================================
// Genera los tags con clases de color apropiadas
//
function generarTags(tags) {
    if (!tags || tags.length === 0) return '';

    return tags.map(tag => {
        // Determinar la clase de color según el tipo de tag
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


// =============================================================================
// FUNCIÓN: generarSpecs
// =============================================================================
// Genera el HTML de las especificaciones del juego
// Si el juego tiene specs personalizadas, las usa
// Si no, muestra valores por defecto
//
function generarSpecs(specs) {
    // Especificaciones por defecto (funciona para la mayoría de juegos)
    const defaultSpecs = {
        os: 'Windows 7 o superior',
        cpu: 'Intel Core i3 / AMD Ryzen 3',
        ram: '4GB RAM',
        gpu: 'Compatible con DirectX 11'
    };

    // Usar specs del juego o valores por defecto
    const finalSpecs = specs || defaultSpecs;

    return `
        <div class="spec-item">
            <h3>Sistema</h3>
            <p>${finalSpecs.os || defaultSpecs.os}</p>
        </div>
        <div class="spec-item">
            <h3>Procesador</h3>
            <p>${finalSpecs.cpu || defaultSpecs.cpu}</p>
        </div>
        <div class="spec-item">
            <h3>Memoria</h3>
            <p>${finalSpecs.ram || defaultSpecs.ram}</p>
        </div>
        <div class="spec-item">
            <h3>Gráficos</h3>
            <p>${finalSpecs.gpu || defaultSpecs.gpu}</p>
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
            <h1 style="color: var(--accent-red); margin-bottom: 1rem; font-size: 3rem;">⚠️</h1>
            <h2 style="color: var(--accent-red); margin-bottom: 1rem;">Error</h2>
            <p style="color: #888; margin-bottom: 2rem;">${mensaje}</p>
            <a href="../index.html" class="btn btn-primary">Volver al Hub</a>
        </div>
    `;
}


// =============================================================================
// NOTAS PARA AGREGAR NUEVAS FUNCIONALIDADES:
// =============================================================================
//
// 1. Para agregar SPECS PERSONALIZADAS a un juego, agregá esto en games.js:
//
//    {
//        id: "mi-juego",
//        title: "Mi Juego",
//        ...
//        specs: {
//            os: "Windows 10",
//            cpu: "Intel i7 / AMD Ryzen 7",
//            ram: "16GB RAM",
//            gpu: "GTX 1080 / RTX 3060"
//        }
//    }
//
// 2. Para agregar NUEVOS BOTONES:
//    - Agregá el campo en games.js (ej: "trailerUrl")
//    - Modificá la función generarBotones() para incluirlo
//
// 3. Para agregar NUEVAS SECCIONES (ej: galería de imágenes):
//    - Agregá el campo en games.js (ej: "gallery": ["url1", "url2"])
//    - Creá una función generarGaleria() similar a las existentes
//    - Llamala desde renderizarPagina() y agregá el HTML
//
// =============================================================================
