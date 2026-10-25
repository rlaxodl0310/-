"""Build a dependency-free HTML demo that opens without an HTTP server."""
from pathlib import Path
import base64
import sys
import re
import zipfile

root = Path(__file__).resolve().parent
destination = Path(sys.argv[1]) if len(sys.argv) > 1 else Path('/tmp/campus-demo.html')
css = (root / 'style.css').read_text()
# Large data URLs exceed browser limits for CSS custom-property values.
# Inline the URL directly into each image declaration instead.
for filename in ['campus-front-background.png', 'dialogue-portraits.png']:
    image = base64.b64encode((root.parent / 'docs/assets' / filename).read_bytes()).decode()
    css = css.replace('../docs/assets/' + filename, 'data:image/png;base64,' + image)
def inline_module(filename):
    source = (root / filename).read_text()
    source = re.sub(r'^import .*?;\n', '', source, flags=re.MULTILINE)
    return re.sub(r'\bexport (?=function |const )', '', source)
simulation = inline_module('weather.js') + '\n' + inline_module('discoveries.js') + '\n' + inline_module('warning-records.js') + '\n' + inline_module('event-view.js') + '\n' + inline_module('identity.js') + '\n' + inline_module('social-reasoning.js') + '\n' + inline_module('conversation-scenes.js') + '\n' + inline_module('days.js') + '\n' + inline_module('dialogue.js') + '\n' + inline_module('event-engine.js') + '\n' + inline_module('social-memory.js') + '\n' + inline_module('appointments.js') + '\n' + inline_module('warnings.js') + '\n' + inline_module('simulation.js') + '\n' + inline_module('encounters.js')
app = inline_module('campus-time.js') + '\n' + inline_module('app.js')
html = (root / 'index.html').read_text()
html = html.replace('<link rel="stylesheet" href="style.css">', '<style>' + css + '</style>')
html = html.replace('<script type="module" src="app.js"></script>', '<script>' + simulation + '\n' + app + '</script>')
destination.write_text(html)
print('Built:', destination)
archive = destination.with_suffix('.zip')
with zipfile.ZipFile(archive, 'w', compression=zipfile.ZIP_DEFLATED) as bundle:
    bundle.write(destination, 'campus-demo.html')
    bundle.writestr('START-HERE.txt', '1. Extract this ZIP.\n2. Open campus-demo.html in Chrome or Edge.\nNo server or installation required.\nGitHub file viewer and chat previews do not run this game.\n')
print('Built:', archive)
