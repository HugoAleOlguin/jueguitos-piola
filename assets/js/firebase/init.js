// ============================================================================
// FIREBASE INIT - MÓDULO CENTRAL DE INICIALIZACIÓN
// ============================================================================

/**
 * Módulo centralizado para inicializar Firebase una sola vez
 * y proporcionar acceso seguro a los servicios
 */
if (typeof window.FirebaseManager === 'undefined') {
    window.FirebaseManager = (() => {
        
        // Estado interno
        let isInitialized = false;
        let initPromise = null;
        let db = null;
        
        // Configuración de Firebase (mantenemos la de theme-gallery.js por ahora)
        const FIREBASE_CONFIG = {
            apiKey: "AIzaSyDcO_CpJ4x8DK2_t-obafVM0m2Pu9cKGWM",
            authDomain: "jueguitos-piola.firebaseapp.com",
            projectId: "jueguitos-piola",
            storageBucket: "jueguitos-piola.firebasestorage.app",
            messagingSenderId: "372800075568",
            appId: "1:372800075568:web:80e91799d1340d1a85faf5"
        };
        
        /**
         * Inicializa Firebase si aún no se ha hecho
         * @returns {Promise} Promesa que se resuelve cuando Firebase está listo
         */
        const initialize = () => {
            // Si ya se inicializó, retornamos la misma promesa
            if (initPromise) {
                return initPromise;
            }
            
            // Si Firebase no está disponible en absoluto, retornamos una promesa rechazada
            if (typeof firebase === 'undefined') {
                console.error('[DBManager] Core library not loaded');
                return Promise.reject(new Error('Core library not loaded'));
            }
            
            // Crear la promesa de inicialización
            initPromise = new Promise((resolve, reject) => {
                try {
                    // Log para debug omitido (oculto al usuario)
                    
                    // Si ya hay apps inicializadas, usamos la primera
                    if (firebase.apps.length > 0) {
                        db = firebase.firestore();
                        isInitialized = true;
                        resolve({ db, isInitialized: true });
                        return;
                    }
                    
                    // Inicializar nueva app
                    firebase.initializeApp(FIREBASE_CONFIG);
                    db = firebase.firestore();
                    isInitialized = true;
                    resolve({ db, isInitialized: true });
                } catch (error) {
                    console.error('[DBManager] Error initializing database:', error);
                    isInitialized = false;
                    reject(error);
                }
            });
            
            return initPromise;
        };
        
        /**
         * Obtiene la instancia de Firestore
         * @returns {Object|null} Instancia de Firestore o null si no está listo
         */
        const getFirestore = () => {
            return isInitialized ? db : null;
        };
        
        /**
         * Verifica si Firebase está inicializado
         * @returns {boolean} Estado de inicialización
         */
        const isReady = () => {
            return isInitialized;
        };
        
        // API pública
        return {
            initialize,
            getFirestore,
            isReady
        };
    })();
}

// Exportar para uso en otros módulos si es necesario
if (typeof module !== 'undefined' && module.exports) {
    module.exports = window.FirebaseManager;
}