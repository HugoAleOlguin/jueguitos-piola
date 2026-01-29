// ============================================================================
// THEME.JS - TEMA CLARO/OSCURO SIMPLE
// ============================================================================
//
// Tema oscuro por defecto, tema claro activable con el botón
//
// ============================================================================

(function () {
    const THEME_KEY = 'jueguitosTheme';

    // Obtener tema guardado (oscuro por defecto)
    const getSavedTheme = () => localStorage.getItem(THEME_KEY) || 'dark';

    // Aplicar tema
    const applyTheme = (theme) => {
        if (theme === 'light') {
            document.documentElement.setAttribute('data-theme', 'light');
        } else {
            document.documentElement.removeAttribute('data-theme');
        }

        // Actualizar ícono del botón
        const toggleBtn = document.getElementById('themeToggle');
        if (toggleBtn) {
            const sunIcon = '<svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><circle cx="12" cy="12" r="5"/><path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"/></svg>';
            const moonIcon = '<svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>';
            toggleBtn.innerHTML = theme === 'light' ? sunIcon : moonIcon;
            toggleBtn.title = theme === 'light' ? 'Cambiar a tema oscuro' : 'Cambiar a tema claro';
        }
    };

    // Guardar y alternar tema
    const toggleTheme = () => {
        const current = document.documentElement.hasAttribute('data-theme') ? 'light' : 'dark';
        const newTheme = current === 'light' ? 'dark' : 'light';
        localStorage.setItem(THEME_KEY, newTheme);
        applyTheme(newTheme);
    };

    // Aplicar tema inmediatamente
    applyTheme(getSavedTheme());

    // Configurar botón cuando el DOM esté listo
    document.addEventListener('DOMContentLoaded', () => {
        const toggleBtn = document.getElementById('themeToggle');
        if (toggleBtn) {
            toggleBtn.addEventListener('click', toggleTheme);
        }
    });

})();


// ============================================================================
// CACHÉ OFFLINE CON VERSIONES AUTOMÁTICAS
// ============================================================================
//
// - Guarda los datos de juegos en localStorage
// - Compara version.json para detectar actualizaciones
// - Si hay nueva versión, limpia caché y recarga automáticamente
//
// ============================================================================

(function () {
    const CACHE_KEY = 'jueguitosGamesCache';
    const VERSION_KEY = 'jueguitosVersion';
    const CACHE_EXPIRY = 24 * 60 * 60 * 1000; // 24 horas fallback

    // Verificar actualizaciones al cargar
    async function checkForUpdates() {
        try {
            // Agregar timestamp para evitar caché del navegador
            const response = await fetch(`version.json?t=${Date.now()}`);
            if (!response.ok) return;

            const data = await response.json();
            const serverVersion = data.version;
            const localVersion = localStorage.getItem(VERSION_KEY);

            // Si hay nueva versión, limpiar caché
            if (localVersion && localVersion !== serverVersion) {
                console.log(`Nueva versión detectada: ${localVersion} → ${serverVersion}`);
                localStorage.removeItem(CACHE_KEY);
                localStorage.setItem(VERSION_KEY, serverVersion);

                // Recargar sin caché
                location.reload(true);
                return;
            }

            // Guardar versión actual si es primera vez
            if (!localVersion) {
                localStorage.setItem(VERSION_KEY, serverVersion);
            }

        } catch (e) {
            // Si falla la verificación, seguir normal (modo offline)
            console.log('Modo offline - usando caché local');
        }
    }

    // Guardar datos en caché
    window.cacheGamesData = (data) => {
        try {
            const cacheData = {
                timestamp: Date.now(),
                games: data
            };
            localStorage.setItem(CACHE_KEY, JSON.stringify(cacheData));
        } catch (e) {
            console.warn('No se pudo guardar en caché:', e);
        }
    };

    // Obtener datos del caché
    window.getCachedGamesData = () => {
        try {
            const cached = localStorage.getItem(CACHE_KEY);
            if (!cached) return null;

            const data = JSON.parse(cached);

            // Verificar si el caché expiró (fallback si no hay versión)
            if (Date.now() - data.timestamp > CACHE_EXPIRY) {
                localStorage.removeItem(CACHE_KEY);
                return null;
            }

            return data.games;
        } catch (e) {
            return null;
        }
    };

    // Verificar actualizaciones al cargar
    checkForUpdates();

    // Guardar los datos cuando se cargan
    document.addEventListener('DOMContentLoaded', () => {
        if (typeof gamesData !== 'undefined') {
            cacheGamesData(gamesData);
        }
    });

})();


// ============================================================================
// 🕹️ EASTER EGG: MODO RETRO / prime
// ============================================================================
//
// Escribí "prime" en el buscador para activar el modo retro
// Escribí "prime" de nuevo para desactivarlo
//
// ============================================================================

(function () {
    let retroMode = false;

    document.addEventListener('DOMContentLoaded', () => {
        const searchInput = document.getElementById('searchInput');

        if (!searchInput) return;

        // Escuchar cambios en el buscador
        searchInput.addEventListener('input', (e) => {
            const value = e.target.value.toLowerCase().trim();

            // Detectar si escribieron "prime"
            if (value === 'prime') {
                toggleRetroMode();

                // Limpiar el buscador después de un momento
                setTimeout(() => {
                    searchInput.value = '';
                    // Disparar evento para actualizar la lista de juegos
                    searchInput.dispatchEvent(new Event('input', { bubbles: true }));
                }, 500);
            }
        });
    });

    // Alternar modo retro
    function toggleRetroMode() {
        retroMode = !retroMode;

        if (retroMode) {
            // Activar modo retro
            document.documentElement.setAttribute('data-theme', 'retro');
            localStorage.setItem('jueguitosTheme', 'retro');

            // Actualizar botón de tema con icono retro
            const toggleBtn = document.getElementById('themeToggle');
            if (toggleBtn) {
                const retroIcon = '<svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><rect x="2" y="4" width="20" height="16" rx="2"/><rect x="5" y="7" width="8" height="6" fill="none" stroke="currentColor"/><circle cx="17" cy="10" r="2"/><circle cx="17" cy="15" r="1"/></svg>';
                toggleBtn.innerHTML = retroIcon;
                toggleBtn.title = 'Modo Prime activado';
            }

            // Notificación
            mostrarNotificacion('Modo Prime activado', 'retro');
            console.log('Easter egg activado: Modo Prime');

        } else {
            // Volver al modo normal (oscuro)
            document.documentElement.removeAttribute('data-theme');
            localStorage.setItem('jueguitosTheme', 'dark');

            // Actualizar botón de tema
            const toggleBtn = document.getElementById('themeToggle');
            if (toggleBtn) {
                const moonIcon = '<svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>';
                toggleBtn.innerHTML = moonIcon;
                toggleBtn.title = 'Cambiar a tema claro';
            }

            // Notificación
            mostrarNotificacion('Modo Prime desactivado', 'normal');
        }
    }

    // Mostrar notificación temporal
    function mostrarNotificacion(mensaje, tipo) {
        // Remover notificación existente
        const existente = document.querySelector('.retro-notification');
        if (existente) existente.remove();

        const notif = document.createElement('div');
        notif.className = 'retro-notification';
        notif.textContent = mensaje;
        notif.style.cssText = `
            position: fixed;
            top: 100px;
            left: 50%;
            transform: translateX(-50%);
            padding: 15px 30px;
            border-radius: 10px;
            font-weight: bold;
            z-index: 10000;
            animation: slideDown 0.3s ease;
            ${tipo === 'retro'
                ? 'background: linear-gradient(45deg, #d53369, #daae51); color: #000;'
                : 'background: var(--primary-color); color: #000;'}
        `;

        document.body.appendChild(notif);

        // Remover después de 2 segundos
        setTimeout(() => {
            notif.style.animation = 'slideUp 0.3s ease forwards';
            setTimeout(() => notif.remove(), 300);
        }, 2000);
    }

    // Agregar estilos de animación
    const style = document.createElement('style');
    style.textContent = `
        @keyframes slideDown {
            from { opacity: 0; transform: translateX(-50%) translateY(-20px); }
            to { opacity: 1; transform: translateX(-50%) translateY(0); }
        }
        @keyframes slideUp {
            from { opacity: 1; transform: translateX(-50%) translateY(0); }
            to { opacity: 0; transform: translateX(-50%) translateY(-20px); }
        }
    `;
    document.head.appendChild(style);

    // Verificar si el modo retro estaba guardado
    if (localStorage.getItem('jueguitosTheme') === 'retro') {
        retroMode = true;
        document.documentElement.setAttribute('data-theme', 'retro');
    }

})();


// ============================================================================
// 🖼️ EASTER EGGS: IMÁGENES SECRETAS
// ============================================================================
//
// Escribí una palabra exacta en el buscador para ver la imagen
// La imagen desaparece cuando el texto cambia
//
// CÓMO AGREGAR MÁS:
// Añadir una entrada al objeto IMAGE_EGGS con: palabra: 'url'
//
// ============================================================================

(function () {
    // Diccionario de easter eggs (palabra exacta -> URL de imagen)
    // Solo se activan con la palabra EXACTA (case insensitive)
    const IMAGE_EGGS = {
        'tormenta': 'https://i.ibb.co/LWw3SJc/tormenta.png',
        'vecina': 'https://i.ibb.co/HTtGBHVq/vecina.png',
        'rem': 'https://i.ibb.co/HfQ63z7M/rem.png',
        'el mismo': 'https://i.ibb.co/ycf4B6my/el-mismo-1.png',
        'jesse': 'https://i.ibb.co/6cXbs5nx/jesse.png'
    };

    // Estado
    let eggContainer = null;
    let currentWord = null;
    let loadVersion = 0; // Para cancelar cargas anteriores

    // Crear el contenedor (una sola vez)
    function createContainer() {
        if (eggContainer) return eggContainer;

        eggContainer = document.createElement('div');
        eggContainer.id = 'easter-egg-image';
        eggContainer.style.cssText = `
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            z-index: 9998;
            pointer-events: none;
            opacity: 0;
            transition: opacity 0.25s ease;
        `;

        const img = document.createElement('img');
        img.style.cssText = `
            max-width: 80vw;
            max-height: 70vh;
            border-radius: 16px;
            box-shadow: 0 20px 60px rgba(0, 0, 0, 0.5);
        `;
        eggContainer.appendChild(img);
        document.body.appendChild(eggContainer);

        return eggContainer;
    }

    // Mostrar imagen
    function showEgg(word, url) {
        // Si ya está mostrando esta palabra, no hacer nada
        if (currentWord === word) return;

        const container = createContainer();
        const img = container.querySelector('img');

        // Incrementar versión para cancelar cargas anteriores
        loadVersion++;
        const thisVersion = loadVersion;

        // Ocultar inmediatamente
        container.style.opacity = '0';
        currentWord = word;

        // Precargar nueva imagen
        const preload = new Image();
        preload.onload = () => {
            // Verificar que esta carga todavía es válida
            if (thisVersion !== loadVersion) return;
            if (currentWord !== word) return;

            // Aplicar imagen y mostrar
            img.src = url;
            img.alt = word;

            // Pequeño delay para asegurar que la transición de ocultar terminó
            setTimeout(() => {
                if (thisVersion === loadVersion && currentWord === word) {
                    container.style.opacity = '1';
                }
            }, 50);
        };
        preload.onerror = () => {
            console.warn('No se pudo cargar imagen:', url);
            currentWord = null;
        };
        preload.src = url;

        console.log('Easter egg encontrado:', word);
    }

    // Ocultar imagen
    function hideEgg() {
        if (!currentWord) return;

        loadVersion++; // Cancelar cualquier carga en progreso
        currentWord = null;

        if (eggContainer) {
            eggContainer.style.opacity = '0';
        }
    }

    // Inicializar
    document.addEventListener('DOMContentLoaded', () => {
        const searchInput = document.getElementById('searchInput');
        if (!searchInput) return;

        searchInput.addEventListener('input', (e) => {
            const value = e.target.value.toLowerCase().trim();

            if (IMAGE_EGGS[value]) {
                showEgg(value, IMAGE_EGGS[value]);
            } else {
                hideEgg();
            }
        });

        // Ocultar al perder foco
        searchInput.addEventListener('blur', () => {
            setTimeout(hideEgg, 150);
        });
    });

})();


// ============================================================================
// PISTA DEL EASTER EGG (aparece con probabilidad)
// ============================================================================

(function () {
    const HINT_SHOWN_KEY = 'primeHintShown';
    const PROBABILITY = 0.9; // 90% de probabilidad

    // No mostrar si ya se vio o si no pasa la probabilidad
    if (localStorage.getItem(HINT_SHOWN_KEY)) return;
    if (Math.random() > PROBABILITY) return;

    document.addEventListener('DOMContentLoaded', () => {
        // Esperar 2 segundos antes de mostrar
        setTimeout(() => {
            const hint = document.createElement('div');
            hint.className = 'prime-hint';
            hint.innerHTML = `
                <span>Escribe "prime" en el buscador para una sorpresa</span>
                <button class="prime-hint-close">x</button>
            `;
            hint.style.cssText = `
                position: fixed;
                bottom: 20px;
                left: 20px;
                background: rgba(20, 20, 25, 0.95);
                border: 1px solid rgba(213, 51, 105, 0.4);
                border-radius: 8px;
                padding: 12px 16px;
                color: #ccc;
                font-size: 13px;
                z-index: 9000;
                display: flex;
                align-items: center;
                gap: 12px;
                animation: slideInHint 0.4s ease;
                backdrop-filter: blur(8px);
            `;

            document.body.appendChild(hint);

            // Botón cerrar
            const closeBtn = hint.querySelector('.prime-hint-close');
            closeBtn.style.cssText = `
                background: none;
                border: none;
                color: #666;
                cursor: pointer;
                font-size: 16px;
                padding: 0 4px;
            `;
            closeBtn.addEventListener('click', () => {
                localStorage.setItem(HINT_SHOWN_KEY, 'true');
                hint.style.animation = 'slideOutHint 0.3s ease forwards';
                setTimeout(() => hint.remove(), 300);
            });

            // Auto-ocultar después de 15 segundos
            setTimeout(() => {
                if (hint.parentNode) {
                    localStorage.setItem(HINT_SHOWN_KEY, 'true');
                    hint.style.animation = 'slideOutHint 0.3s ease forwards';
                    setTimeout(() => hint.remove(), 300);
                }
            }, 15000);
        }, 2000);
    });

    // Agregar estilos de animación
    const style = document.createElement('style');
    style.textContent = `
        @keyframes slideInHint {
            from { opacity: 0; transform: translateX(-20px); }
            to { opacity: 1; transform: translateX(0); }
        }
        @keyframes slideOutHint {
            from { opacity: 1; transform: translateX(0); }
            to { opacity: 0; transform: translateX(-20px); }
        }
    `;
    document.head.appendChild(style);
})();


// ============================================================================
// EASTER EGG: CLICKS EN EL LOGO
// ============================================================================
// Hace muchos clicks rapidos en el logo y te dice algo
//
// COMO AGREGAR/QUITAR FRASES:
// Solo edita el array LOGO_MESSAGES abajo
// ============================================================================

(function () {
    // ========== FRASES (editar aca) ==========
    const LOGO_MESSAGES = [
        "deja de joder",
        "sos pesado eh",
        "ya para",
        "que queres?",
        "no hay nada aca",
        "en serio seguis?",
        "ok, me rindo",
        "felicidades, rompiste algo en el codigo"
    ];
    // =========================================

    const CLICKS_NEEDED = 7; // Clicks necesarios
    const TIMEOUT = 2000;    // Tiempo para resetear (ms)

    let clickCount = 0;
    let lastClick = 0;

    document.addEventListener('DOMContentLoaded', () => {
        const logo = document.querySelector('.logo');
        if (!logo) return;

        logo.style.cursor = 'pointer';
        logo.style.userSelect = 'none';

        logo.addEventListener('click', (e) => {
            e.preventDefault();

            const now = Date.now();

            // Resetear si paso mucho tiempo
            if (now - lastClick > TIMEOUT) {
                clickCount = 0;
            }

            lastClick = now;
            clickCount++;

            // Si llego a los clicks necesarios
            if (clickCount >= CLICKS_NEEDED) {
                // Elegir mensaje random
                const msg = LOGO_MESSAGES[Math.floor(Math.random() * LOGO_MESSAGES.length)];
                showLogoMessage(msg);
                clickCount = 0;
            }
        });
    });

    function showLogoMessage(text) {
        // Quitar mensaje anterior si existe
        const old = document.querySelector('.logo-message');
        if (old) old.remove();

        const logo = document.querySelector('.logo');
        if (!logo) return;

        // Obtener posicion del logo
        const rect = logo.getBoundingClientRect();

        const msg = document.createElement('div');
        msg.className = 'logo-message';
        msg.textContent = text;
        msg.style.cssText = `
            position: fixed;
            top: ${rect.bottom + 10}px;
            left: ${rect.left + rect.width / 2}px;
            transform: translateX(-50%);
            background: rgba(0, 0, 0, 0.9);
            color: #fff;
            padding: 10px 20px;
            border-radius: 8px;
            font-size: 13px;
            z-index: 10000;
            animation: logoMsgIn 0.3s ease;
            border: 1px solid rgba(255, 255, 255, 0.1);
            white-space: nowrap;
        `;

        document.body.appendChild(msg);

        // Quitar despues de 2 segundos
        setTimeout(() => {
            msg.style.animation = 'logoMsgOut 0.3s ease forwards';
            setTimeout(() => msg.remove(), 300);
        }, 2000);
    }

    // Estilos de animacion
    const style = document.createElement('style');
    style.textContent = `
        @keyframes logoMsgIn {
            from { opacity: 0; transform: translateX(-50%) translateY(-10px); }
            to { opacity: 1; transform: translateX(-50%) translateY(0); }
        }
        @keyframes logoMsgOut {
            from { opacity: 1; transform: translateX(-50%) translateY(0); }
            to { opacity: 0; transform: translateX(-50%) translateY(-10px); }
        }
    `;
    document.head.appendChild(style);
})();


// ============================================================================
// MODO VOID (3AM - 4AM) - Horror Analogico
// ============================================================================
// Entre las 3:00 y las 3:59 AM, el sitio se vuelve tetrico
// ============================================================================

(function () {
    // ========== MENSAJES HORROR (editar aca) ==========
    const VOID_MESSAGES = [
        "NO DEBERIAS ESTAR DESPIERTO",
        "ALGO TE OBSERVA",
        "ESCUCHASTE ESO?",
        "DETRAS DE TI",
        "NO MIRES",
        "LA SEÑAL SE PIERDE...",
        "ERROR DE TRANSMISION",
        "NO HAY NADIE AQUI",
        "POR QUE SEGUIS ACA?",
        "LA CINTA SE REBOBINA",
        "YA ME DIO MIEDITO",
        "3:33",
        "...",
        "ANDA A DORMIR",
        "VAYA VAYA",
        "HMM..."
    ];
    // ================================================

    function isVoidHour() {
        // PERMITIR PROBAR CAMBIANDO ESTO (Dejar en 3 para producción)
        const hour = new Date().getHours();
        return hour === 3; // 3:00 - 3:59 AM
    }

    function formatTime() {
        const now = new Date();
        const h = String(now.getHours()).padStart(2, '0');
        const m = String(now.getMinutes()).padStart(2, '0');
        const s = String(now.getSeconds()).padStart(2, '0');
        return `${h}:${m}:${s}`;
    }

    function getRandomMessage() {
        return VOID_MESSAGES[Math.floor(Math.random() * VOID_MESSAGES.length)];
    }

    if (!isVoidHour()) return;

    // === ACTIVAR MODO VOID ===
    document.addEventListener('DOMContentLoaded', () => {
        console.log('🌑 VOID MODE ACTIVATED 🌑');

        // Aplicar clase al HTML
        document.documentElement.setAttribute('data-void', 'true');

        // 1. OVERLAY (Scanlines + Vignette)
        const overlay = document.createElement('div');
        overlay.className = 'void-overlay';
        document.body.appendChild(overlay);

        // 2. RELOJ TIPO VCR (Top Right, Fixed)
        const clock = document.createElement('div');
        clock.className = 'void-clock-ui';
        clock.innerHTML = `
            <div class="void-rec-indicator">
                <span class="void-dot">●</span> REC
            </div>
            <div class="void-time-display">${formatTime()}</div>
        `;
        document.body.appendChild(clock);

        // Actualizar reloj
        setInterval(() => {
            clock.querySelector('.void-time-display').textContent = formatTime();
        }, 1000);

        // 3. MENSAJES FLOTANTES (Subtitulos)
        const msgContainer = document.createElement('div');
        msgContainer.className = 'void-message-container';
        document.body.appendChild(msgContainer);

        function showNextMessage() {
            // Ocultar
            msgContainer.classList.remove('visible');

            // Esperar fx de salida y cambiar texto
            setTimeout(() => {
                if (Math.random() > 0.3) { // 70% chance de mostrar mensaje
                    msgContainer.textContent = getRandomMessage();
                    msgContainer.classList.add('visible');
                }
            }, 1000);

            // Programar siguiente
            const nextTime = 5000 + Math.random() * 8000;
            setTimeout(showNextMessage, nextTime);
        }

        // Iniciar ciclo de mensajes
        setTimeout(showNextMessage, 3000);

        // 5. CAOS VISUAL (Hallucinations & Glitches)
        const TROLLFACE_URL = 'https://i.imgur.com/VkRGVIu.png';

        // PRELOAD IMAGE
        const voidImagePreloader = new Image();
        voidImagePreloader.src = TROLLFACE_URL;

        function glitchElement(el) {
            if (!el) return;
            el.style.transform = `translate(${Math.random() * 4 - 2}px, ${Math.random() * 4 - 2}px) scale(${1 + Math.random() * 0.05})`;
            el.style.filter = `hue-rotate(${Math.random() * 360}deg) invert(${Math.random() > 0.8 ? 1 : 0})`;
            setTimeout(() => {
                el.style.transform = '';
                el.style.filter = '';
            }, 200 + Math.random() * 300);
        }

        function triggerHallucination() {
            // PARAMETROS DE RENDIMIENTO
            const MAX_CONCURRENT = 12; // Máximo de cartas afectadas al mismo tiempo
            const BATCH_SIZE_MIN = 3;  // Mínimo de cartas por tanda
            const BATCH_SIZE_MAX = 6;  // Máximo de cartas por tanda

            const images = Array.from(document.querySelectorAll('.card-image'));
            const activeCount = document.querySelectorAll('[data-void-active="true"]').length;

            // Si ya hay muchas activas, saltear esta ronda para evitar lag
            if (activeCount >= MAX_CONCURRENT) {
                console.log('⚠️ Max hallucinations reached, skipping round...');
                setTimeout(triggerHallucination, 2000);
                return;
            }

            if (images.length > 0) {
                // Calcular cuántas cambiar en esta tanda
                const batchSize = Math.floor(Math.random() * (BATCH_SIZE_MAX - BATCH_SIZE_MIN + 1)) + BATCH_SIZE_MIN;

                // Filtrar solo las que NO están activas
                const available = images.filter(img => !img.dataset.voidActive);

                // Mezclar y tomar los primeros N
                const targets = available.sort(() => 0.5 - Math.random()).slice(0, batchSize);

                targets.forEach(target => {
                    target.dataset.voidActive = "true";

                    // 1. Guardar estado
                    const originalBg = target.style.backgroundImage;

                    // 2. Aplicar Trollface
                    target.style.backgroundImage = `url('${TROLLFACE_URL}')`;
                    target.style.backgroundSize = 'cover';
                    target.style.backgroundPosition = 'center';
                    target.style.filter = 'contrast(1.5) grayscale(1)';

                    // 3. Duración variable (4-7 segundos)
                    const duration = 4000 + Math.random() * 3000;

                    setTimeout(() => {
                        // Verificar que siga existiendo (por si cambió la página/filtro)
                        if (target && target.dataset.voidActive) {
                            target.style.backgroundImage = originalBg;
                            // Limpieza
                            target.style.backgroundSize = '';
                            target.style.backgroundPosition = '';
                            target.style.filter = '';

                            delete target.dataset.voidActive;
                        }
                    }, duration);
                });

                console.log(`👻 Triggered batch of ${targets.length} hallucinations`);
            }

            // B. Glitch en titulos (Simple) - Limitado para no molestar tanto
            if (Math.random() > 0.6) {
                const titles = document.querySelectorAll('.card-title');
                if (titles.length > 0) {
                    const t = titles[Math.floor(Math.random() * titles.length)];
                    const originalText = t.textContent;
                    t.style.color = '#ff0000';
                    t.textContent = Math.random() > 0.5 ? "H E L P" : "V O I D";

                    setTimeout(() => {
                        t.style.color = '';
                        t.textContent = originalText;
                    }, 300);
                }
            }

            // Ciclo continuo (Tiempo variable 2-4s)
            setTimeout(triggerHallucination, 2000 + Math.random() * 2000);
        }

        // Iniciar alucinaciones despues de un momento
        setTimeout(triggerHallucination, 2000);


        // 4. GLITCH CSS (Solo en UI o Body suave)
        // Reducido para performance, solo afecta elementos específicos o hue-rotate leve
        setInterval(() => {
            if (Math.random() > 0.85) {
                document.body.dataset.glitch = "true";
                setTimeout(() => delete document.body.dataset.glitch, 150 + Math.random() * 200);
            }
        }, 4000);
    });

    // ESTILOS PROPIOS DEL MODO VOID
    const style = document.createElement('style');
    style.textContent = `
        /* Variables */
        :root {
            --void-red: #ff3333;
            --void-shadow: 2px 2px 0px rgba(0,0,0,0.8);
        }

        /* 1. Cambios Globales (Optimized) */
        [data-void="true"] {
            --bg-color: #050505 !important;
            --card-bg: #111 !important;
            --text-color: #aaa !important;
        }
        
        [data-void="true"] body {
            background-color: #050505 !important;
            /* Removemos el filtro pesado del body para mejorar performance */
            /* filter: saturate(0) contrast(1.2); -> CAUSA LAG */ 
        }

        /* Efecto Glitch Leve en el Body si se activa */
        body[data-glitch="true"] {
            filter: hue-rotate(90deg) contrast(1.5);
            transform: scale(1.01);
        }

        [data-void="true"] .game-card {
            filter: grayscale(1) brightness(0.7);
            transition: filter 0.3s;
        }
        [data-void="true"] .game-card:hover {
            filter: grayscale(0) brightness(1);
            outline: 1px solid var(--void-red);
        }

        /* 2. OVERLAY (Vignette + Scanlines) */
        .void-overlay {
            position: fixed;
            top: 0; left: 0; width: 100%; height: 100%;
            pointer-events: none;
            z-index: 9990;
            background: linear-gradient(rgba(18, 16, 16, 0) 50%, rgba(0, 0, 0, 0.25) 50%), linear-gradient(90deg, rgba(255, 0, 0, 0.06), rgba(0, 255, 0, 0.02), rgba(0, 0, 255, 0.06));
            background-size: 100% 2px, 3px 100%;
            box-shadow: inset 0 0 100px rgba(0,0,0,0.9);
        }

        /* 3. CLOCK (VCR Style - Top Right) */
        .void-clock-ui {
            position: fixed;
            top: 30px;
            right: 40px;
            font-family: 'Courier New', monospace;
            z-index: 10000;
            color: #fff;
            font-size: 24px;
            text-shadow: 2px 2px 4px rgba(0,0,0,0.9);
            pointer-events: none;
            display: flex;
            flex-direction: column;
            align-items: flex-end;
            gap: 5px;
        }

        .void-rec-indicator {
            color: var(--void-red);
            font-weight: bold;
            font-size: 18px;
            text-transform: uppercase;
            animation: blinkRec 2s infinite step-start;
        }

        .void-dot {
            display: inline-block;
            margin-right: 5px;
        }

        .void-time-display {
            font-size: 32px;
            font-weight: bold;
            letter-spacing: 2px;
            background: rgba(0,0,0,0.3);
            padding: 5px 10px;
        }

        @keyframes blinkRec {
            50% { opacity: 0; }
        }

        /* 4. MESSAGES (Subtitle Style - Bottom Center) */
        .void-message-container {
            position: fixed;
            bottom: 15%;
            left: 50%;
            transform: translateX(-50%);
            width: 80%;
            text-align: center;
            font-family: 'Courier New', monospace;
            font-size: 28px;
            color: #ccc;
            text-transform: uppercase;
            letter-spacing: 3px;
            z-index: 10000;
            text-shadow: 2px 2px 0 #000, 0 0 20px rgba(255,255,255,0.2);
            pointer-events: none;
            opacity: 0;
            transition: opacity 2s ease-in-out;
        }

        .void-message-container.visible {
            opacity: 1;
        }

        /* Responsive */
        @media (max-width: 768px) {
            .void-clock-ui { top: 20px; right: 20px; transform: scale(0.8); transform-origin: top right; }
            .void-message-container { font-size: 20px; bottom: 20%; }
        }
    `;
    document.head.appendChild(style);
})();


// ============================================================================
// SCROLL TO TOP (sutil)
// ============================================================================
// Botón que aparece al bajar para volver arriba
// ============================================================================

(function () {
    document.addEventListener('DOMContentLoaded', () => {
        const btn = document.createElement('button');
        btn.className = 'scroll-top-btn';
        btn.innerHTML = '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 15l-6-6-6 6"/></svg>';
        btn.title = 'Volver arriba';
        document.body.appendChild(btn);

        // Mostrar/ocultar según scroll
        window.addEventListener('scroll', () => {
            if (window.scrollY > 400) {
                btn.classList.add('show');
            } else {
                btn.classList.remove('show');
            }
        });

        // Click para subir
        btn.addEventListener('click', () => {
            window.scrollTo({ top: 0, behavior: 'smooth' });
        });
    });

    const style = document.createElement('style');
    style.textContent = `
        .scroll-top-btn {
            position: fixed;
            bottom: 80px;
            right: 20px;
            width: 44px;
            height: 44px;
            background: var(--glass-bg, rgba(30, 30, 35, 0.9));
            border: 1px solid var(--glass-border, rgba(255,255,255,0.1));
            border-radius: 50%;
            color: var(--text-color, #fff);
            cursor: pointer;
            opacity: 0;
            visibility: hidden;
            transform: translateY(20px);
            transition: all 0.3s ease;
            z-index: 9000;
            display: flex;
            align-items: center;
            justify-content: center;
        }
        
        .scroll-top-btn.show {
            opacity: 0.7;
            visibility: visible;
            transform: translateY(0);
        }
        
        .scroll-top-btn:hover {
            opacity: 1;
            transform: translateY(-3px);
            background: var(--primary-color, #00f3ff);
            color: #fff;
        }
    `;
    document.head.appendChild(style);
})();
