# Revisión del código base: tareas propuestas

## 1) Tarea para corregir un error tipográfico
- **Problema detectado:** en el catálogo de juegos, el título de `hytale` aparece como `Hytale online (EXPERIMETAL)`.
- **Impacto:** baja calidad percibida en UI y metadatos compartidos (cards, SEO, capturas).
- **Tarea propuesta:** corregir el texto a `Hytale online (EXPERIMENTAL)` y revisar otros textos de `assets/js/games.js` con un corrector ortográfico ligero para evitar reincidencias.

## 2) Tarea para corregir una falla
- **Problema detectado:** `index.html` carga `assets/js/settings.js` dos veces.
- **Impacto:** trabajo duplicado de parseo/ejecución, riesgo de efectos secundarios y mayor tiempo de carga inicial.
- **Tarea propuesta:** dejar una sola inclusión de `settings.js` (preferentemente con `defer`) y validar que el flujo de configuración siga funcionando en portada, detalle y panel admin.

## 3) Tarea para corregir una discrepancia en comentarios/documentación
- **Problema detectado:** el comentario de `setBodyBg` indica que usa `!important` para las reglas de background, pero en la implementación `background-attachment` y `background-position` se setean sin `important`.
- **Impacto:** la intención documentada no coincide con el comportamiento real y complica el mantenimiento.
- **Tarea propuesta:** alinear código y comentario: o bien aplicar `important` a todas las propiedades mencionadas, o actualizar el comentario para describir exactamente qué propiedades usan prioridad forzada y por qué.

## 4) Tarea para mejorar una prueba
- **Problema detectado:** no hay una prueba automatizada que valide reglas críticas de filtrado/ruteo (ej. ocultos fuera de `oculto`, y renderizado de ocultos con `oculto`).
- **Impacto:** regresiones silenciosas en búsqueda y navegación SPA.
- **Tarea propuesta:** agregar una suite mínima (Vitest + jsdom o Playwright) que cubra:
  1. búsqueda normal excluye `hidden: true`,
  2. búsqueda `oculto` muestra únicamente ocultos,
  3. `?id=<inexistente>` vuelve al home sin romper la UI.
