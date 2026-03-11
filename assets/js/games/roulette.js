const RouletteManager = (() => {
    const start = () => {
        const modal = document.getElementById('rouletteModal');
        const strip = document.getElementById('rouletteStrip');
        const title = document.getElementById('rouletteGameTitle');
        const rouletteWindow = document.querySelector('.roulette-window');

        if (!modal || !strip || !window.gamesData) return;

        const candidates = window.gamesData.filter(g => !g.hidden && !g.tags.some(t => t.toLowerCase() === 'utilidad'));
        if (candidates.length === 0) return alert('No hay juegos para sortear.');

        const winnerIndex = Math.floor(Math.random() * candidates.length);
        const winner = candidates[winnerIndex];

        modal.style.display = 'flex';
        void modal.offsetWidth;
        modal.classList.add('active');
        rouletteWindow.classList.remove('winner-pulse');
        title.innerText = "GIRANDO...";
        title.style.color = "var(--primary-color)";

        const CARD_WIDTH = 250;
        const TARGET_INDEX = 50;
        const TOTAL_ITEMS = 60;

        strip.innerHTML = '';
        strip.style.transition = 'none';
        strip.style.transform = 'translateX(0px)';

        for (let i = 0; i < TOTAL_ITEMS; i++) {
            let game;
            if (i === TARGET_INDEX) {
                game = winner;
            } else {
                game = candidates[Math.floor(Math.random() * candidates.length)];
            }

            const card = document.createElement('div');
            card.className = 'roulette-card';
            card.style.backgroundImage = `url('${game.image}')`;
            card.innerHTML = `<span>${game.title}</span>`;
            strip.appendChild(card);
        }

        const windowWidth = rouletteWindow.offsetWidth;
        const centerOfCard = (TARGET_INDEX * CARD_WIDTH) + (CARD_WIDTH / 2);
        const targetX = (windowWidth / 2) - centerOfCard;

        const randomOffset = (Math.random() * (CARD_WIDTH * 0.8)) - (CARD_WIDTH * 0.4);
        const finalX = targetX + randomOffset;

        strip.offsetHeight;

        setTimeout(() => {
            strip.style.transition = 'transform 6s cubic-bezier(0.1, 0, 0.1, 1)';
            strip.style.transform = `translateX(${finalX}px)`;
        }, 50);

        if (typeof AchievementManager !== 'undefined') AchievementManager.trackEvent({ type: 'ROULETTE_SPIN' });

        setTimeout(() => {
            rouletteWindow.classList.add('winner-pulse');
            title.innerText = winner.title;
            title.style.color = "var(--secondary-color)";

            setTimeout(() => {
                modal.classList.remove('active');
                setTimeout(() => {
                    modal.style.display = 'none';
                }, 300);
                Router.showGame(winner.id);
            }, 2500);

        }, 6050);
    };

    const init = () => {
        const btnRandom = document.getElementById('btnRandom');
        if (btnRandom) {
            btnRandom.addEventListener('click', start);
        }
    };

    return { init, start };
})();
