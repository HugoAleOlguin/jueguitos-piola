/**
 * SETTINGS.JS - Gestor de Configuración (v2.0 Modular)
 */
if (typeof window.SettingsManager === 'undefined') {
    window.SettingsManager = (() => {

        // ========================================================================
        // CORE INTEGRATION
        // ========================================================================
        const init = () => {
            SettingsCore.loadSettings();
            
            const fileInput = document.getElementById('settingBgFile');
            if (fileInput) fileInput.value = '';
            
            bindGlobalEvents();
            applySettings();
        };

        const applySettings = async () => {
            const config = SettingsCore.getAll();
            const isLite = config.liteMode === 'true';

            document.body.classList.toggle('lite-mode', isLite);

            // Aplicar clase de estilo de tarjetas
            const cardStyle = config.cardStyle || 'default';
            const allCardStyles = ['default', 'compact', 'rainbow', 'cyber'];
            document.body.classList.remove(...allCardStyles.map(s => `card-style-${s}`));
            document.body.classList.add(`card-style-${cardStyle}`);
            _applyCyberElements(cardStyle === 'cyber');

            await BackgroundManager.apply(config.bgType, config.bgValue, isLite);
            AppearanceManager.apply(config.blur, config.themeColor, isLite);
            await CursorManager.set(config.cursor, BackgroundManager.ImageCacheStore);
            ParticleSystem.start(config.particles === 'true' && !isLite, config.themeColor);
            CursorManager.setTrail(config.trail === 'true' && !isLite, config.themeColor);
            EffectsManager.enableSounds(config.uiSounds === 'true');
        };

        // ========================================================================
        // UI HANDLERS (Modal)
        // ========================================================================
        const bindGlobalEvents = () => {
            const btnOpen = document.getElementById('settingsToggle');
            if (btnOpen) btnOpen.addEventListener('click', openModal);
        };

        const bindModalEvents = () => {
            document.getElementById('btnSaveSettings').onclick = saveFromUI;
            document.getElementById('btnResetSettings').onclick = resetDefaults;
            document.getElementById('btnCancelSettings').onclick = closeModal;

            const inputs = {
                url: document.getElementById('settingBgUrl'),
                file: document.getElementById('settingBgFile'),
                blur: document.getElementById('settingBlur'),
                color: document.getElementById('settingColor'),
                presets: document.querySelectorAll('.color-btn'),
                cursorCards: document.querySelectorAll('.option-card'),
                particles: document.getElementById('settingParticles'),
                trail: document.getElementById('settingCursorTrail'),
                uiSounds: document.getElementById('settingUiSounds')
            };

            if (inputs.url) inputs.url.oninput = (e) => BackgroundManager.updatePreviewLocally(e.target.value);
            if (inputs.file) inputs.file.onchange = (e) => BackgroundManager.updatePreviewLocally(null, e.target.files[0]);

            if (inputs.blur) inputs.blur.oninput = (e) => document.documentElement.style.setProperty('--glass-blur', `${e.target.value}px`);

            if (inputs.color) inputs.color.oninput = (e) => AppearanceManager.updateColor(e.target.value);
            inputs.presets.forEach(btn => btn.onclick = () => AppearanceManager.updateColor(btn.dataset.color, btn));

            const cursorCards = document.querySelectorAll('.option-card[data-cursor]');
            cursorCards.forEach(card => card.onclick = () => {
                document.querySelectorAll('.option-card').forEach(c => c.classList.remove('active'));
                card.classList.add('active');
                const cursorVal = card.dataset.cursor;
                document.getElementById('settingCursor').value = cursorVal;
                if (cursorVal !== 'custom') CursorManager.set(cursorVal, BackgroundManager.ImageCacheStore);
            });

            const btnCustom = document.getElementById('btnCustomCursor');
            const fileInput = document.getElementById('settingCursorFile');

            if (btnCustom && fileInput) {
                btnCustom.onclick = () => fileInput.click();
                fileInput.onchange = (e) => {
                    if (e.target.files && e.target.files[0]) {
                        document.querySelectorAll('.option-card').forEach(c => c.classList.remove('active'));
                        btnCustom.classList.add('active');
                        document.getElementById('settingCursor').value = 'custom';
                        const tempUrl = URL.createObjectURL(e.target.files[0]);
                        document.documentElement.style.cursor = `url('${tempUrl}'), auto`;
                        document.body.style.cursor = `url('${tempUrl}'), auto`;
                        btnCustom.dataset.cursor = 'custom';
                    }
                };
            }

            // Selector de estilo de tarjetas (chip buttons)
            document.querySelectorAll('.card-chip').forEach(btn => {
                btn.onclick = () => {
                    document.querySelectorAll('.card-chip').forEach(b => b.classList.remove('active'));
                    btn.classList.add('active');
                    document.getElementById('settingCardStyle').value = btn.dataset.style;
                };
            });

            document.getElementById('btnSavePreset').onclick = savePreset;
            loadPresetsList();
            initTabs();
        };

        const populateModalUI = () => {
            const modal = document.getElementById('settingsModal');
            if (!modal) return;
            
            const config = SettingsCore.getAll();
            const fileInput = document.getElementById('settingBgFile');
            if (fileInput) fileInput.value = '';

            document.getElementById('settingBgUrl').value = config.bgType === 'url' ? config.bgValue : '';
            document.getElementById('settingBlur').value = config.blur;
            document.getElementById('settingColor').value = config.themeColor;
            document.getElementById('settingLiteMode').checked = config.liteMode === 'true';
            document.getElementById('settingParticles').checked = config.particles === 'true';
            document.getElementById('settingCursorTrail').checked = config.trail === 'true';
            document.getElementById('settingUiSounds').checked = config.uiSounds === 'true';

            // Marcar el chip de estilo activo
            const activeCardStyle = config.cardStyle || 'default';
            document.getElementById('settingCardStyle').value = activeCardStyle;
            document.querySelectorAll('.card-chip').forEach(btn => {
                btn.classList.toggle('active', btn.dataset.style === activeCardStyle);
            });

            document.querySelectorAll('.option-card').forEach(c => {
                c.classList.toggle('active', c.dataset.cursor === config.cursor);
            });
            document.getElementById('settingCursor').value = config.cursor;

            const isUrl = config.bgType === 'url';
            document.getElementById('settingBgPreview').style.backgroundImage = isUrl ? `url('${config.bgValue}')` : '';
        };

        const openModal = () => {
            const modal = document.getElementById('settingsModal');
            if (!modal) return;

            SettingsCore.loadSettings();
            populateModalUI();
            bindModalEvents();
            
            modal.style.display = 'flex';
            void modal.offsetWidth;
            modal.classList.add('active');
            document.body.style.overflow = 'hidden';

            // Restaurar la pestaña activa de la sesión anterior
            const lastTab = sessionStorage.getItem('settings_active_tab') || 'appearance';
            switchTab(lastTab);
        };

        const closeModal = () => {
            const modal = document.getElementById('settingsModal');
            modal.classList.remove('active');

            const fileInput = document.getElementById('settingBgFile');
            if (fileInput) fileInput.value = '';

            document.body.style.overflow = '';
            setTimeout(() => modal.style.display = 'none', 300);
        };

        // ========================================================================
        // TAB NAVIGATION
        // ========================================================================

        /**
         * Inicializa listeners de las pestañas del sidebar de configuración.
         */
        const initTabs = () => {
            document.querySelectorAll('.nav-tab').forEach(tab => {
                tab.onclick = () => switchTab(tab.dataset.tab);
            });
        };

        /**
         * Activa la pestaña indicada y desactiva las demás.
         * Persiste la selección en sessionStorage para restaurarla al reabrir.
         * @param {string} tabId - valor del data-tab del botón (ej: 'appearance')
         */
        const switchTab = (tabId) => {
            const tabs = document.querySelectorAll('.nav-tab');
            const panes = document.querySelectorAll('.tab-pane');

            // Fallback: si el tabId no existe, usamos el primero
            const validIds = [...tabs].map(t => t.dataset.tab);
            const resolved = validIds.includes(tabId) ? tabId : (validIds[0] || 'appearance');

            tabs.forEach(t => t.classList.toggle('active', t.dataset.tab === resolved));
            panes.forEach(p => p.classList.toggle('active', p.id === `tab-${resolved}`));

            sessionStorage.setItem('settings_active_tab', resolved);
        };

        // ========================================================================
        // SAVE FROM UI
        // ========================================================================

        const saveFromUI = async () => {
            const btn = document.getElementById('btnSaveSettings');
            btn.innerHTML = 'Guardando...';
            btn.disabled = true;

            try {
                const bgFile = document.getElementById('settingBgFile').files[0];
                const bgUrl = document.getElementById('settingBgUrl').value.trim();
                const blur = document.getElementById('settingBlur').value;
                const color = document.getElementById('settingColor').value;
                const isLite = document.getElementById('settingLiteMode').checked;
                const cursor = document.getElementById('settingCursor').value;
                const particles = document.getElementById('settingParticles').checked;
                const trail = document.getElementById('settingCursorTrail').checked;
                const uiSounds = document.getElementById('settingUiSounds').checked;
                const cardStyle = document.getElementById('settingCardStyle').value || 'default';

                let type = 'default';
                let value = '';

                const savedBgType = localStorage.getItem(SettingsCore.STORAGE_KEYS.BG_TYPE) || 'default';
                const savedBgValue = localStorage.getItem(SettingsCore.STORAGE_KEYS.BG_VALUE) || '';

                if (bgFile) {
                    await BackgroundManager.ImageCacheStore.saveBlob('custom_bg', bgFile);
                    type = 'blob';
                    value = 'indexeddb';
                } else if (bgUrl) {
                    type = 'url';
                    value = bgUrl;
                } else if (savedBgType !== 'default') {
                    type = savedBgType;
                    value = savedBgValue;
                }

                const cursorFile = document.getElementById('settingCursorFile').files[0];
                if (cursorFile) {
                    await BackgroundManager.ImageCacheStore.saveBlob('custom_cursor', cursorFile);
                }

                localStorage.setItem(SettingsCore.STORAGE_KEYS.BG_TYPE, type);
                localStorage.setItem(SettingsCore.STORAGE_KEYS.BG_VALUE, value);
                localStorage.setItem(SettingsCore.STORAGE_KEYS.BLUR, blur);
                localStorage.setItem(SettingsCore.STORAGE_KEYS.THEME_COLOR, color);
                localStorage.setItem(SettingsCore.STORAGE_KEYS.LITE_MODE, isLite);
                localStorage.setItem(SettingsCore.STORAGE_KEYS.CURSOR, cursor);
                localStorage.setItem(SettingsCore.STORAGE_KEYS.PARTICLES, particles);
                localStorage.setItem(SettingsCore.STORAGE_KEYS.TRAIL, trail);
                localStorage.setItem(SettingsCore.STORAGE_KEYS.UI_SOUNDS, uiSounds);
                localStorage.setItem(SettingsCore.STORAGE_KEYS.CARD_STYLE, cardStyle);

                if (typeof AchievementManager !== 'undefined') {
                    if (parseInt(blur) >= 20) AchievementManager.unlock('blur');
                    if (isLite) AchievementManager.unlock('potato');
                }

                SettingsCore.setAll({
                    bgType: type, bgValue: value, blur, themeColor: color,
                    liteMode: String(isLite), cursor, particles: String(particles),
                    trail: String(trail), uiSounds: String(uiSounds), cardStyle
                });

                await applySettings();
                closeModal();
            } catch (e) {
                console.error(e);
                alert('Error al guardar.');
            } finally {
                btn.innerHTML = 'Guardar Cambios';
                btn.disabled = false;
            }
        };

        const resetDefaults = () => {
            if (confirm('¿Restaurar todo a fábrica?')) {
                Object.values(SettingsCore.STORAGE_KEYS).forEach(k => localStorage.removeItem(k));
                location.reload();
            }
        };

        // ========================================================================
        // CYBER CARD — Inyección de elementos DOM
        // Las scan-lines y cyber-lines necesitan nodos reales porque los
        // pseudo-elementos no pueden usarse con overflow:hidden en tarjetas dinámicas.
        // ========================================================================
        const _applyCyberElements = (enable) => {
            const cards = document.querySelectorAll('.game-card');
            if (enable) {
                cards.forEach(card => {
                    if (card.querySelector('.cyber-scan-line')) return; // Evitar duplicados
                    const scan = document.createElement('div');
                    scan.className = 'cyber-scan-line';
                    const line1 = document.createElement('div');
                    line1.className = 'cyber-line';
                    const line2 = document.createElement('div');
                    line2.className = 'cyber-line';
                    const line3 = document.createElement('div');
                    line3.className = 'cyber-line';
                    card.append(scan, line1, line2, line3);
                });
            } else {
                // Limpiar elementos cuando se cambia de estilo
                document.querySelectorAll('.cyber-scan-line, .cyber-line').forEach(el => el.remove());
            }
        };

        // ========================================================================
        // PRESETS
        // ========================================================================
        const getPresets = () => JSON.parse(localStorage.getItem('jueguitos_presets') || '[]');

        const savePreset = async () => {
            const name = document.getElementById('presetName').value.trim();
            if (!name) return;

            const bgFile = document.getElementById('settingBgFile').files[0];
            const bgUrl = document.getElementById('settingBgUrl').value.trim();

            let type = SettingsCore.getSetting('bgType');
            let value = SettingsCore.getSetting('bgValue');

            if (bgFile) {
                const uniqueKey = `preset_bg_${Date.now()}`;
                await BackgroundManager.ImageCacheStore.saveBlob(uniqueKey, bgFile);
                type = 'blob';
                value = uniqueKey;
            } else if (bgUrl) {
                type = 'url';
                value = bgUrl;
            }

            const preset = {
                id: Date.now(),
                name,
                bgType: type,
                bgValue: value,
                blur: document.getElementById('settingBlur').value,
                themeColor: document.getElementById('settingColor').value,
                cursor: document.getElementById('settingCursor').value
            };

            const list = getPresets();
            list.push(preset);
            localStorage.setItem('jueguitos_presets', JSON.stringify(list));
            loadPresetsList();
            document.getElementById('presetName').value = '';

            if (typeof AchievementManager !== 'undefined') {
                AchievementManager.unlock('diseño');
            }
        };

        const loadPresetsList = async () => {
            const container = document.getElementById('presetsGrid');
            const list = getPresets();
            container.innerHTML = '';

            if (list.length === 0) {
                container.innerHTML = '<div style="grid-column:1/-1; text-align:center; color:#666; font-style:italic; padding:10px;">Sin temas guardados</div>';
                return;
            }

            for (const p of list) {
                const div = document.createElement('div');
                div.className = 'preset-card';

                let bgStyle = '#333';
                if (p.bgType === 'url') {
                    bgStyle = `url('${p.bgValue}')`;
                } else if (p.bgType === 'blob') {
                    try {
                        const blob = await BackgroundManager.ImageCacheStore.getBlob(p.bgValue);
                        if (blob) {
                            const url = URL.createObjectURL(blob);
                            bgStyle = `url('${url}')`;
                        }
                    } catch (e) {
                        console.warn('Error loading preset preview:', e);
                    }
                }

                const canShare = p.bgType === 'url' && p.bgValue;
                let shareBtnHtml = '';
                if (canShare) {
                    if (p.isShared) {
                        shareBtnHtml = `<button class="btn-share-preset shared" title="Ya está en la galería" disabled>✓ Compartido</button>`;
                    } else {
                        shareBtnHtml = `<button class="btn-share-preset" title="Compartir en galería">⬆ Compartir</button>`;
                    }
                }

                div.innerHTML = `
                <div class="preset-preview" style="background-color: #222;">
                    <div style="width:100%; height:100%; background: ${bgStyle} center/cover no-repeat;"></div>
                    <div style="position:absolute; bottom:5px; left:5px; width:15px; height:15px; background:${p.themeColor}; border-radius:50%; border:1px solid #fff;"></div>
                </div>
                <div class="preset-info">
                    <span>${p.name}</span>
                    <div style="display:flex; align-items:center; gap:6px;">
                        ${shareBtnHtml}
                        <button class="preset-delete" title="Borrar">&times;</button>
                    </div>
                </div>
                `;

                div.onclick = (e) => {
                    if (e.target.classList.contains('preset-delete')) return;
                    if (e.target.classList.contains('btn-share-preset')) return;
                    applyPreset(p);
                };

                if (canShare) {
                    const shareBtn = div.querySelector('.btn-share-preset');
                    if (shareBtn) {
                        shareBtn.onclick = () => {
                            if (typeof ThemeGallery !== 'undefined') {
                                ThemeGallery.shareTheme(p, shareBtn);
                            } else {
                                alert('Módulo de galería no disponible.');
                            }
                        };
                    }
                }

                div.querySelector('.preset-delete').onclick = async () => {
                    if (!confirm('¿Borrar este tema?')) return;
                    if (p.bgType === 'blob') {
                        await BackgroundManager.ImageCacheStore.deleteBlob(p.bgValue);
                    }
                    const newList = getPresets().filter(item => item.id !== p.id);
                    localStorage.setItem('jueguitos_presets', JSON.stringify(newList));
                    loadPresetsList();
                };

                container.appendChild(div);
            }
        };

        const applyPreset = async (p) => {
            const config = SettingsCore.getAll();
            const newConfig = {
                ...config,
                bgType: p.bgType,
                bgValue: p.bgValue,
                blur: p.blur,
                themeColor: p.themeColor,
                cursor: p.cursor || 'default'
            };
            SettingsCore.setAll(newConfig);

            localStorage.setItem(SettingsCore.STORAGE_KEYS.BG_TYPE, p.bgType);
            localStorage.setItem(SettingsCore.STORAGE_KEYS.BG_VALUE, p.bgValue);
            localStorage.setItem(SettingsCore.STORAGE_KEYS.BLUR, p.blur);
            localStorage.setItem(SettingsCore.STORAGE_KEYS.THEME_COLOR, p.themeColor);
            localStorage.setItem(SettingsCore.STORAGE_KEYS.CURSOR, p.cursor || 'default');

            await applySettings();
            openModal();
        };

        const loadAndApply = async () => {
            SettingsCore.loadSettings();
            await applySettings();

            const modal = document.getElementById('settingsModal');
            if (modal && modal.classList.contains('active')) {
                populateModalUI();
            }
        };

        return {
            init,
            applySettings,
            loadAndApply
        };
    })();
}

document.addEventListener('DOMContentLoaded', () => {
    if (window.SettingsManager) window.SettingsManager.init();
});
