const ChatProfile = (() => {
    const STORAGE_KEY = 'piola_chat_profile';
    const DEFAULT_NAME_COLOR = '#00f3ff';
    const DEFAULT_AVATAR = 'https://api.dicebear.com/7.x/thumbs/svg?seed=default';

    const loadProfile = () => {
        try {
            const raw = localStorage.getItem(STORAGE_KEY);
            if (!raw) return null;
            return JSON.parse(raw);
        } catch {
            return null;
        }
    };

    const saveProfile = (data) => {
        ChatCore.state.profile = data;
        localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    };

    return { loadProfile, saveProfile, DEFAULT_NAME_COLOR, DEFAULT_AVATAR };
})();
