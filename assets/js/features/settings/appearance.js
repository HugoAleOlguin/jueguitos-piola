const AppearanceManager = (() => {
    const apply = (blur, color, isLite) => {
        const blurVal = isLite ? '0' : (blur || '0');
        const colorVal = color || '#00f3ff';

        document.documentElement.style.setProperty('--glass-blur', `${blurVal}px`);
        document.documentElement.style.setProperty('--primary-color', colorVal);

        const elements = document.querySelectorAll('.game-card, .game-detail-container, header');
        elements.forEach(el => {
            el.style.backdropFilter = isLite ? 'none' : `blur(${blurVal}px)`;
        });
    };

    const updateColor = (color, btnElement = null) => {
        document.documentElement.style.setProperty('--primary-color', color);
        if (document.getElementById('settingColor')) document.getElementById('settingColor').value = color;

        document.querySelectorAll('.color-btn').forEach(b => b.classList.remove('active'));
        if (btnElement) btnElement.classList.add('active');

        if (typeof AchievementManager !== 'undefined') {
            AchievementManager.trackEvent({ type: 'COLOR_CHANGE' });
        }
    };

    return { apply, updateColor };
})();
