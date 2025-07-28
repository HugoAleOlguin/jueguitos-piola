# Guía de Estilo para Páginas de Juegos

## Estructura de Archivos

- `styles.css`: Contiene todos los estilos para las páginas de juegos
- `js/effects.js`: Contiene los efectos visuales y funcionalidades JavaScript
- `plantilla-juego.html`: Plantilla para crear nuevas páginas de juegos

## Cómo Añadir un Nuevo Juego

1. Copia el archivo `plantilla-juego.html` y renómbralo con el nombre del juego (ej. `nombre-juego.html`)
2. Edita el contenido del archivo:
   - Cambia el título de la página
   - Actualiza la imagen del juego
   - Completa los detalles y requisitos del juego
   - Actualiza el enlace de descarga
   - Añade la sección de mods si es necesario (descomenta el código)

## Elementos Visuales

### Colores

Se utilizan variables CSS para mantener la consistencia:

- `--color`: Color principal para el fondo (rosa claro)
- `--accent-color`: Color de acento para botones y títulos (verde)
- `--accent-hover`: Color de acento para hover (verde oscuro)
- `--pink-accent`: Color rosa para detalles y bordes
- `--dark-bg`: Color de fondo oscuro para contenedores

### Componentes

#### Contenedor Principal

```html
<div class="container">
    <!-- Contenido -->
</div>
```

#### Detalles del Juego

```html
<section class="game-details">
    <div class="game-info">
        <h2>Detalles</h2>
        <ul>
            <li><strong>Género:</strong> [Género]</li>
            <!-- Más detalles -->
        </ul>
    </div>
    
    <div class="game-requirements">
        <h2>Requisitos mínimos</h2>
        <ul>
            <li><strong>Sistema:</strong> [Sistema]</li>
            <!-- Más requisitos -->
        </ul>
    </div>
</section>
```

#### Botones

```html
<div class="button-group">
    <a href="ENLACE" class="button">Botón Principal</a>
    <a href="ENLACE" class="button-secondary">Botón Secundario</a>
</div>
```

#### Sección de Mods

```html
<section class="container mods-section">
    <h2>🛠️ Instalación de Mods</h2>
    
    <!-- Requisitos -->
    <div>
        <h3>Requisitos:</h3>
        <ul>
            <li>
                <strong>Nombre:</strong> 
                <a href="ENLACE" class="mod-download-btn">Descargar</a>
            </li>
        </ul>
    </div>
    
    <!-- Instrucciones -->
    <div>
        <h3>📦 Instrucciones de Instalación:</h3>
        <ol>
            <li>Paso 1</li>
            <!-- Más pasos -->
        </ol>
    </div>
    
    <!-- Tabla de mods -->
    <div>
        <h3>Mods Disponibles:</h3>
        <table class="tabla-datos">
            <!-- Contenido de la tabla -->
        </table>
    </div>
</section>
```

## Efectos Visuales

La página incluye varios efectos visuales:

- Animación de carga al iniciar la página
- Efecto de desvanecimiento para los elementos
- Efectos de hover para botones y elementos de lista
- Scrollbar personalizado

## Responsive Design

Las páginas están diseñadas para ser responsivas:

- Dispositivos móviles (max-width: 768px)
- Tablets (min-width: 769px and max-width: 1024px)
- Escritorio (min-width: 1025px)

## Mantenimiento

Para mantener la consistencia visual:

1. Utiliza siempre las clases CSS existentes
2. No añadas estilos en línea
3. Si necesitas añadir nuevos estilos, hazlo en el archivo `styles.css`
4. Si necesitas añadir nuevas funcionalidades JavaScript, hazlo en el archivo `js/effects.js`

---

© 2025 Jueguitos Piola. Ningún derecho reservado.