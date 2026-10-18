Add-Type -AssemblyName System.Drawing

$baseDir = Split-Path $PSScriptRoot -Parent
$origPath = Join-Path $baseDir "src\assets\pos_luxury_backdrop.jpg"
$orig = [System.Drawing.Bitmap]::FromFile($origPath)

# Downsample to 200x112 for smooth bokeh
$small = New-Object System.Drawing.Bitmap 200, 112
$gSmall = [System.Drawing.Graphics]::FromImage($small)
$gSmall.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBilinear
$gSmall.DrawImage($orig, 0, 0, 200, 112)
$gSmall.Dispose()

# Upsample back with HighQualityBicubic for silky luxury blur
$blurred = New-Object System.Drawing.Bitmap 1920, 1080
$gBlurred = [System.Drawing.Graphics]::FromImage($blurred)
$gBlurred.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
$gBlurred.DrawImage($small, 0, 0, 1920, 1080)
$gBlurred.Dispose()

$destPath = Join-Path $baseDir "src\assets\pos_luxury_backdrop_blurred.jpg"
$blurred.Save($destPath, [System.Drawing.Imaging.ImageFormat]::Jpeg)

# Also copy to public/ so public paths can access it if needed
$publicDest = Join-Path $baseDir "public\pos_luxury_backdrop_blurred.jpg"
Copy-Item -Path $destPath -Destination $publicDest -Force

$orig.Dispose()
$small.Dispose()
$blurred.Dispose()

Write-Host "SUCCESS: Created $destPath and $publicDest"
