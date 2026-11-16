$ErrorActionPreference = 'Stop'
$root = Split-Path $PSScriptRoot -Parent
$folder = Join-Path $root 'release/FantasyStory-Patch'
New-Item -ItemType Directory -Path $folder -Force | Out-Null
$compiler = Join-Path $env:WINDIR 'Microsoft.NET/Framework64/v4.0.30319/csc.exe'
if (-not (Test-Path $compiler)) { throw 'Windows .NET Framework compiler is missing.' }
$program = (Resolve-Path (Join-Path $root 'patch\Program.cs')).Path
$core = (Resolve-Path (Join-Path $root 'patch\PatchCore.cs')).Path
$output = Join-Path $folder 'FantasyStoryPatch.exe'
$compileArgs = @('/nologo','/target:winexe','/platform:x64','/reference:System.Windows.Forms.dll','/reference:System.Runtime.Serialization.dll','/reference:System.Core.dll',"/out:$output",$program,$core)
& $compiler @compileArgs
if ($LASTEXITCODE -ne 0) { throw 'Patch program compilation failed.' }
$testExe = Join-Path ([System.IO.Path]::GetTempPath()) 'FantasyPatchCoreTests.exe'
$tests = (Resolve-Path (Join-Path $root 'tests\PatchCoreTests.cs')).Path
$testArgs = @('/nologo','/target:exe','/reference:System.Runtime.Serialization.dll','/reference:System.Core.dll',"/out:$testExe",$tests,$core)
& $compiler @testArgs
if ($LASTEXITCODE -ne 0) { throw 'Patch tests compilation failed.' }
& $testExe
if ($LASTEXITCODE -ne 0) { throw 'Patch transaction tests failed.' }
$asar = Join-Path $root 'release/FantasyStory-win32-x64/resources/app.asar'
Copy-Item $asar (Join-Path $folder 'app.asar') -Force
$version = (Get-Content (Join-Path $root 'package.json') -Raw | ConvertFrom-Json).version
@{product='FantasyStory';version=$version;minimumVersion='0.1.0';sha256=(Get-FileHash $asar -Algorithm SHA256).Hash.ToLowerInvariant()} | ConvertTo-Json | Set-Content (Join-Path $folder 'manifest.json') -Encoding utf8
@"
게임을 저장하고 완전히 종료한 뒤 이 패치 ZIP을 폴더 전체로 압축 해제하세요.
FantasyStoryPatch.exe를 실행하고, 기존 FantasyStory.exe가 있는 폴더를 선택하세요.
패치는 게임 파일만 교체합니다. 로그인, 기존 저장 파일, Electron, Codex는 교체하지 않습니다.
파일 검사와 기존 버전 백업을 수행하며, 파일 교체 중 오류가 발생하면 기존 버전 복원을 시도합니다.
현재 패치의 신규 현실 스토리는 별도 저장 슬롯을 사용하고 이전 체험판 기록은 보존합니다.
이것은 직접 실행하는 패치 방식이며 온라인 자동 다운로드/자동 설치는 아직 구현하지 않았습니다.
"@ | Set-Content (Join-Path $folder 'README.txt') -Encoding utf8
Compress-Archive -Path $folder -DestinationPath (Join-Path $root 'release/FantasyStory-Patch.zip') -CompressionLevel Optimal -Force
