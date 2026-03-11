const ChatFirestore = (() => {
    const COLLECTION_MESSAGES = 'messages';
    const COLLECTION_USERS = 'users';
    const MAX_MSG_LENGTH = 300;
    const MSG_LOAD_LIMIT = 80;

    const startListeners = () => {
        const state = ChatCore.state;
        if (!state.isReady || !state.db) return;

        if (state.unsubMessages) state.unsubMessages();
        if (state.unsubUsers) state.unsubUsers();

        state.unsubMessages = state.db.collection(COLLECTION_MESSAGES)
            .orderBy('createdAt', 'asc')
            .limitToLast(MSG_LOAD_LIMIT)
            .onSnapshot((snapshot) => {
                state.currentMessages = snapshot.docs;
                ChatUI.renderAllMessages();

                let lastRead = parseInt(localStorage.getItem('piola_chat_last_read') || '0', 10);

                if (state.isOpen) {
                    lastRead = Date.now();
                    localStorage.setItem('piola_chat_last_read', lastRead.toString());
                    state.unreadCount = 0;
                } else {
                    const newMessages = snapshot.docs.filter(doc => {
                        const data = doc.data();
                        if (data.authorId === state.profile?.id) return false;

                        const msgTime = data.createdAt ? data.createdAt.toMillis() : Date.now();
                        return msgTime > lastRead;
                    });

                    if (newMessages.length > 0) {
                        state.unreadCount = newMessages.length;
                    } else {
                        state.unreadCount = 0;
                    }
                }

                ChatUI.updateUnreadBadge();
            }, (err) => {
                console.error('[PiolaChat] Error en listener de mensajes:', err);
            });

        state.unsubUsers = state.db.collection(COLLECTION_USERS)
            .onSnapshot((snapshot) => {
                state.userMap.clear();
                let onlineCount = 0;
                snapshot.forEach(doc => {
                    const data = doc.data();
                    state.userMap.set(doc.id, data);
                    if (data.online) onlineCount++;
                });
                const countEl = document.getElementById('chatOnlineCount');
                if (countEl) {
                    countEl.textContent = onlineCount > 0 ? `${onlineCount} online` : '';
                }
                ChatUI.renderAllMessages();
            }, (err) => {
                console.error('[PiolaChat] Error en listener de usuarios:', err);
            });
    };

    const sendMessage = async () => {
        const state = ChatCore.state;
        if (!state.isReady || !state.profile) return;

        const input = document.getElementById('piolaChatInput');
        const text = input.value.trim();
        if (!text) return;

        input.value = '';

        const shouldScroll = true;
        const isImage = ChatHelpers.isImageUrl(text);

        try {
            const msgData = {
                authorId: state.profile.id,
                text: text.slice(0, MAX_MSG_LENGTH),
                type: isImage ? 'media' : 'message',
                createdAt: firebase.firestore.FieldValue.serverTimestamp()
            };

            if (isImage) {
                msgData.mediaUrl = text;
            }

            await state.db.collection(COLLECTION_MESSAGES).add(msgData);
            
            if (shouldScroll) {
                ChatUI.scrollToBottom();
            }
        } catch (err) {
            console.error('[PiolaChat] Error al enviar mensaje:', err);
        }
    };

    const updatePresence = (online) => {
        const state = ChatCore.state;
        if (!state.isReady || !state.profile || !state.db) return;

        state.db.collection(COLLECTION_USERS).doc(state.profile.id).set({
            name: state.profile.name,
            avatar: state.profile.avatar,
            description: state.profile.description || '',
            favoriteGame: state.profile.favoriteGame || '',
            nameColor: state.profile.nameColor || ChatProfile.DEFAULT_NAME_COLOR,
            online: online,
            lastSeen: firebase.firestore.FieldValue.serverTimestamp(),
            updatedAt: firebase.firestore.FieldValue.serverTimestamp()
        }, { merge: true })
            .catch(err => console.error('[PiolaChat] Error actualizando usuario:', err));
    };

    return { startListeners, sendMessage, updatePresence, MAX_MSG_LENGTH };
})();
