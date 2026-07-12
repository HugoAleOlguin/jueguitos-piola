import React, { useState, useEffect, useRef } from 'react';
import { db } from '../services/firebase';
import { 
    collection, 
    addDoc, 
    onSnapshot, 
    query, 
    orderBy, 
    limit, 
    doc, 
    setDoc, 
    serverTimestamp 
} from 'firebase/firestore';
import { Send, MessageSquare, Gamepad2 } from 'lucide-react';
import { gamesData } from '../data/gamesData';

const CHAT_PROFILE_KEY = 'piola_chat_profile';
const CHAT_LAYOUT_KEY = 'piola_chat_layout';
const DEFAULT_NAME_COLOR = '#00f3ff';
const DEFAULT_AVATAR = 'https://api.dicebear.com/7.x/thumbs/svg?seed=default';
const MAX_MSG_LENGTH = 300;
const MSG_LOAD_LIMIT = 80;

// placeholder

// Helper para ID aleatorio de usuario
const generateId = () => {
    return 'user_' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
};

// Helper para avatar de Dicebear
const getDefaultAvatar = (name) => {
    return `https://api.dicebear.com/7.x/thumbs/svg?seed=${encodeURIComponent(name || 'anon')}`;
};

// Helper robusto para obtener milisegundos de cualquier marca de tiempo de Firestore/Date
const getTimestampMillis = (createdAt) => {
    if (!createdAt) return Date.now();
    if (typeof createdAt.toMillis === 'function') return createdAt.toMillis();
    if (createdAt.seconds) return createdAt.seconds * 1000;
    if (createdAt instanceof Date) return createdAt.getTime();
    if (typeof createdAt === 'number') return createdAt;
    const parsed = Date.parse(createdAt);
    return isNaN(parsed) ? Date.now() : parsed;
};

// Helper para saber si un texto es URL de imagen/GIF
const isImageUrl = (text) => {
    if (!text || typeof text !== 'string') return false;
    const trimmed = text.trim();
    if (!trimmed.startsWith('http')) return false;

    const imageExtensions = /\.(gif|png|jpg|jpeg|webp)(\?.*)?$/i;
    if (imageExtensions.test(trimmed)) return true;

    const gifDomains = ['tenor.com', 'media.tenor.com', 'giphy.com', 'media.giphy.com', 'i.imgur.com'];
    try {
        const url = new URL(trimmed);
        return gifDomains.some(domain => url.hostname.endsWith(domain));
    } catch {
        return false;
    }
};

export const PiolaChat = () => {
    const [profile, setProfile] = useState(() => {
        try {
            const raw = localStorage.getItem(CHAT_PROFILE_KEY);
            return raw ? JSON.parse(raw) : null;
        } catch {
            return null;
        }
    });

    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState([]);
    const [onlineUsers, setOnlineUsers] = useState(new Map());
    const [unreadCount, setUnreadCount] = useState(0);
    const [inputText, setInputText] = useState('');

    // Estados para el perfil modal (Visualización)
    const [selectedUserId, setSelectedUserId] = useState(null);
    const [isEditingProfile, setIsEditingProfile] = useState(false);

    // Estados locales para la configuración del perfil (Setup/Edit)
    const [setupName, setSetupName] = useState('');
    const [setupAvatar, setSetupAvatar] = useState('');
    const [setupColor, setSetupColor] = useState(DEFAULT_NAME_COLOR);
    const [setupBio, setSetupBio] = useState('');
    const [setupFavGame, setSetupFavGame] = useState('');

    const panelRef = useRef(null);
    const messagesEndRef = useRef(null);

    // Inicializar inputs del perfil al editar
    useEffect(() => {
        if (profile) {
            setSetupName(profile.name || '');
            setSetupAvatar(profile.avatar || '');
            setSetupColor(profile.nameColor || DEFAULT_NAME_COLOR);
            setSetupBio(profile.description || '');
            setSetupFavGame(profile.favoriteGame || '');
        }
    }, [profile, isEditingProfile]);

    // Persistencia y Presencia en tiempo real
    useEffect(() => {
        if (!profile || !db) return;

        // Registrar presencia inicial (online)
        const userDocRef = doc(db, 'users', profile.id);
        const setOnline = async () => {
            try {
                await setDoc(userDocRef, {
                    id: profile.id,
                    name: profile.name,
                    avatar: profile.avatar,
                    nameColor: profile.nameColor || DEFAULT_NAME_COLOR,
                    description: profile.description || '',
                    favoriteGame: profile.favoriteGame || '',
                    online: true,
                    lastSeen: serverTimestamp()
                }, { merge: true });
            } catch (e) {
                console.error('[PiolaChat] Error updating presence:', e);
            }
        };

        setOnline();

        // Heartbeat cada 60s
        const heartbeatId = setInterval(setOnline, 60000);

        // Registrar offline al salir/desmontar
        const handleUnload = () => {
            // Nota: Firebase v9 setDoc en beforeunload puede fallar si es async, pero intentamos lo mejor
            setDoc(userDocRef, { online: false, lastSeen: serverTimestamp() }, { merge: true });
        };
        window.addEventListener('beforeunload', handleUnload);

        return () => {
            clearInterval(heartbeatId);
            window.removeEventListener('beforeunload', handleUnload);
            // Intentar marcar offline en desmontaje
            setDoc(userDocRef, { online: false, lastSeen: serverTimestamp() }, { merge: true });
        };
    }, [profile]);

    // Suscripción a Mensajes y Usuarios
    useEffect(() => {
        if (!profile || !db) return;

        // 1. Snapshot de mensajes
        const qMessages = query(
            collection(db, 'messages'),
            orderBy('createdAt', 'asc'),
            limit(MSG_LOAD_LIMIT)
        );

        const unsubscribeMsg = onSnapshot(qMessages, (snapshot) => {
            const list = [];
            snapshot.forEach(doc => {
                list.push({ id: doc.id, ...doc.data() });
            });
            setMessages(list);

            // Manejo de badges no leídos
            let lastRead = parseInt(localStorage.getItem('piola_chat_last_read') || '0', 10);
            if (isOpen) {
                lastRead = Date.now();
                localStorage.setItem('piola_chat_last_read', lastRead.toString());
                setUnreadCount(0);
            } else {
                const unreadList = list.filter(m => {
                    if (m.authorId === profile.id) return false;
                    const time = getTimestampMillis(m.createdAt);
                    return time > lastRead;
                });
                setUnreadCount(unreadList.length);
            }
        });

        // 2. Snapshot de usuarios
        const unsubscribeUsers = onSnapshot(collection(db, 'users'), (snapshot) => {
            const map = new Map();
            snapshot.forEach(doc => {
                map.set(doc.id, doc.data());
            });
            setOnlineUsers(map);
        });

        return () => {
            unsubscribeMsg();
            unsubscribeUsers();
        };
    }, [profile, isOpen]);

    // Auto-scroll al fondo al llegar mensajes
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    // Cargar posición del chat panel persistida
    useEffect(() => {
        if (isOpen && panelRef.current) {
            try {
                const raw = localStorage.getItem(CHAT_LAYOUT_KEY);
                if (raw) {
                    const layout = JSON.parse(raw);
                    const panel = panelRef.current;
                    if (layout.left) panel.style.left = layout.left;
                    if (layout.top) {
                        panel.style.top = layout.top;
                        panel.style.bottom = 'auto';
                    }
                    if (layout.width) panel.style.width = layout.width;
                    if (layout.maxHeight) panel.style.maxHeight = layout.maxHeight;
                }
            } catch {}
        }
    }, [isOpen]);

    // Drag y Resize del panel (Mouse handlers directos para rendimiento)
    const handleDragStart = (e) => {
        if (e.target.closest('button')) return;
        const panel = panelRef.current;
        if (!panel) return;

        const startX = e.clientX;
        const startY = e.clientY;
        const rect = panel.getBoundingClientRect();
        const offsetX = startX - rect.left;
        const offsetY = startY - rect.top;

        panel.style.transition = 'none';

        const handleMouseMove = (moveEvent) => {
            let x = moveEvent.clientX - offsetX;
            let y = moveEvent.clientY - offsetY;

            x = Math.max(0, Math.min(x, window.innerWidth - panel.offsetWidth));
            y = Math.max(0, Math.min(y, window.innerHeight - panel.offsetHeight));

            panel.style.bottom = 'auto';
            panel.style.left = x + 'px';
            panel.style.top = y + 'px';
        };

        const handleMouseUp = () => {
            document.removeEventListener('mousemove', handleMouseMove);
            document.removeEventListener('mouseup', handleMouseUp);
            // Guardar posición
            _saveLayout(panel);
        };

        document.addEventListener('mousemove', handleMouseMove);
        document.addEventListener('mouseup', handleMouseUp);
    };

    const handleResizeStart = (e) => {
        const panel = panelRef.current;
        if (!panel) return;

        const startX = e.clientX;
        const startY = e.clientY;
        const startWidth = panel.offsetWidth;
        const startHeight = panel.offsetHeight;

        panel.style.transition = 'none';

        const handleMouseMove = (moveEvent) => {
            // El resize arrastra desde la esquina inferior izquierda
            const w = startWidth - (moveEvent.clientX - startX);
            const h = startHeight - (moveEvent.clientY - startY);

            if (w > 250 && w < 600) panel.style.width = w + 'px';
            if (h > 300 && h < 700) panel.style.maxHeight = h + 'px';
        };

        const handleMouseUp = () => {
            document.removeEventListener('mousemove', handleMouseMove);
            document.removeEventListener('mouseup', handleMouseUp);
            _saveLayout(panel);
        };

        document.addEventListener('mousemove', handleMouseMove);
        document.addEventListener('mouseup', handleMouseUp);
        e.preventDefault();
        e.stopPropagation();
    };

    const _saveLayout = (panel) => {
        const layout = {
            left: panel.style.left,
            top: panel.style.top,
            bottom: panel.style.bottom,
            width: panel.style.width,
            maxHeight: panel.style.maxHeight
        };
        localStorage.setItem(CHAT_LAYOUT_KEY, JSON.stringify(layout));
    };

    const handleCreateProfile = () => {
        const name = setupName.trim();
        if (!name) return;

        const newProfile = {
            id: profile?.id || generateId(),
            name,
            avatar: setupAvatar.trim() || getDefaultAvatar(name),
            nameColor: setupColor,
            description: setupBio.trim(),
            favoriteGame: setupFavGame
        };

        setProfile(newProfile);
        localStorage.setItem(CHAT_PROFILE_KEY, JSON.stringify(newProfile));
        setIsEditingProfile(false);
    };

    const handleSendMessage = async () => {
        const text = inputText.trim();
        if (!text || !db || !profile) return;

        setInputText('');

        try {
            const isImg = isImageUrl(text);
            await addDoc(collection(db, 'messages'), {
                authorId: profile.id,
                text: text.slice(0, MAX_MSG_LENGTH),
                type: isImg ? 'media' : 'message',
                createdAt: serverTimestamp(),
                // Fallbacks si el usuario de snapshot no está disponible todavía
                author: profile.name,
                avatar: profile.avatar,
                nameColor: profile.nameColor
            });
        } catch (e) {
            console.error('[PiolaChat] Error sending message:', e);
        }
    };

    const handleToggleChat = () => {
        setIsOpen(!isOpen);
        if (!isOpen) {
            setUnreadCount(0);
            localStorage.setItem('piola_chat_last_read', Date.now().toString());
        }
    };

    // Conteo de usuarios online
    const onlineCount = useMemo(() => {
        let count = 0;
        onlineUsers.forEach(u => { if (u.online) count++; });
        return count;
    }, [onlineUsers]);

    // Renderizar Setup si no hay perfil o se está editando
    if (!profile || isEditingProfile) {
        return (
            <div className="piola-chat-setup active" id="piolaChatSetup">
                <div className="setup-card">
                    <h3>{profile ? 'Editar Perfil' : 'Tu Perfil'}</h3>
                    <p>Completá tu perfil para usar el chat y la galería</p>
                    <img 
                        className="setup-avatar-preview" 
                        src={setupAvatar.trim() || getDefaultAvatar(setupName)} 
                        alt="Avatar preview"
                        onError={(e) => { e.target.src = DEFAULT_AVATAR; }}
                    />
                    <span className="setup-avatar-hint">Escribí una URL abajo o dejá vacío para avatar random</span>
                    <label htmlFor="setupNameInput" className="sr-only">Tu nombre</label>
                    <input 
                        type="text" 
                        id="setupNameInput"
                        placeholder="Tu nombre..." 
                        maxLength={20}
                        value={setupName}
                        onChange={(e) => setSetupName(e.target.value)}
                    />
                    <label htmlFor="setupAvatarInput" className="sr-only">URL de foto de perfil</label>
                    <input 
                        type="text" 
                        id="setupAvatarInput"
                        placeholder="URL de foto (opcional)"
                        value={setupAvatar}
                        onChange={(e) => setSetupAvatar(e.target.value)}
                    />
                    <div className="setup-color-row">
                        <label htmlFor="setupColorInput">Color de nombre:</label>
                        <input 
                            type="color" 
                            id="setupColorInput"
                            value={setupColor}
                            onChange={(e) => setSetupColor(e.target.value)}
                        />
                    </div>
                    <span className="setup-section-label">Personalización</span>
                    <label htmlFor="setupBioInput" className="sr-only">Biografía corta</label>
                    <textarea 
                        id="setupBioInput"
                        placeholder="Bio corta (opcional)..." 
                        maxLength={120}
                        value={setupBio}
                        onChange={(e) => setSetupBio(e.target.value)}
                    />
                    <div className="form-group" style={{ width: '100%', marginBottom: '15px' }}>
                        <label htmlFor="setupFavGameSelect" className="sr-only">Selecciona tu juego favorito</label>
                        <select 
                            id="setupFavGameSelect"
                            value={setupFavGame}
                            onChange={(e) => setSetupFavGame(e.target.value)}
                            style={{ width: '100%', padding: '10px', background: 'rgba(0,0,0,0.5)', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', borderRadius: '4px' }}
                        >
                            <option value="">Selecciona tu juego favorito...</option>
                            {gamesData.map(g => (
                                <option key={g.id} value={g.title}>{g.title}</option>
                            ))}
                        </select>
                    </div>

                    <div style={{ display: 'flex', gap: '10px', width: '100%' }}>
                        {profile && (
                            <button 
                                className="btn-setup-save btn-secondary" 
                                onClick={() => setIsEditingProfile(false)}
                                style={{ flex: 1, background: '#333' }}
                            >
                                Cancelar
                            </button>
                        )}
                        <button className="btn-setup-save" onClick={handleCreateProfile} style={{ flex: 1 }}>
                            Guardar
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    // Perfil seleccionado
    const selectedUser = selectedUserId ? onlineUsers.get(selectedUserId) : null;

    return (
        <>
            {/* Burbuja del Chat */}
            <div 
                className={`piola-chat-bubble ${isOpen ? 'hidden' : ''}`} 
                id="piolaChatBubble"
                onClick={handleToggleChat}
                title="Chat Piola"
            >
                <MessageSquare size={22} />
                {unreadCount > 0 && (
                    <span className="chat-unread-badge visible" id="chatUnreadBadge">
                        {unreadCount > 99 ? '99+' : unreadCount}
                    </span>
                )}
            </div>

            {/* Panel del Chat */}
            {isOpen && (
                <div 
                    ref={panelRef}
                    className="piola-chat-panel active" 
                    id="piolaChatPanel"
                >
                    <div className="piola-chat-header" onMouseDown={handleDragStart}>
                        <div className="chat-title" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <MessageSquare size={16} />
                            Chat Piola
                            <span className="online-count" id="chatOnlineCount">
                                {onlineCount > 0 ? `${onlineCount} online` : ''}
                            </span>
                        </div>
                        <button className="btn-close-chat" id="btnCloseChat" title="Minimizar" onClick={handleToggleChat}>×</button>
                    </div>

                    <div className="piola-chat-messages" id="piolaChatMessages">
                        {messages.map(msg => {
                            const userPresence = onlineUsers.get(msg.authorId);
                            const authorName = userPresence?.name || msg.author || 'Anon';
                            const avatarSrc = userPresence?.avatar || msg.avatar || getDefaultAvatar('anon');
                            const nameColor = userPresence?.nameColor || msg.nameColor || DEFAULT_NAME_COLOR;
                            const isOnline = userPresence?.online || false;

                            const timeStr = msg.createdAt 
                                ? new Date(getTimestampMillis(msg.createdAt)).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) 
                                : '';

                            const isImg = isImageUrl(msg.text);

                            return (
                                <div key={msg.id} className="chat-msg">
                                    <img 
                                        className="msg-avatar" 
                                        src={avatarSrc} 
                                        alt=""
                                        onClick={() => setSelectedUserId(msg.authorId)}
                                        onError={(e) => { e.target.src = DEFAULT_AVATAR; }}
                                    />
                                    <div className="msg-body">
                                        <div 
                                            className="msg-author" 
                                            style={{ color: nameColor, cursor: 'pointer' }}
                                            onClick={() => setSelectedUserId(msg.authorId)}
                                        >
                                            <span className={`status-dot ${isOnline ? 'online' : 'offline'}`} />
                                            {authorName}
                                            <span className="msg-time">{timeStr}</span>
                                        </div>
                                        {isImg ? (
                                            <img className="msg-gif" src={msg.text} alt="Media" loading="lazy" />
                                        ) : (
                                            <div className="msg-text">{msg.text}</div>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                        <div ref={messagesEndRef} />
                    </div>

                    <div className="piola-chat-input-area">
                        <input 
                            type="text" 
                            id="piolaChatInput" 
                            placeholder="Escribí algo..."
                            maxLength={MAX_MSG_LENGTH} 
                            autoComplete="off"
                            value={inputText}
                            onChange={(e) => setInputText(e.target.value)}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                    e.preventDefault();
                                    handleSendMessage();
                                }
                            }}
                        />
                        <button className="btn-send" id="btnSendChat" title="Enviar" onClick={handleSendMessage}>
                            <Send size={18} />
                        </button>
                    </div>

                    {/* Resize handle */}
                    <div className="piola-chat-resize-handle" id="chatResizeHandle" onMouseDown={handleResizeStart} />
                </div>
            )}

            {/* Profile Detail Popup Modal */}
            {selectedUserId && selectedUser && (
                <div 
                    className="piola-profile-modal active" 
                    id="piolaProfileModal"
                    onClick={() => setSelectedUserId(null)}
                >
                    <div className="profile-card" onClick={(e) => e.stopPropagation()}>
                        <button className="btn-close-vs" onClick={() => setSelectedUserId(null)} style={{ position: 'absolute', top: '10px', right: '15px', background: 'none', border: 'none', color: '#fff', fontSize: '1.5rem', cursor: 'pointer' }}>×</button>
                        
                        <div className="profile-card-header" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '10px', padding: '20px 0 10px 0' }}>
                            <img 
                                src={selectedUser.avatar} 
                                alt={selectedUser.name} 
                                className="profile-avatar-large" 
                                style={{ width: '80px', height: '80px', borderRadius: '50%', border: `3px solid ${selectedUser.nameColor}` }}
                                onError={(e) => { e.target.src = DEFAULT_AVATAR; }}
                            />
                            <h2 style={{ color: selectedUser.nameColor, margin: 0, display: 'flex', alignItems: 'center', gap: '6px' }}>
                                <span className={`status-dot ${selectedUser.online ? 'online' : 'offline'}`} style={{ width: '10px', height: '10px' }} />
                                {selectedUser.name}
                            </h2>
                            <span style={{ fontSize: '0.8rem', color: '#888' }}>
                                {selectedUser.online ? 'Online' : 'Offline'}
                            </span>
                        </div>

                        <div className="profile-card-body" style={{ padding: '0 20px 20px 20px', display: 'flex', flexDirection: 'column', gap: '15px' }}>
                            <div>
                                <span style={{ fontSize: '0.75rem', color: '#888', textTransform: 'uppercase', letterSpacing: '1px' }}>Biografía</span>
                                <p style={{ margin: '5px 0 0 0', fontSize: '0.9rem', color: '#ccc' }}>
                                    {selectedUser.description || 'Sin descripción.'}
                                </p>
                            </div>

                            {selectedUser.favoriteGame && (
                                <div>
                                    <span style={{ fontSize: '0.75rem', color: '#888', textTransform: 'uppercase', letterSpacing: '1px' }}>Juego Favorito</span>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '6px' }}>
                                        <Gamepad2 size={16} style={{ color: selectedUser.nameColor }} />
                                        <span style={{ fontSize: '0.9rem', fontWeight: 'bold' }}>{selectedUser.favoriteGame}</span>
                                    </div>
                                </div>
                            )}

                            {selectedUserId === profile?.id && (
                                <button 
                                    className="btn btn-primary" 
                                    style={{ width: '100%', marginTop: '10px' }}
                                    onClick={() => {
                                        setSelectedUserId(null);
                                        setIsEditingProfile(true);
                                    }}
                                >
                                    Editar Perfil
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </>
    );
};
