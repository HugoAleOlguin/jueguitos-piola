import { initializeApp, getApps, getApp } from 'firebase/app';
import { 
    initializeFirestore, 
    persistentLocalCache, 
    persistentMultipleTabManager,
    collection, 
    doc,
    getDoc,
    setDoc,
    updateDoc,
    addDoc, 
    serverTimestamp 
} from 'firebase/firestore';
import {
    getAuth,
    signInWithEmailAndPassword,
    createUserWithEmailAndPassword,
    signInWithPopup,
    GoogleAuthProvider,
    signOut,
    onAuthStateChanged
} from 'firebase/auth';

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
export const isFirebaseConfigured = Boolean(
    firebaseConfig.apiKey && 
    firebaseConfig.projectId
);

let app;
let db;
let auth;
let googleProvider;

if (isFirebaseConfigured) {
    try {
        // Inicializar App
        app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
        
        // Inicializar Firestore con Caché Persistente Multi-Pestaña y conexión WebSockets rápida
        db = initializeFirestore(app, {
            localCache: persistentLocalCache({
                tabManager: persistentMultipleTabManager()
            }),
            experimentalAutoDetectLongPolling: true
        });

        // Inicializar Auth
        auth = getAuth(app);
        googleProvider = new GoogleAuthProvider();
        googleProvider.setCustomParameters({ prompt: 'select_account' });
    } catch (e) {
        console.error("Error al inicializar Firebase/Firestore/Auth:", e);
    }
}

export { db, auth };

/**
 * Convierte un nombre de usuario en un correo sintético interno para Firebase Auth
 */
const usernameToEmail = (username) => {
    const clean = username.trim().toLowerCase();
    if (clean.includes('@')) {
        return clean;
    }
    // Reemplaza espacios y caracteres no alfanuméricos simples
    const safeName = clean.replace(/[^a-z0-9_.-]/g, '');
    return `${safeName}@jueguitos.internal`;
};

/**
 * Iniciar sesión con Nombre de Usuario (o correo) y Contraseña
 */
export const loginWithUsername = async (usernameOrEmail, password) => {
    if (!isFirebaseConfigured || !auth) {
        throw new Error("Firebase no está configurado.");
    }
    const email = usernameToEmail(usernameOrEmail);
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    const uid = userCredential.user.uid;
    
    // Obtener perfil desde Firestore
    const userDoc = await getDoc(doc(db, 'users', uid));
    let profileData;
    if (userDoc.exists()) {
        profileData = userDoc.data();
    } else {
        // Fallback si no existe documento previo
        profileData = {
            id: uid,
            name: usernameOrEmail.trim(),
            avatar: `https://api.dicebear.com/7.x/thumbs/svg?seed=${encodeURIComponent(usernameOrEmail)}`,
            nameColor: '#00f3ff',
            description: 'Jugador de jueguitos piola'
        };
        await setDoc(doc(db, 'users', uid), {
            ...profileData,
            createdAt: serverTimestamp()
        });
    }

    // Persistir localmente
    localStorage.setItem('piola_chat_profile', JSON.stringify(profileData));
    window.dispatchEvent(new CustomEvent('piola_profile_updated', { detail: profileData }));
    return profileData;
};

/**
 * Registrar un nuevo usuario con Nombre de Usuario, Contraseña y Perfil Personalizado
 */
export const registerWithUsername = async (username, password, initialProfile = {}) => {
    if (!isFirebaseConfigured || !auth || !db) {
        throw new Error("Firebase no está configurado.");
    }

    const cleanUsername = username.trim();
    if (cleanUsername.length < 3) {
        throw new Error("El nombre de usuario debe tener al menos 3 caracteres.");
    }
    if (cleanUsername.length > 20) {
        throw new Error("El nombre de usuario no puede superar los 20 caracteres.");
    }

    const lowerName = cleanUsername.toLowerCase();

    // 1. Verificar si el nombre de usuario ya está tomado en Firestore
    const usernameDocRef = doc(db, 'usernames', lowerName);
    const usernameDoc = await getDoc(usernameDocRef);
    if (usernameDoc.exists()) {
        throw new Error("Ese nombre de usuario ya está en uso. Por favor elige otro.");
    }

    // 2. Crear cuenta en Firebase Auth
    const email = usernameToEmail(cleanUsername);
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const uid = userCredential.user.uid;

    // 3. Crear Perfil completo
    const profile = {
        id: uid,
        name: cleanUsername,
        avatar: initialProfile.avatar || `https://api.dicebear.com/7.x/thumbs/svg?seed=${encodeURIComponent(cleanUsername)}`,
        nameColor: initialProfile.nameColor || '#00f3ff',
        description: initialProfile.description || 'Explorando jueguitos piola.',
        favoriteGame: initialProfile.favoriteGame || 'Juegos Retro',
        createdAt: serverTimestamp()
    };

    // 4. Guardar en /users/{uid} y reservar en /usernames/{lowerName} en paralelo
    await Promise.all([
        setDoc(doc(db, 'users', uid), profile),
        setDoc(usernameDocRef, { uid, username: cleanUsername, createdAt: serverTimestamp() })
    ]);

    // 5. Guardar en LocalStorage y notificar
    const localData = { ...profile, createdAt: Date.now() };
    localStorage.setItem('piola_chat_profile', JSON.stringify(localData));
    window.dispatchEvent(new CustomEvent('piola_profile_updated', { detail: localData }));

    return localData;
};

/**
 * Iniciar sesión con Google OAuth
 */
export const loginWithGoogle = async () => {
    if (!isFirebaseConfigured || !auth || !googleProvider || !db) {
        throw new Error("Firebase no está configurado.");
    }

    const result = await signInWithPopup(auth, googleProvider);
    const user = result.user;
    const uid = user.uid;

    const userDocRef = doc(db, 'users', uid);
    const userDoc = await getDoc(userDocRef);

    let profileData;
    if (userDoc.exists()) {
        profileData = userDoc.data();
    } else {
        const baseName = user.displayName || 'GamerPiola';
        profileData = {
            id: uid,
            name: baseName,
            avatar: user.photoURL || `https://api.dicebear.com/7.x/thumbs/svg?seed=${encodeURIComponent(baseName)}`,
            nameColor: '#ffd700',
            description: 'Jugador de jueguitos piola con Google',
            favoriteGame: 'Retro Hits',
            email: user.email,
            createdAt: serverTimestamp()
        };
        await setDoc(userDocRef, profileData);
    }

    localStorage.setItem('piola_chat_profile', JSON.stringify(profileData));
    window.dispatchEvent(new CustomEvent('piola_profile_updated', { detail: profileData }));
    return profileData;
};

/**
 * Actualizar perfil de usuario existente
 */
export const updateUserProfileData = async (uid, updatedFields) => {
    if (!isFirebaseConfigured || !db) {
        // Modo local/offline
        const current = JSON.parse(localStorage.getItem('piola_chat_profile') || '{}');
        const next = { ...current, ...updatedFields };
        localStorage.setItem('piola_chat_profile', JSON.stringify(next));
        window.dispatchEvent(new CustomEvent('piola_profile_updated', { detail: next }));
        return next;
    }

    const userDocRef = doc(db, 'users', uid);
    await updateDoc(userDocRef, {
        ...updatedFields,
        updatedAt: serverTimestamp()
    });

    const current = JSON.parse(localStorage.getItem('piola_chat_profile') || '{}');
    const next = { ...current, ...updatedFields };
    localStorage.setItem('piola_chat_profile', JSON.stringify(next));
    window.dispatchEvent(new CustomEvent('piola_profile_updated', { detail: next }));
    return next;
};

/**
 * Cerrar sesión
 */
export const logoutUser = async () => {
    if (auth) {
        await signOut(auth);
    }
    localStorage.removeItem('piola_chat_profile');
    window.dispatchEvent(new CustomEvent('piola_profile_updated', { detail: null }));
};

/**
 * Obtener perfil de usuario por UID
 */
export const fetchUserProfile = async (uid) => {
    if (!isFirebaseConfigured || !db || !uid) return null;
    const snap = await getDoc(doc(db, 'users', uid));
    return snap.exists() ? snap.data() : null;
};

/**
 * Escuchar cambios en el estado de autenticación
 */
export const onAuthChange = (callback) => {
    if (!isFirebaseConfigured || !auth) {
        callback(null);
        return () => {};
    }
    return onAuthStateChanged(auth, callback);
};

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
        text: text.substring(0, 300),
        type: isImageLink ? 'image' : 'text',
        authorId: userProfile.id || 'anonymous',
        authorName: userProfile.name || 'Invitado',
        authorAvatar: userProfile.avatar || `https://api.dicebear.com/7.x/thumbs/svg?seed=${encodeURIComponent(userProfile.name || 'Invitado')}`,
        authorColor: userProfile.nameColor || '#00f3ff',
        createdAt: serverTimestamp()
    });
};
