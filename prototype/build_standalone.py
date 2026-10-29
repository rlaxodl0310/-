"""Build a dependency-free HTML demo that opens without an HTTP server."""
from pathlib import Path
import base64
import sys
import re
import zipfile

root = Path(__file__).resolve().parent
destination = Path(sys.argv[1]) if len(sys.argv) > 1 else Path('/tmp/campus-demo.html')
css = (root / 'style.css').read_text() + '\n' + (root / 'interface.css').read_text()
# Large data URLs exceed browser limits for CSS custom-property values.
# Inline the URL directly into each image declaration instead.
for filename in ['campus-front-background.png', 'dialogue-portraits.png', 'activity-character-scenes.png', 'character-expressions.png', 'cafe-order-cinematic.png']:
    image = base64.b64encode((root.parent / 'docs/assets' / filename).read_bytes()).decode()
    css = css.replace('../docs/assets/' + filename, 'data:image/png;base64,' + image)
def inline_module(filename):
    source = (root / filename).read_text()
    source = re.sub(r'^import .*?;\n', '', source, flags=re.MULTILINE)
    return re.sub(r'\bexport (?=function |const )', '', source)
simulation = inline_module('supply-aftermath.js') + '\n' + inline_module('supply-story.js') + '\n' + inline_module('campus-rooms.js') + '\n' + inline_module('campus-buildings.js') + '\n' + inline_module('timetable.js') + '\n' + inline_module('weather.js') + '\n' + inline_module('discoveries.js') + '\n' + inline_module('warning-records.js') + '\n' + inline_module('event-view.js') + '\n' + inline_module('identity.js') + '\n' + inline_module('npc-state.js') + '\n' + inline_module('social-reasoning.js') + '\n' + inline_module('conversation-continuity.js') + '\n' + inline_module('situational-dialogue.js') + '\n' + inline_module('conversation-scenes.js') + '\n' + inline_module('campus-variation.js') + '\n' + inline_module('days.js') + '\n' + inline_module('dialogue-generator.js') + '\n' + inline_module('dialogue.js') + '\n' + inline_module('event-engine.js') + '\n' + inline_module('social-memory.js') + '\n' + inline_module('appointments.js') + '\n' + inline_module('risk-decisions.js') + '\n' + inline_module('warnings.js') + '\n' + inline_module('simulation.js') + '\n' + inline_module('library-life.js') + '\n' + inline_module('rain-lunch.js') + '\n' + inline_module('encounters.js')
app = inline_module('everyday-life.js') + '\n' + inline_module('cafe-life.js') + '\n' + inline_module('character-acting.js') + '\n' + inline_module('outdoor-life.js') + '\n' + inline_module('activity-scene.js') + '\n' + inline_module('vn-flow.js') + '\n' + inline_module('classes.js') + '\n' + inline_module('campus-moments.js') + '\n' + inline_module('free-roam.js') + '\n' + inline_module('community-simulation.js') + '\n' + inline_module('community.js') + '\n' + inline_module('activity-minigame.js') + '\n' + inline_module('physical-activities.js') + '\n' + inline_module('community-activities.js') + '\n' + inline_module('scene-flow.js') + '\n' + inline_module('campus-time.js') + '\n' + inline_module('dialogue-service.js') + '\n' + inline_module('club-admissions.js') + '\n' + inline_module('utility-ui.js') + '\n' + inline_module('app.js')
html = (root / 'index.html').read_text()
html = html.replace('<link rel="stylesheet" href="style.css">', '<style>' + css + '</style>')
html = html.replace('<link rel="stylesheet" href="interface.css">', '')
html = html.replace('<script type="module" src="app.js"></script>', '<script>' + simulation + '\n' + app + '</script>')
destination.write_text(html)
print('Built:', destination)
archive = destination.with_suffix('.zip')
with zipfile.ZipFile(archive, 'w', compression=zipfile.ZIP_DEFLATED) as bundle:
    bundle.write(destination, 'campus-demo.html')
    bundle.writestr('START-HERE.txt', '1. Extract this ZIP.\n2. Open campus-demo.html in Chrome or Edge.\nOrdinary offline play needs no installation.\nServer AI dialogue is available when this game is opened on a configured game website; it is not embedded in this offline HTML.\nGitHub file viewer and chat previews do not run this game.\n')
print('Built:', archive)
