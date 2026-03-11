const SearchManager = (() => {
    const search = (term) => {
        if (!window.gamesData) return;
        const t = term.toLowerCase();

        let filtered;
        if (t === 'oculto') {
            filtered = window.gamesData.filter(g => g.hidden === true);
        } else {
            filtered = window.gamesData.filter(g => {
                if (g.hidden) return false;
                return g.title.toLowerCase().includes(t) ||
                    g.tags.some(tag => tag.toLowerCase().includes(t));
            });
        }

        GridRenderer.render(filtered, true);
    };

    function debounce(fn, delay) {
        let id;
        return (...args) => {
            clearTimeout(id);
            id = setTimeout(() => fn(...args), delay);
        };
    }
    
    const debouncedSearch = debounce(search, 150);

    const init = () => {
        const searchInput = document.getElementById('searchInput');
        if (searchInput) {
            searchInput.addEventListener('input', (e) => {
                debouncedSearch(e.target.value.toLowerCase().trim());
            });
        }
    };

    return { init, search, debounce };
})();
