from vn_browser_helpers import legacy_survival_fixture
"""Verify party suggestions, response memory and actual preparation/care controls."""
import http.server,threading
from playwright.sync_api import sync_playwright
from vn_browser_helpers import confirm_returning_plan
class Quiet(http.server.SimpleHTTPRequestHandler):
 def log_message(self,*args):pass
server=http.server.ThreadingHTTPServer(('127.0.0.1',0),Quiet);threading.Thread(target=server.serve_forever,daemon=True).start()
def click(page,action,value=None):page.locator(f'[data-action="{action}"]'+(f'[data-value="{value}"]' if value is not None else '')).first.click()
def save_slot(page):
 click(page,'openQuick');click(page,'quickTab','save');click(page,'save','1');s=page.evaluate("JSON.parse(localStorage.getItem('campus.slot.1'))");click(page,'closeQuick');return s
def load(page,state=None):
 if state is not None:page.evaluate("s=>localStorage.setItem('campus.slot.1',JSON.stringify(s))",state)
 page.reload();page.locator('.opening-tools [data-action="openQuick"]').click();click(page,'load','1');click(page,'quickTab','tools');click(page,'go','survival')
def scenario(base):
 import copy
 s=copy.deepcopy(base);r=s['survivalRun'];r.update({'day':4,'actions':3,'stage':'base','base':{'site':'arts401','integrity':80,'exposure':0,'facilities':[]},'resources':{'food':12,'water':12,'bandage':0,'parts':4}});r['kit']['items']={};r['kit']['stock']={};r.pop('advice',None);return s
try:
 with sync_playwright() as p:
  browser=p.chromium.launch(headless=True,executable_path='/usr/bin/chromium')
  for path in ['/prototype/','/demo/campus-demo.html']:
   for width,height in [(390,844),(1440,1000)]:
    page=browser.new_page(viewport={'width':width,'height':height},reduced_motion='reduce');page.set_default_timeout(12000);errors=[];page.on('pageerror',lambda e:errors.append(str(e)));page.goto(f'http://127.0.0.1:{server.server_port}'+path);confirm_returning_plan(page);click(page,'openQuick');click(page,'go','survival');click(page,'survivalStart');legacy_survival_fixture(page);base=save_slot(page)
    # Old save initializes a proposal on entering camp; same needs, different preferences.
    for person,target in [('soyul','kiosk'),('dogyeom','convenience')]:
     s=scenario(base);s['survivalRun']['resources']['food']=0;s['survivalRun']['members'][1]['character']=person;load(page,s);card=page.locator('.party-advice');assert card.get_attribute('data-advice-kind')==target;assert '2명이' in card.inner_text();before=save_slot(page);click(page,'survivalAdviceAccept');assert page.locator('.shop-briefing').is_visible();accepted=save_slot(page);assert accepted['survivalRun']['actions']==before['survivalRun']['actions'];assert accepted['survivalRun']['activeSortie'] is None;assert accepted['survivalRun']['advice']['history'][-1]['status']=='accepted'
    s=scenario(base);s['survivalRun']['resources']['food']=0;load(page,s);click(page,'survivalAdviceDefer');assert page.locator('.party-advice').count()==0;deferred=save_slot(page);load(page);assert page.locator('.party-advice').count()==0;assert deferred['survivalRun']['advice']['history'][-1]['status']=='deferred'
    # An injured party asks for medicines, then chooses available treatment instead.
    s=scenario(base);s['survivalRun']['members'][0]['injury']=1;load(page,s);assert page.locator('[data-advice-kind="clinic"]').is_visible()
    if path=='/prototype/':page.screenshot(path=f'/workspace/work/party-advice-{width}.png',full_page=True)
    click(page,'survivalAdviceAccept');assert page.locator('.clinic-briefing').is_visible();s=scenario(base);s['survivalRun']['members'][0]['injury']=1;s['survivalRun']['resources']['bandage']=1;load(page,s);assert page.locator('[data-advice-kind="care"]').is_visible();click(page,'survivalAdviceAccept');click(page,'survivalMemberCare','taei:treat');healed=save_slot(page);assert healed['survivalRun']['members'][0]['injury']==0;click(page,'survivalTab','overview');assert page.locator('.party-advice').count()==0
    # Absent allies never propose; exhaustion selects rest and existing water selects drinking.
    s=scenario(base);s['survivalRun']['resources']['food']=0;s['survivalRun']['members'][1]['mind']={'state':'departed'};load(page,s);assert page.locator('.party-advice').count()==0
    s=scenario(base);s['survivalRun']['resources']['food']=0;s['survivalRun']['members'][0]['fatigue']=85;load(page,s);assert page.locator('[data-advice-kind="rest"]').is_visible();click(page,'survivalAdviceAccept');click(page,'survivalAction','hide');assert save_slot(page)['survivalRun']['members'][0]['fatigue']==73
    s=scenario(base);s['survivalRun']['members'][0]['hydration']=10;load(page,s);assert page.locator('[data-advice-kind="drink"]').is_visible();click(page,'survivalAdviceAccept');click(page,'survivalMemberCare','taei:water');assert save_slot(page)['survivalRun']['members'][0]['hydration']==50
    assert page.evaluate('document.documentElement.scrollWidth<=innerWidth+1');assert not errors,errors;page.close();print(path,width,'passed',flush=True)
  browser.close()
finally:server.shutdown();server.server_close()
print('Party advice passed: personality, shortage and injury evaluation, preparation without auto-departure, saved deferral, actual care/rest/drinking, absent members; web/offline mobile/desktop')
