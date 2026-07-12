import { initializeApp, getApps, getApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
    apiKey: "AIzaSyDcO_CpJ4x8DK2_t-obafVM0m2Pu9cKGWM",
    authDomain: "jueguitos-piola.firebaseapp.com",
    projectId: "jueguitos-piola",
    storageBucket: "jueguitos-piola.firebasestorage.app",
    messagingSenderId: "372800075568",
    appId: "1:372800075568:web:80e91799d1340d1a85faf5"
};

// Inicializar Firebase
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
const db = getFirestore(app);

export { db };
