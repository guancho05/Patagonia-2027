# Checkpoints

Versiones guardadas de la web. Para volver a una, pedíselo a Claude Code nombrando el tag.

El primero es una rama y no un tag (desde la sesión donde se creó no se podían subir tags). Funciona igual para volver, y Vercel le da su propio link de preview.

| Fecha | Tag | Qué tiene |
|---|---|---|
| 2026-11-17 | `checkpoint/00-antes-del-rediseno` (rama) | Web actual antes del rediseño: un solo index.html, itinerario original y versión con Frey y plan B, casas (San Martín y Bariloche confirmadas, Posta de los Colonos como primera opción en La Angostura), autos, Windguru. |
| 2026-11-17 | rama `relato` (primera versión) | Portada con el Tronador en 3D (relieve real) y cámara tipo dron con el scroll, pantallazo del viaje, botones de itinerario original y nuevo, menú lateral (itinerario, casas, autos, gastos), casa y trayecto de cada día con mapa con relieve, página de gastos, fotos de Unsplash. |

## Noche del 18/11/2026 (modo autónomo)

Los tags no se pueden subir desde este entorno (el proxy corta el push), así que **todos los checkpoints de esta noche son ramas** con el nombre del tag. Para volver o probar uno: `git switch -c prueba-X origin/checkpoint/NN-...` y abrir su preview en Vercel.

| Fecha | Checkpoint (rama) | Qué tiene |
|---|---|---|
| 2026-11-18 | `checkpoint/01-antes-orden` | Estado de `relato` al empezar la noche (commit 78273c5): primera versión del rediseño. |
| 2026-11-18 | `checkpoint/01-orden-lista` | Etapa 0: `CLAUDE.md` actualizado con la estructura real y la regla de contenido; resumen de etapas; plan de la noche. Web sin cambios visibles. |
| 2026-11-18 | `checkpoint/02-antes-contenido` | Igual que el anterior (punto de partida de la etapa 1). |
| 2026-11-18 | `checkpoint/02-contenido-lista` | Etapa 1: sin "Bajá para volar" ni textos de relleno; bajadas y descripciones de cada día concretas; pantallazo con datos de la versión elegida. Estética todavía la de la primera versión. |
| 2026-11-18 | `checkpoint/03-antes-estetica` | Igual que el anterior (punto de partida de las etapas 2 y 3). |
| 2026-11-18 | `checkpoint/03-investigacion-estetica-lista` | Etapa 2: `docs/investigacion-estetica.md` (hallazgos con links, paleta, tipografías y principios). La web no cambia. |
| 2026-11-18 | `checkpoint/04-antes-aplicar-estetica` | Igual que el anterior (punto de partida de la etapa 3). |
| 2026-11-18 | `checkpoint/04-aplicar-estetica-lista` | Etapa 3: estética de catálogo de época (paleta, Fraunces + Atkinson + Plex Mono, borde de papel y banda de datos en la portada, notas de campo, pies de foto con lugar y fecha, grano y color de película). Arreglo de la línea de tiempo. |
| 2026-11-18 | `checkpoint/05-antes-pesca` | Igual que el anterior (punto de partida de la etapa 4). |
| 2026-11-18 | `checkpoint/05-pesca-lista` | Etapa 4: página Pesca (reglamento 2026/27, permiso para uruguayos, lugares, guías, equipo), bloque "Pesca hoy" en los días y permisos en Gastos. |
| 2026-11-18 | `checkpoint/06-antes-montana` | Igual que el anterior (punto de partida de la etapa 5). |
| 2026-11-18 | `checkpoint/06-montana-lista` | Etapa 5: portada 3D del Tronador al Catedral (47 × 31 km con detalle + anillo de 168 × 149 km con bruma), textura horneada con sombras, nieve y lagos, recorrido del dron acotado, marcadores del Meiling (posición corregida) y del Frey. |

Detalle de cada checkpoint y cómo volver: `docs/informe-noche.md` (sección "Checkpoints y cómo volver"). Preview de Vercel de cada rama: Vercel → Deployments → filtrar por la rama.
| 2026-11-18 | `checkpoint/07-antes-correcciones` | Estado final de la noche, antes de las correcciones del 18/11. |
| 2026-11-18 | `checkpoint/07-correcciones-listas` | Mosaico bien encuadrado, crédito del relieve abajo de la banda, botón de menú compacto que se esconde al bajar (celular), permisos de pesca como opcionales en Gastos. |
| 2026-11-18 | `checkpoint/08-antes-titulo` | Estado después de las correcciones del 18/11, antes de cambiar la tipografía del título. |
| 2026-11-18 | `checkpoint/08-titulo-listo` | Título de la portada y títulos grandes de secciones en Caprasimo (estilo Cooper Black, afiche de los 70). |
| 2026-11-18 | `checkpoint/09-antes-alta-resolucion` | Título en Caprasimo; antes de la montaña en alta resolución. |
| 2026-11-18 | `checkpoint/09-alta-resolucion-lista` · `10-antes-camara` | Copernicus GLO-30, texturas de 4096, LOD por bloques, carga progresiva. |
| 2026-11-18 | `checkpoint/10-camara-lista` · `11-antes-pie` | Cámara suave con cierre en el Catedral y el Frey. |
| 2026-11-18 | `checkpoint/11-pie-listo` · `12-antes-colores` | Pie de página. |
| 2026-11-18 | `checkpoint/12-colores-listos` | Colores de época en bloques, parches, banda, pie e itinerario. |
| 2026-11-18 | `checkpoint/13-alta-resolucion-cierre` | Estado final: etiquetas dentro de la pantalla, normal map del celular más liviano, capturas e informe. |
| 2026-11-18 | `checkpoint/14-antes-paleta-logo` | Estado tras la alta resolución, antes de la paleta del logo. |
| 2026-11-18 | `checkpoint/14-paleta-logo-lista` · `15-antes-mapa` | Paleta violeta, azul rey, rojo, negro y blanco. |
| 2026-11-18 | `checkpoint/15-mapa-listo` · `16-antes-portada-realista` | Mapas SVG de la Patagonia y de la ruta. |
| 2026-11-18 | `checkpoint/16-portada-realista-lista` · `17-senderos-listos` | Bariloche y lagos en el 3D, WorldCover, agua con reflejo, senderos punteados (un solo commit para las partes 3 y 4). |
| 2026-11-18 | `checkpoint/18-paleta-mapa-senderos-cierre` | Capturas, informe y CLAUDE.md al día. |
