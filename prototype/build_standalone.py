"""Build a dependency-free HTML demo that opens without an HTTP server."""
from pathlib import Path
import base64
import sys
import re
import zipfile
import json

root = Path(__file__).resolve().parent
destination = Path(sys.argv[1]) if len(sys.argv) > 1 else Path('/tmp/campus-demo.html')
css = (root / 'style.css').read_text() + '\n' + (root / 'interface.css').read_text()
# Embed each asset once; shared CSS references use in-memory Blob URLs.
# This keeps the offline file small without CSS custom-property data URL limits.
assets = {}
for filename in sorted(set(re.findall(r"\.\./docs/assets/([^'\")]+)", css))):
    assets[filename] = base64.b64encode((root.parent / 'docs/assets' / filename).read_bytes()).decode()
    css = css.replace('../docs/assets/' + filename, '__CAMPUS_ASSET_' + filename + '__')
asset_bootstrap = '<script>(()=>{const assets=' + json.dumps(assets) + ';let css=' + json.dumps(css) + ';for(const [name,data] of Object.entries(assets)){const raw=atob(data),bytes=new Uint8Array(raw.length);for(let i=0;i<raw.length;i++)bytes[i]=raw.charCodeAt(i);const url=URL.createObjectURL(new Blob([bytes],{type:"image/png"}));css=css.split("__CAMPUS_ASSET_"+name+"__").join(url);}const style=document.createElement("style");style.textContent=css;document.head.append(style);})();</script>'
def inline_module(filename):
    source = (root / filename).read_text()
    source = re.sub(r'^import .*?;\n', '', source, flags=re.MULTILINE)
    return re.sub(r'\bexport (?=async function |function |const )', '', source)
simulation = inline_module('personal-event-presence.js') + '\n' + inline_module('surroundings-data.js') + '\n' + inline_module('wallet.js') + '\n' + inline_module('supply-aftermath.js') + '\n' + inline_module('supply-story.js') + '\n' + inline_module('campus-rooms.js') + '\n' + inline_module('campus-buildings.js') + '\n' + inline_module('timetable.js') + '\n' + inline_module('weather.js') + '\n' + inline_module('discoveries.js') + '\n' + inline_module('warning-records.js') + '\n' + inline_module('event-view.js') + '\n' + inline_module('identity.js') + '\n' + inline_module('npc-state.js') + '\n' + inline_module('social-reasoning.js') + '\n' + inline_module('conversation-continuity.js') + '\n' + inline_module('situational-dialogue.js') + '\n' + inline_module('conversation-scenes.js') + '\n' + inline_module('campus-variation.js') + '\n' + inline_module('days.js') + '\n' + inline_module('dialogue-generator.js') + '\n' + inline_module('dialogue.js') + '\n' + inline_module('event-engine.js') + '\n' + inline_module('social-memory.js') + '\n' + inline_module('appointments.js') + '\n' + inline_module('risk-decisions.js') + '\n' + inline_module('warnings.js') + '\n' + inline_module('simulation.js') + '\n' + inline_module('library-life.js') + '\n' + inline_module('rain-lunch.js') + '\n' + inline_module('encounters.js')
app = inline_module('shelter-scene.js') + '\n' + inline_module('survival-base.js') + '\n' + inline_module('survival-ui.js') + '\n' + inline_module('combat-loot-ui.js') + '\n' + inline_module('combat-side-missions.js') + '\n' + inline_module('combat-missions.js') + '\n' + inline_module('combat-grid.js') + '\n' + inline_module('combat-grid-ui.js') + '\n' + inline_module('combat.js') + '\n' + inline_module('combat-ui.js') + '\n' + inline_module('event-cutscenes.js') + '\n' + inline_module('dogyeom-events.js') + '\n' + inline_module('personal-followups.js') + '\n' + inline_module('personal-events.js') + '\n' + inline_module('dialogue-cast.js') + '\n' + inline_module('neighborhood-events.js') + '\n' + inline_module('map-events.js') + '\n' + inline_module('place-backgrounds.js') + '\n' + inline_module('surroundings.js') + '\n' + inline_module('region-map.js') + '\n' + inline_module('campus-map.js') + '\n' + inline_module('navigation-copy.js') + '\n' + inline_module('opportunity-hints.js') + '\n' + inline_module('returning-opening.js') + '\n' + inline_module('fortnight-life.js') + '\n' + inline_module('shops.js') + '\n' + inline_module('iseo-preview.js') + '\n' + inline_module('everyday-life.js') + '\n' + inline_module('cafe-life.js') + '\n' + inline_module('character-acting.js') + '\n' + inline_module('outdoor-life.js') + '\n' + inline_module('activity-scene.js') + '\n' + inline_module('vn-flow.js') + '\n' + inline_module('classes.js') + '\n' + inline_module('campus-moments.js') + '\n' + inline_module('free-roam.js') + '\n' + inline_module('community-simulation.js') + '\n' + inline_module('community.js') + '\n' + inline_module('activity-minigame.js') + '\n' + inline_module('physical-activities.js') + '\n' + inline_module('community-activities.js') + '\n' + inline_module('scene-flow.js') + '\n' + inline_module('campus-time.js') + '\n' + inline_module('dialogue-service.js') + '\n' + inline_module('club-admissions.js') + '\n' + inline_module('utility-ui.js') + '\n' + inline_module('app.js')
html = (root / 'index.html').read_text()
html = html.replace('<link rel="stylesheet" href="style.css">', asset_bootstrap)
html = html.replace('<link rel="stylesheet" href="interface.css">', '')
html = html.replace('<script type="module" src="app.js"></script>', '<script>' + simulation + '\n' + app + '</script>')
destination.write_text(html)
print('Built:', destination)
archive = destination.with_suffix('.zip')
with zipfile.ZipFile(archive, 'w', compression=zipfile.ZIP_DEFLATED) as bundle:
    bundle.write(destination, 'campus-demo.html')
    bundle.writestr('START-HERE.txt', '1. Extract this ZIP.\n2. Open campus-demo.html in Chrome or Edge.\nOrdinary offline play needs no installation.\nServer AI dialogue is available when this game is opened on a configured game website; it is not embedded in this offline HTML.\nGitHub file viewer and chat previews do not run this game.\n')
print('Built:', archive)
