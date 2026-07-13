import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { isFirebaseConfigured, sendChatMessage } from '../services/firebase';
import { useChatMessages } from '../hooks/useChatMessages';

export const ChatWidget = () => {
    const [isOpen, setIsOpen] = useState(false);
    const [messageText, setMessageText] = useState('');
    
    // Perfil local por defecto o leído de localStorage
    const [userProfile, setUserProfile] = useState(() => {
        try {
            const stored = localStorage.getItem('piola_chat_profile');
            if (stored) {
                return JSON.parse(stored);
            }
        } catch (e) {
            console.error('Error al leer piola_chat_profile', e);
        }
        return {
            id: 'user_local_sketch',
            name: 'Invitado',
            avatar: 'https://api.dicebear.com/7.x/thumbs/svg?seed=Invitado',
            nameColor: '#ffd700',
            description: 'Explorando jueguitos piola.'
        };
    });

    // Suscripción a Mensajes de Firebase (solo activa si isOpen es true)
    const { messages: dbMessages, loading: dbLoading } = useChatMessages(isOpen);

    // Fallback: Mensajes locales para modo Demo
    const [localMessages, setLocalMessages] = useState([
        {
            id: 'm1',
            text: '¡Buenas! ¿Alguien para jugar unas partidas hoy?',
            type: 'text',
            authorName: 'Carlos',
            authorAvatar: 'https://api.dicebear.com/7.x/thumbs/svg?seed=Carlos',
            authorColor: '#00f3ff',
            time: '12:30'
        },
        {
            id: 'm2',
            text: '¡Esta web de juegos retro está re piola! Agregué varios a favoritos.',
            type: 'text',
            authorName: 'Ana',
            authorAvatar: 'https://api.dicebear.com/7.x/thumbs/svg?seed=Ana',
            authorColor: '#ff3b30',
            time: '12:32'
        },
        {
            id: 'm3',
            text: '¿Ya desbloquearon el logro de "Sos Re Pesado"? Jaja no dejen en paz al logo.',
            type: 'text',
            authorName: 'GamerPro',
            authorAvatar: 'https://api.dicebear.com/7.x/thumbs/svg?seed=GamerPro',
            authorColor: '#00ff88',
            time: '12:35'
        }
    ]);

    // Elegir los mensajes activos según la configuración
    const activeMessages = isFirebaseConfigured ? dbMessages : localMessages;

    const messagesContainerRef = useRef(null);
    const prevIsOpen = useRef(isOpen);
    const prevMessagesCount = useRef(activeMessages.length);

    // Gestión del Scroll: Salto instantáneo al abrir, scroll suave en nuevos mensajes
    useEffect(() => {
        if (isOpen) {
            const justOpened = !prevIsOpen.current;
            const hasNewMessage = activeMessages.length > prevMessagesCount.current;

            if (justOpened) {
                // Ir instantáneamente al fondo sin animación al abrir el chat
                if (messagesContainerRef.current) {
                    messagesContainerRef.current.scrollTop = messagesContainerRef.current.scrollHeight;
                }
                
                // Guardar marca de último leído
                localStorage.setItem('piola_chat_last_read', Date.now().toString());
            } else if (hasNewMessage) {
                // Hacer scroll suave solo cuando entra un nuevo mensaje mientras está abierto
                if (messagesContainerRef.current) {
                    messagesContainerRef.current.scrollTo({
                        top: messagesContainerRef.current.scrollHeight,
                        behavior: 'smooth'
                    });
                }
            }
        }
        
        prevIsOpen.current = isOpen;
        prevMessagesCount.current = activeMessages.length;
    }, [isOpen, activeMessages]);

    // Recargar perfil local si cambia
    useEffect(() => {
        const handleProfileChange = () => {
            try {
                const stored = localStorage.getItem('piola_chat_profile');
                if (stored) {
                    setUserProfile(JSON.parse(stored));
                }
            } catch (e) {
                console.error(e);
            }
        };

        window.addEventListener('storage', handleProfileChange);
        window.addEventListener('piola_profile_updated', handleProfileChange);
        
        return () => {
            window.removeEventListener('storage', handleProfileChange);
            window.removeEventListener('piola_profile_updated', handleProfileChange);
        };
    }, []);

    const handleSendMessage = async (e) => {
        e.preventDefault();
        const trimmed = messageText.trim();
        if (!trimmed) return;

        if (trimmed.length > 300) {
            alert('El mensaje no puede superar los 300 caracteres.');
            return;
        }

        setMessageText('');

        if (isFirebaseConfigured) {
            try {
                await sendChatMessage(trimmed, userProfile);
            } catch (err) {
                console.error("Error al enviar mensaje a Firebase:", err);
            }
        } else {
            // Lógica local fallback (Demo)
            const now = new Date();
            const timeString = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
            
            const isImageLink = /(https?:\/\/.*?\.(?:png|jpg|jpeg|gif|webp|svg)(?:\?.*)?)/i.test(trimmed) || 
                                /(?:giphy\.com|tenor\.com)\/view/i.test(trimmed) ||
                                /media\d*\.giphy\.com/i.test(trimmed);

            const newMsg = {
                id: `m_local_${Date.now()}`,
                text: trimmed,
                type: isImageLink ? 'image' : 'text',
                authorName: userProfile.name,
                authorAvatar: userProfile.avatar || `https://api.dicebear.com/7.x/thumbs/svg?seed=${encodeURIComponent(userProfile.name)}`,
                authorColor: userProfile.nameColor || '#ffd700',
                time: timeString
            };

            setLocalMessages((prev) => [...prev, newMsg]);

            // Simular respuesta de bot
            setTimeout(() => {
                const botReplies = [
                    "¡Alto mensaje! Cuando esté listo Firebase, esto se sincronizará en tiempo real con todos.",
                    "Esa es la actitud retro 🕹️",
                    "¡Buenísima! Seguí probando los minijuegos mientras tanto.",
                    "Jajaja de una.",
                    "¡Qué piola!"
                ];
                const randomReply = botReplies[Math.floor(Math.random() * botReplies.length)];
                
                const botMsg = {
                    id: `m_bot_${Date.now()}`,
                    text: randomReply,
                    type: 'text',
                    authorName: 'PiolaBot',
                    authorAvatar: 'https://api.dicebear.com/7.x/thumbs/svg?seed=PiolaBot',
                    authorColor: '#a855f7',
                    time: (() => {
                        const d = new Date();
                        return `${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}`;
                    })()
                };
                setLocalMessages((prev) => [...prev, botMsg]);
            }, 1500);
        }
    };

    return (
        <>
            {/* Botón de Chat (Toggle) */}
            <button 
                className={`chat-widget-toggle ${isOpen ? 'active' : ''}`}
                onClick={() => setIsOpen(!isOpen)}
                aria-label={isOpen ? "Cerrar chat" : "Abrir chat"}
            >
                {isOpen ? (
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <line x1="18" y1="6" x2="6" y2="18"></line>
                        <line x1="6" y1="6" x2="18" y2="18"></line>
                    </svg>
                ) : (
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
                    </svg>
                )}
                <span>Chat</span>
            </button>

            {/* Panel de Chat */}
            <AnimatePresence>
                {isOpen && (
                    <motion.div 
                        className="chat-widget-panel"
                        initial={{ opacity: 0, scale: 0.96, y: 20, transformOrigin: "bottom left" }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.96, y: 20 }}
                        transition={{ ease: [0.16, 1, 0.3, 1], duration: 0.45 }}
                    >
                        {/* Cabecera del Panel */}
                        <div className="chat-panel-header">
                            <div className="chat-panel-title-container">
                                <h3 className="chat-panel-title">
                                    {isFirebaseConfigured ? 'Piola Chat' : 'Piola Chat (Demo)'}
                                </h3>
                            </div>
                            <button 
                                className="chat-panel-close"
                                onClick={() => setIsOpen(false)}
                                aria-label="Cerrar chat"
                            >
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <line x1="18" y1="6" x2="6" y2="18"></line>
                                    <line x1="6" y1="6" x2="18" y2="18"></line>
                                </svg>
                            </button>
                        </div>

                        {/* Contenedor de Mensajes */}
                        <div 
                            className="chat-panel-messages"
                            ref={messagesContainerRef}
                        >
                            {isFirebaseConfigured && dbLoading ? (
                                <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%', fontFamily: 'Space Mono, monospace', fontSize: '0.8rem', color: 'rgba(255,255,255,0.4)' }}>
                                    Cargando mensajes...
                                </div>
                            ) : (
                                activeMessages.map((msg) => {
                                    const isMe = msg.authorId === userProfile.id || msg.authorName === userProfile.name;
                                    return (
                                        <div 
                                            key={msg.id} 
                                            className={`chat-message-container ${isMe ? 'chat-me' : 'chat-other'}`}
                                        >
                                            <div className="chat-message-avatar">
                                                <img 
                                                    src={msg.authorAvatar} 
                                                    alt={`Avatar de ${msg.authorName}`} 
                                                    loading="lazy"
                                                />
                                            </div>
                                            <div className="chat-message-bubble">
                                                <div className="chat-message-header">
                                                    <span 
                                                        className="chat-message-author"
                                                        style={{ color: msg.authorColor }}
                                                    >
                                                        {msg.authorName}
                                                    </span>
                                                    <span className="chat-message-time">{msg.time}</span>
                                                </div>
                                                <div className="chat-message-text">
                                                    {msg.type === 'image' ? (
                                                        <img 
                                                            src={msg.text} 
                                                            alt="Contenido multimedia" 
                                                            style={{ 
                                                                maxWidth: '100%', 
                                                                maxHeight: '220px', 
                                                                borderRadius: '8px', 
                                                                marginTop: '6px',
                                                                display: 'block',
                                                                objectFit: 'contain'
                                                            }}
                                                            loading="lazy"
                                                            onError={(e) => {
                                                                // Fallback si la imagen falla en cargar: mostrar enlace de texto
                                                                e.target.style.display = 'none';
                                                                const fallbackText = document.createElement('span');
                                                                fallbackText.innerText = msg.text;
                                                                fallbackText.style.wordBreak = 'break-word';
                                                                e.target.parentNode.appendChild(fallbackText);
                                                            }}
                                                        />
                                                    ) : (
                                                        msg.text
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })
                            )}
                        </div>

                        {/* Input de Envío */}
                        <form className="chat-panel-input-form" onSubmit={handleSendMessage}>
                            <input
                                type="text"
                                className="chat-panel-input"
                                placeholder={isFirebaseConfigured ? "Escribe un mensaje piola..." : "Modo demo activa..."}
                                value={messageText}
                                onChange={(e) => setMessageText(e.target.value)}
                                maxLength={300}
                                aria-label="Texto del mensaje"
                            />
                            <button 
                                type="submit" 
                                className="chat-panel-send-btn"
                                aria-label="Enviar mensaje"
                            >
                                <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                    <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"/>
                                </svg>
                            </button>
                        </form>
                    </motion.div>
                )}
            </AnimatePresence>
        </>
    );
};
