/**
 * THEME-GALLERY.JS — Compartir temas via Firebase (BETA)
 * 
 * Sin panel de galería. Solo un botón "Compartir" en los presets locales
 * que tiene URL de fondo. Al clickear: pide tu nombre si no está guardado
 * y sube el tema a Firestore en un clic.
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

        const FIRESTORE_COLLECTION = 'shared_themes';
        const AUTHOR_KEY = 'jueguitos_gallery_author';

        let db = null;
        let isFirebaseReady = false;

        // =====================================================================
        // INICIALIZACIÓN — solo Firebase, sin inyectar HTML
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
        // COMPARTIR TEMA — flujo completo en un clic
        // =====================================================================

        /**
         * Sube un preset local a Firestore.
         * Si no hay nombre de autor guardado, pide uno con prompt.
         * @param {Object} preset - Objeto preset del sistema local de settings
         * @param {HTMLElement} btn - Botón que disparó la acción (para feedback)
         */
        const shareTheme = async (preset, btn) => {
            if (!isFirebaseReady) {
                _showFeedback(btn, '❌ Sin conexión', true);
                return;
            }

            // Obtener o pedir nombre de autor
            let author = localStorage.getItem(AUTHOR_KEY) || '';

            if (!author) {
                author = window.prompt('¿Con qué nombre querés aparecer en la galería?');
                if (!author || !author.trim()) return; // El usuario canceló
                author = author.trim().slice(0, 20);
                localStorage.setItem(AUTHOR_KEY, author);
            }

            // Validar que tenga URL de fondo (las imágenes locales no son portables)
            if (!preset.bgValue || preset.bgType !== 'url') {
                alert('Solo se pueden compartir temas con fondo de URL de internet.');
                return;
            }

            _showFeedback(btn, '⏳ Subiendo...', false);

            try {
                await db.collection(FIRESTORE_COLLECTION).add({
                    name: preset.name,
                    author,
                    bgUrl: preset.bgValue,
                    blur: preset.blur || '0',
                    themeColor: preset.themeColor || '#00f3ff',
                    cursor: preset.cursor || 'default',
                    createdAt: firebase.firestore.FieldValue.serverTimestamp()
                });

                // Marcar como compartido localmente y persistirlo
                preset.isShared = true;
                const localPresets = JSON.parse(localStorage.getItem('jueguitos_presets') || '[]');
                const updatedPresets = localPresets.map(p => p.id === preset.id ? preset : p);
                localStorage.setItem('jueguitos_presets', JSON.stringify(updatedPresets));

                _showFeedback(btn, '✓ Compartido', false);
                btn.classList.add('shared');
                btn.disabled = true;

                // Si la persona subió por la via de ajustes, podemos forzar un re-render del settings.
                if (window.SettingsManager && SettingsManager.loadPresetsList) {
                    // No llamamos loadPresetsList para no interrumpir pero ya persistió
                }

            } catch (err) {
                console.error('[ThemeGallery] Error al compartir:', err);
                _showFeedback(btn, '❌ Error', true);
                // Restaurar botón tras el error
                setTimeout(() => {
                    btn.textContent = '⬆ Compartir';
                    btn.disabled = false;
                }, 2000);
            }
        };

        // =====================================================================
        // MODAL INDEPENDIENTE GALERÍA
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
                            <span style="color:#888; font-style:italic; font-size:0.8rem;">Comparte un tema para que aparezca aquí</span>
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
                grid.innerHTML = '<div class="gallery-status-msg">Ups, Firebase no está conectado aún.</div>';
                return;
            }

            grid.innerHTML = '<div class="gallery-status-msg"><span class="gallery-spinner"></span> Buscando temas..</div>';

            try {
                const snapshot = await db.collection(FIRESTORE_COLLECTION).orderBy('createdAt', 'desc').get();
                if (snapshot.empty) {
                    grid.innerHTML = '<div class="gallery-status-msg">No hay temas subidos todavía.</div>';
                    return;
                }
                grid.innerHTML = '';
                const myAuthor = localStorage.getItem(AUTHOR_KEY) || '';
                snapshot.forEach(doc => {
                    const theme = { id: doc.id, ...doc.data() };
                    const card = _buildRemoteCard(theme, myAuthor);
                    grid.appendChild(card);
                });
            } catch (err) {
                console.error(err);
                grid.innerHTML = '<div class="gallery-status-msg" style="color:#ff6b6b; border-color:rgba(255,107,107,0.2);">Error de conexión o permisos. se rompió todo mal, es culpa de Milei...</div>';
            }
        };

        const _buildRemoteCard = (theme, myAuthor) => {
            const isOwn = theme.author === myAuthor && myAuthor !== '';
            const card = document.createElement('div');
            card.className = 'remote-theme-card';

            const ownBadge = isOwn ? '<span class="remote-theme-own-badge">Mío</span>' : '';
            const deleteBtnHtml = isOwn ? '<button class="btn-delete-remote-theme" title="Borrar">✕</button>' : '';

            card.innerHTML = `
                <div class="remote-theme-preview" style="background-image: url('${theme.bgUrl}')">
                    <div class="remote-theme-color-dot" style="background: ${theme.themeColor || '#00f3ff'};"></div>
                    ${ownBadge}
                </div>
                <div class="remote-theme-info">
                    <div class="remote-theme-name" title="${theme.name}">${theme.name}</div>
                    <div class="remote-theme-author">por ${theme.author}</div>
                    <div class="remote-theme-actions">
                        <button class="btn-apply-theme">Aplicar</button>
                        ${deleteBtnHtml}
                    </div>
                </div>
            `;

            // Apply Theme
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
                    e.target.style.background = 'color-mix(in srgb, #00ff88 20%, transparent)';
                    e.target.style.color = '#00ff88';
                    e.target.style.borderColor = 'rgba(0, 255, 136, 0.4)';

                    setTimeout(() => {
                        e.target.textContent = 'Aplicar';
                        e.target.style.background = '';
                        e.target.style.color = '';
                        e.target.style.borderColor = '';
                    }, 2000);
                }
            });

            if (isOwn) {
                card.querySelector('.btn-delete-remote-theme').addEventListener('click', async () => {
                    if (confirm('¿Seguro quieres borrar tu tema de la galería pública?')) {
                        try {
                            await db.collection(FIRESTORE_COLLECTION).doc(theme.id).delete();
                            loadRemoteThemes();
                        } catch (err) { }
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
