"""Build a dependency-free HTML demo that opens without an HTTP server."""
from pathlib import Path
import base64
import sys
import re

root = Path(__file__).resolve().parent
destination = Path(sys.argv[1]) if len(sys.argv) > 1 else Path('/tmp/campus-demo.html')
css = (root / 'style.css').read_text()
asset_variables = []
for index, filename in enumerate(['campus-front-background.png', 'dialogue-portraits.png']):
    image = base64.b64encode((root.parent / 'docs/assets' / filename).read_bytes()).decode()
    variable = '--asset-' + str(index)
    asset_variables.append(variable + ':url("data:image/png;base64,' + image + '")')
    css = css.replace("url('../docs/assets/" + filename + "')", 'var(' + variable + ')')
css = ':root{' + ';'.join(asset_variables) + '}' + css
def inline_module(filename):
    source = (root / filename).read_text()
    source = re.sub(r'^import .*?;\n', '', source, flags=re.MULTILINE)
    return re.sub(r'\bexport (?=function |const )', '', source)
simulation = inline_module('dialogue.js') + '\n' + inline_module('simulation.js')
app = inline_module('app.js')
html = (root / 'index.html').read_text()
html = html.replace('<link rel="stylesheet" href="style.css">', '<style>' + css + '</style>')
html = html.replace('<script type="module" src="app.js"></script>', '<script>' + simulation + '\n' + app + '</script>')
destination.write_text(html)
print('Built:', destination)
