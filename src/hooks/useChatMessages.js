import { useState, useEffect, useRef } from 'react';
import { 
    collection, 
    query, 
    orderBy, 
    limit, 
    onSnapshot 
} from 'firebase/firestore';
import { db, isFirebaseConfigured } from '../services/firebase';

// Caché global en memoria para carga instantánea (0ms)
let cachedMessages = [];
let cachedUsersMap = {};

/**
 * Hook optimizado para suscribirse en tiempo real a los mensajes del chat
 * y a los perfiles actualizados de los usuarios para reflejar avatares y colores en vivo
 */
export const useChatMessages = (isOpen) => {
    const [messages, setMessages] = useState(() => cachedMessages);
    const [usersMap, setUsersMap] = useState(() => cachedUsersMap);
    const [loading, setLoading] = useState(() => isFirebaseConfigured && cachedMessages.length === 0);
    const [error, setError] = useState(null);
    const isMountedRef = useRef(true);

    useEffect(() => {
        isMountedRef.current = true;
        if (!isFirebaseConfigured || !db) {
            setLoading(false);
            return;
        }

        try {
            // 1. Suscripción en tiempo real a los 80 mensajes más recientes
            const q = query(
                collection(db, 'messages'),
                orderBy('createdAt', 'desc'),
                limit(80)
            );

            const unsubscribeMessages = onSnapshot(q, (snapshot) => {
                const fetchedMessages = snapshot.docs.map((doc) => {
                    const data = doc.data();
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
                        description: data.description,
                        favoriteGame: data.favoriteGame,
                        time: timeString,
                        createdAt: date
                    };
                });

                const ordered = fetchedMessages.reverse();
                cachedMessages = ordered;
                if (isMountedRef.current) {
                    setMessages(ordered);
                    setLoading(false);
                }
            }, (err) => {
                console.error("Error en tiempo real de Firestore (messages):", err);
                if (isMountedRef.current) {
                    setError(err);
                    setLoading(false);
                }
            });

            // 2. Suscripción en tiempo real a los perfiles de usuarios para actualizar fotos/colores para todos
            const unsubscribeUsers = onSnapshot(collection(db, 'users'), (snapshot) => {
                const map = {};
                snapshot.forEach((doc) => {
                    const data = doc.data();
                    map[doc.id] = {
                        id: doc.id,
                        name: data.name,
                        avatar: data.avatar,
                        nameColor: data.nameColor,
                        description: data.description,
                        favoriteGame: data.favoriteGame
                    };
                });

                cachedUsersMap = map;
                if (isMountedRef.current) {
                    setUsersMap(map);
                }
            }, (err) => {
                console.warn("Aviso: no se pudo sincronizar directorio de usuarios:", err);
            });

            return () => {
                isMountedRef.current = false;
                unsubscribeMessages();
                unsubscribeUsers();
            };
        } catch (err) {
            console.error("Error al suscribirse a Firestore:", err);
            if (isMountedRef.current) {
                setError(err);
                setLoading(false);
            }
        }
    }, []);

    return { messages, usersMap, loading, error };
};
