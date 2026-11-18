# Patagonia 2027 — contexto para Claude Code

Web del viaje de 8 amigos a la Patagonia: 27/12/2026 → 10/01/2027 (Buenos Aires, San Martín de los Andes, Lago Falkner, Villa Traful, Refugio Frey, Villa La Angostura, Refugio Otto Meiling en el Tronador, Bariloche). La usan los 8 desde el celular para ver el plan.

## Cómo está hoy
- Un solo `index.html` (~100 KB): HTML + CSS + JS vanilla inline, sin build ni dependencias.
- Deploy: Vercel publica `main` de `guancho05/Patagonia-2027` tal cual (sitio estático). **El link de Vercel lo usan los amigos: no romper `main`.** Trabajar en una rama y revisar en el preview de Vercel antes de mergear.
- Fotos: en Cloudinary, cloud `wdfk5jij`, URL `https://res.cloudinary.com/wdfk5jij/image/upload/f_auto,q_auto/<id>`. Para tamaños usar transformaciones (`w_1600`, `c_fill`, etc.) en vez de subir copias. Algunas fotos de casas se cargan directo de Airbnb/Booking.
- Páginas (tabs con hash): `#itinerario`, `#autos`, `#casas` (`showPage`).
- Datos (en el `<script>`):
  - `DAYS_A` / `BASES_A`: itinerario original. `DAYS_B` / `BASES_B`: versión "Con Frey y plan B" (por defecto la que coincide con las reservas). Selector `.vbtn`, guardado en `localStorage` `pat-ver`.
  - Cada día: `{d, w, k (casa|camp|ref|fly), t, s, lead, st, a, f, l?, sc, p?}`. `sc` = escena del paisaje dibujado en canvas (`draw(sc)`), que es el fallback cuando no hay foto. `p` = índice de foto en `PH`/`CR`.
  - `CITIES` (casas por lugar, con puntajes, pros/contras y fotos), `CONF` (casas confirmadas: San Martín y Bariloche; el resto de ese lugar se muestra tachado), `COMBOS`.
  - `localStorage`: `pat-day`, `pat-ver`, `pat-casa`, `pat-page`. Siempre envuelto en try/catch.
- Fuentes actuales: Big Shoulders Display, Atkinson Hyperlegible, JetBrains Mono (Google Fonts).
- Modo claro/oscuro con tokens en `:root`.

## Reglas
- Todo el texto visible en español rioplatense, con tildes y ñ. `<meta charset="utf-8">` siempre.
- Mobile first: tiene que andar bien en un celular de gama media con 4G. Nada de scroll horizontal de página.
- Respetar `prefers-reduced-motion` y tener fallback liviano para todo lo 3D/animado.
- Sin paso de build salvo que se justifique en el plan: preferir ES modules desde CDN con versiones fijas (importmap).
- No perder funcionalidades existentes (dos versiones del itinerario, casas, autos, links a Windguru, Google Maps, Booking/Airbnb).
- Estética "marca outdoor" propia: no usar nombre, logo, tipografías propietarias ni layouts copiados de Patagonia Inc. ni de otra marca.
- Antes de programar: mostrar un plan y esperar aprobación.

## Checkpoints (para poder volver atrás)
- Commits chicos y frecuentes, con mensajes en español que digan qué cambió.
- Antes de empezar cada paso de `docs/prompts-claude-code.md`, crear un tag con el estado actual: `checkpoint/NN-antes-<paso>` (ej. `checkpoint/02-antes-tronador-3d`). Al terminar el paso y con mi OK, otro tag `checkpoint/NN-<paso>-listo`. Subir los tags (`git push origin --tags`).
- Mantener `CHECKPOINTS.md` con una línea por tag: fecha, tag, qué tiene esa versión y el link al preview de Vercel si existe.
- Si pido volver a una versión: mostrarme la lista de checkpoints, confirmar cuál, y volver con un commit nuevo que restaure ese estado (`git revert` o `git checkout <tag> -- .` + commit). No usar `git reset --hard` ni `push --force` sobre `main` ni sobre ramas compartidas.
- Para probar una versión vieja sin tocar nada: crear una rama desde el tag (`git switch -c prueba-<tag> <tag>`) y abrir su preview en Vercel.
