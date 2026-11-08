import http.server,threading
from playwright.sync_api import sync_playwright
from vn_browser_helpers import confirm_returning_plan
class Quiet(http.server.SimpleHTTPRequestHandler):
 def log_message(self,*args):pass
server=http.server.ThreadingHTTPServer(('127.0.0.1',0),Quiet);threading.Thread(target=server.serve_forever,daemon=True).start()
def click(page,action,value=None):page.locator(f'[data-action="{action}"]'+(f'[data-value="{value}"]' if value is not None else '')).first.click()
def save_slot(page,slot):
 click(page,'openQuick');click(page,'quickTab','save');click(page,'save',str(slot));s=page.evaluate('(k)=>JSON.parse(localStorage.getItem(k))',f'campus.slot.{slot}');click(page,'closeQuick');return s
def load(page,s):
 page.evaluate("s=>localStorage.setItem('campus.slot.1',JSON.stringify(s))",s);page.reload();page.locator('.opening-tools [data-action="openQuick"]').click();click(page,'load','1');click(page,'quickTab','tools');click(page,'go','survival');click(page,'survivalTab','base')
try:
 with sync_playwright() as p:
  browser=p.chromium.launch(headless=True,executable_path='/usr/bin/chromium')
  for path in ['/prototype/','/demo/campus-demo.html']:
   for width in [390,1440]:
    page=browser.new_page(viewport={'width':width,'height':1000},reduced_motion='reduce');page.set_default_timeout(15000);errors=[];page.on('pageerror',lambda e:errors.append(str(e)));base=f'http://127.0.0.1:{server.server_port}';page.goto(base+path);confirm_returning_plan(page)
    for count in [0,3]:
     fixture=page.evaluate("""async ({base,count})=>{const m=await import(base+'/prototype/simulation.js'),c=await import(base+'/prototype/survival-base.js'),e=await import(base+'/prototype/survival-exploration.js');let seed=1;while(e.createSurvivalExploration(seed).rooms.arts401.occupants!==count)seed++;const s=c.startSurvival(m.newReturningGame(),'student',{seed});s.opening={step:3,done:true};s.academics.registrationPending=false;Object.assign(s.survivalRun,{stage:'settlement',day:3,escapes:2,actions:3,threat:24,resources:{food:30,water:30,parts:20,bandage:4}});return s;}""",{'base':base,'count':count})
     load(page,fixture);click(page,'survivalExploreBuilding','arts');assert page.locator('.shelter-map-building').count()==8;assert page.locator('[data-site="arts401"] .explore-state').inner_text()=='내부 미확인';assert not page.locator('[data-site="arts401"]').get_by_text('문 상태',exact=False).count()
     before=save_slot(page,2);click(page,'survivalExploreBuilding','headquarters');click(page,'survivalExploreFloor','6층');assert page.locator('[data-site="headquarters603"]').is_visible();assert save_slot(page,2)['survivalRun']==before['survivalRun'];click(page,'survivalExploreBuilding','arts');click(page,'survivalExploreFloor','7층');assert page.locator('[data-site="arts711"]').is_visible();click(page,'survivalExploreFloor','4층');click(page,'survivalScout','arts401');observed=save_slot(page,1);assert observed['survivalRun']['actions']==2;assert observed['survivalRun']['exploration']['here']=='arts401';assert observed['survivalRun']['exploration']['rooms']['arts401']['occupants']==count
     if path=='/prototype/' and width==1440:
      page.locator('.survival-exploration').screenshot(path=f'docs/assets/exploration-{count}-preview.png');page.locator('.explore-rooms').screenshot(path=f'docs/assets/exploration-room-{count}-preview.png')
     load(page,observed);assert save_slot(page,2)['survivalRun']==observed['survivalRun']
     if count==0:
      assert not page.locator('[data-action="survivalSecure"][data-value="arts401"]').count();click(page,'survivalClaim','arts401');claimed=save_slot(page,1);room=observed['survivalRun']['exploration']['rooms']['arts401'];assert claimed['survivalRun']['base']['integrity']==room['integrity'];assert claimed['survivalRun']['base']['exposure']==room['exposure'];assert page.locator('.shelter-scene').get_attribute('data-room')=='arts401'
     else:
      assert not page.locator('[data-action="survivalClaim"][data-value="arts401"]').count();click(page,'survivalSecure','arts401');assert page.locator('.hostile').count()==3;battle=save_slot(page,1);assert battle['combatTrial']['survivalSortie']==battle['survivalRun']['activeSortie']['id'];click(page,'combatExit');click(page,'survivalAbort');after=save_slot(page,1);assert after['survivalRun']['exploration']['rooms']['arts401']['occupants']==3;assert after['survivalRun']['exploration']['rooms']['arts401']['integrity']==observed['survivalRun']['exploration']['rooms']['arts401']['integrity'];load(page,after);assert '감염체 점령' in page.locator('[data-site="arts401"]').inner_text()
     assert page.evaluate('document.documentElement.scrollWidth<=innerWidth+1')
    assert not errors,errors;page.close()
  browser.close()
finally:server.shutdown();server.server_close()
print('Exploration passed: same room empty/occupied across seeds, 8 buildings/16 rooms and floors, no preinspection leaks, no-cost planning, save/restore, direct empty claim, 3-enemy sortie, retreat persistence, web/download mobile/desktop')
