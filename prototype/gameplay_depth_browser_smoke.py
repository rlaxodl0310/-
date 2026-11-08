import http.server,threading
from playwright.sync_api import sync_playwright
from vn_browser_helpers import confirm_returning_plan,read_to_choices,choose
class Quiet(http.server.SimpleHTTPRequestHandler):
 def log_message(self,*args):pass
server=http.server.ThreadingHTTPServer(('127.0.0.1',0),Quiet);threading.Thread(target=server.serve_forever,daemon=True).start()
def click(page,action,value=None):page.locator(f'[data-action="{action}"]'+(f'[data-value="{value}"]' if value is not None else '')).first.click()
def save_slot(page,slot):
 click(page,'openQuick');click(page,'quickTab','save');click(page,'save',str(slot));s=page.evaluate('(k)=>JSON.parse(localStorage.getItem(k))',f'campus.slot.{slot}');click(page,'closeQuick');return s
def load(page,s,tool):
 page.evaluate("s=>localStorage.setItem('campus.slot.1',JSON.stringify(s))",s);page.reload();page.locator('.opening-tools [data-action="openQuick"]').click();click(page,'load','1');click(page,'quickTab','tools')
 if tool=='survival':click(page,'go','survival')
 elif tool=='combat':click(page,'combatResume')
 else:click(page,'resumeEveryday')
try:
 with sync_playwright() as p:
  browser=p.chromium.launch(headless=True,executable_path='/usr/bin/chromium')
  for path in ['/prototype/','/demo/campus-demo.html']:
   for width in [390,1440]:
    page=browser.new_page(viewport={'width':width,'height':1000},reduced_motion='reduce');page.set_default_timeout(15000);errors=[];page.on('pageerror',lambda e:errors.append(str(e)));base=f'http://127.0.0.1:{server.server_port}';page.goto(base+path);confirm_returning_plan(page)
    fixture=page.evaluate("""async base=>{const m=await import(base+'/prototype/simulation.js'),c=await import(base+'/prototype/survival-base.js');const s=c.startSurvival(m.newReturningGame());s.opening={step:3,done:true};s.academics.registrationPending=false;Object.assign(s.survivalRun,{stage:'base',day:4,actions:3,base:{site:'library',integrity:80,facilities:['beds']},threat:20,resources:{food:20,water:20,parts:10,bandage:2},story:{seed:123,last:['locker'],checkedDay:4,current:{id:'locker',day:4},pending:[],resolved:[]}});return s;}""",base)
    load(page,fixture,'survival');assert '잠긴 생수' in page.locator('.camp-incident').inner_text();before=save_slot(page,2);click(page,'survivalTab','base');click(page,'survivalTab','overview');assert save_slot(page,2)['survivalRun']==before['survivalRun'];click(page,'survivalIncident','quiet');assert '생수 +4' in page.locator('.camp-followup').inner_text();assert '20 → 22' in page.locator('.camp-night-preview').inner_text();mid=save_slot(page,1);load(page,mid,'survival');assert save_slot(page,2)['survivalRun']==mid['survivalRun']
    if path=='/prototype/':page.screenshot(path=f'docs/assets/gameplay-camp-{width}-preview.png',full_page=True)
    click(page,'survivalNextDay');actual=save_slot(page,1);assert actual['survivalRun']['resources']['water']==22;assert not actual['survivalRun']['story']['pending'];page.locator('.camp-night-report summary').click();assert '후속 결과' in page.locator('.camp-night-report').inner_text();assert page.evaluate('document.documentElement.scrollWidth<=innerWidth+1')
    combat=page.evaluate("""async base=>{const m=await import(base+'/prototype/simulation.js'),g=await import(base+'/prototype/combat-grid.js');const s=g.startGridCombat(m.newReturningGame());s.opening={step:3,done:true};s.academics.registrationPending=false;return s;}""",base)
    load(page,combat,'combat');assert page.locator('.cell-forecast').count()>0;page.locator('.tactical-intents summary').click();assert '좀비 1' in page.locator('.tactical-intents').inner_text();before=save_slot(page,2);click(page,'combatMode','lure');assert page.locator('.cell-lureable').count()>0;assert save_slot(page,2)['combatTrial']==before['combatTrial'];click(page,'combatTile','5,2');page.wait_for_function("document.querySelector('.tactical-board').dataset.busy==='false'");assert '소리 2' in page.locator('.cell-sound').inner_text();mid=save_slot(page,1);assert mid['combatTrial']['noise']==2;assert mid['combatTrial']['items']['lure']==0;load(page,mid,'combat');assert save_slot(page,2)['combatTrial']==mid['combatTrial']
    if path=='/prototype/':page.screenshot(path=f'docs/assets/gameplay-tactics-{width}-preview.png',full_page=True)
    click(page,'combatEndTurn');page.wait_for_function("document.querySelector('.tactical-board').dataset.busy==='false'");actual=save_slot(page,1);assert [actual['combatTrial']['enemies'][0]['x'],actual['combatTrial']['enemies'][0]['y']]==[5,3];assert actual['combatTrial']['lure']['turns']==1;assert page.locator('[data-action=combatMode][data-value=lure]').is_disabled();assert page.evaluate('document.documentElement.scrollWidth<=innerWidth+1')
    school=page.evaluate("""async base=>{const m=await import(base+'/prototype/simulation.js'),e=await import(base+'/prototype/everyday-life.js');let s=m.newReturningGame();s.opening={step:3,done:true};s.academics.registrationPending=false;s.day=2;s.location='arts';s.everydayLife={rng:1,history:[{key:'past',eventId:'loose-paper',eventOutcome:'help',day:1,location:'arts'}],sequence:1,pending:null};return e.varyEverydayAction(s,{action:'rest',text:'잠깐 쉰다.'}).state;}""",base)
    load(page,school,'school');read_to_choices(page);choose(page,'everydayChoice','read');done=save_slot(page,1);assert done['everydayLife']['pending'] is None;assert done['everydayLife']['history'][-1]['eventOutcome']=='read';assert done['contacts']==school['contacts'];assert not errors,errors;page.close()
  browser.close()
finally:server.shutdown();server.server_close()
print('Gameplay depth passed: camp costs/delayed consequences/night preview/save, tactical lure/forecast/enemy response/save, next-day school follow-up, source/download mobile/desktop')
