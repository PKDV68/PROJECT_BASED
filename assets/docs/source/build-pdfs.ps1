# Turns every HTML file in this folder into a PDF in assets/docs/ (same name, .pdf).
# Files starting with "_" (the template) are skipped.
# Run it from anywhere:    powershell -ExecutionPolicy Bypass -File build-pdfs.ps1
# Build only some files:   powershell -ExecutionPolicy Bypass -File build-pdfs.ps1 event-details sponsor-info
# Needs Microsoft Edge or Google Chrome (headless printing), which every Windows PC with Edge has.
# Forms are then made fillable by add-fields.py, which needs Python with pypdf (python -m pip install pypdf).
# Without them the PDFs are still built, just not fillable.

param([Parameter(ValueFromRemainingArguments = $true)][string[]]$Only)

$ErrorActionPreference = 'Stop'
$src = $PSScriptRoot
$out = Split-Path $src -Parent

$browser = @(
  "${env:ProgramFiles(x86)}\Microsoft\Edge\Application\msedge.exe",
  "$env:ProgramFiles\Microsoft\Edge\Application\msedge.exe",
  "$env:ProgramFiles\Google\Chrome\Application\chrome.exe",
  "$env:LOCALAPPDATA\Google\Chrome\Application\chrome.exe"
) | Where-Object { Test-Path $_ } | Select-Object -First 1
if (-not $browser) { throw 'Microsoft Edge or Google Chrome is needed to print the PDFs.' }

# separate browser profile, so it works while Edge is open
$profileDir = Join-Path $env:TEMP 'pb-pdf-profile'

$python = Get-Command python -ErrorAction SilentlyContinue
$canFill = $false
if ($python) { & python -c "import pypdf" 2>$null; $canFill = ($LASTEXITCODE -eq 0) }
if (-not $canFill) { Write-Warning 'Python with pypdf not found: PDFs will be built but not fillable (python -m pip install pypdf).' }

$files = Get-ChildItem $src -Filter *.html | Where-Object { $_.Name -notlike '_*' }
if ($Only) { $files = $files | Where-Object { $Only -contains $_.BaseName } }

foreach ($f in $files) {
  $pdf = Join-Path $out ($f.BaseName + '.pdf')
  $url = ([System.Uri]$f.FullName).AbsoluteUri
  $argList = @('--headless=new', '--disable-gpu', '--no-pdf-header-footer', "--user-data-dir=`"$profileDir`"",
               '--virtual-time-budget=8000', "--print-to-pdf=`"$pdf`"", $url)
  $started = Get-Date
  Start-Process -FilePath $browser -ArgumentList $argList -Wait -WindowStyle Hidden
  if (-not ((Test-Path $pdf) -and (Get-Item $pdf).LastWriteTime -ge $started.AddSeconds(-1))) { Write-Warning ("Failed {0}" -f $f.Name); continue }
  Write-Host ("Built  {0}" -f (Split-Path $pdf -Leaf))

  # fillable fields: document.js leaves their positions as JSON in the page, read it back and add them to the PDF
  if ($canFill) {
    $dom = & $browser --headless=new --disable-gpu --disable-sync "--user-data-dir=$profileDir" --virtual-time-budget=8000 --dump-dom $url 2>$null | Out-String
    if ($dom -match '(?s)<script type="application/json" id="pdf-fields">(.*?)</script>' -and $matches[1].Trim() -ne '[]') {
      $json = Join-Path $env:TEMP ($f.BaseName + '-fields.json')
      [System.IO.File]::WriteAllText($json, [System.Net.WebUtility]::HtmlDecode($matches[1]))
      & python (Join-Path $src 'add-fields.py') $pdf $json
      Remove-Item $json
    }
  }
}
