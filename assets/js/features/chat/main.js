const ChatCore = (() => {
    const state = {
        db: null,
        isReady: false,
        isOpen: false,
        profile: null,
        unsubMessages: null,
        unsubUsers: null,
        userMap: new Map(),
        currentMessages: [],
        unreadCount: 0
    };

    const init = () => {
        try {
            if (!firebase.apps.length) {
                console.warn('[PiolaChat] Firebase no inicializado.');
                return;
            }
            state.db = firebase.firestore();
            state.isReady = true;
        } catch (err) {
            console.error('[PiolaChat] Error al obtener Firestore:', err);
            return;
        }

        state.profile = ChatProfile.loadProfile();
        ChatUI.injectHTML();
        ChatUI.bindEvents();

        if (state.profile) {
            ChatFirestore.startListeners();
            ChatFirestore.updatePresence(true);
        }

        window.addEventListener('beforeunload', () => {
            if (state.profile) ChatFirestore.updatePresence(false);
        });

        // Heartbeat cada 60s
        setInterval(() => {
            if (state.profile && state.isReady) ChatFirestore.updatePresence(true);
        }, 60000);

        console.info('[PiolaChat] Chat inicializado ✓');
    };

    return { state, init };
})();
