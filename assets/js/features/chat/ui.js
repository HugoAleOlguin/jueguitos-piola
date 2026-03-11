const ChatUI = (() => {
    const CHAT_LAYOUT_KEY = 'piola_chat_layout';
    const MIN_WIDTH = 320;
    const MIN_HEIGHT = 300;

    const injectHTML = () => {
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
                       maxlength="${ChatFirestore.MAX_MSG_LENGTH || 300}" autocomplete="off">
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

        const setup = document.createElement('div');
        setup.className = 'piola-chat-setup';
        setup.id = 'piolaChatSetup';
        setup.innerHTML = `
            <div class="setup-card">
                <h3>Tu Perfil</h3>
                <p>Completá tu perfil para usar el chat y la galería</p>
                <img class="setup-avatar-preview" id="setupAvatarPreview"
                     src="${ChatProfile.DEFAULT_AVATAR}" alt="Avatar preview">
                <span class="setup-avatar-hint">Clickeá la imagen para cambiar foto</span>
                <input type="text" id="setupNameInput" placeholder="Tu nombre..." maxlength="20">
                <input type="text" id="setupAvatarInput" placeholder="URL de foto (opcional)">
                <div class="setup-color-row">
                    <label>Color de nombre:</label>
                    <input type="color" id="setupNameColor" value="${ChatProfile.DEFAULT_NAME_COLOR}">
                </div>

                <span class="setup-section-label">Personalización</span>
                <textarea id="setupDescInput" placeholder="Bio corta (opcional)..." maxlength="120"></textarea>

                <button class="btn-setup-save" id="btnSetupSave">Crear Perfil</button>
            </div>
        `;
        document.body.appendChild(setup);

        const profileModal = document.createElement('div');
        profileModal.className = 'piola-profile-modal';
        profileModal.id = 'piolaProfileModal';
        profileModal.innerHTML = `<div class="profile-card" id="profileCardContent"></div>`;
        document.body.appendChild(profileModal);

        profileModal.addEventListener('click', (e) => {
            if (e.target === profileModal) _closeProfileModal();
        });
    };

    const bindEvents = () => {
        document.getElementById('piolaChatBubble').addEventListener('click', toggleChat);
        document.getElementById('btnCloseChat').addEventListener('click', toggleChat);

        document.getElementById('btnSendChat').addEventListener('click', () => ChatFirestore.sendMessage());
        document.getElementById('piolaChatInput').addEventListener('keydown', (e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                ChatFirestore.sendMessage();
            }
        });

        document.getElementById('btnSetupSave').addEventListener('click', _handleSetupSave);
        document.getElementById('setupNameInput').addEventListener('keydown', (e) => {
            if (e.key === 'Enter') _handleSetupSave();
        });

        document.getElementById('setupAvatarInput').addEventListener('input', (e) => {
            const url = e.target.value.trim();
            const preview = document.getElementById('setupAvatarPreview');
            if (url) {
                preview.src = url;
                preview.onerror = () => { preview.src = ChatProfile.DEFAULT_AVATAR; };
            } else {
                preview.src = ChatProfile.DEFAULT_AVATAR;
            }
        });

        document.getElementById('setupAvatarPreview').addEventListener('click', () => {
            document.getElementById('setupAvatarInput').focus();
        });

        _setupDragAndResize();
    };

    const _setupDragAndResize = () => {
        const panel = document.getElementById('piolaChatPanel');
        const header = panel.querySelector('.piola-chat-header');
        const resizeHandle = document.getElementById('chatResizeHandle');

        _restoreChatLayout(panel);

        let isDragging = false;
        let dragOffsetX = 0;
        let dragOffsetY = 0;

        header.addEventListener('mousedown', (e) => {
            if (e.target.closest('button')) return;
            isDragging = true;
            dragOffsetX = e.clientX - panel.getBoundingClientRect().left;
            dragOffsetY = e.clientY - panel.getBoundingClientRect().top;
            panel.style.transition = 'none';
            header.style.cursor = 'grabbing';
            e.preventDefault();
        });

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

        document.addEventListener('mousemove', (e) => {
            if (isDragging) {
                let x = e.clientX - dragOffsetX;
                let y = e.clientY - dragOffsetY;

                x = Math.max(0, Math.min(x, window.innerWidth - panel.offsetWidth));
                y = Math.max(0, Math.min(y, window.innerHeight - panel.offsetHeight));

                panel.style.bottom = 'auto';
                panel.style.left = x + 'px';
                panel.style.top = y + 'px';
            }

            if (isResizing) {
                const dw = e.clientX - resizeStartX;
                const dh = resizeStartY - e.clientY; 

                const newWidth = Math.max(MIN_WIDTH, Math.min(resizeStartW + dw, window.innerWidth - panel.offsetLeft));
                const newHeight = Math.max(MIN_HEIGHT, Math.min(resizeStartH + dh, window.innerHeight));

                panel.style.width = newWidth + 'px';
                panel.style.maxHeight = newHeight + 'px';
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
        } catch {}
    };

    const toggleChat = () => {
        const panel = document.getElementById('piolaChatPanel');
        const bubble = document.getElementById('piolaChatBubble');
        const state = ChatCore.state;

        if (!state.profile) {
            showSetup();
            return;
        }

        state.isOpen = !state.isOpen;

        if (state.isOpen) {
            panel.classList.add('open');
            bubble.style.display = 'none';
            state.unreadCount = 0;
            updateUnreadBadge();
            scrollToBottom();

            localStorage.setItem('piola_chat_last_read', Date.now().toString());

            const isMobile = window.matchMedia('(max-width: 768px)').matches;
            if (!isMobile) {
                setTimeout(() => document.getElementById('piolaChatInput').focus(), 300);
            }
        } else {
            panel.classList.remove('open');
            bubble.style.display = 'flex';
            localStorage.setItem('piola_chat_last_read', Date.now().toString());
        }
    };

    const showSetup = () => {
        const modal = document.getElementById('piolaChatSetup');
        modal.classList.add('active');
        const state = ChatCore.state;

        if (state.profile) {
            document.getElementById('setupNameInput').value = state.profile.name || '';
            document.getElementById('setupAvatarInput').value = state.profile.avatar || '';
            document.getElementById('setupDescInput').value = state.profile.description || '';
            document.getElementById('setupNameColor').value = state.profile.nameColor || ChatProfile.DEFAULT_NAME_COLOR;
            if (state.profile.avatar) {
                document.getElementById('setupAvatarPreview').src = state.profile.avatar;
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
        const avatar = avatarUrl || ChatHelpers.defaultAvatar(name);
        const state = ChatCore.state;
        const id = state.profile?.id || ChatHelpers.generateId();

        const newProfile = {
            id,
            name,
            avatar,
            description: document.getElementById('setupDescInput').value.trim().slice(0, 120),
            favoriteGame: '',
            nameColor: document.getElementById('setupNameColor').value || ChatProfile.DEFAULT_NAME_COLOR
        };

        ChatProfile.saveProfile(newProfile);

        document.getElementById('piolaChatSetup').classList.remove('active');

        ChatFirestore.startListeners();
        ChatFirestore.updatePresence(true);
        toggleChat();
    };

    const openProfileModal = (userId) => {
        const modal = document.getElementById('piolaProfileModal');
        const container = document.getElementById('profileCardContent');
        if (!modal || !container) return;
        const state = ChatCore.state;

        const isOwn = state.profile && userId === state.profile.id;
        const presence = state.userMap.get(userId);

        const data = isOwn ? {
            name: state.profile.name,
            avatar: state.profile.avatar,
            description: state.profile.description || '',
            favoriteGame: state.profile.favoriteGame || '',
            nameColor: state.profile.nameColor || ChatProfile.DEFAULT_NAME_COLOR,
            online: presence?.online || true
        } : {
            name: presence?.name || 'Desconocido',
            avatar: presence?.avatar || ChatHelpers.defaultAvatar('unknown'),
            description: presence?.description || '',
            favoriteGame: presence?.favoriteGame || '',
            nameColor: presence?.nameColor || ChatProfile.DEFAULT_NAME_COLOR,
            online: presence?.online || false
        };

        _renderViewProfile(container, data, isOwn, userId);
        modal.classList.add('active');
    };

    const _renderViewProfile = (container, data, isOwn, userId) => {
        const statusDotClass = data.online ? 'online' : 'offline';
        const description = data.description || 'Sin descripción';
        const favGame = ChatHelpers.getGameByTitle(data.favoriteGame);

        let favGameHtml;
        if (favGame) {
            favGameHtml = `
                <div class="fav-game-display">
                    <img src="${ChatHelpers.escapeHtml(favGame.image)}" alt=""
                         onerror="this.style.display='none'">
                    <span>${ChatHelpers.escapeHtml(favGame.title)}</span>
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
                <img class="profile-avatar-large" src="${ChatHelpers.escapeHtml(data.avatar)}"
                     alt="" onerror="this.src='${ChatProfile.DEFAULT_AVATAR}'">
                <span class="profile-status-dot status-dot ${statusDotClass}"></span>
            </div>
            <div class="profile-body">
                <div class="profile-name" style="color: ${ChatHelpers.escapeHtml(data.nameColor)}">
                    ${ChatHelpers.escapeHtml(data.name)}
                    ${isOwn ? '<span class="own-tag">(vos)</span>' : ''}
                </div>

                <div class="profile-fields">
                    <div class="profile-divider"></div>

                    <div class="profile-field">
                        <span class="profile-field-label">Descripción</span>
                        <span class="profile-field-value ${!data.description ? 'empty' : ''}">${ChatHelpers.escapeHtml(description)}</span>
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

    const _renderEditProfile = (container, data, userId) => {
        let gameOptions = '<option value="">Ninguno</option>';
        if (window.gamesData) {
            window.gamesData.forEach(g => {
                if (g.hidden) return;
                const selected = g.title === data.favoriteGame ? 'selected' : '';
                gameOptions += `<option value="${ChatHelpers.escapeHtml(g.title)}" ${selected}>${ChatHelpers.escapeHtml(g.title)}</option>`;
            });
        }

        const statusDotClass = data.online ? 'online' : 'offline';

        container.innerHTML = `
            <div class="profile-banner">
                <button class="btn-close-profile" id="btnCloseProfile" title="Cerrar">×</button>
            </div>
            <div class="profile-avatar-wrapper">
                <img class="profile-avatar-large" id="profileEditAvatar"
                     src="${ChatHelpers.escapeHtml(data.avatar)}" alt=""
                     onerror="this.src='${ChatProfile.DEFAULT_AVATAR}'"
                     style="cursor: pointer;" title="Clic para cambiar foto">
                <span class="profile-status-dot status-dot ${statusDotClass}"></span>
            </div>
            <div class="profile-body">
                <div class="profile-name" style="color: ${ChatHelpers.escapeHtml(data.nameColor)}">
                    ${ChatHelpers.escapeHtml(data.name)} <span class="own-tag">(editando)</span>
                </div>

                <div class="profile-fields">
                    <div class="profile-divider"></div>

                    <div class="profile-field">
                        <span class="profile-field-label">Nombre</span>
                        <input class="profile-edit-input" id="profileEditName" type="text"
                               value="${ChatHelpers.escapeHtml(data.name)}" maxlength="20" placeholder="Tu nombre...">
                    </div>

                    <div class="profile-field">
                        <span class="profile-field-label">Foto de Perfil (URL)</span>
                        <input class="profile-edit-input" id="profileEditAvatarUrl" type="text"
                               value="${ChatHelpers.escapeHtml(data.avatar)}" placeholder="URL de imagen...">
                    </div>

                    <div class="profile-field">
                        <span class="profile-field-label">Color de Nombre</span>
                        <div class="edit-color-row">
                            <input type="color" id="profileEditNameColor" value="${data.nameColor || ChatProfile.DEFAULT_NAME_COLOR}">
                            <span class="color-preview-name" id="colorPreviewName"
                                  style="color: ${ChatHelpers.escapeHtml(data.nameColor)}">${ChatHelpers.escapeHtml(data.name)}</span>
                        </div>
                    </div>

                    <div class="profile-field">
                        <span class="profile-field-label">Descripción</span>
                        <textarea class="profile-edit-input" id="profileEditDesc"
                                  maxlength="120" placeholder="Bio corta...">${ChatHelpers.escapeHtml(data.description)}</textarea>
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

        container.querySelector('#profileEditAvatarUrl').addEventListener('input', (e) => {
            const img = container.querySelector('#profileEditAvatar');
            const url = e.target.value.trim();
            img.src = url || ChatProfile.DEFAULT_AVATAR;
            img.onerror = () => { img.src = ChatProfile.DEFAULT_AVATAR; };
        });

        container.querySelector('#profileEditAvatar').addEventListener('click', () => {
            container.querySelector('#profileEditAvatarUrl').focus();
        });

        container.querySelector('#profileEditNameColor').addEventListener('input', (e) => {
            container.querySelector('#colorPreviewName').style.color = e.target.value;
        });

        container.querySelector('#profileEditName').addEventListener('input', (e) => {
            container.querySelector('#colorPreviewName').textContent = e.target.value || 'Preview';
        });
    };

    const _handleProfileSave = async (userId) => {
        const name = document.getElementById('profileEditName').value.trim();
        if (!name) return;

        const avatarUrl = document.getElementById('profileEditAvatarUrl').value.trim();
        const avatar = avatarUrl || ChatHelpers.defaultAvatar(name);
        const nameColor = document.getElementById('profileEditNameColor').value || ChatProfile.DEFAULT_NAME_COLOR;
        const state = ChatCore.state;

        const updatedProfile = {
            id: state.profile.id,
            name,
            avatar,
            description: document.getElementById('profileEditDesc').value.trim().slice(0, 120),
            favoriteGame: document.getElementById('profileEditFavGame').value || '',
            nameColor
        };

        ChatProfile.saveProfile(updatedProfile);
        ChatFirestore.updatePresence(true);

        _closeProfileModal();
    };

    const _closeProfileModal = () => {
        const modal = document.getElementById('piolaProfileModal');
        if (modal) modal.classList.remove('active');
    };

    const renderAllMessages = () => {
        const container = document.getElementById('piolaChatMessages');
        if (!container) return;
        const state = ChatCore.state;

        const isAtBottom = container.scrollHeight - container.scrollTop <= container.clientHeight + 120;
        const offsetFromBottom = container.scrollHeight - container.scrollTop;

        container.innerHTML = '';
        
        let lastDateFormatted = null;

        state.currentMessages.forEach(doc => {
            const msgData = doc.data();
            let msgDate = null;
            if (msgData.createdAt) {
                msgDate = msgData.createdAt.toDate();
            }

            if (msgDate) {
                const currentDateFormatted = msgDate.toLocaleDateString(undefined, {
                    day: 'numeric', month: 'numeric', year: 'numeric'
                });
                
                if (currentDateFormatted !== lastDateFormatted) {
                    const dateDivider = document.createElement('div');
                    dateDivider.className = 'chat-date-divider';
                    
                    const today = new Date();
                    const yesterday = new Date(today);
                    yesterday.setDate(yesterday.getDate() - 1);
                    
                    let displayDate = currentDateFormatted;
                    if (currentDateFormatted === today.toLocaleDateString(undefined, { day: 'numeric', month: 'numeric', year: 'numeric' })) {
                        displayDate = 'Hoy';
                    } else if (currentDateFormatted === yesterday.toLocaleDateString(undefined, { day: 'numeric', month: 'numeric', year: 'numeric' })) {
                        displayDate = 'Ayer';
                    }

                    dateDivider.textContent = displayDate;
                    container.appendChild(dateDivider);
                    lastDateFormatted = currentDateFormatted;
                }
            }

            _renderMessage(container, msgData);
        });

        setTimeout(() => {
            if (isAtBottom) {
                container.scrollTop = container.scrollHeight;
            } else {
                container.scrollTop = container.scrollHeight - offsetFromBottom;
            }
        }, 30);
    };

    const _renderMessage = (container, msg) => {
        if (msg.type === 'activity') {
            const div = document.createElement('div');
            div.className = 'chat-activity-event';
            div.innerHTML = `<span class="activity-icon">🎮</span> ${ChatHelpers.escapeHtml(msg.text)}`;
            container.appendChild(div);
            return;
        }

        const state = ChatCore.state;
        const presence = state.userMap.get(msg.authorId);
        const isOnline = presence?.online || false;

        const nameColor = presence?.nameColor || msg.nameColor || ChatProfile.DEFAULT_NAME_COLOR;
        const avatarSrc = presence?.avatar || msg.avatar || ChatHelpers.defaultAvatar('anon');
        const authorName = presence?.name || msg.author || 'Anon';

        const div = document.createElement('div');
        div.className = 'chat-msg';

        const timeStr = msg.createdAt ? ChatHelpers.formatTime(msg.createdAt.toDate()) : '';

        let msgContentHtml;
        if ((msg.type === 'media' && msg.mediaUrl) || (msg.type === 'gif' && msg.gifUrl) || ChatHelpers.isImageUrl(msg.text)) {
            const imgSrc = msg.mediaUrl || msg.gifUrl || msg.text;
            msgContentHtml = `<img class="msg-gif" src="${ChatHelpers.escapeHtml(imgSrc)}" alt="Media" loading="lazy">`;
        } else {
            msgContentHtml = `<div class="msg-text">${ChatHelpers.escapeHtml(msg.text)}</div>`;
        }

        div.innerHTML = `
            <img class="msg-avatar" data-userid="${ChatHelpers.escapeHtml(msg.authorId || '')}"
                 src="${ChatHelpers.escapeHtml(avatarSrc)}" alt=""
                 onerror="this.src='${ChatProfile.DEFAULT_AVATAR}'">
            <div class="msg-body">
                <div class="msg-author" data-userid="${ChatHelpers.escapeHtml(msg.authorId || '')}"
                     style="color: ${ChatHelpers.escapeHtml(nameColor)}">
                    <span class="status-dot ${isOnline ? 'online' : 'offline'}"></span>
                    ${ChatHelpers.escapeHtml(authorName)}
                    <span class="msg-time">${timeStr}</span>
                </div>
                ${msgContentHtml}
            </div>
        `;

        const openProfile = () => {
            if (msg.authorId) openProfileModal(msg.authorId);
        };
        div.querySelector('.msg-avatar').addEventListener('click', openProfile);
        div.querySelector('.msg-author').addEventListener('click', openProfile);

        container.appendChild(div);
    };

    const scrollToBottom = () => {
        const container = document.getElementById('piolaChatMessages');
        if (container) {
            setTimeout(() => {
                container.scrollTop = container.scrollHeight;
            }, 50);
        }
    };

    const updateUnreadBadge = () => {
        const badge = document.getElementById('chatUnreadBadge');
        if (!badge) return;
        const state = ChatCore.state;
        if (state.unreadCount > 0) {
            badge.textContent = state.unreadCount > 99 ? '99+' : state.unreadCount;
            badge.classList.add('visible');
        } else {
            badge.classList.remove('visible');
        }
    };

    return { injectHTML, bindEvents, toggleChat, showSetup, openProfileModal, renderAllMessages, scrollToBottom, updateUnreadBadge };
})();
