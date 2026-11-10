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
 page.evaluate("s=>localStorage.setItem('campus.slot.1',JSON.stringify(s))",s);page.reload();page.locator('.opening-tools [data-action="openQuick"]').click();click(page,'load','1');click(page,'quickTab','tools');click(page,'go','survival')
try:
 with sync_playwright() as p:
  browser=p.chromium.launch(headless=True,executable_path='/usr/bin/chromium')
  for path in ['/prototype/','/demo/campus-demo.html']:
   for width in [390,1440]:
    page=browser.new_page(viewport={'width':width,'height':1000},reduced_motion='reduce');page.set_default_timeout(15000);errors=[];page.on('pageerror',lambda e:errors.append(str(e)));base=f'http://127.0.0.1:{server.server_port}';page.goto(base+path);confirm_returning_plan(page)
    fixture=page.evaluate("""async base=>{const m=await import(base+'/prototype/simulation.js'),c=await import(base+'/prototype/survival-base.js');const s=c.startSurvival(m.newReturningGame(),'student',{seed:6});s.opening={step:3,done:true};s.academics.registrationPending=false;Object.assign(s.survivalRun,{stage:'base',day:4,actions:3,base:{site:'library',integrity:90,facilities:['beds']},threat:5,resources:{food:100,water:100,parts:20,bandage:4}});Object.assign(s.survivalRun.members[0],{nutrition:10,hydration:10,fatigue:40,stress:40,injury:2,woundDays:3,woundRisk:55});Object.assign(s.survivalRun.members[1],{nutrition:30,hydration:35});s.survivalRun.kit.items={food:1,water:1,firstaid:1,parts:2};s.survivalRun.kit.stock={canned:2,repairkit:1};return s;}""",base)
    load(page,fixture);card=page.locator('[data-health-member=taei]');assert '10/100' in card.inner_text();assert '상처 악화 위험' in card.inner_text();before=save_slot(page,2);click(page,'survivalTab','people');assert '10/100' in page.locator('[data-health-member=taei]').inner_text();click(page,'survivalTab','overview');assert save_slot(page,2)['survivalRun']==before['survivalRun']
    if path=='/prototype/':page.locator('.survival-vitals').screenshot(path=f'docs/assets/survival-health-{width}-preview.png')
    click(page,'survivalMemberCare','taei:food');click(page,'survivalMemberCare','taei:water');click(page,'survivalMemberCare','taei:treat');cared=save_slot(page,1);m=cared['survivalRun']['members'][0];assert m['nutrition']==45 and m['hydration']==50;assert m['woundRisk']==15 and m['woundDays']==0 and m['injury']==1;assert cared['survivalRun']['actions']==2;load(page,cared);assert save_slot(page,2)['survivalRun']==cared['survivalRun']
    click(page,'survivalTab','storage');assert '거점 창고' in page.locator('.storage-intro').inner_text();click(page,'survivalPackStoreAll');click(page,'survivalPackTake','parts');stored=save_slot(page,1);assert stored['survivalRun']['resources']['parts']==21;assert stored['survivalRun']['kit']['items']['parts']==1;click(page,'survivalStoredUse','canned');fed=save_slot(page,1);assert fed['survivalRun']['kit']['stock']['canned']==1;assert fed['survivalRun']['members'][0]['nutrition']==90
    if path=='/prototype/':page.screenshot(path=f'docs/assets/survival-storage-{width}-preview.png',full_page=True)
    load(page,fed);click(page,'survivalSortie','supply');battle=save_slot(page,1);assert battle['combatTrial']['actors']['taei']['hunger']==12;assert battle['combatTrial']['actors']['taei']['thirst']==53;assert battle['survivalRun']['resources']==fed['survivalRun']['resources'];click(page,'combatExit');click(page,'survivalAbort');returned=save_slot(page,1);assert returned['survivalRun']['resources']['parts']==21;assert returned['survivalRun']['kit']['items']['parts']==1
    untreated=page.evaluate("s=>{s=structuredClone(s);Object.assign(s.survivalRun.members[0],{nutrition:80,hydration:80,fatigue:15,stress:20,injury:1,woundDays:2,woundRisk:32,caredDay:null});return s;}",fixture);load(page,untreated);assert '상처 2 / 악화 위험 48' in page.locator('.camp-night-preview').inner_text();preview=save_slot(page,2);assert preview['survivalRun']['members'][0]['woundDays']==2;click(page,'survivalNextDay');nextday=save_slot(page,1);assert nextday['survivalRun']['members'][0]['injury']==2;assert nextday['survivalRun']['members'][0]['woundRisk']==48;click(page,'survivalNextDay');assert '악화 위험 68' in page.locator('[data-health-member=taei]').inner_text()
    if path=='/prototype/' and width==1440:page.locator('[data-health-member=taei]').screenshot(path='docs/assets/survival-wound-preview.png')
    legacy=page.evaluate("s=>{s=structuredClone(s);for(const m of s.survivalRun.members)for(const k of ['nutrition','hydration','woundRisk','woundDays','caredDay'])delete m[k];return s;}",fixture);load(page,legacy);assert '80/100' in page.locator('[data-health-member=taei]').inner_text();assert save_slot(page,2)['survivalRun']==legacy['survivalRun'];assert page.evaluate('document.documentElement.scrollWidth<=innerWidth+1');assert not errors,errors;page.close()
  browser.close()
finally:server.shutdown();server.server_close()
print('Survival health passed: deprivation/care UI and real consumption, wound forecast/aging, storage use/transfer/save, expedition meter linkage, legacy nonretroactivity, web/download mobile/desktop')
