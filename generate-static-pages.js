#!/usr/bin/env node

/**
 * Genera archivos HTML estáticos para cada juego con meta tags pre-renderizados
 * Esto permite que los crawlers de redes sociales vean los meta tags correctos
 * 
 * Uso: node generate-static-pages.js
 */

const fs = require('fs');
const path = require('path');

// Leer games.js
const gamesJsPath = path.join(__dirname, 'assets/js/games.js');
const gamesJsContent = fs.readFileSync(gamesJsPath, 'utf-8');

// Extraer array de juegos
const match = gamesJsContent.match(/window\.gamesData\s*=\s*(\[[\s\S]*?\]);/);
if (!match) {
    console.error('❌ No se pudo encontrar gamesData en games.js');
    process.exit(1);
}

const gamesData = eval(match[1]);

function escapeHtml(text) {
    if (!text) return '';
    return text
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
}

function generateGamePage(game) {
    const baseUrl = 'https://hugoaleolguin.github.io/jueguitos-piola';
    const gameUrl = `${baseUrl}/?id=${game.id}`;
    const title = escapeHtml(`${game.title} | Jueguitos Piola`);
    const description = escapeHtml(game.fullDescription || game.description || 'Descargar juego gratis');
    const image = game.image || `${baseUrl}/favicon.png`;
    const tags = game.tags ? game.tags.join(', ') : '';

    return `<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${title}</title>
    
    <!-- SEO -->
    <meta name="description" content="${description}">
    <meta name="keywords" content="${escapeHtml(game.title)}, ${tags}, juegos gratis">
    <meta name="theme-color" content="#020202">
    
    <!-- Open Graph -->
    <meta property="og:type" content="website">
    <meta property="og:url" content="${gameUrl}">
    <meta property="og:title" content="${title}">
    <meta property="og:description" content="${description}">
    <meta property="og:image" content="${image}">
    <meta property="og:image:width" content="1200">
    <meta property="og:image:height" content="630">
    <meta property="og:site_name" content="Jueguitos Piola">
    <meta property="og:locale" content="es_AR">
    
    <!-- Twitter -->
    <meta name="twitter:card" content="summary_large_image">
    <meta name="twitter:title" content="${title}">
    <meta name="twitter:description" content="${description}">
    <meta name="twitter:image" content="${image}">
    <meta name="twitter:site" content="@HugoAleOlguin">
    
    <!-- Canonical -->
    <link rel="canonical" href="${gameUrl}">
    
    <!-- Redirect -->
    <meta http-equiv="refresh" content="0; url=/?id=${game.id}">
    <script>window.location.href = '/?id=${game.id}';</script>
</head>
<body>
    <p>Redirigiendo...</p>
</body>
</html>`;
}

// Crear directorio juegos/ si no existe
const gamesDir = path.join(__dirname, 'juegos');
if (!fs.existsSync(gamesDir)) {
    fs.mkdirSync(gamesDir, { recursive: true });
}

// Generar archivo por cada juego
let count = 0;
gamesData.forEach(game => {
    try {
        const html = generateGamePage(game);
        const filePath = path.join(gamesDir, `${game.id}.html`);
        fs.writeFileSync(filePath, html, 'utf-8');
        console.log(`✅ ${game.id}.html`);
        count++;
    } catch (err) {
        console.error(`❌ Error en ${game.id}: ${err.message}`);
    }
});

console.log(`\n✅ Se generaron ${count} páginas`);
console.log(`📂 Ubicación: /juegos/[game-id].html`);
console.log(`\n📝 URLs de ejemplo:`);
console.log(`   https://hugoaleolguin.github.io/jueguitos-piola/juegos/lethal-company.html`);
console.log(`   https://hugoaleolguin.github.io/jueguitos-piola/juegos/risk-of-rain-2.html`);
