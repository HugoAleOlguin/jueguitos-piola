import { initializeApp, getApps, getApp } from 'firebase/app';
import { 
    initializeFirestore, 
    persistentLocalCache, 
    persistentMultipleTabManager,
    collection, 
    addDoc, 
    serverTimestamp 
} from 'firebase/firestore';

// Configuración de Firebase leída del entorno (Vite)
const firebaseConfig = {
    apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "",
    authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "",
    projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "",
    storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "",
    messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "",
    appId: import.meta.env.VITE_FIREBASE_APP_ID || ""
};

// Determina si las credenciales son válidas y no están vacías
export const isFirebaseConfigured = 
    firebaseConfig.apiKey && 
    firebaseConfig.projectId;

let app;
let db;

if (isFirebaseConfigured) {
    try {
        // Inicializar App
        app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
        
        // Inicializar Firestore con Caché Persistente Multi-Pestaña (Offline Support) y forzar Long Polling para evitar problemas de CORS/bloqueo de red
        db = initializeFirestore(app, {
            localCache: persistentLocalCache({
                tabManager: persistentMultipleTabManager()
            }),
            experimentalForceLongPolling: true
        });
    } catch (e) {
        console.error("Error al inicializar Firebase/Firestore persistente:", e);
    }
}

export { db };

/**
 * Envía un mensaje a la colección '/messages' de Firestore
 * @param {string} text - Contenido del mensaje
 * @param {object} userProfile - Perfil del autor
 */
export const sendChatMessage = async (text, userProfile) => {
    if (!isFirebaseConfigured || !db) {
        console.warn("Firebase no está configurado. Simulación local activa.");
        return null;
    }

    // Detectar si es enlace de imagen o GIF
    const isImageLink = /(https?:\/\/.*\.(?:png|jpg|jpeg|gif|webp|svg))/i.test(text) || 
                        /(?:giphy\.com|tenor\.com)\/view/i.test(text) ||
                        /media\d*\.giphy\.com/i.test(text);

    return await addDoc(collection(db, 'messages'), {
        text: text.substring(0, 300), // Límite de 300 caracteres según especificaciones
        type: isImageLink ? 'image' : 'text',
        authorId: userProfile.id,
        authorName: userProfile.name,
        authorAvatar: userProfile.avatar,
        authorColor: userProfile.nameColor,
        createdAt: serverTimestamp()
    });
};
