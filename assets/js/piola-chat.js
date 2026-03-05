/**
 * PIOLA-CHAT.JS — Chat en Tiempo Real con Firebase
 *
 * Features:
 *   - Perfil local (nombre + avatar URL) guardado en localStorage
 *   - Historial persistente en Firestore (nunca se borra)
 *   - Presencia online/offline con Firestore
 *   - Live Activity: avisa cuando alguien entra a un juego
 *   - Widget minimizable abajo a la izquierda
 *
 * Colecciones de Firestore:
 *   - chat_messages:  { author, authorId, avatar, text, type, createdAt }
 *   - chat_presence:  { name, avatar, online, lastSeen, currentGame }
 */

const PiolaChat = (() => {
    // =========================================================================
    // CONFIGURACIÓN
    // =========================================================================
    const STORAGE_KEY = 'piola_chat_profile';
    const COLLECTION_MESSAGES = 'chat_messages';
    const COLLECTION_PRESENCE = 'chat_presence';
    const MAX_MSG_LENGTH = 300;
    const MSG_LOAD_LIMIT = 80;

    // =========================================================================
    // ESTADO INTERNO
    // =========================================================================
    let db = null;
    let isReady = false;
    let isOpen = false;
    let profile = null;            // { id, name, avatar }
    let unsubMessages = null;       // Listener de onSnapshot para mensajes
    let unsubPresence = null;       // Listener de onSnapshot para presencia
    let presenceMap = new Map();    // userId -> { name, online, currentGame, ... }
    let unreadCount = 0;
    let lastSeenTimestamp = null;   // Para trackear nuevos mensajes

    // =========================================================================
    // INICIALIZACIÓN
    // =========================================================================
    const init = () => {
        // Reutilizar la instancia de Firebase que ya usa ThemeGallery
        try {
            if (!firebase.apps.length) {
                console.warn('[PiolaChat] Firebase no inicializado. Esperando a ThemeGallery...');
                return;
            }
            db = firebase.firestore();
            isReady = true;
        } catch (err) {
            console.error('[PiolaChat] Error al obtener Firestore:', err);
            return;
        }

        // Cargar perfil desde localStorage
        profile = _loadProfile();

        // Inyectar HTML del widget
        _injectHTML();

        // Configurar eventos del DOM
        _bindEvents();

        // Si ya tiene perfil, arrancar listeners de Firebase
        if (profile) {
            _startListeners();
            _updatePresence(true);
        }

        // Detectar si el usuario está viendo un juego (live activity)
        _detectCurrentGame();

        // Limpiar presencia cuando cierre la pestaña
        window.addEventListener('beforeunload', () => {
            if (profile) _updatePresence(false);
        });

        // Cada 60s, actualizar presencia para demostrar que sigue vivo
        setInterval(() => {
            if (profile && isReady) _updatePresence(true);
        }, 60000);

        console.info('[PiolaChat] Chat inicializado ✓');
    };

    // =========================================================================
    // PERFIL (localStorage)
    // =========================================================================

    /** Genera un ID corto y único para el usuario */
    const _generateId = () => {
        return 'user_' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
    };

    const _loadProfile = () => {
        try {
            const raw = localStorage.getItem(STORAGE_KEY);
            if (!raw) return null;
            return JSON.parse(raw);
        } catch {
            return null;
        }
    };

    const _saveProfile = (data) => {
        profile = data;
        localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    };

    // =========================================================================
    // INYECCIÓN DE HTML
    // =========================================================================
    const _injectHTML = () => {
        // Burbuja flotante
        const bubble = document.createElement('div');
        bubble.className = 'piola-chat-bubble';
        bubble.id = 'piolaChatBubble';
        bubble.title = 'Chat Piola';
        bubble.innerHTML = `
            <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24"
                 fill="none" stroke="currentColor" stroke-width="2"
                 stroke-linecap="round" stroke-linejoin="round">
                <path d="m3 21 1.9-5.7a8.5 8.5 0 1 1 3.8 3.8z"/>
            </svg>
            <span class="chat-unread-badge" id="chatUnreadBadge">0</span>
        `;
        document.body.appendChild(bubble);

        // Panel principal
        const panel = document.createElement('div');
        panel.className = 'piola-chat-panel';
        panel.id = 'piolaChatPanel';
        panel.innerHTML = `
            <div class="piola-chat-header">
                <div class="chat-title">
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24"
                         fill="none" stroke="currentColor" stroke-width="2"
                         stroke-linecap="round" stroke-linejoin="round">
                        <path d="m3 21 1.9-5.7a8.5 8.5 0 1 1 3.8 3.8z"/>
                    </svg>
                    Chat Piola
                    <span class="online-count" id="chatOnlineCount"></span>
                </div>
                <button class="btn-close-chat" id="btnCloseChat" title="Minimizar">×</button>
            </div>
            <div class="piola-chat-messages" id="piolaChatMessages">
                <!-- Mensajes se renderizan acá -->
            </div>
            <div class="piola-chat-input-area">
                <input type="text" id="piolaChatInput" placeholder="Escribí algo..."
                       maxlength="${MAX_MSG_LENGTH}" autocomplete="off">
                <button class="btn-send" id="btnSendChat" title="Enviar">
                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24"
                         fill="none" stroke="currentColor" stroke-width="2"
                         stroke-linecap="round" stroke-linejoin="round">
                        <path d="m22 2-7 20-4-9-9-4Z"/>
                        <path d="M22 2 11 13"/>
                    </svg>
                </button>
            </div>
        `;
        document.body.appendChild(panel);

        // Modal de setup de perfil
        const setup = document.createElement('div');
        setup.className = 'piola-chat-setup';
        setup.id = 'piolaChatSetup';
        setup.innerHTML = `
            <div class="setup-card">
                <h3>Tu Perfil del Chat</h3>
                <p>Elegí un nombre y una foto para el chat</p>
                <img class="setup-avatar-preview" id="setupAvatarPreview"
                     src="https://api.dicebear.com/7.x/thumbs/svg?seed=default"
                     alt="Avatar preview">
                <span class="setup-avatar-hint">Clic en la imagen para cambiar (URL)</span>
                <input type="text" id="setupNameInput" placeholder="Tu nombre..." maxlength="20">
                <input type="text" id="setupAvatarInput" placeholder="URL de foto (opcional)">
                <button class="btn-setup-save" id="btnSetupSave">Entrar al Chat</button>
            </div>
        `;
        document.body.appendChild(setup);
    };

    // =========================================================================
    // EVENTOS DEL DOM
    // =========================================================================
    const _bindEvents = () => {
        // Abrir/cerrar chat
        document.getElementById('piolaChatBubble').addEventListener('click', _toggleChat);
        document.getElementById('btnCloseChat').addEventListener('click', _toggleChat);

        // Enviar mensaje
        document.getElementById('btnSendChat').addEventListener('click', _sendMessage);
        document.getElementById('piolaChatInput').addEventListener('keydown', (e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                _sendMessage();
            }
        });

        // Setup de perfil
        document.getElementById('btnSetupSave').addEventListener('click', _handleSetupSave);
        document.getElementById('setupNameInput').addEventListener('keydown', (e) => {
            if (e.key === 'Enter') _handleSetupSave();
        });

        // Preview del avatar en setup
        document.getElementById('setupAvatarInput').addEventListener('input', (e) => {
            const url = e.target.value.trim();
            const preview = document.getElementById('setupAvatarPreview');
            if (url) {
                preview.src = url;
                // Si falla, volver al default
                preview.onerror = () => {
                    preview.src = 'https://api.dicebear.com/7.x/thumbs/svg?seed=default';
                };
            }
        });

        // Clic en el avatar preview para pegar URL
        document.getElementById('setupAvatarPreview').addEventListener('click', () => {
            document.getElementById('setupAvatarInput').focus();
        });
    };

    // =========================================================================
    // ABRIR / CERRAR CHAT
    // =========================================================================
    const _toggleChat = () => {
        const panel = document.getElementById('piolaChatPanel');
        const bubble = document.getElementById('piolaChatBubble');

        // Si no tiene perfil, mostrar setup primero
        if (!profile) {
            _showSetup();
            return;
        }

        isOpen = !isOpen;

        if (isOpen) {
            panel.classList.add('open');
            bubble.style.display = 'none';
            // Resetear contador de no leídos
            unreadCount = 0;
            _updateUnreadBadge();
            // Scroll al final
            _scrollToBottom();
            // Focus en input
            setTimeout(() => document.getElementById('piolaChatInput').focus(), 300);
        } else {
            panel.classList.remove('open');
            bubble.style.display = 'flex';
        }
    };

    // =========================================================================
    // SETUP DE PERFIL
    // =========================================================================
    const _showSetup = () => {
        const modal = document.getElementById('piolaChatSetup');
        modal.classList.add('active');

        // Si ya tiene datos, pre-popular
        if (profile) {
            document.getElementById('setupNameInput').value = profile.name || '';
            document.getElementById('setupAvatarInput').value = profile.avatar || '';
            if (profile.avatar) {
                document.getElementById('setupAvatarPreview').src = profile.avatar;
            }
        }
    };

    const _handleSetupSave = () => {
        const nameInput = document.getElementById('setupNameInput');
        const avatarInput = document.getElementById('setupAvatarInput');
        const name = nameInput.value.trim();

        if (!name) {
            nameInput.style.borderColor = 'var(--accent-red)';
            nameInput.focus();
            setTimeout(() => nameInput.style.borderColor = '', 1500);
            return;
        }

        const avatar = avatarInput.value.trim() ||
            `https://api.dicebear.com/7.x/thumbs/svg?seed=${encodeURIComponent(name)}`;

        // Preservar ID existente o generar uno nuevo
        const id = profile?.id || _generateId();

        _saveProfile({ id, name, avatar });

        // Cerrar modal de setup
        document.getElementById('piolaChatSetup').classList.remove('active');

        // Iniciar listeners si es la primera vez
        _startListeners();
        _updatePresence(true);
        _detectCurrentGame();

        // Abrir el chat directamente
        _toggleChat();
    };

    // =========================================================================
    // FIREBASE: LISTENERS EN TIEMPO REAL
    // =========================================================================
    const _startListeners = () => {
        if (!isReady || !db) return;

        // Limpiar listeners anteriores si existen (evita duplicados)
        if (unsubMessages) unsubMessages();
        if (unsubPresence) unsubPresence();

        // --- Listener de mensajes (en tiempo real, ordenados por fecha) ---
        unsubMessages = db.collection(COLLECTION_MESSAGES)
            .orderBy('createdAt', 'asc')
            .limitToLast(MSG_LOAD_LIMIT)
            .onSnapshot((snapshot) => {
                const container = document.getElementById('piolaChatMessages');
                if (!container) return;

                container.innerHTML = '';

                snapshot.forEach(doc => {
                    const msg = doc.data();
                    _renderMessage(container, msg);
                });

                _scrollToBottom();

                // Contar mensajes no leídos si el chat está cerrado
                if (!isOpen) {
                    const changes = snapshot.docChanges();
                    const newMessages = changes.filter(c => c.type === 'added');
                    // Solo contar mensajes de OTROS usuarios
                    const othersNew = newMessages.filter(c => {
                        const data = c.doc.data();
                        return data.authorId !== profile?.id;
                    });
                    if (othersNew.length > 0) {
                        unreadCount += othersNew.length;
                        _updateUnreadBadge();
                    }
                }
            }, (err) => {
                console.error('[PiolaChat] Error en listener de mensajes:', err);
            });

        // --- Listener de presencia ---
        unsubPresence = db.collection(COLLECTION_PRESENCE)
            .onSnapshot((snapshot) => {
                presenceMap.clear();
                let onlineCount = 0;

                snapshot.forEach(doc => {
                    const data = doc.data();
                    presenceMap.set(doc.id, data);
                    if (data.online) onlineCount++;
                });

                // Actualizar contador en el header
                const countEl = document.getElementById('chatOnlineCount');
                if (countEl) {
                    countEl.textContent = onlineCount > 0 ? `${onlineCount} online` : '';
                }
            }, (err) => {
                console.error('[PiolaChat] Error en listener de presencia:', err);
            });
    };

    // =========================================================================
    // RENDERIZADO DE UN MENSAJE
    // =========================================================================
    const _renderMessage = (container, msg) => {
        // Mensaje tipo "activity" (alguien entró a un juego)
        if (msg.type === 'activity') {
            const div = document.createElement('div');
            div.className = 'chat-activity-event';
            div.innerHTML = `<span class="activity-icon">🎮</span> ${_escapeHtml(msg.text)}`;
            container.appendChild(div);
            return;
        }

        // Mensaje normal
        const presence = presenceMap.get(msg.authorId);
        const isOnline = presence?.online || false;

        const div = document.createElement('div');
        div.className = 'chat-msg';

        const avatarSrc = msg.avatar || 'https://api.dicebear.com/7.x/thumbs/svg?seed=anon';
        const timeStr = msg.createdAt ? _formatTime(msg.createdAt.toDate()) : '';

        div.innerHTML = `
            <img class="msg-avatar" src="${_escapeHtml(avatarSrc)}" alt=""
                 onerror="this.src='https://api.dicebear.com/7.x/thumbs/svg?seed=error'">
            <div class="msg-body">
                <div class="msg-author">
                    <span class="status-dot ${isOnline ? 'online' : 'offline'}"></span>
                    ${_escapeHtml(msg.author || 'Anon')}
                </div>
                <div class="msg-text">${_escapeHtml(msg.text)}</div>
                <div class="msg-time">${timeStr}</div>
            </div>
        `;

        container.appendChild(div);
    };

    // =========================================================================
    // ENVIAR MENSAJE
    // =========================================================================
    const _sendMessage = async () => {
        if (!isReady || !profile) return;

        const input = document.getElementById('piolaChatInput');
        const text = input.value.trim();
        if (!text) return;

        input.value = '';
        input.focus();

        try {
            await db.collection(COLLECTION_MESSAGES).add({
                author: profile.name,
                authorId: profile.id,
                avatar: profile.avatar,
                text: text.slice(0, MAX_MSG_LENGTH),
                type: 'message',
                createdAt: firebase.firestore.FieldValue.serverTimestamp()
            });
        } catch (err) {
            console.error('[PiolaChat] Error al enviar mensaje:', err);
        }
    };

    // =========================================================================
    // PRESENCIA (online/offline + currentGame)
    // =========================================================================
    const _updatePresence = (online, gameName = null) => {
        if (!isReady || !profile || !db) return;

        const data = {
            name: profile.name,
            avatar: profile.avatar,
            online: online,
            lastSeen: firebase.firestore.FieldValue.serverTimestamp()
        };

        // Solo incluir currentGame si estamos pasándolo explícitamente
        if (gameName !== null) {
            data.currentGame = gameName;
        }

        // Usar el profile.id como ID del documento de presencia
        db.collection(COLLECTION_PRESENCE).doc(profile.id).set(data, { merge: true })
            .catch(err => console.error('[PiolaChat] Error actualizando presencia:', err));
    };

    // =========================================================================
    // LIVE ACTIVITY — Detectar qué juego está viendo el usuario
    // =========================================================================
    const _detectCurrentGame = () => {
        if (!profile) return;

        const params = new URLSearchParams(window.location.search);
        const gameId = params.get('id');

        if (!gameId) {
            // En la home, no hay juego activo
            _updatePresence(true, '');
            return;
        }

        // Buscar el título del juego en gamesData
        const gameTitle = _getGameTitle(gameId);
        if (!gameTitle) return;

        // Actualizar presencia con el juego actual
        _updatePresence(true, gameTitle);

        // Enviar un evento de actividad al chat
        _sendActivityEvent(gameTitle);
    };

    /** Busca el título de un juego por su ID en window.gamesData */
    const _getGameTitle = (gameId) => {
        if (!window.gamesData) return null;
        const game = window.gamesData.find(g => g.id === gameId);
        return game ? game.title : null;
    };

    /**
     * Envía un mensaje tipo "activity" al chat.
     * Usa un throttle local para no spamear si el usuario recarga mucho.
     */
    const _sendActivityEvent = async (gameTitle) => {
        if (!isReady || !profile) return;

        // Throttle: no repetir la misma actividad en menos de 30s
        const throttleKey = `piola_chat_activity_${profile.id}`;
        const lastActivity = sessionStorage.getItem(throttleKey);
        const now = Date.now();

        if (lastActivity && (now - parseInt(lastActivity)) < 30000) return;
        sessionStorage.setItem(throttleKey, now.toString());

        try {
            await db.collection(COLLECTION_MESSAGES).add({
                author: profile.name,
                authorId: profile.id,
                avatar: profile.avatar,
                text: `${profile.name} está en ${gameTitle}`,
                type: 'activity',
                createdAt: firebase.firestore.FieldValue.serverTimestamp()
            });
        } catch (err) {
            console.error('[PiolaChat] Error al enviar actividad:', err);
        }
    };

    // =========================================================================
    // UTILIDADES
    // =========================================================================

    /** Scroll suave al fondo del chat */
    const _scrollToBottom = () => {
        const container = document.getElementById('piolaChatMessages');
        if (container) {
            // Usar requestAnimationFrame para asegurar que el DOM se actualizó
            requestAnimationFrame(() => {
                container.scrollTop = container.scrollHeight;
            });
        }
    };

    /** Actualizar badge de no leídos */
    const _updateUnreadBadge = () => {
        const badge = document.getElementById('chatUnreadBadge');
        if (!badge) return;

        if (unreadCount > 0) {
            badge.textContent = unreadCount > 99 ? '99+' : unreadCount;
            badge.classList.add('visible');
        } else {
            badge.classList.remove('visible');
        }
    };

    /** Formatea un Date a "HH:MM" legible */
    const _formatTime = (date) => {
        if (!date) return '';
        const h = date.getHours().toString().padStart(2, '0');
        const m = date.getMinutes().toString().padStart(2, '0');
        return `${h}:${m}`;
    };

    /** Escapa HTML para prevenir XSS */
    const _escapeHtml = (str) => {
        const div = document.createElement('div');
        div.textContent = str;
        return div.innerHTML;
    };

    // =========================================================================
    // API PÚBLICA
    // =========================================================================
    return {
        init,
        /** Permite abrir el setup del perfil desde otro módulo (ej: settings) */
        editProfile: _showSetup
    };

})();

// Inicializar cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', () => {
    // Pequeño delay para asegurar que Firebase ya se cargó (después de ThemeGallery)
    setTimeout(() => PiolaChat.init(), 500);
});
