/* Patagonia 2027 · service worker: la web se puede ver sin conexión después de abrirla una vez.
   - Al instalar: guarda la página, los estilos, los scripts, los datos, el mapa, la silueta y la versión liviana del 3D.
   - Fotos (Unsplash, Cloudinary) y tipografías: se guardan a medida que se ven; la página pide además las fotos de cada día.
   - Sin conexión, si falta el tamaño exacto de una foto se usa otro tamaño guardado de la misma foto.
   - Los mapas de Google no se guardan (son de otro sitio): el itinerario muestra el trayecto en texto.
   Para publicar cambios: subir VERSION (borra la copia vieja al activarse). */
const VERSION = 'pat27-v4';
const BASE = VERSION + '-base', FOTOS = VERSION + '-fotos', FUENTES = VERSION + '-fuentes';
const PRECACHE = ['./', 'index.html', '404.html', 'css/estilos.css', 'js/datos.js', 'js/app.js', 'js/hero.js', 'vendor/three.module.min.js',
  'manifest.webmanifest', 'img/icono.svg', 'img/icono-192.png', 'img/icono-512.png', 'img/icono-180.png',
  'data/mapa.svg', 'data/silueta.svg', 'data/terreno.json', 'data/terreno-cerca-agua.png', 'data/terreno-lejos-alt.png', 'data/terreno-lejos.jpg',
  'data/terreno-cerca-alt-480.png', 'data/terreno-cerca-color-1024.jpg', 'data/terreno-cerca-normal-1024.jpg'];
const MAX_FOTOS = 320;

self.addEventListener('install', e => {
  e.waitUntil(caches.open(BASE).then(c => Promise.all(PRECACHE.map(u => c.add(new Request(u, { cache: 'reload' })).catch(() => {})))).then(() => self.skipWaiting()));
});
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => !k.startsWith(VERSION)).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});

const esFoto = u => u.hostname === 'images.unsplash.com' || u.hostname === 'res.cloudinary.com';
const esFuente = u => u.hostname === 'fonts.googleapis.com' || u.hostname === 'fonts.gstatic.com';
async function recortar(cache) { const ks = await cache.keys(); for (let i = 0; i < ks.length - MAX_FOTOS; i++) await cache.delete(ks[i]) }
/* misma foto en otro tamaño: mismo archivo y mismo recorte (Unsplash: ruta + ar + fp; Cloudinary: id final) */
async function otraMedida(cache, url) {
  const u = new URL(url), clave = u.hostname === 'images.unsplash.com' ? u.pathname : u.pathname.split('/').pop();
  const ks = await cache.keys(); let mejor = null;
  for (const k of ks) { const v = new URL(k.url); if (v.hostname !== u.hostname) continue;
    if ((v.hostname === 'images.unsplash.com' ? v.pathname : v.pathname.split('/').pop()) !== clave) continue;
    if (!mejor || v.searchParams.get('ar') === u.searchParams.get('ar')) mejor = k }
  return mejor ? cache.match(mejor) : undefined;
}
async function foto(req) {
  const cache = await caches.open(FOTOS), hit = await cache.match(req.url);
  if (hit) return hit;
  try {
    const res = await fetch(req);
    if (res.ok || res.type === 'opaque') { cache.put(req.url, res.clone()).then(() => recortar(cache)).catch(() => {}) }
    return res;
  } catch (err) { return (await otraMedida(cache, req.url)) || Response.error() }
}
async function primeroCache(req, nombre) {
  const cache = await caches.open(nombre), hit = await cache.match(req);
  if (hit) return hit;
  const res = await fetch(req); if (res.ok || res.type === 'opaque') cache.put(req, res.clone()).catch(() => {}); return res;
}
/* archivos propios: se responde con la copia y se actualiza en segundo plano */
async function copiaYActualiza(req) {
  const cache = await caches.open(BASE), hit = await cache.match(req, { ignoreSearch: true });
  const red = fetch(req).then(res => { if (res.ok) cache.put(req, res.clone()).catch(() => {}); return res }).catch(() => null);
  return hit || (await red) || Response.error();
}
/* la página: primero la red (para ver cambios); si no hay o tarda más de 3 s, la copia */
async function pagina(req) {
  const cache = await caches.open(BASE);
  const copia = () => cache.match('index.html').then(r => r || cache.match('./'));
  try {
    const res = await Promise.race([fetch(req), new Promise((_, no) => setTimeout(no, 3000))]);
    if (res.ok && new URL(req.url).pathname.replace(/index\.html$/, '').endsWith('/')) cache.put('index.html', res.clone()).catch(() => {});
    return res;
  } catch (err) { return (await copia()) || Response.error() }
}
self.addEventListener('fetch', e => {
  const req = e.request; if (req.method !== 'GET') return;
  const u = new URL(req.url);
  if (esFoto(u)) { e.respondWith(foto(req)); return }
  if (esFuente(u)) { e.respondWith(primeroCache(req, FUENTES)); return }
  if (u.origin !== location.origin) return;
  if (req.mode === 'navigate') { e.respondWith(pagina(req)); return }
  e.respondWith(copiaYActualiza(req));
});
/* la página manda la lista de fotos principales para guardarlas de entrada */
self.addEventListener('message', e => {
  if (!e.data || e.data.tipo !== 'guardar-fotos') return;
  e.waitUntil(caches.open(FOTOS).then(async cache => {
    for (const url of e.data.urls) { if (await cache.match(url)) continue; try { const r = await fetch(url, { mode: 'cors' }); if (r.ok) await cache.put(url, r) } catch (err) {} }
    const fu = await caches.open(FUENTES);
    for (const url of e.data.fuentes || []) { if (await fu.match(url)) continue; try { const r = await fetch(url, { mode: 'cors' }); if (r.ok) await fu.put(url, r) } catch (err) {} }
  }));
});
