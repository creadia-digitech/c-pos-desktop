Add-Type -AssemblyName System.Drawing

$baseDir = Split-Path $PSScriptRoot -Parent
$pngPath = Join-Path $baseDir "public\logo.png"
$bmp = [System.Drawing.Bitmap]::FromFile($pngPath)

# Create a clean square 256x256 image
$square = New-Object System.Drawing.Bitmap 256, 256
$g = [System.Drawing.Graphics]::FromImage($square)
$g.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
$g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::HighQuality
$g.DrawImage($bmp, 0, 0, 256, 256)
$g.Dispose()

$icoPath = Join-Path $baseDir "public\logo.ico"
$iconHandle = $square.GetHicon()
$icon = [System.Drawing.Icon]::FromHandle($iconHandle)
$stream = [System.IO.File]::OpenWrite($icoPath)
$icon.Save($stream)
$stream.Close()
$icon.Dispose()
$square.Dispose()
$bmp.Dispose()

Write-Host "Created ICO: $icoPath"
