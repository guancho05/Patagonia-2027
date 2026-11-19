# Revisa los links externos de la web (index.html, js/datos.js, js/app.js) y escribe docs/links.md con el resultado.
# Uso: powershell -ExecutionPolicy Bypass -File tools\links.ps1
# Nota: Booking, Airbnb y otros sitios bloquean a los robots (403/429/503): eso no significa que el link esté roto;
# esos van como "revisar a mano". Solo se marca "ROTO" un 404/410 o un dominio que no responde.
[Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12
$raiz = (Resolve-Path (Join-Path $PSScriptRoot '..')).Path
$utf8 = New-Object Text.UTF8Encoding($false)
$texto = ('index.html', 'js\datos.js', 'js\app.js', '404.html' | ForEach-Object { [IO.File]::ReadAllText((Join-Path $raiz $_), $utf8) }) -join "`n"
$urls = [regex]::Matches($texto, 'https?://[^\s"''<>`\\)]+') | ForEach-Object { $_.Value.Replace('&amp;', '&').TrimEnd('.', ',', ';') } |
  Where-Object { $_ -notmatch 'res\.cloudinary\.com|images\.unsplash\.com|fonts\.g|w3\.org|\$\{|patagonia-2027-eosin|a0\.muscache|cf\.bstatic' -and $_ -notmatch '/(embed|dir/|search/)\?' -and $_ -notmatch '/rooms/$|maps/embed' } | Sort-Object -Unique
# muestras de los CDN de fotos y de los links que se arman en el código
$urls += 'https://images.unsplash.com/photo-1577931751802-068d861ba420?w=480&q=70&auto=format&fit=crop', 'https://res.cloudinary.com/wdfk5jij/image/upload/f_auto,q_auto,w_640/589cc667ba',
  'https://www.airbnb.com.ar/rooms/1164114111945418693', 'https://www.airbnb.com.ar/rooms/1669610997051783169', 'https://www.google.com/maps/dir/?api=1&origin=Villa%20La%20Angostura&destination=Villa%20Catedral&travelmode=driving',
  'https://www.google.com/maps/embed?origin=mfe&pb=!1m6!4m4!4m1!2sVilla+La+Angostura,+Argentina!4m1!2sVilla+Catedral,+San+Carlos+de+Bariloche!5e0!3m1!1ses!5m1!1ses'
$ua = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36'
$filas = foreach ($u in $urls) {
  $cod = 0; $nota = ''
  try {
    $q = [Net.HttpWebRequest]::Create($u); $q.UserAgent = $ua; $q.Timeout = 20000; $q.AllowAutoRedirect = $true; $q.Accept = 'text/html,*/*'; $q.Headers.Add('Accept-Language', 'es-AR,es;q=0.9')
    $r = $q.GetResponse(); $cod = [int]$r.StatusCode; if ($r.ResponseUri.Host -ne ([Uri]$u).Host) { $nota = 'redirige a ' + $r.ResponseUri.Host }; $r.Close()
  } catch [Net.WebException] { if ($_.Exception.Response) { $cod = [int]$_.Exception.Response.StatusCode } else { $nota = $_.Exception.Status.ToString() } } catch { $nota = 'error' }
  $estado = if ($cod -ge 200 -and $cod -lt 400) { 'OK' } elseif ($cod -in 404, 410) { 'ROTO' } elseif ($cod -in 401, 403, 405, 429, 503, 999) { 'revisar a mano (bloquea robots)' } elseif ($cod -eq 0) { "sin respuesta ($nota)" } else { 'revisar a mano' }
  $corto = if ($u.Length -gt 110) { $u.Substring(0, 107) + '...' } else { $u }
  [pscustomobject]@{ Estado = $estado; Codigo = $cod; Url = $corto; Nota = $nota }
  Write-Host "$estado $cod $corto"
}
$md = @("# Links externos revisados", "", "Generado por ``tools/links.ps1`` el $(Get-Date -Format 'dd/MM/yyyy HH:mm'). $($filas.Count) links.", "", "| Estado | Código | Link | Nota |", "|---|---|---|---|")
$md += $filas | Sort-Object Estado, Url | ForEach-Object { "| $($_.Estado) | $($_.Codigo) | $($_.Url.Replace('|','%7C')) | $($_.Nota) |" }
[IO.File]::WriteAllLines((Join-Path $raiz 'docs\links.md'), $md, $utf8)
