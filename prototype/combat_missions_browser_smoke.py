import http.server,threading
from playwright.sync_api import sync_playwright
from vn_browser_helpers import confirm_returning_plan
class Quiet(http.server.SimpleHTTPRequestHandler):
 def log_message(self,*args):pass
server=http.server.ThreadingHTTPServer(('127.0.0.1',0),Quiet);threading.Thread(target=server.serve_forever,daemon=True).start()
def click(page,action,value=None):page.locator(f'[data-action="{action}"]'+(f'[data-value="{value}"]' if value is not None else '')).first.click()
def ready(page):page.wait_for_function("document.querySelector('.tactical-board')?.dataset.busy==='false'")
def save_slot(page,slot):
 click(page,'openQuick');click(page,'quickTab','save');click(page,'save',str(slot));s=page.evaluate('(k)=>JSON.parse(localStorage.getItem(k))',f'campus.slot.{slot}');click(page,'closeQuick');return s
def load_slot(page,slot):
 page.reload();page.locator('.opening-tools [data-action="openQuick"]').click();click(page,'load',str(slot));click(page,'quickTab','tools');click(page,'combatResume')
try:
 with sync_playwright() as p:
  browser=p.chromium.launch(headless=True,executable_path='/usr/bin/chromium')
  for path in ['/prototype/','/demo/campus-demo.html']:
   for width,height in [(390,844),(1440,1000)]:
    page=browser.new_page(viewport={'width':width,'height':height},reduced_motion='reduce');page.set_default_timeout(12000);errors=[];page.on('pageerror',lambda e:errors.append(str(e)));base=f'http://127.0.0.1:{server.server_port}';page.goto(base+path);confirm_returning_plan(page);click(page,'openQuick');click(page,'go','combatSetup')
    assert page.locator('[name="combat-mission"]').count()==3;page.locator('[name="combat-mission"][value="protect"]').check();click(page,'combatStart')
    assert page.locator('[data-unit="protected"]').is_visible();assert '4번 버티기' in page.locator('.tactical-goal').inner_text();assert not page.locator('[data-action="combatDoor"]').count()
    click(page,'combatInspect','protected');assert '움직일 수 없어요' in page.locator('.tactical-error').inner_text()
    for _ in range(2):click(page,'combatActor','taei');click(page,'combatGuard');ready(page);click(page,'combatEndTurn');ready(page)
    mid=save_slot(page,1);assert mid['combatTrial']['mission']=='protect';assert mid['combatTrial']['protection']['held']==2;load_slot(page,1);assert '2/4턴' in page.locator('.tactical-mission-progress').inner_text()
    if path=='/prototype/':page.screenshot(path=f'docs/assets/combat-mission-protect-{width}-preview.png',full_page=True)
    for _ in range(2):click(page,'combatActor','taei');click(page,'combatGuard');ready(page);click(page,'combatEndTurn');ready(page)
    assert '보호 임무 성공' in page.locator('.tactical-goal').inner_text();end=save_slot(page,1);assert end['combatTrial']['protection']['wounds']==0;assert end['combatTrial']['status']=='victory'
    click(page,'combatSetup');page.locator('[name="combat-mission"][value="eliminate"]').check();click(page,'combatStart');assert '모든 적 제압' in page.locator('.tactical-goal').inner_text();assert not page.locator('[data-action="combatDoor"]').count()
    # A saved late-fight fixture proves a last targeted strike wins without an exit.
    fixture=page.evaluate("async base=>{const sim=await import(base+'/prototype/simulation.js'),g=await import(base+'/prototype/combat-grid.js');const s=g.startGridCombat(sim.newAfternoonScenario(),'student','eliminate');s.combatTrial.actors.taei.x=5;s.combatTrial.actors.taei.y=4;s.combatTrial.enemies[0].balance=1;s.combatTrial.enemies[1].balance=0;return s;}",base)
    page.evaluate("s=>localStorage.setItem('campus.slot.2',JSON.stringify(s))",fixture);load_slot(page,2);click(page,'combatMode','strike');click(page,'combatEnemy','1');ready(page);assert '복도 확보 성공' in page.locator('.tactical-goal').inner_text();done=save_slot(page,2);assert done['combatTrial']['actors']['taei']['escaped']==False
    if path=='/prototype/':page.screenshot(path=f'docs/assets/combat-mission-eliminate-{width}-preview.png',full_page=True)
    assert page.evaluate('document.documentElement.scrollWidth<=innerWidth+1');assert not errors,errors;page.close()
  browser.close()
finally:server.shutdown();server.server_close()
print('Mission variants passed: selection, protected target/AI/4-round survival/save, elimination without exit, both builds/mobile/desktop')
