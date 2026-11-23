/* Patagonia 2027 · lógica de la página. Los datos están en js/datos.js; acá solo se dibujan.
   Orden: utilidades · fotos · itinerario · ilustraciones · casas · gastos · pesca · resumen · mapa · navegación · visor · sin conexión */
'use strict';
const $ = id => document.getElementById(id);
const N = VIAJE.personas;
const sinMov = () => matchMedia('(prefers-reduced-motion: reduce)').matches;
function load(k, d) { try { return localStorage.getItem(k) ?? d } catch (e) { return d } }
function save(k, v) { try { localStorage.setItem(k, v) } catch (e) {} }
const usd = n => n == null || isNaN(n) ? 'a confirmar' : 'USD ' + Math.round(n).toLocaleString('es-AR');
const noches = n => n + (n === 1 ? ' noche' : ' noches');
const avisar = t => { const a = $('aviso'); if (a) a.textContent = t };
const casa = n => { for (const c of CITIES) for (const h of c.h) if (h.n === n) return h };
const estado = h => h.star && h.star.startsWith('Confirmada') ? ['Confirmada', 'ok'] : h.star && h.star.startsWith('Primera') ? ['Primera opción', 'op'] : ['Elegida', ''];
/* noches en cada base, según el itinerario */
const BB = BASES.filter(b => !b.o);
const nochesEn = nombre => { const i = BB.findIndex(b => b.n === nombre); return i < 0 ? 0 : (i < BB.length - 1 ? BB[i + 1].d : DAYS.length - 1) - BB[i].d };

/* ---------- fotos: recorte en el servidor según el punto de interés, con srcset ---------- */
const CLD = 'https://res.cloudinary.com/wdfk5jij/image/upload/';
function fotoUrl(f, w, ar) {
  if (f.c) return CLD + 'f_auto,q_auto,c_fill,ar_' + ar + ',w_' + w + '/' + f.c;
  return 'https://images.unsplash.com/photo-' + f.u + '?w=' + w + '&q=70&auto=format&fit=crop&ar=' + ar + '&crop=focalpoint&fp-x=' + (f.fx ?? .5) + '&fp-y=' + (f.fy ?? .5);
}
function ponerFoto(img, f, ar, sizes, anchos) {
  img.crossOrigin = 'anonymous';
  img.srcset = anchos.map(w => fotoUrl(f, w, ar) + ' ' + w + 'w').join(',');
  img.sizes = sizes; img.src = fotoUrl(f, anchos[1] || anchos[0], ar); img.alt = f.alt || '';
}

/* ---------- itinerario ---------- */
const tl = $('tl'), route = $('route');
let cur = Math.min(DAYS.length - 1, Math.max(0, parseInt(load('pat-day', '0')) || 0)), filtro = 'all';
const anio = d => d.d.endsWith('/12') ? '/2026' : '/2027';
function baseOf(i) { let b = 0; BASES.forEach((x, j) => { if (!x.o && i >= x.d) b = j }); return i === DAYS.length - 1 ? -1 : b }
function build() {
  route.innerHTML = ''; tl.innerHTML = '';
  BASES.forEach((b, i) => {
    const el = document.createElement('button'); el.type = 'button'; el.className = 'base' + (b.o ? ' opc' : '');
    el.innerHTML = `<i aria-hidden="true">${i + 1}</i><span>${b.n}</span><em>${b.e}</em>`; el.onclick = () => select(b.d, true); route.appendChild(el);
  });
  DAYS.forEach((d, i) => {
    const li = document.createElement('li'), b = document.createElement('button'); b.type = 'button'; b.className = 'day'; b.dataset.i = i;
    b.innerHTML = `<span class="d">${d.d}</span><span class="pin k-${d.k}" aria-hidden="true"></span><span><span class="t">${d.t}</span><span class="s">${d.s}</span><span class="sr-only"> · ${KL[d.k]}</span></span>`;
    b.onclick = () => select(i, true); li.appendChild(b); tl.appendChild(li);
  });
}
document.querySelectorAll('#view-itin .chip').forEach(c => c.onclick = () => {
  filtro = c.dataset.k;
  document.querySelectorAll('#view-itin .chip').forEach(x => x.setAttribute('aria-pressed', x === c));
  tl.querySelectorAll('.day').forEach(x => x.classList.toggle('dim', filtro !== 'all' && DAYS[x.dataset.i].k !== filtro));
});
$('prev').onclick = () => select(cur - 1, true);
$('next').onclick = () => select(cur + 1, true);

function renderStay(i, d) {
  const el = $('stay');
  if (d.k === 'fly') { el.innerHTML = ''; return }
  const bi = baseOf(i), bn = bi < 0 ? '' : BASES[bi].n, hn = STAY[bn];
  if (hn) {
    const h = casa(hn), st = estado(h), n = nochesEn(bn);
    el.innerHTML = `<div class="bloque stay"><h3>Dónde dormimos</h3><div class="nm">${h.n}<span class="gtag st ${st[1]}">${st[0]}</span></div><div class="pr"><span><b>${usd(h.tot)}</b> total</span><span><b>${usd(h.tot == null ? null : h.tot / N)}</b> por persona</span><span>${noches(n)} · ${h.src}</span></div><a href="#casas" data-go="casas">Ver la casa →</a></div>`;
    return;
  }
  const o = OTHER[bn];
  el.innerHTML = o ? `<div class="bloque stay"><h3>Dónde dormimos</h3><div class="nm">${o[0]}</div><div class="pr"><span>${o[1]}</span></div>${bn === 'La Angostura' ? '<a href="#casas" data-go="casas">Ver las opciones →</a>' : ''}</div>` : '';
}
/* trayecto del día: mapa de Google embebido (URL directa de /maps/embed: anda igual en el celular) */
const qp = n => QP[n] || n + ', Argentina';
const lugar = s => encodeURIComponent(s).replace(/%20/g, '+').replace(/%2C/g, ',');   // mismo formato que usa Google al redirigir
const mapaEmbed = (o, d) => 'https://www.google.com/maps/embed?origin=mfe&pb=!1m6!4m4!4m1!2s' + lugar(qp(o)) + '!4m1!2s' + lugar(qp(d)) + '!5e0!3m1!1ses!5m1!1ses';
const mapaLink = (o, d) => 'https://www.google.com/maps/dir/?api=1&origin=' + encodeURIComponent(qp(o)) + '&destination=' + encodeURIComponent(qp(d)) + '&travelmode=driving';
let legObs = null;
function renderLeg(d) {
  const el = $('leg'), L = LEGS[d.d];
  if (legObs) { legObs.disconnect(); legObs = null }
  if (!L) { el.innerHTML = ''; el.hidden = true; return }
  el.hidden = false;
  const falta = L.t === 'a confirmar';
  el.innerHTML = `<h3>Trayecto del día</h3><div class="nm">${L.o} → ${L.d}</div><div class="nums">${falta ? '<span><b>Tiempo, km y ruta: a confirmar</b></span>' : `<span><b>${L.t}</b> manejando</span><span><b>${L.km}</b></span><span>por ${L.via}</span>`}</div><div class="mapa-g"></div>` +
    `<p class="src">${falta ? '' : 'Tiempo y distancia de Google Maps, sin tráfico ni paradas. '}<a href="${mapaLink(L.o, L.d)}" target="_blank" rel="noopener">Abrir en Google Maps ↗</a></p>`;
  const caja = el.querySelector('.mapa-g');
  const poner = () => {
    if (!navigator.onLine) { caja.innerHTML = '<p class="sinmapa">Sin conexión: el mapa de Google no se puede cargar.</p>'; return }
    caja.innerHTML = `<iframe title="Mapa del trayecto: ${L.o} a ${L.d}" allowfullscreen referrerpolicy="no-referrer-when-downgrade" src="${mapaEmbed(L.o, L.d)}"></iframe>`;
  };
  // el mapa se pide recién cuando el bloque está por entrar en pantalla (no frena la carga del itinerario)
  if ('IntersectionObserver' in window) { legObs = new IntersectionObserver(es => { if (es.some(e => e.isIntersecting)) { legObs.disconnect(); legObs = null; poner() } }, { rootMargin: '300px' }); legObs.observe(el) } else poner();
}
function renderFish(d) {
  const el = $('fish'), f = PZ[d.t];
  if (!f) { el.hidden = true; el.innerHTML = ''; return }
  el.hidden = false; el.classList.toggle('no', !!f.no);
  el.innerHTML = `<h3>${f.no ? 'Pesca' : 'Pesca hoy'}</h3><div class="nm">${f.l}</div><dl><dt>Modalidad</dt><dd>${f.m}</dd><dt>Horario</dt><dd>${f.h}</dd><dt>Reglas</dt><dd>${f.r}</dd></dl><a href="#pesca" data-go="pesca">Permiso, reglas y equipo →</a>`;
}
function renderOpt(d) {
  const el = $('opt');
  if (!d.opt) { el.hidden = true; el.innerHTML = ''; return }
  el.hidden = false;
  el.innerHTML = `<h3>Opcional: Otto Meiling</h3><p>Solo con muy buen pronóstico. Son 2 días: se sube y se duerme en el refugio (13 km, +1.050 m desde Pampa Linda) y se baja al día siguiente; la casa de Bariloche se mantiene.</p>` +
    `<dl><dt>Camino a Pampa Linda</dt><dd>Se sube de 10:30 a 14 y se baja desde las 16</dd><dt>Bariloche ⇄ Pampa Linda</dt><dd>1 h 59 · 73 km por RP82 y RN40</dd><dt>Reemplaza</dt><dd>${d.opt}</dd></dl>` +
    `<div class="links"><a href="${WG_MEILING[1]}" target="_blank" rel="noopener">${WG_MEILING[0]} ↗</a><a href="https://refugiomeiling.com/" target="_blank" rel="noopener">Refugio Otto Meiling ↗</a></div>`;
}
function select(i, user) {
  if (i < 0 || i >= DAYS.length) return;
  cur = i; save('pat-day', i); const d = DAYS[i];
  tl.querySelectorAll('.day').forEach(x => { const on = +x.dataset.i === i; x.classList.toggle('on', on); if (on) x.setAttribute('aria-current', 'true'); else x.removeAttribute('aria-current') });
  const bi = baseOf(i); route.querySelectorAll('.base').forEach((x, j) => { x.classList.toggle('on', j === bi); if (j === bi) x.setAttribute('aria-current', 'true'); else x.removeAttribute('aria-current') });
  const ob = route.querySelector('.base.on'); if (ob) route.scrollTo({ left: ob.offsetLeft - route.clientWidth / 2 + ob.clientWidth / 2, behavior: user && !sinMov() ? 'smooth' : 'auto' });
  $('eb').innerHTML = `<span class="tag" style="background:var(--k-${d.k})">${KL[d.k]}</span><span>Día ${i + 1} · ${d.w} ${d.d}</span>`;
  $('ttl').textContent = d.t; $('lead').textContent = d.lead;
  $('stats').innerHTML = d.st.map(s => `<div class="stat"><dt>${s[0]}</dt><dd>${s[1]}</dd></div>`).join('');
  $('acts').innerHTML = d.a.map(a => `<li><span class="h">${a[0]}</span><span>${a[1]}</span></li>`).join('');
  renderStay(i, d); renderLeg(d); renderFish(d); renderOpt(d);
  $('links').innerHTML = (d.l || []).map(l => `<a href="${l[1]}" target="_blank" rel="noopener">${l[0]} ↗</a>`).join('');
  $('prev').disabled = i === 0; $('next').disabled = i === DAYS.length - 1;
  const cv = $('scene'), pw = $('phwrap'), img = $('photo'), f = FOTOS[d.t];
  cv.setAttribute('aria-label', 'Ilustración: ' + d.t);
  const dibujo = () => { pw.hidden = true; cv.hidden = false; draw(d.sc) };
  if (f) {
    img.onerror = dibujo;
    ponerFoto(img, f, '3:2', '(max-width: 820px) 100vw, 740px', [480, 800, 1200, 1600]);
    $('cred').textContent = d.t + ' · ' + d.w + ' ' + d.d + anio(d) + ' · Foto: ' + (f.cred || 'Unsplash');
    pw.hidden = false; cv.hidden = true;
  } else dibujo();
  if (user) {
    avisar('Día ' + (i + 1) + ', ' + d.w + ' ' + d.d + ': ' + d.t);
    if (innerWidth <= 820) $('panel').scrollIntoView({ behavior: sinMov() ? 'auto' : 'smooth', block: 'start' });
  }
}

/* ---------- ilustraciones generativas (se usan si un día no tiene foto o la foto no carga, por ejemplo sin conexión) ---------- */
function rng(s) { return () => { s = (s * 16807) % 2147483647; return (s - 1) / 2147483646 } }
const SKY = { day: ['#85A8C3', '#DCE7EE'], dusk: ['#3d4d7a', '#D8B273'], night: ['#131A22', '#2E3F5C'], dawn: ['#58758B', '#E9C48F'] };
function ridge(ctx, r, W, H, base, amp, col, rough, snow) {
  const pts = []; let y = base; const n = 60;
  for (let i = 0; i <= n; i++) { const x = i / n * W; y = base - amp * (0.5 + 0.5 * Math.sin(i * rough + r() * 2)) * (.55 + r() * .45); pts.push([x, y]) }
  for (let k = 0; k < 2; k++) for (let i = 1; i < pts.length - 1; i++) pts[i][1] = (pts[i - 1][1] + pts[i][1] * 2 + pts[i + 1][1]) / 4;
  ctx.beginPath(); ctx.moveTo(0, H); pts.forEach(p => ctx.lineTo(p[0], p[1])); ctx.lineTo(W, H); ctx.closePath(); ctx.fillStyle = col; ctx.fill();
  if (snow) { ctx.save(); ctx.clip(); ctx.fillStyle = 'rgba(255,255,255,.88)'; ctx.beginPath(); ctx.moveTo(0, 0);
    pts.forEach(p => ctx.lineTo(p[0], Math.min(p[1] + amp * snow, base - amp * .55))); ctx.lineTo(W, 0); ctx.closePath();
    ctx.globalCompositeOperation = 'source-atop'; ctx.fill(); ctx.restore() }
  return pts;
}
function trees(ctx, r, W, y0, y1, col, count, size) { ctx.fillStyle = col;
  for (let i = 0; i < count; i++) { const x = r() * W, y = y0 + r() * (y1 - y0), h = size * (.6 + r() * .8);
    ctx.beginPath(); ctx.moveTo(x, y - h); ctx.lineTo(x - h * .28, y); ctx.lineTo(x + h * .28, y); ctx.closePath(); ctx.fill() } }
function draw(sc) {
  const cv = $('scene'), ctx = cv.getContext('2d'), W = cv.width, H = cv.height, r = rng(sc.seed * 9973);
  const s = SKY[sc.sky]; let g = ctx.createLinearGradient(0, 0, 0, H * .6); g.addColorStop(0, s[0]); g.addColorStop(1, s[1]); ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
  if (sc.sky === 'night') { ctx.fillStyle = '#fff'; for (let i = 0; i < 160; i++) { ctx.globalAlpha = r() * .8 + .2; ctx.fillRect(r() * W, r() * H * .5, r() * 2 + .5, r() * 2 + .5) } ctx.globalAlpha = 1;
    ctx.fillStyle = '#F2F6F9'; ctx.beginPath(); ctx.arc(W * .8, H * .16, 26, 0, 7); ctx.fill() }
  else { ctx.fillStyle = sc.sky === 'day' ? 'rgba(255,255,245,.9)' : 'rgba(255,226,184,.9)'; ctx.beginPath(); ctx.arc(W * (.2 + r() * .6), H * (sc.sky === 'day' ? .15 : .38), sc.sky === 'day' ? 30 : 40, 0, 7); ctx.fill() }
  const t = sc.type, horizon = t === 'steppe' ? H * .66 : t === 'peak' ? H * .72 : H * .6;
  const far = sc.sky === 'night' ? '#2E3F5C' : sc.sky === 'day' ? '#58758B' : '#5d6585', mid = sc.sky === 'night' ? '#1b2742' : sc.sky === 'day' ? '#3D594F' : '#3f4a5c', near = sc.sky === 'night' ? '#0f1a2c' : sc.sky === 'day' ? '#27402F' : '#243238';
  if (t === 'steppe') { ridge(ctx, r, W, H, horizon, 40, far, .25, 0); ridge(ctx, r, W, H, horizon + 40, 20, '#BFA984', .15, 0);
    ctx.fillStyle = '#D8B273'; ctx.fillRect(0, horizon + 40, W, H); ctx.beginPath(); ctx.moveTo(W * .52, horizon + 30); ctx.lineTo(W * .2, H); ctx.lineTo(W * .36, H); ctx.closePath(); ctx.fillStyle = '#2E353E'; ctx.fill();
    ctx.strokeStyle = '#F2F6F9'; ctx.lineWidth = 3; ctx.setLineDash([18, 18]); ctx.beginPath(); ctx.moveTo(W * .515, horizon + 34); ctx.lineTo(W * .28, H); ctx.stroke(); ctx.setLineDash([]); return }
  const big = (t === 'glacier' || t === 'blackglacier' || t === 'peak');
  ridge(ctx, r, W, H, horizon - (big ? 140 : 60), big ? 260 : 150, far, .35, big ? .5 : .35);
  ridge(ctx, r, W, H, horizon - 10, 90, mid, .6, 0);
  const water = ['lake', 'forestlake', 'town', 'river'].includes(t);
  if (water) { const wg = ctx.createLinearGradient(0, horizon, 0, H);
    wg.addColorStop(0, t === 'river' ? '#6CC2DB' : sc.sky === 'night' ? '#22375C' : '#4F87A6'); wg.addColorStop(1, sc.sky === 'night' ? '#0a1328' : '#22475C');
    if (t === 'river') { ctx.fillStyle = near; ctx.fillRect(0, horizon, W, H); ctx.fillStyle = wg; ctx.beginPath(); ctx.moveTo(W * .45, horizon); ctx.bezierCurveTo(W * .2, H * .75, W * .8, H * .8, W * .35, H); ctx.lineTo(W * .75, H); ctx.bezierCurveTo(W * 1.05, H * .8, W * .45, H * .75, W * .58, horizon); ctx.closePath(); ctx.fill();
      ctx.fillStyle = '#937B65'; for (let i = 0; i < 14; i++) { ctx.beginPath(); ctx.ellipse(W * (.3 + r() * .5), horizon + r() * (H - horizon), 30 + r() * 40, 10 + r() * 12, 0, 0, 7); ctx.fill() } }
    else { ctx.fillStyle = wg; ctx.fillRect(0, horizon, W, H - horizon); ctx.strokeStyle = 'rgba(255,255,255,.25)'; ctx.lineWidth = 2; for (let i = 0; i < 40; i++) { const y = horizon + 8 + r() * (H - horizon - 20), x = r() * W; ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x + 20 + r() * 60, y); ctx.stroke() }
      if (t === 'forestlake') { ctx.strokeStyle = '#5a4a3a'; ctx.lineWidth = 4; for (let i = 0; i < 10; i++) { const x = W * (.3 + r() * .4), y = horizon + 30 + r() * 120; ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x + (r() - .5) * 10, y - 50 - r() * 60); ctx.stroke() } } } }
  else { ctx.fillStyle = near; ctx.fillRect(0, horizon + 40, W, H) }
  ridge(ctx, r, W, H, water ? horizon + 12 : horizon + 60, 40, near, .9, 0);
  const tc = sc.sky === 'night' ? '#07101e' : '#182521';
  if (t === 'forest') { ctx.fillStyle = '#A9561F'; for (let i = 0; i < 26; i++) { const x = r() * W, y = horizon + 40 + r() * (H - horizon); ctx.fillRect(x, y - 90 - r() * 60, 7, 160) } trees(ctx, r, W, horizon + 40, H, tc, 60, 70) }
  else if (t === 'peak') trees(ctx, r, W, horizon + 50, H, tc, 40, 40);
  else trees(ctx, r, W, water ? horizon + 12 : horizon + 60, water ? horizon + 40 : H, tc, 50, 40);
}

/* ---------- casas ---------- */
let city = 0, hi = 0, ph = 0;
try { const s = JSON.parse(load('pat-casa', 'null')); if (s) { city = s[0] | 0; hi = s[1] | 0 } } catch (e) {}
if (city >= CITIES.length) city = 0; if (hi >= CITIES[city].h.length) hi = 0;
const hl = $('hl');
const houseUrl = (c, h) => { const ci = h.ci || c.ci, co = h.co || c.co; return h.id ? AIR(h.id) + '?check_in=' + ci + '&check_out=' + co + '&adults=8' : h.url + '?checkin=' + ci + '&checkout=' + co + '&group_adults=8&no_rooms=' + (h.rooms || 1) + '&selected_currency=USD' };
const score = h => h.s ? h.s.reduce((a, b) => a + b, 0) : null;
const mini = u => u.replace('/f_auto,q_auto/', '/f_auto,q_auto,c_fill,w_168,h_120/'), media = (u, w) => u.replace('/f_auto,q_auto/', '/f_auto,q_auto,w_' + w + '/');
function renderPicked() {
  const filas = [['San Martín', '28 al 30/12'], ['La Angostura', '3 al 5/1'], ['Bariloche', '6 al 10/1']];
  let tot = 0, nn = 0;
  const tr = filas.map(([l, cuando]) => {
    const hn = STAY[l], n = nochesEn(l);
    if (!hn) return `<tr class="pend"><td>${l}</td><td>A confirmar<br><span class="s">${noches(n)}</span></td><td>${cuando}</td><td class="n">—</td><td class="n">—</td></tr>`;
    const h = casa(hn), c = CITIES.find(c => c.h.includes(h)), st = estado(h); tot += h.tot; nn += n;
    return `<tr><td>${l}</td><td><a href="${houseUrl(c, h)}" target="_blank" rel="noopener">${h.n} ↗</a><br><span class="s">${h.src} · ${noches(n)}</span> <span class="gtag ${st[1]}">${st[0]}</span></td><td>${cuando}</td><td class="n">${usd(h.tot)}</td><td class="n">${usd(h.tot / N)}</td></tr>`;
  }).join('');
  $('pickedTab').innerHTML = `<thead><tr><th scope="col">Lugar</th><th scope="col">Casa</th><th scope="col">Fechas</th><th scope="col" class="n">Total</th><th scope="col" class="n">Por persona</th></tr></thead><tbody>${tr}<tr class="tot"><td colspan="3">Confirmado, ${noches(nn)}</td><td class="n">${usd(tot)}</td><td class="n">${usd(tot / N)}</td></tr></tbody>`;
  $('pickedPP').textContent = usd(tot / N);
  $('pickedSub').textContent = 'por persona, las ' + nn + ' noches confirmadas en casas';
}
function renderCities() {
  const box = $('cityChips'); box.innerHTML = '';
  CITIES.forEach((c, i) => { const b = document.createElement('button'); b.type = 'button'; b.className = 'chip'; b.setAttribute('aria-pressed', i === city); b.textContent = c.n + ' · ' + c.when;
    b.onclick = () => { city = i; hi = 0; renderCities(); renderList(); pick(0) }; box.appendChild(b) });
  const c = CITIES[city];
  $('cityNote').textContent = (c.cot ? 'Los precios de esta lista se cotizaron para ' + c.cot + '; el plan actual son ' + noches(nochesEn(c.n)) + ': total a confirmar. ' : '') + c.note;
}
function renderList() {
  const c = CITIES[city]; hl.innerHTML = '';
  c.h.forEach((h, i) => { const li = document.createElement('li'), b = document.createElement('button'); b.type = 'button'; b.className = 'day' + (h.out ? ' out' : ''); b.dataset.i = i;
    b.innerHTML = `<span class="d">${score(h) == null ? '—' : score(h) + '/30'}</span><span class="pin ${h.src === 'Airbnb' ? 'src-air' : 'src-bkg'}" aria-hidden="true"></span><span><span class="t">${h.star ? '<span class="star" aria-hidden="true">★</span> ' : ''}${h.n}</span><span class="s">${usd(h.tot == null ? null : h.tot / N)} c/u · ${h.src}${h.star ? ' · ' + h.star : ''}${h.out ? ' · descartada' : ''}</span></span>`;
    b.onclick = () => pick(i, true); li.appendChild(b); hl.appendChild(li) });
}
function showPhoto(i) {
  const h = CITIES[city].h[hi], p = h.f; const img = $('hphoto');
  if (!p.length) { img.removeAttribute('srcset'); img.removeAttribute('src'); img.alt = ''; $('hcred').textContent = 'Fotos: ver el anuncio en ' + h.src; $('hcount').textContent = ''; return }
  ph = (i + p.length) % p.length;
  img.srcset = [640, 1200].map(w => media(p[ph], w) + ' ' + w + 'w').join(','); img.sizes = '(max-width: 820px) 100vw, 740px'; img.src = media(p[ph], 1200); img.alt = 'Foto ' + (ph + 1) + ' de ' + p.length + ': ' + h.n;
  $('hcred').textContent = 'Foto del anuncio en ' + h.src; $('hcount').textContent = (ph + 1) + ' / ' + p.length;
  document.querySelectorAll('#hthumbs button').forEach((b, j) => { if (j === ph) { b.setAttribute('aria-current', 'true'); const t = $('hthumbs'); t.scrollTo({ left: b.offsetLeft - t.clientWidth / 2 + b.clientWidth / 2, behavior: sinMov() ? 'auto' : 'smooth' }) } else b.removeAttribute('aria-current') });
}
$('gprev').onclick = () => showPhoto(ph - 1); $('gnext').onclick = () => showPhoto(ph + 1);
document.querySelector('.gal2').addEventListener('keydown', e => { if (e.key === 'ArrowLeft') { showPhoto(ph - 1); e.preventDefault() } else if (e.key === 'ArrowRight') { showPhoto(ph + 1); e.preventDefault() } });
function pick(i, user) {
  const c = CITIES[city]; if (i < 0 || i >= c.h.length) return; hi = i; const h = c.h[i];
  save('pat-casa', JSON.stringify([city, hi]));
  hl.querySelectorAll('.day').forEach(x => { const on = +x.dataset.i === i; x.classList.toggle('on', on); if (on) x.setAttribute('aria-current', 'true'); else x.removeAttribute('aria-current') });
  $('hthumbs').innerHTML = h.f.map((u, j) => `<button type="button" aria-label="Foto ${j + 1} de ${h.f.length}"><img src="${mini(u)}" alt="" loading="lazy" crossorigin="anonymous" width="84" height="60"></button>`).join('');
  document.querySelectorAll('#hthumbs button').forEach((b, j) => b.onclick = () => showPhoto(j)); showPhoto(0);
  const nq = h.nts || NOCHES_COTIZADAS[c.k];
  $('heb').innerHTML = `<span class="tag" style="background:var(${h.src === 'Airbnb' ? '--polar' : '--marino'})">${h.src}</span><span>${c.n} · ${c.when}</span>`;
  $('httl').textContent = h.n;
  $('hlead').textContent = (h.out ? 'Descartada: en ' + c.n + ' ya está confirmada la casa ' + CONF[c.k] + '. ' : '') + (h.star === 'Confirmada ✓' ? 'Confirmada. ' : '') + h.lead;
  $('hstats').innerHTML = [['Por persona', usd(h.tot == null ? null : h.tot / N)], ['Total cotizado · ' + noches(nq), usd(h.tot)], ['Reseñas', h.rat], ['Camas', h.beds], ['Dónde', h.zona]].map(s => `<div class="stat"><dt>${s[0]}</dt><dd>${s[1]}</dd></div>`).join('');
  $('hbars').innerHTML = !h.s ? '<p>Sin puntaje: se reservó sin comparar con la grilla.</p>' : h.s.map((v, j) => `<dt>${SC[j]}</dt><dd><span class="tr" aria-hidden="true"><i style="width:${v * 20}%"></i></span><b>${v}/5</b></dd>`).join('') + `<div class="tot"><span>Puntaje total</span><span>${score(h)}/30</span></div>`;
  $('hpro').innerHTML = h.pro.map(x => `<li>${x}</li>`).join(''); $('hcon').innerHTML = h.con.map(x => `<li>${x}</li>`).join('');
  $('hlinks').innerHTML = `<a href="${houseUrl(c, h)}" target="_blank" rel="noopener">Ver en ${h.src} ↗</a>` + (h.bk ? `<a href="${h.bk}?checkin=${c.ci}&checkout=${c.co}&group_adults=8&no_rooms=1&selected_currency=USD" target="_blank" rel="noopener">Ver en Booking ↗</a>` : '') + `<a href="${MAP(h.map)}" target="_blank" rel="noopener">Ver en el mapa ↗</a>`;
  $('hprev').disabled = i === 0; $('hnext').disabled = i === c.h.length - 1;
  if (user) { avisar('Casa: ' + h.n); if (innerWidth <= 820) $('hpanel').scrollIntoView({ behavior: sinMov() ? 'auto' : 'smooth', block: 'start' }) }
}
$('hprev').onclick = () => pick(hi - 1, true); $('hnext').onclick = () => pick(hi + 1, true);

/* ---------- gastos: una sola cuenta para la tabla, el resumen y la portada ---------- */
function gastos() {
  const rows = [[AUTOS.detalle, ['Cotizado', ''], AUTOS.total]];
  [['San Martín', 'Casa en San Martín'], ['La Angostura', 'Casa en La Angostura (3 y 4/1)'], ['Bariloche', 'Casa en Bariloche']].forEach(([l, t]) => {
    const hn = STAY[l]; if (!hn) { rows.push([t + ': a confirmar', ['A confirmar', 'av'], null]); return }
    const h = casa(hn); rows.push([t + ': ' + hn, estado(h), h.tot]);
  });
  rows.push([`Permisos de pesca: ${N} × 10 días país limítrofe (ARS ${PERMISO_PESCA.ars.toLocaleString('es-AR')} c/u, dólar BNA del ${PERMISO_PESCA.fechaDolar}). No se suma al total`, ['Opcional', ''], N * PERMISO_PESCA.ars / PERMISO_PESCA.dolar, 1]);
  A_CARGAR.forEach(n => rows.push([n, ['A cargar', ''], null]));
  const known = rows.filter(r => r[2] != null && !r[3]), tot = known.reduce((a, r) => a + r[2], 0), conf = known.filter(r => r[1][1] === 'ok').reduce((a, r) => a + r[2], 0);
  return { rows, tot, conf };
}
function renderGastos() {
  const { rows, tot, conf } = gastos();
  $('gsum').innerHTML = `<li><b>${usd(tot / N)}</b><span>por persona, todo lo que tiene precio</span></li><li><b>${usd(conf / N)}</b><span>por persona, solo lo confirmado</span></li><li><b>${usd(tot)}</b><span>total del grupo con precio</span></li>`;
  $('gtab').innerHTML = '<thead><tr><th scope="col">Gasto</th><th scope="col">Estado</th><th scope="col" class="n">Total</th><th scope="col" class="n">Por persona</th></tr></thead><tbody>' +
    rows.map(r => `<tr class="${r[2] == null ? 'pend' : ''}${r[3] ? ' opc' : ''}"><td>${r[0]}</td><td><span class="gtag ${r[1][1]}">${r[1][0]}</span></td><td class="n">${r[2] == null ? '—' : usd(r[2])}</td><td class="n">${r[2] == null ? '—' : usd(r[2] / N)}</td></tr>`).join('') +
    `<tr class="tot"><td colspan="2">Total con precio</td><td class="n">${usd(tot)}</td><td class="n">${usd(tot / N)}</td></tr></tbody>`;
  $('istatPP').textContent = usd(tot / N);
  $('autosTotal').textContent = 'USD ' + AUTOS.total.toLocaleString('es-AR', { minimumFractionDigits: 2 }); $('autosPP').textContent = usd(AUTOS.total / N);
  $('pzUsd').textContent = usd(PERMISO_PESCA.ars / PERMISO_PESCA.dolar);
}

/* ---------- pesca ---------- */
function renderPesca() {
  $('pzSpots').innerHTML = SPOTS.map(x => `<li><span class="pz-d">${x[0]}</span><div><b>${x[1]}</b><span class="pz-j">${x[2]} · ${x[3]}</span><p><i>${x[4]}.</i> ${x[5]}</p></div></li>`).join('');
  $('pzGuides').innerHTML = '<thead><tr><th scope="col">Dónde</th><th scope="col">Prestador</th><th scope="col">Qué incluye</th><th scope="col" class="n">Precio</th></tr></thead><tbody>' +
    GUIDES.map(g => `<tr><td>${g[0]}</td><td>${g[4] ? `<a href="${g[4]}" target="_blank" rel="noopener">${g[1]} ↗</a>` : g[1]}</td><td>${g[2]}</td><td class="n">${g[3]}</td></tr>`).join('') + '</tbody>';
}

/* ---------- resumen de la portada y carteles del 3D, desde los mismos datos ---------- */
function renderIntro() {
  const parts = BB.map(b => b.n + ' (' + noches(nochesEn(b.n)) + ')').concat(BASES.filter(b => b.o).map(b => b.n + ' (' + b.e + ')'));
  $('introLede').textContent = 'Barco a Buenos Aires el 27/12, vuelo a Chapelco el 28/12 y dos autos hasta el 10/1: ' + parts.join(', ') + '.';
  const km = Object.values(LEGS).reduce((a, l) => a + (parseInt(l.km) || 0), 0); $('istatKm').textContent = '≈' + (Math.round(km / 10) * 10).toLocaleString('es-AR');
  const rn = DAYS.filter(d => d.k === 'ref').length; $('istatRef').textContent = rn; $('istatRefL').textContent = rn === 1 ? 'noche en refugio (Frey)' : 'noches en refugio';
  const set = (sel, t) => { const e = document.querySelector(sel); if (e) e.textContent = t };
  const fd = DAYS.find(d => d.k === 'ref' && /Frey/.test(d.t)), bb = BASES.find(b => b.n === 'Bariloche'), om = BASES.find(b => b.o);
  set('#pin small', '≈2.000 m · ' + (om ? om.e : 'opcional')); set('#pin .tr', 'Opcional · Sendero desde Pampa Linda · 13 km · +1.050 m');
  set('#pinFrey small', '≈1.700 m' + (fd ? ' · noche del ' + fd.d : '')); set('#pinFrey .tr', 'Sendero desde Villa Catedral · ≈10 km · +750 m');
  if (bb) set('#pinBariloche small', 'casa del ' + DAYS[bb.d].d.split('/')[0] + ' al 10/1');
  $('mosaic').innerHTML = MOSAICO.map((m, i) => { const ar = i ? '4:5' : '4:5', ws = [480, 800, 1200];
    return `<figure><img src="${fotoUrl(m, 800, ar)}" srcset="${ws.map(w => fotoUrl(m, w, ar) + ' ' + w + 'w').join(',')}" sizes="(min-width: 1000px) ${i ? '25vw' : '50vw'}, 78vw" alt="${m.alt}" loading="lazy" crossorigin="anonymous" width="800" height="1000"><figcaption><small>${m.s}</small>${m.t}</figcaption></figure>` }).join('');
  const t = $('itinAct'), [y, m, d] = VIAJE.actualizado.split('-'); t.dateTime = VIAJE.actualizado; t.textContent = (+d) + '/' + (+m) + '/' + y;
}

/* ---------- mapa plano (SVG propio de tools/mapa.py) con zoom fluido ----------
   Dos capas que se mueven y escalan con transform (GPU) durante el gesto:
   - capa A: el mapa completo simplificado, dibujado una vez;
   - capa B: la vista actual con el detalle fino, redibujada nítida una vez por gesto, con media pantalla de margen.
   La caja puede tener cualquier proporción: en el celular es la del mapa (vertical); en pantallas anchas ocupa todo el ancho
   con una altura cómoda y la vista general es la franja del mapa que entra (de Buenos Aires a la zona del viaje). */
let mapaListo = false;
function initMapa() {
  if (mapaListo) return; mapaListo = true;
  const el = $('mapaSvg');
  fetch(el.dataset.src).then(r => r.ok ? r.text() : Promise.reject(r.status)).then(t => { el.removeAttribute('aria-busy'); mapaZoom(el.closest('.mapa'), t) })
    .catch(() => { mapaListo = false; el.innerHTML = '<p class="note" style="padding:16px">No se pudo cargar el mapa.</p>' });
}
function mapaZoom(fig, txt) {
  const box = fig.querySelector('.mapa-svg');
  try {
    box.innerHTML = '<div class="mv-capa mv-a"></div><div class="mv-capa mv-b" aria-hidden="true"></div>' +
      '<div class="mapa-zoom"><button type="button" data-z="in" aria-label="Acercar">+</button><button type="button" data-z="out" aria-label="Alejar">−</button><button type="button" data-z="gen" aria-label="Vista general" title="Vista general"><svg viewBox="0 0 20 20" aria-hidden="true"><path d="M3 8V3h5M12 3h5v5M17 12v5h-5M8 17H3v-5"/></svg></button></div>';
    const A = box.querySelector('.mv-a'), B = box.querySelector('.mv-b');
    A.innerHTML = txt; B.innerHTML = txt.replace(/<title[^>]*>[\s\S]*?<\/title>/, '').replace(' role="img" aria-labelledby="mv-t"', ' aria-hidden="true"');
    const sa = A.querySelector('svg'), sb = B.querySelector('svg');
    sa.querySelectorAll('.capa-det,.g-det,.mv-fino,.mv-papel').forEach(e => e.remove()); sb.querySelectorAll('.mv-papel').forEach(e => e.remove());
    const Z0 = sa.getAttribute('viewBox').split(' ').map(Number), Z1 = sa.dataset.zoom.split(' ').map(Number), ARS = Z0[3] / Z0[2], M = 0.5, WMIN = Z1[2] / 3;
    for (const v of [sa, sb]) v.setAttribute('preserveAspectRatio', 'none');
    const kA = [...sa.querySelectorAll('.k')].map(g => [g, +g.dataset.x, +g.dataset.y]), kB = [...sb.querySelectorAll('.k')].map(g => [g, +g.dataset.x, +g.dataset.y]);
    const gen = sb.querySelector('.capa-gen'), det = sb.querySelector('.capa-det'), gg = [...sb.querySelectorAll('.g-gen')], gd = [...sb.querySelectorAll('.g-det')];
    const bR = fig.querySelector('[data-ir="ruta"]'), bG = fig.querySelector('[data-ir="general"]'), zIn = box.querySelector('[data-z="in"]'), zOut = box.querySelector('[data-z="out"]'), zGen = box.querySelector('[data-z="gen"]');
    const cl = (v, a, b) => Math.min(b, Math.max(a, v)), ba = kA.find(k => /Buenos Aires/.test(k[0].textContent));
    let W = 600, H = 600 * ARS, AR = ARS, WMAX = Z0[2], vb = Z0.slice(), vc = null, anim = 0, raf = 0, ct = 0, home = Z0.slice();
    // límites con zoom de detalle: la zona del viaje con margen (no se pierde el mapa de vista)
    const ZB = [Z1[0] - Z1[2] * 0.6, Z1[1] - Z1[3] * 0.35, Z1[2] * 2.2, Z1[3] * 1.7];
    const eje = (p, s, a, b, tot) => cl(s <= b - a ? cl(p, a, b - s) : (a + b - s) / 2, 0, Math.max(0, tot - s));
    const fix = v => {
      v[2] = cl(v[2], Math.min(WMIN, WMAX), WMAX); v[3] = v[2] * AR;
      const t = cl((W / v[2] - 2.2) / 1.4, 0, 1), L = (a, b) => a + (b - a) * t;
      v[0] = eje(v[0], v[2], L(0, ZB[0]), L(Z0[2], ZB[0] + ZB[2]), Z0[2]);
      v[1] = eje(v[1], v[3], L(0, ZB[1]), L(Z0[3], ZB[1] + ZB[3]), Z0[3]); return v;
    };
    const encuadre = r => { const w = cl(Math.max(r[2], r[3] / AR) * 1.04, WMIN, WMAX); return [r[0] + r[2] / 2 - w / 2, r[1] + r[3] / 2 - w * AR / 2, w, w * AR] };
    function medir() {
      W = box.clientWidth || 600; H = box.clientHeight || W * ARS; AR = H / W; WMAX = Math.min(Z0[2], Z0[3] / AR);
      A.style.height = (W * ARS).toFixed(1) + 'px';
      // vista general: todo el mapa si la caja es vertical; si es apaisada, la franja de ancho completo que va de Buenos Aires a la zona del viaje
      const h = WMAX * AR, arriba = (ba ? ba[2] : 100) - 30, abajo = Z1[1] + Z1[3] + 26;   // de Buenos Aires al final de la ruta
      home = [(Z0[2] - WMAX) / 2, cl(h >= abajo - arriba ? arriba - (h - (abajo - arriba)) / 2 : abajo - h, 0, Math.max(0, Z0[3] - h)), WMAX, h];
    }
    const zoomed = () => vb[2] < home[2] * 0.98;
    const labels = (ks, w) => { const u = (w / W * (W < 500 ? 0.8 : 1)).toFixed(5); for (const [g, x, y] of ks) g.setAttribute('transform', 'translate(' + x + ' ' + y + ') scale(' + u + ')') };
    function render() {
      fix(vb); const k = W / vb[2];
      A.style.transform = 'translate3d(' + (-vb[0] * k).toFixed(2) + 'px,' + (-vb[1] * k).toFixed(2) + 'px,0) scale(' + (Z0[2] / vb[2]).toFixed(5) + ')';
      if (vc) B.style.transform = 'translate3d(' + ((vc[0] - M * vc[2] - vb[0]) * k).toFixed(2) + 'px,' + ((vc[1] - M * vc[3] - vb[1]) * k).toFixed(2) + 'px,0) scale(' + (vc[2] / vb[2]).toFixed(5) + ')';
    }
    const req = () => { if (!raf) raf = requestAnimationFrame(() => { raf = 0; render() }) };
    // al terminar el gesto: la capa B se redibuja nítida para la vista actual. El detalle aparece según los píxeles por unidad de mapa.
    function commit(to) {
      const v = fix((to || vb).slice()), ppu = W / v[2];   // píxeles de pantalla por unidad del mapa
      if (ppu < 0.63) { vc = null; B.style.visibility = 'hidden' }
      else {
        vc = v; sb.setAttribute('viewBox', [v[0] - M * v[2], v[1] - M * v[3], (1 + 2 * M) * v[2], (1 + 2 * M) * v[3]].map(x => x.toFixed(4)).join(' ')); labels(kB, v[2]);
        const t = cl((ppu - 2.2) / 1.4, 0, 1); gen.style.opacity = 1 - t; gg.forEach(g => g.style.opacity = 1 - t); det.style.opacity = t; gd.forEach(g => g.style.opacity = t); det.style.visibility = t < 0.02 ? 'hidden' : 'visible';
        B.style.visibility = 'visible';
      }
      const zm = zoomed(); box.classList.toggle('zoom', zm); box.dataset.vista = vb.map(x => x.toFixed(2)).join(' ');
      bR.disabled = vb[2] <= encuadre(Z1)[2] * 1.05; bG.disabled = zGen.disabled = zOut.disabled = !zm; zIn.disabled = vb[2] <= WMIN * 1.01; render(); gpu(false);
    }
    // durante el gesto la capa B va por GPU sin redibujarse; al terminar se redibuja nítida a su escala final
    const gpu = on => { B.style.willChange = on ? 'transform' : 'auto' };
    const later = () => { clearTimeout(ct); ct = setTimeout(() => commit(), 140) };
    function ir(to) {
      cancelAnimationFrame(anim); clearTimeout(ct); to = fix(to.slice()); const from = vb.slice();
      commit(to); gpu(true);
      if (sinMov()) { vb = to; commit(); return }
      const t0 = performance.now(), D = 750;
      const step = now => { const k = cl((now - t0) / D, 0, 1), e = k < .5 ? 4 * k * k * k : 1 - Math.pow(-2 * k + 2, 3) / 2;
        const w = Math.exp(Math.log(from[2]) + (Math.log(to[2]) - Math.log(from[2])) * e), f = Math.abs(from[2] - to[2]) < 1e-6 ? e : (from[2] - w) / (from[2] - to[2]);
        vb = [from[0] + (to[0] - from[0]) * f, from[1] + (to[1] - from[1]) * f, w, w * AR]; render(); if (k < 1) anim = requestAnimationFrame(step); else commit() };
      anim = requestAnimationFrame(step);
    }
    const around = f => { const w = cl(vb[2] / f, WMIN, WMAX); return [vb[0] + vb[2] / 2 - w / 2, vb[1] + vb[3] / 2 - w * AR / 2, w, w * AR] };
    bR.onclick = () => ir(encuadre(Z1)); bG.onclick = zGen.onclick = () => ir(home); zIn.onclick = () => ir(around(2)); zOut.onclick = () => ir(around(0.5));
    let rect = null;
    function zoomAt(f, px, py) { const fx = (px - rect.left) / rect.width, fy = (py - rect.top) / rect.height, ux = vb[0] + fx * vb[2], uy = vb[1] + fy * vb[3], w = cl(vb[2] / f, WMIN, WMAX); vb = [ux - fx * w, uy - fy * w * AR, w, w * AR] }
    const pan = (dx, dy) => { vb[0] -= dx / rect.width * vb[2]; vb[1] -= dy / rect.height * vb[3] };
    const stop = () => { cancelAnimationFrame(anim); clearTimeout(ct); gpu(true) };
    // táctil: un dedo mueve la página (o el mapa si hay zoom); dos dedos, pellizco
    let last = null, panOK = false;
    box.addEventListener('touchstart', e => { stop(); rect = box.getBoundingClientRect(); last = null; if (e.touches.length === 1) panOK = zoomed() }, { passive: true });
    box.addEventListener('touchmove', e => { const T = e.touches;
      if (T.length >= 2) { e.preventDefault(); const a = T[0], b = T[1], d = Math.hypot(a.clientX - b.clientX, a.clientY - b.clientY), cx = (a.clientX + b.clientX) / 2, cy = (a.clientY + b.clientY) / 2;
        if (last && last.n === 2) { zoomAt(d / last.d, cx, cy); pan(cx - last.cx, cy - last.cy); fix(vb); req() } last = { n: 2, d, cx, cy } }
      else if (T.length === 1 && panOK) { e.preventDefault(); const a = T[0]; if (last && last.n === 1) { pan(a.clientX - last.cx, a.clientY - last.cy); fix(vb); req() } last = { n: 1, cx: a.clientX, cy: a.clientY } }
    }, { passive: false });
    const tend = e => { last = null; if (e.touches.length === 1) panOK = zoomed(); if (!e.touches.length) later() };
    box.addEventListener('touchend', tend); box.addEventListener('touchcancel', tend);
    // mouse y teclado
    let drag = null;
    box.addEventListener('pointerdown', e => { if (e.pointerType !== 'mouse' || e.button !== 0 || !zoomed() || e.target.closest('button')) return; stop(); rect = box.getBoundingClientRect(); drag = { x: e.clientX, y: e.clientY }; box.setPointerCapture(e.pointerId); box.classList.add('arrastre') });
    box.addEventListener('pointermove', e => { if (!drag) return; pan(e.clientX - drag.x, e.clientY - drag.y); drag = { x: e.clientX, y: e.clientY }; fix(vb); req() });
    const mup = () => { if (!drag) return; drag = null; box.classList.remove('arrastre'); later() };
    box.addEventListener('pointerup', mup); box.addEventListener('pointercancel', mup);
    box.addEventListener('wheel', e => { if (!(e.ctrlKey || e.metaKey || zoomed())) return; e.preventDefault(); stop(); rect = box.getBoundingClientRect();
      zoomAt(Math.exp(-e.deltaY * (e.deltaMode === 1 ? 0.05 : 0.002)), e.clientX, e.clientY); fix(vb); req(); later() }, { passive: false });
    box.tabIndex = 0; box.setAttribute('role', 'group'); box.setAttribute('aria-label', 'Mapa de la ruta. Con el teclado: + y − para acercar y alejar, flechas para mover, 0 para la vista general.');
    box.addEventListener('keydown', e => { if (e.target !== box) return; const s = vb[2] * 0.2, m = { ArrowLeft: [-s, 0], ArrowRight: [s, 0], ArrowUp: [0, -s], ArrowDown: [0, s] }[e.key];
      if (m) { if (!zoomed()) return; vb[0] += m[0]; vb[1] += m[1]; fix(vb); req(); later() } else if (e.key === '+' || e.key === '=') ir(around(2)); else if (e.key === '-') ir(around(0.5)); else if (e.key === '0') ir(home); else return; e.preventDefault() });
    const hint = fig.querySelector('.mapa-hint'); if (hint) hint.textContent = matchMedia('(pointer: coarse)').matches ? 'Dos dedos para acercar; con zoom, un dedo mueve el mapa' : 'Ctrl + rueda o + y − para acercar; con zoom, arrastrá con el mouse';
    medir(); vb = home.slice(); labels(kA, Z0[2]); commit();
    new ResizeObserver(() => { const w = box.clientWidth, h = box.clientHeight; if (!w || (Math.abs(w - W) < 1 && Math.abs(h - H) < 1)) return; stop(); medir(); vb = home.slice(); labels(kA, Z0[2]); commit() }).observe(box);
  } catch (e) { console.warn('Mapa', e); box.innerHTML = txt }
}

/* ---------- navegación: barra de secciones (abajo en el celular, arriba en pantallas anchas) ---------- */
const PAGES = { itinerario: 'view-itin', mapa: 'view-mapa', casas: 'view-casas', autos: 'view-autos', gastos: 'view-gastos', pesca: 'view-pesca' };
const app = $('app'), tabs = [...document.querySelectorAll('#barra nav a')];
let page = 'itinerario';
function marcar() {
  const enPlan = app.getBoundingClientRect().top < innerHeight * 0.6;
  tabs.forEach(a => { if (enPlan && a.dataset.go === page) a.setAttribute('aria-current', 'page'); else a.removeAttribute('aria-current') });
}
function showPage(k) {
  if (!PAGES[k]) k = 'itinerario'; page = k;
  for (const p in PAGES) $(PAGES[p]).hidden = p !== k;
  if (k === 'mapa') initMapa();
  marcar();
}
function irAlPlan(suave) {
  const lejos = Math.abs(app.getBoundingClientRect().top) > innerHeight * 1.5;   // desde la portada 3D se salta directo: no se recorre todo el vuelo
  $(PAGES[page]).scrollIntoView({ behavior: suave && !lejos && !sinMov() ? 'smooth' : 'auto' });   // el título de la sección queda justo debajo de la barra
}
function go(k, foco) {
  if (k === 'arriba') { try { history.replaceState(null, '', location.pathname + location.search) } catch (e) {} window.scrollTo({ top: 0, behavior: 'auto' }); marcar(); return }
  showPage(k); try { history.replaceState(null, '', '#' + k) } catch (e) {}
  irAlPlan(true);
  if (foco) { const h = $(PAGES[page]).querySelector('h2'); if (h) { h.tabIndex = -1; h.focus({ preventScroll: true }) } }
}
document.addEventListener('click', e => { const a = e.target.closest('[data-go]'); if (!a) return; e.preventDefault(); go(a.dataset.go, e.detail === 0) });
addEventListener('hashchange', () => { const k = location.hash.slice(1); if (PAGES[k]) { showPage(k); irAlPlan(false) } });
{ let t = 0; addEventListener('scroll', () => { if (!t) t = requestAnimationFrame(() => { t = 0; marcar() }) }, { passive: true }) }

/* ---------- visor de fotos a pantalla completa ---------- */
function swipe(el, onL, onR) { let x0 = null, y0 = null; el.addEventListener('touchstart', e => { const t = e.touches[0]; x0 = t.clientX; y0 = t.clientY }, { passive: true });
  el.addEventListener('touchend', e => { if (x0 === null) return; const t = e.changedTouches[0], dx = t.clientX - x0, dy = t.clientY - y0; x0 = null; if (Math.abs(dx) > 40 && Math.abs(dx) > Math.abs(dy)) { dx < 0 ? onL() : onR() } }, { passive: true }) }
swipe(document.querySelector('.gal2'), () => showPhoto(ph + 1), () => showPhoto(ph - 1));
const lbEl = $('lb'); let lbLast = null;
function lbShow() { const h = CITIES[city].h[hi], p = h.f; $('lbi').src = media(p[ph], 1600); $('lbi').alt = 'Foto ' + (ph + 1) + ' de ' + p.length + ': ' + h.n; $('lbt').textContent = h.n; $('lbc').textContent = (ph + 1) + ' / ' + p.length }
function lbOpen() { lbLast = document.activeElement; lbShow(); lbEl.hidden = false; document.body.classList.add('lb-open'); $('lbx').focus() }
function lbClose() { lbEl.hidden = true; document.body.classList.remove('lb-open'); if (lbLast) lbLast.focus() }
function lbStep(d) { showPhoto(ph + d); lbShow() }
$('hver').addEventListener('click', lbOpen);
$('lbx').onclick = lbClose; $('lbp').onclick = () => lbStep(-1); $('lbn').onclick = () => lbStep(1);
lbEl.addEventListener('click', e => { if (e.target === lbEl) lbClose() });
swipe($('lbi'), () => lbStep(1), () => lbStep(-1));
addEventListener('keydown', e => {
  if (lbEl.hidden) return;
  if (e.key === 'Escape') lbClose(); else if (e.key === 'ArrowRight') lbStep(1); else if (e.key === 'ArrowLeft') lbStep(-1);
  else if (e.key === 'Tab') { const f = [$('lbx'), $('lbp'), $('lbn')], i = f.indexOf(document.activeElement); e.preventDefault(); f[(i + (e.shiftKey ? f.length - 1 : 1)) % f.length].focus() }   // el foco no sale del visor
});

/* ---------- arranque ---------- */
build(); select(cur, false);
renderPicked(); renderCities(); renderList(); pick(hi);
renderGastos(); renderPesca(); renderIntro();
/* silueta del pie: horizonte real (tools/silueta.py) */
{ const w = document.querySelector('.sil-w'); if (w) fetch(w.dataset.src).then(r => r.ok ? r.text() : Promise.reject(r.status)).then(svg => { w.innerHTML = svg }).catch(() => {}) }
/* siempre se arranca arriba, en la portada; con #seccion en el link se abre esa sección */
try { history.scrollRestoration = 'manual' } catch (e) {}
{ const k = location.hash.slice(1);
  if (PAGES[k]) {
    showPage(k); requestAnimationFrame(() => irAlPlan(false));
    // si al terminar de cargar (tipografías, fotos) la página se acomodó, se vuelve a ubicar; salvo que la persona ya se haya movido
    let tocado = false; const ya = () => { tocado = true }; ['wheel', 'touchstart', 'keydown', 'pointerdown'].forEach(e => addEventListener(e, ya, { once: true, passive: true }));
    const otraVez = () => { if (!tocado) irAlPlan(false) };
    addEventListener('load', otraVez, { once: true }); if (document.fonts && document.fonts.ready) document.fonts.ready.then(otraVez);
  } else { showPage('itinerario'); window.scrollTo(0, 0) } }

/* ---------- sin conexión ---------- */
function red() { $('sinred').hidden = navigator.onLine; if (navigator.onLine === false) { const c = document.querySelector('#leg .mapa-g'); if (c && c.querySelector('iframe')) renderLeg(DAYS[cur]) } }
addEventListener('online', () => { red(); renderLeg(DAYS[cur]) }); addEventListener('offline', red); red();
if ('serviceWorker' in navigator && /^https?:$/.test(location.protocol) && !/[?&]nosw/.test(location.search)) addEventListener('load', () => {
  navigator.serviceWorker.register('sw.js').catch(() => {});
  // fotos principales (una por día, el resumen y la portada) guardadas de entrada para verlas sin señal
  navigator.serviceWorker.ready.then(reg => { if (!navigator.onLine || !reg.active) return;
    const urls = Object.values(FOTOS).map(f => fotoUrl(f, 800, '3:2')).concat(MOSAICO.map(m => fotoUrl(m, 800, '4:5')));
    // las tipografías se pidieron antes de que el service worker tomara el control: se le pasan para que también queden guardadas
    const fuentes = performance.getEntriesByType('resource').map(r => r.name).filter(u => /^https:\/\/fonts\.(googleapis|gstatic)\.com\//.test(u));
    reg.active.postMessage({ tipo: 'guardar-fotos', urls, fuentes }) }).catch(() => {});
});
