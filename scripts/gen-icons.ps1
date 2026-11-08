$Exe = Resolve-Path "release/win-unpacked/TokFlow.exe"
$Script = Resolve-Path "scripts/generate-icons.js"
$Work = Resolve-Path "release/win-unpacked"
$User = Resolve-Path ".userData"

$p = Start-Process -FilePath $Exe -ArgumentList @($Script, "--no-sandbox", "--disable-gpu", "--user-data-dir=$User") -WorkingDirectory $Work -PassThru -Wait
exit $p.ExitCode
