import http.server,threading
from playwright.sync_api import sync_playwright
from vn_browser_helpers import confirm_returning_plan
class Quiet(http.server.SimpleHTTPRequestHandler):
 def log_message(self,*args):pass
server=http.server.ThreadingHTTPServer(('127.0.0.1',0),Quiet);threading.Thread(target=server.serve_forever,daemon=True).start()
def click(page,action,value=None):
 selector=f'[data-action="{action}"]'+(f'[data-value="{value}"]' if value is not None else '')
 page.locator(selector).first.click()
def save_slot(page,slot):
 click(page,'openQuick');click(page,'quickTab','save');click(page,'save',str(slot));s=page.evaluate('(key)=>JSON.parse(localStorage.getItem(key))',f'campus.slot.{slot}');click(page,'closeQuick');return s
def reload_slot(page,slot):
 page.reload();page.locator('.opening-tools [data-action="openQuick"]').click();click(page,'load',str(slot));click(page,'quickTab','tools');click(page,'combatResume')
try:
 with sync_playwright() as p:
  browser=p.chromium.launch(headless=True,executable_path='/usr/bin/chromium')
  for target in ['/prototype/','/demo/campus-demo.html']:
   for width,height in [(320,720),(390,844),(1440,1000)]:
    page=browser.new_page(viewport={'width':width,'height':height});page.set_default_timeout(10000);errors=[];page.on('pageerror',lambda e:errors.append(str(e)));page.goto(f'http://127.0.0.1:{server.server_port}'+target);confirm_returning_plan(page)
    click(page,'openQuick');click(page,'quickTab','save');click(page,'save','3');original=page.evaluate("JSON.parse(localStorage.getItem('campus.slot.3'))");click(page,'quickTab','tools');click(page,'go','combatSetup')
    assert page.locator('.battle-intro').is_visible();assert '윤도겸' not in page.locator('#combat-companion').inner_text();click(page,'combatStart')
    if target=='/demo/campus-demo.html':assert page.locator('.battle-face[data-face=taei]').evaluate("n=>getComputedStyle(n).backgroundImage.startsWith('url(\"data:image/')")
    assert page.locator('.battle-map .battle-zone').count()==4;assert page.locator('.battle-action-grid button').count()==4
    before=save_slot(page,1);assert before['combatTrial']['turn']==1
    click(page,'combatPlan','shove');click(page,'combatActor','ally');click(page,'combatPlan','advance')
    planned=save_slot(page,1);assert planned['combatTrial']['seed']==before['combatTrial']['seed'];assert planned['combatTrial']['actors']==before['combatTrial']['actors'];assert planned['clock']==before['clock']
    reload_slot(page,1);assert page.locator('[data-action="combatPlan"][data-value="shove"]').get_attribute('aria-pressed')=='true'
    if target=='/prototype/' and width in [390,1440]:page.screenshot(path=f'docs/assets/combat-planning-{width}-preview.png',full_page=True)
    click(page,'combatExecute');assert page.locator('.battle-log').is_visible();assert page.locator('[data-action="combatExecute"]').count()==0
    result=save_slot(page,2);reload_slot(page,2);assert page.locator('.battle-log').is_visible();assert page.locator('[data-action="combatExecute"]').count()==0
    resumed=save_slot(page,2);assert resumed['combatTrial']==result['combatTrial'];click(page,'combatNext')
    for a,b in [('advance','advance'),('shove','advance'),('advance','advance'),('advance','advance')]:
     click(page,'combatActor','taei');click(page,'combatPlan',a);click(page,'combatActor','ally');click(page,'combatPlan',b);click(page,'combatExecute')
     if page.locator('[data-action="combatNext"]').count():click(page,'combatNext')
    assert '탈출 성공' in page.locator('.battle-turn').inner_text();end=save_slot(page,1);assert end['combatTrial']['turn']==5;del end['combatTrial'];assert end==original,{k:[original.get(k),end.get(k)] for k in set(original)|set(end) if original.get(k)!=end.get(k)}
    assert page.evaluate('document.documentElement.scrollWidth<=innerWidth+1')
    if target=='/prototype/' and width in [390,1440]:page.screenshot(path=f'docs/assets/combat-escape-{width}-preview.png',full_page=True)
    click(page,'combatSetup');page.locator('#combat-companion').select_option('dogyeom');click(page,'combatStart');assert page.locator('.battle-face[data-face="dogyeom"]').is_visible();assert '윤도겸' not in page.locator('.battle-party').inner_text();click(page,'combatTools');assert page.locator('[data-action="combatPlan"][data-value="drink"]').is_visible();click(page,'combatExit');assert page.locator('.menu-dashboard').is_visible()
    assert not errors,errors;page.close()
  browser.close()
finally:server.shutdown();server.server_close()
print('Combat passed: web + self-contained download HTML via local server, 320/390/1440px, plan/result persistence, five-turn escape, identity privacy, tools and unchanged school state')
