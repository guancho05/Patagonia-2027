#!/usr/bin/env python3
"""Genera los datos de la portada 3D (relieve del Tronador al Catedral).

Baja tiles de elevación (AWS Terrain Tiles, formato Terrarium; datos SRTM y otros),
los pasa a una grilla lat/lon y hornea una textura de color con luz, sombras proyectadas,
oclusión ambiente, nieve y glaciar según altura, pendiente y orientación, bosque y lagos.

Salida en data/:
  terreno.json            metadatos (cajas, tamaños, lugares)
  terreno-cerca-alt.png   alturas de la zona de detalle (R*256+G = decímetros)
  terreno-cerca-alt-m.png ídem, mitad de resolución (celular)
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
CERCA = dict(n=-41.00, s=-41.38, w=-71.98, e=-71.18, z=12, bake=5120, alt=1920)   # Copernicus GLO-30 (30 m): Tronador → Bariloche
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

COP = os.path.join(CACHE, 'cop-S42-W072.tif')
COP_URL = 'https://copernicus-dem-30m.s3.amazonaws.com/Copernicus_DSM_COG_10_S42_00_W072_00_DEM/'
def cop(kind='DEM'):
    f = os.path.join(CACHE, f'cop-S42-W072-{kind}.tif')
    if not os.path.exists(f):
        url = COP_URL + ('Copernicus_DSM_COG_10_S42_00_W072_00_DEM.tif' if kind == 'DEM' else 'AUXFILES/Copernicus_DSM_COG_10_S42_00_W072_00_WBM.tif')
        with urllib.request.urlopen(url, timeout=300) as r: open(f, 'wb').write(r.read())
    import tifffile
    return tifffile.imread(f)

def cop_grid(a, box, W, H, order=3):
    # tile S42 W072: esquina noroeste en (-41, -72), 1 segundo de arco, píxel = área
    lons = np.linspace(box['w'], box['e'], W); lats = np.linspace(box['n'], box['s'], H)
    PX, PY = np.meshgrid((lons + 72) * 3600 - 0.5, (-41 - lats) * 3600 - 0.5)
    return ndimage.map_coordinates(a.astype(np.float64), [PY, PX], order=order, mode='nearest')

def size_km(box):
    lat = math.radians((box['n'] + box['s']) / 2)
    return (box['e'] - box['w']) * 111.32 * math.cos(lat), (box['n'] - box['s']) * 110.57

def save_alt(h, path, scale=10):
    dm = np.clip(np.round(h * scale), 0, 65535).astype(np.uint32)
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

def bake(h, box, W, H, seed, water=None, parts=False, hd=None, cover=None, glac=None):
    wkm, hkm = size_km(box)
    dx, dy = wkm * 1000 / (W - 1), hkm * 1000 / (H - 1)
    hn = h if hd is None else h + hd        # hd: microrrelieve solo para las normales
    gy, gx = np.gradient(hn, dy, dx)          # gy: hacia el sur (filas)
    gn = -gy                                  # pendiente hacia el norte
    nx, ny, nz = -gx, -gn, np.ones_like(h)
    L = np.sqrt(nx * nx + ny * ny + nz * nz); nx, ny, nz = nx / L, ny / L, nz / L
    steep = np.degrees(np.arccos(nz))
    az, el = math.radians(SUN_AZ), math.radians(SUN_EL)
    sx, sy, sz = math.sin(az) * math.cos(el), math.cos(az) * math.cos(el), math.sin(el)
    diffuse = np.clip(nx * sx + ny * sy + nz * sz, 0, 1)
    # sombras proyectadas: marcha del rayo hacia el sol
    # sombras y oclusión a resolución reducida (son suaves) y después se amplían
    f = 2 if W > 2500 else 1
    hs = h[::f, ::f]; Hs, Ws = hs.shape
    shadow = np.ones_like(hs)
    step_px = 1.5
    ddx, ddy = math.sin(az) * step_px, -math.cos(az) * step_px   # en píxeles (filas hacia el sur)
    rise = math.tan(el) * step_px * dx * f
    yy, xx = np.mgrid[0:Hs, 0:Ws].astype(np.float64)
    for k in range(1, 300):
        sh = ndimage.map_coordinates(hs, [yy + ddy * k, xx + ddx * k], order=1, mode='nearest')
        shadow = np.minimum(shadow, np.clip(1 - (sh - (hs + rise * k)) / 25, 0, 1))
    shadow = ndimage.gaussian_filter(shadow, 0.8)
    ao = np.ones_like(hs)
    for r, k in [(3, 60), (10, 160), (30, 400)]:
        ao *= np.clip(1 - np.maximum(ndimage.gaussian_filter(hs, r * 2 // (f + 1) + 1) - hs, 0) / k * 0.35, 0.45, 1)
    if f > 1:
        shadow = np.clip(ndimage.zoom(shadow, (H / Hs, W / Ws), order=1), 0, 1)[:H, :W]
        ao = np.clip(ndimage.zoom(ao, (H / Hs, W / Ws), order=1), 0, 1)[:H, :W]
    # lagos: zonas planas, bajas y grandes
    flat = ndimage.uniform_filter(np.hypot(gx, gy), 5) < 0.004
    lab, n = ndimage.label(flat & (h < 1250))
    sizes = ndimage.sum(np.ones_like(h), lab, range(1, n + 1))
    lake = np.isin(lab, 1 + np.nonzero(sizes > (W * H) / 9000)[0])
    lake = ndimage.binary_closing(lake, iterations=2)
    if water is not None:
        lake = water
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
    # cobertura real (ESA WorldCover 10 m): bosque, arbustal, pastizal, suelo desnudo/roca, urbano, musgo
    if cover is not None:
        m = lambda *c: ndimage.gaussian_filter(np.isin(cover, c).astype(float), 1.0)
        tree, shrub, grass, bare, built, moss = m(10), m(20), m(30, 40), m(60), m(50), m(100)
        grassc = lin('#7a7a4b') * (1 - dry) + steppe * dry
        ccol = (fcol * tree[..., None] + lin('#56603c') * shrub[..., None] + grassc * grass[..., None] + base_rock * bare[..., None]
                + lin('#8a8178') * built[..., None] + lin('#6f7550') * moss[..., None])
        tot = (tree + shrub + grass + bare + built + moss)[..., None]
        col = col * (1 - np.clip(tot, 0, 1)) + ccol / np.maximum(tot, 1e-6) * np.clip(tot, 0, 1)
    # nieve: más baja en las caras al sur (sombra) y más alta al norte; no se pega en lo muy empinado
    # la línea de nieve sube hacia el este (menos precipitación): glaciares en el Tronador, manchones en el Catedral
    line = 1850 + 170 * ny + 110 * (v - .5) + 330 * smooth(-71.80, -71.45, lonm)
    f_snow = smooth(line - 70, line + 70, h) * smooth(52, 38, steep)
    if cover is not None:   # nieve y hielo reales (WorldCover) + glaciares de OSM; el modelo solo suma manchones altos
        f_snow = np.maximum(np.maximum(f_snow * 0.5 * smooth(2000, 2300, h), ndimage.gaussian_filter((cover == 70).astype(float), 1.0)), 0 if glac is None else glac)
    f_glac = f_snow * smooth(28, 14, steep) * smooth(1900, 2300, h)
    scol = snow * (1 - f_glac)[..., None] + glacier * f_glac[..., None]
    col = col * (1 - f_snow)[..., None] + scol * f_snow[..., None]
    wv = noise(h.shape, 40, seed + 9)[..., None]
    col[lake] = (water * (1 - wv) + water2 * wv)[lake]
    if parts:
        return col, (nx, ny, nz), shadow, ao, lake
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

def raster_polys(geoms, box, W, H):
    """Rasteriza polígonos GeoJSON (lon/lat) a la grilla de la caja; los anillos interiores (islas) se vacían."""
    from PIL import ImageDraw
    im = Image.new('L', (W, H), 0); d = ImageDraw.Draw(im)
    px = lambda c: ((c[0] - box['w']) / (box['e'] - box['w']) * (W - 1), (box['n'] - c[1]) / (box['n'] - box['s']) * (H - 1))
    for g in geoms:
        polys = [g['coordinates']] if g['type'] == 'Polygon' else g['coordinates']
        for poly in polys:
            d.polygon([px(c) for c in poly[0]], fill=255)
            for hole in poly[1:]: d.polygon([px(c) for c in hole], fill=0)
    return np.asarray(im, dtype=np.float64) / 255

def worldcover(box, W, H):
    import rasterio
    from rasterio.enums import Resampling
    from rasterio.windows import from_bounds
    f = os.path.join(CACHE, 'wc-S42W072.tif')
    if not os.path.exists(f):
        urllib.request.urlretrieve('https://esa-worldcover.s3.eu-central-1.amazonaws.com/v200/2021/map/ESA_WorldCover_10m_2021_v200_S42W072_Map.tif', f)
    with rasterio.open(f) as ds:
        win = from_bounds(box['w'], box['s'], box['e'], box['n'], ds.transform)
        return ds.read(1, window=win, out_shape=(H, W), resampling=Resampling.mode)

def lake_labels(lakes):
    """Punto de etiqueta de cada lago: el lugar del agua más lejos de la costa (no el centroide)."""
    out = []
    for l in lakes:
        polys = [l['geom']['coordinates']] if l['geom']['type'] == 'Polygon' else l['geom']['coordinates']
        xs = [c[0] for p in polys for c in p[0]]; ys = [c[1] for p in polys for c in p[0]]
        b = {'w': min(xs), 'e': max(xs), 'n': max(ys), 's': min(ys)}
        W = 400; H = max(20, int(W * (b['n'] - b['s']) / max(1e-6, (b['e'] - b['w']) * 0.75)))
        m = raster_polys([l['geom']], b, W, H) > .5
        if not m.any(): continue
        dt = ndimage.distance_transform_edt(m); j, i = np.unravel_index(np.argmax(dt), dt.shape)
        out.append({'name': l['name'], 'lat': round(b['n'] - j / (H - 1) * (b['n'] - b['s']), 5), 'lon': round(b['w'] + i / (W - 1) * (b['e'] - b['w']), 5)})
    return out

def trail_profile(t, dem):
    """Sendero de OSM, remuestreado cada ~25 m, con distancia y desnivel medidos sobre Copernicus GLO-30."""
    pts = np.array(t['pts'])
    seg = [0.0]
    for a, b in zip(pts[:-1], pts[1:]):
        seg.append(seg[-1] + math.hypot((b[1] - a[1]) * 111320 * math.cos(math.radians(a[0])), (b[0] - a[0]) * 110570))
    seg = np.array(seg); L = seg[-1]; n = int(L // 25) + 2
    d = np.linspace(0, L, n); lat = np.interp(d, seg, pts[:, 0]); lon = np.interp(d, seg, pts[:, 1])
    PX, PY = (lon + 72) * 3600 - 0.5, (-41 - lat) * 3600 - 0.5
    z = ndimage.map_coordinates(dem.astype(np.float64), [PY, PX], order=1)
    zs = ndimage.gaussian_filter1d(z, 2)
    gain = float(np.clip(np.diff(zs), 0, None).sum()); loss = float(np.clip(-np.diff(zs), 0, None).sum())
    return {'name': t['name'], 'km': round(L / 1000, 2), 'subida_m': round(gain), 'bajada_m': round(loss), 'alt_ini': round(float(z[0])), 'alt_fin': round(float(z[-1])),
            'pts': [[round(a, 5), round(b, 5)] for a, b in zip(lat, lon)]}

def jpg(arr, path, q, sub=2):
    Image.fromarray(arr).save(path, quality=q, optimize=True, progressive=True, subsampling=sub)

def main():
    meta = {'cerca': {}, 'lejos': {}, 'places': PLACES, 'sol': {'az': SUN_AZ, 'el': SUN_EL},
            'fuente': {'cerca': 'Copernicus DEM GLO-30 (ESA / Airbus)', 'lejos': 'AWS Terrain Tiles (Terrarium): SRTM, GMTED2010 y otros'}}
    # --- anillo exterior: color con luz horneada, liviano (igual que antes) ---
    box = LEJOS; wkm, hkm = size_km(box)
    BW = box['bake']; BH = int(round(BW * hkm / wkm / 16) * 16); AW = box['alt']; AH = int(round(AW * hkm / wkm))
    hb = ndimage.gaussian_filter(heights(box, BW, BH), 1.0)
    jpg(bake(hb, box, BW, BH, 7), os.path.join(OUT, 'terreno-lejos.jpg'), 84)
    ha = heights(box, AW, AH); save_alt(ha, os.path.join(OUT, 'terreno-lejos-alt.png'))
    meta['lejos'] = {k: box[k] for k in ('n', 's', 'w', 'e')} | {'km': [round(wkm, 3), round(hkm, 3)], 'alt': [AW, AH]}
    print('lejos listo', file=sys.stderr)
    # --- zona de detalle: Copernicus GLO-30, albedo + normales de alta resolución ---
    box = CERCA; wkm, hkm = size_km(box)
    dem, wbm = cop('DEM'), cop('WBM')
    BW = box['bake']; BH = int(round(BW * hkm / wkm / 16) * 16)
    print('cerca', f'{wkm:.1f} x {hkm:.1f} km, textura {BW}x{BH}', file=sys.stderr)
    hb = cop_grid(dem, box, BW, BH)
    osm = json.load(open(os.path.join(OUT, 'osm-fuente.json')))
    lakes_r = raster_polys([l['geom'] for l in osm['lagos']], box, BW, BH)
    rivers = cop_grid(wbm, box, BW, BH, order=0) == 3                      # ríos: máscara de agua de Copernicus
    wc = worldcover(box, BW, BH)
    water = ndimage.gaussian_filter(np.maximum(lakes_r, (rivers | (wc == 80)).astype(float)), 1.0) > 0.5
    glac = ndimage.gaussian_filter(raster_polys([g['geom'] for g in osm['glaciares']], box, BW, BH), 1.5)
    agua = Image.fromarray((ndimage.gaussian_filter(water.astype(float), 1.0) * 255).astype(np.uint8)).resize((2048, int(2048 * BH / BW)), Image.LANCZOS)
    agua.save(os.path.join(OUT, 'terreno-cerca-agua.png'), optimize=True)
    # microrrelieve sintético (solo normales): marca filos y canaletas por debajo de los 30 m del DEM
    rng = np.random.default_rng(3)
    det = sum(ndimage.zoom(rng.standard_normal((BH // s + 2, BW // s + 2)), s, order=3)[:BH, :BW] * a for s, a in [(4, 1.0), (12, 1.8)])
    gy0, gx0 = np.gradient(hb, hkm * 1000 / BH, wkm * 1000 / BW)
    steep0 = np.degrees(np.arctan(np.hypot(gx0, gy0)))
    amp = 1.2 + 4.0 * smooth(15, 40, steep0)            # más textura en la roca empinada
    hd = np.where(water, 0, det * amp)
    col, (nx, ny, nz), shadow, ao, lake = bake(hb, box, BW, BH, 1, water=water, parts=True, hd=hd, cover=wc, glac=glac)
    alb = np.clip(col * (ao ** 0.6)[..., None], 0, 1) ** (1 / 2.2)
    alb = (alb * 255).astype(np.uint8)
    nrm = np.stack([nx * .5 + .5, ny * .5 + .5, np.where(lake, 1.0, shadow)], -1)
    nrm = (np.clip(nrm, 0, 1) * 255).astype(np.uint8)
    for lv, fac, qa, qn in [('', 1, 82, 74), ('-2048', 2.5, 82, 72), ('-1024', 5, 80, 80)]:
        A = Image.fromarray(alb); N = Image.fromarray(nrm)
        if fac > 1:
            sz = (int(BW / fac), int(BH / fac)); A = A.resize(sz, Image.LANCZOS); N = N.resize(sz, Image.LANCZOS)
        A.save(os.path.join(OUT, f'terreno-cerca-color{lv}.jpg'), quality=qa, optimize=True, progressive=True)
        N.save(os.path.join(OUT, f'terreno-cerca-normal{lv}.jpg'), quality=qn, optimize=True, progressive=True, subsampling=0)
    AW = box['alt']; AH = int(round(AW * hkm / wkm))
    alts = []
    for w in (AW, AW // 2, AW // 4):
        h = int(round(w * hkm / wkm)); ha = cop_grid(dem, box, w, h)
        save_alt(ha, os.path.join(OUT, f'terreno-cerca-alt-{w}.png'), scale=1); alts.append([w, h])
    meta['cerca'] = {k: box[k] for k in ('n', 's', 'w', 'e')} | {'km': [round(wkm, 3), round(hkm, 3)], 'alts': alts, 'tex': [BW, BH], 'altScale': 1}
    meta['places']['bariloche'] = {'lat': osm['lugares']['bariloche']['lat'], 'lon': osm['lugares']['bariloche']['lon'], 'label': 'San Carlos de Bariloche'}
    meta['lagos'] = lake_labels(osm['lagos'])
    meta['senderos'] = [trail_profile(t, dem) for t in osm['senderos']]
    meta['fuente'].update({'cobertura': 'ESA WorldCover 10 m 2021 v200 (CC BY 4.0)', 'osm': 'OpenStreetMap (ODbL): lagos, glaciares, senderos, lugares'})
    json.dump(meta, open(os.path.join(OUT, 'terreno.json'), 'w'), ensure_ascii=False, indent=1)
    for f in sorted(os.listdir(OUT)):
        print(f, os.path.getsize(os.path.join(OUT, f)) // 1024, 'KB', file=sys.stderr)

if __name__ == '__main__':
    main()
