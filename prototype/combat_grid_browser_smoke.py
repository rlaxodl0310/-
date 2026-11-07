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
 click(page,'openQuick');click(page,'quickTab','save');click(page,'save',str(slot));state=page.evaluate('(k)=>JSON.parse(localStorage.getItem(k))',f'campus.slot.{slot}');click(page,'closeQuick');return state
def load_slot(page,slot):
 page.reload();page.locator('.opening-tools [data-action="openQuick"]').click();click(page,'load',str(slot));click(page,'quickTab','tools');click(page,'combatResume')
trace=[('taei','move','5,4'),('taei','guard',None),('ally','move','4,4'),('ally','move','5,3'),('end',None,None),('taei','strike',1),('taei','strike',1),('ally','strike',2),('ally','strike',2),('end',None,None),('taei','guard',None),('taei','guard',None),('ally','guard',None),('ally','guard',None),('end',None,None),('taei','guard',None),('taei','guard',None),('ally','strike',3),('ally','strike',3),('end',None,None),('taei','move','8,4'),('taei','move','9,3'),('ally','move','8,3'),('ally','move','9,4'),('end',None,None),('taei','door',None),('taei','door',None),('ally','move','11,3'),('end',None,None),('taei','move','11,4')]
try:
 with sync_playwright() as p:
  browser=p.chromium.launch(headless=True,executable_path='/usr/bin/chromium')
  for path in ['/prototype/','/demo/campus-demo.html']:
   for width,height in [(320,720),(390,844),(1440,1000)]:
    page=browser.new_page(viewport={'width':width,'height':height},reduced_motion='reduce');page.set_default_timeout(12000);errors=[];page.on('pageerror',lambda e:errors.append(str(e)));base=f'http://127.0.0.1:{server.server_port}';page.goto(base+path);confirm_returning_plan(page)
    click(page,'openQuick');click(page,'quickTab','save');click(page,'save','3');original=page.evaluate("JSON.parse(localStorage.getItem('campus.slot.3'))");click(page,'quickTab','tools');click(page,'go','combatSetup');click(page,'combatStart')
    assert page.locator('.tactic-cell').count()==96;assert page.locator('.tactic-unit').count()==4
    for selector in ['.tactical-floor','.tactic-sprite']:
     assert page.locator(selector).first.evaluate("async n=>{const im=new Image();im.src=getComputedStyle(n).backgroundImage.slice(5,-2);await im.decode();return im.naturalWidth>1000;}")
    if path=='/demo/campus-demo.html':assert page.locator('.tactical-floor').evaluate("n=>getComputedStyle(n).backgroundImage.includes('blob:')")
    page.locator('[data-action="combatTile"][data-value="5,4"]').hover();assert page.locator('.cell-route').count()==3
    if path=='/prototype/' and width in [390,1440]:page.screenshot(path=f'docs/assets/combat-grid-start-{width}-preview.png',full_page=True)
    for i,(actor,action,value) in enumerate(trace):
     if actor=='end':click(page,'combatEndTurn')
     else:
      click(page,'combatActor',actor)
      if action=='move':click(page,'combatMode','move');click(page,'combatTile',value)
      elif action=='strike':click(page,'combatMode','strike');click(page,'combatEnemy',str(value))
      elif action=='guard':click(page,'combatGuard')
      elif action=='door':click(page,'combatDoor')
     page.wait_for_function("document.querySelector('.tactical-board')?.dataset.busy==='false'")
     if i==0:
      mid=save_slot(page,1);assert mid['combatTrial']['actors']['taei']['x']==5;assert mid['combatTrial']['actors']['taei']['ap']==1
      load_slot(page,1);actual=save_slot(page,1);assert actual['combatTrial']==mid['combatTrial']
     if i==8 and path=='/prototype/' and width in [390,1440]:page.screenshot(path=f'docs/assets/combat-grid-fight-{width}-preview.png',full_page=True)
    assert page.locator('.tactical-board').get_attribute('data-door-open')=='true'
    if path=='/prototype/' and width==1440:page.screenshot(path='docs/assets/combat-grid-escape-preview.png',full_page=True)
    assert '탈출 성공' in page.locator('.tactical-goal').inner_text();end=save_slot(page,1);assert end['combatTrial']['turn']==7;del end['combatTrial'];assert end==original
    assert page.evaluate('document.documentElement.scrollWidth<=innerWidth+1');assert not page.locator('.vn-controls').count();assert not page.locator('.tactical-error').count()
    assert not errors,errors;page.close()
  # Real animation: a click locks further orders until the board animation finishes.
  page=browser.new_page(viewport={'width':1440,'height':1000});page.goto(f'http://127.0.0.1:{server.server_port}/prototype/');confirm_returning_plan(page);click(page,'openQuick');click(page,'go','combatSetup');click(page,'combatStart');click(page,'combatTile','5,4');assert page.locator('.tactical-board').get_attribute('data-busy')=='true';assert page.locator('[data-action="combatEndTurn"]').is_disabled();assert page.locator('[data-unit="taei"] .tactic-walker').evaluate('n=>n.getAnimations().length>0');page.wait_for_function("document.querySelector('.tactical-board').dataset.busy==='false'");s=save_slot(page,2);assert s['combatTrial']['actors']['taei']['ap']==1
  page.close();browser.close()
finally:server.shutdown();server.server_close()
print('Tactical grid passed: 96 cells, path highlights, real art/sprites, targeted attacks, live AP/save, seven-turn escape, animation lock, web/download and mobile/desktop')
