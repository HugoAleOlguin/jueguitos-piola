import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { isFirebaseConfigured, sendChatMessage } from '../services/firebase';
import { useChatMessages } from '../hooks/useChatMessages';
import { useAuth } from '../context/AuthContext';
import { generateRandomAvatar } from './ui/AvatarSelector';
import { UserProfileViewModal } from './UserProfileViewModal';
import { ChatMessageMedia } from './ui/ChatMessageMedia';
import { 
    getDateSeparatorLabel, 
    isSameDay, 
    shouldGroupMessage, 
    renderFormattedText 
} from '../utils/chatFormatters';

const CHAT_TIPS = [
    "Pega un enlace de foto o GIF para enviarlo directo.",
    "Usa *negrita*, _cursiva_ o `código` en tu texto.",
    "Haz clic en la foto o nombre de un usuario para ver su perfil.",
    "Haz clic en tu apodo arriba para personalizar tu avatar y color."
];

export const ChatWidget = () => {
    const [isOpen, setIsOpen] = useState(false);
    const [messageText, setMessageText] = useState('');
    const [tipIndex, setTipIndex] = useState(0);
    const [selectedUserProfile, setSelectedUserProfile] = useState(null);
    const [showTips, setShowTips] = useState(() => {
        try {
            return localStorage.getItem('piola_chat_show_tips') !== 'false';
        } catch (e) {
            return true;
        }
    });

    const toggleTips = () => {
        setShowTips((prev) => {
            const nextVal = !prev;
            try {
                localStorage.setItem('piola_chat_show_tips', String(nextVal));
            } catch (e) {}
            return nextVal;
        });
    };
    
    const { 
        userProfile, 
        isAuthenticated, 
        openLogin, 
        openProfile 
    } = useAuth();

    // Suscripción a Mensajes y Directorio de Usuarios en tiempo real de Firebase
    const { messages: dbMessages, usersMap = {}, loading: dbLoading } = useChatMessages(isOpen);

    // Fallback: Mensajes locales para modo Demo
    const [localMessages, setLocalMessages] = useState([
        {
            id: 'm1',
            text: 'Buenas. Alguien para jugar unas partidas hoy?',
            type: 'text',
            authorName: 'Carlos',
            authorAvatar: generateRandomAvatar('Carlos'),
            authorColor: '#00f3ff',
            time: '12:30',
            description: 'Jugador de estrategia y arcades.',
            favoriteGame: 'Age of Empires, Doom',
            createdAt: new Date(Date.now() - 3600000)
        },
        {
            id: 'm2',
            text: 'Esta web de juegos esta excelente. Agregue varios a favoritos.',
            type: 'text',
            authorName: 'Ana',
            authorAvatar: generateRandomAvatar('Ana'),
            authorColor: '#ff007f',
            time: '12:32',
            description: 'Fan de los plataformas retro y pixel art.',
            favoriteGame: 'Super Mario World, Celeste',
            createdAt: new Date(Date.now() - 3400000)
        },
        {
            id: 'm3',
            text: 'Ya completaron la ruleta de juegos?',
            type: 'text',
            authorName: 'GamerPro',
            authorAvatar: generateRandomAvatar('GamerPro'),
            authorColor: '#00ff88',
            time: '12:35',
            description: 'Completando todos los logros.',
            favoriteGame: 'Half-Life, Portal',
            createdAt: new Date(Date.now() - 3200000)
        }
    ]);

    const activeMessages = isFirebaseConfigured ? dbMessages : localMessages;

    const messagesContainerRef = useRef(null);

    // Rotar tips automáticamente cada 12 segundos
    useEffect(() => {
        const interval = setInterval(() => {
            setTipIndex((prev) => (prev + 1) % CHAT_TIPS.length);
        }, 12000);
        return () => clearInterval(interval);
    }, []);

    // Función para desplazarse al fondo
    const scrollToBottom = (behavior = 'smooth') => {
        if (messagesContainerRef.current) {
            messagesContainerRef.current.scrollTo({
                top: messagesContainerRef.current.scrollHeight,
                behavior
            });
        }
    };

    // Auto-scroll al fondo al abrir o recibir mensaje
    useEffect(() => {
        if (isOpen) {
            setTimeout(() => scrollToBottom('auto'), 50);
        }
    }, [isOpen, activeMessages.length]);

    const handleSendMessage = async (e) => {
        e.preventDefault();

        if (!isAuthenticated) {
            openLogin();
            return;
        }

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
                scrollToBottom('smooth');
            } catch (err) {
                console.error("Error al enviar mensaje a Firebase:", err);
            }
        } else {
            const now = new Date();
            const timeString = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
            
            const isImageLink = /(https?:\/\/.*?\.(?:png|jpg|jpeg|gif|webp|svg)(?:\?.*)?)/i.test(trimmed) || 
                                /(?:giphy\.com|tenor\.com)\/view/i.test(trimmed) ||
                                /media\d*\.giphy\.com/i.test(trimmed);

            const newMsg = {
                id: `m_local_${Date.now()}`,
                text: trimmed,
                type: isImageLink ? 'image' : 'text',
                authorName: userProfile?.name || 'Usuario',
                authorAvatar: userProfile?.avatar || generateRandomAvatar('Usuario'),
                authorColor: userProfile?.nameColor || '#00f3ff',
                description: userProfile?.description || 'Jugador en Jueguitos Piola',
                favoriteGame: userProfile?.favoriteGame || 'Juegos Retro',
                time: timeString,
                createdAt: now
            };

            setLocalMessages((prev) => [...prev, newMsg]);
            scrollToBottom('smooth');

            setTimeout(() => {
                const botReplies = [
                    "Mensaje recibido. Conectado con la comunidad.",
                    "Disfruta las partidas y los minijuegos.",
                    "Sincronizando con los servidores en vivo."
                ];
                const randomReply = botReplies[Math.floor(Math.random() * botReplies.length)];
                
                const botMsg = {
                    id: `m_bot_${Date.now()}`,
                    text: randomReply,
                    type: 'text',
                    authorName: 'PiolaBot',
                    authorAvatar: generateRandomAvatar('PiolaBot'),
                    authorColor: '#ffd700',
                    description: 'Asistente automatizado de Jueguitos Piola.',
                    favoriteGame: 'Pac-Man, Space Invaders',
                    time: (() => {
                        const d = new Date();
                        return `${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}`;
                    })(),
                    createdAt: new Date()
                };
                setLocalMessages((prev) => [...prev, botMsg]);
            }, 1200);
        }
    };

    return (
        <>
            {/* Modal de Inspección de Perfil de Usuario */}
            <UserProfileViewModal 
                user={selectedUserProfile}
                onClose={() => setSelectedUserProfile(null)}
            />

            {/* Botón de Chat (Toggle flotante) */}
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
                        transition={{ ease: [0.16, 1, 0.3, 1], duration: 0.35 }}
                    >
                        {/* Cabecera del Panel */}
                        <div className="chat-panel-header">
                            <div className="chat-panel-title-container">
                                <h3 className="chat-panel-title">
                                    Piola Chat
                                </h3>
                            </div>

                            {/* Estado del Usuario en la Cabecera */}
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                {isAuthenticated && userProfile ? (
                                    <button 
                                        type="button"
                                        onClick={openProfile}
                                        title="Editar mi perfil"
                                        style={{
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '6px',
                                            background: 'rgba(255,255,255,0.06)',
                                            border: `1px solid ${userProfile.nameColor || '#00f3ff'}55`,
                                            borderRadius: '20px',
                                            padding: '3px 8px 3px 4px',
                                            color: userProfile.nameColor || '#00f3ff',
                                            fontSize: '0.75rem',
                                            cursor: 'pointer',
                                            transition: 'all 0.2s ease',
                                            fontFamily: 'Space Grotesk, sans-serif'
                                        }}
                                    >
                                        <img 
                                            src={userProfile.avatar} 
                                            alt={userProfile.name}
                                            style={{ width: '20px', height: '20px', borderRadius: '50%', objectFit: 'cover' }}
                                            onError={(e) => {
                                                e.target.src = generateRandomAvatar(userProfile.name);
                                            }}
                                        />
                                        <span style={{ maxWidth: '80px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontWeight: 'bold' }}>
                                            {userProfile.name}
                                        </span>
                                    </button>
                                ) : (
                                    <button
                                        type="button"
                                        onClick={openLogin}
                                        style={{
                                            background: 'rgba(255, 255, 255, 0.08)',
                                            border: '1px solid rgba(255, 255, 255, 0.15)',
                                            borderRadius: '6px',
                                            padding: '4px 10px',
                                            color: '#fff',
                                            fontSize: '0.72rem',
                                            fontWeight: '700',
                                            cursor: 'pointer',
                                            fontFamily: 'Space Grotesk, sans-serif'
                                        }}
                                    >
                                        Entrar
                                    </button>
                                )}

                                <button 
                                    type="button"
                                    className={`chat-panel-tips-toggle ${showTips ? 'active' : ''}`}
                                    onClick={toggleTips}
                                    title={showTips ? "Ocultar consejos" : "Mostrar consejos"}
                                    aria-label={showTips ? "Ocultar consejos" : "Mostrar consejos"}
                                >
                                    <svg width="13" height="13" viewBox="0 0 24 24" fill={showTips ? "#ffd700" : "none"} stroke={showTips ? "#ffd700" : "currentColor"} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                                        <path d="M12 2a7 7 0 0 1 7 7c0 2.38-1.19 4.47-3 5.74V17a2 2 0 0 1-2 2H10a2 2 0 0 1-2-2v-2.26C6.19 13.47 5 11.38 5 9a7 7 0 0 1 7-7z"></path>
                                        <line x1="9" y1="21" x2="15" y2="21"></line>
                                    </svg>
                                </button>

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
                        </div>

                        {/* Contenedor de Mensajes con Divisores de Fecha y Agrupación */}
                        <div 
                            className="chat-panel-messages"
                            ref={messagesContainerRef}
                        >
                            {isFirebaseConfigured && dbLoading && activeMessages.length === 0 ? (
                                <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%', fontFamily: 'Space Mono, monospace', fontSize: '0.8rem', color: 'rgba(255,255,255,0.4)' }}>
                                    Cargando mensajes...
                                </div>
                            ) : (
                                activeMessages.map((msg, index) => {
                                    const prevMsg = index > 0 ? activeMessages[index - 1] : null;
                                    
                                    // 1. Determinar si hay cambio de día para insertar divisor
                                    const isFirstMessage = index === 0;
                                    const hasDateChanged = isFirstMessage || !isSameDay(msg.createdAt || msg.time, prevMsg?.createdAt || prevMsg?.time);
                                    
                                    // 2. Determinar si es un mensaje agrupado con el anterior
                                    const isGrouped = !hasDateChanged && shouldGroupMessage(msg, prevMsg);

                                    const isMe = isAuthenticated && (
                                        (userProfile?.id && msg.authorId === userProfile.id) ||
                                        (userProfile?.name && msg.authorName === userProfile.name)
                                    );

                                    // Perfil reactivo en tiempo real (se actualiza para todos si el autor cambia foto/color)
                                    const liveAuthor = (isMe && userProfile) 
                                        ? userProfile 
                                        : (msg.authorId && usersMap[msg.authorId] ? usersMap[msg.authorId] : null);

                                    const displayAvatar = liveAuthor?.avatar || msg.authorAvatar || generateRandomAvatar(msg.authorName);
                                    const displayColor = liveAuthor?.nameColor || msg.authorColor || '#00f3ff';
                                    const displayName = liveAuthor?.name || msg.authorName || 'Usuario';
                                    const displayBio = liveAuthor?.description || msg.description || 'Explorando jueguitos piola.';
                                    const displayGame = liveAuthor?.favoriteGame || msg.favoriteGame || 'Juegos Retro';

                                    const profilePayload = {
                                        ...msg,
                                        authorName: displayName,
                                        name: displayName,
                                        authorAvatar: displayAvatar,
                                        avatar: displayAvatar,
                                        authorColor: displayColor,
                                        nameColor: displayColor,
                                        description: displayBio,
                                        favoriteGame: displayGame
                                    };

                                    return (
                                        <React.Fragment key={msg.id || index}>
                                            {/* 📅 Divisor de Fecha contextual */}
                                            {hasDateChanged && (
                                                <div className="chat-date-separator">
                                                    <div className="chat-date-separator-line" />
                                                    <div className="chat-date-separator-pill">
                                                        {getDateSeparatorLabel(msg.createdAt || msg.time)}
                                                    </div>
                                                </div>
                                            )}

                                            {/* 💬 Burbuja de Mensaje */}
                                            <div className={`chat-message-container ${isMe ? 'chat-me' : 'chat-other'} ${isGrouped ? 'chat-message-grouped' : ''}`}>
                                                {!isGrouped ? (
                                                    <div 
                                                        className="chat-message-avatar"
                                                        onClick={() => setSelectedUserProfile(profilePayload)}
                                                        title={`Ver perfil de @${displayName}`}
                                                        style={{ cursor: 'pointer', transition: 'transform 0.15s ease' }}
                                                    >
                                                        <img 
                                                            src={displayAvatar} 
                                                            alt={`Avatar de ${displayName}`} 
                                                            loading="lazy"
                                                            onError={(e) => {
                                                                e.target.src = generateRandomAvatar(displayName);
                                                            }}
                                                        />
                                                    </div>
                                                ) : (
                                                    <div className="chat-message-avatar-placeholder" />
                                                )}

                                                <div className="chat-message-bubble">
                                                    {!isGrouped && (
                                                        <div className="chat-message-header">
                                                            <span 
                                                                className="chat-message-author"
                                                                onClick={() => setSelectedUserProfile(profilePayload)}
                                                                title={`Ver perfil de @${displayName}`}
                                                                style={{ 
                                                                    color: displayColor,
                                                                    cursor: 'pointer',
                                                                    textDecoration: 'none'
                                                                }}
                                                            >
                                                                {displayName}
                                                            </span>
                                                            <span className="chat-message-time">{msg.time}</span>
                                                        </div>
                                                    )}

                                                    <div className="chat-message-text">
                                                        {msg.type === 'image' ? (
                                                            <ChatMessageMedia 
                                                                src={msg.text} 
                                                                alt={`Multimedia de ${displayName}`} 
                                                                isGrouped={isGrouped} 
                                                            />
                                                        ) : (
                                                            renderFormattedText(msg.text)
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        </React.Fragment>
                                    );
                                })
                            )}
                        </div>

                        {/* 💡 Banner de Tips Sutiles (Ocultable / Mostrable) */}
                        {showTips && (
                            <div className="chat-tip-banner">
                                <div className="chat-tip-content">
                                    <span className="chat-tip-tag">Tip:</span>
                                    <span>{CHAT_TIPS[tipIndex]}</span>
                                </div>
                                <div className="chat-tip-actions">
                                    <button 
                                        type="button" 
                                        className="chat-tip-next-btn"
                                        onClick={() => setTipIndex((prev) => (prev + 1) % CHAT_TIPS.length)}
                                        title="Siguiente consejo"
                                    >
                                        ❯
                                    </button>
                                    <button 
                                        type="button" 
                                        className="chat-tip-close-btn"
                                        onClick={toggleTips}
                                        title="Ocultar consejos"
                                        aria-label="Ocultar consejos"
                                    >
                                        ✕
                                    </button>
                                </div>
                            </div>
                        )}

                        {/* Barra de Envío / Modo Invitado */}
                        {!isAuthenticated ? (
                            <div 
                                className="chat-panel-guest-cta"
                                onClick={openLogin}
                                title="Haz clic para iniciar sesión o crear cuenta"
                            >
                                <div className="chat-guest-input-box">
                                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                                        <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
                                        <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
                                    </svg>
                                    <span>Inicia sesión para escribir...</span>
                                </div>
                                <button
                                    type="button"
                                    className="chat-guest-action-btn"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        openLogin();
                                    }}
                                >
                                    Entrar
                                </button>
                            </div>
                        ) : (
                            <form className="chat-panel-input-form" onSubmit={handleSendMessage}>
                                <input
                                    type="text"
                                    className="chat-panel-input"
                                    placeholder={`Escribe como @${userProfile?.name || 'Usuario'}...`}
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
                        )}
                    </motion.div>
                )}
            </AnimatePresence>
        </>
    );
};
