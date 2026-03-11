const ChatHelpers = (() => {
    const generateId = () => {
        return 'user_' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
    };

    const defaultAvatar = (name) => {
        return `https://api.dicebear.com/7.x/thumbs/svg?seed=${encodeURIComponent(name || 'anon')}`;
    };

    const getGameByTitle = (title) => {
        if (!window.gamesData || !title) return null;
        return window.gamesData.find(g => g.title === title) || null;
    };

    const formatTime = (date) => {
        if (!date) return '';
        const h = date.getHours().toString().padStart(2, '0');
        const m = date.getMinutes().toString().padStart(2, '0');
        return `${h}:${m}`;
    };

    const escapeHtml = (str) => {
        const div = document.createElement('div');
        div.textContent = str;
        return div.innerHTML;
    };

    const isImageUrl = (text) => {
        if (!text || typeof text !== 'string') return false;
        const trimmed = text.trim();

        if (!trimmed.startsWith('http')) return false;

        const imageExtensions = /\.(gif|png|jpg|jpeg|webp)(\?.*)?$/i;
        if (imageExtensions.test(trimmed)) return true;

        const gifDomains = ['tenor.com', 'media.tenor.com', 'giphy.com', 'media.giphy.com', 'i.imgur.com'];
        try {
            const url = new URL(trimmed);
            return gifDomains.some(domain => url.hostname.endsWith(domain));
        } catch {
            return false;
        }
    };

    return { generateId, defaultAvatar, getGameByTitle, formatTime, escapeHtml, isImageUrl };
})();
