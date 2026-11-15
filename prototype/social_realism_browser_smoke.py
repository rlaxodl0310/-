"""First meetings, consensual conversation extension, released event pins and full-body uniforms."""
import http.server,threading,json,subprocess
from playwright.sync_api import sync_playwright
from vn_browser_helpers import confirm_returning_plan,choose,open_tool,read_to_choices
class Quiet(http.server.SimpleHTTPRequestHandler):
 def log_message(self,*args):pass
server=http.server.ThreadingHTTPServer(('127.0.0.1',0),Quiet);threading.Thread(target=server.serve_forever,daemon=True).start()
def fixture(kind):return json.loads(subprocess.check_output(['node','--input-type=module','-e',"import {presentationScenario} from './prototype/presentation-fixtures.js';console.log(JSON.stringify(presentationScenario(process.argv[1])));",kind],text=True))
def click(page,action,value=None):page.locator(f'[data-action="{action}"]'+(f'[data-value="{value}"]' if value is not None else '')).first.click()
def load(page,s):
 page.evaluate("s=>localStorage.setItem('campus.slot.1',JSON.stringify(s))",s);page.reload();page.locator('.opening-tools [data-action="openQuick"]').click();click(page,'load','1');page.locator('[data-navigation-back]').first.click()
def state(page):
 click(page,'openQuick');click(page,'quickTab','save');click(page,'save','2');s=page.evaluate("JSON.parse(localStorage.getItem('campus.slot.2'))");click(page,'closeQuick');return s
def visit(page,place,label):
 open_tool(page,'travel');page.locator('#travel-search').fill(label);page.locator(f'.map-building[data-value="{place}"]').click()
def scene_text(page):
 lines=[]
 for _ in range(24):
  lines.append(page.locator('.vn-line').inner_text())
  if not page.locator('[data-action="vnNext"]').count():break
  page.locator('[data-action="vnNext"]').click()
 return ' '.join(lines)
def assert_body(page,id):
 n=page.locator(f'.portrait[data-actor="{id}"]');assert n.get_attribute('data-portrait-mode')=='fullbody';page.wait_for_timeout(100);box=n.bounding_box();panel=page.locator('.vn-panel').bounding_box();assert box['y']+box['height']<=panel['y']+1,(box,panel)
 assert n.evaluate("async n=>{const im=new Image();im.src=getComputedStyle(n).backgroundImage.slice(5,-2);await im.decode();const c=document.createElement('canvas');c.width=im.naturalWidth;c.height=im.naturalHeight;const x=c.getContext('2d');x.drawImage(im,0,0);const d=x.getImageData(0,0,c.width,c.height).data;let clear=0;for(let i=3;i<d.length;i+=4)if(d[i]===0)clear++;return clear/(c.width*c.height)>.45;}")
try:
 with sync_playwright() as p:
  browser=p.chromium.launch(headless=True,executable_path='/usr/bin/chromium')
  for path in ['/prototype/','/demo/campus-demo.html']:
   for width,height in [(390,844),(1440,1000)]:
    page=browser.new_page(viewport={'width':width,'height':height},reduced_motion='reduce');page.set_default_timeout(15000);page.set_default_navigation_timeout(60000);errors=[];page.on('pageerror',lambda e:errors.append(str(e)));page.goto(f'http://127.0.0.1:{server.server_port}'+path);confirm_returning_plan(page)
    load(page,fixture('first'));visit(page,'hall','자유관');choose(page,'encounter','engage');read_to_choices(page);assert_body(page,'yeogyeong');assert not page.locator('[data-action="answer"][data-value="gen:share"]').count();choose(page,'answer','gen:listen');assert page.locator('.vn-stage').get_attribute('data-vn-screen')=='place'
    load(page,fixture('close'));visit(page,'hall','자유관');assert '먼저 알아보고' in scene_text(page);choose(page,'encounter','engage');read_to_choices(page);choose(page,'answer','gen:leave');read_to_choices(page);assert page.locator('[data-action="answer"][data-value="gen:stay"]').count();choose(page,'answer','gen:leave-final');assert page.locator('.vn-stage').get_attribute('data-vn-screen')=='place'
    load(page,fixture('event'));visit(page,'hall','자유관')
    if page.locator('.vn-stage').get_attribute('data-vn-screen')=='encounter':choose(page,'encounter','pass')
    choose(page,'openPersonalEvent','seoyeon');choose(page,'personalEventChoice','ask');open_tool(page,'travel');s=state(page);assert s['personalEvents']['active'] is None;assert s['personalEvents']['records']['seoyeon']['status']=='paused';assert s['personalEvents']['records']['seoyeon']['choices']==['ask']
    for id,label in [('naeun','본부동'),('dayeon','예술동'),('chaerin','체육관')]:
     s=fixture('fair:'+id);load(page,s);visit(page,s['location'],label)
     if page.locator('.vn-stage').get_attribute('data-vn-screen')=='encounter':choose(page,'encounter','pass')
     choose(page,'openPersonalEvent',id+':fair:1');assert_body(page,id);assert page.evaluate('document.documentElement.scrollWidth<=innerWidth+1');page.screenshot(path=f'/workspace/work/uniform-{id}-{width}.png',full_page=True)
    assert not errors,errors;page.close();print(path,width,'passed',flush=True)
  browser.close()
finally:server.shutdown();server.server_close()
print('Social realism passed: short sourced first exchange, friend initiation/extension/refusal, leaving releases reservation, three uniform full-body silhouettes with alpha and visible feet; web/offline mobile/desktop')
