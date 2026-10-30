param(
    [Parameter(Mandatory=$true)][string]$UnityEditor,
    [ValidateSet('Open','Windows')][string]$Action = 'Open'
)
$ErrorActionPreference = 'Stop'
$project = [IO.Path]::GetFullPath((Join-Path $PSScriptRoot '../CampusSurvival'))
if (!(Test-Path $UnityEditor)) { throw 'Unity.exe의 실제 경로를 -UnityEditor에 지정하세요.' }
if ($Action -eq 'Open') {
    Start-Process -FilePath $UnityEditor -ArgumentList ('-projectPath "{0}"' -f $project)
} else {
    $log = Join-Path $project 'windows-build.log'
    & $UnityEditor -batchmode -quit -projectPath $project -buildTarget Win64 -executeMethod CampusSurvival.Editor.CampusProject.BuildWindows -logFile $log
    if ($LASTEXITCODE -ne 0) { throw "Unity 빌드가 실패했습니다. 로그: $log" }
    Write-Host (Join-Path $project 'Builds/Windows/CampusSurvival.exe')
}
