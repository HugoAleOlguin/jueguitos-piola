# Changelog

Historial de cambios estructurales y visuales del proyecto.

---

## [4.2.0] - 2026-04-04

### Fixed — Sistema de Logros
- **Carga lazy rota**: `AchievementManager` se cargaba solo al hacer hover sobre el botón FAB. Cualquier logro disparado antes de ese hover (logo click, búsquedas, giros de ruleta, abrir juegos) se perdía para siempre. Ahora se carga con `requestIdleCallback` al inicio de sesión, disponible en ~500ms.
- **Contadores reseteados**: `rouletteSpins` y `colorChanges` se reiniciaban a 0 en cada carga de página, ignorando el progreso persistido en localStorage. Los logros `Ludópata` e `Indeciso` requerían completar toda la cuenta en una sola sesión.
- **`window_shopper` bloqueado**: La condición usaba `=== 10` en vez de `>= 10`. Con 11+ juegos abiertos sin ninguna descarga el logro nunca se desbloqueaba.
- **`DOWNLOAD_CLICK` sin trackear**: Los botones generados desde el array `game.buttons[]` no tenían la clase `btn-download-track`, por lo que el contador de descargas nunca incrementaba (rompía también `window_shopper`).
- **Doble `init()`**: Se agrega flag `_initialized` para evitar que el módulo de logros se inicialice más de una vez si el script ya estaba en caché.

### Changed
- **Speedrunner**: Umbral de tiempo ampliado a **60 segundos** (antes: 30 s) para que el wlogro sea alcanzable de forma legítima.

---

## [4.1.0] - 2026-03-31

### Added
- **Menú Hamburguesa (Mobile)**: Implementado sistema de navegación colapsable para mejorar el espacio en pantalla en dispositivos móviles.
- **Auto-cierre del Menú**: El menú se cierra automáticamente al seleccionar cualquier opción o sección (Juegos Gratis, Configuración, etc.).

### Changed
- **Simplificación Mobile**:
  - Modal de configuración rediseñado: ahora es una lista scrolleable continua sin pestañas para facilitar la navegación táctil.
  - Ocultas opciones no esenciales en móviles para mejorar el rendimiento y la limpieza visual.
- **Header**: Rediseño completo para soportar el toggle del menú móvil y centrar elementos.

### Removed
- **Minijuegos en Mobile**: Eliminado el acceso y cards de minijuegos en la versión móvil para simplificar la experiencia de usuario.

### Fixed
- **Google Fonts**: Corregido error de carga de fuentes (Orbitron/Roboto).
- **Free Games**: Corregido error de inserción del botón en la nueva estructura del header y mejorada la integración con el menú móvil.

---

## [3.8.0] - 2026-03-30

### Added
- **Minimalismo e Hiper-Compacto**:
  - **Ajustes de Interfaz**: Reducción agresiva de paddings, font-sizes y márgenes para una navegación más rápida y mayor densidad de información.
  - **Responsive Pro Max**: Rediseño vertical de la página de detalle para móviles e implementación de 3 columnas para tablets (769px-1100px).
  - **Bypass de FX**: Desactivación permanente de partículas, rastro de ratón y animaciones pesadas para maximizar el rendimiento en dispositivos de gama baja.
  - **Configuración Simplificada**: Modal de ajustes reducido a 3 pestañas esenciales: Fondo, Diseño y Temas.

### Changed
- **Estética Pulcra**: Eliminación de efectos "glow" y animaciones de pulso en botones para un feeling más estático y profesional.
- **Navegación Móvil**: Menú de navegación horizontal compacto con distribución en filas para mejor accesibilidad táctil.

### Fixed
- **Estabilidad Lucide**: Corregidos errores de `setAttribute` al cargar iconos dinámicamente.
- **Fuentes**: Resuelto error de carga de la fuente "Orbitron" desde Google Fonts.
- **Free Games**: Solucionado error de `DOMException` al insertar elementos en la vista de juegos gratuitos.

---

## [4.0.0] - 2026-03-28

### Added
- **Admin Panel v3 (Rediseño SPA)**:
  - Reescritura total del panel de administración como una **SPA (Single Page Application)** ultraligera y rápida.
  - Diseño **Utilitario & Legible**: Optimizado para aprovechar el 100% de la pantalla (`100vh`). Tipografía base de `15px` e inputs generosos.
  - **Github API Integración**: Sincronización directa de la base de datos `games.js` mediante GitData API v3.
  - **Sistema de Commits Compactos**: Agrupa cambios locales (añadir, editar, ocultar, reordenar) en un único envío descriptivo y versionado.
  - **Editor Mejorado**: Previsualización real integrada (solo activa con URL válida), etiquetas por chips inteligentes y multienlaces por juego.

### Changed
- **Acceso Privado**: Eliminación de accesos públicos al panel desde el index principal para mayor seguridad y discreción.

### Fixed
- **Bugs de Interacción**: Corregida la propagación de eventos en el catálogo; ya no se abre el editor al intentar borrar, ocultar o reordenar un juego.
- Eliminación masiva de código basura (legacy) y simplificación de la estructura de archivos del panel.

---

## [3.7.0] - 2026-03-27

### Added
- **Rediseño Total del Modal de Configuración**:
  - Nueva interfaz con **navegación por pestañas (Tabs)** para una mejor organización.
  - **Sidebar de Navegación** en pantallas grandes para acceso rápido a categorías (Fondo, Estilo, FX, Temas, Config).
  - **Mobile UI**: Las pestañas se transforman en una cinta de "chips" horizontales scrolleables en móviles.
  - Persistencia de pestaña activa durante la sesión (`sessionStorage`).
  - Mayor área de interacción y previews visuales mejoradas.

### Fixed
- Limpieza de redundancias en el HTML del modal y consolidación de inputs ocultos para mejor compatibilidad con scripts legacy.

---

## [3.6.0] - 2026-03-25

### Added
- **Sistema Modular de Tarjetas**:
  - Opción de alternar entre estilo **Estándar** (diseño clásico) y **Compacto** (minimalista).
  - **Estilo Compacto**: Imagen al 100% con efecto "hover reveal" para mostrar la información del juego.
  - **Refactor CSS**: Separación de estilos en `game-card.css` (estructura), `game-card-style-default.css` y `game-card-style-compact.css`.
  - **Persistencia en la Nube**: El estilo de tarjeta ahora se guarda en Firebase junto con los temas compartidos.

### Changed
- **Mobile Fallback**: En dispositivos móviles, el estilo compacto muestra la información de forma permanente con un degradado para asegurar la legibilidad sin necesidad de hover.
- **Optimización de Carga**: Pre-aplicación de la clase de estilo en el arranque para evitar destellos visuales (FOUC).

---

## [3.5.0] - 2026-03-11
 
### Added
- **Precarga de fondo** (optimización de rendimiento)
 
### Changed
- **Chat**: Se puso la fecha en los mensajes y se corrigio el problema de que no se mostraran los mensajes nuevos.

---

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

---

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

## Marzo 2026

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

## Febrero 2026

**17-20 de Febrero**
- **Simplificación Masiva del Código **:
  - Eliminación de **Void Mode** y **Konami Code**.
  - Eliminación de **cheats ocultos** ("hack", "admin") y código legacy.
  - Eliminación de gestor de caché manual (ahora nativo del navegador).
  - Archivo `theme.js` reducido de ~540 a ~100 líneas.
  - Eliminación de páginas muertas (`schedule.html`).
- **Mejoras en Panel Admin**:
  - **Nueva UI Pro**: Íconos SVG, tarjetas clickeables para editar.
- **Settings Menu (v2.0)**:
  - **Nueva Interfaz**: Estilo Glassmorphism profundo, mejor organización.
  - **Cursores Personalizados**: Default, Retro (Pixel), Crosshair (FPS).

**2-3 de Febrero**
- **Sistema de Logros (beta)**:
  - 12 Logros desbloqueables con notificaciones.
- **Modo Versus (Torneo beta)**:
  - Sistema de torneo eliminatorio.

---

## Enero 2026

**30 de Enero**
- **Lanzamiento Oficial v3.0**
  - **SPA (Single Page Application)**: Navegación instantánea sin recargas.
  - **Configuración Avanzada**.

---

## Versiones Principales

| Versión | Fecha | Cambio Principal |
|---------|-------|------------------|
| **4.0** | Mar 2026 | **Panel Admin SPA v3** (GitHub API) |
| **3.8** | Mar 2026 | Rediseño Minimalista e Hiper-Compacto |
| **3.7** | Mar 2026 | Modal de Configuración por Pestañas |
| **3.6** | Mar 2026 | Sistema de Tarjetas (Estándar/Compacto) |
| **3.4** | Mar 2026 | PiolaChat, Perfil unificado, GIFs |
| **3.3** | Mar 2026 | Galería de Temas Comunitaria |
| **3.2** | Feb 2026 | Giveaways en tiempo real |
| **3.0** | Ene 2026 | SPA, Rediseño Oficial, Configuración Avanzada |
| **Beta** | Dic 2025 | Nueva arquitectura, efectos JS |
| **2.0** | Mar 2025 | Rediseño completo |
| **1.0** | Ene 2025 | Lanzamiento inicial |

---

**280+ commits** | **Ene 2025 → Mar 2026**
