const CACHE_NAME = 'jueguitos-piola-v2';
const STATIC_ASSETS = [
    '/',
    '/index.html',
    '/assets/css/style.css',
    '/assets/css/base.css',
    '/assets/css/layout.css',
    '/assets/css/components/game-card.css',
    '/assets/css/components/search-bar.css',
    '/assets/css/components/tags.css',
    '/assets/css/components/buttons.css',
    '/assets/css/features/settings-modal.css',
    '/assets/css/features/piola-chat.css',
    '/favicon.png',
    '/assets/css/features/null_.png',

    // CSS de features
    '/assets/css/features/versus.css',
    '/assets/css/features/gamedle.css',
    '/assets/css/features/achievements.css',
    '/assets/css/features/minigames-modal.css',
    '/assets/css/features/theme-gallery.css',
    '/assets/css/features/roulette.css',
    '/assets/css/features/extras.css',
    '/assets/css/animations.css',
    '/assets/css/responsive.css',

    // JS crítico
    '/assets/js/games.js',
    '/assets/js/theme.js',
    '/assets/js/settings.js',
    '/assets/js/achievements.js'
];

self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME).then((cache) => {
            // Se usa catch para que si algún archivo falta, no falle toda la instalación
            return Promise.allSettled(
                STATIC_ASSETS.map(url => cache.add(url).catch(err => console.warn('Cache add failed for', url, err)))
            );
        }).then(() => self.skipWaiting())
    );
});

self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys().then((cacheNames) => {
            return Promise.all(
                cacheNames.map((name) => {
                    if (name !== CACHE_NAME) {
                        return caches.delete(name);
                    }
                })
            );
        }).then(() => self.clients.claim())
    );
});

self.addEventListener('fetch', (event) => {
    const url = new URL(event.request.url);

    // EXCLUSIONES CRÍTICAS: Nunca cachear Firebase, Firestore, APIs de Google, extensiones
    if (
        event.request.method !== 'GET' ||
        url.hostname.includes('firebase') ||
        url.hostname.includes('firestore') ||
        url.hostname.includes('googleapis') ||
        url.protocol.startsWith('chrome-extension') ||
        url.pathname.includes('/api/') || // Por si llega a haber llamadas
        url.port !== '' // Omitir puertos de live server si es posible
    ) {
        return; // Deja pasar la petición directo a la red sin interceptarla
    }

    // Para fuentes de google y unpkg, usamos Cache First (Cacheable Response)
    if (url.hostname.includes('fonts.') || url.hostname.includes('unpkg.')) {
        event.respondWith(
            caches.match(event.request).then((cachedResponse) => {
                if (cachedResponse) return cachedResponse;

                return fetch(event.request).then((networkResponse) => {
                    if (networkResponse && networkResponse.status === 200 && networkResponse.type === 'basic' || networkResponse.type === 'cors') {
                        const responseToCache = networkResponse.clone();
                        caches.open(CACHE_NAME).then((cache) => {
                            cache.put(event.request, responseToCache);
                        });
                    }
                    return networkResponse;
                }).catch(() => {
                    // Fallback silencioso
                });
            })
        );
        return;
    }

    // Para nuestros archivos estáticos: Stale-While-Revalidate
    event.respondWith(
        caches.match(event.request).then((cachedResponse) => {
            const fetchPromise = fetch(event.request).then((networkResponse) => {
                if (networkResponse && networkResponse.status === 200 && networkResponse.type === 'basic') {
                    const responseToCache = networkResponse.clone();
                    caches.open(CACHE_NAME).then((cache) => {
                        cache.put(event.request, responseToCache);
                    });
                }
                return networkResponse;
            }).catch(() => {
                // Falla silenciosa de la red (está offline)
            });

            // Si hay caché devuelve rápido, y la red actualiza en 2do plano
            return cachedResponse || fetchPromise;
        })
    );
});
