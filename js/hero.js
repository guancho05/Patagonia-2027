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
const LIGHT = { alt: 480, tex: '-1024', chunk: 32 };
const HIGH = mobile ? { alt: 960, tex: '-2048', chunk: 48 } : { alt: 1920, tex: '', chunk: 64 };
const ROJO = '#B3321F';   // rojo polar (un punto más claro que el token, para que se lea sobre el bosque): marcadores y senderos

// Paleta (docs/investigacion-estetica.md) aplicada al cielo, la bruma y la luz.
const SKY = { zenith: '#5F88A8', mid: '#9DBCD3', horizon: '#DCE7EE' };   // cielo glaciar: granito azulado arriba, bruma color nieve en el horizonte
const EX = 1.15;            // exageración vertical
const U = 10;               // unidades por km (1 unidad = 100 m)

// Recorrido del dron: puntos de control [cámara lat, lon, altura m, mira lat, lon, altura m], en orden.
// La cámara va por una spline a velocidad constante (por longitud de arco); la mirada usa los mismos tramos.
const PATH = [
  [-41.045, -71.245, 5600, -41.125, -71.315, 800],    // sobre el Nahuel Huapi, mirando Bariloche desde arriba
  [-41.095, -71.345, 5400, -41.165, -71.430, 1200],
  [-41.142, -71.447, 5200, -41.183, -71.463, 1400],   // encima del sendero Villa Catedral → Refugio Frey, completo
  [-41.170, -71.560, 5600, -41.200, -71.660, 1500],   // hacia el oeste
  [-41.215, -71.690, 6600, -41.205, -71.785, 1700],
  [-41.272, -71.738, 7800, -41.203, -71.796, 1500]    // final: sendero Pampa Linda → Refugio Otto Meiling, con el Tronador atrás
]
const ACCEL = 0.14;   // fracción del recorrido para acelerar y para frenar
const HOLD = 0.92;    // la cámara llega al Catedral al 92 % del scroll y se queda quieta

const ceder = () => new Promise(r => setTimeout(r, 0));   // corta el trabajo en partes para no trabar el scroll ni los toques mientras se arma el relieve
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
  const tW = await tex('data/terreno-cerca-agua.png');
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
  const sunCol = new THREE.Vector3(...lin('#FFE4BC').map(v => v * 2.05));
  const skyCol = new THREE.Vector3(...lin('#B8D3E7').map(v => v * 0.62));
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
  await ceder();
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
    // adentro de la zona de detalle el anillo se hunde 300 m: queda tapado por el terreno nítido y no deja huecos en la costura
    vertexShader: `uniform vec4 rc; varying vec3 vW; void main(){ vec3 p = position; vec2 uc = (p.xz - rc.xy) / rc.zw;
      if (uc.x > 0.0005 && uc.x < 0.9995 && uc.y > 0.0005 && uc.y < 0.9995) p.y -= ${(3 * 1.15).toFixed(2)};
      vec4 w = modelMatrix * vec4(p,1.0); vW = w.xyz; gl_Position = projectionMatrix * viewMatrix * w; }`,
    fragmentShader: `precision highp float; uniform sampler2D tO; uniform vec4 rc, ro; uniform vec3 fogCol; uniform float fogK; varying vec3 vW;
      void main(){
        vec2 uo = (vW.xz - ro.xy) / ro.zw;
        vec3 c = texture2D(tO, uo).rgb;${FOG}
        float edge = min(min(uo.x, 1.0 - uo.x), min(uo.y, 1.0 - uo.y));
        f = max(f, 1.0 - smoothstep(0.0, 0.12, edge));
        gl_FragColor = vec4(mix(c, fogCol, clamp(f, 0.0, 1.0)), 1.0);
      }`
  });
  await ceder();
  const scene = new THREE.Scene();
  scene.add(new THREE.Mesh(oGeo, oMat));

  // --- zona de detalle: luz por píxel con normal map (R,G = normal; B = sombra proyectada) ---
  const cMat = new THREE.ShaderMaterial({
    uniforms: {
      tA: { value: tA0 }, tN: { value: tN0 }, rc: { value: new THREE.Vector4(...rc) }, fogCol: { value: fogCol }, fogK: { value: 0.0026 },
      sunDir: { value: sunDir }, sunCol: { value: sunCol }, skyCol: { value: skyCol }, morph: { value: 1 },
      tW: { value: tW }, skyZ: { value: new THREE.Color(SKY.zenith) }, skyM: { value: new THREE.Color(SKY.mid) }
    },
    side: THREE.DoubleSide,
    vertexShader: `attribute float h0; uniform float morph; varying vec3 vW; varying vec2 vUv; uniform vec4 rc;
      void main(){ vec3 p = position; p.y = mix(h0, position.y, morph); vec4 w = modelMatrix * vec4(p,1.0); vW = w.xyz;
        vUv = (vW.xz - rc.xy) / rc.zw; gl_Position = projectionMatrix * viewMatrix * w; }`,
    fragmentShader: `precision highp float;
      uniform sampler2D tA, tN, tW; uniform vec3 fogCol, sunDir, sunCol, skyCol, skyZ, skyM; uniform float fogK; varying vec3 vW; varying vec2 vUv;
      void main(){
        vec2 uv = clamp(vUv, 0.0, 1.0);
        vec3 alb = pow(texture2D(tA, uv).rgb, vec3(2.2));
        vec3 nt = texture2D(tN, uv).rgb;
        vec2 ne = nt.rg * 2.0 - 1.0;
        vec3 N = normalize(vec3(ne.x, sqrt(max(0.0, 1.0 - dot(ne, ne))), -ne.y));
        float dif = max(dot(N, sunDir), 0.0) * nt.b;
        vec3 c = alb * (sunCol * dif + skyCol * (0.55 + 0.45 * N.y));
        c = c / (1.0 + c * 0.35);
        c = pow(clamp(c, 0.0, 1.0), vec3(1.0 / 2.2)) * 0.95 + vec3(0.035, 0.025, 0.012);
        // agua plana (lagos y ríos de OSM y Copernicus) con reflejo suave del cielo (Fresnel) y una ondulación mínima
        float wa = texture2D(tW, uv).r;
        if (wa > 0.01) {
          vec3 V = normalize(cameraPosition - vW);
          float rip = sin(vW.x * 3.1 + vW.z * 1.7) * sin(vW.z * 2.3 - vW.x * 0.9) * 0.02;
          float vy = clamp(V.y + rip, 0.0, 1.0);
          float fres = 0.04 + 0.96 * pow(1.0 - vy, 5.0);
          vec3 refl = mix(fogCol, mix(skyM, skyZ, smoothstep(0.1, 0.7, vy)), smoothstep(0.0, 0.15, vy));
          vec3 deep = vec3(0.07, 0.17, 0.27) * (0.75 + 0.35 * dot(vec3(0.0, 1.0, 0.0), sunDir));
          vec3 wc = mix(deep, refl, clamp(0.18 + fres * 0.8, 0.0, 0.92));
          c = mix(c, wc, wa);
        }${FOG}
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
  async function buildCore(level, prev) {
    const Cq = level.chunk, nCx = Math.max(1, Math.round((level.alt - 1) / Cq)), nCz = Math.max(1, Math.round((altH(level.alt) - 1) / Cq));
    const V = Cq + 1, dxw = rc[2] / (nCx * Cq), dzw = rc[3] / (nCz * Cq), skirt = 4 * EX;   // faldones de 400 m: tapan grietas entre niveles de detalle
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
      const hasTrail = (meta.senderos || []).some(t => t.pts.some(([la, lo]) => { const x = X(lo), z = Zc(la); return x >= x0 - 2 && x <= x0 + Cq * dxw + 2 && z >= z0 - 2 && z <= z0 + Cq * dzw + 2; }));
      list.push({ mesh: m, c: new THREE.Vector3(x0 + Cq * dxw / 2, g.boundingSphere.center.y, z0 + Cq * dzw / 2), Cq, step: 1, size: Cq * dxw, trail: hasTrail });
      if (list.length % 4 === 0) await ceder();
    }
    coreGroup.clear(); chunks.forEach(c => c.mesh.geometry.dispose());
    list.forEach(c => coreGroup.add(c.mesh)); chunks = list;
  }
  await buildCore(LIGHT, null);
  function updateLOD() {
    for (const c of chunks) {
      const d = Math.max(0, camera.position.distanceTo(c.c) - c.size * 0.7);
      let step = d < 45 ? 1 : d < 110 ? 2 : d < 240 ? 4 : 8;
      if (c.trail) step = Math.min(step, 2);   // donde pasa un sendero, el relieve no se simplifica de más
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
  // tamaño de cada cartel sin forzar un cálculo de estilos en cada cuadro
  const sizeObs = new ResizeObserver(es => { for (const e of es) { const m = markers.find(k => k.box === e.target); if (!m) continue;
    const b = e.borderBoxSize && e.borderBoxSize[0]; m.bw = b ? b.inlineSize : e.target.offsetWidth; m.bh = b ? b.blockSize : e.target.offsetHeight; } });
  function marker(key, elId, lift, dot) {
    const p = P[key], x = X(p.lon), z = Zc(p.lat), y = yAt(x, z);
    const top = new THREE.Vector3(x, y + lift, z);
    const parts = [];
    if (dot) {
      const line = new THREE.Line(new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(x, y, z), top]), new THREE.LineBasicMaterial({ color: ROJO }));
      const s = new THREE.Mesh(new THREE.SphereGeometry(0.4, 16, 12), new THREE.MeshBasicMaterial({ color: ROJO }));
      s.position.copy(top); scene.add(line, s); parts.push(line, s);
    }
    const el = typeof elId === 'string' ? document.getElementById(elId) : elId;
    if (!el) return;
    const stem = document.createElement('i'); stem.className = 'stem'; el.appendChild(stem);
    const m = { el, box: el.firstElementChild, stem, top, key, lift, parts, near: dot ? 95 : 260, trail: el.querySelector('.tr'), bw: 0, bh: 0, on: false };
    sizeObs.observe(m.box); markers.push(m);
  }
  marker('meiling', 'pin', 9, true);
  marker('frey', 'pinFrey', 4, true);
  marker('tronador', 'pinTronador', 2, false);
  marker('pampa', 'pinPampa', 2, false);
  marker('bariloche', 'pinBariloche', 6, true);
  // lagos: etiquetas creadas desde los datos (punto más alejado de la costa, calculado con OSM)
  for (const l of meta.lagos || []) {
    const x = X(l.lon), z = Zc(l.lat);
    if (Math.abs(x) > rc[2] / 2 + 60 || Math.abs(z) > rc[3] / 2 + 60) continue;
    const el = document.createElement('div'); el.className = 'pin sm lago'; el.setAttribute('aria-hidden', 'true');
    el.innerHTML = `<div><b>${l.name.replace(/^Laguna /, 'Laguna ')}</b></div>`; stage.appendChild(el);
    P['lago:' + l.name] = { lat: l.lat, lon: l.lon }; marker('lago:' + l.name, el, 0.6, false);
  }
  // senderos de OSM: línea punteada roja de ancho fijo en pantalla, apoyada sobre el relieve; lo que tapa el cerro se ve más tenue
  const trailMat = (occl) => new THREE.ShaderMaterial({
    transparent: true, depthWrite: false, side: THREE.DoubleSide, depthTest: true,
    polygonOffset: true, polygonOffsetFactor: -4, polygonOffsetUnits: -8,   // apoyada sobre el relieve sin parpadear; los filos la tapan
    uniforms: { res: { value: new THREE.Vector2(1, 1) }, wpx: { value: mobile ? 5 : 4.5 }, col: { value: new THREE.Color(ROJO) }, alpha: { value: 1 } },
    vertexShader: `attribute vec3 prev; attribute vec3 next; attribute float side; attribute float dist; uniform vec2 res; uniform float wpx; varying float vD;
      void main(){ mat4 m = projectionMatrix * viewMatrix; vec4 c = m * vec4(position,1.0), a = m * vec4(prev,1.0), b = m * vec4(next,1.0);
        float asp = res.x / res.y; vec2 sa = a.xy / a.w, sb = b.xy / b.w; vec2 d = (sb - sa) * vec2(asp, 1.0);
        d = length(d) > 1e-6 ? normalize(d) : vec2(1.0, 0.0); vec2 n = vec2(-d.y, d.x); n.x /= asp;
        c.xy += n * side * wpx / res.y * c.w; vD = dist; gl_Position = c; }`,
    fragmentShader: `uniform vec3 col; uniform float alpha; varying float vD;
      void main(){ if (mod(vD, 140.0) > 85.0) discard; gl_FragColor = vec4(col, alpha); }`
  });
  const trails = [];
  function buildTrail(t) {
    const n = t.pts.length, pos = new Float32Array(n * 6), prv = new Float32Array(n * 6), nxt = new Float32Array(n * 6), side = new Float32Array(n * 2), dist = new Float32Array(n * 2);
    const V = t.pts.map(([la, lo]) => { const x = X(lo), z = Zc(la); return [x, yAt(x, z) + 0.06 * EX, z]; });
    let acc = 0;
    for (let i = 0; i < n; i++) {
      if (i) acc += Math.hypot(V[i][0] - V[i - 1][0], V[i][1] - V[i - 1][1], V[i][2] - V[i - 1][2]) * 100;
      const a = V[Math.max(0, i - 1)], b = V[Math.min(n - 1, i + 1)];
      for (let k = 0; k < 2; k++) { pos.set(V[i], (i * 2 + k) * 3); prv.set(a, (i * 2 + k) * 3); nxt.set(b, (i * 2 + k) * 3); side[i * 2 + k] = k ? 1 : -1; dist[i * 2 + k] = acc; }
    }
    const idx = []; for (let i = 0; i < n - 1; i++) { const a = i * 2; idx.push(a, a + 1, a + 2, a + 1, a + 3, a + 2); }
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.BufferAttribute(pos, 3)); g.setAttribute('prev', new THREE.BufferAttribute(prv, 3));
    g.setAttribute('next', new THREE.BufferAttribute(nxt, 3)); g.setAttribute('side', new THREE.BufferAttribute(side, 1)); g.setAttribute('dist', new THREE.BufferAttribute(dist, 1));
    g.setIndex(idx); g.computeBoundingSphere();
    return g;
  }
  const trailVis = trailMat(false);
  function addTrails() {
    trails.splice(0).forEach(m => { scene.remove(m); m.geometry.dispose(); });
    for (const t of meta.senderos || []) {
      const g = buildTrail(t);
      const m = new THREE.Mesh(g, trailVis); m.renderOrder = 3; m.frustumCulled = false; scene.add(m); trails.push(m);
    }
  }
  addTrails();
  function replant() {   // con las alturas nuevas, los marcadores se apoyan en el terreno de alta resolución
    for (const m of markers) {
      const p = P[m.key], x = X(p.lon), z = Zc(p.lat), y = yAt(x, z);
      m.top.set(x, y + m.lift, z);
      if (m.parts.length) { m.parts[0].geometry.setFromPoints([new THREE.Vector3(x, y, z), m.top]); m.parts[1].position.copy(m.top); }
    }
  }

  // Cámara y recorrido
  const toV = (lat, lon, alt) => new THREE.Vector3(X(lon), alt / 100 * EX, Zc(lat));
  const camCurve = new THREE.CatmullRomCurve3(PATH.map(k => toV(k[0], k[1], k[2])), false, 'centripetal', 0.5);
  const lookCurve = new THREE.CatmullRomCurve3(PATH.map(k => toV(k[3], k[4], k[5])), false, 'centripetal', 0.5);
  camCurve.arcLengthDivisions = 2000;
  // perfil de velocidad: acelera, sigue constante y frena (posición = integral de una velocidad trapezoidal suavizada)
  const ease = p => {
    const a = ACCEL, vmax = 1 / (1 - a);
    if (p < a) return vmax * (p * p) / (2 * a);
    if (p > 1 - a) { const r = 1 - p; return 1 - vmax * (r * r) / (2 * a); }
    return vmax * (a / 2 + (p - a));
  };
  // margen sobre el terreno precalculado y suavizado: la cámara nunca entra al cerro y no pega saltos de altura
  const NS = 600, lift = new Float32Array(NS + 1); let liftPrev = null;
  function computeLift() {
    const need = new Float32Array(NS + 1), tmp = new THREE.Vector3();
    for (let i = 0; i <= NS; i++) {
      camCurve.getPointAt(i / NS, tmp); let g = 0;
      for (const [ox, oz] of [[0, 0], [4, 0], [-4, 0], [0, 4], [0, -4]]) g = Math.max(g, yAt(tmp.x + ox, tmp.z + oz));
      need[i] = Math.max(0, g + 4.5 - tmp.y);
    }
    const R = 40, mx = new Float32Array(NS + 1);
    for (let i = 0; i <= NS; i++) { let m = 0; for (let k = -R; k <= R; k++) m = Math.max(m, need[Math.min(NS, Math.max(0, i + k))]); mx[i] = m; }
    for (let i = 0; i <= NS; i++) { let a = 0, w = 0; for (let k = -R; k <= R; k++) { const g = Math.exp(-(k * k) / (2 * 15 * 15)); a += mx[Math.min(NS, Math.max(0, i + k))] * g; w += g; } lift[i] = a / w; }
  }
  computeLift();
  const camera = new THREE.PerspectiveCamera(mobile ? 56 : 44, 1, 0.5, 1000);
  function resize() {
    const w = stage.clientWidth, h = stage.clientHeight;
    renderer.setSize(w, h, false); camera.aspect = w / h;
    trailVis.uniforms.res.value.set(w, h);
    camera.fov = Math.min(60, (mobile ? 56 : 44) * Math.max(1, (h / w) * 0.75));
    camera.updateProjectionMatrix();
  }
  addEventListener('resize', resize); resize();

  const progress = () => {
    const r = hero.getBoundingClientRect(), span = hero.offsetHeight - innerHeight;
    return span > 0 ? Math.min(1, Math.max(0, -r.top / span)) : 0;
  };
  // seguimiento del scroll con un resorte críticamente amortiguado, por tiempo (igual a 30 o 120 fps)
  let shown = progress(), vel = 0, visible = true, running = false, last = performance.now();
  const W0 = 3.2;
  const t0 = performance.now(), cp = new THREE.Vector3(), lp = new THREE.Vector3(), v = new THREE.Vector3(), q = new THREE.Vector3();
  function cameraAt(p, s) {
    const u = Math.min(1, Math.max(0, ease(Math.min(1, p / HOLD))));   // el cierre se sostiene quieto al final del scroll
    const t = camCurve.getUtoTmapping(u);
    camCurve.getPoint(t, cp); lookCurve.getPoint(t, lp);
    // en pantallas verticales la cámara se aleja por su línea de mirada para que los senderos entren completos
    const back = Math.max(1, Math.pow(1.15 / camera.aspect, 0.6)); if (back > 1) cp.sub(lp).multiplyScalar(back).add(lp);
    const fi = u * NS, i0 = Math.floor(fi), i1 = Math.min(NS, i0 + 1);
    let L = lift[i0] + (lift[i1] - lift[i0]) * (fi - i0);
    if (liftPrev) { const m = cMat.uniforms.morph.value; L = liftPrev[i0] + (liftPrev[i1] - liftPrev[i0]) * (fi - i0) + (L - (liftPrev[i0] + (liftPrev[i1] - liftPrev[i0]) * (fi - i0))) * m; }
    cp.y += L;
    cp.x += Math.sin(s * 0.13) * 0.25; cp.y += Math.sin(s * 0.17) * 0.12;   // respiración mínima del dron
  }

  function occluded(m) {
    for (let i = 1; i < 24; i++) { q.lerpVectors(camera.position, m.top, i / 24); if (yAt(q.x, q.z) > q.y + 0.3) return true; }
    return false;
  }
  let morphFrom = 0;
  // Carteles: siempre dentro de la pantalla (12 px de margen), anclados hacia adentro con una línea al punto;
  // sin pisarse entre sí ni con el título o la banda de datos. Si chocan, queda el más cercano
  // al punto que mira la cámara en ese momento (el centro del recorrido).
  const MARGIN = 12, GAP = 14;
  const obstacles = [];
  function rectIn(el, sr, pad) {
    if (!el) return; const r = el.getBoundingClientRect();
    if (r.width && r.bottom > sr.top && r.top < sr.bottom) obstacles.push([r.left - sr.left - pad, r.top - sr.top - pad, r.right - sr.left + pad, r.bottom - sr.top + pad]);
  }
  const hit = (a, b) => a[0] < b[2] && a[2] > b[0] && a[1] < b[3] && a[3] > b[1];
  const heroTitle = hero.querySelector('.hero-txt'), band = hero.querySelector('.hero-band');
  function placeLabels() {
    const W = stage.clientWidth, H = stage.clientHeight, sr = stage.getBoundingClientRect();
    obstacles.length = 0;
    if (shown < 0.28) rectIn(heroTitle, sr, 6);
    if (shown < 0.55) rectIn(band, sr, 6);
    const placed = [];
    let smallShown = 0; const smallMax = mobile ? 3 : 7;
    // prioridad: primero los marcadores con punto; dentro de cada grupo, el más cercano a donde mira la cámara
    // (los que ya se ven tienen una ventaja chica para que no parpadeen)
    const order = markers.map(m => [m, camera.position.distanceTo(m.top), Math.hypot(m.top.x - lp.x, m.top.z - lp.z) * (m.on ? 0.8 : 1)])
      .sort((a, b) => (b[0].parts.length - a[0].parts.length) || (a[2] - b[2]));
    for (const [m, dist] of order) {
      v.copy(m.top).project(camera);
      const sx = (v.x * 0.5 + 0.5) * W, sy = (-v.y * 0.5 + 0.5) * H;
      let off = !m.bw || v.z > 1 || sx < 0 || sx > W || sy < 0 || sy > H || occluded(m);
      if (!m.parts.length) off = off || dist > m.near || smallShown >= smallMax;
      let bx = 0, by = 0;
      if (!off) {
        const bw = Math.min(m.bw, W - 2 * MARGIN), bh = m.bh;
        bx = Math.min(W - MARGIN - bw, Math.max(MARGIN, sx - bw / 2));
        // arriba del punto; si no entra o choca, abajo; si tampoco, no se muestra
        let ok = false;
        for (const cy of [sy - GAP - bh, sy + GAP]) {
          if (cy < MARGIN || cy + bh > H - MARGIN) continue;
          const r = [bx - 4, cy - 4, bx + bw + 4, cy + bh + 4];
          if (obstacles.some(o => hit(r, o)) || placed.some(o => hit(r, o))) continue;
          by = cy; placed.push(r); ok = true; break;
        }
        off = !ok;
        if (!off && !m.parts.length) smallShown++;
      }
      m.on = !off;
      if (m.trail) m.el.classList.toggle('cerca', dist < m.near);
      if (off) { m.el.style.opacity = 0; continue; }
      m.el.style.transform = `translate(${bx.toFixed(1)}px,${by.toFixed(1)}px)`;
      m.el.style.opacity = 1;
      // línea del punto al borde más cercano de la caja
      const px = sx - bx, py = sy - by, bw = Math.min(m.bw, W - 2 * MARGIN);
      const ex = Math.min(bw - 3, Math.max(3, px)), ey = py < 0 ? 0 : m.bh;
      const dx = ex - px, dy = ey - py, len = Math.hypot(dx, dy);
      m.stem.style.transform = `translate(${px.toFixed(1)}px,${py.toFixed(1)}px) rotate(${(Math.atan2(dy, dx) * 180 / Math.PI - 90).toFixed(1)}deg)`;
      m.stem.style.height = len.toFixed(1) + 'px';
    }
  }
  function frame(now) {
    if (!visible || document.hidden) { running = false; return; }
    const dt = Math.min(0.1, (now - last) / 1000); last = now;
    const acc = W0 * W0 * (progress() - shown) - 2 * W0 * vel;
    vel += acc * dt; shown += vel * dt;
    shown = Math.min(1, Math.max(0, shown));
    cameraAt(shown, (now - t0) / 1000);
    camera.position.copy(cp); camera.lookAt(lp);
    sky.position.copy(cp);
    if (cMat.uniforms.morph.value < 1) cMat.uniforms.morph.value = Math.min(1, (now - morphFrom) / 1400);
    updateLOD();
    renderer.render(scene, camera);
    placeLabels();
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
    await buildCore(HIGH, prev);
    const oldA = cMat.uniforms.tA.value, oldN = cMat.uniforms.tN.value;
    cMat.uniforms.tA.value = tA; cMat.uniforms.tN.value = tN; oldA.dispose(); oldN.dispose();
    cMat.uniforms.morph.value = 0; morphFrom = performance.now();
    replant(); addTrails(); liftPrev = lift.slice(); computeLift();
    hero.dataset.calidad = 'alta';
  } catch (e) { console.warn('Portada 3D: sigo con la versión liviana', e); }
}

start().catch(e => { console.warn('Portada 3D: uso la imagen fija', e); fallback('error'); });
