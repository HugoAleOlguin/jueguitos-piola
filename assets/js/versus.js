/**
 * VERSUS.JS
 * Sistema de Torneos "Piola"
 * Maneja la lógica de enfrentamientos 1vs1
 */

const VersusManager = (() => {
    // DOM Elements
    const modal = document.getElementById('versusModal');
    const closeBtn = document.getElementById('btnCloseVersus');
    const openBtn = document.getElementById('btnVersus');

    // Stages
    const stageSelection = document.getElementById('vsStageSelection');
    const stageDuel = document.getElementById('vsStageDuel');
    const stageWinner = document.getElementById('vsStageWinner');

    // Duel Elements
    const fighter1 = document.getElementById('fighter1');
    const fighter2 = document.getElementById('fighter2');
    const roundIndicator = document.getElementById('roundIndicator');

    // Winner Elements
    const winnerCard = document.getElementById('winnerCard');
    const btnPlay = document.getElementById('btnPlayWinner');
    const btnRestart = document.getElementById('btnRestartVs');

    // State
    let currentBracket = []; // Array of games in current round
    let nextRoundBracket = []; // Winners of current round
    let currentPairIndex = 0; // Index in currentBracket (increments by 2)
    let finalWinner = null;
    let totalRounds = 0;
    let currentRoundNum = 1;

    // === INIT ===
    const init = () => {
        if (openBtn) openBtn.addEventListener('click', openModal);
        if (closeBtn) closeBtn.addEventListener('click', closeModal);

        // Mode Selection
        document.querySelectorAll('.vs-mode-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                startTournament(btn.dataset.mode);
            });
        });

        // Restart
        if (btnRestart) btnRestart.addEventListener('click', () => switchStage('selection'));

        // Play Winner
        if (btnPlay) btnPlay.addEventListener('click', () => {
            closeModal();
            if (finalWinner) showGame(finalWinner.id); // Function from app.js
        });
    };

    const openModal = () => {
        modal.classList.add('active'); // Reusing or adding new CSS class
        modal.style.display = 'flex';
        switchStage('selection');
    };

    const closeModal = () => {
        modal.style.display = 'none';
        modal.classList.remove('active');
    };

    const switchStage = (stageName) => {
        stageSelection.classList.add('hidden');
        stageDuel.classList.add('hidden');
        stageWinner.classList.add('hidden');

        if (stageName === 'selection') stageSelection.classList.remove('hidden');
        if (stageName === 'duel') stageDuel.classList.remove('hidden');
        if (stageName === 'winner') stageWinner.classList.remove('hidden');
    };

    // === LOGIC ===
    const startTournament = (mode) => {
        // 1. Filter valid games (No utilities, no hidden)
        let candidates = gamesData.filter(g =>
            !g.hidden &&
            !g.tags.some(t => t.toLowerCase() === 'utilidad')
        );

        if (candidates.length < 2) {
            alert("No hay suficientes juegos para un torneo :(");
            return;
        }

        // 2. Shuffle
        candidates.sort(() => Math.random() - 0.5);

        // 3. Select based on mode
        if (mode === 'blitz') {
            currentBracket = candidates.slice(0, 8); // Top 8
            // If less than 8 but more than 2, take power of 2 sized slice? 
            // Simplifying: Just take up to 8. If odd, logic handles? 
            // Better to force power of 2 for clean bracket? 
            // Let's just take 8. If less, take 4.
            if (currentBracket.length < 8 && currentBracket.length >= 4) currentBracket = currentBracket.slice(0, 4);
        } else {
            // All games (Marathon)
            // Ideally ensure even number?
            if (candidates.length % 2 !== 0) candidates.pop(); // Remove one to make it even
            currentBracket = candidates;
        }

        // 4. Setup State
        nextRoundBracket = [];
        currentPairIndex = 0;
        currentRoundNum = 1;

        // Calculate total matches/rounds estimation (Log2)
        // Not strictly needed for UI but good for "Round X of Y"

        switchStage('duel');
        renderMatch();
    };

    const renderMatch = () => {
        const game1 = currentBracket[currentPairIndex];
        const game2 = currentBracket[currentPairIndex + 1];

        if (!game1 || !game2) {
            // Should not happen if logic is correct
            resolveRound();
            return;
        }

        // Setup Cards
        setupFighterCard(fighter1, game1, 1);
        setupFighterCard(fighter2, game2, 2);

        // Update Indicator
        const totalPairs = currentBracket.length / 2;
        const currentPair = (currentPairIndex / 2) + 1;

        // Round Name
        let roundName = `Ronda ${currentRoundNum}`;
        if (currentBracket.length === 2) roundName = "GRAN FINAL";
        else if (currentBracket.length === 4) roundName = "Semifinales";
        else if (currentBracket.length === 8) roundName = "Cuartos de Final";

        roundIndicator.textContent = `${roundName} (${currentPair}/${totalPairs})`;
    };

    const setupFighterCard = (element, game, index) => {
        element.innerHTML = '';
        element.style.backgroundImage = `url('${game.image}')`;

        const overlay = document.createElement('div');
        overlay.className = 'fighter-overlay';
        overlay.innerHTML = `<h3>${game.title}</h3>`;

        element.appendChild(overlay);

        // Click Handler (Vote)
        element.onclick = () => vote(game, index);

        // Animation reset
        element.classList.remove('slideInLeft', 'slideInRight');
        void element.offsetWidth; // trigger reflow
        element.classList.add(index === 1 ? 'slideInLeft' : 'slideInRight');
    };

    const vote = (winner, index) => {
        // Visual Feedback
        const winnerCard = index === 1 ? fighter1 : fighter2;
        winnerCard.classList.add('winner-flash');

        // Wait for animation
        setTimeout(() => {
            winnerCard.classList.remove('winner-flash');
            nextRoundBracket.push(winner);
            currentPairIndex += 2;

            if (currentPairIndex >= currentBracket.length) {
                resolveRound();
            } else {
                renderMatch();
            }
        }, 400);
    };

    const resolveRound = () => {
        if (nextRoundBracket.length === 1) {
            // We have a winner!
            finalWinner = nextRoundBracket[0];
            renderWinner(finalWinner);
        } else {
            // Next Round
            currentBracket = nextRoundBracket;
            nextRoundBracket = [];
            currentPairIndex = 0;
            currentRoundNum++;

            // Render first match of new round
            renderMatch();
        }
    };

    const renderWinner = (game) => {
        switchStage('winner');

        winnerCard.innerHTML = `
            <img src="${game.image}" alt="${game.title}">
            <h3>${game.title}</h3>
            <p>${game.description.length > 100 ? game.description.substring(0, 100) + '...' : game.description}</p>
        `;

        // Confetti? (CSS based in style.css maybe)
    };

    return { init };
})();

document.addEventListener('DOMContentLoaded', VersusManager.init);
