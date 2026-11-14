"""Exercise the authored clinic route through actual controls on desktop and mobile."""
import http.server,threading,json,re
from pathlib import Path
from playwright.sync_api import sync_playwright
from vn_browser_helpers import confirm_returning_plan
class Quiet(http.server.SimpleHTTPRequestHandler):
 def log_message(self,*args):pass
server=http.server.ThreadingHTTPServer(('127.0.0.1',0),Quiet);threading.Thread(target=server.serve_forever,daemon=True).start()
def click(page,action,value=None):
 if action in ['combatLoot','combatClinicRescue'] and page.locator('.clinic-objectives').count():
  page.locator(f'.clinic-objectives [data-action="{action}"]').click();return
 page.locator(f'[data-action="{action}"]'+(f'[data-value="{value}"]' if value is not None else '')).first.click()
def save_slot(page):
 click(page,'openQuick');click(page,'quickTab','save');click(page,'save','1');s=page.evaluate("JSON.parse(localStorage.getItem('campus.slot.1'))");click(page,'closeQuick');return s
def load(page):
 page.reload();page.locator('.opening-tools [data-action="openQuick"]').click();click(page,'load','1');click(page,'quickTab','tools');click(page,'go','survival')
# Keep the model regression and the UI run on the same playable action trace.
source=Path('prototype/clinic-mission.test.js').read_text();trace=re.search(r'const trace=(\[.*?\]);',source).group(1)
try:
 with sync_playwright() as p:
  browser=p.chromium.launch(headless=True,executable_path='/usr/bin/chromium')
  for path in ['/prototype/','/demo/campus-demo.html']:
   for width,height in [(390,844),(1440,1000)]:
    page=browser.new_page(viewport={'width':width,'height':height},reduced_motion='reduce');page.set_default_timeout(15000);errors=[];page.on('pageerror',lambda e:errors.append(str(e)));page.goto(f'http://127.0.0.1:{server.server_port}'+path);confirm_returning_plan(page);click(page,'openQuick');click(page,'go','survival');click(page,'survivalStart');s=save_slot(page)
    s['survivalRun'].update({'day':4,'stage':'base','base':{'site':'arts401','integrity':80,'exposure':0,'facilities':[]}})
    page.evaluate("s=>localStorage.setItem('campus.slot.1',JSON.stringify(s))",s);load(page);click(page,'survivalClinicBrief');assert page.locator('.clinic-briefing').is_visible();assert '학생을 받을 수' in page.locator('.clinic-briefing').inner_text();click(page,'survivalSortie','clinic');assert page.locator('[data-encounter="clinic"]').is_visible();assert page.locator('.clinic-student-marker').count()==1
    page.screenshot(path=f'/workspace/work/clinic-start-{width}.png',full_page=True)
    actions=page.evaluate('()=>('+trace+')')
    for key,*rest in actions:
     if key=='end':click(page,'combatEndTurn')
     else:
      action=rest[0];target=rest[1] if len(rest)>1 else None;click(page,'combatActor',key)
      if action=='move':click(page,'combatMode','move');click(page,'combatTile',f'{target["x"]},{target["y"]}')
      else:click(page,{'guard':'combatGuard','loot':'combatLoot','clinicRescue':'combatClinicRescue','door':'combatDoor'}[action])
     page.wait_for_function("document.querySelector('.tactical-board')?.dataset.busy==='false'")
     assert page.locator('.tactical-error').count()==0
     if key!='end' and rest[0]=='loot':click(page,'combatPackTake','firstaid');click(page,'combatPackLeave')
     if key!='end' and rest[0]=='clinicRescue':
      mid=save_slot(page);assert mid['combatTrial']['clinic']['rescued'];load(page);click(page,'survivalResume');assert page.locator('.clinic-student-marker').count()==0
    assert '보건실 원정 완료' in page.locator('.tactical-finish').inner_text();won=save_slot(page);assert won['combatTrial']['status']=='escaped';assert won['combatTrial']['turn']==7
    click(page,'survivalReturn');done=save_slot(page);assert len(done['survivalRun']['members'])==3;assert done['survivalRun']['kit']['items']['firstaid']==1;assert done['survivalRun']['clinicOutcome']['rescued'];assert '같이 돌아올 사람' in page.locator('.shelter-last').inner_text();assert page.locator('[data-action="survivalClinicBrief"]').is_disabled()
    assert page.evaluate('document.documentElement.scrollWidth<=innerWidth+1');assert not errors,errors;page.close()
  browser.close()
finally:server.shutdown();server.server_close()
print('Clinic passed: briefing, live 7-turn route, medicine pickup, optional rescue, save/load mid-sortie, extraction and aftermath; web/offline build at 390/1440px')
