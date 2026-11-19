# Informe de la noche (18 → 19/11/2026)

> Estado: **terminado**. Las 6 etapas (0 a 5) están hechas y subidas a `relato`. `main` no se tocó.

## Lo primero (resumen en un minuto)

- **Etapa 0 · Orden:** `CLAUDE.md` con la estructura real y una regla de contenido permanente (solo info útil, nada de relleno, no inventar). `docs/prompts-claude-code.md` ahora es el resumen de estas etapas.
- **Etapa 1 · Contenido:** chau "Bajá para volar" y los textos de relleno; cada día dice qué se hace, dónde, a qué hora y cuánto. El pantallazo (km, noches, refugios) se arma solo según la versión elegida. Tabla antes → después más abajo.
- **Etapa 2 · Investigación de estética:** `docs/investigacion-estetica.md`: fotos de gente real sin pose, color de película, tapas con foto grande, tono de notas de campo, paleta sacada de tu foto, tipografías libres.
- **Etapa 3 · Estética aplicada:** toda la web como catálogo de época, claro y oscuro: papel crema con grano, borde de papel y banda de datos en la portada, Fraunces + Atkinson + Plex Mono, rojo polar como acento, pies de foto con lugar y fecha, días como notas de campo. Arreglé de paso un bug viejo que aplastaba la línea de tiempo.
- **Etapa 4 · Pesca:** página **Pesca** en el menú, bloque **Pesca hoy** en los días y permisos en **Gastos**. Dato clave: **para uruguayos hay un permiso de 10 días para países limítrofes a ARS 50.000 (≈ USD 32)** que vale en Neuquén, Río Negro y los Parques. Todo con el reglamento oficial 2026/27.
- **Etapa 5 · Montaña:** el 3D ahora va del Tronador al Catedral (47 × 31 km con detalle, antes 17 × 17) más un anillo de 168 × 149 km con bruma: **ya no se ve el borde** en ninguna pantalla. Textura horneada con sombras, nieve, bosque y lagos. Marcadores del Meiling (posición corregida, estaba 2,8 km corrida) y del Frey.

**Para mirar primero:** `docs/capturas/05-montana/antes/` contra `docs/capturas/05-montana/despues/`, y `docs/capturas/05-montana/paginas/` (todas las páginas en 390, 1280 y 2560, claro y oscuro).

**Preview de Vercel de `relato`:** no lo pude sacar desde acá (no tengo acceso a Vercel ni a los deployments de GitHub en esta sesión). Está en Vercel → proyecto → Deployments → filtro por rama `relato`, o en GitHub en el último commit de `relato` → ícono de Vercel → "Details". Suele tener la forma `https://<proyecto>-git-relato-<cuenta>.vercel.app`.


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

Además, el texto del pantallazo, los km, las noches en refugio y la fecha del marcador del Meiling ahora salen de los datos de la versión elegida (`renderIntro()`), así no quedan desactualizados al cambiar de versión: nuevo ≈820 km (suma de `LEGS.b`) y 2 noches en refugio; original ≈650 km y 1.

No cambié precios, fechas, horarios, reservas ni la lista de actividades (`a`) ni los datos (`st`). Solo títulos de apoyo, bajadas (`s`) y descripciones (`lead`).

| Dónde | Antes | Después |
|---|---|---|
| Portada · bajada | 8 amigos, 14 noches, del Lácar al Tronador. | 27/12/2026 → 10/1/2027 · 8 personas · 14 noches · de San Martín de los Andes a Bariloche |
| Portada · llamado | Bajá para volar ↓ | (se saca) |
| Pantallazo · antetítulo | El viaje en un pantallazo | Resumen del viaje |
| Pantallazo · título | Del Lácar al Tronador | 27/12 → 10/1 |
| Pantallazo · texto | Ocho amigos, dos autos y catorce noches. Una tarde en Buenos Aires, aterrizaje en Chapelco y la Ruta de los 7 Lagos hacia el sur: Año Nuevo frente al Falkner, carpa en Traful, las agujas del Frey, La Angostura, una noche a 2.000 metros en el Otto Meiling y el cierre en Bariloche, con rafting en el Manso. | Barco a Buenos Aires el 27/12, vuelo a Chapelco el 28/12 y dos autos hasta el 10/1. Itinerario nuevo: Buenos Aires (1 noche), San Martín (2 noches), … Bariloche (4 noches). (Se arma solo con las bases de la versión elegida.) |
| Pantallazo · dato | ≈820 km de ruta en auto | ≈820 km en auto (trayectos del itinerario) |
| Pantallazo · dato | 2 refugios de montaña | 2 noches en refugio |
| Pantallazo · dato | por persona, lo cargado | por persona, gastos con precio |
| Botón original | Itinerario original El plan con el que arrancamos. | Itinerario original Sin Frey. 3 noches en La Angostura, Meiling el 6/1, Bariloche del 7 al 10/1. |
| Botón nuevo | Itinerario nuevo Con el Frey y plan B para el Meiling. Acá van los próximos cambios hasta cerrar todo. | Itinerario nuevo Frey el 3/1, Meiling el 5/1 si hay clima, Bariloche del 6 al 10/1 (coincide con las reservas). |
| Menú · Portada | Portada El Tronador y el viaje en un pantallazo | Portada Resumen y versión del itinerario |
| Menú · Itinerario | Itinerario Día por día, con casas y trayectos | Itinerario 27/12 al 10/1, día por día |
| Menú · Casas | Casas Confirmadas y opciones | Casas San Martín y Bariloche confirmadas |
| Menú · Autos | Autos 2 Citroën Basalt, Hertz | Autos 2 Citroën Basalt · Hertz · 28/12 al 10/1 |
| Menú · Gastos | Gastos Total y por persona | Gastos Total y por persona, en USD |
| Selector de versión | Nuevo (propuesta) | Nuevo |
| 27/12 · bajada | Barco, valijas en el Airbnb y una birra | Barco desde Montevideo y noche corta cerca del puerto |
| 27/12 · texto | Cruzan de mañana desde Montevideo, dejan las valijas en un Airbnb cerca del puerto y aprovechan el día. Es domingo, así que está la feria de San Telmo. Cena y cerveza temprano, unas horas de sueño y a las 4 salen para Ezeiza. | Barco Montevideo → Buenos Aires a la mañana y valijas en un Airbnb cerca del puerto (a reservar). Es domingo: feria de San Telmo. Salida a Ezeiza a las 4:00. |
| 28/12 · bajada | Llegada, compras, primer atardecer | Llegada a Chapelco 9:09, autos, súper y casa desde las 15 |
| 28/12 · texto | Aterrizan en Chapelco a las 9:09, retiran los autos y hacen las compras grandes. La casa se entrega a las 15 h y la tarde queda para conocer el pueblo y el Lácar. | Aterrizaje en Chapelco a las 9:09, retiro de los autos y compras grandes. La casa se entrega a las 15:00; a la tarde, Mirador Bandurrias y Playa Catritre. |
| 29/12 · bajada | Agua turquesa, ripio y pozones | Playa Yuco (30 km de ripio) y Pozones del Caleufú |
| 29/12 · texto | Día de agua. Yuco a la mañana temprano, porque el estacionamiento se llena, y a la tarde los pozones del Caleufú, ollas turquesa en un cañón de piedra. | Yuco a primera hora, porque el estacionamiento se llena. A la tarde, Pozones del Caleufú por la RP 63. Unas 4 h de manejo en el día. |
| 30/12 · bajada | Paradas libres y a elegir parcela | 47 km por la Ruta de los 7 Lagos al Camping Lago Falkner |
| 30/12 · texto | Solo 47 km, pero con paradas. Llegan al Camping Lago Falkner con tiempo para conseguir dos parcelas juntas con vista al lago. | 47 km con paradas en miradores y lagos. Llegar temprano al Camping Lago Falkner para conseguir dos parcelas juntas. |
| 31/12 · bajada | Cerro Falkner y fogón | Cerro Falkner (opcional) y Año Nuevo en el camping |
| 31/12 · texto | El primer desafío del viaje: el Cerro Falkner, de día completo. El que prefiera algo tranquilo camina la costa del Villarino y el Escondido. A la noche, fogón frente al lago. | Cerro Falkner para el que quiera: día completo, difícil. El resto, costa del Villarino y el Escondido. Año Nuevo en el camping. |
| 1/1 · bajada | Camping Paloma Araucana | ≈75 km a Villa Traful, Camping Paloma Araucana |
| 1/1 · texto | Traslado por la RN 40 y la RP 65 hasta Villa Traful. Camping Paloma Araucana, bajo el mirador, con fogón y luz en cada parcela. | Traslado por la RN 40 y la RP 65 (≈1 h 30). Camping Paloma Araucana, con fogón y luz en cada parcela. En Villa Traful hay una sola estación de servicio. |
| 2/1 · bajada | Kayak, cascadas y pesca | Kayak al bosque sumergido, cascadas y pesca |
| 2/1 · texto | Kayak hasta el bosque sumergido, cipreses que asoman del agua. A la tarde, las cascadas Coa Có y Co Lochi. El Traful es famoso por el salmón encerrado. | Kayak a la mañana, antes de que suba el viento, hasta el bosque sumergido. A la tarde, cascadas Coa Có y Co Lochi; al atardecer, pesca desde la costa. |
| 3/1 (original) · texto | Llegan a la casa después de cuatro noches de carpa. A la tarde, el mirador Belvedere con la cascada Inacayal, y al atardecer, pesca en el río Correntoso, uno de los más cortos del mundo. | 65 km de Traful a la casa de La Angostura. A la tarde, mirador Belvedere y cascada Inacayal (≈3 h, fácil); al atardecer, pesca en la desembocadura del Correntoso. |
| 4/1 (original) · bajada | Primer gran desnivel | Filo del Cerro Belvedere, ≈800 m de desnivel |
| 4/1 (original) · texto | El trekking más exigente de La Angostura: unas 3 h de subida hasta el filo, a 1.600 m, sobre basalto. Vista del Correntoso y el Nahuel Huapi a la vez. | ≈3 h de subida hasta el filo (1.600 m) por sendero marcado en rojo. Bajada y tarde en el Lago Espejo. |
| 5/1 (original) · bajada | Día tranquilo antes del Meiling | Kayak, Bosque de Arrayanes y mochilas para el Meiling |
| 5/1 (original) · texto | Kayak a la mañana y el Bosque de Arrayanes, único en el mundo, con la vuelta en barco. A la noche, mochilas armadas y a dormir temprano. | Kayak a la mañana en el Nahuel Huapi. Bosque de Arrayanes (12 km de ida, vuelta en barco). A la noche, mochilas listas para el Meiling. |
| 6/1 (original) · bajada | Noche al borde del glaciar | 13 km de subida y noche en el refugio, ≈2.000 m |
| 6/1 (original) · texto | El gran desafío. Salen de La Angostura a las 8:30, entran al camino de Pampa Linda a las 10:30 y suben 13 km hasta el refugio, entre los glaciares Castaño Overa y Alerce. | Salida de La Angostura 8:30; el camino a Pampa Linda abre para subir a las 10:30. Desde Pampa Linda, 13 km y 1.050 m de desnivel hasta el refugio, entre los glaciares Castaño Overa y Alerce. |
| 7/1 (original) · bajada | Bajada, glaciar negro y Blest | Bajada, Ventisquero Negro y llegada a Bariloche |
| 7/1 (original) · texto | Bajan a la mañana y, como del camino no se sale antes de las 16, pasan el mediodía en el Ventisquero Negro y la Garganta del Diablo. Llegan a la casa de Bariloche y cierran con cerveza en Blest. | Bajada a la mañana (≈3 h). Del camino de Pampa Linda no se sale antes de las 16, así que el mediodía queda para el Ventisquero Negro y la Garganta del Diablo. Casa de Bariloche ≈19:00 y Cervecería Blest a las 20:30. |
| 8/1 · bajada | Clase IV hasta Chile + Patagonia | Rafting en el Manso (clase IV) y atardecer en el Lago Moreno |
| 8/1 · texto | Rafting Manso a la Frontera: rápidos de clase IV hasta el límite con Chile, sin experiencia previa. A la noche, Cervecería Patagonia frente al Lago Moreno para el atardecer. | Rafting Manso a la Frontera: ≈2 h de rápidos clase IV hasta el límite con Chile, sin experiencia previa. A las 19:30, Cervecería Patagonia (km 24,7) frente al Lago Moreno. |
| Filo de las Cabras · bajada | Último día: montaña y bici | Filo de las Cabras (Cerro López) y Circuito Chico en bici |
| Filo de las Cabras · texto | A la mañana, el Filo de las Cabras en el Cerro López, con el Nahuel Huapi abajo. A la tarde, el Circuito Chico en bici por Llao Llao y Bahía López. | A la mañana, Filo de las Cabras desde el arroyo López (5–6 h). Almuerzo en Colonia Suiza y, a la tarde, Circuito Chico en bici por Llao Llao y Bahía López (≈4 h). |
| Filo de las Cabras (nuevo) · bajada | cp(13,{d:"7/1",w:"Jue",s:"Montaña y bici"}) | cp(13,{d:"7/1",w:"Jue"}) |
| 10/1 · texto | Salen de Bariloche a las 6:30 por la ruta de la estepa, unos 240 km, para llegar a Chapelco a las 10 con margen para devolver los autos. | Salida de Bariloche 6:30 por la RN 237 y la RN 40 (≈240 km). Llegada a Chapelco ≈10:00, devolución de autos y vuelo a las 13:50. |
| 3/1 (nuevo) · texto | Salen temprano de Traful hacia Villa Catedral (≈2 h 30 de manejo) y suben al Refugio Frey: unos 10 km y 750 m de desnivel por el bosque, con vista al Lago Gutiérrez, hasta la laguna Toncek rodeada de agujas de granito. Noche en carpa junto al refugio; los autos quedan en el estacionamiento de Catedral. | Salida temprano de Traful a Villa Catedral (≈2 h 30 de manejo). Sendero al Refugio Frey: ≈10 km y 750 m de desnivel hasta la laguna Toncek. Noche en carpa junto al refugio; los autos quedan en el estacionamiento de Catedral. |
| 4/1 (nuevo) · texto | Bajan del Frey a la mañana (≈3 h), buscan los autos y siguen a La Angostura (≈2 h). Casa, ducha y almuerzo; a la tarde, el mirador Belvedere con la cascada Inacayal, y al atardecer, pesca en el Correntoso. A la noche miran el pronóstico y deciden el Meiling. | Bajada del Frey (≈3 h), autos en Catedral y 102 km a La Angostura. A la tarde, mirador Belvedere y cascada Inacayal; al atardecer, pesca en el Correntoso. A la noche se decide el Meiling según el pronóstico. |
| 5/1 (nuevo) · texto | Si el pronóstico da bien: salen de La Angostura a las 8:30, entran al camino de Pampa Linda en la ventana de subida (10:30 a 14) y suben 13 km hasta el refugio, entre los glaciares Castaño Overa y Alerce. Duermen en carpa o adentro del refugio. Si da mal clima no se sube, y se elige uno de los planes B. | Si el pronóstico da bien: salida de La Angostura 8:30, camino a Pampa Linda en la ventana de subida (10:30 a 14) y 13 km hasta el refugio. Noche en carpa o adentro del refugio. Con mal clima no se sube y se elige un plan B. |
| 9/1 (nuevo) · texto | Con la casa hasta el 10 queda un día sin agenda: pesca en el Nahuel Huapi o el Gutiérrez, Playa Bonita, subir al Cerro Otto o descansar. Cena de despedida y a dormir temprano, que el 10 se sale a las 6:30. | Día sin agenda fija: pesca en el Nahuel Huapi o el Gutiérrez, Playa Bonita o Cerro Otto. A la noche, valijas: el 10/1 se sale a las 6:30. |


## Etapa 2 · Investigación de estética

En `docs/investigacion-estetica.md`. Resumen: los catálogos de los 80 dejaron las fotos de estudio por "gente real haciendo cosas reales" (empleados, amigos, clientes), con grano y poca pose; la tapa es una foto grande con la marca chica; el texto es ensayo y nota de campo; los colores de película (Kodachrome: rojos fuertes, contraste alto, sombras profundas; impresión vieja: velo cálido). Paleta sacada de tu foto (rojo polar, verde abeto, oliva, caqui, cielo, crema) y ajustada a contraste AA. Tipografías libres: Fraunces (inspirada en Windsor, Souvenir y Cooper), Atkinson Hyperlegible y IBM Plex Mono.

## Etapa 3 · Aplicar la estética

- Tokens nuevos en `:root` (claro y oscuro); los nombres viejos apuntan a los nuevos, así nada del código de casas, autos o gastos se rompe.
- Portada como tapa de catálogo: borde de papel alrededor de la escena 3D, título simple, **banda de datos** abajo (fechas, personas, noches, ruta), estilo folleto de parque.
- Pantallazo: fecha grande, texto de relato en serif, banda verde con los 4 datos, mosaico como fotos impresas con pie (fecha y lugar) debajo.
- Menú: lista numerada (01–05), pies en monoespaciada.
- Itinerario: cada día como nota de campo (hora en rojo a la izquierda, renglones punteados), foto con borde de papel y **pie con lugar, fecha y crédito** (por ejemplo "Villa Traful · Vie 1/1/2027 · Foto: Unsplash").
- Película: `filter` en las fotos del viaje (contraste 0,94 para levantar negros, saturación 1,16, sepia 0,09) y grano estático de papel con un SVG de 180 px fijo en toda la página (opacidad 7 % en claro, 9 % en oscuro). Las fotos de las casas y los autos quedan sin filtro para no alterar cómo se ven los anuncios.
- Arreglos de paso: (1) el estilo `.pin` de la portada pisaba los puntitos de la línea de tiempo y dejaba los títulos de los días en una columna de 20 px; (2) las etiquetas de colores (Confirmada, Casa, Refugio…) tenían texto blanco sobre colores claros en modo oscuro; ahora usan `--on-polar` y pasan AA; (3) etiqueta de Airbnb con rojo más oscuro (#b0303f) para que el texto blanco pase AA.
- Revisión automática (`tools/revisar.cjs`): sin errores de JS y sin scroll horizontal en todas las páginas, 390 y 1280 px, claro y oscuro.
- Capturas en `docs/capturas/03-estetica/` (incluida la portada con movimiento reducido).

## Etapa 4 · Pesca

Investigación completa con fuentes en `docs/investigacion-pesca.md`. Lo principal:

- **Reglamento oficial 2026/27** (común a Neuquén, Río Negro, Chubut y Parques Nacionales): temporada del 1/11/2026 al 1/5/2027, solo de día, señuelo artificial con un anzuelo, devolución obligatoria en ríos y arroyos, salmón encerrado siempre se devuelve, prohibidas las suelas de fieltro, equipo de afuera nuevo o desinfectado. En Parques solo se pesca en los ambientes del listado.
- **Permiso para uruguayos:** existe la categoría **no residente de país limítrofe, 10 días: ARS 50.000** (≈ USD 32 con el dólar billete venta BNA del 17/11/2026). Un solo permiso vale en Neuquén, Río Negro y Parques. Propuesta: del 31/12 al 9/1.
- **Lugares en nuestros días:** Lácar (28-29/12), Falkner y río Villarino (30-31/12), Lago Traful (1-2/1), Correntoso (solo mosca, permiso adicional) y Nahuel Huapi (3 o 4/1), Espejo (4/1 en el original), Bariloche el 9/1 (lagos, trolling guiado o Limay solo mosca). En la laguna Toncek (Frey) y en el Manso superior (Pampa Linda) **no se pesca**.
- **Guías:** Southern Rivers (Limay) USD 410 por bote de 1-2; Natural Travel (trolling en Bahía López, hasta 4 por bote) sin tarifa publicada; el resto, a confirmar.
- **Web:** página **Pesca** en el menú (permiso, reglas, lugares en orden de viaje, guías, equipo, fuentes); bloque **Pesca hoy** en 12 días del itinerario (abajo del trayecto, sin tocar las actividades), incluidos los avisos de dónde no se puede; fila de **permisos de pesca** en Gastos: 8 × ARS 50.000 = ≈ USD 254.
- Capturas en `docs/capturas/04-pesca/` (incluye `dia-pesca-*`, el día 1/1 con el bloque).

## Etapa 5 · Montaña más grande y con más definición

### Opciones evaluadas

| | A. three.js mejorado (datos propios + textura horneada) | B. Render previo del recorrido (video o secuencia de imágenes) | C. Híbrido (video de fondo + 3D liviano encima) |
|---|---|---|---|
| Definición | Alta: color y luz horneados a ~23 m/píxel (escritorio) sobre relieve de ~73 m | Máxima (render offline) | Alta |
| Borde del terreno | Se resuelve con anillo exterior de 170 × 150 km + bruma + recorrido acotado | No existe | Depende del 3D |
| Cualquier relación de aspecto | Sí (se renderiza al tamaño real) | No: el video se recorta o deja bandas en 21:9 y en vertical | Igual que B |
| Ida y vuelta con el scroll | Natural | Hay que hacer "scrub" de video, que en iOS/Android es entrecortado si no son keyframes todos | Igual que B |
| Peso | ≈ 1,35 MB escritorio / ≈ 0,6 MB celular (alturas + texturas), una sola vez y en segundo plano | 5–20 MB de video para que no se vea comprimido | Suma de ambos |
| Marcadores que siguen al terreno | Sí, con oclusión | Habría que animarlos a mano | Sí |
| Herramientas necesarias acá | numpy/scipy (disponibles) | Blender o similar (no instalado en este entorno) | Ambas |
| Mantenimiento | Regenerar con `python3 tools/terreno.py` | Re-renderizar todo ante cualquier cambio | Lo peor de ambos |

**Elegí A.** Resuelve los dos problemas (borde y definición) en cualquier pantalla, pesa poco, mantiene el ida y vuelta fluido con el scroll y los marcadores, y no depende de herramientas que no hay en el entorno.

### Qué hice
- `tools/terreno.py`: baja tiles de AWS Terrain Tiles (z12 en la zona de detalle, ~29 m; z9 en el anillo), los reproyecta a una grilla lat/lon y **hornea una textura de color con luz**: sol de tarde del noroeste (27° de altura) con **sombras proyectadas** (marcha de rayos sobre el relieve), **oclusión ambiente**, **nieve y glaciar** según altura, pendiente y orientación (más baja en las caras al sur), **límite del bosque** irregular (~1.560 m), mallines en los fondos de valle, **lagos** detectados por zonas planas y bajas, y **estepa** hacia el este. Tono "película": negros levantados y cálidos, como en la etapa 3.
- `data/`: `terreno-cerca-alt.png` (alturas 768 × 507; `-m` de 384 × 253 para el celular), `terreno-lejos-alt.png` (256 × 228), `terreno-cerca.jpg` (2048 × 1360, escritorio), `terreno-cerca-m.jpg` (1024 × 680, celular), `terreno-lejos.jpg` (1024 × 912), `terreno.json`. La portada ya no depende de AWS en vivo.
- **Zona modelada:** del Tronador (con parte del lado chileno) al Cerro Catedral y el Refugio Frey, de norte a sur hasta el Lago Mascardi: **47 × 31 km** con detalle (antes 17 × 17). Anillo exterior de **168 × 149 km** (se ven de lejos el Osorno y los cordones de Chile) que se funde con la bruma.
- `js/hero.js` reescrito: **una sola malla** de densidad variable (640 × 422 en la zona de detalle en escritorio, 300 × 198 en el celular, y 40/28 filas cada vez más ralas hacia afuera), sin costuras. Shader propio: textura de detalle o de lejos según dónde cae el punto, **perspectiva aérea** (bruma con la distancia) y el borde exterior siempre 100 % bruma. **Cúpula de cielo** con la paleta (cenit `#2a74a6`, medio `#79abc0`, horizonte = bruma `#d9d7c6`).
- **Recorrido del dron en datos** (`PATH`): sobre el Mascardi mirando al Tronador → encima de Pampa Linda → frente al Meiling y los glaciares → giro al este hacia el Catedral y el Frey. Curva Catmull-Rom; todas las posiciones de cámara quedan adentro de la zona de detalle y a más de 55 km del borde exterior, que la bruma tapa del todo antes. La cámara nunca baja de 400 m sobre el terreno. Suavizado por tiempo (igual en 30 o 120 fps).
- **Marcadores**: Refugio Otto Meiling y Refugio Frey (con la fecha de la noche según la versión), y etiquetas chicas de Cerro Tronador y Pampa Linda (ocultas en el celular). Se esconden si quedan detrás de una montaña o fuera de pantalla. **Corregí la posición del Meiling**: estaba ~2,8 km corrida; ahora usa la de OpenStreetMap.
- Se mantiene: ida y vuelta con el scroll, fallback con foto fija (sin WebGL2, movimiento reducido, Save-Data o poca memoria, o si algo falla), pausa fuera de pantalla y con la pestaña oculta, y el 3D arranca recién cuando el navegador queda libre (`requestIdleCallback`), así no frena el itinerario.
- Capturas: antes en `docs/capturas/05-montana/antes/`, después en `docs/capturas/05-montana/despues/` (inicio, mitad y final; 390, 1280 y 2560; claro y oscuro) y todas las páginas en `docs/capturas/05-montana/paginas/`.

### Límites conocidos
- La textura se proyecta desde arriba: en las caras muy empinadas, de cerca, se ve algo estirada.
- Las capturas usan render por software (SwiftShader); no pude medir fps en un celular real. Presupuesto: ~360 mil vértices en escritorio, ~70 mil en el celular, dos texturas.
- La detección de lagos es automática: el Nahuel Huapi y el Mascardi salen bien; algún lago chico puede faltar.

## Decisiones tomadas y por qué

1. **Checkpoints como ramas**, no tags: el proxy de este entorno corta el push de tags. Mismo nombre que pedía el tag.
2. **Sin las skills `frontend-design`, `threejs` y `gsap-scrolltrigger`**: no están instaladas en esta sesión. Seguí sus criterios a mano. No usé GSAP: el scroll ya movía bien la cámara con un solo loop de three.js; sumarlo era peso sin beneficio.
3. **Etapa 1:** no toqué la lista de actividades (`a`) ni los datos (`st`), solo títulos, bajadas y descripciones; así no cambia ningún horario, precio ni reserva.
4. **Tipografía:** Fraunces para títulos (inspirada en Windsor, Souvenir y Cooper, la familia de los 70) y no una parecida al logo de ninguna marca; Atkinson para datos (legibilidad en el celular); IBM Plex Mono para pies de foto (máquina de escribir).
5. **Filtro de película solo en las fotos del viaje**, no en las de casas y autos, para no alterar cómo se ven los anuncios.
6. **Pesca:** propuse el permiso del 31/12 al 9/1 porque cubre la mayor cantidad de días con pesca posible (Falkner, Traful, La Angostura y el día libre en Bariloche) con un solo permiso. La fila de Gastos suma los 8 permisos (≈ USD 254) aunque no todos pesquen: lo podés sacar si no.
7. **Montaña: opción A** (three.js con datos propios y textura horneada) en vez de render previo o híbrido: ver tabla en la etapa 5.
8. **Textura del terreno pintada (procedural) y no satelital:** las satelitales libres con licencia compatible son de baja resolución o con licencia no comercial, y el color pintado respeta la paleta de la etapa 3. Queda anotado como opción.
9. **Coordenadas de los refugios** de OpenStreetMap (Nominatim); atribución agregada.
10. El 3D arranca cuando el navegador queda libre (`requestIdleCallback`) en vez de en cuanto carga el script, para que el itinerario sea usable antes.
11. Al terminar la etapa 5 subí un ajuste chico (alturas para el celular) y actualicé la rama `checkpoint/06-montana-lista` para que lo incluya (era un avance directo, no se perdió nada).

## Checkpoints y cómo volver

Todos son ramas en GitHub. Para **probar** uno sin tocar nada: `git switch -c prueba-X origin/checkpoint/NN-...` o abrir su preview en Vercel. Para **volver** `relato` a uno: pedímelo nombrando el checkpoint; lo hago con un commit nuevo (`git checkout origin/checkpoint/NN-... -- .` + commit), sin `reset --hard` ni force push.

| Checkpoint | Qué tiene |
|---|---|
| `checkpoint/01-antes-orden` | `relato` como estaba al empezar la noche (78273c5). |
| `checkpoint/01-orden-lista` · `02-antes-contenido` | Etapa 0 (CLAUDE.md, resumen de etapas). Web igual. |
| `checkpoint/02-contenido-lista` · `03-antes-estetica` | Etapa 1: textos concretos. |
| `checkpoint/03-investigacion-estetica-lista` · `04-antes-aplicar-estetica` | Etapa 2: investigación (web igual que la etapa 1). |
| `checkpoint/04-aplicar-estetica-lista` · `05-antes-pesca` | Etapa 3: estética nueva. |
| `checkpoint/05-pesca-lista` · `06-antes-montana` | Etapa 4: pesca. |
| `checkpoint/06-montana-lista` | Etapa 5: montaña nueva (estado final). |

## Pendiente o dudoso (para que decidas)

1. **Casa de La Angostura:** "Las casas elegidas" (página Casas) y la combinación "La del grupo" siguen con **Cuncumen**, pero el itinerario nuevo y Gastos usan **Posta de los Colonos** como primera opción. No lo cambié porque es una decisión de reserva.
2. **Permiso de pesca:** confirmar al comprar si la categoría limítrofe pide nacionalidad o residencia, qué documento acepta, si se elige la fecha de inicio y si toma tarjeta uruguaya. ¿Lo dejamos en Gastos para los 8 o solo para los que pesquen?
3. **Salida de pesca guiada el 9/1:** ¿trolling en el Nahuel Huapi con dos botes de 4? Hay que pedir precio a Natural Travel (no lo publica).
4. **Fogón en el Falkner y en Traful:** el texto del día lo menciona (estaba en los datos); en Parques Nacionales el fuego depende del índice de peligro del día. A confirmar con el camping.
5. **Altura del Refugio Frey (≈1.700 m)** sale de una fuente turística, no oficial.
6. **Rendimiento del 3D en un celular real:** las capturas son con render por software; conviene abrir el preview en un celular de gama media y ver si va fluido.
7. **Capturas en el repo:** las pasé de PNG a JPEG (calidad 82) al final: la carpeta bajó de 205 MB a 28 MB, pero los PNG quedan en el historial de `relato`. Agregué `.vercelignore` para que `docs/` y `tools/` no se suban a Vercel. Si al mergear a `main` querés un historial liviano, conviene un merge con squash.

## Para revisión

**Commit de inicio:** `78273c5` (Portada 3D: niebla y luz de atardecer ajustadas). **Último commit de código:** `a654d74` (alturas para el celular); después solo este informe y `CHECKPOINTS.md`.

### Archivos cambiados por etapa (sin contar capturas)
- **Etapa 0:** `CLAUDE.md`, `CHECKPOINTS.md`, `docs/prompts-claude-code.md`, `docs/informe-noche.md`, `tools/capturas.cjs`.
- **Etapa 1:** `index.html` (textos; `renderIntro()`), `docs/informe-noche.md`, `CHECKPOINTS.md`.
- **Etapa 2:** `docs/investigacion-estetica.md`, `CHECKPOINTS.md`.
- **Etapa 3:** `index.html` (tokens, fuentes, CSS de catálogo, banda de la portada, pie de foto, arreglo `.pin`), `CLAUDE.md`, `tools/revisar.cjs`.
- **Etapa 4:** `index.html` (página `#view-pesca`, `PZ`, `SPOTS`, `GUIDES`, `renderFish`, `renderPesca`, fila en `renderGastos`), `docs/investigacion-pesca.md`, `tools/capturas.cjs`, `CLAUDE.md`.
- **Etapa 5:** `js/hero.js` (reescrito), `tools/terreno.py` (nuevo), `data/*` (nuevo), `index.html` (marcadores, créditos, fecha del Frey), `tools/capturas-montana.cjs`, `.gitignore`.

### De dónde sale cada dato nuevo
- **≈820 / ≈650 km** del pantallazo: suma de `km` de `LEGS.b` / `LEGS.a` (Google Maps, ya estaban), redondeada a 10.
- **Noches en refugio:** cantidad de días con `k:"ref"` en la versión elegida.
- **Permiso ARS 50.000 (E-L10):** art. 3 del Reglamento de Pesca Continental Patagónico 2026/27 ([PDF](https://chubutstorage.s3.amazonaws.com/Pesca/Reglamento%20PDCP%202026-27%20Baja.pdf)) y [permisosdepesca.com.ar](https://www.permisosdepesca.com.ar/). **USD 32** = 50.000 / 1.575 (dólar billete venta [Banco Nación](https://www.bna.com.ar/Personas) del 17/11/2026). **USD 254 en Gastos** = 8 × 50.000 / 1.575, redondeado.
- **Reglas por lugar** (cupos, solo mosca, devoluciones, fechas): anexos de Parques Nacionales, Neuquén y Río Negro del mismo reglamento (páginas en `docs/investigacion-pesca.md`).
- **Guía del Limay USD 410:** [Southern Rivers Patagonia](https://southernriverspatagonia.com/daily-trips.html). **Tangol desde USD 362:** buscador, a confirmar.
- **Relieve:** AWS Terrain Tiles (SRTM, GMTED2010 y otros), procesado con `tools/terreno.py`. **Posiciones** de Meiling, Frey, Pampa Linda y Mascardi: OpenStreetMap (Nominatim, 18/11/2026). **Cumbre del Tronador:** 41° 9′ 32″ S, 71° 53′ 29″ O ([Cultura de Montaña](https://revistadigital.culturademontania.org.ar/articulo/64710c4448e287641e940986)).
- **Paleta:** muestreo de colores de tu foto de referencia (no se subió al repo) + ajuste a contraste AA (cálculo WCAG en el informe de estética).

### Preguntas abiertas que necesitan decisión tuya
1. ¿Cuncumen o Posta de los Colonos en "Las casas elegidas"?
2. ¿Permisos de pesca para los 8 o solo para algunos? ¿Fechas 31/12 → 9/1?
3. ¿Reservamos una salida de trolling el 9/1?
4. ¿Te gusta el título "Patagonia 2027" en serif grande en la portada, o preferís otro nombre para el viaje para alejarse más de la marca?
5. ¿Mergeamos `relato` a `main` después de verlo en el preview? (no lo hice)

## Correcciones del 18/11

1. **Mosaico del pantallazo:** cada foto tiene su punto de foco (`object-position`) para que se vea el lugar (el Tronador ya no queda en cielo). La de San Martín se pide a Unsplash con recorte por punto focal y zoom (`crop=focalpoint&fp-y=.76&fp-z=1.9`): ahora muestra el Lácar, la playa, el muelle y el pueblo. No hizo falta reemplazar ninguna foto.
2. **Crédito del relieve:** pasó al borde de papel, en una línea chica debajo de la banda de datos, en todas las resoluciones (texto más corto: "Relieve: AWS Terrain Tiles (SRTM) · Lugares: © OpenStreetMap").
3. **Botón de menú en el celular (≤ 820 px):** ahora es solo el ícono (40 × 40, con "Menú" para lectores de pantalla), se esconde al bajar y vuelve al subir; reaparece si recibe foco con el teclado. Respeta movimiento reducido. En escritorio no cambió.
4. **Pesca en Gastos:** los permisos figuran como **Opcional** y no se suman: el total por persona y el dato de la portada volvieron a **USD 493**.
5. **Decisiones (casa de La Angostura y título de la portada):** el pedido llegó con las opciones sin completar ("[Posta de los Colonos / Cuncumen]" y "[queda / cambialo por ____]"), así que **no cambié nada**: "Las casas elegidas" y "La del grupo" siguen con Cuncumen y el título sigue "Patagonia 2027". Decime cuál y lo hago.
6. De paso: las etiquetas chicas de la portada (Cerro Tronador, Pampa Linda) se veían vacías en modo oscuro (texto claro sobre fondo claro, error de la etapa 5); arreglado. Además aparecen recién cuando se desvanece el título, para no quedar detrás.

Capturas (JPEG, 390 × 844 y 1280 × 800) en `docs/capturas/06-correcciones/`.

## Título de la portada (tipografía de afiche de los 70)

El título sigue siendo "Patagonia 2027". Probé cinco opciones, todas tipografías reales con licencia libre (OFL) de Google Fonts, sin letras dibujadas ni nada que copie el lettering de ninguna marca. Capturas en `docs/capturas/07-titulo/` (`portada-<opción>-390x844.jpg` y `-1280x800.jpg`).

| Opción | Qué es | Resultado |
|---|---|---|
| a. Actual | Fraunces 600, SOFT 100 | Elegante pero liviana: no tiene el peso de afiche. |
| b. Fraunces 900, SOFT 100, WONK 1, opsz 144, interletra −0,045 em | La misma familia al máximo. Fraunces está inspirada en Windsor, Souvenir y la serie Cooper ([repo](https://github.com/undercasetype/Fraunces)) | Gorda y blanda; las "n" y "h" inclinadas le dan gracia, pero con el interletrado apretado queda algo angosta y filosa. |
| **c. Caprasimo**, interletra −0,035 em | Sustituto métrico de **Cooper Black** hecho a partir de Fraunces por el proyecto DocRepair ([descripción en google/fonts](https://github.com/google/fonts/blob/main/ofl/caprasimo/DESCRIPTION.en_us.html)) | **La más gorda, redonda y cálida**: es la vibra de afiche y catálogo de los 70. |
| d. Corben 700 | Display de curvas amplias | Pesada pero más ancha y con aire de slab; menos blanda. |
| e. Young Serif | Serif antigua "tierna", inspirada en Plantin Infant | Le falta peso para el efecto pedido. |

**Elegí Caprasimo.** Es la que más se acerca a Cooper Black (la tipografía que más se asocia a la gráfica de los 70) sin imitar ningún logo. Además, como sale de Fraunces, convive bien con el resto de los títulos. Suma una sola fuente de unos 40 KB (o menos en woff2) y entra en el mismo pedido a Google Fonts.

**Dónde se aplicó:** título de la portada, título del resumen ("27/12 → 10/1") y títulos grandes de secciones (Gastos, Pesca, "Las casas elegidas", "Dos Citroën Basalt", "Combinaciones…", "Lugares, en orden de viaje"…). Los títulos de cada día, los números de los datos y todos los textos de lectura siguen en Fraunces, Atkinson y Plex Mono. En el resumen, la flecha "→" la dibuja Fraunces (Caprasimo no la trae) y queda un poco más fina: es un detalle a revisar si molesta.

La casa de La Angostura sigue como estaba (sin decidir).

## Alta resolución, cámara suave, pie de página y colores de época (18/11)

**1. Montaña en alta resolución**
- **DEM:** la zona de detalle ahora usa **Copernicus DEM GLO-30** (30 m, TanDEM-X; más nítido que SRTM) y su **máscara de agua** (lagos y ríos reales). Zoom 13-14 de Terrain Tiles no suma información en esta zona: por debajo hay SRTM de 30 m reescalado. La zona se agrandó al este para que el Catedral entre entero: 52 × 33 km (−41,08 a −41,38; −71,98 a −71,36). El anillo exterior sigue con Terrain Tiles z9, liviano.
- **Texturas:** albedo y **normal map de 4096 × 2624** (≈ 12 m por píxel) en escritorio, 2048 en el celular. El normal map lleva la sombra proyectada en el canal azul y la luz se calcula por píxel. Para que se marquen filos y canaletas por debajo de los 30 m del DEM, las normales suman un **microrrelieve sintético** suave (más fuerte en la roca empinada). Es detalle visual, no dato real.
- **Geometría:** la zona de detalle está en bloques (64 × 64 celdas en escritorio, a la resolución nativa del DEM) con **LOD por distancia** (paso 1, 2, 4 u 8) y faldones de 400 m para que no queden grietas. El anillo se hunde 300 m adentro de la zona de detalle, así la costura no deja huecos.
- **Carga progresiva:** primero una versión liviana (alturas 384, texturas 1024: **0,79 MB**) que aparece rápido; después la alta. Las alturas se funden en 1,4 s y los marcadores y el margen de la cámara se acomodan sin saltos.
- **Peso total:** escritorio **6,3 MB**; celular **2,34 MB**, más three.js (0,17 MB comprimido) ≈ 2,5 MB. Ambos dentro del presupuesto.
- **Rendimiento:** no pude medir fps en un celular real (las capturas usan render por software). En el celular dibuja ~380 mil vértices con LOD, texturas de 2048 y anisotropía 4. Conviene probarlo en el preview.

**2. Cámara**
- Spline Catmull-Rom centrípeta recorrida **por longitud de arco** (velocidad constante), con un perfil de velocidad que **acelera en el primer 14 % y frena en el último 14 %**. La mirada usa los mismos tramos, así el giro es continuo.
- El seguimiento del scroll es un **resorte con amortiguación crítica, por tiempo** (igual en 30 o 120 fps). La portada pasó de 260 a **460 vh**: más scroll para el mismo tramo.
- El margen sobre el terreno se calcula antes, sobre todo el recorrido, y se suaviza: no hay saltos de altura. Al subir, la cámara vuelve por la misma curva.
- **Recorrido:** sobre Pampa Linda frente al Tronador y el Meiling → glaciares → giro por el norte → cruce al este → **cierre en el Cerro Catedral con el Refugio Frey**. El punto final lo elegí calculando la línea de vista sobre el DEM. La cámara llega al cierre en el 92 % del scroll y se queda quieta hasta que la portada se funde con la página.
- Las etiquetas de los marcadores ya no se salen de la pantalla. Revisé el inicio, el 25 %, la mitad, el 75 % y el final en 390, 1280 y 2560 px: no se ve el borde del terreno.

**3. Pie de página:** "Ing. Lippert · 2026", fecha de actualización del itinerario (sale de `ITIN_ACT` en `index.html`; hoy 18/11/2026), links a Itinerario, Casas, Autos, Gastos y Pesca, "Volver arriba" y créditos (fotos, relieve con la atribución de Copernicus, OpenStreetMap, Google Maps). Saqué la nota de créditos vieja del itinerario, que quedaba repetida.

**4. Colores de época:** French red, cobalt, teal, aloe, seafoam e iced mocha (fuente oficial: historia de la empresa), más mostaza. Los apliqué en bandas por sección (Itinerario cobalto, Casas rojo, Autos mostaza, Gastos teal, Pesca espuma de mar), en los parches de datos del resumen y de Gastos, la banda de la portada, el botón del itinerario nuevo, el pie y las etiquetas del itinerario. Todo pasa AA en claro y oscuro (tabla en `docs/investigacion-estetica.md`, "Paleta 2"). Sin logo ni franjas.

Capturas en `docs/capturas/08-alta-resolucion/`: la portada al inicio, a la mitad y al final del recorrido (el final está tomado en el 94 % del scroll, con la cámara ya quieta en el cierre), el resumen y el pie, en 390, 1280 y 2560 px.

## Paleta del logo, mapa de la Patagonia, portada realista y senderos (18/11)

**1. Paleta.** Saqué por conteo de píxeles los colores de la imagen de referencia: violeta `#4d0074`, azul rey `#003da2`, rojo `#e10d0c`, negro `#0d0709` y blanco. Sumé solo dos neutros, crema y gris, para lectura. La imagen no está en el repo ni publicada. Dónde va cada color:
- **Bloques por sección:** Itinerario azul, Casas rojo, Autos violeta, Gastos azul, Pesca violeta.
- **Parches de datos:** rojo, azul, violeta y negro.
- **Pie:** violeta con filete rojo.
- **Banda de la portada:** negra.

El rojo con texto blanco da 4,92 (AA). Como texto chico sobre crema o negro no pasa AA, así que ahí no lo uso. Tabla completa en `docs/investigacion-estetica.md` ("Paleta 3"). Sin franjas, sin silueta de montaña y con el cielo del 3D en un degradé natural. Los títulos siguen en Caprasimo.

**2. Mapa de la Patagonia.** Dos SVG propios en el resumen, generados con `tools/mapa.py`:
- **Ubicación:** sur de Argentina y Chile, con la Patagonia en violeta (Neuquén, Río Negro, Chubut, Santa Cruz y Tierra del Fuego; Los Lagos, Aysén y Magallanes), el vuelo Buenos Aires → Chapelco y la caja de la zona del viaje.
- **Detalle de la ruta:** las 8 paradas numeradas en el orden del itinerario nuevo y la vuelta a Chapelco. La línea es recta entre paradas, porque los km y tiempos reales están en cada día.

Se insertan en la página para usar sus fuentes, y en el celular van uno debajo del otro con letra de ≥ 12 px.

**3. Portada realista.**
- **Zona de detalle:** pasó a **67 × 42 km** (−41,00 a −41,38; −71,98 a −71,18), con Bariloche y el sur del Nahuel Huapi. Mantiene ≈ 13 m por píxel en escritorio (textura de 5120 × 3216).
- **Color del terreno:** elegí **ESA WorldCover 10 m** antes que Sentinel-2 cloudless. EOX hoy licencia sus mosaicos como CC BY-NC-SA (no comercial y con "compartir igual"), y además traen la luz y las sombras de la foto satelital, que chocan con las del 3D. Con WorldCover, el bosque, el pastizal, el suelo desnudo, lo urbano y la nieve están donde están, y la luz y los colores los controlo yo.
- **Agua y glaciares:** lagos y glaciares con las formas de OSM (22 lagos, 7 glaciares), ríos de la máscara de agua de Copernicus. El agua es plana, con reflejo del cielo según el ángulo y una ondulación mínima.
- **Marcadores:** San Carlos de Bariloche con el mismo estilo que los refugios ("casa del 6 al 10/1", según la versión).
- **Etiquetas de lagos:** aparecen solo cerca de la cámara, sin amontonarse (máximo 3 en el celular y 7 en escritorio) y después de que se desvanece el título. Se ubican en el punto del lago más alejado de la costa.
- **Peso:** escritorio ≈ 7,9 MB y celular ≈ 2,7 MB (+0,17 MB de three.js). El celular pasa un poco los 2,5 MB del pedido anterior porque la zona es 1,6 veces más grande. La primera carga liviana sigue en ≈ 0,9 MB.

**4. Senderos.** Pampa Linda → Refugio Otto Meiling y Villa Catedral → Refugio Frey, trazados sobre la red de senderos de OSM: es el camino más corto entre el inicio y el refugio, pasando solo por senderos y huellas. Overpass no respondía desde este entorno; usé la API oficial de OSM y Nominatim. Se dibujan con una línea punteada roja de ancho fijo en pantalla, apoyada sobre el relieve, y el tramo tapado por un cerro se ve más tenue. Medido sobre Copernicus:

| Sendero | OSM (planta) | Desnivel (DEM) | Itinerario | Etiqueta |
|---|---|---|---|---|
| Pampa Linda → Meiling | **11,3 km** | **+1.056 m** (847 → 1.878 m) | 13 km · ≈1.050 m | 13 km · +1.050 m |
| Villa Catedral → Frey | 10,1 km | +735 m (1.055 → 1.752 m) | ≈10 km · ≈750 m | ≈10 km · +750 m |

El desnivel coincide en los dos. **La distancia del Meiling no:** OSM da 11,3 km desde el nodo de Pampa Linda y el itinerario dice 13 km. Puede ser que el itinerario cuente desde el estacionamiento o por otra variante. La etiqueta muestra el dato del itinerario, como pediste; decidí vos si corregimos a ≈11 km.

**Fuentes y licencias de los datos nuevos**
- **ESA WorldCover 10 m 2021 v200:** © ESA WorldCover project / contiene datos modificados de Copernicus Sentinel (2021), procesados por el consorcio ESA WorldCover. CC BY 4.0. https://esa-worldcover.org
- **Copernicus DEM GLO-30 y su máscara de agua:** © DLR e.V. 2010-2014 y © Airbus Defence and Space GmbH 2014-2018, provisto bajo COPERNICUS por la Unión Europea y la ESA.
- **OpenStreetMap:** lagos, glaciares, senderos y lugares. © colaboradores de OpenStreetMap, ODbL. Vía Nominatim y la API v0.6, el 18/11/2026. Fuente cruda en `data/osm-fuente.json`.
- **Natural Earth 1:10m:** países, provincias y regiones, lagos. Dominio público.
- **Descartado:** Sentinel-2 cloudless (EOX), por licencia CC BY-NC-SA y por la luz incorporada.

**Capturas** en `docs/capturas/10-paleta-mapa-senderos/`: portada al inicio, a la mitad y al final del recorrido, mapas, resumen y pie, en 390, 1280 y 2560 px.

## Itinerario nuevo, dron alto, mapa único y pie (18/11)

**1. Itinerario (solo la versión nueva; la original no cambió)**
- **Días:** 3/1 Traful → La Angostura (1 h 26, 57 km; actividades del 3/1 original) · 4/1 día en La Angostura (Filo del Belvedere, kayak o Arrayanes, las del original) · 5/1 La Angostura → Villa Catedral (1 h 56, 102 km) y Refugio Frey · 6/1 bajada y casa de Bariloche · 7/1 Circuito Chico en bici · 8/1 rafting · 9/1 libre.
- **Filo de las Cabras:** salió de la versión nueva. Queda en el original y en la descripción de una casa descartada ("Ruca Quimei Malek"), que es un dato del anuncio y no del itinerario.
- **Otto Meiling opcional:** bloque "Opcional: Otto Meiling" en los días 6 a 9, con la ventana del camino a Pampa Linda (se sube de 10:30 a 14, se baja desde las 16), el trayecto Bariloche ⇄ Pampa Linda (1 h 59, 73 km, el ya medido) y qué actividad reemplaza en cada día. En la barra de bases aparece con borde punteado y no cuenta como noche.
- **A confirmar:** el trayecto Villa Catedral → Bariloche (no medido en Google Maps; OSRM da ≈19 km y ≈26 min, solo como referencia) y la casa de La Angostura del 3 y 4/1 (en Gastos figura como "a confirmar"; la Posta de los Colonos estaba cotizada para 1 noche).
- **Lo que se actualizó con el cambio:** resumen (ahora 1 noche en refugio y ≈530 km medidos), marcadores 3D (Frey "noche del 5/1", Meiling "opcional, 6 a 9/1", sendero del Meiling marcado como opcional), mosaico, botón y nota de la versión nueva, Gastos (Meiling opcional) y Pesca (el Correntoso queda el 3/1 y el Espejo el 4/1). Fecha de actualización del itinerario: 18/11/2026 (decía 19/11 por error; corregido).

**2. Portada:** dron más alto (5,2 a 7,8 km) con vista oblicua. Arranca sobre Bariloche y el Nahuel Huapi, pasa encima del sendero Villa Catedral → Frey (encuadrado completo a los 0,42 del scroll) y termina sobre el sendero Pampa Linda → Meiling, con el Tronador atrás. Los senderos usan test de profundidad con un pequeño desplazamiento: quedan ocultos detrás de los filos y no parpadean. Los bloques por donde pasa un sendero nunca simplifican el relieve más de un paso, para que el terreno no lo tape. En pantallas verticales la cámara se aleja por su línea de mirada para que los senderos entren enteros. Revisé el inicio, la mitad y el final en 390 y 1280 px: no se ve el borde del terreno.

**3. Mapa:** reemplacé los dos mapas por uno solo, estilo atlas escolar viejo, con colores de la paleta apagados, retícula de latitud y longitud numerada, nombres en mayúsculas espaciadas, escala gráfica y textura de papel.
- **Vista general:** Patagonia, Buenos Aires, el vuelo y el recuadro de la zona del viaje.
- **Zoom:** con "Ver la ruta", pellizco con dos dedos o Ctrl/⌘ + rueda; arrastre con el mouse. Un dedo sigue moviendo la página. Respeta movimiento reducido.
- **Detalle:** ruta del itinerario nuevo por las rutas reales (RN40, RP65, RP82, RN237) calculadas con OSRM sobre OpenStreetMap. Los tramos superpuestos se corren un poco y la vuelta y el opcional van en otro estilo. Lleva las paradas numeradas con fechas, los lagos con nombre y los dos senderos.

| Tramo (OSRM) | km | Rutas |
|---|---|---|
| Chapelco → San Martín | 26 | RN40 |
| San Martín → Falkner | 49 | RN40 |
| Falkner → Traful | 54 | RN40, RP65 |
| Traful → La Angostura | 57 | RN40, RP65 |
| La Angostura → Villa Catedral | 102 | RN40, RP82 |
| Villa Catedral → Bariloche | 19 | RP82 |
| Bariloche → Chapelco | 240 | RN237, RN40, RN234 |
| Bariloche → Pampa Linda (opcional) | 62 | RN40, RP81 |

**4. Pie:** silueta real del horizonte calculada sobre Copernicus GLO-30 (`tools/silueta.py`).
- **Punto de vista:** busqué automáticamente un punto sobre el agua del Nahuel Huapi desde donde se vieran el Tronador y el Cerro Catedral. Elegido: **41,035° S · 71,480° O**, a 3 m sobre el lago (771 m), a 18 km de Bariloche, frente a la península de Llao Llao.
- **Dirección:** acimut de 171° a 258°, del sur al oeste. Curvatura terrestre con refracción k = 0,13. Exageración vertical de 1,5.
- **Picos que se ven** (cumbres de OSM): Cerro Catedral Norte (183°, apenas asoma, +0,05°), Goye (192°), López (226°) y Tronador (248°, +0,40°). En el celular se rotulan solo Catedral, López y Tronador.
- **Composición:** franjas rectas (violeta, azul rey, violeta, rojo y azul rey) en el borde de abajo, separadas de la silueta por el bloque de contenido, sin texto encima. Firma "Hecho por Juan · 2026".

**Fuentes nuevas:** OSRM (router.project-osrm.org) sobre datos de OpenStreetMap (ODbL) para las rutas del mapa; cumbres de OpenStreetMap vía Nominatim; Copernicus GLO-30 y su máscara de agua para la silueta.

**Revisión:** dos versiones del itinerario (15 días cada una), casas (6 tachadas, links de Airbnb, Booking y Google Maps), autos (2 carritos), Gastos, Pesca (10 lugares, 5 guías) y links (Windguru, Google Maps, registro de trekking, refugios). Sin errores de JS ni scroll horizontal (`tools/revisar.cjs`). Capturas en `docs/capturas/11-dron-mapa-pie/`.

## Carteles de la portada, mapa fluido, pie sin nombres y merge (18/11, noche)

Trabajo autónomo pedido sin esperar OK, con checkpoint (rama) antes y después de cada parte.

**1. Carteles de la portada 3D** (`js/hero.js`, CSS en `index.html`)
- **Posición:** el JS calcula la caja de cada cartel y la limita a 12 px de cada borde. Si el punto está cerca de un borde, la caja se corre hacia adentro y una línea roja la une con el punto (también en diagonal). Si arriba no entra, va abajo del punto; si tampoco, no se muestra.
- **Choques:** ningún cartel pisa a otro ni al botón de menú, al título (mientras se ve), a la banda de datos (mientras se ve) o al crédito. Si dos chocan, queda el más cercano al punto que mira la cámara en ese momento. El que ya se ve tiene una ventaja chica para que no parpadeen.
- **Tamaño:** se mide con `ResizeObserver`, sin forzar cálculos de estilo en cada cuadro.
- **Celular:** título en 14 px y dato en 10,5 px en una segunda línea corta. Ancho máximo del 70 % de la pantalla. Fondo opaco (`--hoja` con `--tinta`): contraste de 7:1 a 16:1 sobre cualquier parte del relieve, en claro y en oscuro. Los lagos van en azul rey opaco con blanco.
- **Línea del sendero:** el texto del sendero ya no estira la caja; se acomoda al ancho del título.
- **Crédito:** en el celular va en dos líneas ("Relieve: Copernicus GLO-30 y AWS Terrain Tiles" / "Lugares: © OpenStreetMap"), sin "…".
- **Sendero del Meiling:** el "nudo" eran los zigzags reales de la cuesta, que vistos desde el dron se pisan. `tools/senderos.py` los reemplaza por su línea central (suavizado gaussiano fuerte solo donde el sendero vuelve sobre sí mismo, ±600 m). El inicio, el final y el corredor no cambian. La distancia y el desnivel que muestran los carteles siguen saliendo del trazado original de OSM. `tools/terreno.py` llama a la misma función si se regenera.
- **Revisado** en 360, 390 y 1280 px a lo largo de todo el recorrido del dron.

**2. Mapa fluido** (`index.html`)
- **Antes:** cada cuadro del zoom cambiaba el `viewBox` y el navegador redibujaba el SVG entero (235 KB, con un filtro de ruido encima).
- **Ahora:** dos capas que se mueven y escalan solo con `transform` (GPU), con `requestAnimationFrame`:
  - **Capa A, vista general simplificada:** sin el detalle fino recortado, sin la capa de la ruta y sin la retícula fina; se dibuja una sola vez.
  - **Capa B, mapa completo con detalle:** se redibuja nítida una sola vez por gesto, 140 ms después de soltar. Tiene media pantalla de margen a cada lado para que al arrastrar no aparezcan bordes vacíos. Con "Ver la ruta" y los botones + y −, la capa B se dibuja primero en el destino, así se ve nítida mientras se acerca.
- **Textura de papel:** pasó a ser una imagen CSS de 220 px que se repite (el mismo ruido, sin recalcular un filtro al hacer zoom).
- **Gestos:**
  - Celular: sin zoom, un dedo mueve la página. Con zoom, un dedo arrastra el mapa. Dos dedos pellizcan.
  - Escritorio: arrastre con el mouse, Ctrl/⌘ + rueda (o rueda sola si ya hay zoom; sin zoom, la rueda mueve la página) y botones + y −.
- **Límites:** con poco zoom, todo el mapa. Con zoom de detalle, la zona del viaje con un margen: no se puede terminar mirando el océano.
- **Botones:** + y − y "Vista general" van sobre el mapa, siempre visibles. Abajo quedan "Ver la ruta" y "Vista general", deshabilitados cuando no corresponden.
- **Medición** (`tools/medir-mapa-fps.cjs`): 390x844, gestos táctiles simulados por CDP a ritmo de dedo (un evento cada 16 ms). Cuenta los cuadros presentados por el compositor en el trazado de Chrome (Chromium sin GPU, compositor por software).

| Gesto (CPU ×4, "gama media") | Antes | Ahora |
|---|---|---|
| Pellizco para acercar | 21 fps, p95 126 ms | 60 fps, p95 18 ms |
| Arrastre con un dedo (con zoom) | no existía (movía la página) | 60 fps, p95 19 ms |
| Pellizco para alejar | — | 59 fps, p95 22 ms |
| Un dedo sin zoom | mueve la página | mueve la página (≈260 px en la prueba) |

Es una emulación: en un teléfono real el compositor usa la GPU, así que debería andar igual o mejor, pero no lo probé en un aparato físico.

**3. Pie:** quedan solo las siluetas; saqué los nombres de los cerros (`data/silueta.json` ya no se descarga).

**Revisión automática** (`tools/revisar.cjs`, ampliado): celular y escritorio, claro y oscuro.
- Itinerario: las dos versiones con 15 días cada una; cada día se abre con título y descripción.
- Casas: las 34 opciones recorridas. Autos, Gastos y Pesca con contenido.
- Links: 49 externos bien formados, con Windguru, Google Maps, Booking y Airbnb.
- Sin errores de JS ni scroll horizontal. Resultado: OK.

**Merge:** rama `checkpoint/main-antes-del-merge` → `main` anterior; `relato` a `main` en un solo commit. Detalles y verificación de producción en `CHECKPOINTS.md`.

---

# Informe del 19/11/2026 · correcciones, paleta nueva, pulido y rediseño libre

## Lo primero (leer esto)

- **La web publicada NO quedó actualizada.** Esta sesión corrió en una PC con Windows que no tiene Git, Node ni Python, sin el repo clonado (solo el zip de `main`) y sin credenciales de GitHub. Preguntado al empezar, elegiste "sin instalar nada". Por eso **no hay commits, ramas, push, merge ni previews de Vercel**: todo el trabajo está en carpetas locales.
- Dónde está cada cosa (en `Desktop\Pat\`):
  - `Patagonia-2027-main\` → la versión **pulida y lista para publicar** (etapas 1 a 3). Es lo que tendría que ir a `relato` y después a `main`.
  - `Patagonia-2027-rediseno-libre\` → el **rediseño libre** (etapa 5). Equivale a la rama `rediseno-libre`. No mezclar con `main`.
  - `_checkpoints\` → copias de carpeta de cada etapa (ver "Checkpoints y cómo volver").
- Para verlas en la PC: en cada carpeta, `powershell -ExecutionPolicy Bypass -File tools\servidor.ps1` y abrir http://localhost:8080/ (para la segunda, agregar ` 8090` al final y abrir http://localhost:8090/).
- **Lighthouse no se pudo correr** (necesita Node). En su lugar medí LCP, CLS, tareas largas y peso con Chrome sin ventana (`tools/medir.ps1`), antes y después. No es comparable con el puntaje de Lighthouse: no limita la red ni el procesador.

## Cómo publicar (etapa 4, pendiente)

Desde una máquina con Git y acceso al repo (o una sesión de Claude Code en la nube con el repo conectado):

1. Copiar el contenido de `Patagonia-2027-main\` sobre un clon del repo en la rama `relato` (sin la carpeta `.git`, que no existe acá). Conviene un commit por checkpoint: primero el contenido de `_checkpoints\28-correcciones-y-paleta-base`, después el de `29-pulido-listo`, y crear las ramas `checkpoint/28-...` y `checkpoint/29-...`.
2. Revisión automática: `node tools/revisar.cjs` (o, sin Node, `powershell -File tools\medir.ps1 -Medidor http://localhost:8080/tools/revisar.html`). Tiene que decir `revisión OK`.
3. `git push origin main:refs/heads/checkpoint/main-antes-del-merge-3` (el nombre `checkpoint/main-antes-del-merge` ya está usado por el segundo merge).
4. Merge con squash de `relato` a `main` y push. Vercel publica solo.
5. Abrir https://patagonia-2027-eosin.vercel.app en 390×844 y 1280×800. En un celular que ya la tenía abierta puede hacer falta recargar una vez: el service worker es nuevo.
6. Correr Lighthouse móvil sobre la URL publicada (PageSpeed Insights) y anotar los puntajes acá.
7. Para el rediseño: crear la rama `rediseno-libre` desde `main`, copiar `Patagonia-2027-rediseno-libre\` encima, commit y push. El preview queda en `https://patagonia-2027-git-rediseno-libre-juans-projects-9f7b2d3f.vercel.app`.

## Etapa 1 · Correcciones

| # | Pedido | Antes | Después |
|---|---|---|---|
| 1 | Arrancar siempre en la portada | Sin `#` en el link, la página restauraba la última sección (`localStorage` `pat-page`) y el navegador restauraba el scroll: en el celular caía en el Itinerario. | Se eliminó `pat-page`. `history.scrollRestoration = 'manual'` y `scrollTo(0,0)` si no hay `#sección`. Con `#itinerario`, `#mapa`, etc. abre esa sección (sirve para compartir un link directo). |
| 2 | Mapa de Google del trayecto en el celular | El iframe usaba `https://maps.google.com/maps?saddr=…&daddr=…&output=embed`. Esa dirección responde con un **301 que trae `X-Frame-Options: SAMEORIGIN`** y recién después llega al mapa embebible (lo verifiqué con pedidos directos con user agents de Android y iPhone). En la PC el navegador sigue la redirección; hay navegadores móviles que cortan ahí y dejan el cuadro vacío. | El iframe apunta directo al destino de esa redirección: `https://www.google.com/maps/embed?origin=mfe&pb=!1m6!4m4!4m1!2s<origen>!4m1!2s<destino>!5e0…`, sin pasar por el 301. Se inserta cuando el bloque está por entrar en pantalla (no frena la carga). Más alto en el celular (`clamp(260px, 56vw, 380px)`). Sin conexión muestra el texto del trayecto y el link. **No lo pude probar en un teléfono real**: lo probé en el navegador con emulación de celular (dibuja la ruta). Si en algún celular sigue sin verse, avisame cuál (modelo y navegador). |
| 3 | Un solo itinerario | `DAYS_A`/`BASES_A`/`LEGS.a`, selector "Versión", dos botones en la portada, textos "itinerario original/nuevo" en Gastos, resumen y pesca. | Queda `DAYS`, `BASES`, `LEGS` (el nuevo). Se fueron el selector, los botones, `pat-ver` y todos los textos que dependían. El original se recupera del checkpoint `27-antes-correcciones-19-11`. |
| 4 | Mapa plano angosto en la PC | Caja con `max-width: 640px` y la proporción vertical del mapa (600×827): quedaba una columna con bandas vacías. | El Mapa es una sección propia. En pantallas de más de 820 px la caja ocupa todo el ancho del contenido con altura `clamp(440px, alto de pantalla − 266px, 760px)`. El código del zoom se generalizó para cualquier proporción: la "vista general" en apaisado es la franja de ancho completo que va de Buenos Aires a la zona del viaje. En el celular queda como estaba. |
| 5 | Texto "Relieve: …" en la portada | Línea de créditos sobre el borde inferior del 3D. | Eliminada. Los créditos del relieve, lugares, mapas y fotos están solo en el pie. |
| 6 | Fotos | 7 de 17 eran fotos verticales recortadas al centro en 16:9: en San Martín quedaba el cerro y no el pueblo. "Bariloche" en el mosaico era una vista de lagos sin ciudad. Sin `srcset`. | Cada foto tiene un punto de interés (`fx`, `fy`) y se pide **recortada en el servidor** (`fit=crop&ar=3:2&crop=focalpoint`), con `srcset` de 480 a 1600 px. San Martín: mismo archivo, ahora encuadra el pueblo, la playa y el muelle. Bariloche: fotos nuevas de Unsplash con la costanera y la catedral (`photo-1698006812846-09a8022e549d`) y el puerto con el centro (`photo-1589836262351-edc2c3e1f09d`), elegidas mirándolas. Detalle en "Fotos" más abajo. |
| 7 | Menú | Un botón suelto arriba a la derecha que abría un panel lateral y se escondía al bajar. | **Barra de secciones fija**: abajo en el celular (seis pestañas con ícono y nombre, 60 px + zona segura, al alcance del pulgar) y arriba en pantallas de 900 px o más (con el nombre del viaje a la izquierda). Fondo tinta con filete rojo polar; la sección abierta va en rojo y con `aria-current="page"`. No tapa contenido: la página reserva su alto y la portada 3D se achica lo mismo. Desde la portada, tocar una pestaña salta directo al plan sin recorrer todo el vuelo. |

## Etapa 2 · Paleta nueva

Hecha junto con la etapa 1 porque se reescribieron los estilos completos (el CSS anterior tenía cinco generaciones de reglas pisándose). Detalle, tabla de tokens y contrastes en `docs/investigacion-estetica.md`, "Paleta 4 · Fitz Roy y polares".

- Las dos fotos llegaron después de arrancar; las usé solo para verificar el color. No están en el repo ni se usó nada de sus logos o textos.
- Base: los hex que muestreaste. Agregué **lenga `#A9561F`** (naranja quemado de las lengas; oscurecido desde ≈`#B4622B` para que el texto blanco encima tenga contraste 5,2) y **marino `#22375C`** (bolsillos de los polares; elegido a ojo, ajustalo si lo ves distinto).
- Rojo polar `#9D2F23` como acento: barra, botones, día y base elegidos, marcadores, ruta y senderos punteados. En el 3D va un punto más claro (`#B3321F`) para que se lea sobre el bosque.
- Franjas del pie: abeto, caqui, pastizal, lenga y polar; rectas y separadas de la silueta. Elegí solo tonos de tierra para que no se parezcan a las franjas de ninguna marca.
- Cielo, bruma y luz del 3D; mapa plano con el mismo papel en claro y oscuro; ilustraciones de respaldo: todo con la paleta.
- Contraste: todos los pares de texto dan 4,5:1 o más (calculado con la fórmula de WCAG; tabla en el documento de estética). Encontré y corregí uno que no llegaba (blanco sobre el naranja del modo oscuro: 4,29 → 5,2).

## Etapa 3 · Pulido

### Diseño
- **Antes:** tamaños de letra y espacios sueltos (11, 12, 13, 14, 15 px mezclados). **Después:** escala tipográfica (`--t-xs` a `--t-4xl`) y de espaciado (múltiplos de 4) en tokens.
- **Estados:** hover, activo (`:active` con un leve desplazamiento) y foco visible (`outline` de 3 px con color propio por tema) en todo lo tocable. Transiciones de 150 ms; con `prefers-reduced-motion` se anulan.
- **Áreas táctiles:** chips, links tipo botón, anterior/siguiente, botones del mapa, flechas de fotos y links del pie pasaron a 44 px o más. La revisión automática lo controla.
- **Modo oscuro:** tokens propios (no una inversión): superficies `#1B242E`/`#25303B`, texto secundario `#A9BCCB`, links `#F09383`. El mapa plano se mantiene en papel claro en los dos temas.
- **Anchos:** revisado en 360, 390, 768, 1280, 1440 y 2560 px con un control automático (scroll horizontal, textos con `overflow` cortado, áreas táctiles): sin fallas. Se sacó el único "…" que había (el crédito de la portada).

### Portada 3D
- Carteles: ya quedaban dentro de la pantalla con el arreglo anterior; al sacar el botón de menú y el crédito tienen más lugar. Verificado en 390 px a lo largo del recorrido (capturas en `docs/capturas/12-pulido-19-11/`).
- Senderos: se apoyan en el relieve y lo que queda detrás de un filo se oculta (prueba de profundidad); no hice cambios de geometría.
- Carga: el armado del relieve se parte en tramos (`await` cada 4 bloques) para no trabar el scroll mientras carga. La versión liviana entra primero y la alta se funde en 1,4 s, como antes.
- Fluidez del dron: **no la pude medir** (el navegador de pruebas estaba en segundo plano y Chrome sin ventana no da cuadros por segundo reales). No toqué el recorrido. Queda como pendiente verlo en un celular.
- Fallback: foto fija si no hay WebGL2, con `prefers-reduced-motion`, Save-Data o poca memoria; ahora con `srcset`.

### Contenido y datos
- **Una sola fuente:** `js/datos.js`. El resumen de la portada (km, noches por base, por persona), los carteles del 3D, la tabla de casas elegidas, Gastos y el bloque "Dónde dormimos" se calculan desde ahí. El total de autos y el valor en dólares del permiso de pesca también.
- **La Angostura:** el plan actual son 2 noches (3 y 4/1), pero los precios de la lista se cotizaron el 30/10 para 3 noches (3 al 6/1). No inventé un precio: la sección lo dice ("total a confirmar"), los links a Airbnb y Booking ya van con entrada 3/1 y salida 5/1, y en Gastos figura "a confirmar".
- **Se quitó "Combinaciones para las 8 noches":** con San Martín y Bariloche confirmadas, cuatro de las cinco combinaciones quedaban tachadas y la quinta usaba un precio de 3 noches. La tabla "Dónde dormimos en casa" muestra lo confirmado (USD 1.814, USD 227 por persona, 6 noches) y lo que falta.
- Ortografía: "nailon", "10 %", "10/1" (antes "10/01" en un lugar), tildes revisadas.

### Accesibilidad
- `lang="es-UY"`, link "Saltar al plan", un solo `<main>`, encabezados de tabla con `scope`, listas de datos como `<dl>`.
- Barra: `<nav>` con nombre y `aria-current`. Días y casas: botones con `aria-current` en el elegido; el cambio se anuncia en una región `role="status"` (antes se releía el panel entero).
- Mapa: enfocable, con instrucciones en `aria-label`; teclado `+`, `−`, flechas y `0`.
- Carruseles: `role="group"` con `aria-roledescription="carrusel"`, miniaturas "Foto 3 de 12" con `aria-current`, flechas del teclado, botón propio para abrir el visor. El visor es un diálogo modal que retiene el foco y lo devuelve al cerrar.
- Fotos con texto alternativo descriptivo por día.

### Rendimiento (Chrome sin ventana, misma máquina, sin limitar red ni procesador)

| | Antes (zip de `main`) | Después |
|---|---|---|
| LCP, celular 390 | 688 ms (póster) | 572 ms (póster) |
| CLS, celular | 0,0315 | 0,0002 |
| LCP / CLS, PC 1280 | 744 ms / 0,0005 | 608 ms / 0,0009 |
| Tareas largas, celular | 110, 435 y 188 ms | 83, 371, 62 y 151 ms |
| Peso total transferido, celular | 5,3 MB | 4,2 MB |
| HTML | 189 KB (todo adentro) | 26 KB + CSS 31 KB + datos 61 KB + lógica 44 KB |

- Nada bloquea el itinerario: los scripts van con `defer`, el 3D arranca cuando el navegador queda libre y el mapa de Google se pide al acercarse.
- **Por qué no puedo prometer 90 en Performance:** la tarea de ~370 ms es three.js compilando y dibujando el primer cuadro; en un celular de gama media (Lighthouse la multiplica por 4) eso es bloqueo de más de 1 s. Si al medir en producción no llega, la opción es arrancar el 3D recién con el primer scroll o toque (queda la foto hasta entonces).

### Sin conexión
- `sw.js`: al instalar guarda la página, estilos, scripts, datos, mapa, silueta y la versión liviana del 3D (22 archivos). Después la página le pasa una foto por día, las del resumen y las tipografías. Las fotos que se van viendo (casas) se guardan hasta 320.
- La página se pide primero a la red (para ver cambios) y, si no hay o tarda más de 3 s, sale la copia.
- Sin conexión, si falta el tamaño exacto de una foto se usa otro tamaño guardado de la misma; si no hay ninguna, se dibuja la ilustración del día.
- Aviso "Sin conexión: estás viendo la copia guardada" abajo, discreto.
- **Probado:** con el servidor local apagado, la página recargó desde la copia con los 15 días, la foto de un día que no había abierto, el mapa plano, la silueta, el 3D liviano y las tipografías.
- Los mapas de Google no se guardan (son de otro sitio).

### Compartir
- Open Graph y Twitter Card con título, descripción e imagen propia (`img/portada-og.jpg`, 1200×630, captura real de la portada 3D).
- `manifest.webmanifest`, ícono SVG y PNG (192, 512, maskable y 180 para iPhone), `theme-color`.

### Robustez
- **Links:** `docs/links.md` (30 revisados con `tools/links.ps1`). Todos responden salvo:
  - `cazaypesca.neuquen.gob.ar/permisos/`: **no conecta desde esta PC** (tampoco la portada del sitio). No sé si está caído o bloquea conexiones de afuera de Argentina. Lo dejé (el link principal, permisosdepesca.com.ar, anda). Revisar a mano.
  - EconomyBookings (403) y Expedia (429) bloquean robots: revisar a mano. Booking responde 202 (desafío anti-robots), no es un link roto.
- `404.html` propia (Vercel la sirve sola en los sitios estáticos).
- Consola: sin errores ni warnings en la carga normal. Sin conexión, el 3D avisa con un `console.warn` que sigue con la versión liviana.
- Sin scroll horizontal en ningún ancho probado.

### Código
- `index.html` (marcado) · `css/estilos.css` · `js/datos.js` · `js/app.js` · `js/hero.js` · `sw.js`. Sin build.
- Herramientas que andan sin Node ni Python: `tools/servidor.ps1`, `medir.ps1`, `revisar.html`, `capturar.ps1`, `capturas.ps1`, `links.ps1`, `iconos.ps1`.
- `CLAUDE.md` ("Cómo está hoy") y `README.md` actualizados.

### Fotos: qué quedó en cada día

| Día | Foto | Estado |
|---|---|---|
| San Martín de los Andes | misma foto, reencuadrada al pueblo y el muelle | verificada a ojo |
| Bajada del Frey y Bariloche · mosaico "Bariloche" | costanera y catedral (nueva) | verificada a ojo |
| Día libre en Bariloche | puerto con el centro (nueva) | verificada a ojo |
| Villa Traful | muelle de madera, reencuadrada | es el muelle de Traful |
| Refugio Frey | laguna Toncek | corresponde |
| Año Nuevo en el Falkner, Ruta de los 7 Lagos, Yuco, Bosque sumergido, Circuito Chico | lagos de la zona | **no pude confirmar que sean exactamente ese lago** (Unsplash no siempre trae el lugar). El pie dice el día, no el lugar de la foto. |
| Rafting en el Manso | gomones en agua quieta | **floja**: no muestra rápidos. No encontré una libre del Manso; a reemplazar si conseguís una. |
| Vuelta a casa | estepa (Wikimedia, con crédito) | corresponde |

### Revisión automática
`tools/revisar.html` (corre en Chrome sin ventana): 15 días con detalle, Frey presente, sin selector de versión, Mapa/Casas/Autos/Gastos/Pesca con contenido, 24 casas recorridas, 72 links externos bien formados, links a Windguru, Google Maps, Booking y Airbnb, sin errores de JS, sin scroll horizontal, áreas táctiles de 44 px. **Resultado: OK en 390×844 y 1280×800.**

## Dudas para vos (etapas 1 a 3)

1. **Distancias que no coinciden entre el texto del día y el trayecto de Google** (no las toqué, son datos tuyos): 1/1 Falkner → Traful dice "≈75 km, ≈1 h 30" y el trayecto "55 km, 1 h 19"; 3/1 dice "65 km" y el trayecto "57 km"; 28/12 "22 km" contra "23 km"; 30/12 "47 km" contra "48 km". ¿Cuál vale?
2. **Hostería Posta de los Colonos** figura como "Primera opción · plan con Frey" para 1 noche (4/1). Con el plan actual son 2 noches en La Angostura. ¿Sigue siendo la primera opción?
3. **6/1 Villa Catedral → Bariloche:** tiempo y km siguen "a confirmar".
4. La foto del rafting.
5. El azul marino y el naranja de las lengas los elegí yo: confirmá o pasame el hex.
## Etapa 5 · Rediseño libre (carpeta `Patagonia-2027-rediseno-libre`, equivale a la rama `rediseno-libre`)

Parte de la versión pulida (etapas 1 a 3) y reemplaza la portada por un **recorrido 3D del viaje**. Todo lo demás (itinerario, mapa plano, casas, autos, gastos, pesca, modo sin conexión, barra de secciones, paleta) queda igual y con los mismos datos.

### Análisis de la referencia: Expedia · Route 66 (https://www.expedia.com/route66/)

Lo que vi navegándola (19/11/2026) y mirando sus recursos públicos. No copié código, textos, imágenes, sonidos ni marca.

| Qué hace | Cómo lo hace (lo que se ve desde afuera) |
|---|---|
| **Carga** | Pantalla crema con un contador de 0 a 100, curvas de nivel dibujadas, una ruta entre dos puntos y un "Did you know" con un dato mientras espera. |
| **Intro** | Título enorme sobre un video (mp4 de 7 MB con un primer cuadro en JPG). Dos entradas: "Start your journey" y "Enter without audio". |
| **Mapa** | Un país en miniatura, como una maqueta: tierra extruida, árboles y rocas repetidos (modelos `.glb` chicos), agua con textura, desenfoque en los bordes. Se arrastra. |
| **Ruta y vehículo** | Línea amarilla sobre el mapa y un vehículo de juguete que la sigue; se puede cambiar de vehículo. |
| **Paradas** | Pines con estrella sobre la ruta y pines grises para los desvíos; al tocarlos abren contenido. Una tarjeta abajo a la izquierda explica en pasos qué hacer ("Drag the map…", "Explore POI's"). |
| **Progreso** | Contador "0/8" arriba a la derecha y un llavero coleccionable por estado (un modelo 3D con texturas por cada uno). |
| **Dos modos** | "States" (lista) y "3D Map": el contenido se puede ver sin el mapa. |
| **Sonido** | Apagado hasta que se elige; botón "Turn on sound". |
| **Stack** | three.js r183, GSAP 3.13 (animaciones), Lenis 1.3 (scroll suave), Howler (audio). 71 texturas KTX2 (10,6 MB) y 16 modelos GLB (1 MB): unos 250 pedidos y más de 25 MB en total en la primera carga de escritorio. |

**Qué tomé (la idea, hecha de nuevo para nuestro viaje):** intro de título con dos entradas; dato "¿Sabías que?" durante la carga; mapa del territorio que se recorre con un vehículo sobre la ruta; paradas como puntos que abren su contenido; tarjeta fija que dice en qué tramo estás; contador de progreso con un coleccionable por parada; versión sin 3D con el mismo contenido.

**Qué hice distinto y por qué:**
- **Territorio real, no una maqueta dibujada:** el relieve sale de datos de elevación (AWS Terrain Tiles) y las rutas son las reales (OSRM sobre OpenStreetMap). Se ve como un mapa en relieve impreso: color por altura (bosque al oeste, estepa al este, roca y nieve arriba), curvas de nivel cada 200 m y lagos de OpenStreetMap.
- **Scroll en vez de arrastrar:** en el celular el scroll es el gesto que ya se usa para leer; arrastrar un mapa a pantalla completa atrapa el dedo. El auto avanza con el scroll y vuelve al subir.
- **Liviano:** 1,9 MB en total en la primera carga del celular (three.js 670 KB + relieve 280 KB + datos 87 KB), contra más de 25 MB de la referencia. Sin modelos ni texturas: los autos son cajas y los parches son SVG dibujados por código.
- **Sin sonido:** no lo agregué. Para que valga la pena hace falta elegir y licenciar bien los audios; lo dejo como idea.
- **Solo datos útiles:** el "¿Sabías que?" usa cuatro datos que ya estaban en el sitio con su fuente (reglamento de pesca, horarios del camino a Pampa Linda, sendero al Frey). No agregué datos nuevos sin verificar.

**Otros sitios premiados:** el pedido incluía investigar más referencias. **No lo hice**: el tiempo se fue en la referencia principal y en construir. Queda pendiente.

### Qué tiene

- **Intro:** "Patagonia 2027", fechas, 8 personas, 14 noches; botones "Empezar el recorrido" e "Ir directo al itinerario"; barra de carga con porcentaje y un "¿Sabías que?". De fondo, el territorio completo visto desde el norte.
- **Territorio 3D** de Chapelco al Tronador (103 × 164 km), generado en el navegador con `tools/territorio.html` (no había Python): `data/territorio-alt-512.png` (280 KB) y `data/territorio.json` (rutas por tramo, senderos, 20 lagos, lugares). Los bordes se funden con la bruma. Hay una versión de 1024 px (`territorio-alt.png`, 1 MB) guardada pero sin usar.
- **Recorrido:** Aeropuerto Chapelco → San Martín → Lago Falkner → Villa Traful → Villa La Angostura → Villa Catedral → (a pie) Refugio Frey → bajada → Bariloche. Unos 300 km de ruta real. Lo recorrido queda en rojo polar; lo que falta, en blanco. El sendero al Frey va punteado y lo sube un punto rojo mientras los autos esperan en Catedral. El camino a Pampa Linda y el sendero al Meiling aparecen punteados en oliva (opcional).
- **Los dos autos:** dos Citroën Basalt de juguete (cajas, uno claro y uno gris; el color real de los alquilados no se sabe), sin marca.
- **Cartel del tramo:** fecha, origen → destino, tiempo, km y ruta, tomados de `LEGS` (los mismos del itinerario). El tramo Catedral → Bariloche dice "tiempo y km a confirmar".
- **Paradas:** un botón numerado en cada base. Al tocarlo se abre la **ficha**: fechas, dónde se duerme con precio y estado, y cada día que se pasa ahí con su descripción, trayecto, pesca, horarios, links y un botón para abrirlo en el itinerario. Es un `<dialog>`: hoja que sube desde abajo en el celular, tarjeta centrada en la PC; cierra con Escape, con la × o tocando afuera.
- **Parches:** uno por base (8), dibujados por código: disco de color con pespunte, un dibujo simple del lugar (barco, casas, carpa, trucha, arrayán, agujas del Frey, cerros, Tronador), nombre en arco y fechas. Se consiguen al llegar; el del Meiling (opcional) al abrir su ficha. Se guardan en el celular. Diseño propio: no usan montañas con franjas ni nada de la marca.
- **Sin 3D** (sin WebGL2, con movimiento reducido, ahorro de datos, poca memoria o agregando `?plano` al link): intro con la foto y la lista de las 8 paradas, que abren las mismas fichas.
- Accesibilidad: los carteles son botones con foco visible; las fichas y los parches son diálogos nativos; el cartel del tramo es `role="status"`; todo el contenido del recorrido está también en el itinerario.

### Medición y revisión (misma máquina, Chrome sin ventana)

| | Versión pulida | Rediseño libre |
|---|---|---|
| LCP celular | 572 ms | 560 ms |
| CLS celular | 0,0002 | 0,0018 |
| Tareas largas celular | 83, 371, 62, 151 ms | 74 y 350 ms |
| Peso total celular | 4,2 MB | 1,9 MB |
| Archivos del 3D | 3,3 MB | 0,65 MB + 0,37 MB de datos |
| Revisión automática | OK (390 y 1280) | OK (390 y 1280), incluye las 8 fichas y los 8 parches |

Lighthouse: no se pudo correr (sin Node). Capturas en `docs/capturas/13-rediseno-libre/` (390×844, 1280×800 y 2560×1080).

### Límites conocidos del rediseño

- **No lo vi andar en un celular real ni medí cuadros por segundo.** Lo probé en el navegador de la PC con tamaño de celular. La malla tiene 41.000 vértices en el celular y 165.000 en la PC; debería andar bien en gama media, pero hay que probarlo.
- El relieve es de zoom 10 (unos 115 m por punto): de lejos se ve bien; de cerca las montañas son suaves, sin el detalle fino que tiene la portada actual del Tronador (Copernicus de 30 m). Mejorarlo necesita Python o una herramienta de teselas más pesada.
- Los carteles de paradas no evitan encimarse entre sí (en la vista de portada, Frey, Bariloche y Meiling quedan cerca).
- El recorrido no incluye la vuelta a Chapelco del 10/1 (sale del territorio hacia el este) ni Buenos Aires (su parche se consigue al empezar).
- No hay modo de arrastrar el mapa libremente ni sonido.
- Las fotos, el resumen y las secciones de abajo son las mismas de la versión pulida: el rediseño cambió la entrada y el recorrido, no rediseñó el plan.

## Comparación: versión pulida contra rediseño libre

| | Pulida (`Patagonia-2027-main`) | Rediseño (`Patagonia-2027-rediseno-libre`) |
|---|---|---|
| Qué se ve al entrar | El relieve detallado del Nahuel Huapi y el Tronador con un vuelo de dron | Todo el territorio del viaje, de San Martín al Tronador, y el título con dos entradas |
| Qué cuenta | Dónde están el Frey, el Meiling y Bariloche | El viaje entero en orden: cada tramo con su tiempo y km, cada parada con sus días |
| Detalle del relieve | Alto (30 m, texturas con sombras, bosque, glaciares) | Medio (115 m, color por altura y curvas de nivel) |
| Interacción | Scroll; los carteles no se tocan | Scroll; las paradas abren fichas; parches que se van juntando |
| Peso | 4,2 MB | 1,9 MB |
| Riesgo | Bajo: es la que ya conocen, mejorada | Medio: es nueva y no está probada en teléfonos |
| Mi recomendación | **Publicar esta ya** | Probarla en dos o tres celulares; si gusta, sumarle el relieve fino de la zona del Tronador para no perder lo mejor de la actual |

## Checkpoints y cómo volver (19/11)

Todos son carpetas en `Desktop\Pat\_checkpoints\` (no hay Git en esta PC). Lista y contenido en `CHECKPOINTS.md`. Para volver a uno, copiar su contenido sobre la carpeta de trabajo. El itinerario original se recupera de `27-antes-correcciones-19-11\index.html`.

## Pendientes

1. **Publicar** (pasos en "Cómo publicar"). Es lo único que impide que los amigos vean los cambios.
2. Lighthouse móvil en producción y, si Performance no llega a 90, arrancar el 3D recién con el primer scroll o toque.
3. Probar en teléfonos reales: el mapa de Google de cada día, la fluidez del 3D (las dos versiones) y "agregar a la pantalla de inicio".
4. Las cinco dudas de datos de más arriba.
5. Link de Caza y Pesca Neuquén, que no respondió desde acá.
6. Rediseño: investigar más referencias, relieve fino, carteles que no se encimen, sonido opcional.
7. Subir los checkpoints como ramas cuando haya Git.