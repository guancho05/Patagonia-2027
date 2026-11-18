#!/usr/bin/env python3
"""Genera los datos de la portada 3D (relieve del Tronador al Catedral).

Baja tiles de elevación (AWS Terrain Tiles, formato Terrarium; datos SRTM y otros),
los pasa a una grilla lat/lon y hornea una textura de color con luz, sombras proyectadas,
oclusión ambiente, nieve y glaciar según altura, pendiente y orientación, bosque y lagos.

Salida en data/:
  terreno.json            metadatos (cajas, tamaños, lugares)
  terreno-cerca-alt.png   alturas de la zona de detalle (R*256+G = decímetros)
  terreno-lejos-alt.png   alturas del anillo exterior (misma codificación)
  terreno-cerca.jpg       color horneado de la zona de detalle (escritorio)
  terreno-cerca-m.jpg     ídem, mitad de resolución (celular)
  terreno-lejos.jpg       color horneado del anillo exterior

Uso: python3 tools/terreno.py   (necesita numpy, scipy y Pillow; los tiles quedan en tools/.cache)
"""
import io, json, math, os, sys, urllib.request
import numpy as np
from PIL import Image
from scipy import ndimage

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
CACHE = os.path.join(ROOT, 'tools', '.cache')
OUT = os.path.join(ROOT, 'data')
os.makedirs(CACHE, exist_ok=True); os.makedirs(OUT, exist_ok=True)

# Zona de detalle: del Tronador (oeste) al Cerro Catedral y el Refugio Frey (este), con el Lago Mascardi al sur.
CERCA = dict(n=-41.08, s=-41.36, w=-71.98, e=-71.42, z=12, bake=2048, alt=768)
# Anillo exterior: ~170 x 150 km para el horizonte (incluye el Osorno y el Puntiagudo en Chile).
LEJOS = dict(n=-40.55, s=-41.90, w=-72.70, e=-70.70, z=9, bake=1024, alt=256)

# Lugares (OpenStreetMap, consultado el 18/11/2026; cumbre del Tronador según la revista Cultura de Montaña).
PLACES = {
    'meiling': {'lat': -41.17593, 'lon': -71.81801, 'label': 'Refugio Otto Meiling'},
    'frey': {'lat': -41.19825, 'lon': -71.48628, 'label': 'Refugio Frey'},
    'tronador': {'lat': -41.15892, 'lon': -71.89128, 'label': 'Cerro Tronador'},
    'pampa': {'lat': -41.23057, 'lon': -71.77320, 'label': 'Pampa Linda'},
    'mascardi': {'lat': -41.30889, 'lon': -71.57735, 'label': 'Lago Mascardi'},
}

def tile_x(lon, z): return (lon + 180) / 360 * 2 ** z
def tile_y(lat, z): return (1 - math.asinh(math.tan(math.radians(lat))) / math.pi) / 2 * 2 ** z

def tile(z, x, y):
    f = os.path.join(CACHE, f'{z}-{x}-{y}.png')
    if not os.path.exists(f):
        url = f'https://s3.amazonaws.com/elevation-tiles-prod/terrarium/{z}/{x}/{y}.png'
        with urllib.request.urlopen(url, timeout=60) as r: open(f, 'wb').write(r.read())
    a = np.asarray(Image.open(f).convert('RGB'), dtype=np.float64)
    return a[..., 0] * 256 + a[..., 1] + a[..., 2] / 256 - 32768

def heights(box, W, H):
    """Alturas (m) en una grilla regular en lat/lon de W x H puntos (filas de norte a sur)."""
    z = box['z']
    x0, x1 = int(tile_x(box['w'], z)), int(tile_x(box['e'], z))
    y0, y1 = int(tile_y(box['n'], z)), int(tile_y(box['s'], z))
    mosaic = np.zeros(((y1 - y0 + 1) * 256, (x1 - x0 + 1) * 256))
    for x in range(x0, x1 + 1):
        for y in range(y0, y1 + 1):
            mosaic[(y - y0) * 256:(y - y0 + 1) * 256, (x - x0) * 256:(x - x0 + 1) * 256] = tile(z, x, y)
    lons = np.linspace(box['w'], box['e'], W)
    lats = np.linspace(box['n'], box['s'], H)
    px = (np.array([tile_x(l, z) for l in lons]) - x0) * 256 - 0.5
    py = (np.array([tile_y(l, z) for l in lats]) - y0) * 256 - 0.5
    PX, PY = np.meshgrid(px, py)
    return ndimage.map_coordinates(mosaic, [PY, PX], order=3, mode='nearest')

def size_km(box):
    lat = math.radians((box['n'] + box['s']) / 2)
    return (box['e'] - box['w']) * 111.32 * math.cos(lat), (box['n'] - box['s']) * 110.57

def save_alt(h, path):
    dm = np.clip(np.round(h * 10), 0, 65535).astype(np.uint32)
    rgb = np.stack([dm >> 8, dm & 255, np.zeros_like(dm)], -1).astype(np.uint8)
    Image.fromarray(rgb, 'RGB').save(path, optimize=True)

def noise(shape, scale, seed):
    rng = np.random.default_rng(seed)
    small = rng.random((max(2, shape[0] // scale + 2), max(2, shape[1] // scale + 2)))
    return ndimage.zoom(small, (shape[0] / (small.shape[0] - 1), shape[1] / (small.shape[1] - 1)), order=3)[:shape[0], :shape[1]]

def fbm(shape, seed):
    return sum(noise(shape, s, seed + i) * w for i, (s, w) in enumerate([(96, .5), (32, .3), (10, .2)]))

def lin(hexs):
    c = np.array([int(hexs[i:i + 2], 16) / 255 for i in (1, 3, 5)])
    return c ** 2.2

def smooth(a, b, x):
    t = np.clip((x - a) / (b - a), 0, 1); return t * t * (3 - 2 * t)

SUN_AZ, SUN_EL = 315.0, 27.0   # sol del noroeste (tarde de verano en el hemisferio sur)

def bake(h, box, W, H, seed):
    wkm, hkm = size_km(box)
    dx, dy = wkm * 1000 / (W - 1), hkm * 1000 / (H - 1)
    gy, gx = np.gradient(h, dy, dx)          # gy: hacia el sur (filas)
    gn = -gy                                  # pendiente hacia el norte
    nx, ny, nz = -gx, -gn, np.ones_like(h)
    L = np.sqrt(nx * nx + ny * ny + nz * nz); nx, ny, nz = nx / L, ny / L, nz / L
    steep = np.degrees(np.arccos(nz))
    az, el = math.radians(SUN_AZ), math.radians(SUN_EL)
    sx, sy, sz = math.sin(az) * math.cos(el), math.cos(az) * math.cos(el), math.sin(el)
    diffuse = np.clip(nx * sx + ny * sy + nz * sz, 0, 1)
    # sombras proyectadas: marcha del rayo hacia el sol
    shadow = np.ones_like(h)
    step_px = 1.5
    ddx, ddy = math.sin(az) * step_px, -math.cos(az) * step_px   # en píxeles (filas hacia el sur)
    rise = math.tan(el) * step_px * dx
    yy, xx = np.mgrid[0:H, 0:W].astype(np.float64)
    for k in range(1, 260):
        sh = ndimage.map_coordinates(h, [yy + ddy * k, xx + ddx * k], order=1, mode='nearest')
        shadow = np.minimum(shadow, np.clip(1 - (sh - (h + rise * k)) / 25, 0, 1))
    shadow = ndimage.gaussian_filter(shadow, 0.8)
    # oclusión ambiente aproximada: cuánto más alto está el entorno
    ao = np.ones_like(h)
    for r, k in [(3, 60), (10, 160), (30, 400)]:
        ao *= np.clip(1 - np.maximum(ndimage.gaussian_filter(h, r) - h, 0) / k * 0.35, 0.45, 1)
    # lagos: zonas planas, bajas y grandes
    flat = ndimage.uniform_filter(np.hypot(gx, gy), 5) < 0.004
    lab, n = ndimage.label(flat & (h < 1250))
    sizes = ndimage.sum(np.ones_like(h), lab, range(1, n + 1))
    lake = np.isin(lab, 1 + np.nonzero(sizes > (W * H) / 9000)[0])
    lake = ndimage.binary_closing(lake, iterations=2)
    # materiales
    v = fbm(h.shape, seed)
    forest, forest2 = lin('#2c4630'), lin('#3d5a3a')
    meadow, scrub = lin('#66704a'), lin('#6b6a4a')
    rock, rock2, scree = lin('#7d7266'), lin('#5b5248'), lin('#9a8f80')
    snow, glacier = lin('#f3efe6'), lin('#d3e2e6')
    water, water2 = lin('#1d5d7c'), lin('#2f7896')
    col = np.zeros(h.shape + (3,))
    tl = 1560 + 120 * (v - .5)                                 # límite del bosque con borde irregular
    f_forest = smooth(tl + 80, tl - 80, h) * smooth(42, 30, steep)
    f_meadow = smooth(5, 1.5, ndimage.gaussian_filter(steep, 3)) * smooth(1050, 900, h) * .7
    base_rock = rock * (1 - smooth(25, 45, steep))[..., None] + rock2 * smooth(25, 45, steep)[..., None]
    base_rock = base_rock * (1 - smooth(1700, 2000, h) * .3)[..., None] + scree * (smooth(1700, 2000, h) * .3)[..., None]
    fcol = forest * (1 - v)[..., None] + forest2 * v[..., None]
    col = base_rock * (1 - f_forest)[..., None] + fcol * f_forest[..., None]
    col = col * (1 - f_meadow)[..., None] + meadow * f_meadow[..., None]
    f_scrub = (smooth(1250, 1450, h) * smooth(1800, 1600, h) * (1 - f_forest) * .45)[..., None]
    col = col * (1 - f_scrub) + scrub * f_scrub
    # estepa al este: el bosque se corta hacia la meseta (gradiente de humedad oeste → este)
    lonm = np.broadcast_to(np.linspace(box['w'], box['e'], W)[None, :], h.shape)
    dry = (smooth(-71.40, -71.02, lonm + (v - .5) * .08) * smooth(1700, 1300, h))[..., None]
    steppe = lin('#a39064') * (1 - v)[..., None] + lin('#8c7d55') * v[..., None]
    col = col * (1 - dry) + steppe * dry
    # nieve: más baja en las caras al sur (sombra) y más alta al norte; no se pega en lo muy empinado
    line = 1850 + 170 * ny + 110 * (v - .5)
    f_snow = smooth(line - 70, line + 70, h) * smooth(52, 38, steep)
    f_glac = f_snow * smooth(28, 14, steep) * smooth(1900, 2300, h)
    scol = snow * (1 - f_glac)[..., None] + glacier * f_glac[..., None]
    col = col * (1 - f_snow)[..., None] + scol * f_snow[..., None]
    wv = noise(h.shape, 40, seed + 9)[..., None]
    col[lake] = (water * (1 - wv) + water2 * wv)[lake]
    # luz
    sun = lin('#ffd9a8') * 2.05
    sky = lin('#9fc0d8') * 0.62
    dlight = np.where(lake, 0.55, diffuse * shadow)
    skyl = np.where(lake, 0.9, (0.55 + 0.45 * nz) * ao)
    rgb = col * (sun * dlight[..., None] + sky * skyl[..., None])
    rgb = rgb / (1 + rgb * 0.35)                                  # compresión suave de altas luces
    rgb = np.clip(rgb, 0, 1) ** (1 / 2.2)
    rgb = rgb * 0.95 + np.array([0.035, 0.025, 0.012])            # negros levantados, cálido (película)
    return (np.clip(rgb, 0, 1) * 255).astype(np.uint8)

def main():
    meta = {'cerca': {}, 'lejos': {}, 'places': PLACES, 'fuente': 'AWS Terrain Tiles (Terrarium): SRTM, GMTED2010, ETOPO1 y otros', 'sol': {'az': SUN_AZ, 'el': SUN_EL}}
    for key, box, seed in [('cerca', CERCA, 1), ('lejos', LEJOS, 7)]:
        wkm, hkm = size_km(box)
        BW = box['bake']; BH = int(round(BW * hkm / wkm / 16) * 16)
        AW = box['alt']; AH = int(round(AW * hkm / wkm))
        print(key, f'{wkm:.1f} x {hkm:.1f} km, textura {BW}x{BH}, alturas {AW}x{AH}', file=sys.stderr)
        hb = heights(box, BW, BH)
        if key == 'lejos':
            hb = ndimage.gaussian_filter(hb, 1.0)
        img = bake(hb, box, BW, BH, seed)
        Image.fromarray(img).save(os.path.join(OUT, f'terreno-{key}.jpg'), quality=86, optimize=True, progressive=True)
        if key == 'cerca':
            Image.fromarray(img).resize((BW // 2, BH // 2), Image.LANCZOS).save(os.path.join(OUT, 'terreno-cerca-m.jpg'), quality=84, optimize=True, progressive=True)
        ha = heights(box, AW, AH)
        save_alt(ha, os.path.join(OUT, f'terreno-{key}-alt.png'))
        meta[key] = {k: box[k] for k in ('n', 's', 'w', 'e')} | {'km': [round(wkm, 3), round(hkm, 3)], 'alt': [AW, AH], 'tex': [BW, BH], 'min': round(float(ha.min())), 'max': round(float(ha.max()))}
    json.dump(meta, open(os.path.join(OUT, 'terreno.json'), 'w'), ensure_ascii=False, indent=1)
    for f in sorted(os.listdir(OUT)):
        print(f, os.path.getsize(os.path.join(OUT, f)) // 1024, 'KB', file=sys.stderr)

if __name__ == '__main__':
    main()
