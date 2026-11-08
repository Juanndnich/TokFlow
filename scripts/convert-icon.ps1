Add-Type -AssemblyName System.Drawing

$srcPath = "C:\Users\Juu\.gemini\antigravity\brain\d8334594-ec64-4a96-8fbe-5ba4d9ac03d7\.user_uploaded\media_1794143009485_7b8c3788.jpg"
$destDir = "$PSScriptRoot\..\resources"

if (-not (Test-Path $srcPath)) {
    Write-Error "Source image not found: $srcPath"
    exit 1
}

Copy-Item $srcPath "$destDir\icon-source.jpg" -Force

$srcBmp = [System.Drawing.Bitmap]::FromFile($srcPath)

function Resize-Image($src, $w, $h) {
    $dest = New-Object System.Drawing.Bitmap $w, $h
    $g = [System.Drawing.Graphics]::FromImage($dest)
    $g.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
    $g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::HighQuality
    $g.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality
    $g.Clear([System.Drawing.Color]::Transparent)
    $g.DrawImage($src, 0, 0, $w, $h)
    $g.Dispose()
    return $dest
}

# 512x512
$bmp512 = Resize-Image $srcBmp 512 512
$bmp512.Save("$destDir\icon-512.png", [System.Drawing.Imaging.ImageFormat]::Png)
$bmp512.Save("$destDir\icon.png", [System.Drawing.Imaging.ImageFormat]::Png)
$bmp512.Dispose()

# 256x256
$bmp256 = Resize-Image $srcBmp 256 256
$bmp256.Save("$destDir\icon-256.png", [System.Drawing.Imaging.ImageFormat]::Png)

# Salin ke renderer favicon
$rendererDir = "$PSScriptRoot\..\src\renderer"
if (Test-Path $rendererDir) {
    Copy-Item "$destDir\icon-256.png" "$rendererDir\favicon.png" -Force
}

$srcBmp.Dispose()
$bmp256.Dispose()

Write-Host "PNG icons generated successfully."
