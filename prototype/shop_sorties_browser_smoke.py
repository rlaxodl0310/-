from vn_browser_helpers import legacy_survival_fixture
"""Run both authored shop routes through real controls, including offline/mobile."""
import http.server,threading,json,subprocess
from playwright.sync_api import sync_playwright
from vn_browser_helpers import confirm_returning_plan
class Quiet(http.server.SimpleHTTPRequestHandler):
 def log_message(self,*args):pass
server=http.server.ThreadingHTTPServer(('127.0.0.1',0),Quiet);threading.Thread(target=server.serve_forever,daemon=True).start()
routes=json.loads(subprocess.check_output(['node','--input-type=module','-e',"import {shopRoute} from './prototype/shop-sorties-fixtures.js';console.log(JSON.stringify(Object.fromEntries(['kiosk','convenience'].map(k=>[k,shopRoute(k)]))))"],text=True))
def click(page,action,value=None):
 if action in ['combatLoot','combatShopReserve'] and page.locator('.shop-objectives').count():page.locator(f'.shop-objectives [data-action="{action}"]').click();return
 page.locator(f'[data-action="{action}"]'+(f'[data-value="{value}"]' if value is not None else '')).first.click()
def save_slot(page):
 click(page,'openQuick');click(page,'quickTab','save');click(page,'save','1');s=page.evaluate("JSON.parse(localStorage.getItem('campus.slot.1'))");click(page,'closeQuick');return s
def load(page):
 page.reload();page.locator('.opening-tools [data-action="openQuick"]').click();click(page,'load','1');click(page,'quickTab','tools');click(page,'go','survival')
try:
 with sync_playwright() as p:
  browser=p.chromium.launch(headless=True,executable_path='/usr/bin/chromium')
  for path in ['/prototype/','/demo/campus-demo.html']:
   for width,height in [(390,844),(1440,1000)]:
    for kind in ['kiosk','convenience']:
     page=browser.new_page(viewport={'width':width,'height':height},reduced_motion='reduce');page.set_default_timeout(12000);errors=[];page.on('pageerror',lambda e:errors.append(str(e)));page.goto(f'http://127.0.0.1:{server.server_port}'+path);confirm_returning_plan(page);click(page,'openQuick');click(page,'go','survival');click(page,'survivalStart');legacy_survival_fixture(page);s=save_slot(page);s['survivalRun'].update({'day':4,'stage':'base','base':{'site':'arts401','integrity':80,'exposure':0,'facilities':[]}});page.evaluate("s=>localStorage.setItem('campus.slot.1',JSON.stringify(s))",s);load(page);click(page,'survivalShopBrief',kind);assert page.locator('.shop-briefing').is_visible();click(page,'survivalSortie',kind);assert page.locator('[data-encounter="shop"]').is_visible()
     if path=='/prototype/':page.screenshot(path=f'/workspace/work/{kind}-{width}.png',full_page=True)
     for key,*rest in routes[kind]:
      if key=='end':click(page,'combatEndTurn')
      else:
       action=rest[0];target=rest[1] if len(rest)>1 else None;click(page,'combatActor',key)
       if action=='move':click(page,'combatMode','move');click(page,'combatTile',f'{target["x"]},{target["y"]}')
       elif action=='shove':click(page,'combatMode','shove');click(page,'combatEnemy',str(target['id']))
       else:click(page,{'guard':'combatGuard','loot':'combatLoot','shopReserve':'combatShopReserve','door':'combatDoor'}[action])
      page.wait_for_function("document.querySelector('.tactical-board')?.dataset.busy==='false'");assert page.locator('.tactical-error').count()==0
      if page.locator('.supply-debate').count():click(page,'combatSupplyDecision','withdraw')
      if key!='end' and rest[0] in ['loot','shopReserve']:
       click(page,'combatPackTake','food' if rest[0]=='loot' else 'canned');click(page,'combatPackLeave')
       if rest[0]=='shopReserve':mid=save_slot(page);assert mid['combatTrial']['shop']['extra']['recovered'];load(page);click(page,'survivalResume')
     won=save_slot(page);assert won['combatTrial']['status']=='escaped';assert won['combatTrial']['reinforced']==(kind=='convenience');assert '원정 완료' in page.locator('.tactical-finish').inner_text();click(page,'survivalReturn');done=save_slot(page);assert done['survivalRun']['kit']['items']['food']==1;assert done['survivalRun']['kit']['items']['canned']==1;assert page.locator(f'[data-action="survivalShopBrief"][data-value="{kind}"]').is_disabled();assert page.evaluate('document.documentElement.scrollWidth<=innerWidth+1');assert not errors,errors;page.close();print(path,width,kind,'passed',flush=True)
  browser.close()
finally:server.shutdown();server.server_close()
print('Shop sorties passed: both live routes, food/water stocks, reserve noise, save/load, extraction, daily limits; web/offline at mobile/desktop')
