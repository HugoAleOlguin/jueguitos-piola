const CursorManager = (() => {
    let trailCleanup = null;

    const set = async (type, imageStore) => {
        document.body.classList.remove('cursor-crosshair', 'cursor-troll', 'static-cursor');
        document.body.style.cursor = '';
        document.documentElement.style.cursor = '';

        if (!type || type === 'default') return;

        document.body.classList.add('static-cursor');

        if (type === 'custom') {
            try {
                const blob = await imageStore.getBlob('custom_cursor');
                if (blob) {
                    const url = URL.createObjectURL(blob);
                    document.body.style.cursor = `url('${url}'), auto`;
                }
            } catch (e) {
                console.error('Error loading custom cursor:', e);
            }
        } else if (type === 'troll') {
            document.body.style.cursor = "url('assets/css/features/null_.png'), auto";
        } else {
            document.body.classList.add(`cursor-${type}`);
        }
    };

    const setTrail = (enabled, themeColor) => {
        if (trailCleanup) {
            trailCleanup();
            trailCleanup = null;
        }

        if (!enabled) return;

        const color = themeColor || '#00f3ff';
        
        const dot = document.createElement('div');
        dot.id = 'cursor-follow-dot';
        dot.style.cssText = `
            position: fixed;
            top: 0; left: 0;
            width: 28px; height: 28px;
            border-radius: 50%;
            border: 2px solid ${color};
            background: transparent;
            pointer-events: none;
            z-index: 99999;
            opacity: 0.7;
            transform: translate(-50%, -50%);
            transition: width 0.2s ease, height 0.2s ease,
                        opacity 0.2s ease, background 0.2s ease,
                        border-color 0.3s ease;
            will-change: transform;
        `;
        document.body.appendChild(dot);

        const dotInner = document.createElement('div');
        dotInner.style.cssText = `
            position: fixed;
            top: 0; left: 0;
            width: 5px; height: 5px;
            border-radius: 50%;
            background: ${color};
            pointer-events: none;
            z-index: 99999;
            opacity: 0.9;
            transform: translate(-50%, -50%);
            will-change: transform;
        `;
        document.body.appendChild(dotInner);

        let targetX = -100, targetY = -100;
        let currentX = -100, currentY = -100;
        let animId;

        const HOVER_SELECTOR = '.game-card, .btn, .theme-toggle, .floating-fab, .minigame-card, .vs-mode-btn, a';

        const onMove = (e) => {
            targetX = e.clientX;
            targetY = e.clientY;

            dotInner.style.transform = `translate(${targetX}px, ${targetY}px) translate(-50%, -50%)`;

            const hovering = document.elementFromPoint(targetX, targetY)?.closest(HOVER_SELECTOR);
            if (hovering) {
                dot.style.width = '44px';
                dot.style.height = '44px';
                dot.style.opacity = '0.4';
                dot.style.background = `${color}22`;
            } else {
                dot.style.width = '28px';
                dot.style.height = '28px';
                dot.style.opacity = '0.7';
                dot.style.background = 'transparent';
            }
        };

        const animate = () => {
            currentX += (targetX - currentX) * 0.1;
            currentY += (targetY - currentY) * 0.1;
            dot.style.transform = `translate(${currentX}px, ${currentY}px) translate(-50%, -50%)`;
            animId = requestAnimationFrame(animate);
        };

        animId = requestAnimationFrame(animate);
        document.addEventListener('mousemove', onMove);

        trailCleanup = () => {
            cancelAnimationFrame(animId);
            document.removeEventListener('mousemove', onMove);
            dot.remove();
            dotInner.remove();
        };
    };

    const clear = () => {
        set('default');
        setTrail(false);
    };

    return { set, setTrail, clear };
})();
