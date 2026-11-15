"""Disagreement, decisions, real rescue/extraction and persistent consequences."""
import http.server,threading,json,subprocess
from playwright.sync_api import sync_playwright
from vn_browser_helpers import confirm_returning_plan
class Quiet(http.server.SimpleHTTPRequestHandler):
 def log_message(self,*args):pass
server=http.server.ThreadingHTTPServer(('127.0.0.1',0),Quiet);threading.Thread(target=server.serve_forever,daemon=True).start()
steps=json.loads(subprocess.check_output(['node','--input-type=module','-e',"import {supplyRescueRoute} from './prototype/supply-debate-fixtures.js';console.log(JSON.stringify(supplyRescueRoute))"],text=True))
prefix=steps[:next(i for i,s in enumerate(steps) if s[0]=='decision')]
def click(page,action,value=None):
 if action=='combatLoot' and page.locator('.shop-objectives').count():page.locator('.shop-objectives [data-action="combatLoot"]').click();return
 page.locator(f'[data-action="{action}"]'+(f'[data-value="{value}"]' if value is not None else '')).first.click()
def save_slot(page):
 click(page,'openQuick');click(page,'quickTab','save');click(page,'save','1');s=page.evaluate("JSON.parse(localStorage.getItem('campus.slot.1'))");click(page,'closeQuick');return s
def load(page,state=None,combat=False):
 if state is not None:page.evaluate("s=>localStorage.setItem('campus.slot.1',JSON.stringify(s))",state)
 page.reload();page.locator('.opening-tools [data-action="openQuick"]').click();click(page,'load','1');click(page,'quickTab','tools');click(page,'go','survival')
 if combat:click(page,'survivalResume')
def walk(page,trace,width=None):
 for key,*args in trace:
  if key=='end':click(page,'combatEndTurn')
  elif key=='decision':
   assert page.locator('.supply-debate [data-stance="rescue"]').count()==1;assert page.locator('.supply-debate [data-stance="withdraw"]').count()==1
   assert page.locator('[data-action="combatEndTurn"]').is_disabled();assert not page.locator('.tactical-panel').is_visible();mid=save_slot(page);load(page,combat=True);again=save_slot(page);assert mid['combatTrial']['supplyDebate']==again['combatTrial']['supplyDebate']
   if width:page.screenshot(path=f'/workspace/work/supply-debate-{width}.png',full_page=True)
   click(page,'combatSupplyDecision',args[0]);assert page.locator('.supply-debate').count()==0;assert page.locator('.supply-student-action').is_visible();continue
  elif key=='packLeave':click(page,'combatPackLeave');continue
  else:
   action=args[0];target=args[1] if len(args)>1 else None;click(page,'combatActor',key)
   if action=='move':click(page,'combatMode','move');click(page,'combatTile',f'{target["x"]},{target["y"]}')
   elif action in ['strike','shove']:click(page,'combatMode',action);click(page,'combatEnemy',str(target['id']))
   else:
    if action=='supplyRescue':click(page,'combatLocateSupplyStudent')
    click(page,{'guard':'combatGuard','loot':'combatLoot','door':'combatDoor','supplyRescue':'combatSupplyRescue'}[action])
  page.wait_for_function("document.querySelector('.tactical-board')?.dataset.busy==='false'");assert page.locator('.tactical-error').count()==0
try:
 with sync_playwright() as p:
  browser=p.chromium.launch(headless=True,executable_path='/usr/bin/chromium')
  for path in ['/prototype/','/demo/campus-demo.html']:
   for width,height in [(390,844),(1440,1000)]:
    page=browser.new_page(viewport={'width':width,'height':height},reduced_motion='reduce');page.set_default_timeout(12000);errors=[];page.on('pageerror',lambda e:errors.append(str(e)));base=f'http://127.0.0.1:{server.server_port}';page.goto(base+path);confirm_returning_plan(page);click(page,'openQuick');click(page,'go','survival');click(page,'survivalStart');initial=save_slot(page)
    campaign=page.evaluate("async ({base,initial})=>(await import(base+'/prototype/supply-debate-fixtures.js')).debateCampaign(initial)",{'base':base,'initial':initial});load(page,campaign);click(page,'survivalShopBrief','kiosk');click(page,'survivalSortie','kiosk');walk(page,steps,width if path=='/prototype/' else None);won=save_slot(page);assert won['combatTrial']['status']=='escaped';assert won['combatTrial']['turn']==6;assert won['combatTrial']['supplyDebate']['rescued'];click(page,'survivalReturn');returned=save_slot(page);record=returned['survivalRun']['supplyStories']['records'][-1];assert record['rescued'];assert record['harm'];assert len(returned['survivalRun']['members'])==4;assert not returned['survivalRun']['members'][-1]['partyConsent'];assert len(returned['survivalRun']['parties']['groups'][0]['members'])==3;assert page.locator('.supply-debrief').is_visible();assert '다친' in page.locator('.supply-debrief').inner_text();click(page,'survivalSupplyDebrief',record['id']+'|listen');spoken=save_slot(page);assert spoken['survivalRun']['supplyStories']['records'][-1]['debrief']=='listen';assert spoken['survivalRun']['parties']['bonds']['member:member-2']['tension']==0;load(page);assert page.locator('.debate-discussed').is_visible()
    if path=='/prototype/':page.screenshot(path=f'/workspace/work/supply-debrief-{width}.png',full_page=True)
    # A different choice spends real carried water, stays unresolved, and reappears next day.
    load(page,campaign);click(page,'survivalShopBrief','kiosk');click(page,'survivalSortie','kiosk');walk(page,prefix);before=save_slot(page);click(page,'combatSupplyDecision','mark');marked=save_slot(page);assert marked['combatTrial']['stash']['items']['water']==before['combatTrial']['stash']['items']['water']-1;assert marked['combatTrial']['turn']==before['combatTrial']['turn'];click(page,'combatExit');click(page,'survivalAbort');saved=save_slot(page);assert saved['survivalRun']['supplyStories']['sites']['kiosk']['status']=='marked';assert len(saved['survivalRun']['members'])==3;click(page,'survivalNextDay');click(page,'survivalShopBrief','kiosk');click(page,'survivalSortie','kiosk');walk(page,prefix);assert '전에 위치를 기록해 둔 곳' in page.locator('.supply-debate').inner_text();retry=save_slot(page);assert retry['combatTrial']['supplyDebate']['previousMark'];click(page,'combatSupplyDecision','withdraw');click(page,'combatExit');click(page,'survivalAbort');withdrawn=save_slot(page);assert not withdrawn['survivalRun']['supplyStories']['records'][-1]['rescued'];assert withdrawn['survivalRun']['supplyStories']['sites']['kiosk']['status']=='marked';assert len(withdrawn['survivalRun']['members'])==3
    assert page.evaluate('document.documentElement.scrollWidth<=innerWidth+1');assert not errors,errors;page.close();print(path,width,'passed',flush=True)
  browser.close()
finally:server.shutdown();server.server_close()
print('Supply debate passed: opposing opinions, frozen/saved decision, live six-turn rescue, resident consent, outcome reactions, discussion memory, real water cost, marked return request; web/offline mobile/desktop')
