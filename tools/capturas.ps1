# Capturas JPEG del rediseño libre: celular (390x844), PC (1280x800) y pantalla ancha (2560x1080).
# Uso: powershell -ExecutionPolicy Bypass -File tools\capturas.ps1 -Carpeta docs\capturas\13-rediseno-libre [-Base http://localhost:8090]
param([Parameter(Mandatory)][string]$Carpeta, [string]$Base = 'http://localhost:8090')
function Save-Cap($u, $w, $h, $n, $sel, $js) {
  $m = "$Base/tools/marco.html?w=$w&h=$h&u=$([Uri]::EscapeDataString($u))"
  if ($sel) { $m += "&sel=$([Uri]::EscapeDataString($sel))" }; if ($js) { $m += "&js=$([Uri]::EscapeDataString($js))" }
  powershell -NoProfile -ExecutionPolicy Bypass -File (Join-Path $PSScriptRoot 'capturar.ps1') -Url $m -Ancho $w -Alto $h -Salida "$Carpeta\$n.jpg" -Espera 16000
}
$ir = { param($f) "var v=document.getElementById('viaje');scrollTo(0,(v.offsetHeight-innerHeight)*$f)" }
foreach ($t in @(@(390, 844), @(1280, 800), @(2560, 1080))) { $w = $t[0]; $h = $t[1]
  Save-Cap '/?nosw=1' $w $h "intro-$w"
  Save-Cap '/?nosw=1' $w $h "ruta-$w" '' (& $ir 0.2)
  Save-Cap '/?nosw=1' $w $h "frey-$w" '' (& $ir 0.9)
}
Save-Cap '/?nosw=1' 390 844 'ficha-390' '' ((& $ir 0.5) + ";setTimeout(function(){document.querySelector('.vparadas [data-parada=\'3\']').click()},2500)")
Save-Cap '/?nosw=1' 1280 800 'parches-1280' '' ((& $ir 0.7) + ";setTimeout(function(){document.getElementById('vparBtn').click()},2500)")
Save-Cap '/?nosw=1&plano' 390 844 'sin-3d-390'
Save-Cap '/?nosw=1#itinerario' 390 844 'itinerario-390'
Save-Cap '/?nosw=1#itinerario' 1280 800 'itinerario-1280'
