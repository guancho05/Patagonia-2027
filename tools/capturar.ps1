# Captura una URL con Chrome o Edge sin ventana y la guarda en JPEG (nunca PNG en el repo).
# Uso: powershell -ExecutionPolicy Bypass -File tools\capturar.ps1 -Url http://localhost:8080/ -Ancho 390 -Alto 844 -Salida docs\capturas\x\portada-390.jpg
#      [-Espera 9000] milisegundos de tiempo virtual para que cargue el 3D · [-Oscuro] tema oscuro · [-Recorte "x,y,ancho,alto"] en píxeles
param([Parameter(Mandatory)][string]$Url, [int]$Ancho = 1280, [int]$Alto = 800, [Parameter(Mandatory)][string]$Salida, [int]$Espera = 9000, [switch]$Oscuro, [string]$Recorte = '', [int]$Calidad = 84)
Add-Type -AssemblyName System.Drawing
$nav = @("$env:ProgramFiles\Google\Chrome\Application\chrome.exe", "${env:ProgramFiles(x86)}\Microsoft\Edge\Application\msedge.exe", "$env:ProgramFiles\Microsoft\Edge\Application\msedge.exe") | Where-Object { Test-Path $_ } | Select-Object -First 1
if (-not $nav) { throw 'No encontré Chrome ni Edge.' }
$tmp = Join-Path $env:TEMP ("cap-" + [guid]::NewGuid().ToString('N') + ".png")
$perfil = Join-Path $env:TEMP ("cap-perfil-" + [guid]::NewGuid().ToString('N'))
$args = @('--headless=new', '--disable-gpu-sandbox', '--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--hide-scrollbars', '--no-first-run', '--no-default-browser-check',
  "--user-data-dir=$perfil", "--window-size=$Ancho,$Alto", "--virtual-time-budget=$Espera", "--screenshot=$tmp")
if ($Oscuro) { $args += '--force-dark-mode'; $args += '--enable-features=WebContentsForceDark:inversion_method/cielab_based' }
$args += $Url
$p = Start-Process -FilePath $nav -ArgumentList $args -PassThru -WindowStyle Hidden
if (-not $p.WaitForExit(90000)) { $p.Kill() }
if (-not (Test-Path $tmp)) { throw "No se generó la captura de $Url" }
$img = [Drawing.Image]::FromFile($tmp)
$bmp = $img
if ($Recorte) { $r = $Recorte.Split(',') | ForEach-Object { [int]$_ }; $bmp = (New-Object Drawing.Bitmap $img).Clone((New-Object Drawing.Rectangle $r[0], $r[1], $r[2], $r[3]), $img.PixelFormat) }
$dir = Split-Path -Parent $Salida; if ($dir -and -not (Test-Path $dir)) { New-Item -ItemType Directory -Force $dir | Out-Null }
$codec = [Drawing.Imaging.ImageCodecInfo]::GetImageEncoders() | Where-Object { $_.MimeType -eq 'image/jpeg' }
$ep = New-Object Drawing.Imaging.EncoderParameters 1
$ep.Param[0] = New-Object Drawing.Imaging.EncoderParameter ([Drawing.Imaging.Encoder]::Quality), ([long]$Calidad)
$bmp.Save((Join-Path (Get-Location) $Salida), $codec, $ep)
if ($bmp -ne $img) { $bmp.Dispose() }; $img.Dispose()
Remove-Item $tmp -Force -ErrorAction SilentlyContinue; Remove-Item $perfil -Recurse -Force -ErrorAction SilentlyContinue
"$Salida  $([Math]::Round((Get-Item $Salida).Length/1024)) KB"
