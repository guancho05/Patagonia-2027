#!/usr/bin/env python3
"""Baja de OpenStreetMap (© colaboradores de OpenStreetMap, ODbL) lo que usan la portada 3D y el mapa:
lagos y glaciares (polígonos), senderos Pampa Linda → Otto Meiling y Villa Catedral → Frey, y los puntos de la ruta.

- Lagos, glaciares y lugares: Nominatim (search + lookup con polygon_geojson), 1 pedido por segundo.
- Senderos: API oficial de OSM (/api/0.6/map) en una caja chica alrededor de cada sendero; después el camino más corto
  sobre la red de senderos (path/footway/track, con más costo para calles) entre el inicio y el refugio.
  Overpass no responde desde el entorno donde se generó, por eso este camino.
Salida: data/osm.json   ·   Uso: python3 tools/osm.py
"""
import json, math, os, sys, time, heapq, urllib.parse, urllib.request
import xml.etree.ElementTree as ET

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
CACHE = os.path.join(ROOT, 'tools', '.cache', 'osm'); os.makedirs(CACHE, exist_ok=True)
UA = {'User-Agent': 'patagonia-trip-site/1.0 (sitio personal de un viaje)'}
_last = [0.0]

def get(url, name):
    f = os.path.join(CACHE, name)
    if os.path.exists(f):
        return open(f, 'rb').read()
    wait = 1.1 - (time.time() - _last[0])
    if wait > 0: time.sleep(wait)
    req = urllib.request.Request(url, headers=UA)
    with urllib.request.urlopen(req, timeout=120) as r: data = r.read()
    _last[0] = time.time(); open(f, 'wb').write(data); return data

VIEW = '-72.3,-39.9,-70.9,-41.6'
def search(q, extra=''):
    url = 'https://nominatim.openstreetmap.org/search?format=json&limit=10&countrycodes=ar,cl&q=' + urllib.parse.quote(q) + extra
    return json.loads(get(url, 's-' + urllib.parse.quote(q + extra, safe='')[:150] + '.json'))

def lookup(osm_type, osm_id):
    t = {'relation': 'R', 'way': 'W', 'node': 'N'}[osm_type]
    url = f'https://nominatim.openstreetmap.org/lookup?format=json&polygon_geojson=1&polygon_threshold=0.0002&osm_ids={t}{osm_id}'
    r = json.loads(get(url, f'l-{t}{osm_id}.json')); return r[0] if r else None

LAKES = ['Lago Nahuel Huapi', 'Lago Mascardi', 'Lago Gutiérrez', 'Lago Moreno Oeste', 'Lago Moreno Este', 'Lago Lácar', 'Lago Falkner',
         'Lago Villarino', 'Lago Traful', 'Lago Correntoso', 'Lago Espejo', 'Lago Hess', 'Lago Frías', 'Lago Guillelmo', 'Lago Martín',
         'Lago Escondido', 'Lago Machónico', 'Lago Hermoso', 'Lago Meliquina', 'Lago Perito Moreno', 'Laguna Toncek', 'Lago Fonck', 'Lago Steffen']
PLACES = {  # punto, consulta de Nominatim
    'buenos_aires': 'Buenos Aires, Argentina', 'chapelco': 'Aeropuerto Aviador Carlos Campos', 'sma': 'San Martín de los Andes',
    'falkner': 'Lago Falkner', 'traful': 'Villa Traful', 'catedral': 'Villa Catedral, Bariloche', 'frey': 'Refugio Emilio Frey',
    'angostura': 'Villa La Angostura', 'pampa': 'Pampa Linda', 'meiling': 'Refugio Otto Meiling', 'bariloche': 'San Carlos de Bariloche'}

def lake_geoms():
    out = []
    for name in LAKES:
        res = [r for r in search(name, '&viewbox=' + VIEW + '&bounded=1') if r.get('class') in ('natural', 'water') and r['osm_type'] != 'node']
        if not res:
            print('sin polígono:', name, file=sys.stderr); continue
        r = lookup(res[0]['osm_type'], res[0]['osm_id'])
        g = r.get('geojson') if r else None
        if not g or g['type'] not in ('Polygon', 'MultiPolygon'):
            print('sin polígono:', name, file=sys.stderr); continue
        out.append({'name': name, 'osm': f"{res[0]['osm_type']}/{res[0]['osm_id']}", 'lat': float(r['lat']), 'lon': float(r['lon']), 'geom': g})
    return out

def glacier_geoms():
    out, seen = [], set()
    for q in ['glaciar', 'ventisquero', 'glacier']:
        for r in search(q, '&viewbox=-72.0,-41.0,-71.2,-41.4&bounded=1'):
            if r['osm_type'] == 'node' or r.get('type') != 'glacier' or r['osm_id'] in seen: continue
            seen.add(r['osm_id']); L = lookup(r['osm_type'], r['osm_id'])
            if L and L.get('geojson', {}).get('type') in ('Polygon', 'MultiPolygon'):
                out.append({'name': r['display_name'].split(',')[0], 'osm': f"{r['osm_type']}/{r['osm_id']}", 'geom': L['geojson']})
    return out

def hav(a, b):
    la1, lo1, la2, lo2 = map(math.radians, (a[0], a[1], b[0], b[1]))
    return 2 * 6371000 * math.asin(math.sqrt(math.sin((la2 - la1) / 2) ** 2 + math.cos(la1) * math.cos(la2) * math.sin((lo2 - lo1) / 2) ** 2))

COST = {'path': 1.0, 'footway': 1.0, 'track': 1.15, 'bridleway': 1.1, 'steps': 1.0, 'unclassified': 2.5, 'service': 2.5, 'tertiary': 3, 'secondary': 3, 'residential': 2.5}
def trail(name, bbox, start, end):
    url = 'https://api.openstreetmap.org/api/0.6/map?bbox=' + ','.join(map(str, bbox))
    root = ET.fromstring(get(url, f'map-{name}.xml'))
    nodes = {n.get('id'): (float(n.get('lat')), float(n.get('lon'))) for n in root.iter('node')}
    G = {}
    for w in root.iter('way'):
        tags = {t.get('k'): t.get('v') for t in w.iter('tag')}
        hw = tags.get('highway')
        if hw not in COST: continue
        ref = [nd.get('ref') for nd in w.iter('nd') if nd.get('ref') in nodes]
        for a, b in zip(ref, ref[1:]):
            d = hav(nodes[a], nodes[b]) * COST[hw]
            G.setdefault(a, []).append((b, d)); G.setdefault(b, []).append((a, d))
    near = lambda p: min(G, key=lambda k: hav(nodes[k], p))
    s, t = near(start), near(end)
    dist, prev, pq = {s: 0}, {}, [(0, s)]
    while pq:
        d, u = heapq.heappop(pq)
        if u == t: break
        if d > dist.get(u, 1e18): continue
        for v, w in G[u]:
            if d + w < dist.get(v, 1e18): dist[v] = d + w; prev[v] = u; heapq.heappush(pq, (d + w, v))
    path = [t]
    while path[-1] != s: path.append(prev[path[-1]])
    pts = [nodes[k] for k in reversed(path)]
    length = sum(hav(a, b) for a, b in zip(pts, pts[1:]))
    return {'name': name, 'pts': [[round(a, 6), round(b, 6)] for a, b in pts], 'km': round(length / 1000, 2),
            'snap_inicio_m': round(hav(nodes[s], start)), 'snap_fin_m': round(hav(nodes[t], end))}

def main():
    places = {}
    for k, q in PLACES.items():
        r = search(q)
        if not r: print('sin lugar', k, file=sys.stderr); continue
        places[k] = {'lat': round(float(r[0]['lat']), 5), 'lon': round(float(r[0]['lon']), 5), 'osm': f"{r[0]['osm_type']}/{r[0]['osm_id']}", 'nombre': r[0]['display_name'].split(',')[0]}
    lakes = lake_geoms(); glaciers = glacier_geoms()
    P = lambda k: (places[k]['lat'], places[k]['lon'])
    trails = [
        trail('meiling', [-71.845, -41.245, -71.755, -41.165], P('pampa'), P('meiling')),
        trail('frey', [-71.505, -41.215, -71.43, -41.155], (-41.1667, -71.4447), P('frey')),
    ]
    json.dump({'fuente': '© colaboradores de OpenStreetMap (ODbL), vía Nominatim y la API de OSM', 'fecha': time.strftime('%Y-%m-%d'),
               'lugares': places, 'lagos': lakes, 'glaciares': glaciers, 'senderos': trails},
              open(os.path.join(ROOT, 'data', 'osm-fuente.json'), 'w'), ensure_ascii=False)
    for t in trails: print('sendero', t['name'], t['km'], 'km; ajuste inicio', t['snap_inicio_m'], 'm, fin', t['snap_fin_m'], 'm', file=sys.stderr)
    print('lagos', [l['name'] for l in lakes], file=sys.stderr); print('glaciares', [g['name'] for g in glaciers], file=sys.stderr)
    print('lugares', places, file=sys.stderr)

if __name__ == '__main__':
    main()
