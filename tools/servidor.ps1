# Servidor estático local para probar la web sin Node ni Python (Windows PowerShell 5.1).
# Uso: powershell -ExecutionPolicy Bypass -File tools\servidor.ps1 [puerto]
# Sirve la carpeta del repo en http://localhost:<puerto>/ (por defecto 8080). Las rutas que no existen devuelven 404.html.
param([int]$Puerto = 8080)
$raiz = (Resolve-Path (Join-Path $PSScriptRoot '..')).Path
$tipos = @{
  '.html'='text/html; charset=utf-8'; '.css'='text/css; charset=utf-8'; '.js'='text/javascript; charset=utf-8'; '.mjs'='text/javascript; charset=utf-8'
  '.json'='application/json; charset=utf-8'; '.webmanifest'='application/manifest+json; charset=utf-8'; '.svg'='image/svg+xml'
  '.png'='image/png'; '.jpg'='image/jpeg'; '.jpeg'='image/jpeg'; '.webp'='image/webp'; '.ico'='image/x-icon'
  '.txt'='text/plain; charset=utf-8'; '.md'='text/plain; charset=utf-8'; '.woff2'='font/woff2'
}
$l = New-Object System.Net.HttpListener
$l.Prefixes.Add("http://localhost:$Puerto/")
$l.Start()
Write-Host "Sirviendo $raiz en http://localhost:$Puerto/"
try {
  while ($l.IsListening) {
    $c = $l.GetContext()
    $res = $c.Response
    try {
      $ruta = [Uri]::UnescapeDataString($c.Request.Url.AbsolutePath).TrimStart('/')
      # Solo para las herramientas de tools/ (por ejemplo territorio.html): PUT /__guardar/data/<archivo> escribe ese archivo en data/.
      if ($c.Request.HttpMethod -eq 'PUT' -and $ruta -match '^__guardar/(data/[\w.-]+)$') {
        $dest = Join-Path $raiz $Matches[1]; $ms = New-Object IO.MemoryStream; $c.Request.InputStream.CopyTo($ms)
        [IO.File]::WriteAllBytes($dest, $ms.ToArray()); $b = [Text.Encoding]::UTF8.GetBytes("ok $($ms.Length)")
        $res.StatusCode = 200; $res.ContentType = 'text/plain'; $res.ContentLength64 = $b.Length; $res.OutputStream.Write($b, 0, $b.Length); continue
      }
      if ($ruta -eq '' -or $ruta.EndsWith('/')) { $ruta += 'index.html' }
      $archivo = [IO.Path]::GetFullPath((Join-Path $raiz $ruta))
      $estado = 200
      if (-not $archivo.StartsWith($raiz) -or -not (Test-Path $archivo -PathType Leaf)) {
        $estado = 404; $archivo = Join-Path $raiz '404.html'
      }
      if (Test-Path $archivo -PathType Leaf) {
        $bytes = [IO.File]::ReadAllBytes($archivo)
        $ext = [IO.Path]::GetExtension($archivo).ToLower()
        $res.ContentType = if ($tipos.ContainsKey($ext)) { $tipos[$ext] } else { 'application/octet-stream' }
      } else {
        $bytes = [Text.Encoding]::UTF8.GetBytes('404'); $res.ContentType = 'text/plain'
      }
      $res.StatusCode = $estado
      $res.Headers['Cache-Control'] = 'no-cache'
      $res.ContentLength64 = $bytes.Length
      if ($c.Request.HttpMethod -ne 'HEAD') { $res.OutputStream.Write($bytes, 0, $bytes.Length) }
    } catch { try { $res.StatusCode = 500 } catch {} }
    finally { try { $res.Close() } catch {} }
  }
} finally { $l.Stop() }
