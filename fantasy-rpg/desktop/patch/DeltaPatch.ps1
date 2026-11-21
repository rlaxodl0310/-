$ErrorActionPreference = 'Stop'
try {
 Add-Type -AssemblyName System.Windows.Forms
 Add-Type -AssemblyName System.Drawing
 $root = $PSScriptRoot
 Add-Type -Path @((Join-Path $root 'PatchCore.cs'),(Join-Path $root 'InstallationLocator.cs')) -ReferencedAssemblies @('System','System.Core','System.Runtime.Serialization','System.Windows.Forms','System.Drawing')
 $plan = Get-Content -LiteralPath (Join-Path $root 'delta.json') -Raw -Encoding UTF8 | ConvertFrom-Json
 $found = [InstallationLocator]::Discover($root)
 $folder = $null
 if ($found.Count -eq 1) { $folder = $found[0] }
 else {
  $picker = New-Object System.Windows.Forms.OpenFileDialog
  $picker.Title = '업데이트할 FantasyStory.exe 선택 (ZIP은 먼저 압축 해제)'
  $picker.Filter = '이세계 기록|FantasyStory.exe'
  if ($picker.ShowDialog() -ne [System.Windows.Forms.DialogResult]::OK) { exit 0 }
  $folder = [InstallationLocator]::Resolve($picker.FileName)
 }
 if ([InstallationLocator]::Running($folder)) { throw '게임에서 저장하고 종료한 뒤 패치를 다시 실행해 주세요.' }
 $base = Join-Path $folder 'resources\app.asar'
 if ([version]([PatchCore]::InstalledVersion($folder)) -ge [version]$plan.version) { [void][System.Windows.Forms.MessageBox]::Show('이미 이 버전 이상의 게임이 설치되어 있습니다. 소형 패치를 적용하지 않았습니다.','이세계 기록'); exit 0 }
 if ([PatchCore]::Hash($base) -eq $plan.sha256) { [void][System.Windows.Forms.MessageBox]::Show('이미 이 패치가 적용되어 있습니다.','이세계 기록'); exit 0 }
 if ([PatchCore]::Hash($base) -ne $plan.baseSha256) { throw ("이 소형 패치는 제공된 v" + $plan.baseVersion + " 설치본용입니다. 해당 버전을 먼저 적용해 주세요. 기존 게임은 변경하지 않았습니다.") }
 $oldNodeMode = $env:ELECTRON_RUN_AS_NODE
 try {
  $env:ELECTRON_RUN_AS_NODE = '1'
  & (Join-Path $folder 'FantasyStory.exe') (Join-Path $root 'delta-assemble.cjs') $base
  if ($LASTEXITCODE -ne 0) { throw '업데이트 파일 준비에 실패했습니다. 기존 게임은 변경하지 않았습니다.' }
 } finally { $env:ELECTRON_RUN_AS_NODE = $oldNodeMode }
 $manifest = [PatchCore]::Read((Join-Path $root 'manifest.json'))
 [void][PatchCore]::Apply($folder,(Join-Path $root 'app.asar'),$manifest)
 [InstallationLocator]::Remember($folder)
 [void][System.Windows.Forms.MessageBox]::Show(("v" + $plan.version + " 업데이트 완료. 로그인과 저장을 유지했고 기존 파일은 백업했습니다."),'이세계 기록')
} catch {
 [void][System.Windows.Forms.MessageBox]::Show($_.Exception.Message,'업데이트하지 못했습니다')
 exit 1
}
