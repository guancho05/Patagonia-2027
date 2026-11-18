#!/usr/bin/env python3
"""Silueta real del horizonte para el pie de página, calculada sobre Copernicus DEM GLO-30.

1. Busca un punto sobre el agua del Nahuel Huapi (máscara de agua de Copernicus) desde donde se vean
   las cumbres del Tronador y del Cerro Catedral (Norte), lo más cerca posible de Bariloche.
2. Para cada acimut, marcha un rayo sobre el DEM y guarda el ángulo de elevación máximo del terreno
   (con curvatura terrestre y refracción, k = 0,13).
3. Escribe data/silueta.svg (silueta negra, exagerada en vertical) y data/silueta.json (punto, acimuts, picos).
Uso: python3 tools/silueta.py
"""
import json, math, os, sys
import numpy as np
from scipy import ndimage

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
CACHE = os.path.join(ROOT, 'tools', '.cache')
import tifffile
DEM = tifffile.imread(os.path.join(CACHE, 'cop-S42-W072-DEM.tif')).astype(np.float64)
WBM = tifffile.imread(os.path.join(CACHE, 'cop-S42-W072-WBM.tif'))
R = 6371000.0; KREF = 0.13

PEAKS = [  # OpenStreetMap (Nominatim), 19/11/2026
    ('Tronador', -41.16089, -71.88816), ('Catedral Norte', -41.17957, -71.49082), ('Catedral Sur', -41.21728, -71.49543),
    ('López', -41.10195, -71.57224), ('Capilla', -41.05973, -71.63530), ('Goye', -41.11818, -71.50393),
    ('Bella Vista', -41.13218, -71.49571), ('Otto', -41.14462, -71.37595), ('Campanario', -41.07575, -71.47642)]

def px(lat, lon): return (-41 - lat) * 3600 - 0.5, (lon + 72) * 3600 - 0.5
def h(lat, lon): r, c = px(lat, lon); return ndimage.map_coordinates(DEM, [np.atleast_1d(r), np.atleast_1d(c)], order=1)
def dest(lat, lon, az, d):
    return lat + d * math.cos(math.radians(az)) / 110570, lon + d * math.sin(math.radians(az)) / (111320 * math.cos(math.radians(lat)))
def bearing(a, b):
    dy = (b[0] - a[0]) * 110570; dx = (b[1] - a[1]) * 111320 * math.cos(math.radians(a[0]))
    return (math.degrees(math.atan2(dx, dy)) + 360) % 360, math.hypot(dx, dy)

def ray(lat, lon, z0, az, dmax=80000, step=30):
    d = np.arange(step, dmax, step)
    la = lat + d * math.cos(math.radians(az)) / 110570
    lo = lon + d * math.sin(math.radians(az)) / (111320 * math.cos(math.radians(lat)))
    ok = (la <= -41.0) & (la >= -42.0) & (lo >= -72.0) & (lo <= -71.0)
    d, la, lo = d[ok], la[ok], lo[ok]
    z = h(la, lo) - d * d / (2 * R) * (1 - KREF)
    ang = np.degrees(np.arctan2(z - z0, d))
    return d, ang

def visible(lat, lon, z0, peak):
    az, dist = bearing((lat, lon), peak[1:])
    d, ang = ray(lat, lon, z0, az, dist - 300)
    zp = float(h(*peak[1:])[0]) - dist * dist / (2 * R) * (1 - KREF)
    ap = math.degrees(math.atan2(zp - z0, dist))
    return ap - (ang.max() if len(ang) else -90), az, ap

def main():
    tron, cat = PEAKS[0], PEAKS[1]
    best = None
    for lat in np.arange(-41.005, -41.14, -0.005):
        for lon in np.arange(-71.70, -71.28, 0.005):
            r, c = px(lat, lon)
            if WBM[int(round(r)), int(round(c))] < 2: continue   # solo puntos sobre el lago
            z0 = float(h(lat, lon)[0]) + 3
            mt, azt, _ = visible(lat, lon, z0, tron); mc, azc, _ = visible(lat, lon, z0, cat)
            if mt < 0.05 or mc < 0.05: continue
            _, db = bearing((lat, lon), (-41.1335, -71.3102))       # cerca de Bariloche
            score = min(mt, 1.0) + min(mc, 1.0) - db / 20000
            if not best or score > best[0]: best = (score, lat, lon, z0, azt, azc, mt, mc, db)
    if not best: sys.exit('no encontré un punto con los dos picos a la vista')
    _, lat, lon, z0, azt, azc, mt, mc, db = best
    print(f'punto {lat:.4f}, {lon:.4f} ({z0:.0f} m), a {db / 1000:.1f} km de Bariloche; Tronador az {azt:.1f}° (+{mt:.2f}°), Catedral az {azc:.1f}° (+{mc:.2f}°)', file=sys.stderr)
    a0, a1 = min(azt, azc) - 12, max(azt, azc) + 10
    azs = np.arange(a0, a1, 0.05)
    prof = np.array([ray(lat, lon, z0, a)[1].max() for a in azs])
    prof = ndimage.gaussian_filter1d(prof, 1.0)
    Wd, Hd, EXV = 1600.0, 220.0, 1.0
    lo_a = min(0.0, prof.min()); hi_a = prof.max()
    sy = (Hd - 30) / (hi_a - lo_a)            # escala vertical (grados → unidades)
    sx = Wd / (a1 - a0)
    X = (azs - a0) * sx; Y = Hd - (prof - lo_a) * sy
    path = f'M0,{Hd:.0f} ' + ' '.join(f'L{x:.1f},{y:.1f}' for x, y in zip(X, Y)) + f' L{Wd:.0f},{Hd:.0f} Z'
    labels = []
    for name, plat, plon in PEAKS:
        vis, az, ap = visible(lat, lon, z0, (name, plat, plon))
        if vis < 0.05 or not (a0 + 1 < az < a1 - 1): continue
        x = (az - a0) * sx; y = Hd - (ap - lo_a) * sy
        labels.append({'nombre': name, 'az': round(az, 1), 'x': round(x, 1), 'y': round(y, 1), 'alt': round(float(h(plat, plon)[0]))})
    ex = sy / sx   # exageración vertical (relación de escalas)
    svg = (f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {Wd:.0f} {Hd:.0f}" preserveAspectRatio="none" class="sil" aria-hidden="true">'
           f'<path d="{path}" class="sil-m"/></svg>')
    for l in labels: l['xp'] = round(l['x'] / Wd * 100, 2); l['yp'] = round(l['y'] / Hd * 100, 2)
    open(os.path.join(ROOT, 'data', 'silueta.svg'), 'w').write(svg)
    json.dump({'punto': {'lat': round(lat, 4), 'lon': round(lon, 4), 'alt_m': round(z0)}, 'acimut': [round(a0, 1), round(a1, 1)],
               'exageracion_vertical': round(ex, 1), 'picos': labels, 'fuente': 'Copernicus DEM GLO-30 y máscara de agua; cumbres de OpenStreetMap'},
              open(os.path.join(ROOT, 'data', 'silueta.json'), 'w'), ensure_ascii=False, indent=1)
    print('picos', [(l['nombre'], l['az']) for l in labels], 'exageración', round(ex, 1), file=sys.stderr)

if __name__ == '__main__':
    main()
