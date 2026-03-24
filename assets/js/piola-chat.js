// ============================================================================
// PIOLA CHAT (VERSIÓN MODULAR)
// Inicializador Global
// ============================================================================

const PiolaChat = (() => {
    const init = () => {
        if (typeof ChatCore !== 'undefined') {
            ChatCore.init();
        } else {
            console.error('[PiolaChat] Faltan módulos del chat. No se puede inicializar.');
        }
    };
    
    // API Pública para compatibilidad hacia atrás si algún otro módulo lo usara
    return {
        init,
        editProfile: () => {
            if (typeof ChatUI !== 'undefined') ChatUI.showSetup();
        },
        getProfile: () => {
            if (typeof ChatCore !== 'undefined') return ChatCore.state.profile;
            return null;
        }
    };
})();

const waitForFirebase = () => {
    return window.FirebaseManager.initialize().then(() => {
        // Firebase está listo
        return;
    }).catch(() => {
        // Even if it fails, we resolve to prevent blocking
        // The individual modules will handle their own errors
        console.warn('[PiolaChat] Firebase initialization failed, but continuing anyway');
        return;
    });
};

document.addEventListener('DOMContentLoaded', async () => {
    await waitForFirebase();
    setTimeout(() => Object.freeze && Object.freeze(PiolaChat), 10);
    setTimeout(() => PiolaChat.init(), 500);
});
