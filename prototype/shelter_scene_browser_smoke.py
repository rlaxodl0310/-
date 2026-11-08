import http.server,threading
from playwright.sync_api import sync_playwright
from vn_browser_helpers import confirm_returning_plan
class Quiet(http.server.SimpleHTTPRequestHandler):
 def log_message(self,*args):pass
server=http.server.ThreadingHTTPServer(('127.0.0.1',0),Quiet);threading.Thread(target=server.serve_forever,daemon=True).start()
def click(page,action,value=None):page.locator(f'[data-action="{action}"]'+(f'[data-value="{value}"]' if value is not None else '')).first.click()
def save_slot(page,slot):
 click(page,'openQuick');click(page,'quickTab','save');click(page,'save',str(slot));s=page.evaluate('(k)=>JSON.parse(localStorage.getItem(k))',f'campus.slot.{slot}');click(page,'closeQuick');return s
def load(page):
 page.reload();page.locator('.opening-tools [data-action="openQuick"]').click();click(page,'load','1');click(page,'quickTab','tools');click(page,'go','survival');click(page,'survivalTab','base')
def art_loaded(node):return node.evaluate("async n=>{let im=new Image();im.src=getComputedStyle(n).backgroundImage.slice(5,-2);await im.decode();return im.naturalWidth>1000;}")
try:
 with sync_playwright() as p:
  browser=p.chromium.launch(headless=True,executable_path='/usr/bin/chromium')
  for path in ['/prototype/','/demo/campus-demo.html']:
   for width,height in [(390,844),(1440,1000)]:
    page=browser.new_page(viewport={'width':width,'height':height},reduced_motion='reduce');page.set_default_timeout(12000);errors=[];page.on('pageerror',lambda e:errors.append(str(e)));base=f'http://127.0.0.1:{server.server_port}';page.goto(base+path);confirm_returning_plan(page)
    for site in ['arts401','library','basement']:
     fixture=page.evaluate("async ({base,site})=>{const sim=await import(base+'/prototype/simulation.js'),camp=await import(base+'/prototype/survival-base.js');const s=camp.startSurvival(sim.newReturningGame());s.opening.step=3;s.opening.done=true;s.academics.registrationPending=false;Object.assign(s.survivalRun,{stage:'base',day:4,actions:3,base:{site,integrity:80,facilities:[]}});s.survivalRun.resources={food:20,water:20,bandage:4,parts:20};return s;}",{'base':base,'site':site})
     page.evaluate("s=>localStorage.setItem('campus.slot.1',JSON.stringify(s))",fixture);load(page);assert page.locator('.shelter-scene').get_attribute('data-room')==site;assert page.locator('.shelter-prop').count()==0;assert art_loaded(page.locator('.shelter-room-art'))
     if path=='/prototype/' and site=='arts401':page.screenshot(path=f'docs/assets/shelter-empty-{width}-preview.png',full_page=True)
     for index,facility in enumerate(['barricade','beds','clinic']):
      click(page,'survivalBuild',facility);assert page.locator('.shelter-prop').count()==index+1;assert art_loaded(page.locator(f'[data-facility="{facility}"] .shelter-prop-art'))
     if site=='arts401':assert page.locator('[data-action="survivalBuild"][data-value="workshop"]').is_disabled()
     if site=='basement':click(page,'survivalTab','overview');click(page,'survivalNextDay');click(page,'survivalTab','base');click(page,'survivalBuild','workshop');assert page.locator('.shelter-prop').count()==4
     before=save_slot(page,1);click(page,'survivalInspect','beds');assert '휴식' in page.locator('.shelter-scene-card footer').inner_text();after=save_slot(page,1);assert after['survivalRun']==before['survivalRun'];load(page);assert page.locator('.shelter-prop').count()==len(after['survivalRun']['base']['facilities'])
     if path=='/prototype/' and site in ['arts401','basement']:page.screenshot(path=f'docs/assets/shelter-built-{site}-{width}-preview.png',full_page=True)
     if path=='/prototype/' and site=='basement' and width==1440:page.locator('.shelter-scene-card').screenshot(path='docs/assets/shelter-built-room-preview.png')
     assert page.evaluate('document.documentElement.scrollWidth<=innerWidth+1')
    assert not errors,errors;page.close()
  browser.close()
finally:server.shutdown();server.server_close()
print('Shelter scenes passed: 3 room backgrounds, construction from empty to built, 4 prop layers, no costs for inspection, save/load, both builds/mobile/desktop')
