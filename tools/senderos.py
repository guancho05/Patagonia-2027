#!/usr/bin/env python3
"""Generalización cartográfica de los senderos para dibujarlos en la portada 3D.

Los zigzags de una cuesta (tramos donde el sendero vuelve sobre sí mismo) vistos desde el dron se pisan y forman un
"nudo". Acá se reemplazan por su línea central: el sendero sigue pasando por el mismo corredor, con el mismo inicio y
el mismo final; fuera de los zigzags solo se suaviza el ruido de pocos metros. La distancia y el desnivel que se
muestran siguen saliendo del trazado original de OSM (tools/terreno.py), no de esta versión dibujada.

Uso: python3 tools/senderos.py   (reescribe los 'pts' de data/terreno.json a partir de data/osm-fuente.json)
"""
import json, math, os
import numpy as np

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
PASO = 25.0          # metros entre puntos
VENTANA = 32         # puntos (≈800 m) para la dirección general del sendero
SIGMA_ZIGZAG = 22.0  # puntos (≈550 m) de suavizado donde hay zigzags
SIGMA_RESTO = 1.5    # puntos (≈40 m) en el resto


def _metros(pts):
    lat0 = math.radians(float(np.mean(pts[:, 0])))
    return np.c_[pts[:, 1] * 111320 * math.cos(lat0), pts[:, 0] * 110570], lat0


def _remuestrear(xy, paso):
    d = np.r_[0, np.cumsum(np.hypot(*np.diff(xy, axis=0).T))]
    n = max(2, int(d[-1] // paso) + 2); s = np.linspace(0, d[-1], n)
    return np.c_[np.interp(s, d, xy[:, 0]), np.interp(s, d, xy[:, 1])]


def generalizar(pts):
    """pts: [[lat, lon], ...] → [[lat, lon], ...] sin zigzags que se pisen, mismos extremos."""
    pts = np.asarray(pts, float)
    xy, lat0 = _metros(pts)
    xy = _remuestrear(xy, PASO); n = len(xy)
    # tramos que van "para atrás" respecto de la dirección general (±800 m): son las vueltas de un zigzag
    seg = np.diff(xy, axis=0); seg = np.vstack([seg, seg[-1:]])
    seg /= np.maximum(np.linalg.norm(seg, axis=1, keepdims=True), 1e-9)
    idx = np.arange(n)
    gen = xy[np.minimum(idx + VENTANA, n - 1)] - xy[np.maximum(idx - VENTANA, 0)]
    gen /= np.maximum(np.linalg.norm(gen, axis=1, keepdims=True), 1e-9)
    atras = (seg * gen).sum(1) < -0.2
    zona = np.convolve(atras.astype(float), np.ones(2 * 24 + 1), 'same') > 0      # ±600 m alrededor de cada vuelta
    sig = np.where(zona, SIGMA_ZIGZAG, SIGMA_RESTO)
    sig = np.convolve(sig, np.ones(25) / 25, 'same')                               # transición suave entre zonas
    sig = np.minimum(sig, np.minimum(idx, n - 1 - idx) / 2.5 + 0.01)               # los extremos quedan donde están
    out = np.empty_like(xy)
    for i in range(n):
        w = np.exp(-0.5 * ((idx - i) / sig[i]) ** 2); out[i] = (w[:, None] * xy).sum(0) / w.sum()
    out[0], out[-1] = xy[0], xy[-1]
    out = _remuestrear(out, PASO)
    lat = out[:, 1] / 110570; lon = out[:, 0] / (111320 * math.cos(lat0))
    return [[round(a, 5), round(b, 5)] for a, b in zip(lat, lon)], int(atras.sum())


def main():
    meta_f = os.path.join(ROOT, 'data', 'terreno.json')
    meta = json.load(open(meta_f)); osm = json.load(open(os.path.join(ROOT, 'data', 'osm-fuente.json')))
    for t in meta['senderos']:
        src = next(s for s in osm['senderos'] if s['name'] == t['name'])
        t['pts'], vueltas = generalizar(src['pts'])
        print(t['name'], len(t['pts']), 'puntos;', vueltas, 'puntos en vueltas de zigzag')
    meta['fuente']['senderos_dibujo'] = 'Trazado de OSM generalizado para el dibujo (zigzags a su línea central: tools/senderos.py); km y desnivel del trazado original'
    json.dump(meta, open(meta_f, 'w'), ensure_ascii=False, indent=1)


if __name__ == '__main__':
    main()
