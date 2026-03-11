# Changelog

Historial de cambios estructurales y visuales del proyecto.

---

## Enero 2025 — Lanzamiento Inicial

**25-26 de Enero**
- Creación de la página inicial
- Estructura base del proyecto
- Soporte multilenguaje

**28 de Enero**
- Integración con Radmin VPN (v1, v2, v3)

---

## Febrero 2025

- Sistema de íconos inicial

---

## Marzo 2025

**4 de Marzo**
- Implementación del favicon

**25-26 de Marzo**
- **Modo Oscuro** implementado
- Múltiples mejoras de layout y viewport
- Eliminación del footer
- Optimizaciones de altura (100vh, max-height)

**27 de Marzo**
- **Rediseño completo (v2.0)**
- Sistema de descargas (v2.5)
- **Diseño responsive** (v2.6 → v2.9 final)

---

## Abril 2025

- Sistema de tablas informativas
- Recursos de imagen adicionales

---

## Junio 2025

- Sistema de música implementado

---

## Julio 2025

- **Rediseño visual significativo**
- Nuevos estilos globales

---

## Octubre 2025

- **Sistema de categorías** para organización
- Sección "Próximos" agregada
- Sistema de disponibilidad (contenido no disponible)
- Optimización de imágenes

---

## Diciembre 2025

**15-16 de Diciembre**
- **Versión Beta lanzada**
  - Nueva arquitectura de páginas
  - Estilos globales y específicos
  - Efectos JavaScript
  - Recursos optimizados
- Optimización de la página principal
- Corrección de enlaces rotos

---

## Enero 2026

**1 de Enero**
- Actualización del README

**13 de Enero**
- **Mejoras en la versión Beta**
  - Sistema de temas mejorado
  - Mejoras de UI y modal
- Limpieza y reorganización de código

**14 de Enero**
- Sistema de caché offline
- Eliminación de archivos innecesarios
- **Modo Prime mejorado** — más fiel al estilo legacy original

**15 de Enero**
- **Tema de Aniversario** — efectos especiales para el 1er año
- **Página 404** — diseño con efecto glitch
- **Sistema de versiones** — actualización automática de caché
- Mejoras visuales generales

**16 de Enero**
- **Tutorial de Mods** — guía para instalar mods con Gale
- **Música de fondo** — opcional, con YouTube
- **Cinta de Utilidad** — distintivo para herramientas
- Mejoras de interfaz y rendimiento

---

**30 de Enero**
- **Lanzamiento Oficial v3.0**
  - La versión Beta ahora es la **Oficial** (Antigua versión archivada en `/old`).
  - **SPA (Single Page Application)**: Navegación instantánea sin recargas.
  - **Configuración Avanzada**:
    - Selectores de Color Neon y Blur en tiempo real.
    - Personalización de fondo persistente.
  - **Sistema de Música v2**: Reescrito con YouTube IFrame API (más estable).
  - **Fixes**: Corrección del "Void Mode" (3AM) y optimizaciones de caché.

**31 de Enero**
- **Sistema de Temas (Presets)**:
  - Guardado de configuraciones personalizadas con nombre.
  - **Persistencia Avanzada**: Soporte para fondos grandes (GIFs) usando IndexedDB.
  - **UX/UI Mejorada**: Indicadores de "Tema Activo", gestión instantánea sin alertas intrusivas.
- **Admin Panel Smart Save**: Formato compacto e inteligente para la base de datos de juegos.

---

## Febrero 2026

**1 de Febrero**
- **Randomizer (Ruleta)**:
  - Botón de dado 🎲 para elegir juego al azar.
  - Animación de ruleta visual con ganadores.
  - Exclusión automática de herramientas ("Utilidad").
- **Modo Lite**:
  - Opción de "Alto Rendimiento" en configuración.
  - Fuente Monospace global y alto contraste (B/N).
  - Eliminación total de bordes redondeados, sombras, brillos y gradientes.
  - Cero animaciones y transiciones.
  - Ocultación de configuraciones irrelevantes (Fondos, Blur, Color) al activarlo.

**2-3 de Febrero**
- **Sistema de Logros (beta)**:
  - 12 Logros desbloqueables con notificaciones.
  - Persistencia de progreso en LocalStorage.
- **Modo Versus (Torneo beta)**:
  - Sistema de torneo eliminatorio (Bracket de 8 o Todos contra Todos).
  - **Torneo Rápido**: 8 juegos al azar para partidas rápidas.
  - **Torneo Completo**: Enfrentamiento total de todo el catálogo.
    
**3 de Febrero (noche)**
- **Revisión del Sistema de Logros**:
  - **Modal Dedicado**: Nueva interfaz con FAB flotante para ver progreso.
  - **Modo Speedrun (Silent Run)**: Timer secreto que trackea tu tiempo de platino (Start: 1er logro, End: Último logro).
  - **Bypass Konami**: Código `↑↑↓↓←→←→BA` para desbloquear el logro Void.
  - **Fixes Críticos**:
    - Notificaciones ahora usan estilos inyectados por JS para garantizar visibilidad al 100%.
    - Logro "Ludópata" rebalanceado a 5 giros (Session-based).
    - `Reset` ahora limpia correctamente todos los stats internos.

**17-20 de Febrero**
- **Simplificación Masiva del Código **:
  - Eliminación de **Void Mode** y **Konami Code**.
  - Eliminación de **cheats ocultos** ("hack", "admin") y código legacy.
  - Eliminación de gestor de caché manual (ahora nativo del navegador).
  - Archivo `theme.js` reducido de ~540 a ~100 líneas.
  - Eliminación de páginas muertas (`schedule.html`).
- **Mejoras en Panel Admin**:
  - **Nueva UI Pro**: Íconos SVG, tarjetas clickeables para editar.
  - **Drag & Drop Seguro**: Manija de arrastre separada para evitar errores.
  - **Fix de Carga**: Solucionado error de formato al leer `games.js`.
- **Extras Restaurados (Simplificados)**:
  - **Easter Eggs Visuales**
  - **Acceso Admin**
  - **Estilos Modulares**
- **Settings Menu (v2.0)**:
  - **Nueva Interfaz**: Estilo Glassmorphism profundo, mejor organización.
  - **Cursores Personalizados**: Default, Retro (Pixel), Crosshair (FPS).
  - **Efectos Visuales**: Partículas flotantes activables.
  - **Pérdida de Datos**: Se evitó que los temas sobrescribieran una única clave `custom_bg`. Cada tema ahora almacena su propio blob de imagen único.
  - **Presets Mejorados**: Gestión de temas más fluida.
  - **Limpieza**: Eliminación de opciones de sonido redundantes.
- **Interacción Logo**: Se arregló la selección de texto accidental al hacer doble click en el logo y se ajustó el logro "Sos Re Pesado" (ahora requiere 50 clicks y solo funciona en el home).
- **Cursores 2.0 (Beta)**: Nuevo menú compacto, nuevos cursores (Wait, Texto, Mano) y opción experimentual para **subir tu propio cursor** (.png).
- **Logros Reparados**: Se reactivaron los disparadores para "Aesthetic", "Prime", "Cochino", "PC del Gobierno" y "No Veo Un Carajo".
- **Modo Prime 2.0**: Se re-implementó el modo "Prime". Escribe "prime" en el buscador para activarlo.


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

## [3.3.0] - 2026-03-03

### Added
- **Galería de Temas Comunitaria online (BETA)**
  - Implementación con Firebase Firestore para almacenamiento instantáneo (¡y gratuito!) en la nube.
  - Nuevo modal estilo "*Store*" independiente, que no interrumpe el flujo normal del panel de configuraciones.
  - Los usuarios pueden compartir temas propios con background de URLs estableciendo un nombre de autor (que persiste).
  - Al presionar **Aplicar** en las tarjetas de la galería, la página actualiza toda su estética de forma visual e inmersiva gracias al nuevo puente `SettingsManager.loadAndApply()`.
- Nuevo indicador persistente _"✓ Compartido"_ para que no pierdas rastro de qué subiste (guarda su estado en `localStorage`).

### Changed
- El botón interno "Eliminar Tema" ahora tiene mayor visibilidad (ícono *cross*), un hitbox más grande y colores de contraste altos.

### Removed
- **Eliminada funcionalidad Favoritos**: Limpieza visual y de código de todos los ficheros JS, CSS y del DOM, ya que no era útil en el entorno SPA reducido, mejorando el rendimiento al evitar validaciones y chequeos iterativos extra por tarjeta de juego.

## [3.4.0] - 2026-03-05

### Added
- **PiolaChat — Chat en Tiempo Real**:
  - Widget de chat integrado con burbuja flotante (abajo-izquierda).
  - Historial completo persistente en Firebase Firestore.
  - Presencia online/offline en tiempo real.
  - Sistema de perfiles con nombre, avatar, descripción, juego favorito y color de nombre personalizable.
  - Modal de perfil con vista lectura + modo edición (botón lápiz SVG).
  - Al editar nombre/avatar/color, se actualizan **todos** los mensajes anteriores automáticamente (batch update).
  - **GIFs/Imágenes**: Auto-detecta URLs de imágenes (`.gif`, `.png`, `.jpg`, `.webp`) y dominios conocidos (tenor.com, giphy.com, imgur.com), mostrándolas inline en el chat.
- **Colección `chat_profiles` en Firestore**: Los perfiles se sincronizan a la nube, editables manualmente desde la consola de Firebase.
- **Perfil unificado**: El mismo perfil se usa para el chat y para compartir temas en la galería comunitaria.
  - Si no tenés perfil, la galería te redirige al setup del chat para crear uno.
  - Las tarjetas de la galería ahora muestran el avatar del autor.

### Changed
- **Galería de Temas mejorada**:
  - Modal más grande (`680px`) con glassmorphism.
  - Cards más grandes con previews de `100px`.
  - Detección de temas propios ahora por `authorId` (no por nombre).
- **Panel del chat**: Fondo semi-transparente con `backdrop-filter: blur(20px)` para ver el fondo de la página.
- **Mensajes**: Timestamps inline al lado del nombre (estilo Discord), hover sutil, padding mejorado.

### Removed
- **Código muerto eliminado**: `status`, `currentGame`, `_detectCurrentGame()`, `_sendActivityEvent()`, `_getGameTitle()`, parámetro `gameName` de `_updatePresence()`.
- **Tenor API eliminada**: Reemplazada por auto-detección de URLs, sin necesidad de API key ni setup.

## [3.5.0] - 2026-03-11

### Added
- **Service Worker** (caché offline)
- **Precarga de fondo** (optimización de rendimiento)

### Changed
- **Chat**: Se puso la fecha en los mensajes y se corrigio el problema de que no se mostraran los mensajes nuevos.

## Versiones Principales

| Versión | Fecha | Cambio Principal |
|---------|-------|------------------|
| **3.4** | Mar 2026 | PiolaChat, Perfil unificado, GIFs |
| **3.3** | Mar 2026 | Galería de Temas Comunitaria |
| **3.2** | Feb 2026 | Giveaways en tiempo real |
| **3.0** | Ene 2026 | SPA, Rediseño Oficial, Configuración Avanzada |
| **Beta** | Dic 2025 | Nueva arquitectura, efectos JS |
| **2.0** | Mar 2025 | Rediseño completo |
| **1.0** | Ene 2025 | Lanzamiento inicial |

---

**240+ commits** | **Ene 2025 → Mar 2026**
