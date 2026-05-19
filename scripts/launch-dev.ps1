# launch-dev.ps1 — polls localhost for the JDD Kanban dev server, opens Chrome.
#
# Called by C:\Users\Xander\Desktop\Start JDD Kanban.bat after that launcher
# starts `npm run dev` in a separate cmd window. We don't know in advance which
# port Next.js will pick (defaults to 3000 but jumps to 3001/3002+ if in use),
# so we probe a small range and look for the Next.js fingerprint in the
# response body to confirm it's our app and not some unrelated local service.

$ErrorActionPreference = 'SilentlyContinue'
$deadline = (Get-Date).AddSeconds(60)
$url = $null

Write-Host ''
Write-Host 'Waiting for the dev server to come up...'

while ((Get-Date) -lt $deadline -and -not $url) {
    foreach ($p in 3000..3010) {
        try {
            $r = Invoke-WebRequest -Uri "http://localhost:$p" -UseBasicParsing -TimeoutSec 1 -ErrorAction Stop
            if ($r.Content -match '_next|JDD Buildout Tracker') {
                $url = "http://localhost:$p"
                break
            }
        } catch {
            # port not listening (or other transient) — keep probing
        }
    }
    if (-not $url) {
        Start-Sleep -Milliseconds 500
    }
}

if (-not $url) {
    Write-Host ''
    Write-Host 'Timed out after 60 seconds. Check the dev server window for compile errors.' -ForegroundColor Yellow
    Start-Sleep -Seconds 4
    exit 1
}

Write-Host "Found dev server at $url" -ForegroundColor Green

# Try common Chrome install paths in case it's not on PATH
$chromePaths = @(
    'chrome.exe',
    "$env:ProgramFiles\Google\Chrome\Application\chrome.exe",
    "${env:ProgramFiles(x86)}\Google\Chrome\Application\chrome.exe",
    "$env:LocalAppData\Google\Chrome\Application\chrome.exe"
)

$opened = $false
foreach ($path in $chromePaths) {
    try {
        Start-Process -FilePath $path -ArgumentList $url -ErrorAction Stop
        $opened = $true
        Write-Host "Chrome launched." -ForegroundColor Green
        break
    } catch {
        continue
    }
}

if (-not $opened) {
    Write-Host 'Chrome not found in expected locations — falling back to default browser.' -ForegroundColor Yellow
    Start-Process $url
}

Start-Sleep -Seconds 2
