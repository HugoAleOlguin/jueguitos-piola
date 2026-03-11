/**
 * PIOLA-CHAT.JS — Chat en Tiempo Real con Firebase
 *
 * Features:
 *   - Perfil: nombre, avatar, descripción, juego favorito, color de nombre
 *   - Historial persistente en Firestore
 *   - Al cambiar nombre/avatar/color → actualiza TODO el historial
 *   - Presencia online/offline
 *   - Modal de perfil (lectura + edición con lápiz)
 *   - GIFs vía Tenor API
 *   - Perfiles guardados en Firestore (colección chat_profiles)
 *
 * Modelo de perfil (localStorage + Firestore):
 *   { id, name, avatar, description, favoriteGame, nameColor }
 *
 * Colecciones de Firestore (Estructura Migrada):
 *   - messages: { authorId, text, mediaUrl, type, createdAt }
 *   - users:    { name, avatar, description, favoriteGame, nameColor, online, status, lastSeen, updatedAt }
 */

const PiolaChat = (() => {
    // =========================================================================
    // CONFIGURACIÓN
    // =========================================================================
    const STORAGE_KEY = 'piola_chat_profile';
    const COLLECTION_MESSAGES = 'messages';
    const COLLECTION_USERS = 'users';
    const MAX_MSG_LENGTH = 300;
    const MSG_LOAD_LIMIT = 80;
    const DEFAULT_AVATAR = 'https://api.dicebear.com/7.x/thumbs/svg?seed=default';
    const DEFAULT_NAME_COLOR = '#00f3ff';



    // =========================================================================
    // ESTADO INTERNO
    // =========================================================================
    let db = null;
    let isReady = false;
    let isOpen = false;
    let profile = null;
    let unsubMessages = null;
    let unsubUsers = null;
    let userMap = new Map();
    let currentMessages = []; // Cache of last messages snapshot
    let unreadCount = 0;

    // =========================================================================
    // INICIALIZACIÓN
    // =========================================================================
    const init = () => {
        try {
            if (!firebase.apps.length) {
                console.warn('[PiolaChat] Firebase no inicializado.');
                return;
            }
            db = firebase.firestore();
            isReady = true;
        } catch (err) {
            console.error('[PiolaChat] Error al obtener Firestore:', err);
            return;
        }

        profile = _loadProfile();
        _injectHTML();
        _bindEvents();

        if (profile) {
            _startListeners();
            _updatePresence(true);
        }

        window.addEventListener('beforeunload', () => {
            if (profile) _updatePresence(false);
        });

        // Heartbeat cada 60s
        setInterval(() => {
            if (profile && isReady) _updatePresence(true);
        }, 60000);

        console.info('[PiolaChat] Chat inicializado ✓');
    };

    // =========================================================================
    // PERFIL (localStorage + Firestore)
    // =========================================================================
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

    const _defaultAvatar = (name) => {
        return `https://api.dicebear.com/7.x/thumbs/svg?seed=${encodeURIComponent(name || 'anon')}`;
    };

    /* Eliminado _syncProfileToFirestore: unificado en _updatePresence */

    // =========================================================================
    // HELPERS DE JUEGOS
    // =========================================================================
    const _getGameByTitle = (title) => {
        if (!window.gamesData || !title) return null;
        return window.gamesData.find(g => g.title === title) || null;
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

        // Panel principal del chat
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
            <div class="piola-chat-messages" id="piolaChatMessages"></div>
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
            <div class="piola-chat-resize-handle" id="chatResizeHandle"></div>
        `;
        document.body.appendChild(panel);

        // Modal de setup de perfil
        const setup = document.createElement('div');
        setup.className = 'piola-chat-setup';
        setup.id = 'piolaChatSetup';
        setup.innerHTML = `
            <div class="setup-card">
                <h3>Tu Perfil</h3>
                <p>Completá tu perfil para usar el chat y la galería</p>
                <img class="setup-avatar-preview" id="setupAvatarPreview"
                     src="${DEFAULT_AVATAR}" alt="Avatar preview">
                <span class="setup-avatar-hint">Clickeá la imagen para cambiar foto</span>
                <input type="text" id="setupNameInput" placeholder="Tu nombre..." maxlength="20">
                <input type="text" id="setupAvatarInput" placeholder="URL de foto (opcional)">
                <div class="setup-color-row">
                    <label>Color de nombre:</label>
                    <input type="color" id="setupNameColor" value="${DEFAULT_NAME_COLOR}">
                </div>

                <span class="setup-section-label">Personalización</span>
                <textarea id="setupDescInput" placeholder="Bio corta (opcional)..." maxlength="120"></textarea>

                <button class="btn-setup-save" id="btnSetupSave">Crear Perfil</button>
            </div>
        `;
        document.body.appendChild(setup);

        // Modal de perfil (ver/editar)
        const profileModal = document.createElement('div');
        profileModal.className = 'piola-profile-modal';
        profileModal.id = 'piolaProfileModal';
        profileModal.innerHTML = `<div class="profile-card" id="profileCardContent"></div>`;
        document.body.appendChild(profileModal);

        profileModal.addEventListener('click', (e) => {
            if (e.target === profileModal) _closeProfileModal();
        });
    };

    // =========================================================================
    // EVENTOS DEL DOM
    // =========================================================================
    const _bindEvents = () => {
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

        // Setup
        document.getElementById('btnSetupSave').addEventListener('click', _handleSetupSave);
        document.getElementById('setupNameInput').addEventListener('keydown', (e) => {
            if (e.key === 'Enter') _handleSetupSave();
        });

        // Preview avatar en setup
        document.getElementById('setupAvatarInput').addEventListener('input', (e) => {
            const url = e.target.value.trim();
            const preview = document.getElementById('setupAvatarPreview');
            if (url) {
                preview.src = url;
                preview.onerror = () => { preview.src = DEFAULT_AVATAR; };
            } else {
                preview.src = DEFAULT_AVATAR;
            }
        });

        document.getElementById('setupAvatarPreview').addEventListener('click', () => {
            document.getElementById('setupAvatarInput').focus();
        });

        // Drag y resize del panel
        _setupDragAndResize();
    };

    // =========================================================================
    // DRAG & RESIZE DEL PANEL
    // =========================================================================
    const CHAT_LAYOUT_KEY = 'piola_chat_layout';
    const MIN_WIDTH = 320;
    const MIN_HEIGHT = 300;

    const _setupDragAndResize = () => {
        const panel = document.getElementById('piolaChatPanel');
        const header = panel.querySelector('.piola-chat-header');
        const resizeHandle = document.getElementById('chatResizeHandle');

        // Restaurar posición/tamaño guardados
        _restoreChatLayout(panel);

        // --- DRAG (mover desde el header) ---
        let isDragging = false;
        let dragOffsetX = 0;
        let dragOffsetY = 0;

        header.addEventListener('mousedown', (e) => {
            // No arrastrar si se clickea un botón
            if (e.target.closest('button')) return;
            isDragging = true;
            dragOffsetX = e.clientX - panel.getBoundingClientRect().left;
            dragOffsetY = e.clientY - panel.getBoundingClientRect().top;
            panel.style.transition = 'none';
            header.style.cursor = 'grabbing';
            e.preventDefault();
        });

        // --- RESIZE (desde la esquina inferior-derecha) ---
        let isResizing = false;
        let resizeStartX = 0;
        let resizeStartY = 0;
        let resizeStartW = 0;
        let resizeStartH = 0;

        resizeHandle.addEventListener('mousedown', (e) => {
            isResizing = true;
            resizeStartX = e.clientX;
            resizeStartY = e.clientY;
            resizeStartW = panel.offsetWidth;
            resizeStartH = panel.offsetHeight;
            panel.style.transition = 'none';
            e.preventDefault();
            e.stopPropagation();
        });

        // Mousemove y mouseup globales
        document.addEventListener('mousemove', (e) => {
            if (isDragging) {
                let x = e.clientX - dragOffsetX;
                let y = e.clientY - dragOffsetY;

                // Limitar a los bordes de la ventana
                x = Math.max(0, Math.min(x, window.innerWidth - panel.offsetWidth));
                y = Math.max(0, Math.min(y, window.innerHeight - panel.offsetHeight));

                // Cambiar de bottom/left a top/left para posicionamiento libre
                panel.style.bottom = 'auto';
                panel.style.left = x + 'px';
                panel.style.top = y + 'px';
            }

            if (isResizing) {
                const dw = e.clientX - resizeStartX;
                const dh = resizeStartY - e.clientY; // Invertido: arrastrar arriba = más alto

                const newWidth = Math.max(MIN_WIDTH, Math.min(resizeStartW + dw, window.innerWidth - panel.offsetLeft));
                const newHeight = Math.max(MIN_HEIGHT, Math.min(resizeStartH + dh, window.innerHeight));

                panel.style.width = newWidth + 'px';
                panel.style.maxHeight = newHeight + 'px';

                // Si agrandamos hacia arriba, mover el top
                if (panel.style.bottom !== 'auto') {
                    // Seguimos con bottom, no mover
                } else {
                    const newTop = panel.getBoundingClientRect().top + (resizeStartH - newHeight) + (resizeStartY - e.clientY - (resizeStartH - newHeight));
                    // Mantener posición simple
                }
            }
        });

        document.addEventListener('mouseup', () => {
            if (isDragging || isResizing) {
                isDragging = false;
                isResizing = false;
                header.style.cursor = '';
                panel.style.transition = '';
                _saveChatLayout(panel);
            }
        });
    };

    /** Guarda posición y tamaño del panel en localStorage */
    const _saveChatLayout = (panel) => {
        const layout = {
            left: panel.style.left,
            top: panel.style.top,
            bottom: panel.style.bottom,
            width: panel.style.width,
            maxHeight: panel.style.maxHeight
        };
        localStorage.setItem(CHAT_LAYOUT_KEY, JSON.stringify(layout));
    };

    /** Restaura posición y tamaño del panel desde localStorage */
    const _restoreChatLayout = (panel) => {
        try {
            const raw = localStorage.getItem(CHAT_LAYOUT_KEY);
            if (!raw) return;
            const layout = JSON.parse(raw);
            if (layout.left) panel.style.left = layout.left;
            if (layout.top) {
                panel.style.top = layout.top;
                panel.style.bottom = 'auto';
            }
            if (layout.width) panel.style.width = layout.width;
            if (layout.maxHeight) panel.style.maxHeight = layout.maxHeight;
        } catch {
            // Ignorar si hay datos corruptos
        }
    };

    // =========================================================================
    // ABRIR / CERRAR CHAT
    // =========================================================================
    const _toggleChat = () => {
        const panel = document.getElementById('piolaChatPanel');
        const bubble = document.getElementById('piolaChatBubble');

        if (!profile) {
            _showSetup();
            return;
        }

        isOpen = !isOpen;

        if (isOpen) {
            panel.classList.add('open');
            bubble.style.display = 'none';
            unreadCount = 0;
            _updateUnreadBadge();
            _scrollToBottom();

            // Mark as read immediately when opening
            localStorage.setItem('piola_chat_last_read', Date.now().toString());

            // Solo autofocus en desktop — en mobile abre el teclado y lagea la pantalla
            const isMobile = window.matchMedia('(max-width: 768px)').matches;
            if (!isMobile) {
                setTimeout(() => document.getElementById('piolaChatInput').focus(), 300);
            }
        } else {
            panel.classList.remove('open');
            bubble.style.display = 'flex';

            // Mark as read again when closing
            localStorage.setItem('piola_chat_last_read', Date.now().toString());
        }
    };

    // =========================================================================
    // SETUP DE PERFIL
    // =========================================================================
    const _showSetup = () => {
        const modal = document.getElementById('piolaChatSetup');
        modal.classList.add('active');

        if (profile) {
            document.getElementById('setupNameInput').value = profile.name || '';
            document.getElementById('setupAvatarInput').value = profile.avatar || '';
            document.getElementById('setupDescInput').value = profile.description || '';
            document.getElementById('setupNameColor').value = profile.nameColor || DEFAULT_NAME_COLOR;
            if (profile.avatar) {
                document.getElementById('setupAvatarPreview').src = profile.avatar;
            }
        }
    };

    const _handleSetupSave = () => {
        const nameInput = document.getElementById('setupNameInput');
        const name = nameInput.value.trim();

        if (!name) {
            nameInput.style.borderColor = 'var(--accent-red)';
            nameInput.focus();
            setTimeout(() => nameInput.style.borderColor = '', 1500);
            return;
        }

        const avatarUrl = document.getElementById('setupAvatarInput').value.trim();
        const avatar = avatarUrl || _defaultAvatar(name);
        const id = profile?.id || _generateId();

        const newProfile = {
            id,
            name,
            avatar,
            description: document.getElementById('setupDescInput').value.trim().slice(0, 120),
            favoriteGame: '',
            nameColor: document.getElementById('setupNameColor').value || DEFAULT_NAME_COLOR
        };

        _saveProfile(newProfile);

        document.getElementById('piolaChatSetup').classList.remove('active');

        _startListeners();
        _updatePresence(true);
        _toggleChat();
    };


    // =========================================================================
    // MODAL DE PERFIL — Lectura por defecto, lápiz para editar
    // =========================================================================
    const _openProfileModal = (userId) => {
        const modal = document.getElementById('piolaProfileModal');
        const container = document.getElementById('profileCardContent');
        if (!modal || !container) return;

        const isOwn = profile && userId === profile.id;
        const presence = userMap.get(userId);

        const data = isOwn ? {
            name: profile.name,
            avatar: profile.avatar,
            description: profile.description || '',
            favoriteGame: profile.favoriteGame || '',
            nameColor: profile.nameColor || DEFAULT_NAME_COLOR,
            online: presence?.online || true
        } : {
            name: presence?.name || 'Desconocido',
            avatar: presence?.avatar || _defaultAvatar('unknown'),
            description: presence?.description || '',
            favoriteGame: presence?.favoriteGame || '',
            nameColor: presence?.nameColor || DEFAULT_NAME_COLOR,
            online: presence?.online || false
        };

        _renderViewProfile(container, data, isOwn, userId);
        modal.classList.add('active');
    };

    /** Perfil en modo LECTURA */
    const _renderViewProfile = (container, data, isOwn, userId) => {
        const statusDotClass = data.online ? 'online' : 'offline';
        const description = data.description || 'Sin descripción';
        const favGame = _getGameByTitle(data.favoriteGame);

        let favGameHtml;
        if (favGame) {
            favGameHtml = `
                <div class="fav-game-display">
                    <img src="${_escapeHtml(favGame.image)}" alt=""
                         onerror="this.style.display='none'">
                    <span>${_escapeHtml(favGame.title)}</span>
                </div>`;
        } else {
            favGameHtml = `<span class="profile-field-value empty">Ninguno</span>`;
        }

        const editBtnHtml = isOwn
            ? `<button class="btn-edit-profile" id="btnEditProfile" title="Editar perfil">
                <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24"
                     fill="none" stroke="currentColor" stroke-width="2"
                     stroke-linecap="round" stroke-linejoin="round">
                    <path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/>
                    <path d="m15 5 4 4"/>
                </svg>
               </button>`
            : '';

        container.innerHTML = `
            <div class="profile-banner">
                <button class="btn-close-profile" id="btnCloseProfile" title="Cerrar">×</button>
                ${editBtnHtml}
            </div>
            <div class="profile-avatar-wrapper">
                <img class="profile-avatar-large" src="${_escapeHtml(data.avatar)}"
                     alt="" onerror="this.src='${DEFAULT_AVATAR}'">
                <span class="profile-status-dot status-dot ${statusDotClass}"></span>
            </div>
            <div class="profile-body">
                <div class="profile-name" style="color: ${_escapeHtml(data.nameColor)}">
                    ${_escapeHtml(data.name)}
                    ${isOwn ? '<span class="own-tag">(vos)</span>' : ''}
                </div>

                <div class="profile-fields">
                    <div class="profile-divider"></div>

                    <div class="profile-field">
                        <span class="profile-field-label">Descripción</span>
                        <span class="profile-field-value ${!data.description ? 'empty' : ''}">${_escapeHtml(description)}</span>
                    </div>

                    <div class="profile-field">
                        <span class="profile-field-label">🎮 Juego Favorito</span>
                        ${favGameHtml}
                    </div>
                </div>
            </div>
        `;

        container.querySelector('#btnCloseProfile').addEventListener('click', _closeProfileModal);

        if (isOwn) {
            container.querySelector('#btnEditProfile').addEventListener('click', () => {
                _renderEditProfile(container, data, userId);
            });
        }
    };

    /** Perfil PROPIO en modo EDICIÓN */
    const _renderEditProfile = (container, data, userId) => {
        let gameOptions = '<option value="">Ninguno</option>';
        if (window.gamesData) {
            window.gamesData.forEach(g => {
                if (g.hidden) return;
                const selected = g.title === data.favoriteGame ? 'selected' : '';
                gameOptions += `<option value="${_escapeHtml(g.title)}" ${selected}>${_escapeHtml(g.title)}</option>`;
            });
        }

        const statusDotClass = data.online ? 'online' : 'offline';

        container.innerHTML = `
            <div class="profile-banner">
                <button class="btn-close-profile" id="btnCloseProfile" title="Cerrar">×</button>
            </div>
            <div class="profile-avatar-wrapper">
                <img class="profile-avatar-large" id="profileEditAvatar"
                     src="${_escapeHtml(data.avatar)}" alt=""
                     onerror="this.src='${DEFAULT_AVATAR}'"
                     style="cursor: pointer;" title="Clic para cambiar foto">
                <span class="profile-status-dot status-dot ${statusDotClass}"></span>
            </div>
            <div class="profile-body">
                <div class="profile-name" style="color: ${_escapeHtml(data.nameColor)}">
                    ${_escapeHtml(data.name)} <span class="own-tag">(editando)</span>
                </div>

                <div class="profile-fields">
                    <div class="profile-divider"></div>

                    <div class="profile-field">
                        <span class="profile-field-label">Nombre</span>
                        <input class="profile-edit-input" id="profileEditName" type="text"
                               value="${_escapeHtml(data.name)}" maxlength="20" placeholder="Tu nombre...">
                    </div>

                    <div class="profile-field">
                        <span class="profile-field-label">Foto de Perfil (URL)</span>
                        <input class="profile-edit-input" id="profileEditAvatarUrl" type="text"
                               value="${_escapeHtml(data.avatar)}" placeholder="URL de imagen...">
                    </div>

                    <div class="profile-field">
                        <span class="profile-field-label">Color de Nombre</span>
                        <div class="edit-color-row">
                            <input type="color" id="profileEditNameColor" value="${data.nameColor || DEFAULT_NAME_COLOR}">
                            <span class="color-preview-name" id="colorPreviewName"
                                  style="color: ${_escapeHtml(data.nameColor)}">${_escapeHtml(data.name)}</span>
                        </div>
                    </div>

                    <div class="profile-field">
                        <span class="profile-field-label">Descripción</span>
                        <textarea class="profile-edit-input" id="profileEditDesc"
                                  maxlength="120" placeholder="Bio corta...">${_escapeHtml(data.description)}</textarea>
                    </div>

                    <div class="profile-field">
                        <span class="profile-field-label">🎮 Juego Favorito</span>
                        <select class="profile-edit-input" id="profileEditFavGame">
                            ${gameOptions}
                        </select>
                    </div>
                </div>

                <div class="profile-actions">
                    <button class="btn-profile-action" id="btnProfileCancel">Cancelar</button>
                    <button class="btn-profile-action primary" id="btnProfileSave">Guardar</button>
                </div>
            </div>
        `;

        container.querySelector('#btnCloseProfile').addEventListener('click', _closeProfileModal);
        container.querySelector('#btnProfileCancel').addEventListener('click', _closeProfileModal);
        container.querySelector('#btnProfileSave').addEventListener('click', () => _handleProfileSave(userId));

        // Preview live del avatar
        container.querySelector('#profileEditAvatarUrl').addEventListener('input', (e) => {
            const img = container.querySelector('#profileEditAvatar');
            const url = e.target.value.trim();
            img.src = url || DEFAULT_AVATAR;
            img.onerror = () => { img.src = DEFAULT_AVATAR; };
        });

        container.querySelector('#profileEditAvatar').addEventListener('click', () => {
            container.querySelector('#profileEditAvatarUrl').focus();
        });

        // Preview live del color
        container.querySelector('#profileEditNameColor').addEventListener('input', (e) => {
            container.querySelector('#colorPreviewName').style.color = e.target.value;
        });

        container.querySelector('#profileEditName').addEventListener('input', (e) => {
            container.querySelector('#colorPreviewName').textContent = e.target.value || 'Preview';
        });
    };

    /** Guardar cambios del perfil */
    const _handleProfileSave = async (userId) => {
        const name = document.getElementById('profileEditName').value.trim();
        if (!name) return;

        const avatarUrl = document.getElementById('profileEditAvatarUrl').value.trim();
        const avatar = avatarUrl || _defaultAvatar(name);
        const nameColor = document.getElementById('profileEditNameColor').value || DEFAULT_NAME_COLOR;

        const updatedProfile = {
            id: profile.id,
            name,
            avatar,
            description: document.getElementById('profileEditDesc').value.trim().slice(0, 120),
            favoriteGame: document.getElementById('profileEditFavGame').value || '',
            nameColor
        };

        _saveProfile(updatedProfile);
        _updatePresence(true);

        _closeProfileModal();
    };

    const _closeProfileModal = () => {
        const modal = document.getElementById('piolaProfileModal');
        if (modal) modal.classList.remove('active');
    };

    // =========================================================================
    // FIREBASE: LISTENERS EN TIEMPO REAL
    // =========================================================================
    const _startListeners = () => {
        if (!isReady || !db) return;

        if (unsubMessages) unsubMessages();
        if (unsubUsers) unsubUsers();

        // Listener de mensajes
        unsubMessages = db.collection(COLLECTION_MESSAGES)
            .orderBy('createdAt', 'asc')
            .limitToLast(MSG_LOAD_LIMIT)
            .onSnapshot((snapshot) => {
                currentMessages = snapshot.docs;
                _renderAllMessages();

                let lastRead = parseInt(localStorage.getItem('piola_chat_last_read') || '0', 10);

                // Si está abierto, actualizamos el marcador de leído al instante
                if (isOpen) {
                    lastRead = Date.now();
                    localStorage.setItem('piola_chat_last_read', lastRead.toString());
                    unreadCount = 0;
                } else {
                    // Contar todos los mensajes que han llegado DESPUÉS de nuestro lastRead
                    // Filtramos los mensajes que son nuestros
                    const newMessages = snapshot.docs.filter(doc => {
                        const data = doc.data();
                        if (data.authorId === profile?.id) return false;

                        // Si no tiene fecha (ej. escritura pendiente), usamos timestamp actual
                        const msgTime = data.createdAt ? data.createdAt.toMillis() : Date.now();
                        return msgTime > lastRead;
                    });

                    if (newMessages.length > 0) {
                        unreadCount = newMessages.length;
                    } else {
                        unreadCount = 0;
                    }
                }

                _updateUnreadBadge();
            }, (err) => {
                console.error('[PiolaChat] Error en listener de mensajes:', err);
            });

        // Listener de usuarios (presencia y perfiles unificados)
        unsubUsers = db.collection(COLLECTION_USERS)
            .onSnapshot((snapshot) => {
                userMap.clear();
                let onlineCount = 0;
                snapshot.forEach(doc => {
                    const data = doc.data();
                    userMap.set(doc.id, data);
                    if (data.online) onlineCount++;
                });
                const countEl = document.getElementById('chatOnlineCount');
                if (countEl) {
                    countEl.textContent = onlineCount > 0 ? `${onlineCount} online` : '';
                }
                // Re-render messages dynamically when users update (name changes, avatar changes, etc)
                _renderAllMessages();
            }, (err) => {
                console.error('[PiolaChat] Error en listener de usuarios:', err);
            });
    };

    // =========================================================================
    // RENDERIZADO DE MENSAJES
    // =========================================================================

    const _renderAllMessages = () => {
        const container = document.getElementById('piolaChatMessages');
        if (!container) return;

        // Save scroll position relative to bottom
        const isAtBottom = container.scrollHeight - container.scrollTop <= container.clientHeight + 50;

        container.innerHTML = '';
        currentMessages.forEach(doc => {
            _renderMessage(container, doc.data());
        });

        // Maintain scroll intelligently
        if (isAtBottom) {
            _scrollToBottom();
        }
    };
    const _renderMessage = (container, msg) => {
        // Actividad
        if (msg.type === 'activity') {
            const div = document.createElement('div');
            div.className = 'chat-activity-event';
            div.innerHTML = `<span class="activity-icon">🎮</span> ${_escapeHtml(msg.text)}`;
            container.appendChild(div);
            return;
        }

        const presence = userMap.get(msg.authorId);
        const isOnline = presence?.online || false;

        // Datos del autor se toman de USERS para no duplicar en MESSAGES.
        const nameColor = presence?.nameColor || msg.nameColor || DEFAULT_NAME_COLOR;
        const avatarSrc = presence?.avatar || msg.avatar || _defaultAvatar('anon');
        const authorName = presence?.name || msg.author || 'Anon';

        const div = document.createElement('div');
        div.className = 'chat-msg';

        const timeStr = msg.createdAt ? _formatTime(msg.createdAt.toDate()) : '';

        // Contenido
        let msgContentHtml;
        if ((msg.type === 'media' && msg.mediaUrl) || (msg.type === 'gif' && msg.gifUrl) || _isImageUrl(msg.text)) {
            const imgSrc = msg.mediaUrl || msg.gifUrl || msg.text;
            msgContentHtml = `<img class="msg-gif" src="${_escapeHtml(imgSrc)}" alt="Media" loading="lazy">`;
        } else {
            msgContentHtml = `<div class="msg-text">${_escapeHtml(msg.text)}</div>`;
        }

        div.innerHTML = `
            <img class="msg-avatar" data-userid="${_escapeHtml(msg.authorId || '')}"
                 src="${_escapeHtml(avatarSrc)}" alt=""
                 onerror="this.src='${DEFAULT_AVATAR}'">
            <div class="msg-body">
                <div class="msg-author" data-userid="${_escapeHtml(msg.authorId || '')}"
                     style="color: ${_escapeHtml(nameColor)}">
                    <span class="status-dot ${isOnline ? 'online' : 'offline'}"></span>
                    ${_escapeHtml(authorName)}
                    <span class="msg-time">${timeStr}</span>
                </div>
                ${msgContentHtml}
            </div>
        `;

        // Click en avatar o nombre → abrir perfil
        const openProfile = () => {
            if (msg.authorId) _openProfileModal(msg.authorId);
        };
        div.querySelector('.msg-avatar').addEventListener('click', openProfile);
        div.querySelector('.msg-author').addEventListener('click', openProfile);

        container.appendChild(div);
    };

    // =========================================================================
    // ENVIAR MENSAJE DE TEXTO
    // =========================================================================
    const _sendMessage = async () => {
        if (!isReady || !profile) return;

        const input = document.getElementById('piolaChatInput');
        const text = input.value.trim();
        if (!text) return;

        input.value = '';
        input.focus();

        // Si el texto es una URL de imagen/GIF, guardar como tipo 'gif'
        const isImage = _isImageUrl(text);

        try {
            const msgData = {
                authorId: profile.id,
                text: text.slice(0, MAX_MSG_LENGTH),
                type: isImage ? 'media' : 'message',
                createdAt: firebase.firestore.FieldValue.serverTimestamp()
            };

            if (isImage) {
                msgData.mediaUrl = text;
            }

            await db.collection(COLLECTION_MESSAGES).add(msgData);
        } catch (err) {
            console.error('[PiolaChat] Error al enviar mensaje:', err);
        }
    };

    // =========================================================================
    // PRESENCIA
    // =========================================================================
    const _updatePresence = (online) => {
        if (!isReady || !profile || !db) return;

        db.collection(COLLECTION_USERS).doc(profile.id).set({
            name: profile.name,
            avatar: profile.avatar,
            description: profile.description || '',
            favoriteGame: profile.favoriteGame || '',
            nameColor: profile.nameColor || DEFAULT_NAME_COLOR,
            online: online,
            lastSeen: firebase.firestore.FieldValue.serverTimestamp(),
            updatedAt: firebase.firestore.FieldValue.serverTimestamp()
        }, { merge: true })
            .catch(err => console.error('[PiolaChat] Error actualizando usuario:', err));
    };

    // =========================================================================
    // UTILIDADES
    // =========================================================================
    const _scrollToBottom = () => {
        const container = document.getElementById('piolaChatMessages');
        if (container) {
            requestAnimationFrame(() => {
                container.scrollTop = container.scrollHeight;
            });
        }
    };

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

    const _formatTime = (date) => {
        if (!date) return '';
        const h = date.getHours().toString().padStart(2, '0');
        const m = date.getMinutes().toString().padStart(2, '0');
        return `${h}:${m}`;
    };

    const _escapeHtml = (str) => {
        const div = document.createElement('div');
        div.textContent = str;
        return div.innerHTML;
    };

    /** Detecta si un texto es una URL de imagen o GIF */
    const _isImageUrl = (text) => {
        if (!text || typeof text !== 'string') return false;
        const trimmed = text.trim();

        // Debe empezar con http
        if (!trimmed.startsWith('http')) return false;

        // Detectar por extensión de archivo
        const imageExtensions = /\.(gif|png|jpg|jpeg|webp)(\?.*)?$/i;
        if (imageExtensions.test(trimmed)) return true;

        // Detectar dominios conocidos de GIFs (URLs que no siempre terminan en .gif)
        const gifDomains = ['tenor.com', 'media.tenor.com', 'giphy.com', 'media.giphy.com', 'i.imgur.com'];
        try {
            const url = new URL(trimmed);
            return gifDomains.some(domain => url.hostname.endsWith(domain));
        } catch {
            return false;
        }
    };

    // =========================================================================
    // API PÚBLICA
    // =========================================================================
    return {
        init,
        /** Abre el setup del perfil */
        editProfile: _showSetup,
        /** Devuelve el perfil actual o null */
        getProfile: () => profile
    };

})();

// Esperar a que Firebase esté disponible antes de inicializar
const waitForFirebase = () => {
    return new Promise((resolve) => {
        if (typeof firebase !== 'undefined' && firebase.apps.length > 0) {
            resolve();
        } else {
            // Retry hasta que Firebase esté disponible
            const check = setInterval(() => {
                if (typeof firebase !== 'undefined' && firebase.apps.length > 0) {
                    clearInterval(check);
                    resolve();
                }
            }, 100);
            // Timeout después de 5 segundos
            setTimeout(() => {
                clearInterval(check);
                resolve();
            }, 5000);
        }
    });
};

document.addEventListener('DOMContentLoaded', async () => {
    await waitForFirebase();
    setTimeout(() => PiolaChat.init(), 500);
});
