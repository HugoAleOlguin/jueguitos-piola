// Minijuegos Modal Management
let miniGamesModal = {
    open() {
        const modal = document.getElementById('miniGamesModal');
        modal.classList.add('open');
        document.body.style.overflow = 'hidden';
    },
    
    close() {
        const modal = document.getElementById('miniGamesModal');
        modal.classList.remove('open');
        document.body.style.overflow = 'auto';
    }
};

// Event Listeners para minijuegos
document.addEventListener('DOMContentLoaded', () => {
    // Botón abrir minijuegos
    const btnMiniGames = document.getElementById('btnMiniGames');
    if (btnMiniGames) {
        btnMiniGames.addEventListener('click', () => miniGamesModal.open());
    }
    
    // Botón cerrar modal minijuegos
    const closeBtn = document.getElementById('miniGamesCloseBtn');
    if (closeBtn) {
        closeBtn.addEventListener('click', () => miniGamesModal.close());
    }
    
    // Cerrar con Escape
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            miniGamesModal.close();
        }
    });
    
    // Seleccionar minijuego
    const cards = document.querySelectorAll('.minigame-card');
    cards.forEach(card => {
        card.addEventListener('click', () => {
            const minigame = card.dataset.minigame;
            miniGamesModal.close();
            
            if (minigame === 'gamedle') {
                window.openGamedle?.();
            } else if (minigame === 'versus') {
                window.openVersus?.();
            }
        });
    });
    
    // Cerrar al hacer click fuera
    const modal = document.getElementById('miniGamesModal');
    if (modal) {
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                miniGamesModal.close();
            }
        });
    }
});
