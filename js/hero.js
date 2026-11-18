// Portada: relieve real del Tronador al Cerro Catedral, con cámara tipo dron que avanza con el scroll y vuelve al subir.
// Datos preprocesados con tools/terreno.py (alturas de AWS Terrain Tiles y color horneado con luz, sombras y nieve).
// Una sola malla: densa en la zona de detalle (~47 x 31 km) y cada vez más rala hacia un anillo de ~170 x 150 km,
// que se funde con la bruma; así nunca se ve el borde del terreno.
const hero = document.getElementById('hero');
const stage = document.getElementById('stage');
const canvas = document.getElementById('terrain');
const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
const saveData = navigator.connection && navigator.connection.saveData;
const lowMem = navigator.deviceMemory && navigator.deviceMemory < 4;
const mobile = matchMedia('(max-width: 820px)').matches;

// Paleta de la etapa 3 (docs/investigacion-estetica.md) aplicada al cielo y la bruma.
const SKY = { zenith: '#2a74a6', mid: '#79abc0', horizon: '#d9d7c6' };
const EX = 1.15;            // exageración vertical
const U = 10;               // unidades por km (1 unidad = 100 m)

// Recorrido del dron: [progreso, cámara lat, lon, altura m, mira lat, lon, altura m]. Todo dentro de la zona de detalle.
const PATH = [
  [0.00, -41.262, -71.640, 2900, -41.168, -71.860, 2300],   // sobre el Mascardi, mirando al Tronador
  [0.35, -41.236, -71.728, 2650, -41.172, -71.842, 2200],   // encima de Pampa Linda
  [0.65, -41.196, -71.758, 3100, -41.160, -71.884, 2800],   // frente al Meiling y los glaciares
  [1.00, -41.140, -71.792, 3450, -41.196, -71.540, 1500]    // giro al este: Catedral y Frey
];

function fallback(reason) { hero.classList.add('static'); hero.dataset.reason = reason; }
function webgl2() { try { return !!document.createElement('canvas').getContext('webgl2'); } catch (e) { return false; } }

async function heightsFrom(url) {
  const blob = await (await fetch(url, { priority: 'low' })).blob();
  const bmp = await createImageBitmap(blob, { colorSpaceConversion: 'none', premultiplyAlpha: 'none' });
  const cv = document.createElement('canvas'); cv.width = bmp.width; cv.height = bmp.height;
  const ctx = cv.getContext('2d', { willReadFrequently: true }); ctx.drawImage(bmp, 0, 0);
  const px = ctx.getImageData(0, 0, bmp.width, bmp.height).data;
  const h = new Float32Array(bmp.width * bmp.height);
  for (let i = 0; i < h.length; i++) h[i] = (px[i * 4] * 256 + px[i * 4 + 1]) / 10;
  return { w: bmp.width, h: bmp.height, d: h };
}

function sampler(g) {
  return (u, v) => {
    const x = Math.min(g.w - 1.001, Math.max(0, u * (g.w - 1))), y = Math.min(g.h - 1.001, Math.max(0, v * (g.h - 1)));
    const ix = x | 0, iy = y | 0, tx = x - ix, ty = y - iy, i = iy * g.w + ix;
    return (g.d[i] * (1 - tx) + g.d[i + 1] * tx) * (1 - ty) + (g.d[i + g.w] * (1 - tx) + g.d[i + g.w + 1] * tx) * ty;
  };
}

async function start() {
  if (reduce || saveData || lowMem || !webgl2()) return fallback(reduce ? 'reduced-motion' : 'liviano');
  // que el plan (itinerario, casas) cargue primero: el 3D arranca cuando el navegador queda libre
  await new Promise(r => (window.requestIdleCallback || ((f) => setTimeout(f, 300)))(r, { timeout: 1500 }));
  const [THREE, meta] = await Promise.all([import('../vendor/three.module.min.js'), fetch('data/terreno.json').then(r => r.json())]);
  const [gC, gO] = await Promise.all([heightsFrom(mobile ? 'data/terreno-cerca-alt-m.png' : 'data/terreno-cerca-alt.png'), heightsFrom('data/terreno-lejos-alt.png')]);
  const sC = sampler(gC), sO = sampler(gO);
  const C = meta.cerca, O = meta.lejos;

  // Proyección local: origen en el centro de la zona de detalle.
  const lat0 = (C.n + C.s) / 2, lon0 = (C.w + C.e) / 2;
  const kx = 111.32 * Math.cos(lat0 * Math.PI / 180) * U, kz = 110.57 * U;
  const X = lon => (lon - lon0) * kx, Zc = lat => (lat0 - lat) * kz;
  const rc = [X(C.w), Zc(C.n), X(C.e) - X(C.w), Zc(C.s) - Zc(C.n)];
  const ro = [X(O.w), Zc(O.n), X(O.e) - X(O.w), Zc(O.s) - Zc(O.n)];
  const hAt = (x, z) => {
    const uo = (x - ro[0]) / ro[2], vo = (z - ro[1]) / ro[3];
    let h = sO(uo, vo);
    const uc = (x - rc[0]) / rc[2], vc = (z - rc[1]) / rc[3];
    if (uc > 0 && uc < 1 && vc > 0 && vc < 1) {
      const w = Math.min(1, Math.min(uc, 1 - uc, vc, 1 - vc) / 0.03);
      h = h + (sC(uc, vc) - h) * w;
    }
    return h;
  };
  const yAt = (x, z) => hAt(x, z) / 100 * EX;

  // Ejes de la grilla: uniformes en la zona de detalle, con separación creciente hacia afuera.
  function axis(c0, c1, o0, o1, nc, no) {
    const a = [];
    for (let i = no; i >= 1; i--) a.push(c0 - (c0 - o0) * Math.pow(i / no, 2.2));
    for (let i = 0; i < nc; i++) a.push(c0 + (c1 - c0) * i / (nc - 1));
    for (let i = 1; i <= no; i++) a.push(c1 + (o1 - c1) * Math.pow(i / no, 2.2));
    return a;
  }
  const nc = mobile ? 300 : 640;
  const ax = axis(rc[0], rc[0] + rc[2], ro[0], ro[0] + ro[2], nc, mobile ? 28 : 40);
  const az = axis(rc[1], rc[1] + rc[3], ro[1], ro[1] + ro[3], Math.round(nc * rc[3] / rc[2]), mobile ? 28 : 40);
  const NX = ax.length, NZ = az.length;
  const pos = new Float32Array(NX * NZ * 3);
  for (let j = 0, k = 0; j < NZ; j++) for (let i = 0; i < NX; i++, k += 3) {
    pos[k] = ax[i]; pos[k + 1] = yAt(ax[i], az[j]); pos[k + 2] = az[j];
  }
  const idx = new Uint32Array((NX - 1) * (NZ - 1) * 6);
  for (let j = 0, k = 0; j < NZ - 1; j++) for (let i = 0; i < NX - 1; i++) {
    const a = j * NX + i, b = a + 1, c = a + NX, d = c + 1;
    idx[k++] = a; idx[k++] = c; idx[k++] = b; idx[k++] = b; idx[k++] = c; idx[k++] = d;
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  geo.setIndex(new THREE.BufferAttribute(idx, 1));

  const renderer = new THREE.WebGLRenderer({ canvas, antialias: !mobile, alpha: false, powerPreference: 'high-performance' });
  renderer.setPixelRatio(Math.min(devicePixelRatio, mobile ? 1.25 : 1.5));
  const loader = new THREE.TextureLoader();
  const tex = url => new Promise((res, rej) => loader.load(url, t => {
    t.flipY = false; t.colorSpace = THREE.NoColorSpace; t.anisotropy = Math.min(8, renderer.capabilities.getMaxAnisotropy());
    t.wrapS = t.wrapT = THREE.ClampToEdgeWrapping; res(t);
  }, undefined, rej));
  const [tC, tO] = await Promise.all([tex(mobile ? 'data/terreno-cerca-m.jpg' : 'data/terreno-cerca.jpg'), tex('data/terreno-lejos.jpg')]);

  const col = c => new THREE.Color(c);
  const fogCol = col(SKY.horizon);
  const mat = new THREE.ShaderMaterial({
    uniforms: {
      tC: { value: tC }, tO: { value: tO },
      rc: { value: new THREE.Vector4(...rc) }, ro: { value: new THREE.Vector4(...ro) },
      fogCol: { value: fogCol }, fogK: { value: 0.0026 }
    },
    vertexShader: `varying vec3 vW; void main(){ vec4 w = modelMatrix * vec4(position,1.0); vW = w.xyz; gl_Position = projectionMatrix * viewMatrix * w; }`,
    fragmentShader: `precision highp float;
      uniform sampler2D tC, tO; uniform vec4 rc, ro; uniform vec3 fogCol; uniform float fogK; varying vec3 vW;
      void main(){
        vec2 uc = (vW.xz - rc.xy) / rc.zw, uo = (vW.xz - ro.xy) / ro.zw;
        vec3 c = texture2D(tO, uo).rgb;
        float e = min(min(uc.x, 1.0 - uc.x), min(uc.y, 1.0 - uc.y));
        if (e > 0.0) c = mix(c, texture2D(tC, uc).rgb, clamp(e / 0.03, 0.0, 1.0));
        float d = distance(vW, cameraPosition);
        float f = 1.0 - exp(-pow(d * fogK, 3.0));
        f = max(f, 0.18 * (1.0 - exp(-d * 0.006)));                      // velo de aire también de cerca
        float edge = min(min(uo.x, 1.0 - uo.x), min(uo.y, 1.0 - uo.y));
        f = max(f, 1.0 - smoothstep(0.0, 0.12, edge));                    // el borde exterior siempre en bruma
        gl_FragColor = vec4(mix(c, fogCol, clamp(f, 0.0, 1.0)), 1.0);
      }`
  });
  const scene = new THREE.Scene();
  scene.add(new THREE.Mesh(geo, mat));

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
    if (dot) {
      const m = new THREE.LineBasicMaterial({ color: '#a3301d' });
      scene.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(x, y, z), top]), m));
      const s = new THREE.Mesh(new THREE.SphereGeometry(0.55, 16, 12), new THREE.MeshBasicMaterial({ color: '#c4462c' }));
      s.position.copy(top); scene.add(s);
    }
    const el = document.getElementById(elId);
    if (el) markers.push({ el, top, ground: new THREE.Vector3(x, y, z) });
  }
  marker('meiling', 'pin', 9, true);
  marker('frey', 'pinFrey', 9, true);
  marker('tronador', 'pinTronador', 2, false);
  marker('pampa', 'pinPampa', 2, false);

  // Cámara y recorrido
  const toV = (lat, lon, alt) => new THREE.Vector3(X(lon), alt / 100 * EX, Zc(lat));
  const camCurve = new THREE.CatmullRomCurve3(PATH.map(k => toV(k[1], k[2], k[3])), false, 'centripetal');
  const lookCurve = new THREE.CatmullRomCurve3(PATH.map(k => toV(k[4], k[5], k[6])), false, 'centripetal');
  const stops = PATH.map(k => k[0]);
  // progreso del scroll → parámetro de la curva (los puntos de control se reparten según PATH)
  const curveT = p => {
    for (let i = 0; i < stops.length - 1; i++) if (p <= stops[i + 1]) {
      const t = (p - stops[i]) / (stops[i + 1] - stops[i]);
      return (i + t) / (stops.length - 1);
    }
    return 1;
  };
  const camera = new THREE.PerspectiveCamera(mobile ? 56 : 44, 1, 0.5, 1000);
  function resize() {
    const w = stage.clientWidth, h = stage.clientHeight;
    renderer.setSize(w, h, false); camera.aspect = w / h;
    camera.fov = Math.min(60, (mobile ? 56 : 44) * Math.max(1, (h / w) * 0.75)); // en vertical, un poco más de campo
    camera.updateProjectionMatrix();
  }
  addEventListener('resize', resize); resize();

  const progress = () => {
    const r = hero.getBoundingClientRect(), span = hero.offsetHeight - innerHeight;
    return span > 0 ? Math.min(1, Math.max(0, -r.top / span)) : 0;
  };
  let shown = progress(), visible = true, running = false, last = performance.now();
  const t0 = performance.now(), cp = new THREE.Vector3(), lp = new THREE.Vector3(), v = new THREE.Vector3(), q = new THREE.Vector3();

  function occluded(m) {
    for (let i = 1; i < 24; i++) {
      q.lerpVectors(camera.position, m.top, i / 24);
      if (yAt(q.x, q.z) > q.y + 0.3) return true;
    }
    return false;
  }
  function frame(now) {
    if (!visible || document.hidden) { running = false; return; }
    const dt = Math.min(0.25, (now - last) / 1000); last = now;
    shown += (progress() - shown) * (1 - Math.exp(-dt * 4.5));   // suavizado por tiempo: igual en 30 o 120 fps
    const t = curveT(shown), s = (now - t0) / 1000;
    camCurve.getPoint(t, cp); lookCurve.getPoint(t, lp);
    cp.x += Math.sin(s * 0.13) * 0.6; cp.y += Math.sin(s * 0.17) * 0.3;
    cp.y = Math.max(cp.y, yAt(cp.x, cp.z) + 4);               // nunca adentro de la montaña
    camera.position.copy(cp); camera.lookAt(lp);
    sky.position.copy(cp);
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
}

start().catch(e => { console.warn('Portada 3D: uso la imagen fija', e); fallback('error'); });
