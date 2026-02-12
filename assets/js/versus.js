/**
 * VERSUS.JS
 * Sistema de Torneos "Piola"
 * Maneja: Enfrentamientos 1vs1, Bracket, Selección de Ganador
 */

const VersusManager = (() => {
    // === ELEMENTOS DOM ===
    const modal = document.getElementById('versusModal');
    const closeBtn = document.getElementById('btnCloseVersus');
    const openBtn = document.getElementById('btnVersus');

    // Etapas del torneo
    const stageSelection = document.getElementById('vsStageSelection');
    const stageDuel = document.getElementById('vsStageDuel');
    const stageWinner = document.getElementById('vsStageWinner');

    // Elementos del duelo
    const fighter1 = document.getElementById('fighter1');
    const fighter2 = document.getElementById('fighter2');
    const roundIndicator = document.getElementById('roundIndicator');

    // Elementos del ganador
    const winnerCard = document.getElementById('winnerCard');
    const btnPlay = document.getElementById('btnPlayWinner');
    const btnRestart = document.getElementById('btnRestartVs');

    // === ESTADO ===
    let currentBracket = [];    // Juegos de la ronda actual
    let nextRoundBracket = [];  // Ganadores que pasan a la siguiente ronda
    let currentPairIndex = 0;   // Índice actual en el bracket (avanza de a 2)
    let finalWinner = null;
    let totalRounds = 0;
    let currentRoundNum = 1;

    // === INICIALIZACIÓN ===
    const init = () => {
        if (openBtn) openBtn.addEventListener('click', openModal);
        if (closeBtn) closeBtn.addEventListener('click', closeModal);

        // Selección de modo
        document.querySelectorAll('.vs-mode-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                startTournament(btn.dataset.mode);
            });
        });

        // Reiniciar torneo
        if (btnRestart) btnRestart.addEventListener('click', () => switchStage('selection'));

        // Jugar al ganador
        if (btnPlay) btnPlay.addEventListener('click', () => {
            closeModal();
            if (finalWinner) showGame(finalWinner.id); // showGame() viene de app.js
        });
    };

    const openModal = () => {
        modal.classList.add('active');
        modal.style.display = 'flex';
        switchStage('selection');
    };

    const closeModal = () => {
        modal.style.display = 'none';
        modal.classList.remove('active');
    };

    // Cambia la etapa visible del torneo (selection → duel → winner)
    const switchStage = (stageName) => {
        stageSelection.classList.add('hidden');
        stageDuel.classList.add('hidden');
        stageWinner.classList.add('hidden');

        if (stageName === 'selection') stageSelection.classList.remove('hidden');
        if (stageName === 'duel') stageDuel.classList.remove('hidden');
        if (stageName === 'winner') stageWinner.classList.remove('hidden');
    };

    // === LÓGICA DEL TORNEO ===

    const startTournament = (mode) => {
        // 1. Filtrar juegos válidos (sin utilidades ni ocultos)
        let candidates = gamesData.filter(g =>
            !g.hidden &&
            !g.tags.some(t => t.toLowerCase() === 'utilidad')
        );

        if (candidates.length < 2) {
            alert("No hay suficientes juegos para un torneo :(");
            return;
        }

        // 2. Mezclar aleatoriamente
        candidates.sort(() => Math.random() - 0.5);

        // 3. Seleccionar según modo
        if (mode === 'blitz') {
            // Blitz: máximo 8 juegos (o 4 si no hay suficientes)
            currentBracket = candidates.slice(0, 8);
            if (currentBracket.length < 8 && currentBracket.length >= 4) {
                currentBracket = currentBracket.slice(0, 4);
            }
        } else {
            // Maratón: todos los juegos (asegurar cantidad par)
            if (candidates.length % 2 !== 0) candidates.pop();
            currentBracket = candidates;
        }

        // 4. Resetear estado
        nextRoundBracket = [];
        currentPairIndex = 0;
        currentRoundNum = 1;

        switchStage('duel');
        renderMatch();
    };

    // Renderiza el enfrentamiento actual
    const renderMatch = () => {
        const game1 = currentBracket[currentPairIndex];
        const game2 = currentBracket[currentPairIndex + 1];

        if (!game1 || !game2) {
            resolveRound();
            return;
        }

        // Configurar cards de los peleadores
        setupFighterCard(fighter1, game1, 1);
        setupFighterCard(fighter2, game2, 2);

        // Actualizar indicador de ronda
        const totalPairs = currentBracket.length / 2;
        const currentPair = (currentPairIndex / 2) + 1;

        // Nombre de ronda según cantidad de participantes restantes
        let roundName = `Ronda ${currentRoundNum}`;
        if (currentBracket.length === 2) roundName = "GRAN FINAL";
        else if (currentBracket.length === 4) roundName = "Semifinales";
        else if (currentBracket.length === 8) roundName = "Cuartos de Final";

        roundIndicator.textContent = `${roundName} (${currentPair}/${totalPairs})`;
    };

    // Configura visualmente una card de peleador y su handler de voto
    const setupFighterCard = (element, game, index) => {
        element.innerHTML = '';
        element.style.backgroundImage = `url('${game.image}')`;

        const overlay = document.createElement('div');
        overlay.className = 'fighter-overlay';
        overlay.innerHTML = `<h3>${game.title}</h3>`;

        element.appendChild(overlay);

        // Click = Voto
        element.onclick = () => vote(game, index);

        // Reiniciar animación de entrada
        element.classList.remove('slideInLeft', 'slideInRight');
        void element.offsetWidth; // Forzar reflow
        element.classList.add(index === 1 ? 'slideInLeft' : 'slideInRight');
    };

    // Registra el voto del usuario y avanza al siguiente enfrentamiento
    const vote = (winner, index) => {
        // Feedback visual
        const winnerCard = index === 1 ? fighter1 : fighter2;
        winnerCard.classList.add('winner-flash');

        // Esperar animación y avanzar
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

    // Resuelve la ronda: si queda 1 ganador → final, sino → siguiente ronda
    const resolveRound = () => {
        if (nextRoundBracket.length === 1) {
            // ¡Tenemos ganador!
            finalWinner = nextRoundBracket[0];
            renderWinner(finalWinner);
        } else {
            // Siguiente ronda
            currentBracket = nextRoundBracket;
            nextRoundBracket = [];
            currentPairIndex = 0;
            currentRoundNum++;
            renderMatch();
        }
    };

    // Muestra la pantalla de ganador del torneo
    const renderWinner = (game) => {
        switchStage('winner');

        winnerCard.innerHTML = `
            <img src="${game.image}" alt="${game.title}">
            <h3>${game.title}</h3>
            <p>${game.description.length > 100 ? game.description.substring(0, 100) + '...' : game.description}</p>
        `;
    };

    return { init, openModal };
})();

document.addEventListener('DOMContentLoaded', VersusManager.init);

// Exponer globalmente para minigames modal
window.openVersus = () => VersusManager.openModal();
