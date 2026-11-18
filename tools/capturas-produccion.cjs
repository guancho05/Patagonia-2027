// Capturas de verificación (JPEG): carteles de la portada, mapa con zoom y pie, en 390x844 y 1280x800.
// Uso: node tools/capturas-produccion.cjs <carpeta-salida> [url-base]
const { chromium } = require('playwright');
const fs = require('fs');
const out = process.argv[2] || 'docs/capturas/tmp', base = process.argv[3] || 'https://patagonia-2027-eosin.vercel.app/';
fs.mkdirSync(out, { recursive: true });
const sleep = ms => new Promise(r => setTimeout(r, ms));
(async () => {
  const b = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
  for (const [w, h, dpr] of [[390, 844, 2], [1280, 800, 1]]) {
    const cel = w < 500, tag = `${w}x${h}`;
    const ctx = await b.newContext({ viewport: { width: w, height: h }, deviceScaleFactor: dpr, isMobile: cel, hasTouch: cel });
    const p = await ctx.newPage(); const errs = []; p.on('pageerror', e => errs.push(e.message));
    const t0 = Date.now();
    await p.goto(base, { waitUntil: 'domcontentloaded' });
    await p.waitForFunction(() => document.getElementById('hero').dataset.calidad === 'alta', null, { timeout: 120000 }).catch(() => console.log('sin alta'));
    console.log(tag, '3D en alta calidad a los', Date.now() - t0, 'ms');
    await sleep(1500);
    for (const [n, f] of [['inicio', 0.02], ['frey', 0.32], ['meiling', 0.86]]) {
      await p.evaluate(f => { const hr = document.getElementById('hero'); scrollTo(0, hr.offsetTop + f * (hr.offsetHeight - innerHeight)); }, f);
      await sleep(4000);
      const fuera = await p.evaluate(() => [...document.querySelectorAll('.stage .pin')].filter(e => +getComputedStyle(e).opacity > 0.5 && getComputedStyle(e).display !== 'none')
        .map(e => { const r = e.firstElementChild.getBoundingClientRect(); return [e.textContent.slice(0, 22), Math.round(r.left), Math.round(innerWidth - r.right)]; }));
      console.log(tag, n, 'carteles [texto, margen izq, margen der]:', JSON.stringify(fuera));
      await p.screenshot({ path: `${out}/carteles-${n}-${tag}.jpg`, type: 'jpeg', quality: 78 });
    }
    await p.evaluate(() => { const m = document.querySelector('.mapa'); scrollTo(0, m.getBoundingClientRect().top + scrollY - 12); });
    await sleep(800);
    await p.click('[data-ir="ruta"]'); await sleep(1500);
    if (!cel) { await p.click('.mapa-zoom [data-z="in"]'); await sleep(1300); }
    await p.evaluate(() => { const m = document.querySelector('.mapa'); scrollTo(0, m.getBoundingClientRect().top + scrollY - 12); });
    await sleep(500);
    console.log(tag, 'mapa con zoom:', await p.$eval('.mapa-svg', e => e.dataset.vista));
    await p.screenshot({ path: `${out}/mapa-zoom-${tag}.jpg`, type: 'jpeg', quality: 78 });
    await p.evaluate(() => scrollTo(0, document.documentElement.scrollHeight)); await sleep(1200);
    await p.evaluate(() => { const s = document.querySelector('.pie'); scrollTo(0, s.getBoundingClientRect().top + scrollY); }); await sleep(600);
    await p.screenshot({ path: `${out}/pie-${tag}.jpg`, type: 'jpeg', quality: 78 });
    console.log(tag, 'scrollWidth', await p.evaluate(() => document.documentElement.scrollWidth), 'errores', errs);
    await ctx.close();
  }
  await b.close();
})();
