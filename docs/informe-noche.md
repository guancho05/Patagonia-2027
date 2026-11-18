# Informe de la noche (18 → 19/11/2026)

> Estado: **en curso**. Este archivo se completa al final con el resumen, las decisiones y lo que queda para decidir.

## Plan

Rama de trabajo: `relato`. `main` no se toca.

1. **Etapa 0 · Orden.** `CLAUDE.md` con la estructura real y la regla de contenido; `docs/prompts-claude-code.md` reemplazado por el resumen de etapas.
2. **Etapa 1 · Contenido.** Sacar textos de relleno de portada, pantallazo, botones y menú; revisar las bajadas (`s`) y descripciones (`lead`) de cada día para que digan qué se hace, dónde, cuándo y cuánto. Sin cambiar datos.
3. **Etapa 2 · Investigación de estética.** Búsqueda web sobre catálogos y publicidad outdoor 70-90, película Kodachrome/Ektachrome, tipografía y grillas. Resultado en `docs/investigacion-estetica.md` con links, paleta en hex, fuentes libres y principios.
4. **Etapa 3 · Aplicar la estética.** Tokens nuevos de color y tipografía, estructura de catálogo, pies de foto con lugar y fecha, grano y tono de película en CSS/SVG livianos. Todas las páginas, claro y oscuro.
5. **Etapa 4 · Pesca.** Reglamentos oficiales 2026-2027 (o el último publicado, marcado como tal), permisos online, lugares en orden de viaje, guías, equipo. Sección "Pesca", bloque "Pesca hoy" en los días, permisos en Gastos. Fuentes en `docs/investigacion-pesca.md`.
6. **Etapa 5 · Montaña.** Terreno mucho más grande con anillo exterior de baja resolución, horizonte y bruma; DEM preprocesado en `tools/` y servido desde `data/`; normal map y sombreado horneado; recorrido del dron acotado.
7. **Cierre.** Este informe completo, `CHECKPOINTS.md` al día, sección "Para revisión".

## Decisiones

- **Checkpoints como ramas.** El push de tags se corta en el proxy de este entorno ("unexpected disconnect"), igual que en la sesión anterior. Cada checkpoint es una rama `checkpoint/NN-...` que apunta al commit correspondiente. Funciona igual para volver y Vercel le da un preview propio.
- **Skills.** En este entorno no están instaladas las skills `frontend-design`, `threejs` ni `gsap-scrolltrigger`. Seguí sus criterios habituales a mano (dirección estética explícita antes de codear, tokens, una sola escena three.js con loop propio sin GSAP).

## Etapa 1 · Contenido: antes → después

(se completa en la etapa 1)
