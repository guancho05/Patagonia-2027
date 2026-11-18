// Portada: el Tronador en 3D con relieve real (Terrain Tiles de AWS, formato Terrarium).
// El scroll mueve la cámara como un dron alrededor de la montaña; al volver para arriba, gira de vuelta.
const hero = document.getElementById('hero');
const stage = document.getElementById('stage');
const canvas = document.getElementById('terrain');
const pin = document.getElementById('pin');
const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
const saveData = navigator.connection && navigator.connection.saveData;
const lowMem = navigator.deviceMemory && navigator.deviceMemory < 4;
const mobile = matchMedia('(max-width: 820px)').matches;

// Zona: de Pampa Linda a la cumbre, con el Refugio Otto Meiling.
const BBOX = { n: -41.10, s: -41.25, w: -71.97, e: -71.74 };
const Z = 11;
const PLACES = {
  meiling: { lat: -41.168, lon: -71.851, label: 'Refugio Otto Meiling', sub: '≈2.000 m' },
  summit: { lat: -41.157, lon: -71.884 }
};

function fallback(reason) {
  hero.classList.add('static');
  hero.dataset.reason = reason;
}

function webgl2() {
  try { return !!document.createElement('canvas').getContext('webgl2'); } catch (e) { return false; }
}

const tileX = lon => (lon + 180) / 360 * 2 ** Z;
const tileY = lat => (1 - Math.asinh(Math.tan(lat * Math.PI / 180)) / Math.PI) / 2 * 2 ** Z;

async function loadHeights(N) {
  const x0 = Math.floor(tileX(BBOX.w)), x1 = Math.floor(tileX(BBOX.e));
  const y0 = Math.floor(tileY(BBOX.n)), y1 = Math.floor(tileY(BBOX.s));
  const cols = x1 - x0 + 1, rows = y1 - y0 + 1;
  const cv = document.createElement('canvas'); cv.width = cols * 256; cv.height = rows * 256;
  const ctx = cv.getContext('2d', { willReadFrequently: true });
  const jobs = [];
  for (let x = x0; x <= x1; x++) for (let y = y0; y <= y1; y++) {
    jobs.push(fetch(`https://s3.amazonaws.com/elevation-tiles-prod/terrarium/${Z}/${x}/${y}.png`)
      .then(r => { if (!r.ok) throw new Error('tile ' + r.status); return r.blob(); })
      .then(b => createImageBitmap(b))
      .then(img => ctx.drawImage(img, (x - x0) * 256, (y - y0) * 256)));
  }
  await Promise.all(jobs);
  const px = ctx.getImageData(0, 0, cv.width, cv.height).data;
  const H = new Float32Array(N * N);
  const fx0 = (tileX(BBOX.w) - x0) * 256, fx1 = (tileX(BBOX.e) - x0) * 256;
  const fy0 = (tileY(BBOX.n) - y0) * 256, fy1 = (tileY(BBOX.s) - y0) * 256;
  const at = (x, y) => { const i = (y * cv.width + x) * 4; return px[i] * 256 + px[i + 1] + px[i + 2] / 256 - 32768; };
  for (let j = 0; j < N; j++) for (let i = 0; i < N; i++) {
    const fx = fx0 + (fx1 - fx0) * i / (N - 1), fy = fy0 + (fy1 - fy0) * j / (N - 1);
    const ix = Math.min(cv.width - 2, Math.floor(fx)), iy = Math.min(cv.height - 2, Math.floor(fy));
    const tx = fx - ix, ty = fy - iy;
    H[j * N + i] = (at(ix, iy) * (1 - tx) + at(ix + 1, iy) * tx) * (1 - ty) + (at(ix, iy + 1) * (1 - tx) + at(ix + 1, iy + 1) * tx) * ty;
  }
  return H;
}

async function start() {
  if (reduce || saveData || lowMem || !webgl2()) return fallback(reduce ? 'reduced-motion' : 'liviano');
  const THREE = await import('../vendor/three.module.min.js');
  const N = mobile ? 128 : 200;
  const H = await loadHeights(N);

  // Escala: 1 unidad = 100 m.
  const kmW = (BBOX.e - BBOX.w) * 111.32 * Math.cos(41.17 * Math.PI / 180);
  const kmH = (BBOX.n - BBOX.s) * 110.57;
  const W = kmW * 10, D = kmH * 10, EX = 1.25;
  const geo = new THREE.PlaneGeometry(W, D, N - 1, N - 1);
  geo.rotateX(-Math.PI / 2);
  const pos = geo.attributes.position;
  for (let k = 0; k < pos.count; k++) pos.setY(k, H[k] / 100 * EX);
  geo.computeVertexNormals();

  // Color por altura y pendiente: bosque, roca, nieve.
  const nor = geo.attributes.normal, col = new Float32Array(pos.count * 3);
  const forest = new THREE.Color('#3f4d2c'), scrub = new THREE.Color('#6b6a4a'), rock = new THREE.Color('#7d7468'), snow = new THREE.Color('#f4f1ea'), dark = new THREE.Color('#4a4540');
  const c = new THREE.Color();
  const sm = (a, b, x) => { const t = Math.min(1, Math.max(0, (x - a) / (b - a))); return t * t * (3 - 2 * t); };
  for (let k = 0; k < pos.count; k++) {
    const h = H[k], up = nor.getY(k);
    c.copy(forest).lerp(scrub, sm(1100, 1450, h)).lerp(rock, sm(1400, 1750, h));
    c.lerp(dark, sm(0.85, 0.55, up) * 0.6);
    c.lerp(snow, sm(1750, 2050, h) * sm(0.45, 0.75, up));
    col.set([c.r, c.g, c.b], k * 3);
  }
  geo.setAttribute('color', new THREE.BufferAttribute(col, 3));

  const renderer = new THREE.WebGLRenderer({ canvas, antialias: !mobile, alpha: true, powerPreference: 'high-performance' });
  renderer.setPixelRatio(Math.min(devicePixelRatio, mobile ? 1.25 : 1.5));
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.05;
  const scene = new THREE.Scene();
  scene.fog = new THREE.Fog('#e9b98f', 90, 330);
  scene.add(new THREE.Mesh(geo, new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.95, metalness: 0 })));
  scene.add(new THREE.HemisphereLight('#ffd9b0', '#2b3324', 0.9));
  const sun = new THREE.DirectionalLight('#ffb070', 2.6);
  sun.position.set(-180, 70, 40); scene.add(sun);

  const toXZ = (lat, lon) => [((lon - BBOX.w) / (BBOX.e - BBOX.w) - 0.5) * W, ((BBOX.n - lat) / (BBOX.n - BBOX.s) - 0.5) * D];
  const heightAt = (x, z) => {
    const i = Math.round((x / W + 0.5) * (N - 1)), j = Math.round((z / D + 0.5) * (N - 1));
    return H[Math.max(0, Math.min(N - 1, j)) * N + Math.max(0, Math.min(N - 1, i))] / 100 * EX;
  };
  const [mx, mz] = toXZ(PLACES.meiling.lat, PLACES.meiling.lon);
  const my = heightAt(mx, mz);
  const markerTop = new THREE.Vector3(mx, my + 9, mz);
  const line = new THREE.Line(new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(mx, my, mz), markerTop]), new THREE.LineBasicMaterial({ color: '#c4602d' }));
  const dot = new THREE.Mesh(new THREE.SphereGeometry(0.9, 16, 12), new THREE.MeshBasicMaterial({ color: '#c4602d', fog: false }));
  dot.position.copy(markerTop); scene.add(line, dot);

  const [sx, sz] = toXZ(PLACES.summit.lat, PLACES.summit.lon);
  const target = new THREE.Vector3((sx + mx) / 2, heightAt(sx, sz) * 0.55, (sz + mz) / 2);
  const camera = new THREE.PerspectiveCamera(mobile ? 55 : 42, 1, 1, 900);

  function resize() {
    const w = stage.clientWidth, h = stage.clientHeight;
    renderer.setSize(w, h, false); camera.aspect = w / h; camera.updateProjectionMatrix();
  }
  addEventListener('resize', resize); resize();

  // Progreso del scroll dentro de la portada (0 arriba, 1 al terminar).
  const progress = () => {
    const r = hero.getBoundingClientRect(), span = hero.offsetHeight - innerHeight;
    return span > 0 ? Math.min(1, Math.max(0, -r.top / span)) : 0;
  };
  let p = progress(), shown = p, visible = true, t0 = performance.now();
  new IntersectionObserver(es => { visible = es[0].isIntersecting; if (visible) loop(); }).observe(hero);
  document.addEventListener('visibilitychange', () => { if (!document.hidden) loop(); });

  const v = new THREE.Vector3();
  let running = false;
  function frame(now) {
    if (!visible || document.hidden) { running = false; return; }
    p = progress();
    shown += (p - shown) * 0.08; // suavizado: el dron frena y acelera
    const t = (now - t0) / 1000;
    const ang = 2.35 + shown * Math.PI * 1.15 + Math.sin(t * 0.15) * 0.02;
    const rad = 120 - shown * 45, alt = 62 - shown * 22;
    camera.position.set(target.x + Math.cos(ang) * rad, target.y + alt, target.z + Math.sin(ang) * rad);
    camera.lookAt(target.x, target.y + shown * 4, target.z);
    renderer.render(scene, camera);
    // Etiqueta HTML del refugio, proyectada sobre el punto.
    v.copy(markerTop).project(camera);
    const behind = v.z > 1;
    pin.style.transform = `translate(${(v.x * 0.5 + 0.5) * stage.clientWidth}px,${(-v.y * 0.5 + 0.5) * stage.clientHeight}px)`;
    pin.style.opacity = behind ? 0 : 1;
    hero.style.setProperty('--p', shown.toFixed(3));
    requestAnimationFrame(frame);
  }
  function loop() { if (!running) { running = true; requestAnimationFrame(frame); } }
  hero.classList.add('live');
  loop();
}

start().catch(e => { console.warn('Portada 3D: uso la imagen fija', e); fallback('error'); });
