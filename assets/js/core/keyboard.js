// ============================================================================
// KEYBOARD.JS — Navegación Full por Teclado + HUD de Atajos (Alt)
// ============================================================================

const KeyboardManager = (() => {
    let hudVisible = false;
    let hudEl = null;
    let scrollAnimId = null;
    let activeBadges = [];

    // Mapeo de atajos → elemento destino en el DOM
    const SHORTCUT_TARGETS = [
        { key: 'B', selector: '#searchInput',      label: 'Buscar' },
        { key: 'J', selector: '#btnMiniGames',     label: 'Minijuegos' },
        { key: 'G', selector: '#btnFreeGames',     label: 'Juegos Gratis' },
        { key: 'R', selector: '#btnRandom',        label: 'Ruleta' },
        { key: 'N', selector: '#settingsToggle',   label: 'Config' },
        { key: 'C', selector: '#piolaChatBubble',  label: 'Chat' },
        { key: 'L', selector: '#btnAchievementsFab', label: 'Logros' },
    ];

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
        // Alt: mostrar HUD + badges. Bloquear menú nativo del browser
        if (e.key === 'Alt') {
            e.preventDefault();
            _showHud();
            _showBadges();
            return;
        }

        // Si el foco está en un campo de texto
        const isTyping = e.target.tagName === 'INPUT'
            || e.target.tagName === 'TEXTAREA'
            || e.target.isContentEditable;

        if (isTyping) {
            // B o Esc desenfoca el buscador
            if (e.key === 'Escape' || e.key === 'b' || e.key === 'B') {
                e.target.blur();
            }
            return;
        }

        // Escape global: cierra en cascada
        if (e.key === 'Escape') {
            _handleEscape();
            return;
        }

        // H o Escape-desde-juego: siempre volver al index
        if (e.key === 'h' || e.key === 'H') {
            e.preventDefault();
            _goHome();
            return;
        }

        // Slash es el alias de B para compatibilidad con convenciones web
        if (e.key === '/') {
            e.preventDefault();
            _focusSearch();
            return;
        }

        // Atajos de letra (solo cuando no hay modal ni input activo)
        const isModalOpen = _getTopModal() !== null;
        if (!isModalOpen && e.key.length === 1) {
            if (_handleShortcut(e)) return;
        }

        // Navegación contextual con flechas
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
        // preventDefault en keyup también → evita que el browser active la barra de menú
        if (e.key === 'Alt') {
            e.preventDefault();
            _hideHud();
            _clearBadges();
        }
    };

    // -------------------------------------------------------------------------
    // ATAJOS DE LETRA
    // -------------------------------------------------------------------------
    const _handleShortcut = (e) => {
        switch (e.key.toLowerCase()) {
            case 'b':
                e.preventDefault();
                _focusSearch();
                return true;
            case 'c': {
                e.preventDefault();
                const bubble = document.getElementById('piolaChatBubble');
                if (bubble) bubble.click();
                return true;
            }
            case 'l': {
                e.preventDefault();
                const fab = document.getElementById('btnAchievementsFab');
                if (fab) fab.click();
                return true;
            }
            case 'g': {
                e.preventDefault();
                // Free Games — el botón se genera dinámicamente por free-games/main.js
                const btnFree = document.getElementById('btnFreeGames');
                if (btnFree) btnFree.click();
                return true;
            }
            case 'j': {
                e.preventDefault();
                const btnMini = document.getElementById('btnMiniGames');
                if (btnMini) btnMini.click();
                return true;
            }
            case 'r': {
                e.preventDefault();
                const btnRandom = document.getElementById('btnRandom');
                if (btnRandom) btnRandom.click();
                return true;
            }
            case 'n': {
                e.preventDefault();
                const btnSettings = document.getElementById('settingsToggle');
                if (btnSettings) btnSettings.click();
                return true;
            }
        }
        return false;
    };

    const _focusSearch = () => {
        const input = document.getElementById('searchInput');
        if (input) {
            input.focus();
            input.select();
        }
    };

    // -------------------------------------------------------------------------
    // ESCAPE — Cierra en cascada: chat → setup → modal → detalle/home
    // -------------------------------------------------------------------------
    const _handleEscape = () => {
        // 1. Chat abierto
        const chatPanel = document.getElementById('piolaChatPanel');
        if (chatPanel && chatPanel.classList.contains('open')) {
            document.getElementById('btnCloseChat')?.click();
            return;
        }

        // 2. Setup del chat
        const chatSetup = document.getElementById('piolaChatSetup');
        if (chatSetup && chatSetup.classList.contains('active')) {
            chatSetup.classList.remove('active');
            return;
        }

        // 3. Cualquier modal abierto (settings, logros, versus, minijuegos, etc.)
        const modal = _getTopModal();
        if (modal) {
            // Intentar botón de cierre explícito dentro del modal
            const closeBtn = modal.querySelector(
                '.btn-close, .btn-close-vs, .btn-close-ach, [id*="CloseBtn"], #btnCancelSettings'
            );
            if (closeBtn) {
                closeBtn.click();
                return;
            }
            // Fallback: forzar display none si no hay botón de cierre
            modal.style.display = 'none';
            return;
        }

        // 4. Vista de detalle → volver al home
        _goHome();
    };

    // Volver al home desde cualquier estado
    const _goHome = () => {
        const gameView = document.getElementById('game-view');
        if (gameView && gameView.style.display !== 'none') {
            const backBtn = gameView.querySelector('.btn-back-spa');
            if (backBtn) { backBtn.click(); return; }
        }
        // Si está en otra ruta, navegar limpio
        if (window.Router) Router.navigateTo(window.location.pathname);
    };

    // -------------------------------------------------------------------------
    // HELPER: Detectar el modal visible más reciente
    // Usamos getComputedStyle porque position:fixed tiene offsetParent=null siempre
    // -------------------------------------------------------------------------
    const _getTopModal = () => {
        const ids = [
            'settingsModal',
            'rouletteModal',
            'versusModal',
            'achievementsModal',
            'miniGamesModal',
            'gamedleModal',
        ];

        for (let i = ids.length - 1; i >= 0; i--) {
            const el = document.getElementById(ids[i]);
            if (!el) continue;
            const display = window.getComputedStyle(el).display;
            if (display !== 'none') return el;
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

        if (currentIndex === -1) { _focusCard(cards, 0); return; }

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
    // SMOOTH SCROLL CENTRADO (easeOutQuart)
    // -------------------------------------------------------------------------
    const _easeOutQuart = (t) => 1 - Math.pow(1 - t, 4);

    const _smoothCenter = (el, duration = 360) => {
        if (scrollAnimId) { cancelAnimationFrame(scrollAnimId); scrollAnimId = null; }

        const rect = el.getBoundingClientRect();
        const targetScrollY = Math.max(0, window.scrollY + (rect.top + rect.height / 2) - window.innerHeight / 2);

        if (Math.abs(targetScrollY - window.scrollY) < 8) return;

        const startScrollY = window.scrollY;
        const delta = targetScrollY - startScrollY;
        let startTime = null;

        const step = (ts) => {
            if (!startTime) startTime = ts;
            const progress = Math.min((ts - startTime) / duration, 1);
            window.scrollTo(0, startScrollY + delta * _easeOutQuart(progress));
            scrollAnimId = progress < 1 ? requestAnimationFrame(step) : null;
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
        const next = isBack ? Math.max(0, currentIndex - 1) : Math.min(focusables.length - 1, currentIndex + 1);
        if (next !== currentIndex) focusables[next].focus();
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
        const next = isBack ? Math.max(0, currentIndex - 1) : Math.min(focusables.length - 1, currentIndex + 1);
        if (next !== currentIndex) focusables[next].focus();
    };

    const _getFocusables = (container) => Array.from(container.querySelectorAll(
        'button:not([disabled]), a[href], input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])'
    )).filter(el => el.offsetWidth > 0 && el.offsetHeight > 0);

    // -------------------------------------------------------------------------
    // BADGES FLOTANTES — Aparecen sobre cada elemento al mantener Alt
    // -------------------------------------------------------------------------
    const _showBadges = () => {
        _clearBadges();

        SHORTCUT_TARGETS.forEach(({ key, selector }) => {
            const el = document.querySelector(selector);
            if (!el) return;

            // Ignorar elementos ocultos
            const display = window.getComputedStyle(el).display;
            if (display === 'none') return;

            const rect = el.getBoundingClientRect();
            if (rect.width === 0) return;

            const badge = document.createElement('div');
            badge.className = 'kbd-floating-badge';
            badge.textContent = key;

            // Posicionar en la esquina superior derecha del elemento
            badge.style.position = 'fixed';
            badge.style.left = (rect.right - 14) + 'px';
            badge.style.top  = (rect.top  - 10) + 'px';

            document.body.appendChild(badge);
            activeBadges.push(badge);

            // Trigger de animación en el siguiente frame
            requestAnimationFrame(() => badge.classList.add('kbd-floating-badge--visible'));
        });
    };

    const _clearBadges = () => {
        activeBadges.forEach(b => b.remove());
        activeBadges = [];
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
                title: 'Navegar Grilla',
                keys: [
                    { key: '↑↓←→', label: 'Moverse' },
                    { key: 'Enter', label: 'Abrir juego' },
                ],
            },
            {
                title: 'Abrir / Cerrar',
                keys: [
                    { key: 'C', label: 'Chat' },
                    { key: 'L', label: 'Logros' },
                    { key: 'J', label: 'Minijuegos' },
                    { key: 'G', label: 'Juegos Gratis' },
                    { key: 'R', label: 'Ruleta' },
                    { key: 'N', label: 'Configuración' },
                ],
            },
            {
                title: 'Navegación',
                keys: [
                    { key: 'B', label: 'Buscar' },
                    { key: 'H', label: 'Inicio' },
                    { key: 'Esc', label: 'Cerrar / Volver' },
                    { key: 'Alt', label: 'Mostrar ayuda' },
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

    const _showHud = () => { if (!hudVisible && hudEl) { hudVisible = true; hudEl.classList.add('hud--visible'); } };
    const _hideHud = () => { if (hudVisible && hudEl)  { hudVisible = false; hudEl.classList.remove('hud--visible'); } };

    return { init };
})();

document.addEventListener('DOMContentLoaded', () => { KeyboardManager.init(); });
