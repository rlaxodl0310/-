"""Create reproducible Unity asset GUIDs and a source-project ZIP, never a fake Windows binary."""
from pathlib import Path
import hashlib
import zipfile

ROOT = Path(__file__).resolve().parents[1]
PROJECT = ROOT / 'CampusSurvival'
ASSETS = PROJECT / 'Assets'

def metadata(path):
    relative = path.relative_to(PROJECT).as_posix()
    guid = hashlib.sha256(('CampusSurvival/' + relative).encode()).hexdigest()[:32]
    header = f'fileFormatVersion: 2\nguid: {guid}\n'
    tail = '  userData: \n  assetBundleName: \n  assetBundleVariant: \n'
    if path.is_dir():
        return header + 'folderAsset: yes\nDefaultImporter:\n  externalObjects: {}\n' + tail
    if path.suffix == '.cs':
        return header + 'MonoImporter:\n  externalObjects: {}\n  serializedVersion: 2\n  defaultReferences: []\n  executionOrder: 0\n  icon: {instanceID: 0}\n' + tail
    if path.suffix == '.png':
        return header + '''TextureImporter:
  externalObjects: {}
  serializedVersion: 12
  mipmaps:
    mipMapMode: 0
    enableMipMap: 0
    sRGBTexture: 1
  isReadable: 0
  textureSettings:
    serializedVersion: 2
    filterMode: 1
    aniso: 1
    mipBias: 0
    wrapU: 1
    wrapV: 1
    wrapW: 1
  maxTextureSize: 4096
  nPOTScale: 0
  textureCompression: 1
  compressionQuality: 75
  alphaUsage: 1
  alphaIsTransparency: 1
  textureType: 0
  textureShape: 1
''' + tail
    if path.suffix == '.ttf':
        return header + '''TrueTypeFontImporter:
  externalObjects: {}
  serializedVersion: 4
  fontSize: 32
  forceTextureCase: -2
  characterSpacing: 0
  characterPadding: 1
  includeFontData: 1
  fontNames:
  - NanumGothic
  fallbackFontReferences: []
  customCharacters:
  fontRenderingMode: 0
  ascentCalculationMode: 1
  useLegacyBoundsCalculation: 0
''' + tail
    if path.suffix == '.unity':
        return header + 'DefaultImporter:\n  externalObjects: {}\n' + tail
    return header + 'TextScriptImporter:\n  externalObjects: {}\n' + tail

for path in sorted(ASSETS.rglob('*')):
    if path.suffix == '.meta':
        continue
    meta = Path(str(path) + '.meta')
    if not meta.exists():
        meta.write_text('\n'.join(line.rstrip() for line in metadata(path).splitlines()) + '\n', encoding='utf-8')

output = ROOT.parent / 'demo' / 'campus-unity-project.zip'
excluded = {'Library', 'Temp', 'Obj', 'Logs', 'UserSettings', 'Builds', 'bin', 'obj', '__pycache__', '.vs'}
paths = [p for p in ROOT.rglob('*') if p.is_file() and not excluded.intersection(p.relative_to(ROOT).parts) and p.name != 'windows-build.log' and not (PROJECT in p.parents and p.suffix in {'.csproj', '.sln'})]
with zipfile.ZipFile(output, 'w', zipfile.ZIP_DEFLATED, compresslevel=6) as archive:
    for path in sorted(paths):
        info = zipfile.ZipInfo('campus-unity/' + path.relative_to(ROOT).as_posix(), date_time=(2026, 10, 30, 0, 0, 0))
        info.compress_type = zipfile.ZIP_DEFLATED
        info.external_attr = 0o644 << 16
        archive.writestr(info, path.read_bytes())
with zipfile.ZipFile(output) as archive:
    assert archive.testzip() is None
    for path in paths:
        assert archive.read('campus-unity/' + path.relative_to(ROOT).as_posix()) == path.read_bytes()
print(f'{output.name}: {len(paths)} files, {output.stat().st_size:,} bytes; contents verified')
