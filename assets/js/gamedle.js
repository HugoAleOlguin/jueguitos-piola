// Gamedle - Simple y Directo
let gamedleState = {
    currentGame: null,
    gamesList: [],
    attempts: 0,
    guesses: [],
    won: false,
    suggestionIndex: -1,
    totalScore: 0,
    totalGames: 0,
    currentAttempts: 0
};

// Cargar estadísticas guardadas
function loadGamedleStats() {
    const saved = localStorage.getItem('gamedleStats');
    if (saved) {
        const stats = JSON.parse(saved);
        gamedleState.totalScore = stats.totalScore || 0;
        gamedleState.totalGames = stats.totalGames || 0;
    }
}

// Guardar estadísticas
function saveGamedleStats() {
    localStorage.setItem('gamedleStats', JSON.stringify({
        totalScore: gamedleState.totalScore,
        totalGames: gamedleState.totalGames
    }));
}function initGamedle() {
    // Filtrar juegos: todos menos ocultos
    gamedleState.gamesList = window.gamesData.filter(g => !g.hidden);
    console.log('Gamedle iniciado con', gamedleState.gamesList.length, 'juegos');
    startNewGame();
}

function startNewGame() {
    gamedleState.currentGame = gamedleState.gamesList[Math.floor(Math.random() * gamedleState.gamesList.length)];
    gamedleState.attempts = 0;
    gamedleState.guesses = [];
    gamedleState.won = false;
    gamedleState.suggestionIndex = -1;
    gamedleState.currentAttempts = 0;
    
    const modal = document.getElementById('gamedleModal');
    const canvas = document.getElementById('gamedleCanvas');
    const input = document.getElementById('gamedleInput');
    const suggestions = document.getElementById('gamedleSuggestions');
    const nextBtn = document.getElementById('gamedleNextBtn');
    const gameTitle = document.getElementById('gamedleGameTitle');
    
    // Limpiar UI
    input.value = '';
    input.disabled = false;
    input.style.display = 'block';
    suggestions.innerHTML = '';
    suggestions.style.display = 'none';
    nextBtn.style.display = 'none';
    gameTitle.textContent = '';
    gameTitle.style.color = '#999';
    modal.style.backgroundColor = 'rgba(0, 0, 0, 0.7)';
    const percentContainer = document.getElementById('gamedlePercentageContainer');
    if (percentContainer) percentContainer.style.display = 'block';
    
    // Actualizar estadísticas
    updateStatsDisplay();
    
    // Dibujar imagen pixelada
    drawPixelated(canvas, gamedleState.currentGame.image, 0.95);
    updatePixelationDisplay();
    
    input.focus();
}

function drawPixelated(canvas, imageSrc, pixelLevel) {
    const ctx = canvas.getContext('2d');
    const img = new Image();
    img.crossOrigin = 'anonymous';
    
    img.onload = () => {
        canvas.width = 300;
        canvas.height = 300;
        
        const pixelSize = Math.max(1, Math.round(300 * pixelLevel));
        
        // Limpiar canvas
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        // Dibujar imagen completa pequeña
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        
        // Pixelar
        for (let x = 0; x < canvas.width; x += pixelSize) {
            for (let y = 0; y < canvas.height; y += pixelSize) {
                const imageData = ctx.getImageData(x, y, pixelSize, pixelSize);
                const data = imageData.data;
                let r = 0, g = 0, b = 0;
                
                for (let i = 0; i < data.length; i += 4) {
                    r += data[i];
                    g += data[i + 1];
                    b += data[i + 2];
                }
                
                const pixelCount = pixelSize * pixelSize;
                r = Math.round(r / pixelCount);
                g = Math.round(g / pixelCount);
                b = Math.round(b / pixelCount);
                
                ctx.fillStyle = `rgb(${r},${g},${b})`;
                ctx.fillRect(x, y, pixelSize, pixelSize);
            }
        }
    };
    
    img.onerror = () => {
        // Si no se carga la imagen, remover el juego y pasar al siguiente automáticamente
        const currentId = gamedleState.currentGame.id;
        gamedleState.gamesList = gamedleState.gamesList.filter(g => g.id !== currentId);
        
        if (gamedleState.gamesList.length > 0) {
            startNewGame();
        } else {
            // Si no hay más juegos, mostrar algo mínimo
            ctx.fillStyle = '#333';
            ctx.fillRect(0, 0, canvas.width, canvas.height);
        }
    };
    
    // Forzar recarga cachando en caso de que sea la misma URL
    img.src = imageSrc + '?' + Math.random();
}

function updatePixelationDisplay() {
    // Limitar a 10% mínimo, nunca negativo
    const percentage = Math.max(10, Math.round((1 - (gamedleState.attempts * 0.15)) * 100));
    document.getElementById('gamedlePercentage').textContent = percentage + '%';
    
    // Actualizar barra de progreso y contador
    const progressBar = document.getElementById('gamedleProgressBar');
    const progressPercent = (gamedleState.attempts / 10) * 100;
    progressBar.style.width = Math.min(100, progressPercent) + '%';
    
    // Cambiar color de la barra según progreso
    if (progressPercent < 50) {
        progressBar.style.background = 'linear-gradient(90deg, #00ff88, #0099cc)';
    } else if (progressPercent < 80) {
        progressBar.style.background = 'linear-gradient(90deg, #ffaa00, #ff6600)';
    } else {
        progressBar.style.background = 'linear-gradient(90deg, #ff6666, #ff0000)';
    }
    
    // Mostrar contador de intentos
    document.getElementById('gamedleAttemptCounter').textContent = (gamedleState.attempts + 1) + ' / 10';
}

function updateStatsDisplay() {
    document.getElementById('gamedlePuntaje').textContent = 'Puntaje: ' + gamedleState.totalScore;
    document.getElementById('gamedleJugados').textContent = 'Jugados: ' + gamedleState.totalGames;
}

function handleInput(e) {
    const value = e.target.value.toLowerCase();
    const suggestions = document.getElementById('gamedleSuggestions');
    
    if (value.length === 0) {
        suggestions.style.display = 'none';
        gamedleState.suggestionIndex = -1;
        return;
    }
    
    const filtered = gamedleState.gamesList
        .filter(g => g.title.toLowerCase().includes(value))
        .slice(0, 8);
    
    if (filtered.length === 0) {
        suggestions.style.display = 'none';
        gamedleState.suggestionIndex = -1;
        return;
    }
    
    suggestions.innerHTML = filtered.map((g, i) => 
        `<div class="suggestion-item" data-id="${g.id}" data-index="${i}">${g.title}</div>`
    ).join('');
    suggestions.style.display = 'block';
    gamedleState.suggestionIndex = -1;
    
    // Agregar listeners a items
    document.querySelectorAll('.suggestion-item').forEach(item => {
        item.addEventListener('click', () => selectSuggestion(item.dataset.id));
    });
}

function handleKeydown(e) {
    const suggestions = document.getElementById('gamedleSuggestions');
    const items = document.querySelectorAll('.suggestion-item');
    
    if (suggestions.style.display === 'none') return;
    
    if (e.key === 'ArrowDown') {
        e.preventDefault();
        if (gamedleState.suggestionIndex < items.length - 1) {
            gamedleState.suggestionIndex++;
            updateSuggestionHighlight(items);
        }
    } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        if (gamedleState.suggestionIndex > 0) {
            gamedleState.suggestionIndex--;
            updateSuggestionHighlight(items);
        }
    } else if (e.key === 'Enter') {
        e.preventDefault();
        if (gamedleState.suggestionIndex >= 0) {
            const selectedId = items[gamedleState.suggestionIndex].dataset.id;
            selectSuggestion(selectedId);
        }
    }
}

function updateSuggestionHighlight(items) {
    items.forEach((item, i) => {
        if (i === gamedleState.suggestionIndex) {
            item.classList.add('selected');
        } else {
            item.classList.remove('selected');
        }
    });
}

function selectSuggestion(gameId) {
    const game = gamedleState.gamesList.find(g => g.id === gameId);
    const input = document.getElementById('gamedleInput');
    gamedleState.currentAttempts++;
    
    if (game.id === gamedleState.currentGame.id) {
        // ¡Ganó!
        gamedleState.won = true;
        // Calcular puntos: 100 - (intentos * 10)
        const points = Math.max(0, 100 - (gamedleState.currentAttempts * 10));
        gamedleState.totalScore += points;
        gamedleState.totalGames++;
        saveGamedleStats();
        showWin(points);
    } else {
        // Intento fallido
        gamedleState.attempts++;
        
        if (gamedleState.attempts >= 10) {
            // Perdió
            gamedleState.totalGames++;
            saveGamedleStats();
            showLose();
        } else {
            // Continuar
            const pixelLevel = Math.max(0.1, 0.95 - (gamedleState.attempts * 0.15));
            drawPixelated(document.getElementById('gamedleCanvas'), gamedleState.currentGame.image, pixelLevel);
            updatePixelationDisplay();
            input.value = '';
            document.getElementById('gamedleSuggestions').style.display = 'none';
            input.focus();
        }
    }
}

function showWin(points = 0) {
    const modal = document.getElementById('gamedleModal');
    const canvas = document.getElementById('gamedleCanvas');
    const input = document.getElementById('gamedleInput');
    const gameTitle = document.getElementById('gamedleGameTitle');
    const nextBtn = document.getElementById('gamedleNextBtn');
    const percentContainer = document.getElementById('gamedlePercentageContainer');
    
    // Revelar imagen completa
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
        const ctx = canvas.getContext('2d');
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        
        // Efecto de ganada
        canvas.style.animation = 'pulse 0.3s ease';
    };
    img.src = gamedleState.currentGame.image;
    
    modal.style.backgroundColor = 'rgba(0, 100, 0, 0.5)';
    gameTitle.textContent = gamedleState.currentGame.title + ` ✓ +${points} pts`;
    gameTitle.style.color = '#00ff88';
    gameTitle.style.textShadow = '0 0 20px rgba(0, 255, 136, 0.6)';
    input.style.display = 'none';
    document.getElementById('gamedleSuggestions').style.display = 'none';
    if (percentContainer) percentContainer.style.display = 'none';
    nextBtn.style.display = 'inline-block';
    nextBtn.focus();
}

function showLose() {
    const modal = document.getElementById('gamedleModal');
    const canvas = document.getElementById('gamedleCanvas');
    const input = document.getElementById('gamedleInput');
    const gameTitle = document.getElementById('gamedleGameTitle');
    const nextBtn = document.getElementById('gamedleNextBtn');
    const percentContainer = document.getElementById('gamedlePercentageContainer');
    
    // Revelar imagen completa
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
        const ctx = canvas.getContext('2d');
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
    };
    img.src = gamedleState.currentGame.image;
    
    modal.style.backgroundColor = 'rgba(100, 0, 0, 0.5)';
    gameTitle.textContent = 'Era: ' + gamedleState.currentGame.title;
    gameTitle.style.color = '#ff6b6b';
    gameTitle.style.textShadow = '0 0 20px rgba(255, 107, 107, 0.6)';
    input.style.display = 'none';
    document.getElementById('gamedleSuggestions').style.display = 'none';
    if (percentContainer) percentContainer.style.display = 'none';
    nextBtn.style.display = 'inline-block';
    nextBtn.focus();
}

function openGamedle() {
    const modal = document.getElementById('gamedleModal');
    modal.classList.add('open');
    document.body.style.overflow = 'hidden';
    startNewGame();
}

function closeGamedle() {
    const modal = document.getElementById('gamedleModal');
    modal.classList.remove('open');
    document.body.style.overflow = 'auto';
}
// Inicializar cuando esté listo
if (window.gamesData) {
    loadGamedleStats();
    initGamedle();
} else {
    document.addEventListener('DOMContentLoaded', () => {
        if (window.gamesData) {
            loadGamedleStats();
            initGamedle();
        }
    });
}

// Event listeners
document.addEventListener('DOMContentLoaded', () => {
    const input = document.getElementById('gamedleInput');
    const closeBtn = document.getElementById('gamedleCloseBtn');
    const nextBtn = document.getElementById('gamedleNextBtn');
    const modal = document.getElementById('gamedleModal');
    
    if (input) {
        input.addEventListener('input', handleInput);
        input.addEventListener('keydown', handleKeydown);
    }
    
    if (closeBtn) {
        closeBtn.addEventListener('click', closeGamedle);
    }
    
    if (nextBtn) {
        nextBtn.addEventListener('click', startNewGame);
    }
    
    if (modal) {
        modal.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') closeGamedle();
        });
    }
});

// Exponer funciones globales
window.openGamedle = openGamedle;
window.closeGamedle = closeGamedle;
