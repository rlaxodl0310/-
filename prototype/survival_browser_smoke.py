import http.server,threading
from playwright.sync_api import sync_playwright
from vn_browser_helpers import confirm_returning_plan
class Quiet(http.server.SimpleHTTPRequestHandler):
 def log_message(self,*args):pass
server=http.server.ThreadingHTTPServer(('127.0.0.1',0),Quiet);threading.Thread(target=server.serve_forever,daemon=True).start()
def click(page,action,value=None):page.locator(f'[data-action="{action}"]'+(f'[data-value="{value}"]' if value is not None else '')).first.click()
def save_slot(page,slot):
 click(page,'openQuick');click(page,'quickTab','save');click(page,'save',str(slot));s=page.evaluate('(k)=>JSON.parse(localStorage.getItem(k))',f'campus.slot.{slot}');click(page,'closeQuick');return s
def load_campaign(page,slot):
 page.reload();page.locator('.opening-tools [data-action="openQuick"]').click();click(page,'load',str(slot));click(page,'quickTab','tools');click(page,'go','survival')
def collect_pack_find(page,combat=False):
 action='combatPackTake' if combat else 'survivalPackLoot'
 for _ in range(40):
  buttons=page.locator(f'[data-action="{action}"]:not([disabled])')
  if not buttons.count():break
  buttons.first.click()
 if not combat:click(page,'survivalPackLeave')
def prepare_stored_pack(page):
 click(page,'survivalTab','bag');click(page,'survivalPackStoreAll');click(page,'survivalPackPrepare');click(page,'survivalTab','overview')
def return_with_pack(page):
 click(page,'openQuick');click(page,'quickTab','tools');click(page,'combatResume');collect_pack_find(page,True);click(page,'survivalReturn');prepare_stored_pack(page)
def finish_escape_fixture(page,base,state):
 return page.evaluate("""async ({base,state})=>{const g=await import(base+'/prototype/combat-grid.js');const trace=[['taei','move',{x:5,y:4}],['taei','guard'],['ally','move',{x:4,y:4}],['ally','move',{x:5,y:3}],['end'],['taei','strike',{id:1}],['taei','strike',{id:1}],['ally','strike',{id:2}],['ally','strike',{id:2}],['end'],['taei','guard'],['taei','guard'],['ally','drink'],['ally','guard'],['end'],['taei','guard'],['taei','guard'],['ally','strike',{id:3}],['ally','strike',{id:3}],['end'],['taei','move',{x:8,y:4}],['taei','move',{x:9,y:3}],['ally','move',{x:8,y:3}],['ally','move',{x:9,y:4}],['end'],['taei','door'],['taei','door'],['ally','move',{x:11,y:3}],['end'],['taei','move',{x:11,y:4}]];let s=state;for(const [key,action,target] of trace)s=key==='end'?g.endGridTurn(s):g.gridAct(s,key,action,target);return s;}""",{'base':base,'state':state})
try:
 with sync_playwright() as p:
  browser=p.chromium.launch(headless=True,executable_path='/usr/bin/chromium')
  for path in ['/prototype/','/demo/campus-demo.html']:
   for width,height in [(390,844),(1440,1000)]:
    page=browser.new_page(viewport={'width':width,'height':height},reduced_motion='reduce');page.set_default_timeout(12000);errors=[];page.on('pageerror',lambda e:errors.append(str(e)));base=f'http://127.0.0.1:{server.server_port}';page.goto(base+path);confirm_returning_plan(page);click(page,'openQuick');click(page,'go','survival');assert '초반 이틀' in page.locator('.shelter-intro').inner_text();assert '윤도겸' not in page.locator('#survival-companion').inner_text();click(page,'survivalStart');start=save_slot(page,1)
    # Fix this regression scenario to an occupied room; randomized empty rooms have separate coverage.
    start['survivalRun']['exploration']=page.evaluate("async base=>(await import(base+'/prototype/survival-exploration.js')).createSurvivalExploration(6)",base)
    page.evaluate("s=>localStorage.setItem('campus.slot.1',JSON.stringify(s))",start);load_campaign(page,1)
    for day in [1,2]:
     click(page,'survivalSortie','escape');assert page.locator('.tactical-board').is_visible();mid=save_slot(page,1);assert mid['survivalRun']['resources']['water']>=0;assert mid['survivalRun']['kit']['items']=={};assert mid['combatTrial']['stash']['items']['water']>0;assert mid['combatTrial']['items']['water']==0
     click(page,'combatExit');assert page.locator('.shelter-away').is_visible();load_campaign(page,1);assert page.locator('.shelter-away').is_visible();click(page,'survivalResume')
     complete=finish_escape_fixture(page,base,mid);assert complete['combatTrial']['status']=='escaped';page.evaluate("s=>localStorage.setItem('campus.slot.1',JSON.stringify(s))",complete);load_campaign(page,1);return_with_pack(page);assert f'사태 {day}일차' in page.locator('.shelter-status').inner_text();click(page,'survivalAction','hide');click(page,'survivalAction','search');collect_pack_find(page);prepare_stored_pack(page);click(page,'survivalNextDay')
    assert '사태 3일차' in page.locator('.shelter-status').inner_text();click(page,'survivalTab','base');click(page,'survivalScout','arts401');click(page,'survivalSecure','arts401');late=save_slot(page,1);late['combatTrial']['actors']['taei'].update({'x':5,'y':4,'ap':2,'stamina':80});late['combatTrial']['enemies'][0]['balance']=1;late['combatTrial']['enemies'][1]['balance']=0
    page.evaluate("s=>localStorage.setItem('campus.slot.1',JSON.stringify(s))",late);load_campaign(page,1);click(page,'survivalResume');click(page,'combatMode','strike');click(page,'combatEnemy','1');page.wait_for_function("document.querySelector('.tactical-board')?.dataset.busy==='false'");collect_pack_find(page,True);click(page,'survivalReturn');prepare_stored_pack(page);click(page,'survivalTab','base');click(page,'survivalClaim','arts401');assert page.locator('.shelter-scene').is_visible();click(page,'survivalTab','overview');click(page,'survivalNextDay');click(page,'survivalTab','base');click(page,'survivalBuild','barricade');click(page,'survivalBuild','beds');assert page.locator('.shelter-prop').count()==2
    if path=='/prototype/':page.screenshot(path=f'docs/assets/survival-base-{width}-preview.png',full_page=True)
    click(page,'survivalTab','people');page.locator('#survival-role-taei').select_option('watch');click(page,'survivalAssign','taei');assert page.locator('#survival-role-taei').input_value()=='watch';done=save_slot(page,2);assert done['survivalRun']['base']['site']=='arts401';assert done['survivalRun']['members'][0]['job']=='watch';load_campaign(page,2);after=save_slot(page,2);assert after['survivalRun']==done['survivalRun'];del after['survivalRun'];del start['survivalRun'];assert after==start
    assert page.evaluate('document.documentElement.scrollWidth<=innerWidth+1');assert not errors,errors;page.close()
  browser.close()
finally:server.shutdown();server.server_close()
print('Survival base passed: two actual escape outcomes, day-three scouting/clearance/claim, facilities, roles, stock reservation, save/return and school isolation, both builds/mobile/desktop')
