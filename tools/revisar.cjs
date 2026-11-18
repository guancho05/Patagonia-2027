// Revisión automática antes de publicar: en celular (390x844) y escritorio (1280x800), claro y oscuro.
// - Las dos versiones del itinerario: cada día se abre sin errores y muestra su detalle.
// - Casas, Autos, Gastos y Pesca tienen contenido; los links externos son válidos (http/https, sin "undefined").
// - Hay links a Windguru, Google Maps, Booking y Airbnb.
// - Sin errores de JavaScript ni scroll horizontal en ninguna vista.
// Uso: node tools/revisar.cjs [url-base]      (sale con código 1 si algo falla)
const { chromium } = require('playwright');
const base = process.argv[2] || 'http://localhost:8080/';
(async () => {
  const b = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
  const fallas = [];
  const mal = (...m) => { fallas.push(m.join(' ')); console.log('FALLA', ...m); };
  for (const [w, h] of [[390, 844], [1280, 800]]) for (const scheme of ['light', 'dark']) {
    const tag = `${w}x${h} ${scheme === 'light' ? 'claro' : 'oscuro'}`;
    const ctx = await b.newContext({ viewport: { width: w, height: h }, colorScheme: scheme, isMobile: w < 500, hasTouch: w < 500 });
    const p = await ctx.newPage();
    const errs = []; p.on('pageerror', e => errs.push(e.message));
    await p.goto(base + '#itinerario', { waitUntil: 'networkidle' }).catch(() => {});
    await p.waitForTimeout(800);
    const sw = async (k) => { const s = await p.evaluate(() => document.documentElement.scrollWidth); if (s > w) mal(tag, k, 'scroll horizontal', s); };
    const links = new Map();
    const juntar = async () => { for (const [href, txt] of await p.$$eval('a[href]', as => as.map(a => [a.getAttribute('href'), a.textContent.trim().slice(0, 40)]))) links.set(href, txt); };
    const resumen = {};
    for (const v of ['a', 'b']) {
      await p.evaluate(v => { document.querySelector(`.vbtn[data-v="${v}"]`).click(); showPage('itinerario'); }, v);
      await p.waitForTimeout(300);
      const n = await p.$$eval('#tl .day', d => d.length);
      if (n !== 15) mal(tag, 'versión', v, 'tiene', n, 'días (se esperaban 15)');
      const dias = [];
      for (let i = 0; i < n; i++) {
        await p.evaluate(i => document.querySelectorAll('#tl .day')[i].click(), i);
        await p.waitForTimeout(60);
        const [det, ttl] = await p.evaluate(() => [(document.getElementById('lead') || {}).textContent || '', (document.getElementById('ttl') || {}).textContent || '']);
        const t = await p.evaluate(i => document.querySelectorAll('#tl .day .t')[i].textContent, i);
        if (det.length < 30 || !ttl.includes(t.slice(0, 8))) mal(tag, 'versión', v, 'día', i + 1, t, 'sin detalle');
        dias.push(t);
        await juntar();
      }
      resumen[v] = dias;
      await sw('itinerario ' + v);
    }
    if (JSON.stringify(resumen.a) === JSON.stringify(resumen.b)) mal(tag, 'las dos versiones del itinerario son iguales');
    if (!resumen.b.some(t => /Frey/.test(t))) mal(tag, 'la versión nueva no tiene el Frey');
    for (const [k, min] of [['casas', 400], ['autos', 300], ['gastos', 300], ['pesca', 800]]) {
      await p.evaluate(k => showPage(k), k); await p.waitForTimeout(300);
      const id = k === 'itinerario' ? 'view-itin' : 'view-' + k;
      const len = await p.evaluate(id => { const e = document.getElementById(id); return e && !e.hidden ? e.innerText.length : -1; }, id);
      if (len < min) mal(tag, k, 'sin contenido suficiente', len);
      await juntar(); await sw(k);
    }
    // casas: recorrer todas las opciones de cada lugar
    await p.evaluate(() => showPage('casas'));
    const nc = await p.$$eval('#view-casas button', bs => bs.length);
    for (let i = 0; i < nc; i++) { await p.evaluate(i => { const bt = document.querySelectorAll('#view-casas button')[i]; if (bt && bt.offsetParent) bt.click(); }, i); await p.waitForTimeout(30); await juntar(); }
    await sw('casas (todas)');
    const ext = [...links.keys()].filter(hf => !hf.startsWith('#'));
    const rotos = ext.filter(hf => !/^(https?:|mailto:)/.test(hf) || /undefined|null|NaN/.test(hf));
    if (rotos.length) mal(tag, 'links mal formados:', rotos.slice(0, 5).join(' | '));
    const hay = re => ext.some(hf => re.test(hf));
    for (const [nom, re] of [['Windguru', /windguru\./], ['Google Maps', /google\.[a-z.]+\/maps|maps\.google|goo\.gl\/maps|maps\.app\.goo\.gl/], ['Booking', /booking\.com/], ['Airbnb', /airbnb\./]])
      if (!hay(re)) mal(tag, 'no hay links a', nom);
    if (errs.length) mal(tag, 'errores de JS:', errs.join(' | '));
    console.log(tag, '· días a/b:', resumen.a.length, '/', resumen.b.length, '· links externos:', ext.length, '· casas:', nc, 'botones');
    await ctx.close();
  }
  console.log(fallas.length ? `revisión con ${fallas.length} fallas` : 'revisión OK'); await b.close();
  process.exit(fallas.length ? 1 : 0);
})();
