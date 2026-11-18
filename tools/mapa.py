#!/usr/bin/env python3
"""Mapa único del resumen, estilo atlas escolar viejo, con dos capas en el mismo sistema de coordenadas:
- general: sur de Sudamérica, Patagonia destacada, Buenos Aires, vuelo a Chapelco, recuadro de la zona del viaje;
- detalle (aparece con el zoom): ruta del itinerario nuevo por las rutas reales, paradas numeradas con fechas,
  lagos con nombre, senderos al Frey y al Meiling, Meiling opcional.
Datos: Natural Earth 1:10m (dominio público), OpenStreetMap (ODbL: lagos, senderos, lugares, de data/osm-fuente.json
y data/terreno.json) y rutas en auto calculadas con OSRM (router.project-osrm.org) sobre datos de OpenStreetMap.
Los grupos con clase "k" tienen tamaño fijo en pantalla: la página los escala con el zoom (data-x, data-y).
Salida: data/mapa.svg  ·  Uso: python3 tools/mapa.py
"""
import json, math, os, sys, time, urllib.request
import numpy as np
from shapely.geometry import shape, mapping, box as sbox
sys.setrecursionlimit(20000)

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
CACHE = os.path.join(ROOT, 'tools', '.cache'); NE = os.path.join(CACHE, 'ne'); os.makedirs(NE, exist_ok=True)
def ne(name):
    f = os.path.join(NE, name + '.geojson')
    if not os.path.exists(f):
        urllib.request.urlretrieve(f'https://raw.githubusercontent.com/nvkelso/natural-earth-vector/master/geojson/{name}.geojson', f)
    return json.load(open(f))
OSM = json.load(open(os.path.join(ROOT, 'data', 'osm-fuente.json')))
TER = json.load(open(os.path.join(ROOT, 'data', 'terreno.json')))

def osrm(a, b):
    f = os.path.join(CACHE, f'osrm-{a[0]:.4f}_{a[1]:.4f}-{b[0]:.4f}_{b[1]:.4f}.json')
    if not os.path.exists(f):
        url = f'https://router.project-osrm.org/route/v1/driving/{a[1]},{a[0]};{b[1]},{b[0]}?overview=full&geometries=geojson&steps=true'
        req = urllib.request.Request(url, headers={'User-Agent': 'patagonia-trip-site/1.0'})
        time.sleep(1.0)
        with urllib.request.urlopen(req, timeout=60) as r: open(f, 'wb').write(r.read())
    r = json.load(open(f))['routes'][0]
    refs = {}
    for st in r['legs'][0]['steps']:
        ref = st.get('ref') or ''
        for x in ref.split(';'):
            x = x.strip()
            if x: refs[x] = refs.get(x, 0) + st['distance']
    return r['geometry']['coordinates'], r['distance'], r['duration'], sorted(refs, key=lambda k: -refs[k])[:3]

def rdp(pts, eps):
    if len(pts) < 3: return pts
    a, b = pts[0], pts[-1]; ab = b - a; n = np.hypot(*ab); q = pts - a
    d = np.abs(ab[0] * q[:, 1] - ab[1] * q[:, 0]) / n if n > 0 else np.hypot(q[:, 0], q[:, 1])
    i = int(np.argmax(d))
    if d[i] > eps: return np.vstack([rdp(pts[:i + 1], eps)[:-1], rdp(pts[i:], eps)])
    return np.vstack([a, b])

W = 600.0; LON0, LON1, LAT0, LAT1 = -77.0, -52.0, -31.6, -56.4
C = math.cos(math.radians((LAT0 + LAT1) / 2)); K = W / ((LON1 - LON0) * C); H = (LAT0 - LAT1) * K
def P(lon, lat): return ((lon - LON0) * C * K, (LAT0 - lat) * K)

def rings(g):
    if g['type'] == 'Polygon': return g['coordinates']
    if g['type'] == 'MultiPolygon': return [r for p in g['coordinates'] for r in p]
    if g['type'] == 'LineString': return [g['coordinates']]
    if g['type'] == 'MultiLineString': return g['coordinates']
    return []
def path(geoms, eps, minarea=0.0, close=True, prec=2):
    out = []
    for g in geoms:
        for r in rings(g):
            a = np.array([P(x, y) for x, y in r])
            if a[:, 0].max() < -20 or a[:, 0].min() > W + 20 or a[:, 1].max() < -20 or a[:, 1].min() > H + 20: continue
            s = rdp(a, eps)
            if close:
                if len(s) < 3: continue
                if 0.5 * abs(np.dot(s[:, 0], np.roll(s[:, 1], 1)) - np.dot(s[:, 1], np.roll(s[:, 0], 1))) < minarea: continue
            out.append('M' + 'L'.join(f'{x:.{prec}f},{y:.{prec}f}' for x, y in s) + ('Z' if close else ''))
    return ''.join(out)
def poly(pts, prec=3): return 'M' + 'L'.join(f'{x:.{prec}f},{y:.{prec}f}' for x, y in pts)

def k(x, y, inner, cls=''):
    """Grupo de tamaño fijo en pantalla (la página ajusta la escala con el zoom)."""
    return f'<g class="k {cls}" data-x="{x:.3f}" data-y="{y:.3f}" transform="translate({x:.3f} {y:.3f})">{inner}</g>'
def t(x, y, s, cls, anchor='start'):
    return f'<text x="{x}" y="{y}" class="{cls}" text-anchor="{anchor}">{s}</text>'

PATAG = {'Argentina': ['Neuquén', 'Río Negro', 'Chubut', 'Santa Cruz', 'Tierra del Fuego'], 'Chile': ['Los Lagos', 'Aisén', 'Magallanes']}

def main():
    L = OSM['lugares']; ll = lambda key: (L[key]['lat'], L[key]['lon'])
    countries = ne('ne_10m_admin_0_countries')['features']
    geo = lambda name: [f['geometry'] for f in countries if f['properties']['ADMIN'] == name]
    adm1 = ne('ne_10m_admin_1_states_provinces')['features']
    pat = [f['geometry'] for f in adm1 if f['properties']['admin'] in PATAG and any(n.lower() in (f['properties']['name'] or '').lower() for n in PATAG[f['properties']['admin']])]
    lakes_ne = [f['geometry'] for f in ne('ne_10m_lakes')['features']]
    others = [g for n in ('Uruguay', 'Brazil', 'Paraguay', 'Bolivia', 'Falkland Islands') for g in geo(n)]

    # --- ruta del itinerario nuevo, por rutas reales (OSRM sobre OpenStreetMap) ---
    stops = [('chapelco', 'Chapelco', '28/12 · 10/1'), ('sma', 'San Martín de los Andes', '28 al 30/12'), ('falkner', 'Lago Falkner', '30/12 al 1/1'),
             ('traful', 'Villa Traful', '1 al 3/1'), ('angostura', 'Villa La Angostura', '3 al 5/1'), ('catedral', 'Villa Catedral', 'Refugio Frey · 5/1'),
             ('bariloche', 'Bariloche', '6 al 10/1')]
    legs = []
    for (a, _, _), (b, _, _) in zip(stops, stops[1:]):
        g, dist, dur, refs = osrm(ll(a), ll(b)); legs.append({'de': a, 'a': b, 'g': g, 'km': dist / 1000, 'h': dur / 3600, 'refs': refs, 'tipo': 'ida'})
    g, dist, dur, refs = osrm(ll('bariloche'), ll('chapelco')); legs.append({'de': 'bariloche', 'a': 'chapelco', 'g': g, 'km': dist / 1000, 'h': dur / 3600, 'refs': refs, 'tipo': 'vuelta'})
    g, dist, dur, refs = osrm(ll('bariloche'), ll('pampa')); legs.append({'de': 'bariloche', 'a': 'pampa', 'g': g, 'km': dist / 1000, 'h': dur / 3600, 'refs': refs, 'tipo': 'opcional'})

    # tramos superpuestos: se corren un poco hacia un costado (en unidades de la vista de detalle)
    proj = [np.array([P(x, y) for x, y in l['g']]) for l in legs]
    OFF = 0.045
    for i, a in enumerate(proj):
        if i == 0: continue
        prev = np.vstack(proj[:i])
        near = np.array([np.min(np.hypot(prev[:, 0] - x, prev[:, 1] - y)) < 0.03 for x, y in a]).astype(float)
        if near.sum() == 0: continue
        near = np.convolve(near, np.ones(9) / 9, mode='same')
        d = np.gradient(a, axis=0); n = np.stack([-d[:, 1], d[:, 0]], 1); n /= np.maximum(np.hypot(n[:, 0], n[:, 1]), 1e-9)[:, None]
        proj[i] = a + n * (OFF * (1 if i % 2 else -1) * near)[:, None]

    def clip(geoms, pad=0.8):
        lons = [x for l in legs for x, y in l['g']]; lats = [y for l in legs for x, y in l['g']]
        b = sbox(min(lons) - pad, min(lats) - pad, max(lons) + pad, max(lats) + pad)
        out = []
        for g in geoms:
            c = shape(g).intersection(b)
            if not c.is_empty: out.append(mapping(c))
        return out
    # caja de la zona del viaje (mismo aspecto que el mapa)
    allp = np.vstack(proj); x0, y0 = allp.min(0); x1, y1 = allp.max(0)
    cx, cy = (x0 + x1) / 2, (y0 + y1) / 2; bw = max(x1 - x0, (y1 - y0) * W / H) * 1.32; bh = bw * H / W
    zoom = [cx - bw / 2, cy - bh / 2, bw, bh]
    U = bw / W   # unidades por "píxel" de la vista general, a la escala del detalle

    s = [f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {W:.0f} {H:.1f}" class="mv" role="img" aria-labelledby="mv-t" data-zoom="{" ".join(f"{v:.3f}" for v in zoom)}">',
         '<title id="mv-t">Mapa de la Patagonia y de la ruta del viaje</title>',
         '<defs><filter id="papel" x="0" y="0" width="100%" height="100%"><feTurbulence type="fractalNoise" baseFrequency=".9" numOctaves="3" seed="4"/>'
         '<feColorMatrix values="0 0 0 0 .35  0 0 0 0 .28  0 0 0 0 .2  0 0 0 .5 0"/><feComposite in2="SourceGraphic" operator="in"/></filter></defs>',
         f'<rect width="{W:.0f}" height="{H:.1f}" class="mv-mar"/>',
         f'<path d="{path(others, .9, 2)}" class="mv-otros"/>',
         f'<path d="{path(geo("Argentina"), .8, 1.5)}" class="mv-arg"/>', f'<path d="{path(clip(geo("Argentina")), .05, 0, prec=3)}" class="mv-arg mv-fino"/>',
         f'<path d="{path(geo("Chile"), .8, 1.5)}" class="mv-chile"/>', f'<path d="{path(clip(geo("Chile")), .05, 0, prec=3)}" class="mv-chile mv-fino"/>',
         f'<path d="{path(pat, .8, 1.5)}" class="mv-pat"/>', f'<path d="{path(clip(pat), .05, 0, prec=3)}" class="mv-pat mv-fino"/>',
         f'<path d="{path(lakes_ne, .6, 1)}" class="mv-lago"/>',
         ]
    # retícula de latitud y longitud
    grat = []
    for lat in range(-35, -56, -5):
        y = P(LON0, lat)[1]; grat.append(f'M0,{y:.1f}H{W:.0f}')
        s.append(k(4, y - 3, t(0, 0, f'{-lat}°S', 'mv-grad'), 'g-gen'))
    for lon in range(-75, -51, 5):
        x = P(lon, LAT0)[0]; grat.append(f'M{x:.1f},0V{H:.1f}')
        s.append(k(x + 3, H - 6, t(0, 0, f'{-lon}°O', 'mv-grad'), 'g-gen'))
    s.insert(9, f'<path d="{"".join(grat)}" class="mv-grat"/>')
    # retícula fina para el detalle (cada 0,5°)
    gf = []
    for lat10 in range(-400, -420, -5):
        lat = lat10 / 10; y = P(LON0, lat)[1]; gf.append(f'M{zoom[0]:.2f},{y:.2f}H{zoom[0] + zoom[2]:.2f}')
        s.append(k(zoom[0] + 0.01, y - 0.01, t(4, -3, f'{-lat:.1f}°S'.replace('.', ','), 'mv-grad'), 'g-det'))
    for lon10 in range(-725, -700, 5):
        lon = lon10 / 10; x = P(lon, LAT0)[0]; gf.append(f'M{x:.2f},{zoom[1]:.2f}V{zoom[1] + zoom[3]:.2f}')
        s.append(k(x, zoom[1] + zoom[3], t(4, -6, f'{-lon:.1f}°O'.replace('.', ','), 'mv-grad'), 'g-det'))
    s.append(f'<path d="{"".join(gf)}" class="mv-grat mv-grat-f g-det"/>')
    # textura de papel
    s.append(f'<rect width="{W:.0f}" height="{H:.1f}" filter="url(#papel)" class="mv-papel"/>')
    # ---- capa general ----
    ba, ch = P(L['buenos_aires']['lon'], L['buenos_aires']['lat']), P(L['chapelco']['lon'], L['chapelco']['lat'])
    mx, my = (ba[0] + ch[0]) / 2, (ba[1] + ch[1]) / 2 - 60
    gen = [f'<path d="M{ba[0]:.2f},{ba[1]:.2f} Q{mx:.2f},{my:.2f} {ch[0]:.2f},{ch[1]:.2f}" class="mv-vuelo"/>',
           f'<rect x="{zoom[0]:.3f}" y="{zoom[1]:.3f}" width="{zoom[2]:.3f}" height="{zoom[3]:.3f}" class="mv-caja"/>',
           k(*ba, '<circle r="5" class="mv-pto"/>' + t(-9, 4, 'Buenos Aires', 'mv-ciudad', 'end')),
           k(mx - 40, my + 40, t(0, 0, 'vuelo 28/12', 'mv-nota', 'end')),
           k(zoom[0] + zoom[2] + 6, zoom[1] + 12, t(0, 0, 'zona del viaje', 'mv-nota')),
           k(*P(-68.4, -45.6), t(0, 0, 'P A T A G O N I A', 'mv-pat-t', 'middle')),
           k(*P(-63.2, -33.0), t(0, 0, 'A R G E N T I N A', 'mv-pais', 'middle')),
           k(*P(-71.3, -33.4), t(0, 0, 'C H I L E', 'mv-pais', 'middle')),
           k(*P(-55.9, -32.4), t(0, 0, 'U R U G U A Y', 'mv-pais-s', 'middle')),
           k(*P(-75.3, -48.0), t(0, 0, 'Océano', 'mv-mar-t', 'middle') + t(0, 18, 'Pacífico', 'mv-mar-t', 'middle')),
           k(*P(-57.5, -46.0), t(0, 0, 'Océano', 'mv-mar-t', 'middle') + t(0, 18, 'Atlántico', 'mv-mar-t', 'middle'))]
    # escala gráfica general: 0-500-1000 km
    kmu = K / 110.57
    sx, sy = 18, H - 34
    gen.append(f'<g class="mv-escala"><path d="M{sx},{sy}h{500 * kmu:.2f}" class="mv-esc-a"/><path d="M{sx + 500 * kmu:.2f},{sy}h{500 * kmu:.2f}" class="mv-esc-b"/></g>')
    gen.append(k(sx, sy + 14, t(0, 0, '0', 'mv-grad') + t(500 * kmu, 0, '500', 'mv-grad', 'middle') + t(1000 * kmu, 0, '1.000 km', 'mv-grad', 'middle')))
    s.append('<g class="capa-gen">' + ''.join(gen) + '</g>')
    # ---- capa de detalle ----
    det = []
    lakes = {l['name']: l for l in OSM['lagos']}
    det.append(f'<path d="{path([l["geom"] for l in OSM["lagos"]], 0.025, 0.0004, prec=3)}" class="mv-lago mv-lago-osm"/>')
    for i, (l, a) in enumerate(zip(legs, proj)):
        sp = rdp(a, 0.002)
        cls = {'ida': 'mv-ruta', 'vuelta': 'mv-vuelta', 'opcional': 'mv-opc'}[l['tipo']]
        det.append(f'<defs><path id="tr{i}" d="{poly(sp)}" vector-effect="non-scaling-stroke"/></defs><use href="#tr{i}" class="mv-ruta-h"/><use href="#tr{i}" class="{cls}"/>')
    for tr in TER.get('senderos', []):
        sp = rdp(np.array([P(lo, la) for la, lo in tr['pts']]), 0.0008)
        det.append(f'<path d="{poly(sp)}" class="mv-sendero"/>')
    # rutas: etiqueta en el punto medio de cada tramo de ida (sin repetir)
    used = set()
    for l, a in zip(legs, proj):
        for r in l['refs'][:1]:
            if r in used or not r or r.replace(' ', '') not in ('RN40', 'RP65', 'RN237'): continue
            used.add(r); m = a[len(a) // 2]
            det.append(k(m[0], m[1], f'<rect x="-15" y="-9" width="30" height="16" rx="2" class="mv-ref-b"/>' + t(0, 3, r.replace('RN ', 'RN').replace('RP ', 'RP'), 'mv-ref', 'middle')))
    # lagos con nombre (punto calculado en terreno.json, si no el de Nominatim)
    lab = {l['name']: l for l in TER.get('lagos', [])}
    for name in ['Lago Nahuel Huapi', 'Lago Lácar', 'Lago Traful', 'Lago Correntoso', 'Lago Mascardi', 'Lago Meliquina', 'Lago Espejo']:
        if name not in lakes: continue
        p0 = lab.get(name) or lakes[name]
        x, y = P(p0['lon'], p0['lat'])
        det.append(k(x, y, t(0, 4, name.replace('Lago ', ''), 'mv-lago-t', 'middle')))
    # paradas numeradas con fecha
    place = {'chapelco': (10, -2, 'start'), 'sma': (-12, 4, 'end'), 'falkner': (12, 4, 'start'), 'traful': (12, 4, 'start'),
             'angostura': (-12, 4, 'end'), 'catedral': (12, 24, 'start'), 'bariloche': (12, -8, 'start')}
    for i, (key, name, when) in enumerate(stops):
        x, y = P(L[key]['lon'], L[key]['lat']); dx, dy, an = place[key]
        det.append(k(x, y, f'<circle r="10" class="mv-n"/>' + t(0, 4, str(i + 1), 'mv-n-t', 'middle') + t(dx, dy, name, 'mv-ciudad', an) + t(dx, dy + 15, when, 'mv-nota', an)))
    x, y = P(L['pampa']['lon'], L['pampa']['lat'])
    det.append(k(x, y, '<circle r="6" class="mv-n-opc"/>' + t(-8, 22, 'Pampa Linda', 'mv-ciudad') + t(-8, 37, 'Meiling opcional, 6 a 9/1', 'mv-nota')))
    for key, nm, dx in [('frey', '', 0), ('meiling', 'Refugio Otto Meiling', -40)]:
        x, y = P(L[key]['lon'], L[key]['lat'])
        det.append(k(x, y, '<path d="M0,-6 L5,3 H-5 Z" class="mv-refugio"/>' + (t(dx, -10, nm, 'mv-nota mv-nota-r') if nm else '')))
    # escala de detalle: 0-10-20 km
    ex, ey = zoom[0] + zoom[2] * 0.62, zoom[1] + zoom[3] * 0.965
    det.append(f'<path d="M{ex:.3f},{ey:.3f}h{10 * kmu:.4f}" class="mv-esc-a"/><path d="M{ex + 10 * kmu:.3f},{ey:.3f}h{10 * kmu:.4f}" class="mv-esc-b"/>')
    det.append(k(ex, ey, t(0, 14, '0', 'mv-grad') + t(10 * kmu / U, 14, '10', 'mv-grad', 'middle') + t(20 * kmu / U, 14, '20 km', 'mv-grad', 'middle'), 'k-esc'))
    s.append('<g class="capa-det">' + ''.join(det) + '</g>')
    s.append('</svg>')
    out = os.path.join(ROOT, 'data', 'mapa.svg'); open(out, 'w').write('\n'.join(s))
    print(out, os.path.getsize(out) // 1024, 'KB', file=sys.stderr)
    for l in legs: print(f"{l['de']} → {l['a']}: {l['km']:.0f} km, {l['h']:.2f} h, {l['refs']}", file=sys.stderr)
    json.dump([{k2: l[k2] for k2 in ('de', 'a', 'km', 'h', 'refs', 'tipo')} for l in legs], open(os.path.join(CACHE, 'tramos.json'), 'w'), ensure_ascii=False)

if __name__ == '__main__':
    main()
