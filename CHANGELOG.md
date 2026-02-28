# Changelog

Todos los cambios notables de este proyecto están documentados aquí.
Formato basado en [Keep a Changelog](https://keepachangelog.com/es/1.0.0/).

---

## [3.2.0] - 2026-02-28

### Added
- **Sección de Giveaways**: nueva vista `🎁 Juegos Gratis Limitados` integrada en el header de la SPA
- Integración con la [GamerPower API](https://www.gamerpower.com/api-read) para mostrar giveaways activos en tiempo real
- **Cloudflare Worker** serverless como proxy CORS para sortear las restricciones de las APIs externas
- Agrupación visual de juegos por plataforma: Steam → Epic Games → GOG → Itch.io
- Logos reales de plataforma via `cdn.simpleicons.org`
- Badge de fecha de expiración en rojo con hora local argentina (America/Argentina/Buenos_Aires)
- Sistema de fallback de proxies CORS (Worker propio → corsproxy.io → codetabs)
- Botón `← Volver al Inicio` dentro de la sección de giveaways
- Integración correcta con el router SPA: la ruleta, el logo y `Volver` respetan la vista activa

### Fixed
- La ruleta al elegir un juego ya no superpone la vista de giveaways sobre el detalle del juego
- Al presionar `Volver` desde un juego elegido por ruleta ya no queda la sección de giveaways visible debajo de la grilla
- `closeFreeGamesView()` ahora scrollea al top correctamente
- Crash `grouped[key] is undefined` cuando la API devuelve juegos de plataformas excluidas del listado

### Changed
- Sección PC (juegos genéricos de fuentes no verificadas) eliminada del listado visible
- Header de la sección con fondo oscuro opaco para legibilidad sobre cualquier fondo de página
- Timeout de proxies reducido de 8s a 5s para fallback más rápido

---

## [3.1.1] - 2026-02-24

### Added
- Modo Prime desbloqueable vía Easter Egg

### Fixed
- Sistema de logros (Achievements) reparado tras conflicto con refactor de scripts
- Modo Lite restaurado correctamente al desactivar Modo Prime

---

## [3.1.0] - 2026-02-19

### Added
- Selector de cursores personalizados (`settings.js`)
- Opción de cursor PNG custom subido por el usuario
- Modo "troll cursor" 🐟

### Fixed
- Cursor custom ahora cubre correctamente los bordes derecho e inferior de la pantalla

---

## [3.0.1] - 2026-02-18

### Fixed
- Canonical tags ahora se actualizan dinámicamente con el ID del juego en la URL (`?id=game-id`)
- Reset del canonical al navegar de vuelta al home
- Contraste de texto mejorado para cumplir WCAG AA en badges y descripciones
- Código duplicado de inicialización limpiado

### Added
- Google Site Verification meta tag
- AIM Score integrado (métricas de accesibilidad inline)

---

## [3.0.0] - 2026-01-25

### Added
- **Arquitectura SPA** completa — navegación sin recarga de página vía `history.pushState`
- Router central en `app.js` con soporte de URL por juego (`?id=`)
- Vista de detalle individual por juego con metadata dinámica (SEO, Open Graph, JSON-LD)
- Sistema de **Favoritos** persistente en `localStorage`
- **Ruleta aleatoria** con animación `cubic-bezier`
- Sistema de **Logros/Achievements** con tracking de eventos
- Sistema de Configuración Avanzada: blur, colores de acento, imagen de fondo custom

### Changed
- Migración completa de HTML estático a JavaScript dinámico
- CSS modularizado en archivos separados por sección

---

## [2.0.0] - 2025-11-26

### Added
- Rediseño completo con estética Cyberpunk / Glassmorphism
- Grid de tarjetas con animaciones de entrada
- Soporte de tags por juego

---

## [1.0.0] - 2025-01-01

### Added
- Lanzamiento inicial: lista estática de juegos con links de descarga
- Deploy en GitHub Pages
