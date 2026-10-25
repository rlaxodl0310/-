"""Build a dependency-free HTML demo that opens without an HTTP server."""
from pathlib import Path
import base64
import sys

root = Path(__file__).resolve().parent
destination = Path(sys.argv[1]) if len(sys.argv) > 1 else Path('/tmp/campus-demo.html')
css = (root / 'style.css').read_text()
image = base64.b64encode((root.parent / 'docs/assets/campus-background.png').read_bytes()).decode()
css = css.replace('../docs/assets/campus-background.png', 'data:image/png;base64,' + image)
simulation = (root / 'simulation.js').read_text().replace('export function ', 'function ')
app = (root / 'app.js').read_text().replace("import {newGame,act,save,restore} from './simulation.js';", '')
html = (root / 'index.html').read_text()
html = html.replace('<link rel="stylesheet" href="style.css">', '<style>' + css + '</style>')
html = html.replace('<script type="module" src="app.js"></script>', '<script>' + simulation + '\n' + app + '</script>')
destination.write_text(html)
print('Built:', destination)
