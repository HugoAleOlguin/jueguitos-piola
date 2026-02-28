# 🕹️ Jueguitos Piola

<div align="center">

  > Un proyecto personal para compartir juegos con los pibes y descubrir giveaways gratis.
  <br> Hosteado 100% en GitHub Pages. Sin backend, sin frameworks.

  ![Status](https://img.shields.io/badge/Estado-Activo-success?style=for-the-badge&logo=github)
  ![Version](https://img.shields.io/badge/Versión-3.2.0-blue?style=for-the-badge)

</div>

---

## 🚀 Demo en vivo

<p align="center">
  <b>Versión 3.2 — SPA con Giveaways en tiempo real</b>
</p>

| 🟢 Sitio Oficial |
|:---:|
| [![Sitio Oficial](https://img.shields.io/badge/🌐-Jugar_Ahora-2ea44f?style=for-the-badge)](https://hugoaleolguin.github.io/jueguitos-piola/) |
| <a href="https://hugoaleolguin.github.io/jueguitos-piola/" target="_blank"><img src="https://api.microlink.io/?url=https://hugoaleolguin.github.io/jueguitos-piola/?v=3.2&screenshot=true&meta=false&embed=screenshot.url&screenshot.width=800&refresh=true" alt="Vista previa oficial"></a> |

> *La versión antigua está archivada en [/old](https://hugoaleolguin.github.io/jueguitos-piola/old).*

---

## 🛠️ Stack Técnico

<p align="center">
  <img src="https://img.icons8.com/color/96/000000/html-5.png" width="48" alt="HTML5">
  <img src="https://img.icons8.com/color/96/000000/css3.png" width="48" alt="CSS3">
  <img src="https://img.icons8.com/color/96/000000/javascript.png" width="48" alt="JS">
  <img src="https://avatars.githubusercontent.com/u/44036562?s=280&v=4" width="48" alt="GitHub Actions">
</p>

Sin frameworks pesados — HTML, CSS y JavaScript vanilla para aprender cómo funciona la web real:

- **HTML5** — Estructura semántica y SEO
- **CSS3** — Variables, Glassmorphism, Animaciones, CSS Modules
- **JavaScript ES6+** — SPA Architecture, Fetch API, LocalStorage
- **Cloudflare Workers** — Proxy CORS serverless para APIs externas
- **GitHub Pages** — Deploy automático desde `gh-pages`

---

## 📥 Instalación Local

<details>
  <summary><b>👇 Clic para ver instrucciones</b></summary>

  ```bash
  # 1. Cloná el repo
  git clone https://github.com/HugoAleOlguin/jueguitos-piola.git

  # 2. Entrá a la carpeta
  cd jueguitos-piola

  # 3. Abrí con Live Server en VS Code
  # La navegación SPA requiere un servidor local para funcionar correctamente.
  ```

</details>

---

## 📅 Devlog — Historia del Proyecto

### 🗓️ Semana 1 — Noviembre 2025: Lanzamiento inicial

El proyecto arrancó como una lista simple de juegos para compartir con amigos. Sin backend, sin base de datos — solo un `index.html` con links de descarga.

- Estructura básica del sitio
- Grid de tarjetas de juegos
- Deploy inicial en GitHub Pages

---

### 🗓️ Semana 2 — Enero 2026: Refactor a SPA

El HTML estático se volvió imposible de mantener. Refactoreé todo a una arquitectura SPA (Single Page Application) pura en JavaScript vanilla.

- `app.js` centraliza toda la navegación y el routing por URL (`?id=game`)
- Animaciones de entrada por tarjeta con `animation-delay` escalonado
- Vista de detalle de juego individual sin recargar la página
- Sistema de Favoritos con `localStorage`

---

### 🗓️ Semana 3 — Febrero 2026 (18/02): Pulido Visual y SEO

Con la arquitectura estable, me enfoqué en el aspecto visual y la indexación de Google.

- **Cursores personalizados**: opción de PNG custom y modo "troll" 🐟
- **Sistema de logros**: tracking de clicks del logo, spin de ruleta, descargas
- **Canonical tags dinámicos**: cada juego tiene su URL única para SEO
- **Contraste WCAG**: mejoras de accesibilidad en textos y badges
- **Ruleta aleatoria**: selector animado con `cubic-bezier` para elegir un juego al azar

---

### 🗓️ Día 24 — 24/02/2026: Modo Prime y Logros

- Implementé el **Modo Prime** (desbloqueable con Easter Egg)
- Reparé sistema de logros que dejó de funcionar por conflicto de scripts

---

### 🗓️ Días 27-28 — 27-28/02/2026: Sección de Giveaways 🎁

La feature más compleja hasta ahora: integrar una API externa para mostrar juegos gratuitos en tiempo real.

**El problema CORS:**
Las APIs de juegos gratuitos (FreeToGame, GamerPower) bloquean peticiones directas desde el navegador por política CORS. Solución: deployé un **Cloudflare Worker** gratuito como proxy serverless que agrega los headers necesarios.

**Lo que se construyó:**
- Nueva sección `🎁 Juegos Gratis Limitados` en el header de la SPA
- Integración con [GamerPower API](https://www.gamerpower.com/api-read) para giveaways en tiempo real
- Agrupación visual por plataforma: **Steam → Epic Games → GOG → Itch.io**
- Logos reales de plataforma via [simpleicons.org](https://cdn.simpleicons.org)
- Badge de expiración en rojo con hora Argentina (UTC-3)
- Sistema de fallback de proxies CORS: si el Worker propio falla, intenta proxies públicos
- Integración correcta con el router SPA (la ruleta y el logo cierran la vista correctamente)

---

## 🧠 Roadmap

![Progreso](https://img.shields.io/badge/Progreso-85%25-green)

### ✅ Completado
- [x] Lanzamiento v3.0 SPA
- [x] Sistema de Configuración Avanzada (temas, blur, colores)
- [x] Cursores personalizados
- [x] Ruleta de juego aleatorio
- [x] Sistema de Logros/Achievements
- [x] Canonical URLs dinámicos (SEO)
- [x] **Sección de Giveaways en tiempo real** (v3.2)
- [x] Agrupación por plataforma con logos reales

### 🚧 Pendiente
- [ ] Más easter eggs
- [ ] Lazy loading para imágenes
- [ ] Modo offline / Service Worker

---

## 👨‍💻 Autor

<table border="0">
  <tr>
    <td width="150">
      <img src="https://github.com/HugoAleOlguin.png" width="150" alt="Avatar" style="border-radius: 50%;">
    </td>
    <td>
      <b><a href="https://github.com/HugoAleOlguin">HugoAleOlguin</a></b><br>
      <i>Estudiante de Desarrollo de Software</i>
      <br><br>
      Me gusta diseñar en CSS y optimizar la experiencia de usuario. Hago cosas sencillas pero funcionales.
      Siempre estoy aprendiendo algo nuevo — Frontend, Backend, o jugando con el diseño.
      <br><br>
      <ul>
        <li>🔗 <b>GitHub:</b> <a href="https://github.com/HugoAleOlguin">Perfil</a></li>
        <li>🛠️ <b>Tech:</b> HTML, CSS, JS, Cloudflare Workers.</li>
        <li>🎮 <b>Intereses:</b> Desarrollo Web, diseño y Videojuegos.</li>
      </ul>
    </td>
  </tr>
</table>

---

<div align="center">
  <sub>Hecho con ❤️ y mucho código por <a href="https://www.instagram.com/Hugo_Ale_Olguin/"><b>@HugoAleOlguin</b></a>.</sub>
</div>