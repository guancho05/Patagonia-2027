// Capturas de la web en 390x844, 1280x800 y 2560x1080, en claro y oscuro.
// Uso: node tools/capturas.cjs <carpeta-salida> [url-base]
// Necesita un servidor local, por ejemplo: python3 -m http.server 8080
const { chromium } = require('playwright');
const out = process.argv[2] || 'docs/capturas/tmp';
const base = process.argv[3] || 'http://localhost:8080/';
const fs = require('fs');
fs.mkdirSync(out, { recursive: true });
const SIZES = [[390, 844], [1280, 800], [2560, 1080]];
const PAGES = (process.env.PAGES || 'portada,pantallazo,itinerario,dia-pesca,casas,autos,gastos,pesca').split(',');
(async () => {
  const browser = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
  for (const scheme of ['light', 'dark']) for (const [w, h] of SIZES) {
    const ctx = await browser.newContext({ viewport: { width: w, height: h }, colorScheme: scheme, deviceScaleFactor: 1 });
    const page = await ctx.newPage();
    page.on('pageerror', e => console.log('ERROR', w, scheme, e.message));
    for (const p of PAGES) {
      const name = `${out}/${p}-${w}x${h}-${scheme === 'light' ? 'claro' : 'oscuro'}.png`;
      if (p === 'portada' || p === 'pantallazo') {
        await page.goto(base + '#portada', { waitUntil: 'networkidle' }).catch(() => {});
        await page.evaluate(() => { try { localStorage.clear() } catch (e) {} });
        await page.goto(base, { waitUntil: 'networkidle' }).catch(() => {});
        await page.evaluate(() => window.scrollTo(0, 0));
        await page.waitForTimeout(p === 'portada' ? 3500 : 300);
        if (p === 'pantallazo') { await page.evaluate(() => document.getElementById('portada').scrollIntoView()); await page.waitForTimeout(1200); }
        await page.screenshot({ path: name });
      } else if (p === 'dia-pesca') {
        // Día 6 (1/1, Villa Traful): muestra el bloque "Pesca hoy"
        await page.goto(base + '#itinerario', { waitUntil: 'networkidle' }).catch(() => {});
        await page.evaluate(() => { try { localStorage.setItem('pat-day', '5') } catch (e) {} });
        await page.goto(base + '#itinerario', { waitUntil: 'networkidle' }).catch(() => {});
        await page.reload({ waitUntil: 'networkidle' }).catch(() => {});
        await page.waitForTimeout(1200);
        await page.evaluate(() => document.getElementById('fish').scrollIntoView({ block: 'center' }));
        await page.waitForTimeout(500);
        await page.screenshot({ path: name });
      } else {
        await page.goto(base + '#' + p, { waitUntil: 'networkidle' }).catch(() => {});
        await page.waitForTimeout(1500);
        await page.evaluate(() => document.getElementById('app').scrollIntoView());
        await page.waitForTimeout(600);
        await page.screenshot({ path: name, fullPage: w < 600 ? false : false });
      }
      console.log('ok', name);
    }
    await ctx.close();
  }
  await browser.close();
})();
