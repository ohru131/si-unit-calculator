Add-Type -AssemblyName System.Drawing

$sourcePath = "C:\Users\shimadzu\.gemini\antigravity-ide\brain\f5ab4e29-5d69-4bd4-baa6-5baa73208474\.user_uploaded\media_1788934082203.png"
$src = [System.Drawing.Bitmap]::FromFile($sourcePath)

Write-Output "Loaded master source: $($src.Width)x$($src.Height)"

# 1. Master Icon: assets/images/icon.png (1024x1024)
$destIcon = "assets\images\icon.png"
Copy-Item -Path $sourcePath -Destination $destIcon -Force
Write-Output "Saved $destIcon (1024x1024 direct master copy)"

# 2. Downsampled 512x512 icons (Favicon & Play Store icon)
$bmp512 = New-Object System.Drawing.Bitmap(512, 512, [System.Drawing.Imaging.PixelFormat]::Format32bppArgb)
$g512 = [System.Drawing.Graphics]::FromImage($bmp512)
$g512.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
$g512.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::HighQuality
$g512.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality
$g512.DrawImage($src, 0, 0, 512, 512)
$g512.Dispose()

$destPlay = "submission-assets\store\play-store-icon-512.png"
$bmp512.Save($destPlay, [System.Drawing.Imaging.ImageFormat]::Png)
Write-Output "Saved $destPlay (512x512)"

$destFavicon = "assets\images\favicon.png"
$bmp512.Save($destFavicon, [System.Drawing.Imaging.ImageFormat]::Png)
Write-Output "Saved $destFavicon (512x512)"
$bmp512.Dispose()

# 3. Create High-Precision Cutout from 1024x1024 master
$cutout = New-Object System.Drawing.Bitmap(1024, 1024, [System.Drawing.Imaging.PixelFormat]::Format32bppArgb)

for ($y = 0; $y -lt 1024; $y++) {
    $ny = [Math]::Abs($y - 515.0) / 487.0
    for ($x = 0; $x -lt 1024; $x++) {
        $nx = [Math]::Abs($x - 512.0) / 485.0
        $val = [Math]::Pow($nx, 4.2) + [Math]::Pow($ny, 4.2)
        $p = $src.GetPixel($x, $y)
        
        if ($val -le 0.985) {
            $cutout.SetPixel($x, $y, $p)
        } elseif ($val -ge 1.015) {
            $cutout.SetPixel($x, $y, [System.Drawing.Color]::FromArgb(0, 0, 0, 0))
        } else {
            $alpha = [int](255 * (1.015 - $val) / 0.030)
            $cutout.SetPixel($x, $y, [System.Drawing.Color]::FromArgb($alpha, $p.R, $p.G, $p.B))
        }
    }
}
Write-Output "Cutout generated"

# 4. Android Adaptive Foreground: assets/images/android-icon-foreground.png (512x512)
# Safe zone scale: calculator width ~360px out of 512px
$fg512 = New-Object System.Drawing.Bitmap(512, 512, [System.Drawing.Imaging.PixelFormat]::Format32bppArgb)
$gFg = [System.Drawing.Graphics]::FromImage($fg512)
$gFg.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
$gFg.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::HighQuality
$gFg.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality
$gFg.Clear([System.Drawing.Color]::FromArgb(0, 0, 0, 0))

$adaptiveScale = 360.0 / 970.0
$afw = [int](1024.0 * $adaptiveScale)
$afh = [int](1024.0 * $adaptiveScale)
$afx = [int](256.0 - 512.0 * $adaptiveScale)
$afy = [int](256.0 - 515.0 * $adaptiveScale)
$gFg.DrawImage($cutout, $afx, $afy, $afw, $afh)
$gFg.Dispose()

$destFg = "assets\images\android-icon-foreground.png"
$fg512.Save($destFg, [System.Drawing.Imaging.ImageFormat]::Png)
Write-Output "Saved $destFg (512x512, safe-zone fitted)"
$fg512.Dispose()

# 5. Splash Icon: assets/images/splash-icon.png (512x512)
$splash512 = New-Object System.Drawing.Bitmap(512, 512, [System.Drawing.Imaging.PixelFormat]::Format32bppArgb)
$gSplash = [System.Drawing.Graphics]::FromImage($splash512)
$gSplash.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
$gSplash.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::HighQuality
$gSplash.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality
$gSplash.Clear([System.Drawing.Color]::FromArgb(0, 0, 0, 0))

$splashScale = 460.0 / 970.0
$spw = [int](1024.0 * $splashScale)
$sph = [int](1024.0 * $splashScale)
$spx = [int](256.0 - 512.0 * $splashScale)
$spy = [int](256.0 - 515.0 * $splashScale)
$gSplash.DrawImage($cutout, $spx, $spy, $spw, $sph)
$gSplash.Dispose()

$destSplash = "assets\images\splash-icon.png"
$splash512.Save($destSplash, [System.Drawing.Imaging.ImageFormat]::Png)
Write-Output "Saved $destSplash (512x512)"
$splash512.Dispose()

# 6. Android Monochrome Icon: assets/images/android-icon-monochrome.png (432x432)
# Grayscale conversion with enhanced contrast curve for text and symbols
$grayHighRes = New-Object System.Drawing.Bitmap(1024, 1024, [System.Drawing.Imaging.PixelFormat]::Format32bppArgb)

for ($y = 0; $y -lt 1024; $y++) {
    $ny = [Math]::Abs($y - 515.0) / 487.0
    for ($x = 0; $x -lt 1024; $x++) {
        $nx = [Math]::Abs($x - 512.0) / 485.0
        $val = [Math]::Pow($nx, 4.2) + [Math]::Pow($ny, 4.2)
        $p = $src.GetPixel($x, $y)
        
        $alpha = 255
        if ($val -gt 1.015) {
            $alpha = 0
        } elseif ($val -gt 0.985) {
            $alpha = [int](255 * (1.015 - $val) / 0.030)
        }
        
        if ($alpha -gt 0) {
            $lum = 0.299 * $p.R + 0.587 * $p.G + 0.114 * $p.B
            
            $gVal = 0
            if ($lum -lt 85) {
                # Text & symbols (1kΩ × 1mA, digits, operators)
                $gVal = [int]($lum * 0.4)
            } elseif ($lum -gt 210) {
                # White numeric keys & screen background
                $gVal = [int](225 + ($lum - 210) * 0.65)
            } elseif ($lum -gt 170) {
                # Operator keys
                $gVal = [int](175 + ($lum - 170) * 1.0)
            } else {
                # Calculator body
                $gVal = [int]($lum * 0.95)
            }
            if ($gVal -gt 255) { $gVal = 255 }
            if ($gVal -lt 0) { $gVal = 0 }
            
            $grayHighRes.SetPixel($x, $y, [System.Drawing.Color]::FromArgb($alpha, $gVal, $gVal, $gVal))
        } else {
            $grayHighRes.SetPixel($x, $y, [System.Drawing.Color]::FromArgb(0, 0, 0, 0))
        }
    }
}

$mono432 = New-Object System.Drawing.Bitmap(432, 432, [System.Drawing.Imaging.PixelFormat]::Format32bppArgb)
$gMono = [System.Drawing.Graphics]::FromImage($mono432)
$gMono.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
$gMono.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::HighQuality
$gMono.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality
$gMono.Clear([System.Drawing.Color]::FromArgb(0, 0, 0, 0))

$monoScale = 316.0 / 970.0
$mw = [int](1024.0 * $monoScale)
$mh = [int](1024.0 * $monoScale)
$mx = [int](216.0 - 512.0 * $monoScale)
$my = [int](216.0 - 515.0 * $monoScale)

$gMono.DrawImage($grayHighRes, $mx, $my, $mw, $mh)
$gMono.Dispose()

$destMono = "assets\images\android-icon-monochrome.png"
$mono432.Save($destMono, [System.Drawing.Imaging.ImageFormat]::Png)
Write-Output "Saved $destMono (432x432, rich grayscale)"
$mono432.Dispose()
$grayHighRes.Dispose()

$src.Dispose()
$cutout.Dispose()
Write-Output "All image assets generated successfully!"
