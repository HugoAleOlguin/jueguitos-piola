# Especificaciones Técnicas: Chat y Sistema de Logros

Este documento contiene toda la información técnica, estructuras de datos, configuración de APIs, claves de LocalStorage y eventos necesarios para volver a implementar el **Piola Chat** y el **Sistema de Logros** desde cero en el futuro.

---

## 🛡️ 1. Sistema de Logros (Achievements)

El sistema de logros es autónomo y se comunica mediante **Eventos Globales del Navegador** (`window.dispatchEvent`), lo que desacopla la UI de la lógica de negocio.

### Clave de LocalStorage: `jueguitos_achievements`
Contiene un objeto JSON con el siguiente formato:
```json
{
  "unlocked": ["potato", "colores"],
  "stats": {
    "logoClicks": 12,
    "colorChanges": 3,
    "lastColorChange": 1720760432190,
    "rouletteSpins": 4,
    "gamesOpened": 8,
    "downloadsClicked": 2
  },
  "speedrun": {
    "startTime": 1720760430000,
    "completionTime": null
  }
}
```

### Eventos de Comunicación
1. **Disparador de Evento (Entrada):** `jueguitos_achievement_event`
   * Los componentes de React envían este evento al realizar acciones.
   * Ejemplo:
     ```javascript
     window.dispatchEvent(new CustomEvent('jueguitos_achievement_event', { 
         detail: { type: 'LOGO_CLICK' } 
     }));
     ```
2. **Notificación de Desbloqueo (Salida):** `jueguitos_achievement_unlocked`
   * Se dispara cuando un logro es desbloqueado exitosamente para notificar a la UI (ej. mostrar un Toast).
   * Ejemplo de respuesta en `event.detail`:
     ```json
     {
       "id": "pesado",
       "title": "Sos Re Pesado",
       "desc": "Deja al logo en paz.",
       "icon": "📢"
     }
     ```

### Lista Completa de Logros
| ID | Título | Descripción | Ícono | Condición de Desbloqueo | Secreto |
|---|---|---|---|---|---|
| `prime` | El Prime | Activaste el diseño original. | 📺 | Activación del diseño nostálgico. | No |
| `pesado` | Sos Re Pesado | Deja al logo en paz. | 📢 | Hacer click 50 veces en el logo (`LOGO_CLICK`). | No |
| `egg` | ¿Qué Carajo? | Buscaste lo que no debías. | 🥚 | Buscar palabras reservadas específicas (ej. huevos de pascua). | No |
| `cochino` | Cochino | Andá a buscar eso a otro lado. | 🐷 | Buscar palabras prohibidas / NSFW. | No |
| `curious_cat` | Curioso | ¿Qué esperabas encontrar acá? | 🐱 | Bajar hasta el fondo de la página o inspeccionar elementos. | No |
| `potato` | PC del Gobierno | Más FPS, menos dignidad. | 🥔 | Activar la opción de omitir ondas de fondo (Waves). | No |
| `colores` | Indeciso | No te decidís por un color. | 🎨 | Cambiar el color de acento 5 veces (`COLOR_CHANGE`). | No |
| `blur` | No Veo Un Carajo | Pusiste el Blur al máximo. | 👓 | Poner el deslizador de desenfoque al valor máximo (20px). | No |
| `diseño` | Aesthetic | Creaste tu propio tema. | 🖌️ | Guardar un fondo personalizado con nombre. | No |
| `ludopath` | Ludópata | Te gusta girar la ruleta eh? | 🎰 | Girar la ruleta 10 veces (`ROULETTE_SPIN`). | No |
| `window_shopper`| Mirar y No Tocar | Abriste 10 juegos sin descargar ninguno.| 👀 | Abrir 10 juegos sin hacer click en "Descargar". | No |
| `speedrunner` | SPEEDRUNNER | Completaste todos los logros en menos de 1 minuto. | ⚡ | Desbloquear todos los logros normales en < 60s. | **Sí** |

### Efectos Visuales y Sonoros de Desbloqueo
1. **Audio Pop Sintético:** Generado mediante la API de `AudioContext` nativa del navegador:
   * Tipo de oscilador: `sine`
   * Rampa de frecuencia: De `800Hz` a `1200Hz` en `0.1s`.
   * Rampa de ganancia (volumen): De `0.3` a `0.01` en `0.1s`.
2. **Confeti:** Generado usando la biblioteca `canvas-confetti`:
   ```javascript
   confetti({
       particleCount: 80,
       spread: 60,
       origin: { y: 0.8 },
       colors: ['#00f3ff', '#00ff88', '#ffd700']
   });
   ```

---

## 💬 2. Piola Chat (Firebase Integration)

El chat conecta con **Firebase Firestore** para proporcionar mensajería en tiempo real y persistencia del perfil y presencia de los usuarios.

### Credenciales de Conexión (Firebase SDK v9+)
```javascript
const firebaseConfig = {
    apiKey: "TU_API_KEY_AQUI",
    authDomain: "TU_PROJECT_ID.firebaseapp.com",
    projectId: "TU_PROJECT_ID",
    storageBucket: "TU_PROJECT_ID.firebasestorage.app",
    messagingSenderId: "TU_MESSAGING_SENDER_ID",
    appId: "TU_APP_ID"
};
```

### Claves de LocalStorage del Chat
* `piola_chat_profile`: JSON que contiene el perfil local del usuario:
  ```json
  {
    "id": "user_xyz123",
    "name": "SuperJugador",
    "avatar": "https://api.dicebear.com/7.x/thumbs/svg?seed=SuperJugador",
    "nameColor": "#00f3ff",
    "description": "Hola! Fan de los juegos retro.",
    "favoriteGame": "Lethal Company"
  }
  ```
* `piola_chat_last_read`: Marca de tiempo (`milisegundos`) de la última vez que el usuario abrió el chat. Se usa para calcular la burbuja de mensajes no leídos.

### Colecciones en Firestore

#### 1. Colección `/messages`
* **Ordenación:** `createdAt` de forma ascendente.
* **Límite de lectura:** 80 mensajes más recientes.
* **Estructura del documento:**
  ```typescript
  {
    text: string;           // Contenido del mensaje (máx 300 caracteres)
    type: "text" | "image"; // Tipo de mensaje
    authorId: string;       // ID único del usuario
    authorName: string;     // Nombre visible del usuario
    authorAvatar: string;   // URL del avatar (Dicebear o externo)
    authorColor: string;    // Color hexadecimal de acento para el nombre
    createdAt: Timestamp;   // serverTimestamp() de Firestore
  }
  ```
  *(Nota: Los enlaces que terminen en extensiones de imagen o provengan de dominios de Giphy/Tenor se renderizan como `type: "image"` en forma de vista previa de imagen/GIF).*

#### 2. Colección `/users` (Sistema de Presencia)
* Cada usuario crea un documento cuyo ID es su `authorId`.
* **Estructura del documento:**
  ```typescript
  {
    id: string;
    name: string;
    avatar: string;
    nameColor: string;
    description: string;
    favoriteGame: string;
    online: boolean;        // true si está conectado, false si está desconectado
    lastSeen: Timestamp;    // Última señal de vida (serverTimestamp())
  }
  ```
* **Heartbeat (Latido):** El cliente actualiza este documento cada 60 segundos (`setInterval`) con `online: true` y `lastSeen: serverTimestamp()`.
* **Estado Offline:** Se intercepta el evento de cierre de página (`window.addEventListener('beforeunload')`) o el desmontaje del componente de React para realizar un guardado rápido con `online: false`.

### Generación de Avatares Dinámicos
Se utiliza la API gratuita de **Dicebear** para generar avatares a partir del nombre del usuario:
`https://api.dicebear.com/7.x/thumbs/svg?seed=${encodeURIComponent(userName)}`
