# PipeLab Standalone App Launcher (PowerShell)
$currDir = (Get-Item $PSScriptRoot).FullName.Replace('\', '/')
$appUrl = "file:///$currDir/index.html"
$userDir = "$env:TEMP\pipelab-profile"

$edge = @(
    "$env:ProgramFiles(x86)\Microsoft\Edge\Application\msedge.exe",
    "$env:ProgramFiles\Microsoft\Edge\Application\msedge.exe",
    "$env:ProgramFiles\Google\Chrome\Application\chrome.exe",
    "$env:ProgramFiles(x86)\Google\Chrome\Application\chrome.exe"
) | Where-Object { Test-Path $_ } | Select-Object -First 1

if ($edge) {
    Start-Process -FilePath $edge -ArgumentList "--app=`"$appUrl`"", "--window-size=1600,950", "--user-data-dir=`"$userDir`""
} else {
    Start-Process $appUrl
}
