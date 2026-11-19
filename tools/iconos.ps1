# Genera los íconos PNG de la web (mismo dibujo que img/icono.svg) con System.Drawing, sin dependencias.
# Uso: powershell -ExecutionPolicy Bypass -File tools\iconos.ps1
Add-Type -AssemblyName System.Drawing
$dir = Join-Path (Resolve-Path (Join-Path $PSScriptRoot '..')).Path 'img'
function New-Icono([int]$t, [bool]$maskable, [string]$nombre) {
  $bmp = New-Object Drawing.Bitmap $t, $t
  $g = [Drawing.Graphics]::FromImage($bmp)
  $g.SmoothingMode = 'AntiAlias'; $g.TextRenderingHint = 'AntiAliasGridFit'
  $k = $t / 512.0
  # maskable: fondo a sangre y dibujo dentro de la zona segura (80 %)
  if ($maskable) { $g.Clear([Drawing.ColorTranslator]::FromHtml('#131A22')); $g.TranslateTransform($t * 0.1, $t * 0.1); $k *= 0.8 }
  else {
    $g.Clear([Drawing.Color]::Transparent)
    $r = 96 * $k; $d = 2 * $r; $p = New-Object Drawing.Drawing2D.GraphicsPath
    $p.AddArc(0, 0, $d, $d, 180, 90); $p.AddArc($t - $d, 0, $d, $d, 270, 90); $p.AddArc($t - $d, $t - $d, $d, $d, 0, 90); $p.AddArc(0, $t - $d, $d, $d, 90, 90); $p.CloseFigure()
    $g.FillPath((New-Object Drawing.SolidBrush ([Drawing.ColorTranslator]::FromHtml('#131A22'))), $p)
  }
  $nieve = [Drawing.ColorTranslator]::FromHtml('#F2F6F9'); $polar = [Drawing.ColorTranslator]::FromHtml('#9D2F23'); $pasto = [Drawing.ColorTranslator]::FromHtml('#D8B273')
  # marco
  $pen = New-Object Drawing.Pen $nieve, (10 * $k)
  $m = New-Object Drawing.Drawing2D.GraphicsPath; $r = 64 * $k; $d = 2 * $r; $x = 40 * $k; $w = 432 * $k
  $m.AddArc($x, $x, $d, $d, 180, 90); $m.AddArc($x + $w - $d, $x, $d, $d, 270, 90); $m.AddArc($x + $w - $d, $x + $w - $d, $d, $d, 0, 90); $m.AddArc($x, $x + $w - $d, $d, $d, 90, 90); $m.CloseFigure()
  $g.DrawPath($pen, $m)
  # sendero punteado
  $s = New-Object Drawing.Pen $polar, (20 * $k); $s.StartCap = 'Round'; $s.EndCap = 'Round'; $s.DashCap = 'Round'; $s.DashPattern = @(0.1, 1.9)
  $pts = @(104,372, 156,364, 182,320, 224,302, 266,284, 310,308, 346,268, 382,228, 390,194, 408,176)
  $pf = for ($i = 0; $i -lt $pts.Count; $i += 3 * 2 - 4) { New-Object Drawing.PointF ($pts[$i] * $k), ($pts[$i + 1] * $k) }
  $g.DrawCurve($s, [Drawing.PointF[]]$pf, 0.5)
  foreach ($c in @(@(104, 372, $polar), @(408, 176, $pasto))) {
    $rr = 22 * $k; $g.FillEllipse((New-Object Drawing.SolidBrush $c[2]), $c[0] * $k - $rr, $c[1] * $k - $rr, 2 * $rr, 2 * $rr)
    $g.DrawEllipse((New-Object Drawing.Pen $nieve, (8 * $k)), $c[0] * $k - $rr, $c[1] * $k - $rr, 2 * $rr, 2 * $rr)
  }
  $f = New-Object Drawing.Font 'Georgia', (150 * $k), ([Drawing.FontStyle]::Bold), ([Drawing.GraphicsUnit]::Pixel)
  $sf = New-Object Drawing.StringFormat; $sf.Alignment = 'Center'
  $g.DrawString('27', $f, (New-Object Drawing.SolidBrush $nieve), (256 * $k), (62 * $k), $sf)
  $g.Dispose(); $bmp.Save((Join-Path $dir $nombre), [Drawing.Imaging.ImageFormat]::Png); $bmp.Dispose()
}
New-Icono 192 $false 'icono-192.png'
New-Icono 512 $false 'icono-512.png'
New-Icono 512 $true  'icono-512-m.png'
New-Icono 180 $true  'icono-180.png'
Get-ChildItem $dir | Select-Object Name, Length
