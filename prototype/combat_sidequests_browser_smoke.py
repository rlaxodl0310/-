import http.server,threading
from playwright.sync_api import sync_playwright
from vn_browser_helpers import confirm_returning_plan
class Quiet(http.server.SimpleHTTPRequestHandler):
 def log_message(self,*args):pass
server=http.server.ThreadingHTTPServer(('127.0.0.1',0),Quiet);threading.Thread(target=server.serve_forever,daemon=True).start()
def click(page,action,value=None):page.locator(f'[data-action="{action}"]'+(f'[data-value="{value}"]' if value is not None else '')).first.click()
def ready(page):page.wait_for_function("document.querySelector('.tactical-board')?.dataset.busy==='false'")
def act(page,actor,action,value=None):
 click(page,'combatActor',actor)
 if action=='move':click(page,'combatMode','move');click(page,'combatTile',value)
 else:click(page,action,value)
 ready(page)
def save_slot(page,slot):
 click(page,'openQuick');click(page,'quickTab','save');click(page,'save',str(slot));s=page.evaluate('(k)=>JSON.parse(localStorage.getItem(k))',f'campus.slot.{slot}');click(page,'closeQuick');return s
def load_slot(page,slot):
 page.reload();page.locator('.opening-tools [data-action="openQuick"]').click();click(page,'load',str(slot));click(page,'quickTab','tools');click(page,'combatResume')
try:
 with sync_playwright() as p:
  browser=p.chromium.launch(headless=True,executable_path='/usr/bin/chromium')
  for path in ['/prototype/','/demo/campus-demo.html']:
   for width,height in [(390,844),(1440,1000)]:
    page=browser.new_page(viewport={'width':width,'height':height},reduced_motion='reduce');page.set_default_timeout(12000);errors=[];page.on('pageerror',lambda e:errors.append(str(e)));page.goto(f'http://127.0.0.1:{server.server_port}'+path);confirm_returning_plan(page);click(page,'openQuick');click(page,'go','combatSetup');page.locator('[name="combat-mission"][value="protect"]').check();click(page,'combatStart')
    assert page.locator('[data-cache="supply"]').count()==1;page.locator('.tactical-panel>.tactical-sidequests summary').click();assert page.locator('[data-sidequest]').count()==3
    act(page,'taei','move','3,2');click(page,'combatLoot');ready(page);assert page.locator('[data-cache="supply"]').is_disabled()
    mid=save_slot(page,1);assert mid['combatTrial']['supplyCache']['recovered'];assert mid['combatTrial']['stash']['items']['bandage']==0;load_slot(page,1);assert page.locator('[data-cache="supply"]').is_disabled()
    act(page,'ally','move','6,4');act(page,'ally','combatGuard');click(page,'combatEndTurn');ready(page)
    act(page,'taei','move','5,3');act(page,'taei','combatGuard');act(page,'ally','combatGuard');click(page,'combatEndTurn');ready(page)
    if path=='/prototype/':
     page.locator('.tactical-panel>.tactical-sidequests summary').click();page.screenshot(path=f'docs/assets/combat-sidequests-{width}-preview.png',full_page=True)
    for _ in range(2):act(page,'taei','combatGuard');act(page,'ally','combatGuard');click(page,'combatEndTurn');ready(page)
    assert page.locator('[data-reward-status="secured"]').is_visible();won=save_slot(page,1);assert won['combatTrial']['stash']['items']=={'water':2,'bandage':3,'parts':1};load_slot(page,1);again=save_slot(page,1);assert again['combatTrial']['stash']==won['combatTrial']['stash']
    if path=='/prototype/':page.screenshot(path=f'docs/assets/combat-loot-result-{width}-preview.png',full_page=True)
    click(page,'combatSetup');page.locator('.combat-stash summary').click();assert '붕대 ×3' in page.locator('.combat-stash').inner_text();page.locator('[name="combat-mission"][value="escape"]').check();click(page,'combatStart');next_battle=save_slot(page,2);assert next_battle['combatTrial']['runId']==2;next_battle['combatTrial']['actors']['taei']['wounds']=1
    page.evaluate("s=>localStorage.setItem('campus.slot.2',JSON.stringify(s))",next_battle);load_slot(page,2);click(page,'combatTools');click(page,'combatBandage');ready(page);treated=save_slot(page,2);assert treated['combatTrial']['actors']['taei']['wounds']==0;assert treated['combatTrial']['stash']['items']['bandage']==2;assert treated['combatTrial']['optional']['teamHurt']
    if not page.locator('[data-action="combatDrink"]').count():click(page,'combatTools')
    click(page,'combatDrink');ready(page);click(page,'combatEndTurn');ready(page)
    if not page.locator('[data-action="combatDrink"]').count():click(page,'combatTools')
    click(page,'combatDrink');ready(page);used=save_slot(page,2);assert used['combatTrial']['stash']['items']['water']==1
    assert page.evaluate('document.documentElement.scrollWidth<=innerWidth+1');assert not errors,errors;page.close()
  browser.close()
finally:server.shutdown();server.server_close()
print('Side missions passed: actual cache route, provisional pickup/save, protect victory, bonus settlement once, next mission stock and usable bandages/water, both builds/mobile/desktop')
