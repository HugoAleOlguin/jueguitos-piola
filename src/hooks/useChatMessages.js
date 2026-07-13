import { useState, useEffect } from 'react';
import { 
    collection, 
    query, 
    orderBy, 
    limit, 
    onSnapshot 
} from 'firebase/firestore';
import { db, isFirebaseConfigured } from '../services/firebase';

/**
 * Hook optimizado para suscribirse en tiempo real a los últimos 80 mensajes del chat
 * Solo activa el listener de Firestore si el chat está abierto (isOpen === true)
 * @param {boolean} isOpen - Estado de apertura del chat widget
 * @returns {object} - { messages, loading, error }
 */
export const useChatMessages = (isOpen) => {
    const [messages, setMessages] = useState([]);
    const [loading, setLoading] = useState(isFirebaseConfigured && isOpen);
    const [error, setError] = useState(null);

    useEffect(() => {
        // Si Firebase no está configurado, o el chat está cerrado, cancelamos cualquier escucha activa
        if (!isFirebaseConfigured || !db || !isOpen) {
            setLoading(false);
            return;
        }

        setLoading(true);
        setError(null);

        try {
            // Consulta optimizada para obtener los 80 mensajes más recientes
            const q = query(
                collection(db, 'messages'),
                orderBy('createdAt', 'desc'),
                limit(80)
            );

            // Escuchar cambios en tiempo real
            const unsubscribe = onSnapshot(q, (snapshot) => {
                const fetchedMessages = snapshot.docs.map((doc) => {
                    const data = doc.data();
                    
                    // Convertir Timestamp de Firestore a Date
                    const date = data.createdAt ? data.createdAt.toDate() : new Date();
                    const timeString = `${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`;

                    return {
                        id: doc.id,
                        text: data.text,
                        type: data.type || 'text',
                        authorId: data.authorId,
                        authorName: data.authorName,
                        authorAvatar: data.authorAvatar,
                        authorColor: data.authorColor,
                        time: timeString
                    };
                });

                // Invertimos el orden para mostrarlos de más antiguo a más reciente
                setMessages(fetchedMessages.reverse());
                setLoading(false);
            }, (err) => {
                console.error("Error en tiempo real de Firestore:", err);
                setError(err);
                setLoading(false);
            });

            // Función de limpieza para anular suscripción al cerrar el chat o desmontar
            return () => unsubscribe();
        } catch (err) {
            console.error("Error al iniciar suscripción a Firestore:", err);
            setError(err);
            setLoading(false);
        }
    }, [isOpen]); // Re-ejecutar al abrir/cerrar el chat

    return { messages, loading, error };
};
