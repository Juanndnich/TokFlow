$Root = Resolve-Path "."
$Exe = Resolve-Path "release/win-unpacked/TokFlow.exe"
$Work = Resolve-Path "release/win-unpacked"
$User = Join-Path $Root ".userData"
$PerfFile = Join-Path $Root "docs/PERFORMANCE.md"

$env:TOKFLOW_USER_DATA = $User
$env:TOKFLOW_PERF_FILE = $PerfFile
$env:ELECTRON_ENABLE_LOGGING = "1"

Write-Host "Menjalankan TokFlow untuk pengukuran performa..." -ForegroundColor Cyan
$p = Start-Process -FilePath $Exe -ArgumentList @("--measure-perf", "--no-sandbox", "--disable-gpu", "--user-data-dir=$User") -WorkingDirectory $Work -PassThru -Wait
Write-Host "Pengukuran selesai dengan exit code: $($p.ExitCode)" -ForegroundColor Green
exit $p.ExitCode
