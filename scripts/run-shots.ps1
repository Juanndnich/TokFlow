$ErrorActionPreference = "Stop"

$Root = Resolve-Path "."
$Exe = Resolve-Path "release/win-unpacked/TokFlow.exe"
$WorkDir = Resolve-Path "release/win-unpacked"
$ShotsDir = Join-Path $Root "docs/shots"
$UserData = Join-Path $Root ".userData"

if (!(Test-Path $ShotsDir)) {
  New-Item -ItemType Directory -Force -Path $ShotsDir | Out-Null
}
if (!(Test-Path $UserData)) {
  New-Item -ItemType Directory -Force -Path $UserData | Out-Null
}

$env:TOKFLOW_SHOTS_DIR = $ShotsDir
$env:TOKFLOW_USER_DATA = $UserData
$env:ELECTRON_ENABLE_LOGGING = "1"

Write-Host "Memulai TokFlow dalam shots mode..." -ForegroundColor Cyan
Write-Host "Exe: $Exe"
Write-Host "WorkDir: $WorkDir"
Write-Host "ShotsDir: $ShotsDir"

$p = Start-Process -FilePath $Exe -ArgumentList @("--shots-mode", "--no-sandbox", "--disable-gpu", "--user-data-dir=$UserData") -WorkingDirectory $WorkDir -PassThru -Wait

Write-Host "TokFlow selesai dengan exit code: $($p.ExitCode)" -ForegroundColor Green
exit $p.ExitCode
