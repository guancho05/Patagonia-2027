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
