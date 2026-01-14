// ============================================================================
// 🎂 TEMA DE ANIVERSARIO - 1 AÑO DE JUEGUITOS PIOLA
// ============================================================================
//
// Fecha de nacimiento: 25 de enero de 2025
// Para desactivar: cambiar ANNIVERSARY_ENABLED a false
//
// ============================================================================

(function () {
    // ===== CONFIGURACIÓN =====
    const ANNIVERSARY_ENABLED = true;  // Cambiar a false para desactivar todo
    const BIRTHDAY = new Date('2025-01-25');
    const YEARS_CELEBRATING = 1;

    if (!ANNIVERSARY_ENABLED) return;

    // =========================================================================
    // CONFETTI SYSTEM
    // =========================================================================

    const colors = ['#00f3ff', '#bc13fe', '#ff007f', '#00ff88', '#ffd700', '#ff6b6b'];
    let confettiInterval = null;

    function createConfetti() {
        const confetti = document.createElement('div');
        confetti.className = 'anniversary-confetti';
        confetti.style.cssText = `
            position: fixed;
            width: ${Math.random() * 10 + 5}px;
            height: ${Math.random() * 10 + 5}px;
            background: ${colors[Math.floor(Math.random() * colors.length)]};
            left: ${Math.random() * 100}vw;
            top: -20px;
            opacity: ${Math.random() * 0.7 + 0.3};
            border-radius: ${Math.random() > 0.5 ? '50%' : '2px'};
            pointer-events: none;
            z-index: 9999;
            animation: confettiFall ${Math.random() * 3 + 2}s linear forwards;
            transform: rotate(${Math.random() * 360}deg);
        `;
        document.body.appendChild(confetti);

        setTimeout(() => confetti.remove(), 5000);
    }

    function startConfetti() {
        // Ráfaga inicial
        for (let i = 0; i < 30; i++) {
            setTimeout(() => createConfetti(), i * 50);
        }

        // Confetti ocasional
        confettiInterval = setInterval(() => {
            if (Math.random() > 0.7) {
                createConfetti();
            }
        }, 500);
    }

    // =========================================================================
    // BANNER DE ANIVERSARIO
    // =========================================================================

    function createBanner() {
        const banner = document.createElement('div');
        banner.id = 'anniversary-banner';
        banner.innerHTML = `
            <div class="anniversary-content">
                <span class="anniversary-emoji">🎂</span>
                <span class="anniversary-text">
                    <strong>¡${YEARS_CELEBRATING} añito!</strong> 
                    Jueguitos Piola cumple años el 25 de enero
                </span>
                <span class="anniversary-emoji">🎉</span>
            </div>
            <button class="anniversary-close" title="Cerrar banner">✕</button>
        `;

        document.body.appendChild(banner);

        // Botón cerrar
        banner.querySelector('.anniversary-close').addEventListener('click', (e) => {
            e.stopPropagation();
            banner.style.animation = 'bannerSlideUp 0.3s ease forwards';
            setTimeout(() => banner.remove(), 300);
            sessionStorage.setItem('anniversaryBannerClosed', 'true');
        });
    }

    // =========================================================================
    // DECORACIONES FLOTANTES
    // =========================================================================

    function createFloatingDecorations() {
        const decorations = ['🎈', '🎊', '✨', '🎁', '⭐'];
        const container = document.createElement('div');
        container.className = 'anniversary-decorations';
        container.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            pointer-events: none;
            z-index: 0;
            overflow: hidden;
        `;

        // Crear algunas decoraciones flotantes
        for (let i = 0; i < 8; i++) {
            const deco = document.createElement('div');
            deco.className = 'floating-deco';
            deco.textContent = decorations[Math.floor(Math.random() * decorations.length)];
            deco.style.cssText = `
                position: absolute;
                font-size: ${Math.random() * 20 + 15}px;
                left: ${Math.random() * 100}%;
                top: ${Math.random() * 100}%;
                opacity: 0.15;
                animation: floatDeco ${Math.random() * 10 + 15}s ease-in-out infinite;
                animation-delay: ${Math.random() * 5}s;
            `;
            container.appendChild(deco);
        }

        document.body.appendChild(container);
    }

    // =========================================================================
    // LOGO CON GORRITO DE FIESTA
    // =========================================================================

    function addPartyHat() {
        const logo = document.querySelector('.logo');
        if (!logo) return;

        logo.style.position = 'relative';

        const hat = document.createElement('span');
        hat.className = 'party-hat';
        hat.textContent = '🎉';
        hat.style.cssText = `
            position: absolute;
            top: -15px;
            left: -5px;
            font-size: 1.2rem;
            transform: rotate(-20deg);
            animation: hatBounce 2s ease-in-out infinite;
        `;

        logo.appendChild(hat);
    }

    // =========================================================================
    // CONTADOR DE DÍAS
    // =========================================================================

    function createCountdown() {
        const today = new Date();
        const thisYearBirthday = new Date(today.getFullYear(), BIRTHDAY.getMonth(), BIRTHDAY.getDate());

        // Si ya pasó este año, es para el próximo
        if (today > thisYearBirthday) {
            thisYearBirthday.setFullYear(thisYearBirthday.getFullYear() + 1);
        }

        const daysUntil = Math.ceil((thisYearBirthday - today) / (1000 * 60 * 60 * 24));

        // Crear el contador en el footer
        const footer = document.querySelector('footer');
        if (footer && daysUntil <= 30) {
            const countdown = document.createElement('div');
            countdown.className = 'anniversary-countdown';

            if (daysUntil === 0) {
                countdown.innerHTML = `<span class="countdown-emoji">🎂</span> ¡HOY CUMPLIMOS ${YEARS_CELEBRATING} AÑO! <span class="countdown-emoji">🎂</span>`;
            } else if (daysUntil === 1) {
                countdown.innerHTML = `<span class="countdown-emoji">⏰</span> ¡MAÑANA cumplimos ${YEARS_CELEBRATING} añito! <span class="countdown-emoji">🎉</span>`;
            } else {
                countdown.innerHTML = `<span class="countdown-emoji">📅</span> Faltan <strong>${daysUntil} días</strong> para el aniversario <span class="countdown-emoji">🎊</span>`;
            }

            footer.insertBefore(countdown, footer.firstChild);
        }
    }

    // =========================================================================
    // ESTILOS
    // =========================================================================

    function injectStyles() {
        const style = document.createElement('style');
        style.id = 'anniversary-styles';
        style.textContent = `
            /* Banner de aniversario */
            #anniversary-banner {
                position: fixed;
                top: 80px;
                right: 20px;
                background: linear-gradient(135deg, rgba(188, 19, 254, 0.15), rgba(0, 243, 255, 0.15));
                border: 1px solid rgba(188, 19, 254, 0.4);
                border-radius: 12px;
                padding: 12px 20px;
                z-index: 9990;
                backdrop-filter: blur(10px);
                animation: bannerSlideIn 0.5s cubic-bezier(0.34, 1.56, 0.64, 1);
                box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
                display: flex;
                align-items: center;
                gap: 10px;
                max-width: 350px;
            }
            
            .anniversary-content {
                display: flex;
                align-items: center;
                gap: 8px;
            }
            
            .anniversary-emoji {
                font-size: 1.3rem;
                animation: emojiPulse 1.5s ease-in-out infinite;
            }
            
            .anniversary-text {
                color: #ddd;
                font-size: 0.9rem;
                line-height: 1.3;
            }
            
            .anniversary-text strong {
                color: var(--primary-color, #00f3ff);
                font-size: 1rem;
            }
            
            .anniversary-close {
                background: none;
                border: none;
                color: #666;
                font-size: 1rem;
                cursor: pointer;
                padding: 4px 8px;
                border-radius: 4px;
                transition: all 0.2s ease;
                margin-left: auto;
            }
            
            .anniversary-close:hover {
                background: rgba(255, 255, 255, 0.1);
                color: #fff;
            }
            
            /* Contador en footer */
            .anniversary-countdown {
                padding: 10px 20px;
                margin-bottom: 10px;
                background: linear-gradient(90deg, transparent, rgba(188, 19, 254, 0.1), transparent);
                border-radius: 20px;
                color: #aaa;
                font-size: 0.85rem;
                animation: countdownGlow 3s ease-in-out infinite;
            }
            
            .countdown-emoji {
                font-size: 1rem;
            }
            
            /* Animaciones */
            @keyframes bannerSlideIn {
                from {
                    opacity: 0;
                    transform: translateX(50px);
                }
                to {
                    opacity: 1;
                    transform: translateX(0);
                }
            }
            
            @keyframes bannerSlideUp {
                to {
                    opacity: 0;
                    transform: translateY(-20px);
                }
            }
            
            @keyframes confettiFall {
                0% {
                    transform: translateY(0) rotate(0deg);
                }
                100% {
                    transform: translateY(100vh) rotate(720deg);
                }
            }
            
            @keyframes emojiPulse {
                0%, 100% { transform: scale(1); }
                50% { transform: scale(1.15); }
            }
            
            @keyframes hatBounce {
                0%, 100% { transform: rotate(-20deg) translateY(0); }
                50% { transform: rotate(-15deg) translateY(-3px); }
            }
            
            @keyframes floatDeco {
                0%, 100% { 
                    transform: translateY(0) rotate(0deg); 
                }
                25% { 
                    transform: translateY(-20px) rotate(5deg); 
                }
                50% { 
                    transform: translateY(-10px) rotate(-5deg); 
                }
                75% { 
                    transform: translateY(-25px) rotate(3deg); 
                }
            }
            
            @keyframes countdownGlow {
                0%, 100% { 
                    box-shadow: 0 0 10px rgba(188, 19, 254, 0); 
                }
                50% { 
                    box-shadow: 0 0 20px rgba(188, 19, 254, 0.2); 
                }
            }
            
            /* Responsive */
            @media (max-width: 768px) {
                #anniversary-banner {
                    right: 10px;
                    left: 10px;
                    max-width: none;
                    top: auto;
                    bottom: 70px;
                }
            }
        `;
        document.head.appendChild(style);
    }

    // =========================================================================
    // INICIALIZACIÓN
    // =========================================================================

    document.addEventListener('DOMContentLoaded', () => {
        injectStyles();

        // Mostrar banner si no fue cerrado en esta sesión
        if (!sessionStorage.getItem('anniversaryBannerClosed')) {
            setTimeout(createBanner, 1000);
        }

        // Decoraciones
        createFloatingDecorations();
        addPartyHat();
        createCountdown();

        // Confetti al cargar (solo una vez por sesión)
        if (!sessionStorage.getItem('anniversaryConfettiShown')) {
            setTimeout(startConfetti, 1500);
            sessionStorage.setItem('anniversaryConfettiShown', 'true');

            // Detener confetti después de 10 segundos
            setTimeout(() => {
                if (confettiInterval) {
                    clearInterval(confettiInterval);
                }
            }, 10000);
        }
    });

})();
