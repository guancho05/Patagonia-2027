#!/usr/bin/env python3
"""Genera los mapas SVG del resumen: Patagonia (ubicación) y detalle de la ruta.
Datos: Natural Earth 1:10m (dominio público) para países, provincias/regiones y lagos grandes;
OpenStreetMap (ODbL, data/osm-fuente.json de tools/osm.py) para los lagos de la zona y los puntos de la ruta.
Salida: data/mapa-patagonia.svg y data/mapa-ruta.svg (con clases CSS: los colores salen de la página).
Uso: python3 tools/mapa.py
"""
import json, math, os, sys, urllib.request
sys.setrecursionlimit(20000)
import numpy as np

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
NE = os.path.join(ROOT, 'tools', '.cache', 'ne')
os.makedirs(NE, exist_ok=True)
def ne(name):
    f = os.path.join(NE, name + '.geojson')
    if not os.path.exists(f):
        urllib.request.urlretrieve(f'https://raw.githubusercontent.com/nvkelso/natural-earth-vector/master/geojson/{name}.geojson', f)
    return json.load(open(f))
OSM = json.load(open(os.path.join(ROOT, 'data', 'osm-fuente.json')))

def rdp(pts, eps):
    if len(pts) < 3: return pts
    a, b = pts[0], pts[-1]; ab = b - a; n = np.hypot(*ab)
    q = pts - a
    d = np.abs(ab[0] * q[:, 1] - ab[1] * q[:, 0]) / n if n > 0 else np.hypot(q[:, 0], q[:, 1])
    i = int(np.argmax(d))
    if d[i] > eps: return np.vstack([rdp(pts[:i + 1], eps)[:-1], rdp(pts[i:], eps)])
    return np.vstack([a, b])

class Proj:
    def __init__(s, w, e, n, so, W):
        s.w, s.n = w, n; s.k = W / ((e - w) * math.cos(math.radians((n + so) / 2))); s.c = math.cos(math.radians((n + so) / 2))
        s.W = W; s.H = (n - so) * s.k
    def __call__(s, lon, lat): return ((lon - s.w) * s.c * s.k, (s.n - lat) * s.k)

def rings(geom):
    if geom['type'] == 'Polygon': return geom['coordinates']
    if geom['type'] == 'MultiPolygon': return [r for p in geom['coordinates'] for r in p]
    return []

def path(geoms, P, eps, minarea=0.0, box=None):
    out = []
    for g in geoms:
        for r in rings(g):
            a = np.array([P(x, y) for x, y in r])
            if box and (a[:, 0].max() < -50 or a[:, 0].min() > P.W + 50 or a[:, 1].max() < -50 or a[:, 1].min() > P.H + 50): continue
            s = rdp(a, eps)
            if len(s) < 3: continue
            area = 0.5 * abs(np.dot(s[:, 0], np.roll(s[:, 1], 1)) - np.dot(s[:, 1], np.roll(s[:, 0], 1)))
            if area < minarea: continue
            out.append('M' + 'L'.join(f'{x:.1f},{y:.1f}' for x, y in s) + 'Z')
    return ''.join(out)

def label(x, y, t, cls, anchor='middle', dy=0):
    return f'<text x="{x:.1f}" y="{y + dy:.1f}" class="{cls}" text-anchor="{anchor}">{t}</text>'

PATAG = {'Argentina': ['Neuquén', 'Río Negro', 'Chubut', 'Santa Cruz', 'Tierra del Fuego'],
         'Chile': ['Los Lagos', 'Aisén', 'Magallanes']}

def mapa_patagonia():
    P = Proj(-77.5, -52.0, -31.8, -56.3, 600)
    W, H = P.W, P.H
    countries = ne('ne_10m_admin_0_countries')['features']
    land = [f['geometry'] for f in countries if f['properties']['ADMIN'] in ('Argentina', 'Chile', 'Uruguay', 'Brazil', 'Paraguay', 'Bolivia', 'Falkland Islands')]
    adm1 = ne('ne_10m_admin_1_states_provinces')['features']
    pat = [f['geometry'] for f in adm1 if f['properties']['admin'] in PATAG and any(n.lower() in (f['properties']['name'] or '').lower() for n in PATAG[f['properties']['admin']])]
    lakes = [f['geometry'] for f in ne('ne_10m_lakes')['features']]
    # frontera Argentina-Chile: bordes de Argentina cerca de los Andes (dibujado como contorno de Chile)
    chile = [f['geometry'] for f in countries if f['properties']['ADMIN'] == 'Chile']
    L = OSM['lugares']
    ba, ch = P(L['buenos_aires']['lon'], L['buenos_aires']['lat']), P(L['chapelco']['lon'], L['chapelco']['lat'])
    # caja del detalle
    bx0, by0 = P(-72.1, -39.9); bx1, by1 = P(-70.9, -41.45)
    mx, my = (ba[0] + ch[0]) / 2, (ba[1] + ch[1]) / 2 - 70
    s = [f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {W:.0f} {H:.0f}" class="mp" role="img" aria-labelledby="mp-t">',
         '<title id="mp-t">Mapa de la Patagonia: sur de Argentina y Chile, con la Patagonia destacada, el vuelo de Buenos Aires a Chapelco y la zona del viaje</title>',
         f'<rect width="{W:.0f}" height="{H:.0f}" class="mp-mar"/>',
         f'<path d="{path(land, P, 1.0, 3, True)}" class="mp-tierra"/>',
         f'<path d="{path(pat, P, 1.0, 3, True)}" class="mp-pat"/>',
         f'<path d="{path(chile, P, 1.0, 3, True)}" class="mp-borde"/>',
         f'<path d="{path(lakes, P, 0.8, 3, True)}" class="mp-lago"/>',
         f'<path d="M{ba[0]:.1f},{ba[1]:.1f} Q{mx:.1f},{my:.1f} {ch[0]:.1f},{ch[1]:.1f}" class="mp-vuelo-h"/>',
         f'<path d="M{ba[0]:.1f},{ba[1]:.1f} Q{mx:.1f},{my:.1f} {ch[0]:.1f},{ch[1]:.1f}" class="mp-vuelo"/>',
         f'<rect x="{bx0:.1f}" y="{by0:.1f}" width="{bx1 - bx0:.1f}" height="{by1 - by0:.1f}" class="mp-caja"/>',
         f'<circle cx="{ba[0]:.1f}" cy="{ba[1]:.1f}" r="7" class="mp-punto"/>',
         label(ba[0] - 12, ba[1] + 6, 'Buenos Aires', 'mp-ciudad', 'end'),
         label((ba[0] + ch[0]) / 2 - 30, my + 50, 'vuelo 28/12', 'mp-nota', 'end'),
         label(bx1 + 8, by0 + 18, 'zona del viaje', 'mp-nota', 'start'),
         label(*P(-67.6, -45.2), 'PATAGONIA', 'mp-pat-t'),
         label(*P(-63.0, -32.6), 'ARGENTINA', 'mp-pais'),
         label(*P(-73.6, -30.9), '', 'mp-pais'),
         label(*P(-71.6, -33.2), 'CHILE', 'mp-pais'),
         label(*P(-56.0, -32.7), 'URUGUAY', 'mp-pais-s'),
         label(*P(-75.6, -47.0), 'Océano', 'mp-mar-t'), label(*P(-75.6, -47.0), 'Pacífico', 'mp-mar-t', dy=24),
         label(*P(-57.0, -45.0), 'Océano', 'mp-mar-t'), label(*P(-57.0, -45.0), 'Atlántico', 'mp-mar-t', dy=24),
         '</svg>']
    return '\n'.join(x for x in s if x)

def mapa_ruta():
    P = Proj(-72.15, -70.95, -39.92, -41.42, 600)
    W, H = P.W, P.H
    countries = ne('ne_10m_admin_0_countries')['features']
    chile = [f['geometry'] for f in countries if f['properties']['ADMIN'] == 'Chile']
    arg = [f['geometry'] for f in countries if f['properties']['ADMIN'] == 'Argentina']
    lakes = [l['geom'] for l in OSM['lagos']]
    L = OSM['lugares']
    pt = lambda k: P(L[k]['lon'], L[k]['lat'])
    stops = [('chapelco', 'Chapelco', '28/12 y 10/1', 'end', -12, 4), ('sma', 'San Martín de los Andes', '28 al 30/12', 'end', -12, 4),
             ('falkner', 'Lago Falkner', '30/12 al 1/1', 'start', 14, 4), ('traful', 'Villa Traful', '1 al 3/1', 'start', 12, 4),
             ('catedral', 'Villa Catedral', 'Refugio Frey · 3/1', 'start', 12, 46), ('angostura', 'Villa La Angostura', '4/1', 'end', -12, 4),
             ('pampa', 'Pampa Linda', 'Refugio Otto Meiling · 5/1', 'abs', 14, 52), ('bariloche', 'Bariloche', '6 al 10/1', 'start', 12, -40)]
    order = ['chapelco', 'sma', 'falkner', 'traful', 'catedral', 'angostura', 'pampa', 'bariloche']
    line = ' '.join(f'{"M" if i == 0 else "L"}{pt(k)[0]:.1f},{pt(k)[1]:.1f}' for i, k in enumerate(order))
    back = f'M{pt("bariloche")[0]:.1f},{pt("bariloche")[1]:.1f} L{pt("chapelco")[0]:.1f},{pt("chapelco")[1]:.1f}'
    tron = P(-71.8913, -41.1589)
    s = [f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {W:.0f} {H:.0f}" class="mp mp-ruta" role="img" aria-labelledby="mr-t">',
         '<title id="mr-t">Mapa de la ruta del viaje: Chapelco, San Martín de los Andes, Lago Falkner, Villa Traful, Villa Catedral y Refugio Frey, Villa La Angostura, Pampa Linda y Refugio Otto Meiling, Bariloche y vuelta a Chapelco</title>',
         f'<rect width="{W:.0f}" height="{H:.0f}" class="mp-tierra"/>',
         f'<path d="{path(chile, P, 0.8, 0, True)}" class="mp-chile"/>',
         f'<path d="{path(lakes, P, 1.0, 6, True)}" class="mp-lago"/>',
         f'<path d="{path(arg, P, 0.8, 0, True)}" class="mp-borde"/>',
         f'<path d="{back}" class="mp-vuelta"/>',
         f'<path d="{line}" class="mp-linea-h"/>', f'<path d="{line}" class="mp-linea"/>',
         f'<path d="M{tron[0]:.1f},{tron[1] - 13:.1f} l11,19 h-22 Z" class="mp-cerro"/>', label(tron[0] - 14, tron[1] - 4, 'Tronador', 'mp-nota', 'end'),
         label(*P(-72.0, -40.35), 'CHILE', 'mp-pais', 'start'), label(*P(-71.02, -41.38), 'ARGENTINA', 'mp-pais', 'end'),
         label(*P(-71.50, -40.90), 'Lago Nahuel Huapi', 'mp-lago-t')]
    for i, (k, name, when, anc, dx, dy) in enumerate(stops):
        x, y = pt(k)
        s.append(f'<circle cx="{x:.1f}" cy="{y:.1f}" r="16" class="mp-n"/>' + label(x, y + 7, str(i + 1), 'mp-n-t'))
        lx = dx if anc == 'abs' else x + dx * 1.4
        a2 = 'start' if anc == 'abs' else anc
        s.append(label(lx, y + dy, name, 'mp-ciudad', a2) + label(lx, y + dy + 26, when, 'mp-nota', a2))
    s.append('</svg>')
    return '\n'.join(s)

if __name__ == '__main__':
    for name, svg in [('mapa-patagonia', mapa_patagonia()), ('mapa-ruta', mapa_ruta())]:
        f = os.path.join(ROOT, 'data', name + '.svg'); open(f, 'w').write(svg); print(f, os.path.getsize(f) // 1024, 'KB')
