// Capturas de la portada 3D en el inicio, la mitad y el final del recorrido del dron.
// Uso: node tools/capturas-montana.cjs <carpeta-salida> [esquemas=claro] [url-base]
const { chromium } = require('playwright');
const fs = require('fs');
const out = process.argv[2] || 'docs/capturas/tmp';
const schemes = (process.argv[3] || 'claro').split(',');
const base = process.argv[4] || 'http://localhost:8080/';
fs.mkdirSync(out, { recursive: true });
const SIZES = [[390, 844], [1280, 800], [2560, 1080]];
const STOPS = [['inicio', 0], ['mitad', 0.5], ['final', 0.94]];
(async () => {
  const browser = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
  for (const sc of schemes) for (const [w, h] of SIZES) {
    const ctx = await browser.newContext({ viewport: { width: w, height: h }, colorScheme: sc === 'oscuro' ? 'dark' : 'light', deviceScaleFactor: 1 });
    const page = await ctx.newPage();
    page.on('pageerror', e => console.log('ERROR', e.message));
    page.on('console', m => { if (m.type() === 'warning' || m.type() === 'error') console.log('consola:', m.text().slice(0, 200)); });
    await page.goto(base, { waitUntil: 'networkidle' }).catch(() => {});
    await page.waitForFunction(() => document.getElementById('hero').classList.contains('live') || document.getElementById('hero').classList.contains('static'), null, { timeout: 60000 }).catch(() => console.log('sin 3D'));
    await page.waitForFunction(() => document.getElementById('hero').dataset.calidad === 'alta' || document.getElementById('hero').classList.contains('static'), null, { timeout: 120000 }).catch(() => console.log('sin alta resolución'));
    await page.waitForTimeout(2500);
    for (const [name, p] of STOPS) {
      await page.evaluate(p => { const hr = document.getElementById('hero'); window.scrollTo(0, hr.offsetTop + p * (hr.offsetHeight - innerHeight)); }, p);
      await page.waitForTimeout(4000);
      const file = `${out}/portada-${name}-${w}x${h}-${sc}.jpg`;
      await page.screenshot({ path: file, type: 'jpeg', quality: 84 });
      console.log('ok', file);
    }
    await ctx.close();
  }
  await browser.close();
})();
