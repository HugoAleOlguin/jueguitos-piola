import { useState, useEffect, useRef } from 'react';
import { 
    collection, 
    query, 
    orderBy, 
    limit, 
    onSnapshot 
} from 'firebase/firestore';
import { db, isFirebaseConfigured } from '../services/firebase';

// Cache global en memoria para carga instantanea (0ms)
let cachedMessages = [];
let cachedUsersMap = {};

/**
 * Hook optimizado para suscribirse en tiempo real a los mensajes del chat
 * Consume unicamente los ultimos 60 mensajes y extrae los perfiles de los autores
 * presentes, eliminando la descarga masiva de la coleccion completa de usuarios.
 */
export const useChatMessages = (isOpen) => {
    const [messages, setMessages] = useState(() => cachedMessages);
    const [usersMap, setUsersMap] = useState(() => cachedUsersMap);
    const [loading, setLoading] = useState(() => isFirebaseConfigured && cachedMessages.length === 0);
    const [error, setError] = useState(null);
    const isMountedRef = useRef(true);

    useEffect(() => {
        isMountedRef.current = true;
        
        // Si Firebase no esta configurado, o si el chat esta cerrado y ya tenemos cache, pausamos el listener
        if (!isFirebaseConfigured || !db || (!isOpen && cachedMessages.length > 0)) {
            setLoading(false);
            return;
        }

        let unsubscribe = () => {};

        try {
            // Suscripcion en tiempo real acotada a los 60 mensajes mas recientes
            const q = query(
                collection(db, 'messages'),
                orderBy('createdAt', 'desc'),
                limit(60)
            );

            unsubscribe = onSnapshot(q, (snapshot) => {
                const map = { ...cachedUsersMap };
                const fetchedMessages = snapshot.docs.map((docSnap) => {
                    const data = docSnap.data();
                    const date = data.createdAt ? data.createdAt.toDate() : new Date();
                    const hours = date.getHours().toString().padStart(2, '0');
                    const minutes = date.getMinutes().toString().padStart(2, '0');
                    const timeString = `${hours}:${minutes}`;

                    // Registrar perfil del autor directamente desde el mensaje sin consultar colecciones ajenas
                    if (data.authorId && data.authorId !== 'anonymous') {
                        map[data.authorId] = {
                            id: data.authorId,
                            name: data.authorName,
                            avatar: data.authorAvatar,
                            nameColor: data.authorColor,
                            description: data.description,
                            favoriteGame: data.favoriteGame
                        };
                    }

                    return {
                        id: docSnap.id,
                        text: data.text,
                        type: data.type || 'text',
                        authorId: data.authorId,
                        authorName: data.authorName,
                        authorAvatar: data.authorAvatar,
                        authorColor: data.authorColor,
                        description: data.description,
                        favoriteGame: data.favoriteGame,
                        time: timeString,
                        createdAt: date
                    };
                });

                const ordered = fetchedMessages.reverse();
                cachedMessages = ordered;
                cachedUsersMap = map;

                if (isMountedRef.current) {
                    setMessages(ordered);
                    setUsersMap(map);
                    setLoading(false);
                }
            }, (err) => {
                console.error("Error en tiempo real de Firestore (messages):", err);
                if (isMountedRef.current) {
                    setError(err);
                    setLoading(false);
                }
            });
        } catch (err) {
            console.error("Error al inicializar suscripcion a Firestore:", err);
            if (isMountedRef.current) {
                setError(err);
                setLoading(false);
            }
        }

        return () => {
            isMountedRef.current = false;
            unsubscribe();
        };
    }, [isOpen]);

    return { messages, usersMap, loading, error };
};
