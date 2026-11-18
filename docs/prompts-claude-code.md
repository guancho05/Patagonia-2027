# Prompts para Claude Code — rediseño "relato de aventura"

Usalos en orden, uno por sesión (o uno por vez en la misma sesión). Abrí Claude Code dentro de la carpeta del repo: el `CLAUDE.md` le da el contexto del proyecto.
Cada prompt le pide un plan primero: leelo, corregilo si hace falta, y recién ahí decile "dale".

Trabajo en la rama `relato`: `main` sigue siendo el link que usan tus amigos hasta que el rediseño esté listo.

Checkpoints: antes y después de cada paso Claude Code crea un tag (`checkpoint/NN-...`) y lo anota en `CHECKPOINTS.md`. Para volver atrás, decile por ejemplo: "mostrame los checkpoints y volvé al `checkpoint/02-antes-tronador-3d`".

---

## 1 · Dirección de arte y estructura (skill: frontend-design)

```
Usá la skill frontend-design. Leé CLAUDE.md e index.html completos antes de proponer nada.

Quiero rediseñar la web del viaje con un vibe de marca outdoor tipo Patagonia, pero propio (sin copiar nombre, logo, tipografías ni layouts de ninguna marca):
- Paleta tierra: verde musgo, gris piedra, crema, azul de lago y un acento naranja quemado. Definila como tokens en :root, con modo claro y oscuro.
- Tipografía editorial grande con mucho aire (Google Fonts libres), titulares grandes y texto de lectura cómodo en el celular.
- Fotos documentales a sangre (full-bleed) desde Cloudinary, con transformaciones de tamaño según pantalla (srcset con w_ de Cloudinary).
- Tono de relato de aventura en los textos de las secciones, sin cambiar los datos del plan.

Estructura nueva:
- Arriba, un "Relato": portada + capítulos del viaje (lagos, pueblos, refugios) pensados para scroll. En este paso dejá los capítulos como bloques estáticos con foto y texto; el 3D y las animaciones vienen después. Reservá el lugar del capítulo "Tronador / Otto Meiling" para una escena 3D.
- Abajo, "El plan": las páginas que ya existen (itinerario con sus dos versiones, autos, casas) con el nuevo estilo y sin perder ninguna función.
- Los capítulos se generan desde DAYS_B / BASES_B, así no hay datos duplicados.

Técnica:
- Proponé cómo separar index.html en archivos (css/, js/ con ES modules, data/) sin paso de build, para que Vercel lo siga publicando tal cual.
- Creá la rama `relato` y trabajá ahí.

Antes de programar mostrame un plan con: dirección estética (paleta con hex, fuentes, 2 o 3 referencias de estilo descriptas en palabras), mapa de secciones, estructura de archivos y qué cambia en cada página. Esperá mi OK.
```

---

## 2 · El Tronador en 3D con elevación real (skill: threejs)

```
Usá la skill threejs. Leé CLAUDE.md y el plan/estructura que quedó del paso anterior.

Quiero el Cerro Tronador modelado con datos de elevación reales, para el capítulo "Tronador / Otto Meiling" del relato:
- Datos: un DEM real. Proponé la fuente (por ejemplo AWS Terrain Tiles en formato Terrarium, o Copernicus GLO-30) con su licencia y la atribución que hay que mostrar.
- Zona: desde Pampa Linda hasta la cumbre del Tronador, incluyendo el Refugio Otto Meiling y los glaciares Castaño Overa, Alerce y Ventisquero Negro. Verificá vos las coordenadas.
- Hacé un script aparte (Node o Python, en tools/) que baje los datos y genere un heightmap optimizado. Proponé resolución, formato y peso. Que el script quede en el repo para poder regenerarlo.
- Escena: terreno con nieve en la cumbre según altura y pendiente, roca y bosque más abajo, niebla en los valles, luz de atardecer cálida, cielo acorde a la paleta del paso 1.
- Marcadores sutiles: Pampa Linda, Refugio Otto Meiling y la cumbre, con nombres en español.
- En este paso, cámara fija o con controles solo para desarrollo. El recorrido con scroll es el paso 3.
- three.js como ES module desde CDN con versión fija, cargado de forma diferida (recién cuando el capítulo se acerca al viewport).

Antes de programar mostrame un plan con: fuente de datos y licencia, bounding box, pipeline del heightmap, presupuesto de peso (heightmap y JS) y de rendimiento, y cómo vas a hacer el shader de nieve, niebla y luz. Esperá mi OK.
```

---

## 3 · Recorrido con scroll (skill: gsap-scrolltrigger)

```
Usá la skill gsap-scrolltrigger. Leé CLAUDE.md y lo que quedó de los pasos 1 y 2.

Quiero que el relato se cuente con el scroll:
- Capítulo Tronador: la escena 3D queda fija (pin) y el scroll mueve la cámara por la montaña: llegada a Pampa Linda, subida por el sendero hacia el Refugio Otto Meiling, vista de los glaciares y cierre en la cumbre al atardecer. Los textos del capítulo aparecen sincronizados con cada parada de la cámara.
- Resto del relato: lagos (Ruta de los 7 Lagos, Falkner, Traful), pueblos (San Martín, La Angostura, Bariloche) y refugios (Frey, Meiling) aparecen con fotos a sangre y transiciones sobrias (parallax suave, revelado de titulares). Nada de animaciones porque sí.
- Una línea de ruta (las bases del viaje) que avanza con el scroll y marca dónde estás, coherente con la ruta del itinerario.
- Las paradas de cámara y los capítulos se definen en datos (un array de keyframes), no hardcodeados en el código de animación.
- GSAP y ScrollTrigger desde CDN con versión fija. Integralo con el render loop de three.js sin duplicar requestAnimationFrame.

Antes de programar mostrame un plan con: storyboard de secciones (qué se ve y qué texto aparece en cada tramo del scroll), keyframes de cámara, cómo se sincroniza con three.js y cómo se comporta en el celular (alto de pantalla, barra del navegador, scroll táctil). Esperá mi OK.
```

---

## 4 · Celular, fallback y movimiento reducido (skills: threejs + gsap-scrolltrigger)

```
Usá las skills threejs y gsap-scrolltrigger. Leé CLAUDE.md y lo hecho hasta ahora.

Quiero que todo ande bien en el celular y tenga un fallback liviano:
- Detectá y bajá a modo liviano cuando: no hay WebGL2, prefers-reduced-motion, Save-Data, poca memoria (navigator.deviceMemory < 4) o el 3D falla al cargar.
- Modo liviano: una imagen fija del Tronador renderizada desde la misma escena (exportala, subila a Cloudinary y usala también como póster mientras carga el 3D), textos y fotos sin pin ni scrub, transiciones simples o ninguna.
- Con prefers-reduced-motion: sin movimiento de cámara ni parallax; el contenido igual se lee completo.
- Rendimiento: pixel ratio limitado, geometría según el dispositivo, pausar el render fuera de pantalla y con la pestaña oculta, liberar memoria al salir del capítulo.
- Presupuestos: el plan (itinerario, casas, autos) tiene que cargar y ser usable sin esperar al 3D; LCP menor a 2,5 s en 4G simulado; 30 fps o más en un celular de gama media.
- Probalo con Playwright en viewport de celular (390x844) y de escritorio, con y sin reduced-motion, y mostrame capturas.

Antes de programar mostrame un plan con: matriz de casos (dispositivo / preferencia → qué ve el usuario), presupuestos medidos hoy vs. objetivo, y cómo lo vas a medir. Esperá mi OK.
```

---

## 5 · Pulido final y publicación (skill: frontend-design)

```
Usá la skill frontend-design. Leé CLAUDE.md y revisá la rama `relato` completa.

Hacé una revisión final antes de publicar:
- Consistencia visual: tipografía, espaciados, colores en claro y oscuro, estados de foco y contraste accesible.
- Textos: español rioplatense con tildes y ñ, tono de relato en el Relato y claro y directo en el Plan.
- Funciones del plan intactas: las dos versiones del itinerario, casas confirmadas y tachadas, combos, autos, links (Windguru, Maps, Booking, Airbnb, registro de trekking).
- Atribuciones: DEM, fotos de Wikimedia y de los anuncios.
- Probá el preview de Vercel de la rama en celular y escritorio y mostrame capturas.

Primero mostrame la lista de problemas encontrados y lo que proponés cambiar. Esperá mi OK. Después de corregir, abrí un PR de `relato` a `main` con un resumen de los cambios; yo lo mergeo.
```
