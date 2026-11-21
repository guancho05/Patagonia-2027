# Rediseño "Recorrido 3D" — informe

Rama `recorrido-3d` (sale de `main` 5ff8558). Preview: https://patagonia-2027-git-recorrido-3d-juans-projects-9f7b2d3f.vercel.app

Concepto aprobado: `docs/referencias/maqueta-recorrido.html`.
1. Intro con título.
2. Mapa 3D que se recorre, con dos autos por la ruta real.
3. Cada parada abre una ficha con sus días.
4. Parches coleccionables.
5. Barra de secciones: Recorrido · Destinos · Casas · Autos · Gastos.

El itinerario por días deja de existir como página: los días viven dentro de cada destino.

---

## 1. Referencias estudiadas

### Route 66 · Centennial (Expedia × Hertz, Unseen Studio + E Studio)
https://www.expedia.com/route66/

**Qué pude ver y qué no.** El sitio está detrás de un control anti-bots con captcha: devolvió 429 y "Bot or Not?" tanto al lector web como a un Chromium automatizado. No lo intenté saltar. No pude ver su HTML, sus bundles ni sus recursos.

**Lo verificable, de fuentes públicas:**
- Ficha de Awwwards (https://www.awwwards.com/sites/route-66-centennial): nominado el 17/11/2026. Elementos listados:
  - Loader Transition, Intro Sequence, 3D Map.
  - Interactive Journey e Immersive Journey (una por estado).
  - Collectable Keychains (llaveros coleccionables).
  - Editorial Page y Pull Out (panel que sale de costado).
  - Tags: WebGL, Storytelling, Typography, Interaction Design. No nombra librerías.
- La página misma (según su descripción pública y posts de los socios): WebGL hecho de cero, mapas 3D por estado que se arrastran, scroll interactivo, puntos que al tocarlos abren el estado y desvíos, y páginas editoriales con contenido de creadores.

**Lo que tomo como estructura de experiencia (no código, textos, ilustraciones, sonido ni marca):**
- la carga como una pieza más, con transición a la intro;
- la intro como secuencia corta antes del mapa;
- el mapa que se arrastra, además del scroll;
- las paradas que abren un panel lateral sin salir del mapa;
- los coleccionables por parada.

**Pendiente:** cámara, tipografía, sonido y rendimiento móvil no se pudieron observar. Si querés, grabá la pantalla del celular recorriéndolo (2 o 3 minutos) y lo analizo cuadro por cuadro.

### Otros sitios
| Sitio | Fuente | Qué tomo |
|---|---|---|
| **San Rita** (Atelier San Rita, Awwwards 2026) | https://www.awwwards.com/mapping-the-uncharted-the-san-rita-project.html | Relieve real como base con estética de mapa topográfico de época y grano de papel en shader. Un canvas persistente que no se desmonta al cambiar de sección. Calidad adaptativa: baja grano y sombras si caen los fps. Texturas comprimidas. |
| **Orano** (Immersive Garden, Site of the Month) | https://www.awwwards.com/orano-from-immersive-garden-wins-site-of-the-month-novemeber.html | Altura codificada en canales de imagen. Un mismo terreno visto desde distintos ángulos para que el mundo parezca más grande sin más datos. Mallas más simples en el celular. Antialias solo con DPR < 2. |
| **Rewind the Red Planet** (National Geographic) | https://source.opennews.org/articles/how-we-made-rewind-red-planet/ | DEM real con colores horneados en Python o GIS. Etiquetas en HTML proyectadas desde lat/lon en cada cuadro. Un solo `requestAnimationFrame` para todo. Texturas sin sobredimensionar. Columna única en el celular. |
| **The Boat** (SBS, Site of the Day 2015) | https://www.awwwards.com/sites/the-boat | Narrativa por scroll con paleta corta y tipografía contenida: el contenido manda. |

Ridgeline (Codrops, relieve SRTM con R3F y ScrollTrigger) no se pudo leer: Codrops devuelve 403 a este entorno.

---

## 2. Fase 0 · Plan

### 2.1 Dirección de arte

**Paleta:** "Paleta 4 · Fitz Roy y polares" (CLAUDE.md y `docs/investigacion-estetica.md`), sin colores nuevos.
- Nieve `#F2F6F9` y tinta `#131A22` como base.
- Polar `#9D2F23`: único acento (ruta, autos, parada activa, botones).
- Marino `#22375C`: agua profunda e interfaz secundaria.
- Abeto `#3D594F` y lenga `#A9561F`: bosque y "a confirmar".
- Pastizal `#D8B273`: estepa y fechas.
- Granito `#58758B` y cielo `#B8D3E7`: cumbres, bruma y luz.

**Tipografía:** la misma familia, autoalojada en woff2 recortados a latín y español para que ande sin conexión.
- Caprasimo: título y nombres de paradas grandes.
- Fraunces: relato breve de la ficha.
- Atkinson Hyperlegible: datos.
- IBM Plex Mono: fechas, km y coordenadas.
- Escala fluida con `clamp()`. Interlineado ajustado en los títulos.

**Lenguaje gráfico:** catálogo outdoor y atlas de época.
- Bordes finos, fichas con esquinas rectas, sombras duras cortas.
- Grano de papel solo en la interfaz, nunca en el terreno.
- Parches bordados como único elemento "juguetón".

**Motion:**
- Curvas `power3.inOut` y `expo.out`.
- La cámara nunca corta: siempre interpola por spline.
- Los textos entran por línea (máscara y desplazamiento de 12 px).
- Las fichas salen de abajo en el celular y del costado en escritorio.
- Duraciones de 450 a 900 ms. Nada en loop salvo el agua y los autos.
- Con `prefers-reduced-motion`: cortes con fundido de 200 ms y sin vuelo de cámara.

### 2.2 Arquitectura técnica (sin paso de build)

**Librerías:** three.js **r170** (`three@0.170.0`) y GSAP **3.12.5** con ScrollTrigger (licencia gratuita de GSAP). Las dos se sirven desde `vendor/`, con su licencia, y se cargan por importmap. Van en el repo y no en una CDN para que el service worker las guarde y todo ande sin señal.

**Módulos** (ES modules en `js/recorrido/`):
- `main.js`: arranque, carga por etapas, bucle único de render, calidad adaptativa.
- `terreno.js` + `terreno-worker.js`: quadtree de bloques con LOD. El worker decodifica alturas y arma geometría fuera del hilo principal.
- `agua.js`: lagos de OSM como mallas planas a su cota real, con reflejo de cielo y Fresnel.
- `rutas.js`: rutas y senderos pegados al terreno. Línea punteada roja de ancho fijo en pantalla, con test de profundidad.
- `autos.js`: los dos Basalt (modelo procedural liviano) avanzando por la ruta real.
- `camara.js`: spline de la cámara y del punto mirado; control por scroll, arrastre, flechas y línea de tiempo; vista general.
- `carteles.js`: carteles HTML proyectados, con margen de 12 px y sin choques (lo que ya resolvimos en `relato`).
- `parches.js`: diseño SVG de cada parche, álbum y `localStorage` (`pat-parches`).
- `sonido.js`: ambiente opcional, apagado por defecto, cargado solo al prenderlo.
- `ui.js`: intro, carga, fichas, barra.

**Datos:** todos desde `js/datos.js` (sin duplicar la maqueta). Se agrega `PARADAS`, armado desde `DAYS` y `BASES` en tiempo de carga: no se repite ningún dato.

**Casas, Autos, Gastos y Pesca:** siguen en `js/app.js`, re-estilizados en la fase 3.

### 2.3 Presupuesto de rendimiento

| Qué | Celular gama media | PC |
|---|---|---|
| Carga inicial (HTML + CSS + JS de la intro + fuentes), gzip | ≤ 250 KB | ≤ 250 KB |
| Primer terreno visible (bloques gruesos + color) | ≤ 1,2 MB | ≤ 2 MB |
| 3D completo descargado durante el recorrido | ≤ 6 MB | ≤ 14 MB |
| Triángulos en pantalla | ≤ 350 mil | ≤ 1,2 millones |
| Draw calls | ≤ 60 | ≤ 120 |
| DPR del canvas | máximo 1,5 (baja a 1 si cae) | máximo 2 |
| Objetivo | 30 fps estables (apunto a 45) | 60 fps |
| LCP de la intro (Lighthouse móvil, 4G lenta) | ≤ 2,5 s | — |

- **Calidad adaptativa:** promedio móvil de los fps. Si queda por debajo de 28 durante 2 s, baja un escalón (DPR, nivel de LOD, reflejo del agua). Si queda por encima de 55, sube.
- **Carga por etapas:**
  1. Intro (solo HTML y CSS).
  2. Terreno grueso de toda la zona (~400 KB).
  3. Detalle de la primera parada.
  4. El resto, a demanda según dónde esté la cámara.
- **Formatos:** color en WebP (con respaldo JPEG para Safari viejo). Alturas en PNG RGB con codificación Terrarium (24 bits, sin pérdida, se decodifica con `createImageBitmap` en el worker).

### 2.4 Cómo armo el terreno (fase 1)

**Zona:**
- Pedida: lat −39,95 a −41,35, lon −72,0 a −70,95.
- **Propuesta:** extender el núcleo al norte hasta **−39,55** para que el **Lanín** (−39,64, −71,50) quede en alta resolución; si no, queda en el anillo lejano.
- Anillo exterior de ±0,6° con AWS Terrain Tiles para que nunca se vea el borde. Se funde con la bruma y tiene skirts.

**Relieve:**
- Copernicus GLO-30 (30 m; los tiles S40–S42 × W071–W073 responden desde acá).
- Escala real en metros.
- **Exageración vertical 1,3:** el Tronador y el Lanín se leen sin parecer agujas. Se puede probar 1,2 y 1,5 con el selector de la fase 1.

**LOD:**
- Quadtree de 5 niveles, bloques de 128×128 cuadros con skirts.
- 30 m solo en un corredor de ~4 km alrededor de la ruta, los senderos y las paradas.
- 60–120 m en el resto, y 250 m o más en el anillo.
- Elección de nivel por error en pantalla (píxeles), no por distancia fija.

**Datos de OSM** (API oficial v0.6 por cajas chicas más Nominatim; Overpass y Geofabrik no responden desde este entorno):
- Agua y costas de lagos: `natural=water`, `water=lake/river`, multipolígonos.
- Glaciares: `natural=glacier`.
- Rutas por `ref` (RN 40, RN 231, RN 234, RN 237, RP 65, RP 82, RP 81 y RP 63 si corresponde): la geometría de OSM, unida y simplificada a 5 m.
- Senderos al Frey y al Meiling: los mismos de la versión actual, con `tools/senderos.py`.
- Bosques: si `landuse=forest` / `natural=wood` resulta incompleto en la zona (pasa en Neuquén), completo con **ESA WorldCover 10 m** (CC BY 4.0) y lo anoto.

**Posiciones:** Nominatim y OSM para San Martín, Chapelco, Falkner, Traful, La Angostura, Villa Catedral, Refugio Frey, Otto Meiling, Pampa Linda y Bariloche. Coordenadas y fuente en `data/recorrido/lugares.json`.

**Texturas** (dos propuestas en el mismo preview, con selector A/B):
- **A · Ilustrada:**
  - Hillshade multidireccional horneado.
  - Tintas hipsométricas con la paleta: pastizal en la estepa, abeto en el bosque real, granito arriba de ~1.600 m y nieve según altura, pendiente y orientación (la cara sur conserva más nieve).
  - Lagos exactos de OSM en marino y celeste.
  - Líneas de costa finas y bosque de WorldCover/OSM.
  - Sin ruido inventado.
- **B · Satelital:**
  - Sentinel-2 cloudless de EOX (z13, ~15 m/px en esta latitud), corregido hacia la paleta con una curva de color suave para que no choque con la interfaz.
  - **Licencia:** el mosaico 2016 es CC BY 4.0; los de 2018 en adelante son CC BY-NC-SA 4.0 (uso no comercial y con atribución; un sitio personal del viaje lo cumple, pero tenés que elegir). Lo verifico en la página de EOX en la fase 1 y pongo el crédito exacto en el pie.
- **En las dos:**
  - Normal map horneado de 30 m (la luz se ve fina aunque la malla sea más gruesa).
  - Sol de verano de la tarde.
  - Bruma atmosférica por distancia y altura.
  - Agua con reflejo suave del cielo y Fresnel.

**Scripts y salidas:**
- Scripts en `tools/recorrido/` (Python: numpy, scipy, rasterio, Pillow; todos instalados acá).
- Datos horneados en `data/recorrido/`.
- Créditos en el pie: Copernicus, AWS Terrain Tiles (SRTM y otros), ESA WorldCover, EOX y © OpenStreetMap.

**Entregable de la fase 1:**
- Terreno solo, navegable (orbitar, zoom, arrastre con un dedo y pellizco), con selector A/B y exageración.
- Capturas JPEG de San Martín, Nahuel Huapi, Catedral/Frey y Tronador en 390x844 y 1440x900.
- fps medidos.

### 2.5 Fases siguientes (resumen)
- **Fase 2:**
  - Carga con progreso real (bytes de la etapa 2), intro, cámara por spline con scroll, arrastre, flechas y línea de tiempo.
  - Los dos Basalt por la ruta; tramo a pie al Frey; Meiling opcional.
  - Carteles sin cortes ni choques, parches con álbum, sonido opcional (CC0 de Freesound).
  - Video corto del recorrido grabado con Playwright.
- **Fase 3:** fichas y "Destinos" desde `datos.js`, y Casas, Autos, Gastos y Pesca re-estilizados.
- **Fase 4:** rendimiento y Lighthouse, versión liviana, service worker (`VERSION`), AA, 404, Open Graph, CLAUDE.md, CHECKPOINTS.md y este informe.

### 2.6 Lo que necesito que definas
1. **Lanín:** ¿extiendo la zona al norte hasta −39,55 para tenerlo en alta resolución?
2. **Satelital (B):** ¿mosaico 2016 (CC BY, imágenes más viejas) o 2024 (más actual, CC BY-NC-SA)?
3. **Exageración:** ¿arranco en 1,3?
4. **Autos:** ¿colores de los dos Basalt? Propuesta: uno rojo polar y uno nieve con techo tinta (el modelo admite techo de otro color).
5. **Route 66:** ¿podés mandarme una grabación de pantalla recorriéndolo? Yo no puedo entrar por el captcha.
