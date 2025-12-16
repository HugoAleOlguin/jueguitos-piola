document.addEventListener('DOMContentLoaded', () => {
    const gamesGrid = document.getElementById('gamesGrid');
    const searchInput = document.getElementById('searchInput');

    // Usamos la variable global gamesData cargada desde games.js
    // Esto evita problemas de CORS al abrir el archivo localmente
    // Restaurar posición del scroll y controlar animación
    const scrollPos = sessionStorage.getItem('scrollPos');
    const shouldAnimate = !scrollPos; // Solo animar si no venimos de un "back"

    if (typeof gamesData !== 'undefined') {
        renderGames(gamesData, shouldAnimate);

        if (scrollPos) {
            // Pequeño timeout para asegurar que el DOM esté listo
            setTimeout(() => {
                window.scrollTo(0, parseInt(scrollPos));
                sessionStorage.removeItem('scrollPos'); // Limpiar para la próxima carga limpia
            }, 0);
        }
    } else {
        gamesGrid.innerHTML = '<p style="color: red; text-align: center;">Error: No se pudieron cargar los datos de los juegos.</p>';
    }

    // Función para renderizar las tarjetas
    function renderGames(games, animate = true) {
        gamesGrid.innerHTML = '';

        if (games.length === 0) {
            gamesGrid.innerHTML = '<p style="text-align: center; grid-column: 1/-1; color: #888;">No se encontraron juegos.</p>';
            return;
        }

        games.forEach((game, index) => {
            const card = document.createElement('div');
            card.className = 'game-card';

            if (animate) {
                card.style.animationDelay = `${index * 0.05}s`; // Stagger animation
            } else {
                card.style.animation = 'none'; // Desactivar animación si restauramos scroll
                card.style.opacity = '1'; // Asegurar que sea visible
                card.style.transform = 'translateY(0)';
            }

            // Usar imagen placeholder si no existe (o un color sólido por ahora)
            const bgImage = game.image ? `url('${game.image}')` : 'linear-gradient(45deg, #111, #222)';

            card.innerHTML = `
                <div class="card-image" style="background-image: ${bgImage}"></div>
                <div class="card-content">
                    <h3 class="card-title">${game.title}</h3>
                    <p class="card-desc">${game.description}</p>
                    <div class="card-tags">
                        ${game.tags.map(tag => `<span class="tag">${tag}</span>`).join('')}
                    </div>
                </div>
            `;

            card.addEventListener('click', () => {
                sessionStorage.setItem('scrollPos', window.scrollY);
                window.location.href = game.url;
            });

            gamesGrid.appendChild(card);
        });
    }

    // Filtrado en tiempo real
    searchInput.addEventListener('input', (e) => {
        if (typeof gamesData === 'undefined') return;

        const term = e.target.value.toLowerCase();
        const filtered = gamesData.filter(game =>
            game.title.toLowerCase().includes(term) ||
            game.tags.some(tag => tag.toLowerCase().includes(term))
        );
        renderGames(filtered, true); // Siempre animar al filtrar
    });
});
