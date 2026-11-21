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
| 2026-11-18 | `checkpoint/19-antes-itinerario-nuevo` | Estado con la paleta, el mapa doble y los senderos. |
| 2026-11-18 | `checkpoint/19-itinerario-nuevo-listo` · `20-antes-dron-alto` | Itinerario nuevo: La Angostura 3 y 4/1, Frey 5/1, Bariloche 6 al 10/1, Meiling opcional. |
| 2026-11-18 | `checkpoint/20-dron-alto-listo` · `21-antes-mapa-vintage` | Dron alto (Bariloche → Frey → Meiling), senderos con profundidad. |
| 2026-11-18 | `checkpoint/21-mapa-vintage-listo` · `22-antes-pie-silueta` | Mapa único estilo atlas con zoom y rutas reales. |
| 2026-11-18 | `checkpoint/22-pie-silueta-listo` | Pie con silueta real y franjas. |
| 2026-11-18 | `checkpoint/23-dron-mapa-pie-cierre` | Estado final: cámara en vertical, capturas e informe. |
| 2026-11-18 | `checkpoint/24-antes-carteles` | Estado publicado en producción con el primer merge (igual a `relato` 54ec9f1). |
| 2026-11-18 | `checkpoint/24-carteles-listos` · `25-antes-mapa-fluido` | Carteles de la portada dentro de la pantalla, sin choques, compactos en el celular; crédito en dos líneas; sendero del Meiling sin nudo. |
| 2026-11-18 | `checkpoint/25-mapa-fluido-listo` · `26-antes-pie-sin-nombres` | Mapa con zoom y arrastre por GPU (60 fps medidos), un dedo arrastra con zoom, botones + y −, límites. |
| 2026-11-18 | `checkpoint/26-pie-sin-nombres-listo` | Pie solo con la silueta. Revisión automática OK. |

## Publicaciones en `main` (producción)

| Fecha | Rama de respaldo | Qué pasó |
|---|---|---|
| 2026-11-18 | `checkpoint/main-antes-del-merge-1` → `d49adcc` | `main` antes del primer merge (la web vieja). |
| 2026-11-18 | — | Primer merge: `relato` a `main` en un commit (`7fb2438`). |
| 2026-11-18 | `checkpoint/main-antes-del-merge` → `7fb2438` | `main` antes del segundo merge (rediseño sin los cambios de carteles, mapa y pie). |
| 2026-11-18 | — | Segundo merge: carteles, mapa fluido y pie sin nombres (ver la línea siguiente). |

## 19/11/2026 · correcciones, paleta nueva y pulido (modo autónomo, en una PC sin Git)

Esta sesión se hizo en una PC con Windows sin Git, Node ni Python, a partir del zip de `main`. **No se pudo hacer commits, ramas ni push.** Los checkpoints de hoy son **copias de carpeta** en `Desktop\Pat\_checkpoints\` (al lado de la carpeta del repo). Para volver a uno: copiar su contenido sobre la carpeta de trabajo, o comparar con cualquier herramienta de diferencias. Cuando esto se suba al repo conviene crear las ramas `checkpoint/NN-...` con el mismo nombre, un commit por carpeta.

| Fecha | Checkpoint (carpeta) | Qué tiene |
|---|---|---|
| 2026-11-19 | `27-antes-correcciones-19-11` | `main` tal como estaba publicado (zip): con el itinerario original y el nuevo, menú lateral, paleta violeta/azul/rojo. **De acá se recupera el itinerario original** (`DAYS_A`, `BASES_A`, `LEGS.a` en `index.html`). |
| 2026-11-19 | `28-correcciones-y-paleta-base` | Etapas 1 y 2 juntas (se reescribieron los estilos de una vez): un solo itinerario, arranque en la portada, mapa de Google directo para el celular, mapa plano ancho, sin "Relieve: …" en la portada, fotos reencuadradas, barra de secciones, paleta Fitz Roy y polares. CSS y JS en archivos. |
| 2026-11-19 | `29-pulido-listo` | Etapa 3: modo sin conexión (service worker), manifest, íconos, imagen para WhatsApp, 404, accesibilidad, contraste AA, 3D armado por partes, revisión automática sin Node, links revisados, documentación al día. **Es la versión lista para publicar.** |
| 2026-11-19 | `Patagonia-2027-rediseno-libre` (carpeta aparte) | Etapa 5: rediseño libre. Equivale a la rama `rediseno-libre`; no mezclar con `main`. |

Publicación (etapa 4): **pendiente**, no se pudo hacer desde esta PC. Pasos en `docs/informe-noche.md`, sección del 19/11.
## Rediseño "Recorrido 3D" (rama `recorrido-3d`, desde el 21/11/2026)

Checkpoints como ramas (desde la sesión en la nube no se pueden subir tags). Preview de la rama: https://patagonia-2027-git-recorrido-3d-juans-projects-9f7b2d3f.vercel.app

| Fecha | Checkpoint | Qué tiene |
|---|---|---|
| 2026-11-21 | `checkpoint/30-antes-recorrido-3d` | `main` publicado (5ff8558), punto de partida del rediseño. |
| 2026-11-21 | (rama `recorrido-3d`) | Fase 0: plan en `docs/informe-recorrido.md`, sin cambios en la web. Esperando OK. |
