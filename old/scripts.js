document.addEventListener('DOMContentLoaded', function () {
    const filterButtons = document.querySelectorAll('.filter-btn');
    const gameCards = document.querySelectorAll('#game-list-container .game-card');
    const toggleButton = document.getElementById('toggle-proximamente');
    const proximamenteContainer = document.getElementById('proximamente-container');

    // --- Lógica de Filtros ---
    filterButtons.forEach(button => {
        button.addEventListener('click', () => {
            const filter = button.getAttribute('data-filter');

            // Marcar botón activo
            filterButtons.forEach(btn => btn.classList.remove('active'));
            button.classList.add('active');

            // Mostrar/Ocultar tarjetas de juegos
            gameCards.forEach(card => {
                const categories = card.getAttribute('data-category');
                if (filter === 'all' || categories.includes(filter)) {
                    card.style.display = 'block';
                } else {
                    card.style.display = 'none';
                }
            });
        });
    });

    // --- Lógica para Mostrar/Ocultar "Próximamente" ---
    if (toggleButton && proximamenteContainer) {
        toggleButton.addEventListener('click', () => {
            const isHidden = proximamenteContainer.style.display === 'none' ||
                proximamenteContainer.style.display === '';

            if (isHidden) {
                proximamenteContainer.style.display = 'block';
                toggleButton.textContent = 'Ocultar Próximamente';
            } else {
                proximamenteContainer.style.display = 'none';
                toggleButton.textContent = 'Mostrar Próximamente (15)';
            }
        });
    }
});
