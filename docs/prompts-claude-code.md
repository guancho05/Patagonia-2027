# Etapas del rediseño (rama `relato`)

Resumen de lo pedido para la noche del 18/11/2026. El detalle de lo hecho y las decisiones está en `docs/informe-noche.md`.

| # | Etapa | Qué incluye | Entregables |
|---|---|---|---|
| 0 | Orden | Actualizar "Cómo está hoy" en `CLAUDE.md`, sumar la regla de contenido (solo información útil, sin relleno ni slogans, no inventar actividades) y reemplazar este archivo por el resumen. | `CLAUDE.md`, este archivo |
| 1 | Contenido | Sacar "Bajá para volar" y todo relleno de portada, pantallazo, botones y menú; dejar concretas las descripciones de cada día. | Lista antes → después en el informe |
| 2 | Investigación de estética | Catálogos, revistas y publicidad outdoor de los 70, 80 y 90 (incluida pesca con mosca y equipo de escalada): fotografía, color de película, portadas, paleta, tono, tipografía, papel y grillas. Inspiración, no copia: ni nombre, ni logo, ni lettering, ni fotos de ninguna marca. | `docs/investigacion-estetica.md` |
| 3 | Aplicar la estética | Rediseño de portada, pantallazo, botones, menú, itinerario, casas, autos y gastos en claro y oscuro: estructura de catálogo viejo, pies de foto con lugar y fecha, tratamiento de película sobre las fotos. AA, mobile first, sin scroll horizontal, reduced motion. | `index.html`, capturas |
| 4 | Pesca de truchas | Reglamento 2026-2027 (Neuquén, Río Negro, PN Lanín y Nahuel Huapi), permisos para uruguayos, lugares sobre la ruta y en nuestros días, guías, equipo. Sección "Pesca" en el menú, bloque "Pesca hoy" en los días, permisos en Gastos. | `docs/investigacion-pesca.md`, `index.html` |
| 5 | Montaña más grande | Más territorio (Tronador → Mascardi, y si se puede hasta el Catedral con el Frey), detalle cerca y periferia simple, horizonte y bruma para no ver nunca el borde, recorrido del dron restringido, más definición (DEM más fino, normal map, nieve por altura, pendiente y orientación, sombreado horneado). | `js/hero.js`, `tools/`, `data/`, capturas antes/después |

## Reglas de esas etapas
- Checkpoint antes y después de cada etapa (`checkpoint/NN-antes-<etapa>` y `checkpoint/NN-<etapa>-lista`), anotados en `CHECKPOINTS.md`.
- Capturas con Playwright en 390x844, 1280x800 y 2560x1080, claro y oscuro, en `docs/capturas/<etapa>/`.
- No tocar `main`. No cambiar precios, fechas ni reservas. No perder funciones (dos versiones del itinerario, casas, autos, gastos, links a Windguru, Google Maps, Booking, Airbnb y registro de trekking).
