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
