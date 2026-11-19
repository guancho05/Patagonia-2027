# Mide la carga de la web con Chrome sin ventana usando tools/medir.html (LCP, CLS, tareas largas, peso, errores).
# Uso: powershell -ExecutionPolicy Bypass -File tools\medir.ps1 [-Base http://localhost:8080] [-Ruta "/?nosw=1"] [-Ancho 390] [-Alto 844]
# No reemplaza a Lighthouse: no limita la red ni el procesador. Sirve para comparar antes y después en la misma máquina.
param([string]$Base = 'http://localhost:8080', [string]$Ruta = '/?nosw=1', [int]$Ancho = 390, [int]$Alto = 844, [string]$Medidor = '')
$chrome = @("$env:ProgramFiles\Google\Chrome\Application\chrome.exe", "${env:ProgramFiles(x86)}\Microsoft\Edge\Application\msedge.exe") | Where-Object { Test-Path $_ } | Select-Object -First 1
if (-not $Medidor) { $Medidor = "$Base/tools/medir.html" }
$perfil = Join-Path $env:TEMP ("med-" + [guid]::NewGuid().ToString('N')); $out = Join-Path $env:TEMP ("med-" + [guid]::NewGuid().ToString('N') + ".txt")
$url = "$Medidor`?u=$([Uri]::EscapeDataString($Ruta))&w=$Ancho&h=$Alto"
Start-Process $chrome -ArgumentList @('--headless=new', '--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--no-first-run', "--user-data-dir=$perfil",
  "--window-size=$($Ancho + 20),$($Alto + 60)", '--virtual-time-budget=16000', '--dump-dom', $url) -RedirectStandardOutput $out -WindowStyle Hidden | Out-Null
$t = ''
for ($i = 0; $i -lt 90; $i++) { Start-Sleep -Milliseconds 1000; try { $t = [IO.File]::ReadAllText($out) } catch { $t = '' }; if ($t -match '</html>') { break } }
Start-Sleep -Milliseconds 800
Remove-Item $out -Force -ErrorAction SilentlyContinue; Remove-Item $perfil -Recurse -Force -ErrorAction SilentlyContinue
[regex]::Match($t, '<pre id="r">(.*?)</pre>').Groups[1].Value.Replace('&quot;', '"')
