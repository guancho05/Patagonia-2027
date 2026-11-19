// Revisión automática antes de publicar, con Playwright: abre tools/revisar.html (que recorre la web dentro de un marco)
// en celular (390x844) y escritorio (1280x800) y sale con código 1 si algo falla.
// Qué revisa (detalle en tools/revisar.html): 15 días con su detalle, Mapa, Casas (todas), Autos, Gastos y Pesca con contenido,
// links bien formados y a Windguru, Google Maps, Booking y Airbnb, sin errores de JS, sin scroll horizontal, áreas táctiles de 44 px.
// Uso: node tools/revisar.cjs [url-base]     (por defecto http://localhost:8080)
// Sin Node (Windows): powershell -File tools\medir.ps1 -Medidor http://localhost:8080/tools/revisar.html -Ancho 390 -Alto 844
const { chromium } = require('playwright');
const base = (process.argv[2] || 'http://localhost:8080').replace(/\/$/, '');
(async () => {
  const b = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
  let fallas = 0;
  for (const [w, h] of [[390, 844], [1280, 800]]) {
    const p = await b.newPage({ viewport: { width: w + 20, height: h + 60 } });
    await p.goto(`${base}/tools/revisar.html?w=${w}&h=${h}`);
    await p.waitForFunction(() => document.getElementById('r').textContent.startsWith('{'), null, { timeout: 60000 });
    const r = JSON.parse(await p.textContent('#r'));
    console.log(`${w}x${h}:`, r.ok ? 'OK' : 'FALLA', `· días ${r.dias} · casas ${r.casas} · links ${r.links_externos}`);
    r.fallas.forEach(f => console.log('  FALLA', f)); fallas += r.fallas.length;
    await p.close();
  }
  console.log(fallas ? `revisión con ${fallas} fallas` : 'revisión OK'); await b.close();
  process.exit(fallas ? 1 : 0);
})();
