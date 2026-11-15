"""Real profile knowledge, persisted height conversation and foot-anchored sprite proportions."""
import http.server,threading,json,subprocess
from playwright.sync_api import sync_playwright
from vn_browser_helpers import confirm_returning_plan,open_tool,choose
class Quiet(http.server.SimpleHTTPRequestHandler):
 def log_message(self,*args):pass
server=http.server.ThreadingHTTPServer(('127.0.0.1',0),Quiet);threading.Thread(target=server.serve_forever,daemon=True).start()
def fixture(kind='close'):
 return json.loads(subprocess.check_output(['node','--input-type=module','-e',"import {presentationScenario} from './prototype/presentation-fixtures.js';console.log(JSON.stringify(presentationScenario(process.argv[1])));",kind],text=True))
def click(p,a,v=None):p.locator(f'[data-action="{a}"]'+(f'[data-value="{v}"]' if v else '')).first.click()
def tool(p,id):
 click(p,'openQuick');click(p,'go',id)
def load(p,s):
 p.evaluate("s=>localStorage.setItem('campus.slot.1',JSON.stringify(s))",s);p.reload();p.locator('.opening-tools [data-action="openQuick"]').click();click(p,'load','1');p.locator('[data-navigation-back]').first.click();open_tool(p,'travel');p.locator('#travel-search').fill('자유관');p.locator('[data-action="visit"][data-value="hall"]').click()
 if p.locator('.vn-stage').get_attribute('data-vn-screen')=='encounter':choose(p,'encounter','pass')
def saved(p):
 click(p,'openQuick');click(p,'quickTab','save');click(p,'save','2');s=p.evaluate("JSON.parse(localStorage.getItem('campus.slot.2'))");click(p,'closeQuick');return s
try:
 with sync_playwright() as pw:
  b=pw.chromium.launch(headless=True,executable_path='/usr/bin/chromium')
  for path in ['/prototype/','/demo/campus-demo.html']:
   for width,height in [(390,844),(1440,1000)]:
    p=b.new_page(viewport={'width':width,'height':height},reduced_motion='reduce');p.set_default_timeout(15000);p.set_default_navigation_timeout(60000);errors=[];p.on('pageerror',lambda e:errors.append(str(e)));p.goto(f'http://127.0.0.1:{server.server_port}'+path);confirm_returning_plan(p)
    load(p,fixture());before=saved(p);open_tool(p,'peopleRecord');assert p.locator('[data-action="askHeight"][data-value="seoyeon"]').count();click(p,'askHeight','seoyeon');assert '160cm' in p.locator('[role="status"]').inner_text();assert not p.locator('[data-action="askHeight"][data-value="seoyeon"]').count();after=saved(p);assert after['clock']['minute']==before['clock']['minute']+2;assert after['contacts']['seoyeon']['details']['heightCm']==160;assert after['relations']==before['relations'];assert after.get('characterSystem')==before.get('characterSystem')
    tool(p,'characterStats');assert '179cm' in p.locator('[data-stats-character="taei"] .character-height').inner_text();assert '160cm' in p.locator('[data-stats-character="seoyeon"] .character-height').inner_text();assert '162cm' not in p.locator('[data-stats-character="yeogyeong"]').inner_text()
    tool(p,'characterArt');assert p.locator('[data-height-character]').count()==18;assert '164cm' in p.locator('[data-height-character="chaewon"]').inner_text();assert '183cm · 제안' in p.locator('[data-height-character="dogyeom"]').inner_text();assert p.evaluate('document.documentElement.scrollWidth<=innerWidth+1');p.locator('.height-catalog').screenshot(path=f'/workspace/work/heights-catalog-{width}.png')
    load(p,fixture('event'));choose(p,'openPersonalEvent','seoyeon');p.wait_for_timeout(150);a=p.locator('.portrait[data-actor="taei"]').bounding_box();c=p.locator('.portrait[data-actor="seoyeon"]').bounding_box();assert abs(c['height']/a['height']-160/179)<.002,(a,c);assert abs(a['y']+a['height']-c['y']-c['height'])<1;panel=p.locator('.vn-panel').bounding_box();assert a['y']+a['height']<=panel['y']+1;assert not errors,errors;p.screenshot(path=f'/workspace/work/heights-scene-{width}.png',full_page=True);p.close();print(path,width,'passed',flush=True)
  b.close()
finally:server.shutdown();server.server_close()
print('Character heights passed: 18-profile catalog, unknown height protected, actual 2-minute answer persisted, stats unchanged, 160/179 visual ratio and shared foot baseline; web/offline mobile/desktop')
