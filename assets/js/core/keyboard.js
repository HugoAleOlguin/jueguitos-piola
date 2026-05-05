// ============================================================================
// KEYBOARD.JS — Navegación Full por Teclado + HUD de Atajos (Alt)
// ============================================================================

const KeyboardManager = (() => {
    // --- Estado interno ---
    let hudVisible = false;
    let hudEl = null;
    let scrollAnimId = null;

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
        // Alt: mostrar HUD, bloquear el comportamiento nativo del navegador
        if (e.key === 'Alt') {
            e.preventDefault();
            _showHud();
            return;
        }

        // Si el foco está en un campo de texto, solo permitimos Escape
        const isTyping = e.target.tagName === 'INPUT'
            || e.target.tagName === 'TEXTAREA'
            || e.target.isContentEditable;

        if (isTyping) {
            if (e.key === 'Escape') e.target.blur();
            return;
        }

        // Escape global
        if (e.key === 'Escape') {
            _handleEscape();
            return;
        }

        // Slash: enfocar buscador
        if (e.key === '/') {
            const input = document.getElementById('searchInput');
            if (input) {
                e.preventDefault();
                input.focus();
            }
            return;
        }

        // Atajos de letra (solo cuando no hay modal abierto)
        const isModalOpen = _getTopModal() !== null;
        if (!isModalOpen && e.key.length === 1) {
            if (_handleShortcut(e)) return;
        }

        // Rutas contextuales con flechas y Enter
        const gameView = document.getElementById('game-view');
        const isDetailActive = gameView && gameView.style.display !== 'none';

        if (isModalOpen) {
            _handleModalNavigation(e);
        } else if (isDetailActive) {
            _handleDetailNavigation(e);
        } else {
            _handleGridNavigation(e);
        }
    };

    const _onKeyUp = (e) => {
        // Bloquear también el keyup de Alt para evitar que el navegador
        // active la barra de menú al soltar la tecla
        if (e.key === 'Alt') {
            e.preventDefault();
            _hideHud();
        }
    };

    // -------------------------------------------------------------------------
    // ATAJOS DE LETRA — Acciones rápidas globales
    // Devuelve true si consumió el evento
    // -------------------------------------------------------------------------
    const _handleShortcut = (e) => {
        switch (e.key.toLowerCase()) {
            // C → Chat
            case 'c': {
                e.preventDefault();
                const bubble = document.getElementById('piolaChatBubble');
                if (bubble) bubble.click();
                return true;
            }
            // L → Logros
            case 'l': {
                e.preventDefault();
                const fabLogros = document.getElementById('btnAchievementsFab');
                if (fabLogros) fabLogros.click();
                return true;
            }
            // G → Minijuegos
            case 'g': {
                e.preventDefault();
                const btnMini = document.getElementById('btnMiniGames');
                if (btnMini) btnMini.click();
                return true;
            }
            // R → Juego Aleatorio (Ruleta)
            case 'r': {
                e.preventDefault();
                const btnRandom = document.getElementById('btnRandom');
                if (btnRandom) btnRandom.click();
                return true;
            }
            // S → Configuración (Settings)
            case 's': {
                e.preventDefault();
                const btnSettings = document.getElementById('settingsToggle');
                if (btnSettings) btnSettings.click();
                return true;
            }
            // H → Home (volver al inicio)
            case 'h': {
                e.preventDefault();
                const gameView = document.getElementById('game-view');
                if (gameView && gameView.style.display !== 'none') {
                    const backBtn = gameView.querySelector('.btn-back-spa');
                    if (backBtn) backBtn.click();
                }
                return true;
            }
            // F → Free Games / Regalos
            case 'f': {
                e.preventDefault();
                const btnFree = document.querySelector('[data-freegames], #btnFreeGames');
                if (btnFree) btnFree.click();
                return true;
            }
        }
        return false;
    };

    // -------------------------------------------------------------------------
    // ESCAPE GLOBAL — Cierra capa superior en orden de prioridad
    // -------------------------------------------------------------------------
    const _handleEscape = () => {
        // 1. Chat abierto
        const chatPanel = document.getElementById('piolaChatPanel');
        if (chatPanel && chatPanel.classList.contains('open')) {
            const closeChat = document.getElementById('btnCloseChat');
            if (closeChat) { closeChat.click(); return; }
        }

        // 2. Setup de chat abierto
        const chatSetup = document.getElementById('piolaChatSetup');
        if (chatSetup && chatSetup.classList.contains('active')) {
            chatSetup.classList.remove('active');
            return;
        }

        // 3. Modales con botón de cierre
        const modal = _getTopModal();
        if (modal) {
            const closeBtn = modal.querySelector(
                '.btn-close, [id*="CloseBtn"], [id*="Close"], .btn-close-vs, .btn-close-ach'
            );
            if (closeBtn) { closeBtn.click(); return; }
        }

        // 4. Vista de detalle de juego → volver al home
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
        const candidates = [
            document.getElementById('settingsModal'),
            document.getElementById('versusModal'),
            document.getElementById('achievementsModal'),
            document.getElementById('miniGamesModal'),
            document.getElementById('gamedleModal'),
            document.getElementById('rouletteModal'),
        ].filter(Boolean);

        for (let i = candidates.length - 1; i >= 0; i--) {
            const el = candidates[i];
            // Un modal está abierto si no tiene display:none explícito
            // y tiene visibilidad en el viewport
            const isHiddenByStyle = el.style.display === 'none';
            if (!isHiddenByStyle && el.offsetParent !== null) return el;
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

        if (e.key === 'Enter') {
            if (currentIndex !== -1) cards[currentIndex].click();
            return;
        }

        // Primer foco: ir a la primera tarjeta
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
        _smoothCenter(cards[index]);
    };

    // -------------------------------------------------------------------------
    // SMOOTH SCROLL CENTRADO — Easing propio, sin depender del browser
    // -------------------------------------------------------------------------

    // Desacelera suave al final — se siente natural
    const _easeOutQuart = (t) => 1 - Math.pow(1 - t, 4);

    const _smoothCenter = (el, duration = 360) => {
        // Cancelar animación previa para evitar acumulación
        if (scrollAnimId) {
            cancelAnimationFrame(scrollAnimId);
            scrollAnimId = null;
        }

        const rect = el.getBoundingClientRect();
        const elementCenterY = rect.top + rect.height / 2;
        const viewportCenter = window.innerHeight / 2;
        const targetScrollY = Math.max(0, window.scrollY + elementCenterY - viewportCenter);

        // Si ya está casi centrado no animar (evita micro-jitter)
        if (Math.abs(targetScrollY - window.scrollY) < 8) return;

        const startScrollY = window.scrollY;
        const delta = targetScrollY - startScrollY;
        let startTime = null;

        const step = (timestamp) => {
            if (!startTime) startTime = timestamp;
            const elapsed = timestamp - startTime;
            const progress = Math.min(elapsed / duration, 1);
            const eased = _easeOutQuart(progress);

            window.scrollTo(0, startScrollY + delta * eased);

            if (progress < 1) {
                scrollAnimId = requestAnimationFrame(step);
            } else {
                scrollAnimId = null;
            }
        };

        scrollAnimId = requestAnimationFrame(step);
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
        if (currentIndex === -1) { focusables[0].focus(); return; }

        const isBack = e.key === 'ArrowLeft' || e.key === 'ArrowUp';
        const nextIndex = isBack
            ? Math.max(0, currentIndex - 1)
            : Math.min(focusables.length - 1, currentIndex + 1);

        if (nextIndex !== currentIndex) focusables[nextIndex].focus();
    };

    // -------------------------------------------------------------------------
    // NAVEGACIÓN EN MODALES
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
        if (currentIndex === -1) { focusables[0].focus(); return; }

        const isBack = e.key === 'ArrowLeft' || e.key === 'ArrowUp';
        const nextIndex = isBack
            ? Math.max(0, currentIndex - 1)
            : Math.min(focusables.length - 1, currentIndex + 1);

        if (nextIndex !== currentIndex) focusables[nextIndex].focus();
    };

    // Helper: elementos focuseables visibles dentro de un contenedor
    const _getFocusables = (container) => {
        return Array.from(container.querySelectorAll(
            'button:not([disabled]), a[href], input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])'
        )).filter(el => el.offsetWidth > 0 && el.offsetHeight > 0);
    };

    // -------------------------------------------------------------------------
    // HUD DE ATAJOS (Overlay al mantener Alt)
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
                title: 'Navegar',
                keys: [
                    { key: '↑ ↓ ← →', label: 'Moverse entre juegos' },
                    { key: 'Enter', label: 'Abrir juego' },
                    { key: '/', label: 'Buscar' },
                ],
            },
            {
                title: 'Juego Abierto',
                keys: [
                    { key: '← →', label: 'Moverse entre botones' },
                    { key: 'Esc', label: 'Volver' },
                    { key: 'H', label: 'Ir al inicio' },
                ],
            },
            {
                title: 'Acciones',
                keys: [
                    { key: 'C', label: 'Chat' },
                    { key: 'L', label: 'Logros' },
                    { key: 'G', label: 'Minijuegos' },
                    { key: 'R', label: 'Aleatorio' },
                    { key: 'S', label: 'Configuración' },
                    { key: 'F', label: 'Regalos' },
                ],
            },
            {
                title: 'Global',
                keys: [
                    { key: 'Esc', label: 'Cerrar modal/chat' },
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
