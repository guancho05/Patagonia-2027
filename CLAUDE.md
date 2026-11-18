# Patagonia 2027 — contexto para Claude Code

Web del viaje de 8 amigos a la Patagonia: 27/12/2026 → 10/01/2027 (Buenos Aires, San Martín de los Andes, Lago Falkner, Villa Traful, Refugio Frey, Villa La Angostura, Refugio Otto Meiling en el Tronador, Bariloche). La usan los 8 desde el celular para ver el plan.

## Cómo está hoy (rama `relato`)
- `index.html` (~130 KB): HTML + CSS + JS vanilla inline, sin build. Contiene todos los datos del viaje y las páginas.
- `js/hero.js`: portada 3D del Tronador (ES module, carga diferida). Usa `vendor/three.module.min.js` (three.js servido desde el repo, licencia en `vendor/three-LICENSE.txt`). El relieve sale de datos de elevación (ver `tools/` y `data/` si existen). Si no hay WebGL2, hay `prefers-reduced-motion`, Save-Data o poca memoria, muestra una foto fija (`.hero.static`).
- Deploy: Vercel publica `main` de `guancho05/Patagonia-2027` tal cual (sitio estático). **El link de Vercel lo usan los amigos: no romper `main`.** Las ramas tienen su preview en Vercel.
- Fotos: del itinerario, de Unsplash (`UNS(id,w)`) o Wikimedia en Cloudinary (`PH`/`CR`); de las casas, Cloudinary (cloud `wdfk5jij`, `https://res.cloudinary.com/wdfk5jij/image/upload/f_auto,q_auto/<id>`) o directo de Airbnb/Booking. Para tamaños, transformaciones (`w_1600`, `c_fill`) en vez de copias.
- Estructura de la página, de arriba abajo:
  1. Portada (`#hero`): canvas 3D con cámara tipo dron que avanza con el scroll y vuelve al subir; marcador del Refugio Otto Meiling.
  2. Pantallazo (`#portada`): datos del viaje, mosaico de fotos y botones de itinerario original / nuevo (`.vchoose`).
  3. Plan (`#app`): vistas `#itinerario`, `#casas`, `#autos`, `#gastos` (y las que se sumen), cambiadas con `showPage(k)` y el menú lateral (`#drawer`, botón `#menuBtn`).
- Datos (en el `<script>` de `index.html`):
  - `DAYS_A` / `BASES_A`: itinerario original. `DAYS_B` / `BASES_B`: itinerario nuevo (Frey + plan B para el Meiling), por defecto; acá van los cambios. Selector `.vbtn`, guardado en `localStorage` `pat-ver`.
  - Cada día: `{d, w, k (casa|camp|ref|fly), t, s, lead, st, a, f, l?, sc, p?}`. `sc` = escena dibujada en canvas (`draw(sc)`), fallback sin foto. `p` = índice de foto en `PH`/`CR`.
  - `STAY` (casa de cada base por versión), `OTHER` (campings y refugios), `LEGS` (trayecto de cada día: origen, destino, tiempo, km, vía; mapa embebido de Google con relieve).
  - `CITIES` (casas por lugar, con puntajes, pros/contras y fotos), `CONF` (confirmadas: San Martín y Bariloche; el resto de ese lugar va tachado), `COMBOS`.
  - Gastos: `renderGastos()` arma la tabla desde autos, casas y la lista de gastos "a cargar".
  - `localStorage`: `pat-day`, `pat-ver`, `pat-casa`, `pat-page`. Siempre envuelto en try/catch.
- Investigaciones y decisiones: `docs/investigacion-estetica.md`, `docs/investigacion-pesca.md`, `docs/informe-noche.md`. Capturas en `docs/capturas/<etapa>/`.
- Estética: catálogo outdoor de época (ver `docs/investigacion-estetica.md`). Fuentes: Fraunces (títulos y relato, eje `SOFT`), Atkinson Hyperlegible (datos), IBM Plex Mono (pies de foto, fechas). Paleta en tokens `--papel`, `--hoja`, `--tinta`, `--polar`, `--abeto`, `--cielo`, etc.; los nombres viejos (`--bg`, `--sign`, `--wood`…) apuntan a los nuevos. Grano de papel con un SVG fijo (`body::before`) y color de película con `filter` en las fotos del viaje.
- Modo claro/oscuro con tokens en `:root` (`prefers-color-scheme` y `data-theme`).

## Reglas
- Todo el texto visible en español rioplatense, con tildes y ñ. `<meta charset="utf-8">` siempre.
- Mobile first: tiene que andar bien en un celular de gama media con 4G. Nada de scroll horizontal de página.
- Respetar `prefers-reduced-motion` y tener fallback liviano para todo lo 3D/animado.
- Sin paso de build salvo que se justifique en el plan: preferir ES modules desde CDN con versiones fijas (importmap).
- No perder funcionalidades existentes (dos versiones del itinerario, casas, autos, links a Windguru, Google Maps, Booking/Airbnb).
- Estética "marca outdoor" propia: no usar nombre, logo, tipografías propietarias ni layouts copiados de Patagonia Inc. ni de otra marca.
- Antes de programar: mostrar un plan y esperar aprobación (salvo que el pedido diga explícitamente que se trabaja en modo autónomo; en ese caso el plan va en `docs/informe-noche.md`).
- **Contenido (regla permanente):**
  - Solo información útil del viaje: fechas, lugares, horarios, distancias, precios, reservas y qué se hace cada día, en una o dos frases concretas.
  - Nada de relleno, slogans ni llamados del tipo "Bajá para volar".
  - Las actividades se van a ir definiendo: no inventar detalles. Lo que no está confirmado se marca "a confirmar".
  - Todo dato de la realidad (reglamentos, temporadas, precios, horarios) con fuente y link; si no se pudo verificar, "a confirmar".

## Checkpoints (para poder volver atrás)
- Commits chicos y frecuentes, con mensajes en español que digan qué cambió.
- Antes de empezar cada paso de `docs/prompts-claude-code.md`, crear un tag con el estado actual: `checkpoint/NN-antes-<paso>` (ej. `checkpoint/02-antes-tronador-3d`). Al terminar el paso y con mi OK, otro tag `checkpoint/NN-<paso>-listo`. Subir los tags (`git push origin --tags`). Si el entorno no deja subir tags (pasa en las sesiones en la nube), crear ramas con el mismo nombre (`git push origin HEAD:refs/heads/checkpoint/NN-...`) y aclararlo en `CHECKPOINTS.md`.
- Mantener `CHECKPOINTS.md` con una línea por tag: fecha, tag, qué tiene esa versión y el link al preview de Vercel si existe.
- Si pido volver a una versión: mostrarme la lista de checkpoints, confirmar cuál, y volver con un commit nuevo que restaure ese estado (`git revert` o `git checkout <tag> -- .` + commit). No usar `git reset --hard` ni `push --force` sobre `main` ni sobre ramas compartidas.
- Para probar una versión vieja sin tocar nada: crear una rama desde el tag (`git switch -c prueba-<tag> <tag>`) y abrir su preview en Vercel.
