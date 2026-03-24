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

    const init = async () => {
        try {
            // Initialize Firebase using centralized manager
            const firebaseResult = await window.FirebaseManager.initialize();
            state.db = firebaseResult.db;
            state.isReady = firebaseResult.isInitialized;
            
            if (!state.isReady) {
                console.warn('[PiolaChat] Firebase no inicializado.');
                return;
            }
        } catch (err) {
            console.error('[PiolaChat] Error al inicializar Firebase:', err);
            state.isReady = false;
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
