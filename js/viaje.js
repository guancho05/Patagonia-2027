// Recorrido 3D del viaje: el territorio real de San Martín de los Andes al Tronador como un mapa en relieve impreso,
// con la ruta real en auto, los dos autos avanzando con el scroll, el sendero al Frey a pie, paradas que abren su ficha
// y un parche por cada base. Datos: data/territorio.json y data/territorio-alt-512.png (tools/territorio.html) + js/datos.js.
// Si no hay WebGL2, hay prefers-reduced-motion, Save-Data o poca memoria: queda la portada fija con la lista de paradas.
const sec = document.getElementById('viaje'), stage = document.getElementById('vstage'), canvas = document.getElementById('vcanvas');
const $ = id => document.getElementById(id);
const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
const saveData = navigator.connection && navigator.connection.saveData, lowMem = navigator.deviceMemory && navigator.deviceMemory < 4;
const movil = matchMedia('(max-width: 820px), (pointer: coarse)').matches;
const EX = 1.7;                      // exageración vertical
const COL = { polar: '#B3321F', nieve: '#F2F6F9', bruma: '#DCE7EE', marino: '#22375C', tinta: '#131A22' };
const ceder = () => new Promise(r => setTimeout(r, 0));

/* ---------- paradas, fichas y parches (no dependen del 3D) ---------- */
const CLAVE = { 'San Martín': 'sma', 'Lago Falkner': 'falkner', 'Villa Traful': 'traful', 'La Angostura': 'angostura', 'Refugio Frey': 'frey', 'Bariloche': 'bariloche', 'Otto Meiling': 'meiling' };
const BN = BASES.filter(b => !b.o);
const diasDe = b => { if (b.o) return []; const i = BN.indexOf(b), fin = i < BN.length - 1 ? BN[i + 1].d : DAYS.length; return DAYS.map((d, k) => [d, k]).slice(b.d, fin) };
// fechas de la estadía: del día de llegada al de salida ("28 al 30/12")
const fechas = b => { if (b.o) return b.e; const ds = diasDe(b), a = ds[0][0].d; if (ds.length < 2) return a; const z = (DAYS[ds[ds.length - 1][1] + 1] || ds[ds.length - 1][0]).d; return (a.split('/')[1] === z.split('/')[1] ? a.split('/')[0] : a) + ' al ' + z };
const PARADAS = BASES.map((b, i) => ({ i, b, clave: CLAVE[b.n] || null, nombre: b.n, fechas: fechas(b), s: null }));
let ganados = new Set();
try { ganados = new Set(JSON.parse(localStorage.getItem('pat-parches') || '[]')) } catch (e) {}
const guardarParches = () => { try { localStorage.setItem('pat-parches', JSON.stringify([...ganados])) } catch (e) {} };

// Parche bordado: diseño propio. Disco de color con pespunte, dibujo simple del lugar y nombre en arco.
const TELA = ['#22375C', '#9D2F23', '#3D594F', '#58758B', '#A9561F', '#2E353E', '#182521', '#74684D'];
const DIBUJO = [
  '<path d="M38 70h44l-8 12H46z"/><path d="M60 38v30M60 40l18 26H60z" fill="none"/><path d="M34 90q6-5 13 0t13 0 13 0 13 0" fill="none"/>',                         // Buenos Aires: el barco
  '<path d="M36 78V62l12-10 12 10v16zM62 78V58l11-9 11 9v20z"/><path d="M32 88q7-5 14 0t14 0 14 0 14 0" fill="none"/>',                                               // San Martín: casas y el Lácar
  '<path d="M60 42 36 82h48z" fill="none"/><path d="M60 58 50 82h20z"/><path d="m84 40 2 5 5 1-4 3 1 5-4-3-5 3 2-5-4-3 5-1z"/>',                                   // Falkner: carpa y Año Nuevo
  '<path d="M34 62c10-12 26-14 40-4l12-8-3 12 3 12-12-8c-14 10-30 8-40-4z"/><circle cx="46" cy="60" r="2" fill="var(--f)"/>',                                        // Traful: trucha
  '<path d="M60 86V60M60 70l-10-8M60 64l9-8" fill="none"/><circle cx="60" cy="50" r="15"/><circle cx="45" cy="60" r="8"/><circle cx="74" cy="59" r="9"/>',           // La Angostura: arrayán
  '<path d="M34 84l8-34 6 20 8-34 7 30 6-20 13 38z"/><path d="M44 90h34" fill="none"/>',                                                                              // Frey: las agujas
  '<path d="M32 74 48 48l10 14 8-10 22 22z"/><path d="M34 84q7-5 13 0t13 0 13 0 13 0" fill="none"/>',                                                                 // Bariloche: cerros y el Nahuel Huapi
  '<path d="M30 82 54 40l10 16 8-8 20 34z"/><path d="M47 52l7 6 6-5 5 6" fill="none" stroke="var(--f)"/>'                                                             // Meiling: el Tronador
];
function parche(p, got) {
  const f = TELA[p.i % TELA.length], id = 'pa' + p.i + (got ? 'g' : 'n');
  return `<svg viewBox="0 0 120 120" role="img" aria-label="Parche de ${p.nombre}${got ? '' : ' (todavía no)'}" style="--f:${f}">
    <circle cx="60" cy="60" r="58" fill="#F1EADB"/><circle cx="60" cy="60" r="54" fill="${f}"/>
    <circle cx="60" cy="60" r="50.500" fill="none" stroke="#F1EADB" stroke-width="1.600" stroke-dasharray="3.200 2.400"${p.b.o ? ' opacity=".7"' : ''}/>
    <circle cx="60" cy="62" r="33" fill="#F1EADB" opacity=".12"/>
    <g fill="#F1EADB" stroke="#F1EADB" stroke-width="2.600" stroke-linejoin="round" stroke-linecap="round">${DIBUJO[p.i % DIBUJO.length]}</g>
    <path id="${id}a" d="M18 60a42 42 0 0 1 84 0" fill="none"/><path id="${id}b" d="M14 60a46 46 0 0 0 92 0" fill="none"/>
    <text font-family="'IBM Plex Mono',monospace" font-weight="600" font-size="9.500" letter-spacing="1.200" fill="#F1EADB"><textPath href="#${id}a" startOffset="50%" text-anchor="middle">${p.nombre.toUpperCase()}</textPath></text>
    <text font-family="'IBM Plex Mono',monospace" font-weight="500" font-size="8" letter-spacing=".800" fill="#F1EADB"><textPath href="#${id}b" startOffset="50%" text-anchor="middle">${p.b.o ? 'OPCIONAL' : p.fechas.toUpperCase()}</textPath></text></svg>`;
}
function pintarParches() {
  $('vparN').textContent = ganados.size + '/' + PARADAS.length;
  $('parGrid').innerHTML = PARADAS.map(p => { const got = ganados.has(p.i);
    return `<li class="${got ? 'got' : ''}"><button type="button" data-parada="${p.i}" aria-label="${p.nombre}, ${p.fechas}${got ? ', parche conseguido' : ', parche pendiente'}: abrir la ficha">${parche(p, got)}<span>${p.nombre}</span><small>${got ? p.fechas : p.b.o ? 'opcional' : 'pendiente'}</small></button></li>` }).join('');
}
function ganar(i, avisar) {
  if (ganados.has(i)) return; ganados.add(i); guardarParches(); pintarParches();
  if (avisar) { const b = $('vparBtn'); b.classList.remove('nuevo'); void b.offsetWidth; b.classList.add('nuevo'); const a = $('aviso'); if (a) a.textContent = 'Parche de ' + PARADAS[i].nombre + ' conseguido' }
}
// Ficha de una parada: los días que se pasan ahí, con todo lo del itinerario.
const usd = n => n == null || isNaN(n) ? 'a confirmar' : 'USD ' + Math.round(n).toLocaleString('es-AR');
function ficha(i) {
  const p = PARADAS[i], b = p.b, ds = diasDe(b), h = STAY[b.n] && casa(STAY[b.n]), o = OTHER[b.n];
  let html = `<header><div class="fpar">${parche(p, ganados.has(i))}</div><div><p class="kicker">Parada ${i + 1} de ${PARADAS.length}</p><h2 id="fichaT">${b.n}</h2><p class="fsub">${p.fechas}${b.o ? '' : ' · ' + b.e}</p></div></header>`;
  if (h) { const st = estado(h); html += `<div class="bloque stay"><h3>Dónde dormimos</h3><div class="nm">${h.n}<span class="gtag st ${st[1]}">${st[0]}</span></div><div class="pr"><span><b>${usd(h.tot)}</b> total</span><span><b>${usd(h.tot / VIAJE.personas)}</b> por persona</span><span>${h.src}</span></div><a href="#casas" data-go="casas" data-cerrar>Ver la casa →</a></div>` }
  else if (o) html += `<div class="bloque stay"><h3>Dónde dormimos</h3><div class="nm">${o[0]}</div><div class="pr"><span>${o[1]}</span></div>${b.n === 'La Angostura' ? '<a href="#casas" data-go="casas" data-cerrar>Ver las opciones →</a>' : ''}</div>`;
  if (b.o) html += `<div class="bloque opt"><h3>Opcional</h3><p>Solo con muy buen pronóstico, entre el 6 y el 9/1. Son 2 días: se sube y se duerme en el refugio (13 km, +1.050 m desde Pampa Linda) y se baja al día siguiente; la casa de Bariloche se mantiene.</p><dl><dt>Camino a Pampa Linda</dt><dd>Se sube de 10:30 a 14 y se baja desde las 16</dd><dt>Bariloche ⇄ Pampa Linda</dt><dd>1 h 59 · 73 km por RP82 y RN40</dd></dl><div class="links"><a href="${WG_MEILING[1]}" target="_blank" rel="noopener">${WG_MEILING[0]} ↗</a><a href="https://refugiomeiling.com/" target="_blank" rel="noopener">Refugio Otto Meiling ↗</a></div></div>`;
  html += ds.map(([d, k]) => { const L = LEGS[d.d], f = PZ[d.t];
    return `<article class="fdia"><p class="eyebrow"><span class="tag" style="background:var(--k-${d.k})">${KL[d.k]}</span><span>Día ${k + 1} · ${d.w} ${d.d}</span></p><h3>${d.t}</h3><p>${d.lead}</p>` +
      (L ? `<p class="fleg"><b>Trayecto:</b> ${L.o} → ${L.d} · ${L.t === 'a confirmar' ? 'tiempo y km a confirmar' : L.t + ' · ' + L.km + ' · ' + L.via}</p>` : '') +
      (f ? `<p class="fleg"><b>${f.no ? 'Pesca' : 'Pesca hoy'}:</b> ${f.l}. ${f.m}.</p>` : '') +
      `<ul class="acts">${d.a.map(a => `<li><span class="h">${a[0]}</span><span>${a[1]}</span></li>`).join('')}</ul>` +
      `<div class="links">${(d.l || []).map(l => `<a href="${l[1]}" target="_blank" rel="noopener">${l[0]} ↗</a>`).join('')}<a href="#itinerario" data-dia="${k}" data-cerrar>Abrir en el itinerario →</a></div></article>` }).join('');
  $('fichaC').innerHTML = html; const dlg = $('ficha'); if (!dlg.open) dlg.showModal(); dlg.scrollTop = 0;
  if (b.o) ganar(i, true);   // el parche opcional se consigue mirando su ficha
}
document.addEventListener('click', e => {
  const pb = e.target.closest('[data-parada]'); if (pb) { const d = $('parches'); if (d.open) d.close(); ficha(+pb.dataset.parada); return }
  const c = e.target.closest('[data-cerrar]'); if (c) { const d = c.closest('dialog'); if (d) d.close(); if (c.dataset.dia != null) { e.preventDefault(); select(+c.dataset.dia, false); go('itinerario') } return }
  const x = e.target.closest('dialog .dx'); if (x) x.closest('dialog').close();
});
for (const d of document.querySelectorAll('dialog.hoja')) d.addEventListener('click', e => { if (e.target === d) d.close() });   // tocar afuera cierra
$('vparBtn').onclick = () => $('parches').showModal();
$('vEmpezar').onclick = () => { ganar(0, false); window.scrollTo({ top: sec.offsetTop + innerHeight * 0.55, behavior: reduce ? 'auto' : 'smooth' }) };
$('vParadas').innerHTML = PARADAS.map(p => `<li><button type="button" data-parada="${p.i}"><b>${p.i + 1}</b><span>${p.nombre}</span><small>${p.fechas}</small></button></li>`).join('');
// datos verificados para la carga (cada uno con su fuente, ya citada en el sitio)
const SABIAS = [
  ['Para el permiso de pesca, Uruguay cuenta como país limítrofe: 10 días cuestan ARS 50.000.', 'Reglamento de Pesca Continental Patagónico 2026/27'],
  ['Al camino de Pampa Linda se entra de 10:30 a 14 y se sale desde las 16: es de mano única por horarios.', 'Itinerario · Otto Meiling'],
  ['El salmón encerrado del Traful se devuelve siempre.', 'Reglamento de Pesca Continental Patagónico 2026/27'],
  ['El sendero al Refugio Frey sale de Villa Catedral: unos 10 km y 750 m de desnivel.', 'Itinerario · 5/1']
];
{ const s = SABIAS[Math.floor(Math.random() * SABIAS.length)]; $('vSabias').innerHTML = `<b>¿Sabías que?</b> ${s[0]} <small>Fuente: ${s[1]}.</small>` }
pintarParches();

/* ---------- 3D ---------- */
function plano(motivo) { sec.classList.add('plano'); sec.dataset.motivo = motivo; $('vCarga').style.visibility = 'hidden' }
function webgl2() { try { return !!document.createElement('canvas').getContext('webgl2') } catch (e) { return false } }
async function alturas(url) {
  const bmp = await createImageBitmap(await (await fetch(url)).blob(), { colorSpaceConversion: 'none', premultiplyAlpha: 'none' });
  const cv = document.createElement('canvas'); cv.width = bmp.width; cv.height = bmp.height; const cx = cv.getContext('2d', { willReadFrequently: true }); cx.drawImage(bmp, 0, 0);
  const px = cx.getImageData(0, 0, bmp.width, bmp.height).data, d = new Float32Array(bmp.width * bmp.height);
  for (let i = 0; i < d.length; i++) d[i] = px[i * 4] * 256 + px[i * 4 + 1];
  return { w: bmp.width, h: bmp.height, d };
}
const carga = n => { $('vCargaN').textContent = n; $('vCargaB').style.transform = 'scaleX(' + n / 100 + ')' };

async function start() {
  if (/[?&]plano\b/.test(location.search)) return plano('pedido');   // ?plano en el link: versión sin 3D (sirve para probar el respaldo)
  if (reduce || saveData || lowMem || !webgl2()) return plano(reduce ? 'reduced-motion' : 'liviano');
  await new Promise(r => (window.requestIdleCallback || (f => setTimeout(f, 300)))(r, { timeout: 1500 }));
  carga(8);
  const [THREE, T] = await Promise.all([import('../vendor/three.module.min.js'), fetch('data/territorio.json').then(r => r.json())]); carga(45);
  const G = await alturas('data/territorio-alt-' + T.liviano + '.png'); carga(70); await ceder();
  // proyección local en km: x hacia el este, z hacia el sur, origen en el centro
  const W = T.km[0], H = T.km[1], X = lon => ((lon - T.w) / (T.e - T.w) - 0.5) * W, Z = lat => ((T.n - lat) / (T.n - T.s) - 0.5) * H;
  const hm = (x, z) => { const u = Math.min(G.w - 1.001, Math.max(0, (x / W + 0.5) * (G.w - 1))), v = Math.min(G.h - 1.001, Math.max(0, (z / H + 0.5) * (G.h - 1)));
    const ix = u | 0, iy = v | 0, tx = u - ix, ty = v - iy, i = iy * G.w + ix; return (G.d[i] * (1 - tx) + G.d[i + 1] * tx) * (1 - ty) + (G.d[i + G.w] * (1 - tx) + G.d[i + G.w + 1] * tx) * ty };
  const Y = (x, z) => hm(x, z) / 1000 * EX;

  const renderer = new THREE.WebGLRenderer({ canvas, antialias: !movil, alpha: false, powerPreference: 'high-performance' });
  renderer.setPixelRatio(Math.min(devicePixelRatio, movil ? 1.25 : 1.5));
  const scene = new THREE.Scene(); scene.background = new THREE.Color(COL.bruma);
  const camera = new THREE.PerspectiveCamera(38, 1, 0.3, 600);

  // lagos: máscara dibujada desde los polígonos de OpenStreetMap
  const lc = document.createElement('canvas'); lc.width = 512; lc.height = Math.round(512 * H / W); const lx = lc.getContext('2d');
  lx.fillStyle = '#000'; lx.fillRect(0, 0, lc.width, lc.height); lx.fillStyle = '#fff';
  for (const l of T.lagos) for (const pol of l.anillos) { lx.beginPath(); for (const r of pol) { r.forEach(([la, lo], i) => { const x = (X(lo) / W + 0.5) * lc.width, y = (Z(la) / H + 0.5) * lc.height; i ? lx.lineTo(x, y) : lx.moveTo(x, y) }); lx.closePath() } lx.fill('evenodd') }
  const tLagos = new THREE.CanvasTexture(lc); tLagos.flipY = false; tLagos.colorSpace = THREE.NoColorSpace;

  // relieve: una grilla con el color calculado por altura (bosque al oeste, estepa al este, roca y nieve arriba) y curvas de nivel, como un mapa impreso
  const NX = movil ? 161 : 322, NZ = Math.round(NX * G.h / G.w), pos = new Float32Array(NX * NZ * 3), uv = new Float32Array(NX * NZ * 2);
  for (let j = 0, k = 0, q = 0; j < NZ; j++) for (let i = 0; i < NX; i++) { const x = (i / (NX - 1) - 0.5) * W, z = (j / (NZ - 1) - 0.5) * H; pos[k++] = x; pos[k++] = Y(x, z); pos[k++] = z; uv[q++] = i / (NX - 1); uv[q++] = j / (NZ - 1) }
  const idx = new Uint32Array((NX - 1) * (NZ - 1) * 6);
  for (let j = 0, k = 0; j < NZ - 1; j++) for (let i = 0; i < NX - 1; i++) { const a = j * NX + i, b = a + 1, c = a + NX, d = c + 1; idx[k++] = a; idx[k++] = c; idx[k++] = b; idx[k++] = b; idx[k++] = c; idx[k++] = d }
  const geo = new THREE.BufferGeometry(); geo.setAttribute('position', new THREE.BufferAttribute(pos, 3)); geo.setAttribute('uv', new THREE.BufferAttribute(uv, 2)); geo.setIndex(new THREE.BufferAttribute(idx, 1));
  await ceder(); geo.computeVertexNormals(); carga(85); await ceder();
  const c3 = h => new THREE.Color(h);
  const suelo = new THREE.Mesh(geo, new THREE.ShaderMaterial({
    uniforms: { tL: { value: tLagos }, ex: { value: EX }, fogK: { value: 0.0105 }, bruma: { value: c3(COL.bruma) }, sol: { value: new THREE.Vector3(-0.55, 0.62, -0.56).normalize() },
      cBosque: { value: c3('#4B6A55') }, cBosque2: { value: c3('#2F4A3F') }, cEstepa: { value: c3('#D2B57E') }, cEstepa2: { value: c3('#B79B6C') }, cRoca: { value: c3('#8D8F8C') }, cNieve: { value: c3('#F4F7F9') }, cAgua: { value: c3('#2B4A73') }, cTinta: { value: c3('#3A4650') } },
    vertexShader: `varying vec3 vW; varying vec3 vN; varying vec2 vUv; void main(){ vUv = uv; vN = normal; vec4 w = modelMatrix * vec4(position,1.0); vW = w.xyz; gl_Position = projectionMatrix * viewMatrix * w; }`,
    fragmentShader: `precision highp float; uniform sampler2D tL; uniform float ex, fogK; uniform vec3 bruma, sol, cBosque, cBosque2, cEstepa, cEstepa2, cRoca, cNieve, cAgua, cTinta; varying vec3 vW, vN; varying vec2 vUv;
      void main(){ float h = vW.y / ex * 1000.0; vec3 N = normalize(vN); float pend = 1.0 - N.y;
        float este = smoothstep(0.42, 0.80, vUv.x + (h - 900.0) * -0.00012);            // la estepa empieza al este y en lo bajo
        vec3 c = mix(mix(cBosque2, cBosque, smoothstep(600.0, 1300.0, h)), mix(cEstepa2, cEstepa, smoothstep(600.0, 1100.0, h)), este);
        c = mix(c, cRoca, smoothstep(1550.0, 1850.0, h + pend * 160.0));
        c = mix(c, cNieve, smoothstep(1900.0, 2150.0, h - pend * 350.0));
        float luz = 0.52 + 0.62 * max(dot(N, sol), 0.0); c *= luz;
        float cu = h / 200.0, a = fwidth(cu), linea = 1.0 - smoothstep(0.0, a * 1.4, abs(fract(cu - 0.5) - 0.5));   // curvas de nivel cada 200 m
        c = mix(c, cTinta, linea * 0.16 * (1.0 - smoothstep(0.02, 0.09, a)));
        float agua = texture2D(tL, vUv).r; c = mix(c, cAgua * (0.92 + 0.08 * sin(vW.x * 3.0 + vW.z * 2.0)), smoothstep(0.35, 0.6, agua));
        float d = distance(vW, cameraPosition), f = 1.0 - exp(-pow(d * fogK, 2.2));
        float borde = min(min(vUv.x, 1.0 - vUv.x), min(vUv.y, 1.0 - vUv.y)); f = max(f, 1.0 - smoothstep(0.0, 0.07, borde));   // los bordes del territorio se funden con la bruma
        gl_FragColor = vec4(mix(c, bruma, clamp(f, 0.0, 1.0)), 1.0);
        #include <colorspace_fragment>
      }`
  }));
  scene.add(suelo);

  // recorrido: tramos en auto + sendero al Frey (ida y vuelta) + tramo final a Bariloche
  const L = T.lugares, d2 = (a, b) => Math.hypot(a[0] - b[0], (a[1] - b[1]) * 0.76);
  let frey = T.senderos.find(s => s.name === 'frey').pts.slice(); const cat = [L.catedral.lat, L.catedral.lon];
  if (d2(frey[0], cat) > d2(frey[frey.length - 1], cat)) frey.reverse();
  const tramos = [...T.rutas.ruta.slice(0, 5).map(p => ({ p, modo: 0 })), { p: frey, modo: 1 }, { p: frey.slice().reverse(), modo: 1 }, { p: T.rutas.ruta[5], modo: 0 }];
  // qué muestra el cartel en cada tramo y a qué parada llega
  const INFO = [['28/12', 2, null], ['30/12', 2, null], ['1/1', 3, null], ['3/1', 4, null], ['5/1', null, null], [null, 5, 'A pie · 5/1 · Villa Catedral → Refugio Frey · ≈10 km · +750 m'], [null, null, 'A pie · 6/1 · bajada del Frey · ≈3 h'], ['6/1', 6, null]];
  INFO[0][1] = 1;
  const P = [], D = [], M = [], cortes = [0]; let acc = 0;
  for (const t of tramos) {
    for (let i = 0; i < t.p.length; i++) { const x = X(t.p[i][1]), z = Z(t.p[i][0]);
      if (P.length) { const a = P[P.length - 1], n = Math.max(1, Math.ceil(Math.hypot(x - a.x, z - a.z) / 0.18));
        for (let k = 1; k <= n; k++) { const px = a.x + (x - a.x) * k / n, pz = a.z + (z - a.z) * k / n, v = new THREE.Vector3(px, 0, pz); acc += Math.hypot(v.x - P[P.length - 1].x, v.z - P[P.length - 1].z); P.push(v); D.push(acc); M.push(t.modo) } }
      else { P.push(new THREE.Vector3(x, 0, z)); D.push(0); M.push(t.modo) } }
    cortes.push(acc);
  }
  // el camino se apoya en el relieve, suavizado para que no serruche
  for (let i = 0; i < P.length; i++) P[i].y = Y(P[i].x, P[i].z) + 0.06;
  const TOTAL = acc;
  INFO.forEach((inf, i) => { if (inf[1] != null) PARADAS[inf[1]].s = cortes[i + 1] });
  PARADAS[0].s = 0;   // Buenos Aires queda fuera del mapa: su parche se consigue al empezar
  const en = (s, out) => { s = Math.min(TOTAL, Math.max(0, s)); let a = 0, b = D.length - 1; while (b - a > 1) { const m = (a + b) >> 1; D[m] <= s ? a = m : b = m } const t = (s - D[a]) / ((D[b] - D[a]) || 1); return out.lerpVectors(P[a], P[b], t) };
  const modoEn = s => { let a = 0, b = D.length - 1; while (b - a > 1) { const m = (a + b) >> 1; D[m] <= s ? a = m : b = m } return M[b] };

  // cintas de ancho fijo en pantalla (ruta, senderos)
  const cintaMat = (color, ancho, punteado, alfa) => new THREE.ShaderMaterial({ transparent: true, depthWrite: false, side: THREE.DoubleSide, polygonOffset: true, polygonOffsetFactor: -4, polygonOffsetUnits: -8,
    uniforms: { res: { value: new THREE.Vector2(1, 1) }, wpx: { value: ancho }, col: { value: c3(color) }, col2: { value: c3(COL.nieve) }, prog: { value: 1e9 }, alfa: { value: alfa }, pt: { value: punteado } },
    vertexShader: `attribute vec3 prev; attribute vec3 next; attribute float side; attribute float dist; attribute float modo; uniform vec2 res; uniform float wpx; varying float vD; varying float vM;
      void main(){ mat4 m = projectionMatrix * viewMatrix; vec4 c = m * vec4(position,1.0), a = m * vec4(prev,1.0), b = m * vec4(next,1.0);
        float asp = res.x / res.y; vec2 d = (b.xy / b.w - a.xy / a.w) * vec2(asp, 1.0); d = length(d) > 1e-6 ? normalize(d) : vec2(1.0, 0.0); vec2 n = vec2(-d.y, d.x); n.x /= asp;
        c.xy += n * side * wpx / res.y * c.w; vD = dist; vM = modo; gl_Position = c; }`,
    fragmentShader: `uniform vec3 col, col2; uniform float prog, alfa, pt; varying float vD; varying float vM;
      void main(){ if ((vM > 0.5 || pt > 0.5) && mod(vD, 0.42) > 0.24) discard; bool hecho = vD <= prog; gl_FragColor = vec4(hecho ? col : col2, hecho ? alfa : alfa * 0.8);
        #include <colorspace_fragment>
      }` });
  function cinta(pts, dist, modos, mat) {
    const n = pts.length, po = new Float32Array(n * 6), pr = new Float32Array(n * 6), nx = new Float32Array(n * 6), sd = new Float32Array(n * 2), di = new Float32Array(n * 2), mo = new Float32Array(n * 2);
    for (let i = 0; i < n; i++) { const a = pts[Math.max(0, i - 1)], b = pts[Math.min(n - 1, i + 1)];
      for (let k = 0; k < 2; k++) { const o = (i * 2 + k) * 3; po[o] = pts[i].x; po[o + 1] = pts[i].y; po[o + 2] = pts[i].z; pr[o] = a.x; pr[o + 1] = a.y; pr[o + 2] = a.z; nx[o] = b.x; nx[o + 1] = b.y; nx[o + 2] = b.z; sd[i * 2 + k] = k ? 1 : -1; di[i * 2 + k] = dist[i]; mo[i * 2 + k] = modos ? modos[i] : 0 } }
    const ix = []; for (let i = 0; i < n - 1; i++) { const a = i * 2; ix.push(a, a + 1, a + 2, a + 1, a + 3, a + 2) }
    const g = new THREE.BufferGeometry(); for (const [k, v, s] of [['position', po, 3], ['prev', pr, 3], ['next', nx, 3], ['side', sd, 1], ['dist', di, 1], ['modo', mo, 1]]) g.setAttribute(k, new THREE.BufferAttribute(v, s)); g.setIndex(ix);
    const m = new THREE.Mesh(g, mat); m.frustumCulled = false; m.renderOrder = 3; scene.add(m); return m;
  }
  const mRuta = cintaMat(COL.polar, movil ? 5.5 : 5, 0, 1), mOpc = cintaMat('#74684D', 3.5, 1, 0.95);
  cinta(P, D, M, mRuta);
  const extra = pts => { const v = [], dd = []; let a = 0; pts.filter(([la, lo]) => la < T.n - 0.02 && la > T.s + 0.02 && lo > T.w + 0.02 && lo < T.e - 0.02).forEach(([la, lo], i) => { const x = X(lo), z = Z(la), q = new THREE.Vector3(x, Y(x, z) + 0.05, z); if (i) a += q.distanceTo(v[v.length - 1]); v.push(q); dd.push(a) }); return [v, dd] };
  cinta(...extra(T.rutas.opc[0]), null, mOpc);                                      // opcional: Bariloche ⇄ Pampa Linda
  cinta(...extra(T.senderos.find(s => s.name === 'meiling').pts), null, mOpc);      // opcional: sendero al Meiling
  await ceder();

  // los dos Citroën Basalt alquilados, en versión de juguete (cajas): uno claro y uno gris, sin marca
  function auto(color) {
    const g = new THREE.Group(), mat = c => new THREE.MeshLambertMaterial({ color: c });
    const caja = (w, h, l, c, y, z) => { const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, l), mat(c)); m.position.set(0, y, z); g.add(m); return m };
    caja(0.46, 0.2, 1.0, color, 0.24, 0); caja(0.42, 0.17, 0.52, color, 0.42, -0.08); caja(0.43, 0.12, 0.5, '#1D2630', 0.42, -0.08).scale.set(1, 1, 0.92);
    caja(0.47, 0.06, 0.1, '#1D2630', 0.2, 0.47); caja(0.3, 0.04, 0.04, '#9D2F23', 0.27, -0.5);
    for (const [x, z] of [[-0.24, 0.3], [0.24, 0.3], [-0.24, -0.3], [0.24, -0.3]]) { const r = new THREE.Mesh(new THREE.CylinderGeometry(0.11, 0.11, 0.08, 12), mat('#131A22')); r.rotation.z = Math.PI / 2; r.position.set(x, 0.11, z); g.add(r) }
    g.scale.setScalar(movil ? 1.05 : 0.9); scene.add(g); return g;
  }
  scene.add(new THREE.HemisphereLight('#EAF2F8', '#6B6A5A', 1.5)); const dl = new THREE.DirectionalLight('#FFE9C9', 1.6); dl.position.set(-5, 8, -5); scene.add(dl);
  const autos = [auto('#EEF2F5'), auto('#7E8C97')];
  const caminante = new THREE.Mesh(new THREE.SphereGeometry(0.22, 16, 12), new THREE.MeshBasicMaterial({ color: COL.polar })); scene.add(caminante);
  const aro = new THREE.Mesh(new THREE.RingGeometry(0.3, 0.42, 24), new THREE.MeshBasicMaterial({ color: COL.nieve, side: THREE.DoubleSide, transparent: true, opacity: 0.9, depthTest: false })); aro.rotation.x = -Math.PI / 2; aro.renderOrder = 4; scene.add(aro);

  // carteles de las paradas (botones HTML que siguen su punto en el mapa)
  const pines = PARADAS.filter(p => p.clave && L[p.clave]).map(p => { const l = L[p.clave], x = X(l.lon), z = Z(l.lat), el = document.createElement('button');
    el.type = 'button'; el.className = 'vpin' + (p.b.o ? ' opc' : ''); el.dataset.parada = p.i; el.innerHTML = `<i>${p.i + 1}</i><span><b>${p.nombre}</b><small>${p.fechas}</small></span>`; stage.appendChild(el);
    return { p, el, v: new THREE.Vector3(x, Y(x, z) + 0.5, z) } });
  { const l = L.chapelco, x = X(l.lon), z = Z(l.lat), el = document.createElement('div'); el.className = 'vpin info'; el.innerHTML = '<i>✈</i><span><b>Aeropuerto Chapelco</b><small>llegada 28/12, 9:09</small></span>'; stage.appendChild(el); pines.push({ p: null, el, v: new THREE.Vector3(x, Y(x, z) + 0.5, z) }) }

  function resize() { const w = stage.clientWidth, h = stage.clientHeight; renderer.setSize(w, h, false); camera.aspect = w / h; camera.fov = w < h ? 50 : 38; camera.updateProjectionMatrix(); mRuta.uniforms.res.value.set(w, h); mOpc.uniforms.res.value.set(w, h) }
  addEventListener('resize', resize); resize();

  const progreso = () => { const r = sec.getBoundingClientRect(), span = sec.offsetHeight - stage.offsetHeight; return span > 0 ? Math.min(1, Math.max(0, -r.top / span)) : 0 };
  // el primer 6 % del scroll es la portada (vista de todo el territorio); después el auto recorre la ruta
  const INI = 0.06, sDe = p => Math.max(0, (p - INI) / (1 - INI)) * TOTAL;
  let mostrado = progreso(), vel = 0, visible = true, corriendo = false, ultimo = performance.now(), tramoAct = -2, maxS = -1;
  const a = new THREE.Vector3(), b = new THREE.Vector3(), dir = new THREE.Vector3(0, 0, 1), cam = new THREE.Vector3(), mira = new THREE.Vector3(), v = new THREE.Vector3(), camS = new THREE.Vector3(), miraS = new THREE.Vector3(); let primera = true;
  const cartel = $('vTramo'), llegada = $('vLlegada');
  function hud(s, p) {
    let t = -1; if (p > INI * 0.6) { t = 0; while (t < cortes.length - 2 && s > cortes[t + 1] - 1e-3) t++ }
    if (t !== tramoAct) { tramoAct = t;
      if (t < 0) cartel.hidden = true; else { const inf = INFO[t], Lg = inf[0] && LEGS[inf[0]]; cartel.hidden = false;
        cartel.innerHTML = inf[2] ? `<small>Sendero</small><b>${inf[2].split(' · ').slice(2, 3)}</b><span>${inf[2].split(' · ').filter((_, i) => i !== 2).join(' · ')}</span>`
          : `<small>En auto · ${inf[0]}</small><b>${Lg.o} → ${Lg.d}</b><span>${Lg.t === 'a confirmar' ? 'tiempo y km a confirmar' : Lg.t + ' · ' + Lg.km + ' · ' + Lg.via}</span>` } }
    if (s > maxS) { maxS = s; for (const q of PARADAS) if (q.s != null && !q.b.o && s >= q.s - 0.4 && p > INI * 0.6) ganar(q.i, true) }
    const cerca = p > INI && PARADAS.find(q => q.s != null && q.s > 0 && Math.abs(s - q.s) < 2.2);
    if (cerca) { if (llegada.dataset.i !== String(cerca.i)) { llegada.dataset.i = cerca.i; llegada.innerHTML = `<small>Parada ${cerca.i + 1}</small><b>${cerca.nombre}</b><span>${cerca.fechas}</span><button type="button" data-parada="${cerca.i}">Ver la ficha</button>` } llegada.hidden = false }
    else llegada.hidden = true;
  }
  function cuadro(ahora) {
    if (!visible || document.hidden) { corriendo = false; return }
    const dt = Math.min(0.1, (ahora - ultimo) / 1000); ultimo = ahora;
    const ac = 10 * (progreso() - mostrado) - 6.3 * vel; vel += ac * dt; mostrado = Math.min(1, Math.max(0, mostrado + vel * dt));
    const s = sDe(mostrado), k = Math.min(1, mostrado / INI), apie = modoEn(s) === 1;
    en(s, a); en(s + 1.2, b); v.subVectors(b, a); v.y = 0; if (v.lengthSq() > 1e-6) dir.lerp(v.normalize(), Math.min(1, dt * 2.2)).normalize();
    // cámara: de la vista general (arriba, mirando al sur) a seguir al auto desde atrás
    const vertical = camera.aspect < 1, lejos = vertical ? 13.5 : 10.5, alto = vertical ? 8.5 : 6.2;
    cam.copy(a).addScaledVector(dir, -lejos * (apie ? 0.62 : 1)); cam.y = a.y + alto * (apie ? 0.7 : 1); mira.copy(a).addScaledVector(dir, 2.2);
    const e = k * k * (3 - 2 * k);
    // vista de portada: desde el norte, alto, con todo el recorrido perdiéndose hacia el sur
    cam.lerpVectors(v.set(W * 0.1, vertical ? 62 : 44, -H / 2 - (vertical ? 46 : 30)), cam, e); mira.lerpVectors(v.set(-W * 0.04, 0, -H * 0.12), mira, e);
    cam.y = Math.max(cam.y, Y(cam.x, cam.z) + 1.4);
    suelo.material.uniforms.fogK.value = 0.0042 + (0.0105 - 0.0042) * e;   // en la portada hay menos bruma para que se vea todo el territorio
    if (primera) { camS.copy(cam); miraS.copy(mira); primera = false } else { const f = Math.min(1, dt * 3.2); camS.lerp(cam, f); miraS.lerp(mira, f) }
    camera.position.copy(camS); camera.lookAt(miraS);
    // autos y caminante
    autos.forEach((g, i) => { const sa = apie ? cortes[5] - (i ? 0.9 : 0) : Math.max(0, s - i * 0.95); en(sa, g.position); en(sa + 0.4, b); g.position.y = Y(g.position.x, g.position.z) + 0.02; g.lookAt(b.x, g.position.y + (b.y - g.position.y) * 0.6, b.z); g.visible = mostrado > INI * 0.5 });
    caminante.visible = apie; if (apie) { caminante.position.copy(a); caminante.position.y += 0.25 }
    aro.position.copy(a); aro.position.y += 0.03; aro.visible = mostrado > INI * 0.5; aro.scale.setScalar(1 + 0.12 * Math.sin(ahora / 400));
    mRuta.uniforms.prog.value = mostrado > INI * 0.5 ? s : -1;
    renderer.render(scene, camera);
    // carteles
    const Wp = stage.clientWidth, Hp = stage.clientHeight;
    for (const pn of pines) { v.copy(pn.v).project(camera); const x = (v.x * 0.5 + 0.5) * Wp, y = (-v.y * 0.5 + 0.5) * Hp, dist = camera.position.distanceTo(pn.v);
      const ok = v.z < 1 && x > 8 && x < Wp - 8 && y > 54 && y < Hp - 20 && dist < (k < 1 ? 400 : 62);
      pn.el.style.display = ok ? '' : 'none'; if (!ok) continue;
      pn.el.style.transform = `translate(${x.toFixed(1)}px,${y.toFixed(1)}px)`; pn.el.classList.toggle('lejos', k >= 1 && dist > 30); pn.el.classList.toggle('izq', x > Wp * 0.62);
      if (pn.p) pn.el.classList.toggle('hecho', ganados.has(pn.p.i)) }
    hud(s, mostrado); sec.style.setProperty('--p', mostrado.toFixed(3)); sec.classList.toggle('andando', mostrado > 0.05);
    requestAnimationFrame(cuadro);
  }
  const andar = () => { if (!corriendo) { corriendo = true; ultimo = performance.now(); requestAnimationFrame(cuadro) } };
  new IntersectionObserver(es => { visible = es[0].isIntersecting; if (visible) andar() }).observe(sec);
  document.addEventListener('visibilitychange', () => { if (!document.hidden) andar() });
  carga(100); sec.classList.add('vivo'); $('vCarga').style.visibility = 'hidden'; andar();
  window.__viaje = { TOTAL, cortes, PARADAS };
}
start().catch(e => { console.warn('Recorrido 3D: queda la portada fija', e); plano('error') });
