// Portada: relieve real del Tronador al Cerro Catedral, con cámara tipo dron que avanza con el scroll y vuelve al subir.
// Datos preprocesados con tools/terreno.py:
//  - zona de detalle (~52 x 33 km): Copernicus DEM GLO-30, albedo y normal map (con sombras) de hasta 4096 px;
//  - anillo exterior (~168 x 149 km): AWS Terrain Tiles, color con luz horneada, liviano; se funde con la bruma.
// La zona de detalle se arma en bloques con nivel de detalle (LOD) según la distancia a la cámara.
// Carga progresiva: primero una versión liviana (alturas 384, texturas 1024) y después la alta, con un fundido de alturas.
const hero = document.getElementById('hero');
const stage = document.getElementById('stage');
const canvas = document.getElementById('terrain');
const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
const saveData = navigator.connection && navigator.connection.saveData;
const lowMem = navigator.deviceMemory && navigator.deviceMemory < 4;
const mobile = matchMedia('(max-width: 820px), (pointer: coarse)').matches;

// Calidad según el dispositivo: [alturas, sufijo de texturas, quads por bloque]
const LIGHT = { alt: 384, tex: '-1024', chunk: 16 };
const HIGH = mobile ? { alt: 768, tex: '-2048', chunk: 32 } : { alt: 1536, tex: '', chunk: 64 };

// Paleta (docs/investigacion-estetica.md) aplicada al cielo, la bruma y la luz.
const SKY = { zenith: '#2a74a6', mid: '#79abc0', horizon: '#d9d7c6' };
const EX = 1.15;            // exageración vertical
const U = 10;               // unidades por km (1 unidad = 100 m)

// Recorrido del dron: [progreso, cámara lat, lon, altura m, mira lat, lon, altura m]. Todo dentro de la zona de detalle.
const PATH = [
  [0.00, -41.262, -71.640, 2900, -41.168, -71.860, 2300],
  [0.35, -41.236, -71.728, 2650, -41.172, -71.842, 2200],
  [0.65, -41.196, -71.758, 3100, -41.160, -71.884, 2800],
  [1.00, -41.140, -71.792, 3450, -41.196, -71.540, 1500]
];

function fallback(reason) { hero.classList.add('static'); hero.dataset.reason = reason; }
function webgl2() { try { return !!document.createElement('canvas').getContext('webgl2'); } catch (e) { return false; } }

async function heightsFrom(url, scale) {
  const blob = await (await fetch(url, { priority: 'low' })).blob();
  const bmp = await createImageBitmap(blob, { colorSpaceConversion: 'none', premultiplyAlpha: 'none' });
  const cv = document.createElement('canvas'); cv.width = bmp.width; cv.height = bmp.height;
  const ctx = cv.getContext('2d', { willReadFrequently: true }); ctx.drawImage(bmp, 0, 0);
  const px = ctx.getImageData(0, 0, bmp.width, bmp.height).data;
  const h = new Float32Array(bmp.width * bmp.height);
  for (let i = 0; i < h.length; i++) h[i] = (px[i * 4] * 256 + px[i * 4 + 1]) / scale;
  return { w: bmp.width, h: bmp.height, d: h };
}

function sampler(g) {
  return (u, v) => {
    const x = Math.min(g.w - 1.001, Math.max(0, u * (g.w - 1))), y = Math.min(g.h - 1.001, Math.max(0, v * (g.h - 1)));
    const ix = x | 0, iy = y | 0, tx = x - ix, ty = y - iy, i = iy * g.w + ix;
    return (g.d[i] * (1 - tx) + g.d[i + 1] * tx) * (1 - ty) + (g.d[i + g.w] * (1 - tx) + g.d[i + g.w + 1] * tx) * ty;
  };
}

const lin = hex => { const c = parseInt(hex.slice(1), 16); return [(c >> 16 & 255) / 255, (c >> 8 & 255) / 255, (c & 255) / 255].map(v => Math.pow(v, 2.2)); };

async function start() {
  if (reduce || saveData || lowMem || !webgl2()) return fallback(reduce ? 'reduced-motion' : 'liviano');
  // que el plan (itinerario, casas) cargue primero: el 3D arranca cuando el navegador queda libre
  await new Promise(r => (window.requestIdleCallback || ((f) => setTimeout(f, 300)))(r, { timeout: 1500 }));
  const [THREE, meta] = await Promise.all([import('../vendor/three.module.min.js'), fetch('data/terreno.json').then(r => r.json())]);
  const C = meta.cerca, O = meta.lejos;
  const altH = w => C.alts.find(a => a[0] === w)[1];

  // Proyección local: origen en el centro de la zona de detalle.
  const lat0 = (C.n + C.s) / 2, lon0 = (C.w + C.e) / 2;
  const kx = 111.32 * Math.cos(lat0 * Math.PI / 180) * U, kz = 110.57 * U;
  const X = lon => (lon - lon0) * kx, Zc = lat => (lat0 - lat) * kz;
  const rc = [X(C.w), Zc(C.n), X(C.e) - X(C.w), Zc(C.s) - Zc(C.n)];
  const ro = [X(O.w), Zc(O.n), X(O.e) - X(O.w), Zc(O.s) - Zc(O.n)];

  const renderer = new THREE.WebGLRenderer({ canvas, antialias: !mobile, alpha: false, powerPreference: 'high-performance' });
  renderer.setPixelRatio(Math.min(devicePixelRatio, mobile ? 1.25 : 1.5));
  const aniso = Math.min(mobile ? 4 : 8, renderer.capabilities.getMaxAnisotropy());
  const loader = new THREE.TextureLoader();
  const tex = url => new Promise((res, rej) => loader.load(url, t => {
    t.flipY = false; t.colorSpace = THREE.NoColorSpace; t.anisotropy = aniso;
    t.wrapS = t.wrapT = THREE.ClampToEdgeWrapping; res(t);
  }, undefined, rej));

  // --- primera carga, liviana ---
  const [gO, gL, tO, tA0, tN0] = await Promise.all([
    heightsFrom('data/terreno-lejos-alt.png', 10), heightsFrom(`data/terreno-cerca-alt-${LIGHT.alt}.png`, 1),
    tex('data/terreno-lejos.jpg'), tex(`data/terreno-cerca-color${LIGHT.tex}.jpg`), tex(`data/terreno-cerca-normal${LIGHT.tex}.jpg`)]);
  const sO = sampler(gO);
  let sC = sampler(gL);
  const inCore = (x, z) => { const u = (x - rc[0]) / rc[2], v = (z - rc[1]) / rc[3]; return [u, v]; };
  // altura (m) en cualquier punto: zona de detalle si cae adentro, si no el anillo; fundido en el 4 % de afuera
  const hAt = (x, z) => {
    const [u, v] = inCore(x, z);
    const ho = sO((x - ro[0]) / ro[2], (z - ro[1]) / ro[3]);
    const e = Math.min(u, 1 - u, v, 1 - v);
    if (e >= 0) return sC(u, v);
    const w = Math.max(0, 1 + e / 0.04);
    return w > 0 ? ho + (sC(Math.min(1, Math.max(0, u)), Math.min(1, Math.max(0, v))) - ho) * w * w : ho;
  };
  const yAt = (x, z) => hAt(x, z) / 100 * EX;

  const col = c => new THREE.Color(c);
  const fogCol = col(SKY.horizon);
  const az = 315 * Math.PI / 180, el = (meta.sol ? meta.sol.el : 27) * Math.PI / 180;
  const sunDir = new THREE.Vector3(Math.sin(az) * Math.cos(el), Math.sin(el), -Math.cos(az) * Math.cos(el));
  const sunCol = new THREE.Vector3(...lin('#ffd9a8').map(v => v * 2.05));
  const skyCol = new THREE.Vector3(...lin('#9fc0d8').map(v => v * 0.62));
  const FOG = `
    float d = distance(vW, cameraPosition);
    float f = 1.0 - exp(-pow(d * fogK, 3.0));
    f = max(f, 0.16 * (1.0 - exp(-d * 0.006)));`;

  // --- anillo exterior: grilla rala con densidad creciente hacia la zona de detalle; descarta lo que cae adentro ---
  function axis(c0, c1, o0, o1, nc, no) {
    const a = [];
    for (let i = no; i >= 1; i--) a.push(c0 - (c0 - o0) * Math.pow(i / no, 2.2));
    for (let i = 0; i < nc; i++) a.push(c0 + (c1 - c0) * i / (nc - 1));
    for (let i = 1; i <= no; i++) a.push(c1 + (o1 - c1) * Math.pow(i / no, 2.2));
    return a;
  }
  // adentro de la zona de detalle se descarta, pero hace falta densidad para que el borde calce sin huecos
  const ax = axis(rc[0], rc[0] + rc[2], ro[0], ro[0] + ro[2], mobile ? 96 : 170, mobile ? 30 : 44);
  const azs = axis(rc[1], rc[1] + rc[3], ro[1], ro[1] + ro[3], mobile ? 62 : 110, mobile ? 30 : 44);
  const oGeo = (() => {
    const NX = ax.length, NZ = azs.length, pos = new Float32Array(NX * NZ * 3);
    for (let j = 0, k = 0; j < NZ; j++) for (let i = 0; i < NX; i++, k += 3) { pos[k] = ax[i]; pos[k + 1] = yAt(ax[i], azs[j]); pos[k + 2] = azs[j]; }
    const idx = new Uint32Array((NX - 1) * (NZ - 1) * 6);
    for (let j = 0, k = 0; j < NZ - 1; j++) for (let i = 0; i < NX - 1; i++) {
      const a = j * NX + i, b = a + 1, c = a + NX, d = c + 1; idx[k++] = a; idx[k++] = c; idx[k++] = b; idx[k++] = b; idx[k++] = c; idx[k++] = d;
    }
    const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.BufferAttribute(pos, 3)); g.setIndex(new THREE.BufferAttribute(idx, 1)); return g;
  })();
  const oMat = new THREE.ShaderMaterial({
    uniforms: { tO: { value: tO }, rc: { value: new THREE.Vector4(...rc) }, ro: { value: new THREE.Vector4(...ro) }, fogCol: { value: fogCol }, fogK: { value: 0.0026 } },
    vertexShader: `varying vec3 vW; void main(){ vec4 w = modelMatrix * vec4(position,1.0); vW = w.xyz; gl_Position = projectionMatrix * viewMatrix * w; }`,
    fragmentShader: `precision highp float; uniform sampler2D tO; uniform vec4 rc, ro; uniform vec3 fogCol; uniform float fogK; varying vec3 vW;
      void main(){
        vec2 uc = (vW.xz - rc.xy) / rc.zw;
        if (uc.x > 0.0005 && uc.x < 0.9995 && uc.y > 0.0005 && uc.y < 0.9995) discard;
        vec2 uo = (vW.xz - ro.xy) / ro.zw;
        vec3 c = texture2D(tO, uo).rgb;${FOG}
        float edge = min(min(uo.x, 1.0 - uo.x), min(uo.y, 1.0 - uo.y));
        f = max(f, 1.0 - smoothstep(0.0, 0.12, edge));
        gl_FragColor = vec4(mix(c, fogCol, clamp(f, 0.0, 1.0)), 1.0);
      }`
  });
  const scene = new THREE.Scene();
  scene.add(new THREE.Mesh(oGeo, oMat));

  // --- zona de detalle: luz por píxel con normal map (R,G = normal; B = sombra proyectada) ---
  const cMat = new THREE.ShaderMaterial({
    uniforms: {
      tA: { value: tA0 }, tN: { value: tN0 }, rc: { value: new THREE.Vector4(...rc) }, fogCol: { value: fogCol }, fogK: { value: 0.0026 },
      sunDir: { value: sunDir }, sunCol: { value: sunCol }, skyCol: { value: skyCol }, morph: { value: 1 }
    },
    side: THREE.DoubleSide,
    vertexShader: `attribute float h0; uniform float morph; varying vec3 vW; varying vec2 vUv; uniform vec4 rc;
      void main(){ vec3 p = position; p.y = mix(h0, position.y, morph); vec4 w = modelMatrix * vec4(p,1.0); vW = w.xyz;
        vUv = (vW.xz - rc.xy) / rc.zw; gl_Position = projectionMatrix * viewMatrix * w; }`,
    fragmentShader: `precision highp float;
      uniform sampler2D tA, tN; uniform vec3 fogCol, sunDir, sunCol, skyCol; uniform float fogK; varying vec3 vW; varying vec2 vUv;
      void main(){
        vec2 uv = clamp(vUv, 0.0, 1.0);
        vec3 alb = pow(texture2D(tA, uv).rgb, vec3(2.2));
        vec3 nt = texture2D(tN, uv).rgb;
        vec2 ne = nt.rg * 2.0 - 1.0;
        vec3 N = normalize(vec3(ne.x, sqrt(max(0.0, 1.0 - dot(ne, ne))), -ne.y));
        float dif = max(dot(N, sunDir), 0.0) * nt.b;
        vec3 c = alb * (sunCol * dif + skyCol * (0.55 + 0.45 * N.y));
        c = c / (1.0 + c * 0.35);
        c = pow(clamp(c, 0.0, 1.0), vec3(1.0 / 2.2)) * 0.95 + vec3(0.035, 0.025, 0.012);${FOG}
        gl_FragColor = vec4(mix(c, fogCol, clamp(f, 0.0, 1.0)), 1.0);
      }`
  });

  // Bloques: todos con la misma topología, así los índices de cada nivel de detalle se comparten.
  const idxCache = {};
  function indices(Cq, step) {
    const key = Cq + ':' + step; if (idxCache[key]) return idxCache[key];
    const V = Cq + 1, n = Cq / step, a = [];
    for (let j = 0; j < n; j++) for (let i = 0; i < n; i++) {
      const p = (j * step) * V + i * step, q = p + step, r = p + step * V, s = r + step;
      a.push(p, r, q, q, r, s);
    }
    // faldones: cada borde baja una franja vertical para tapar las grietas entre niveles
    const base = V * V;
    const edge = e => { const out = []; for (let k = 0; k <= Cq; k += step) out.push(k); return out.map(k => [e === 0 ? k : e === 1 ? k * V + Cq : e === 2 ? Cq * V + (Cq - k) : (Cq - k) * V, base + e * V + k]); };
    for (let e = 0; e < 4; e++) { const E = edge(e); for (let k = 0; k < E.length - 1; k++) { const [t0, s0] = E[k], [t1, s1] = E[k + 1]; a.push(t0, s0, t1, t1, s0, s1); } }
    return (idxCache[key] = new THREE.BufferAttribute(new Uint32Array(a), 1));
  }
  let chunks = [];
  const coreGroup = new THREE.Group(); scene.add(coreGroup);
  function buildCore(level, prev) {
    const Cq = level.chunk, nCx = Math.max(1, Math.round((level.alt - 1) / Cq)), nCz = Math.max(1, Math.round((altH(level.alt) - 1) / Cq));
    const V = Cq + 1, dxw = rc[2] / (nCx * Cq), dzw = rc[3] / (nCz * Cq), skirt = 0.9 * EX;
    const list = [];
    for (let cj = 0; cj < nCz; cj++) for (let ci = 0; ci < nCx; ci++) {
      const pos = new Float32Array((V * V + 4 * V) * 3), h0 = new Float32Array(V * V + 4 * V);
      const x0 = rc[0] + ci * Cq * dxw, z0 = rc[1] + cj * Cq * dzw;
      for (let j = 0; j < V; j++) for (let i = 0; i < V; i++) {
        const k = j * V + i, x = x0 + i * dxw, z = z0 + j * dzw, u = (x - rc[0]) / rc[2], v = (z - rc[1]) / rc[3];
        pos[k * 3] = x; pos[k * 3 + 1] = sC(u, v) / 100 * EX; pos[k * 3 + 2] = z;
        h0[k] = prev ? prev(u, v) / 100 * EX : pos[k * 3 + 1];
      }
      const ring = [k => k, k => k * V + Cq, k => Cq * V + (Cq - k), k => (Cq - k) * V];
      for (let e = 0; e < 4; e++) for (let k = 0; k < V; k++) {
        const src = ring[e](k), dst = V * V + e * V + k;
        pos[dst * 3] = pos[src * 3]; pos[dst * 3 + 1] = pos[src * 3 + 1] - skirt; pos[dst * 3 + 2] = pos[src * 3 + 2]; h0[dst] = h0[src] - skirt;
      }
      const g = new THREE.BufferGeometry();
      g.setAttribute('position', new THREE.BufferAttribute(pos, 3)); g.setAttribute('h0', new THREE.BufferAttribute(h0, 1));
      g.setIndex(indices(Cq, 1)); g.computeBoundingSphere(); g.boundingSphere.radius += 3;
      const m = new THREE.Mesh(g, cMat); m.frustumCulled = true;
      list.push({ mesh: m, c: new THREE.Vector3(x0 + Cq * dxw / 2, g.boundingSphere.center.y, z0 + Cq * dzw / 2), Cq, step: 1, size: Cq * dxw });
    }
    coreGroup.clear(); chunks.forEach(c => c.mesh.geometry.dispose());
    list.forEach(c => coreGroup.add(c.mesh)); chunks = list;
  }
  buildCore(LIGHT, null);
  function updateLOD() {
    for (const c of chunks) {
      const d = Math.max(0, camera.position.distanceTo(c.c) - c.size * 0.7);
      let step = d < 45 ? 1 : d < 110 ? 2 : d < 240 ? 4 : 8;
      while (step > 1 && c.Cq % step) step /= 2;
      if (step !== c.step) { c.step = step; c.mesh.geometry.setIndex(indices(c.Cq, step)); }
    }
  }

  // Cielo: cúpula con degradé (cenit, medio y horizonte = bruma), sigue a la cámara.
  const sky = new THREE.Mesh(new THREE.SphereGeometry(900, 32, 16), new THREE.ShaderMaterial({
    side: THREE.BackSide, depthWrite: false, depthTest: false,
    uniforms: { z: { value: col(SKY.zenith) }, m: { value: col(SKY.mid) }, h: { value: fogCol } },
    vertexShader: `varying vec3 vD; void main(){ vD = position; gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }`,
    fragmentShader: `uniform vec3 z, m, h; varying vec3 vD; void main(){ float y = normalize(vD).y;
      vec3 c = mix(h, m, smoothstep(-0.02, 0.12, y)); c = mix(c, z, smoothstep(0.08, 0.65, y)); gl_FragColor = vec4(c, 1.0); }`
  }));
  sky.renderOrder = -1; scene.add(sky);

  // Marcadores
  const P = meta.places;
  const markers = [];
  function marker(key, elId, lift, dot) {
    const p = P[key], x = X(p.lon), z = Zc(p.lat), y = yAt(x, z);
    const top = new THREE.Vector3(x, y + lift, z);
    const parts = [];
    if (dot) {
      const line = new THREE.Line(new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(x, y, z), top]), new THREE.LineBasicMaterial({ color: '#a3301d' }));
      const s = new THREE.Mesh(new THREE.SphereGeometry(0.55, 16, 12), new THREE.MeshBasicMaterial({ color: '#c4462c' }));
      s.position.copy(top); scene.add(line, s); parts.push(line, s);
    }
    const el = document.getElementById(elId);
    if (el) markers.push({ el, top, key, lift, parts });
  }
  marker('meiling', 'pin', 9, true);
  marker('frey', 'pinFrey', 9, true);
  marker('tronador', 'pinTronador', 2, false);
  marker('pampa', 'pinPampa', 2, false);
  function replant() {   // con las alturas nuevas, los marcadores se apoyan en el terreno de alta resolución
    for (const m of markers) {
      const p = P[m.key], x = X(p.lon), z = Zc(p.lat), y = yAt(x, z);
      m.top.set(x, y + m.lift, z);
      if (m.parts.length) { m.parts[0].geometry.setFromPoints([new THREE.Vector3(x, y, z), m.top]); m.parts[1].position.copy(m.top); }
    }
  }

  // Cámara y recorrido
  const toV = (lat, lon, alt) => new THREE.Vector3(X(lon), alt / 100 * EX, Zc(lat));
  const camCurve = new THREE.CatmullRomCurve3(PATH.map(k => toV(k[1], k[2], k[3])), false, 'centripetal');
  const lookCurve = new THREE.CatmullRomCurve3(PATH.map(k => toV(k[4], k[5], k[6])), false, 'centripetal');
  const stops = PATH.map(k => k[0]);
  const curveT = p => {
    for (let i = 0; i < stops.length - 1; i++) if (p <= stops[i + 1]) return (i + (p - stops[i]) / (stops[i + 1] - stops[i])) / (stops.length - 1);
    return 1;
  };
  const camera = new THREE.PerspectiveCamera(mobile ? 56 : 44, 1, 0.5, 1000);
  function resize() {
    const w = stage.clientWidth, h = stage.clientHeight;
    renderer.setSize(w, h, false); camera.aspect = w / h;
    camera.fov = Math.min(60, (mobile ? 56 : 44) * Math.max(1, (h / w) * 0.75));
    camera.updateProjectionMatrix();
  }
  addEventListener('resize', resize); resize();

  const progress = () => {
    const r = hero.getBoundingClientRect(), span = hero.offsetHeight - innerHeight;
    return span > 0 ? Math.min(1, Math.max(0, -r.top / span)) : 0;
  };
  let shown = progress(), visible = true, running = false, last = performance.now();
  const t0 = performance.now(), cp = new THREE.Vector3(), lp = new THREE.Vector3(), v = new THREE.Vector3(), q = new THREE.Vector3();
  function cameraAt(p, s) {
    const t = curveT(p);
    camCurve.getPoint(t, cp); lookCurve.getPoint(t, lp);
    cp.x += Math.sin(s * 0.13) * 0.6; cp.y += Math.sin(s * 0.17) * 0.3;
    cp.y = Math.max(cp.y, yAt(cp.x, cp.z) + 4);
  }

  function occluded(m) {
    for (let i = 1; i < 24; i++) { q.lerpVectors(camera.position, m.top, i / 24); if (yAt(q.x, q.z) > q.y + 0.3) return true; }
    return false;
  }
  let morphFrom = 0;
  function frame(now) {
    if (!visible || document.hidden) { running = false; return; }
    const dt = Math.min(0.25, (now - last) / 1000); last = now;
    shown += (progress() - shown) * (1 - Math.exp(-dt * 4.5));
    cameraAt(shown, (now - t0) / 1000);
    camera.position.copy(cp); camera.lookAt(lp);
    sky.position.copy(cp);
    if (cMat.uniforms.morph.value < 1) cMat.uniforms.morph.value = Math.min(1, (now - morphFrom) / 1400);
    updateLOD();
    renderer.render(scene, camera);
    const W = stage.clientWidth, H = stage.clientHeight;
    for (const m of markers) {
      v.copy(m.top).project(camera);
      const sx = (v.x * 0.5 + 0.5) * W, sy = (-v.y * 0.5 + 0.5) * H;
      const off = v.z > 1 || sx < 40 || sx > W - 40 || sy < 70 || sy > H - 40 || occluded(m);
      m.el.style.transform = `translate(${sx}px,${sy}px)`;
      m.el.style.opacity = off ? 0 : 1;
    }
    hero.style.setProperty('--p', shown.toFixed(3));
    requestAnimationFrame(frame);
  }
  function loop() { if (!running) { running = true; last = performance.now(); requestAnimationFrame(frame); } }
  new IntersectionObserver(es => { visible = es[0].isIntersecting; if (visible) loop(); }).observe(hero);
  document.addEventListener('visibilitychange', () => { if (!document.hidden) loop(); });
  hero.classList.add('live');
  loop();

  // --- segunda carga: alta resolución, sin salto (las alturas se funden en 1,4 s) ---
  try {
    const [gH, tA, tN] = await Promise.all([heightsFrom(`data/terreno-cerca-alt-${HIGH.alt}.png`, 1),
      tex(`data/terreno-cerca-color${HIGH.tex}.jpg`), tex(`data/terreno-cerca-normal${HIGH.tex}.jpg`)]);
    const prev = sC; sC = sampler(gH);
    buildCore(HIGH, prev);
    const oldA = cMat.uniforms.tA.value, oldN = cMat.uniforms.tN.value;
    cMat.uniforms.tA.value = tA; cMat.uniforms.tN.value = tN; oldA.dispose(); oldN.dispose();
    cMat.uniforms.morph.value = 0; morphFrom = performance.now();
    replant();
    hero.dataset.calidad = 'alta';
  } catch (e) { console.warn('Portada 3D: sigo con la versión liviana', e); }
}

start().catch(e => { console.warn('Portada 3D: uso la imagen fija', e); fallback('error'); });
