// Mide los cuadros por segundo del mapa con gestos táctiles simulados (CDP) en 390x844: pellizco, arrastre con un dedo, alejar y scroll de la página.
// Uso: node tools/medir-mapa-fps.cjs [url] [prefijo-captura] [freno-de-CPU=4]   (cuenta los cuadros presentados por el compositor en el trazado de Chrome)
// Mide fps del mapa con eventos táctiles simulados (CDP) en 390x844. Uso: node mapafps.cjs <url> <salida-prefijo> [cpu=4]
const { chromium } = require('playwright');
const base = process.argv[2] || 'http://localhost:8080/', out = process.argv[3], cpu = +(process.argv[4] || 4);
const sleep = ms => new Promise(r => setTimeout(r, ms));
(async () => {
  const browser = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
  const page = await ctx.newPage();
  const errs = []; page.on('pageerror', e => errs.push(e.message));
  await page.goto(base, { waitUntil: 'networkidle' }).catch(() => {});
  await page.waitForSelector('.mapa svg', { timeout: 30000 });
  if (process.env.CSS) await page.addStyleTag({ content: process.env.CSS });
  await page.evaluate(() => { const m = document.querySelector('.mapa-svg'); window.scrollTo(0, m.getBoundingClientRect().top + scrollY - 80); });
  await sleep(1500);
  const cdp = await ctx.newCDPSession(page);
  if (cpu > 1) await cdp.send('Emulation.setCPUThrottlingRate', { rate: cpu });
  const r = await page.evaluate(() => { const b = document.querySelector('.mapa-svg').getBoundingClientRect(); return { x: b.left, y: b.top, w: b.width, h: b.height }; });
  const cx = r.x + r.w * 0.3, cy = r.y + r.h * 0.42;   // cerca de la zona de la ruta
  const T = (type, pts) => cdp.send('Input.dispatchTouchEvent', { type, touchPoints: pts.map((p, i) => ({ x: p[0], y: p[1], id: i, radiusX: 5, radiusY: 5, force: 1 })) });
  let traceEv = [];
  cdp.on('Tracing.dataCollected', e => traceEv.push(...e.value));
  const traceStart = async () => { traceEv = []; await cdp.send('Tracing.start', { categories: 'disabled-by-default-devtools.timeline.frame,devtools.timeline,cc', transferMode: 'ReportEvents' }); };
  const traceStop = async () => { const done = new Promise(r => cdp.once('Tracing.tracingComplete', r)); await cdp.send('Tracing.end'); await done;
    const draw = traceEv.filter(e => e.name === 'SubmitCompositorFrameToPresentationCompositorFrame' && e.ph === 'e' && /timeline\.frame/.test(e.cat)).map(e => e.ts / 1000).sort((a, b) => a - b);
    const pres = traceEv.filter(e => e.name === 'PipelineReporter' && e.ph === 'b' && e.args && e.args.chrome_frame_reporter && e.args.chrome_frame_reporter.state === 'STATE_PRESENTED_ALL').length;
    const dropped = traceEv.filter(e => e.name === 'PipelineReporter' && e.ph === 'b' && e.args && e.args.chrome_frame_reporter && /DROPPED|PARTIAL/.test(e.args.chrome_frame_reporter.state)).length;
    const d = []; for (let i = 1; i < draw.length; i++) d.push(draw[i] - draw[i - 1]);
    const act = d.filter(x => x < 150); const span = act.reduce((a, b) => a + b, 0) || 1; d.length = 0; d.push(...act); d.sort((a, b) => a - b);
    return { cuadrosDibujados: draw.length, fpsCompositor: +(1000 * act.length / span).toFixed(1), p50ms: d.length ? +d[d.length >> 1].toFixed(1) : null, p95ms: d.length ? +d[Math.floor(d.length * .95)].toFixed(1) : null, maxms: d.length ? +d[d.length - 1].toFixed(1) : null, presentados: pres, perdidos: dropped }; };
  const startRec = () => page.evaluate(() => { window.__f = []; const f = t => { window.__f.push(t); if (window.__rec) requestAnimationFrame(f); }; window.__rec = true; requestAnimationFrame(f); });
  const stopRec = () => page.evaluate(() => { window.__rec = false; const f = window.__f, d = []; for (let i = 1; i < f.length; i++) d.push(f[i] - f[i - 1]); d.sort((a, b) => a - b);
    const mean = d.reduce((a, b) => a + b, 0) / d.length; return { frames: d.length, fps: +(1000 / mean).toFixed(1), p50: +d[d.length >> 1].toFixed(1), p95: +d[Math.floor(d.length * 0.95)].toFixed(1), max: +d[d.length - 1].toFixed(1) }; });
  const res = {};
  // 1) pellizco para acercar (dos dedos que se separan), varias pasadas
  await traceStart(); await startRec();
  for (let rep = 0; rep < 3; rep++) {
    let d0 = 40; await T('touchStart', [[cx - d0, cy], [cx + d0, cy]]);
    for (let i = 1; i <= 40; i++) { const d = d0 + i * 3; T('touchMove', [[cx - d, cy], [cx + d, cy]]); await sleep(16); }
    await T('touchEnd', []); await sleep(120);
  }
  res.pellizco = { raf: await stopRec(), ...(await traceStop()) };
  const z1 = await page.evaluate(() => document.querySelector('.mapa-svg').dataset.vista || document.querySelector('.mapa svg').getAttribute('viewBox'));
  await sleep(600);
  // 2) arrastre con un dedo (con zoom)
  await traceStart(); await startRec();
  for (let rep = 0; rep < 3; rep++) {
    await T('touchStart', [[cx, cy]]);
    for (let i = 1; i <= 40; i++) { T('touchMove', [[cx + Math.sin(i / 6) * 90, cy + i * 2 * (rep % 2 ? -1 : 1)]]); await sleep(16); }
    await T('touchEnd', []); await sleep(120);
  }
  res.arrastre = { raf: await stopRec(), ...(await traceStop()) };
  const scrollAntes = await page.evaluate(() => scrollY);
  // 3) pellizco para alejar
  await traceStart(); await startRec();
  for (let rep = 0; rep < 4; rep++) {
    let d0 = 160; await T('touchStart', [[cx - d0, cy], [cx + d0, cy]]);
    for (let i = 1; i <= 40; i++) { const d = d0 - i * 3; T('touchMove', [[cx - d, cy], [cx + d, cy]]); await sleep(16); }
    await T('touchEnd', []); await sleep(120);
  }
  res.alejar = { raf: await stopRec(), ...(await traceStop()) };
  await sleep(800);
  // 4) sin zoom: un dedo tiene que mover la página
  const y0 = await page.evaluate(() => scrollY);
  await T('touchStart', [[cx, cy + 100]]);
  for (let i = 1; i <= 20; i++) { T('touchMove', [[cx, cy + 100 - i * 10]]); await sleep(16); }
  await T('touchEnd', []); await sleep(800);
  res.scrollPagina = (await page.evaluate(() => scrollY)) - y0;
  res.zoomTrasPellizco = z1; res.scrollDuranteArrastre = (await page.evaluate(() => scrollY)) - scrollAntes; res.errores = errs;
  await cdp.send('Emulation.setCPUThrottlingRate', { rate: 1 });
  console.log(JSON.stringify(res, null, 1));
  if (out) {
    await page.evaluate(() => { const m = document.querySelector('.mapa-svg'); window.scrollTo(0, m.getBoundingClientRect().top + scrollY - 80); });
    await sleep(500);
    await page.screenshot({ path: out + '-general.jpg', type: 'jpeg', quality: 80 });
  }
  await browser.close();
})();
