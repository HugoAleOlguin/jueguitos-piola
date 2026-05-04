// ============================================================================
// KEYBOARD.JS — Navegación Full por Teclado
// Maneja navegación en grilla, vista de detalle, modales, y HUD de atajos (Alt)
// ============================================================================

const KeyboardManager = (() => {
    // --- Estado interno ---
    let hudVisible = false;
    let hudEl = null;

    // -------------------------------------------------------------------------
    // INIT
    // -------------------------------------------------------------------------
    const init = () => {
        _createHud();
        window.addEventListener('keydown', _onKeyDown);
        window.addEventListener('keyup', _onKeyUp);
    };

    // -------------------------------------------------------------------------
    // DISPATCHER GLOBAL
    // -------------------------------------------------------------------------
    const _onKeyDown = (e) => {
        // Mostrar HUD al mantener Alt (sin bloquear otros combos del sistema)
        if (e.key === 'Alt') {
            e.preventDefault(); // Evitar que Alt abra menú del navegador
            _showHud();
            return;
        }

        // Ignorar si el foco está en un input/textarea
        // Sólo Escape funciona para salir del input
        const isTyping = e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA';
        if (isTyping) {
            if (e.key === 'Escape') e.target.blur();
            return;
        }

        // Escape global: cierra modales o vuelve al home si está en detalle
        if (e.key === 'Escape') {
            _handleEscape();
            return;
        }

        // Slash / para enfocar búsqueda
        if (e.key === '/') {
            const input = document.getElementById('searchInput');
            if (input) {
                e.preventDefault();
                input.focus();
            }
            return;
        }

        // Determinar contexto actual
        const gameView = document.getElementById('game-view');
        const isDetailActive = gameView && gameView.style.display !== 'none';
        const isModalOpen = _getTopModal() !== null;

        if (isModalOpen) {
            _handleModalNavigation(e);
        } else if (isDetailActive) {
            _handleDetailNavigation(e);
        } else {
            _handleGridNavigation(e);
        }
    };

    const _onKeyUp = (e) => {
        if (e.key === 'Alt') {
            _hideHud();
        }
    };

    // -------------------------------------------------------------------------
    // ESCAPE GLOBAL
    // -------------------------------------------------------------------------
    const _handleEscape = () => {
        // 1. Primero: cerrar modal si hay alguno abierto
        const modal = _getTopModal();
        if (modal) {
            const closeBtn = modal.querySelector('.btn-close, [id*="CloseBtn"], [id*="Close"], .btn-close-vs, .btn-close-ach');
            if (closeBtn) {
                closeBtn.click();
                return;
            }
        }

        // 2. Segundo: si estamos en vista de detalle, volver al home
        const gameView = document.getElementById('game-view');
        if (gameView && gameView.style.display !== 'none') {
            const backBtn = gameView.querySelector('.btn-back-spa');
            if (backBtn) backBtn.click();
        }
    };

    // -------------------------------------------------------------------------
    // HELPER: Obtener el modal visible más reciente
    // -------------------------------------------------------------------------
    const _getTopModal = () => {
        // Buscamos modales visibles (no tienen display:none como estilo inline)
        const candidates = [
            document.getElementById('settingsModal'),
            document.getElementById('versusModal'),
            document.getElementById('achievementsModal'),
            document.getElementById('miniGamesModal'),
            document.getElementById('gamedleModal'),
            document.getElementById('rouletteModal'),
        ];

        for (let i = candidates.length - 1; i >= 0; i--) {
            const el = candidates[i];
            if (el && el.style.display !== 'none' && el.style.display !== '') return el;
            // También verificar si tiene clase de visibilidad activa
            if (el && !el.style.display && el.offsetParent !== null) return el;
        }
        return null;
    };

    // -------------------------------------------------------------------------
    // NAVEGACIÓN EN GRILLA
    // -------------------------------------------------------------------------
    const _handleGridNavigation = (e) => {
        const navKeys = ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Enter'];
        if (!navKeys.includes(e.key)) return;
        e.preventDefault();

        const cards = Array.from(document.querySelectorAll('.game-card'));
        if (cards.length === 0) return;

        let currentIndex = cards.indexOf(document.activeElement);

        // Enter: abrir la tarjeta enfocada
        if (e.key === 'Enter') {
            if (currentIndex !== -1) cards[currentIndex].click();
            return;
        }

        // Si ninguna tarjeta tiene foco, enfocamos la primera
        if (currentIndex === -1) {
            _focusCard(cards, 0);
            return;
        }

        const columns = _calcColumns(cards);
        let nextIndex = currentIndex;

        switch (e.key) {
            case 'ArrowLeft':  nextIndex = Math.max(0, currentIndex - 1); break;
            case 'ArrowRight': nextIndex = Math.min(cards.length - 1, currentIndex + 1); break;
            case 'ArrowUp':    nextIndex = Math.max(0, currentIndex - columns); break;
            case 'ArrowDown':  nextIndex = Math.min(cards.length - 1, currentIndex + columns); break;
        }

        if (nextIndex !== currentIndex) _focusCard(cards, nextIndex);
    };

    // Calcula cuántas columnas tiene la grilla midiendo el offsetTop
    const _calcColumns = (cards) => {
        if (cards.length <= 1) return 1;
        const firstTop = cards[0].offsetTop;
        for (let i = 1; i < cards.length; i++) {
            if (cards[i].offsetTop > firstTop) return i;
        }
        return cards.length;
    };

    const _focusCard = (cards, index) => {
        cards[index].focus();
        cards[index].scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    };

    // -------------------------------------------------------------------------
    // NAVEGACIÓN EN DETALLE DE JUEGO
    // -------------------------------------------------------------------------
    const _handleDetailNavigation = (e) => {
        const navKeys = ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'];
        if (!navKeys.includes(e.key)) return;
        e.preventDefault();

        const gameView = document.getElementById('game-view');
        const focusables = _getFocusables(gameView);
        if (focusables.length === 0) return;

        let currentIndex = focusables.indexOf(document.activeElement);

        if (currentIndex === -1) {
            focusables[0].focus();
            return;
        }

        const isBack = e.key === 'ArrowLeft' || e.key === 'ArrowUp';
        const nextIndex = isBack
            ? Math.max(0, currentIndex - 1)
            : Math.min(focusables.length - 1, currentIndex + 1);

        if (nextIndex !== currentIndex) focusables[nextIndex].focus();
    };

    // -------------------------------------------------------------------------
    // NAVEGACIÓN DENTRO DE MODALES
    // -------------------------------------------------------------------------
    const _handleModalNavigation = (e) => {
        const navKeys = ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'];
        if (!navKeys.includes(e.key)) return;
        e.preventDefault();

        const modal = _getTopModal();
        if (!modal) return;

        const focusables = _getFocusables(modal);
        if (focusables.length === 0) return;

        let currentIndex = focusables.indexOf(document.activeElement);

        if (currentIndex === -1) {
            focusables[0].focus();
            return;
        }

        const isBack = e.key === 'ArrowLeft' || e.key === 'ArrowUp';
        const nextIndex = isBack
            ? Math.max(0, currentIndex - 1)
            : Math.min(focusables.length - 1, currentIndex + 1);

        if (nextIndex !== currentIndex) focusables[nextIndex].focus();
    };

    // Helper: obtener elementos focuseables visibles de un contenedor
    const _getFocusables = (container) => {
        return Array.from(container.querySelectorAll(
            'button:not([disabled]), a[href], input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])'
        )).filter(el => el.offsetWidth > 0 && el.offsetHeight > 0);
    };

    // -------------------------------------------------------------------------
    // HUD DE ATAJOS — Overlay al mantener Alt
    // -------------------------------------------------------------------------
    const _createHud = () => {
        const hud = document.createElement('div');
        hud.id = 'keyboard-hud';
        hud.setAttribute('aria-hidden', 'true');
        hud.innerHTML = _buildHudHTML();
        document.body.appendChild(hud);
        hudEl = hud;
    };

    const _buildHudHTML = () => {
        const groups = [
            {
                title: 'Navegar Grilla',
                keys: [
                    { key: '↑ ↓ ← →', label: 'Moverse entre juegos' },
                    { key: 'Enter', label: 'Abrir juego seleccionado' },
                    { key: '/', label: 'Buscar juego' },
                ],
            },
            {
                title: 'Vista de Juego',
                keys: [
                    { key: 'Esc', label: 'Volver a la grilla' },
                    { key: '← →', label: 'Moverse entre botones' },
                    { key: 'Enter', label: 'Activar botón' },
                ],
            },
            {
                title: 'Global',
                keys: [
                    { key: 'Esc', label: 'Cerrar modal activo' },
                    { key: 'Alt', label: 'Mostrar esta ayuda' },
                ],
            },
        ];

        const groupsHtml = groups.map(group => `
            <div class="hud-group">
                <span class="hud-group-title">${group.title}</span>
                ${group.keys.map(k => `
                    <div class="hud-row">
                        <kbd class="hud-key">${k.key}</kbd>
                        <span class="hud-label">${k.label}</span>
                    </div>
                `).join('')}
            </div>
        `).join('');

        return `
            <div class="hud-inner">
                <div class="hud-header">
                    <span class="hud-title">Atajos de Teclado</span>
                    <kbd class="hud-key hud-key--alt">Alt</kbd>
                </div>
                <div class="hud-groups">${groupsHtml}</div>
            </div>
        `;
    };

    const _showHud = () => {
        if (hudVisible || !hudEl) return;
        hudVisible = true;
        hudEl.classList.add('hud--visible');
    };

    const _hideHud = () => {
        if (!hudVisible || !hudEl) return;
        hudVisible = false;
        hudEl.classList.remove('hud--visible');
    };

    // -------------------------------------------------------------------------
    // API PÚBLICA
    // -------------------------------------------------------------------------
    return { init };
})();

document.addEventListener('DOMContentLoaded', () => {
    KeyboardManager.init();
});
