/**
 * THEME-GALLERY.JS — Compartir temas via Firebase
 *
 * Ahora usa el perfil del PiolaChat como identidad del autor.
 * Si no tenés perfil, te pide crear uno antes de compartir.
 *
 * Flujo: Compartir tema → ¿Tiene perfil? → Sí → Sube → No → Setup del chat → Sube
 */

if (typeof window.ThemeGallery === 'undefined') {
    window.ThemeGallery = (() => {

        // =====================================================================
        // CONFIGURACIÓN FIREBASE
        // =====================================================================
        const FIREBASE_CONFIG = {
            apiKey: "AIzaSyDcO_CpJ4x8DK2_t-obafVM0m2Pu9cKGWM",
            authDomain: "jueguitos-piola.firebaseapp.com",
            projectId: "jueguitos-piola",
            storageBucket: "jueguitos-piola.firebasestorage.app",
            messagingSenderId: "372800075568",
            appId: "1:372800075568:web:80e91799d1340d1a85faf5"
        };

        const FIRESTORE_COLLECTION = 'themes';
        const COLLECTION_USERS = 'users';
        const CHAT_PROFILE_KEY = 'piola_chat_profile';

        let db = null;
        let isFirebaseReady = false;

        // =====================================================================
        // INICIALIZACIÓN
        // =====================================================================
        const init = () => {
            try {
                if (!firebase.apps.length) {
                    firebase.initializeApp(FIREBASE_CONFIG);
                }
                db = firebase.firestore();
                isFirebaseReady = true;
                console.info('[ThemeGallery] Firebase conectado ✓');
            } catch (err) {
                console.error('[ThemeGallery] Error al inicializar Firebase:', err);
            }
        };

        // =====================================================================
        // PERFIL — lee del mismo localStorage que PiolaChat
        // =====================================================================

        /** Obtiene el perfil del chat (compartido con PiolaChat) */
        const _getProfile = () => {
            try {
                const raw = localStorage.getItem(CHAT_PROFILE_KEY);
                if (!raw) return null;
                return JSON.parse(raw);
            } catch {
                return null;
            }
        };

        /** Verifica que haya perfil. Si no, abre el setup del chat. */
        const _ensureProfile = () => {
            const profile = _getProfile();
            if (profile && profile.name) return profile;

            // Abrir el setup del chat para que cree su perfil
            if (typeof PiolaChat !== 'undefined' && PiolaChat.editProfile) {
                PiolaChat.editProfile();
            } else {
                alert('Creá tu perfil en el chat primero para poder compartir temas.');
            }
            return null;
        };

        // =====================================================================
        // COMPARTIR TEMA
        // =====================================================================

        /**
         * Sube un preset local a Firestore usando el perfil del chat como autor.
         * @param {Object} preset - Objeto preset del sistema local
         * @param {HTMLElement} btn - Botón que disparó la acción (feedback)
         */
        const shareTheme = async (preset, btn) => {
            if (!isFirebaseReady) {
                _showFeedback(btn, '❌ Sin conexión', true);
                return;
            }

            // Obtener perfil — si no existe, abrir setup y salir
            const profile = _ensureProfile();
            if (!profile) return;

            // Validar que tenga URL de fondo
            if (!preset.bgValue || preset.bgType !== 'url') {
                alert('Solo se pueden compartir temas con fondo de URL de internet.');
                return;
            }

            _showFeedback(btn, '⏳ Subiendo...', false);

            try {
                await db.collection(FIRESTORE_COLLECTION).add({
                    userId: profile.id,
                    name: preset.name,
                    bgUrl: preset.bgValue,
                    blur: preset.blur || '0',
                    themeColor: preset.themeColor || '#00f3ff',
                    cursor: preset.cursor || 'default',
                    createdAt: firebase.firestore.FieldValue.serverTimestamp()
                });

                // Marcar como compartido localmente
                preset.isShared = true;
                const localPresets = JSON.parse(localStorage.getItem('jueguitos_presets') || '[]');
                const updatedPresets = localPresets.map(p => p.id === preset.id ? preset : p);
                localStorage.setItem('jueguitos_presets', JSON.stringify(updatedPresets));

                _showFeedback(btn, '✓ Compartido', false);
                btn.classList.add('shared');
                btn.disabled = true;

            } catch (err) {
                console.error('[ThemeGallery] Error al compartir:', err);
                _showFeedback(btn, '❌ Error', true);
                setTimeout(() => {
                    btn.textContent = '⬆ Compartir';
                    btn.disabled = false;
                }, 2000);
            }
        };

        // =====================================================================
        // MODAL DE GALERÍA
        // =====================================================================
        const _injectGalleryModal = () => {
            if (document.getElementById('galleryModalOverlay')) return;
            const html = `
                <div class="gallery-modal-overlay" id="galleryModalOverlay">
                    <div class="gallery-modal">
                        <div class="gallery-header">
                            <h2><i data-lucide="globe" style="width:20px;height:20px;"></i> Galería Comunitaria</h2>
                            <button class="btn-close" id="btnCloseGallery">&times;</button>
                        </div>
                        <div class="gallery-body">
                            <div class="remote-themes-grid" id="remoteThemesGrid"></div>
                        </div>
                        <div class="gallery-footer">
                            <span>Compartí tu tema desde los ajustes para que aparezca acá</span>
                        </div>
                    </div>
                </div>
            `;
            document.body.insertAdjacentHTML('beforeend', html);

            document.getElementById('btnCloseGallery').onclick = closeGallery;
            document.getElementById('galleryModalOverlay').onclick = (e) => {
                if (e.target === document.getElementById('galleryModalOverlay')) closeGallery();
            };

            if (typeof lucide !== 'undefined') lucide.createIcons();
        };

        const openGallery = () => {
            _injectGalleryModal();
            const modal = document.getElementById('galleryModalOverlay');
            modal.classList.add('active');
            loadRemoteThemes();
        };

        const closeGallery = () => {
            const modal = document.getElementById('galleryModalOverlay');
            if (modal) modal.classList.remove('active');
        };

        const loadRemoteThemes = async () => {
            const grid = document.getElementById('remoteThemesGrid');
            if (!grid) return;

            if (!isFirebaseReady) {
                grid.innerHTML = '<div class="gallery-status-msg">Firebase no está conectado.</div>';
                return;
            }

            grid.innerHTML = '<div class="gallery-status-msg"><span class="gallery-spinner"></span> Cargando temas...</div>';

            try {
                // Fetch profiles dict for dynamic linking (avoids duplication)
                const usersSnap = await db.collection(COLLECTION_USERS).get();
                const usersDict = {};
                usersSnap.forEach(d => usersDict[d.id] = d.data());

                const snapshot = await db.collection(FIRESTORE_COLLECTION).orderBy('createdAt', 'desc').get();
                if (snapshot.empty) {
                    grid.innerHTML = '<div class="gallery-status-msg">No hay temas compartidos todavía. ¡Sé el primero!</div>';
                    return;
                }
                grid.innerHTML = '';
                const myProfile = _getProfile();
                const myId = myProfile?.id || '';

                snapshot.forEach(doc => {
                    const theme = { id: doc.id, ...doc.data() };
                    // Resolve author from usersDict
                    const authorInfo = usersDict[theme.userId];
                    theme._authorName = authorInfo?.name || 'Anon';
                    theme._authorAvatar = authorInfo?.avatar || `https://api.dicebear.com/7.x/thumbs/svg?seed=${encodeURIComponent(theme.userId || 'anon')}`;

                    const card = _buildRemoteCard(theme, myId);
                    grid.appendChild(card);
                });
            } catch (err) {
                console.error('[ThemeGallery] Error cargando temas:', err);
                grid.innerHTML = '<div class="gallery-status-msg" style="color:rgba(255,100,100,0.8); border-color:rgba(255,100,100,0.15);">Error de conexión. Intentá de nuevo más tarde.</div>';
            }
        };

        const _buildRemoteCard = (theme, myId) => {
            // Determinar si el tema es mío comparando por userId
            const isOwn = theme.userId === myId && myId !== '';
            const card = document.createElement('div');
            card.className = 'remote-theme-card';

            const ownBadge = isOwn ? '<span class="remote-theme-own-badge">Mío</span>' : '';
            const deleteBtnHtml = isOwn ? '<button class="btn-delete-remote-theme" title="Borrar">✕</button>' : '';

            // Avatar y nombre dinámico
            const authorAvatar = theme._authorAvatar;
            const authorName = theme._authorName;

            card.innerHTML = `
                <div class="remote-theme-preview" style="background-image: url('${theme.bgUrl}')">
                    <div class="remote-theme-color-dot" style="background: ${theme.themeColor || '#00f3ff'};"></div>
                    ${ownBadge}
                </div>
                <div class="remote-theme-info">
                    <div class="remote-theme-name" title="${theme.name}">${theme.name}</div>
                    <div class="remote-theme-author">
                        <img src="${authorAvatar}" alt=""
                             onerror="this.style.display='none'">
                        ${authorName}
                    </div>
                    <div class="remote-theme-actions">
                        <button class="btn-apply-theme">Aplicar</button>
                        ${deleteBtnHtml}
                    </div>
                </div>
            `;

            // Aplicar tema
            card.querySelector('.btn-apply-theme').addEventListener('click', (e) => {
                if (typeof SettingsManager !== 'undefined') {
                    localStorage.setItem('jueguitos_settings_bg_type', 'url');
                    localStorage.setItem('jueguitos_settings_bg_value', theme.bgUrl);
                    localStorage.setItem('jueguitos_settings_blur', theme.blur || '0');
                    localStorage.setItem('jueguitos_settings_color', theme.themeColor || '#00f3ff');
                    localStorage.setItem('jueguitos_settings_cursor', theme.cursor || 'default');

                    if (typeof SettingsManager.loadAndApply === 'function') {
                        SettingsManager.loadAndApply();
                    } else if (typeof SettingsManager.applySettings === 'function') {
                        SettingsManager.applySettings();
                    }

                    e.target.textContent = '✓ Aplicado';
                    e.target.style.background = 'rgba(0, 255, 136, 0.15)';
                    e.target.style.color = '#00ff88';
                    e.target.style.borderColor = 'rgba(0, 255, 136, 0.3)';

                    setTimeout(() => {
                        e.target.textContent = 'Aplicar';
                        e.target.style.background = '';
                        e.target.style.color = '';
                        e.target.style.borderColor = '';
                    }, 2000);
                }
            });

            // Borrar tema propio
            if (isOwn) {
                card.querySelector('.btn-delete-remote-theme').addEventListener('click', async () => {
                    if (confirm('¿Seguro querés borrar tu tema de la galería?')) {
                        try {
                            await db.collection(FIRESTORE_COLLECTION).doc(theme.id).delete();

                            // Limpiar flag isShared del preset local
                            const localPresets = JSON.parse(localStorage.getItem('jueguitos_presets') || '[]');
                            const updatedPresets = localPresets.map(p => {
                                const isSameTheme = p.bgValue === theme.bgUrl &&
                                    p.themeColor === theme.themeColor &&
                                    p.blur === theme.blur;
                                return isSameTheme ? { ...p, isShared: false } : p;
                            });
                            localStorage.setItem('jueguitos_presets', JSON.stringify(updatedPresets));

                            loadRemoteThemes();
                        } catch (err) {
                            console.error('[ThemeGallery] Error al borrar tema:', err);
                        }
                    }
                });
            }
            return card;
        };

        // =====================================================================
        // HELPERS
        // =====================================================================
        const _showFeedback = (btn, text, isError) => {
            if (!btn) return;
            btn.textContent = text;
            btn.disabled = !isError;
        };

        // =====================================================================
        // API PÚBLICA
        // =====================================================================
        return { init, shareTheme, openGallery, closeGallery };

    })();
}

document.addEventListener('DOMContentLoaded', () => {
    if (window.ThemeGallery) window.ThemeGallery.init();
});
