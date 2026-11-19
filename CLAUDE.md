# Patagonia 2027 — contexto para Claude Code

Web del viaje de 8 amigos a la Patagonia: 27/12/2026 → 10/01/2027 (Buenos Aires, San Martín de los Andes, Lago Falkner, Villa Traful, Villa La Angostura, Refugio Frey, Bariloche y, opcional, el Refugio Otto Meiling en el Tronador). La usan los 8 desde el celular para ver el plan, también sin señal.

## Cómo está hoy (19/11/2026)
- Sitio estático sin paso de build. Archivos:
  - `index.html`: solo el marcado (portada, resumen, las seis secciones, pie) y el contenido fijo de Autos y Pesca.
  - `css/estilos.css`: todos los estilos, con índice arriba. Tokens en `:root` (paleta, tipografía, espaciado), tema claro y oscuro (`prefers-color-scheme` y `data-theme`).
  - `js/datos.js`: **único lugar con los datos del viaje** (ver abajo). Para cambiar el plan se edita solo este archivo.
  - `js/app.js`: dibuja todo desde los datos (itinerario, casas, gastos, pesca, resumen, mapa plano, barra de secciones, visor de fotos, aviso sin conexión).
  - `js/hero.js`: portada 3D (ES module, carga diferida y por partes). Usa `vendor/three.module.min.js` (licencia en `vendor/three-LICENSE.txt`). Si no hay WebGL2, hay `prefers-reduced-motion`, Save-Data o poca memoria, queda la foto fija (`.hero.static`).
  - `sw.js`: service worker. Guarda la web, los datos, el mapa, la versión liviana del 3D, las tipografías y una foto por día para verla sin conexión después de abrirla una vez. **Al publicar cambios, subir `VERSION` en `sw.js`.**
  - `manifest.webmanifest`, `img/` (íconos, `portada-og.jpg` para la vista previa de WhatsApp), `404.html`.
- Deploy: Vercel publica `main` de `guancho05/Patagonia-2027` tal cual. **El link de Vercel lo usan los amigos: no romper `main`.** Las ramas tienen su preview en Vercel. `.vercelignore` deja afuera `docs/`, `tools/`, `CLAUDE.md` y `CHECKPOINTS.md`.
- Estructura de la página, de arriba abajo:
  1. Barra de secciones (`#barra`): fija **abajo en el celular** y **arriba en pantallas de 900 px o más**; Itinerario, Mapa, Casas, Autos, Gastos, Pesca. Marca la sección abierta (`aria-current="page"`). `go(k)` cambia de sección y lleva al plan.
  2. Portada (`#hero`): canvas 3D con cámara tipo dron que avanza con el scroll; carteles del Frey, el Meiling y Bariloche. Sin créditos encima (van en el pie).
  3. Resumen (`#portada`): fechas, datos del viaje (calculados) y mosaico de fotos.
  4. Plan (`#app`): vistas `#view-itin`, `#view-mapa`, `#view-casas`, `#view-autos`, `#view-gastos`, `#view-pesca`, cambiadas con `showPage(k)`.
  - La página **arranca siempre arriba**, en la portada. Con `#itinerario`, `#mapa`, etc. en el link abre esa sección.
- Datos (`js/datos.js`):
  - `VIAJE` (personas, fechas, `actualizado`), `DAYS` (un solo itinerario), `BASES` (franja de ruta; `o:1` = opcional).
  - Cada día: `{d, w, k (casa|camp|ref|fly), t, s, lead, st, a, l?, sc, opt?}`. `sc` = ilustración dibujada en canvas si no hay foto o no carga. `opt` = qué reemplaza el Meiling opcional.
  - `LEGS` (trayecto por fecha: origen, destino, tiempo, km, vía; "a confirmar" si falta), `QP` (cómo buscar cada lugar en Google Maps).
  - `STAY` (casa elegida por base), `OTHER` (campings, refugios y lo que falta confirmar), `CITIES` (casas por lugar con puntajes, pros, contras y fotos), `CONF` (confirmadas: San Martín y Bariloche), `NOCHES_COTIZADAS`.
  - `AUTOS`, `PERMISO_PESCA`, `A_CARGAR` (gastos sin precio todavía). La cuenta de gastos es una sola (`gastos()` en `app.js`) y alimenta la tabla, el resumen y la portada.
  - Pesca: `PZ` ("Pesca hoy" por título del día), `SPOTS`, `GUIDES`. Fuentes en `docs/investigacion-pesca.md`.
  - Fotos: `FOTOS` (por título del día) y `MOSAICO`. `u` = id de Unsplash, `fx`/`fy` = punto de interés para el recorte, `c` = id de Cloudinary con crédito. Se piden recortadas en el servidor (`ar`, `fp-x`, `fp-y`) con `srcset`.
  - `localStorage`: `pat-day`, `pat-casa`. Siempre envuelto en try/catch.
- Trayecto de cada día: mapa de Google embebido con la URL directa `https://www.google.com/maps/embed?origin=mfe&pb=…` (la vieja `maps.google.com/maps?…&output=embed` redirige con `X-Frame-Options` y fallaba en celulares). Se carga cuando el bloque está por entrar en pantalla.
- Mapa plano (`data/mapa.svg`, de `tools/mapa.py`): en el celular mantiene la proporción vertical; en pantallas anchas ocupa todo el ancho con altura cómoda y la vista general va de Buenos Aires a la zona del viaje. Zoom por GPU con dos capas; teclado: `+`, `−`, flechas, `0`.
- Estética: catálogo outdoor de época. Títulos en Caprasimo, relato en Fraunces, datos en Atkinson Hyperlegible, pies en IBM Plex Mono. **Paleta 4 · Fitz Roy y polares** (`docs/investigacion-estetica.md`): nieve, tinta, granito, pastizal, lenga, abeto, marino y **rojo polar `#9D2F23` como acento** (barra, botones, marcadores, senderos). No usar el logo ni el lettering ni la composición de la marca Patagonia (franjas de colores detrás de una silueta).
- Herramientas (`tools/`):
  - Sin Node ni Python (Windows): `servidor.ps1` (servidor local), `medir.ps1` + `medir.html` (LCP, CLS, peso), `revisar.html` (revisión automática: `powershell -File tools\medir.ps1 -Medidor http://localhost:8080/tools/revisar.html`), `capturar.ps1` + `marco.html` (capturas JPEG), `links.ps1` (links externos → `docs/links.md`), `iconos.ps1`.
  - Con Node: `revisar.cjs` (abre `revisar.html` con Playwright), `medir-mapa-fps.cjs`. `capturas*.cjs` son de la versión anterior.
  - Con Python: `terreno.py`, `osm.py`, `mapa.py`, `senderos.py`, `silueta.py` → `data/`.
- Investigaciones y decisiones: `docs/investigacion-estetica.md`, `docs/investigacion-pesca.md`, `docs/informe-noche.md`, `docs/links.md`. Capturas en `docs/capturas/<etapa>/`, siempre JPEG.

## Reglas
- Todo el texto visible en español rioplatense, con tildes y ñ. `<meta charset="utf-8">` siempre.
- Mobile first: tiene que andar bien en un celular de gama media con 4G y leerse sin conexión. Nada de scroll horizontal de página. Áreas táctiles de 44 px o más.
- Respetar `prefers-reduced-motion` y tener fallback liviano para todo lo 3D/animado.
- Sin paso de build salvo que se justifique en el plan.
- No perder funcionalidades existentes (itinerario, mapa, casas, autos, gastos, pesca, links a Windguru, Google Maps, Booking/Airbnb, modo sin conexión).
- Estética "marca outdoor" propia: no usar nombre, logo, tipografías propietarias ni layouts copiados de Patagonia Inc. ni de otra marca.
- Antes de programar: mostrar un plan y esperar aprobación (salvo que el pedido diga explícitamente que se trabaja en modo autónomo; en ese caso el plan va en `docs/informe-noche.md`).
- **Contenido (regla permanente):**
  - Solo información útil del viaje: fechas, lugares, horarios, distancias, precios, reservas y qué se hace cada día, en una o dos frases concretas.
  - Nada de relleno, slogans ni llamados del tipo "Bajá para volar".
  - Las actividades se van a ir definiendo: no inventar detalles. Lo que no está confirmado se marca "a confirmar".
  - Todo dato de la realidad (reglamentos, temporadas, precios, horarios) con fuente y link; si no se pudo verificar, "a confirmar".

## Checkpoints (para poder volver atrás)
- Commits chicos y frecuentes, con mensajes en español que digan qué cambió.
- Antes de empezar cada paso, crear un tag con el estado actual: `checkpoint/NN-antes-<paso>`. Al terminar, otro `checkpoint/NN-<paso>-listo`. Subir los tags (`git push origin --tags`). Si el entorno no deja subir tags (pasa en las sesiones en la nube), crear ramas con el mismo nombre (`git push origin HEAD:refs/heads/checkpoint/NN-...`) y aclararlo en `CHECKPOINTS.md`.
- Mantener `CHECKPOINTS.md` con una línea por checkpoint: fecha, nombre, qué tiene esa versión y el link al preview de Vercel si existe.
- Si pido volver a una versión: mostrarme la lista de checkpoints, confirmar cuál, y volver con un commit nuevo que restaure ese estado (`git revert` o `git checkout <tag> -- .` + commit). No usar `git reset --hard` ni `push --force` sobre `main` ni sobre ramas compartidas.
- Para probar una versión vieja sin tocar nada: crear una rama desde el tag (`git switch -c prueba-<tag> <tag>`) y abrir su preview en Vercel.
