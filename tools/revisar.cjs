// Revisión rápida: errores de JS y scroll horizontal en cada página, celular y escritorio.
// Uso: node tools/revisar.cjs [url-base]
const { chromium } = require('playwright');
const base = process.argv[2] || 'http://localhost:8080/';
(async () => {
  const b = await chromium.launch();
  for (const [w, h] of [[390, 844], [1280, 800]]) for (const scheme of ['light', 'dark']) {
    const p = await b.newPage({ viewport: { width: w, height: h }, colorScheme: scheme });
    const errs = []; p.on('pageerror', e => errs.push(e.message));
    for (const k of ['portada', 'itinerario', 'casas', 'autos', 'gastos', 'pesca']) {
      await p.goto(base + '#' + k, { waitUntil: 'networkidle' }).catch(() => {});
      await p.waitForTimeout(400);
      const sw = await p.evaluate(() => document.documentElement.scrollWidth);
      if (sw > w) console.log('SCROLL HORIZONTAL', w, scheme, k, sw);
    }
    if (errs.length) console.log('ERRORES', w, scheme, errs);
    await p.close();
  }
  console.log('revisión terminada'); await b.close();
})();
