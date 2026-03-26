/**
 * SOCIAL MEDIA META TAG HELPER
 * Actualiza dinámicamente Open Graph tags para WhatsApp, Facebook, Twitter, Discord, Google
 * Se ejecuta PRIMERO, antes que otros scripts
 */

(function() {
    'use strict';

    const gamesData = window.gamesData || [];

    function getGameIdFromUrl() {
        const params = new URLSearchParams(window.location.search);
        return params.get('id');
    }

    function updateMetaTag(property, content, isName = false) {
        let tag = document.querySelector(`meta[${isName ? 'name' : 'property'}="${property}"]`);
        if (!tag) {
            tag = document.createElement('meta');
            tag.setAttribute(isName ? 'name' : 'property', property);
            document.head.appendChild(tag);
        }
        tag.content = content;
    }

    function sanitize(text) {
        if (!text) return '';
        return text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#039;');
    }

    function updateGameMetaTags(game) {
        if (!game) return;

        const title = sanitize(`${game.title} | Jueguitos Piola`);
        const description = sanitize(game.fullDescription || game.description || 'Descargar juego gratis');
        const image = game.image || 'https://hugoaleolguin.github.io/jueguitos-piola/favicon.png';

        // Actualizar título
        document.title = title;

        // Open Graph
        updateMetaTag('og:title', title);
        updateMetaTag('og:description', description);
        updateMetaTag('og:image', image);

        // Twitter
        updateMetaTag('twitter:title', title);
        updateMetaTag('twitter:description', description);
        updateMetaTag('twitter:image', image);

        // Description
        updateMetaTag('description', description, true);

        console.log('Meta tags actualizados:', { title, image, description });
    }

    function init() {
        const gameId = getGameIdFromUrl();
        if (gameId && gamesData.length > 0) {
            const game = gamesData.find(g => g.id === gameId);
            if (game) {
                updateGameMetaTags(game);
            }
        }
    }

    // Ejecutar cuando games.js está listo
    if (window.gamesData) {
        init();
    } else {
        window.addEventListener('gamesDataReady', init);
    }

    // Funciones de debug en DevTools
    window.debugSocialMeta = function() {
        console.group('🌐 Social Media Meta Tags');
        const gameMeta = {};
        document.querySelectorAll('meta[property^="og:"], meta[name="description"], meta[name="twitter:card"]').forEach(tag => {
            const key = tag.getAttribute('property') || tag.getAttribute('name');
            gameMeta[key] = tag.content;
        });
        console.table(gameMeta);
        console.groupEnd();
    };

    window.updateSocialMeta = updateGameMetaTags;
})();
