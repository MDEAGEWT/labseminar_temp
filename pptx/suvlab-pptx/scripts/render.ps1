# Render every slide of a deck to PNG with PowerPoint (for visual checks).
#   powershell -ExecutionPolicy Bypass -File render.ps1 deck.pptx outdir
param([string]$Deck, [string]$OutDir)
$deckPath = (Resolve-Path $Deck).Path
New-Item -ItemType Directory -Force $OutDir | Out-Null
$outPath = (Resolve-Path $OutDir).Path
$app = New-Object -ComObject PowerPoint.Application
try {
    $pres = $app.Presentations.Open($deckPath, $true, $false, $false)
    foreach ($slide in $pres.Slides) {
        $slide.Export((Join-Path $outPath ("slide-{0:D2}.png" -f $slide.SlideIndex)), "PNG", 1600, 900)
    }
    $pres.Close()
} finally {
    $app.Quit()
}
Get-ChildItem $outPath -Filter "slide-*.png" | ForEach-Object { $_.FullName }
