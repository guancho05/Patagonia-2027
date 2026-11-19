# Saca el juego de capturas JPEG de la web en celular (390x844), PC (1280x800) y pantalla ancha (2560x1080).
# Uso: powershell -ExecutionPolicy Bypass -File tools\capturas.ps1 -Carpeta docs\capturas\12-pulido-19-11 [-Base http://localhost:8080]
param([Parameter(Mandatory)][string]$Carpeta, [string]$Base = 'http://localhost:8080', [string[]]$Solo = @())
function Save-Cap($u, $w, $h, $n, $sel, $js) {
  if ($Solo.Count -and ($Solo -notcontains $n)) { return }
  $m = "$Base/tools/marco.html?w=$w&h=$h&u=$([Uri]::EscapeDataString($u))"
  if ($sel) { $m += "&sel=$([Uri]::EscapeDataString($sel))" }; if ($js) { $m += "&js=$([Uri]::EscapeDataString($js))" }
  powershell -NoProfile -ExecutionPolicy Bypass -File (Join-Path $PSScriptRoot 'capturar.ps1') -Url $m -Ancho $w -Alto $h -Salida "$Carpeta\$n.jpg" -Espera 12000
}
Save-Cap '/?nosw=1' 390 844 'portada-390'
Save-Cap '/?nosw=1' 390 844 'resumen-390' '#portada'
Save-Cap '/?nosw=1#itinerario' 390 844 'itinerario-390'
Save-Cap '/?nosw=1#itinerario' 390 844 'dia-390' '#panel' 'select(9,false)'
Save-Cap '/?nosw=1#mapa' 390 844 'mapa-390'
Save-Cap '/?nosw=1#casas' 390 844 'casas-390'
Save-Cap '/?nosw=1#gastos' 390 844 'gastos-390'
Save-Cap '/?nosw=1' 1280 800 'portada-1280'
Save-Cap '/?nosw=1#itinerario' 1280 800 'itinerario-1280' '' 'select(9,false)'
Save-Cap '/?nosw=1#mapa' 1280 800 'mapa-1280'
Save-Cap '/?nosw=1#casas' 1280 800 'casas-1280'
Save-Cap '/?nosw=1#gastos' 1280 800 'gastos-1280'
Save-Cap '/?nosw=1' 2560 1080 'portada-2560'
Save-Cap '/?nosw=1#mapa' 2560 1080 'mapa-2560'
Save-Cap '/noexiste' 390 844 '404-390'
