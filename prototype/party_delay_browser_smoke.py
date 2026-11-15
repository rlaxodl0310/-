"""Real dispatch/radio choices, live rescue, saves and backup in web/offline layouts."""
import http.server,threading,subprocess,json,copy
from playwright.sync_api import sync_playwright
from vn_browser_helpers import confirm_returning_plan
class Quiet(http.server.SimpleHTTPRequestHandler):
 def log_message(self,*args):pass
server=http.server.ThreadingHTTPServer(('127.0.0.1',0),Quiet)
threading.Thread(target=server.serve_forever,daemon=True).start()
def click(page,action,value=None):
 page.locator(f'[data-action="{action}"]'+(f'[data-value="{value}"]' if value is not None else '')).first.click()
def save_slot(page):
 click(page,'openQuick');click(page,'quickTab','save');click(page,'save','1');s=page.evaluate("JSON.parse(localStorage.getItem('campus.slot.1'))");click(page,'closeQuick');return s
def load(page,state=None,combat=False):
 if state is not None:page.evaluate("s=>localStorage.setItem('campus.slot.1',JSON.stringify(s))",state)
 page.reload();page.locator('.opening-tools [data-action="openQuick"]').click();click(page,'load','1');click(page,'quickTab','tools');click(page,'go','survival')
 if combat:click(page,'survivalResume')
def fixture(base):
 return json.loads(subprocess.check_output(['node','--input-type=module','-e',"import {partyDelayCampaign} from './prototype/party-delay-fixtures.js';let v='';for await(const c of process.stdin)v+=c;console.log(JSON.stringify(partyDelayCampaign(JSON.parse(v))));"],input=json.dumps(base),text=True))
def incident(page,base):
 load(page,fixture(base));click(page,'survivalTab','parties');page.locator('#party-mission-party-2').select_option('supply');click(page,'survivalPartyDispatch','party-2');click(page,'survivalTab','overview');click(page,'survivalNextDay');assert page.locator('[data-party-delay]').count()==1;s=save_slot(page);return s,s['survivalRun']['parties']['delays'][0]['id']
try:
 with sync_playwright() as p:
  browser=p.chromium.launch(headless=True,executable_path='/usr/bin/chromium')
  for path in ['/prototype/','/demo/campus-demo.html']:
   for width,height in [(390,844),(1440,1000)]:
    page=browser.new_page(viewport={'width':width,'height':height},reduced_motion='reduce');page.set_default_timeout(15000);errors=[];page.on('pageerror',lambda e:errors.append(str(e)));page.goto(f'http://127.0.0.1:{server.server_port}'+path);confirm_returning_plan(page);click(page,'openQuick');click(page,'go','survival');click(page,'survivalStart');base=save_slot(page)
    pending,id=incident(page,base);assert len(pending['survivalRun']['members'])==6;assert pending['survivalRun']['members'][2]['deployment']=='party-2';assert page.evaluate('document.documentElement.scrollWidth<=innerWidth+1');page.screenshot(path=f'/workspace/work/party-delay-{width}.png',full_page=True)
    click(page,'survivalPartyDelay',id+'|wait');assert page.locator(f'[data-value="{id}|wait"]').is_disabled();save_slot(page);load(page);assert page.locator(f'[data-value="{id}|wait"]').is_disabled();click(page,'survivalNextDay');waited=save_slot(page);assert waited['survivalRun']['parties']['delays'][0]['waits']==1;assert waited['survivalRun']['members'][2]['hydration']==pending['survivalRun']['members'][2]['hydration']-15
    click(page,'survivalPartyRescue',id);assert page.locator('.tactical-shell').is_visible();assert '연결 통로' in page.locator('.tactical-shell').inner_text()
    for turn in range(4):
     click(page,'combatActor','taei');click(page,'combatGuard');click(page,'combatEndTurn');page.wait_for_function("document.querySelector('.tactical-board')?.dataset.busy==='false'");assert page.locator('.tactical-error').count()==0
     if turn==1:save_slot(page);load(page,combat=True)
    assert '귀환로 확보' in page.locator('.tactical-finish').inner_text();click(page,'survivalReturn');done=save_slot(page);e=done['survivalRun']['parties']['delays'][0];assert e['status']=='resolved' and e['method']=='direct';assert len(done['survivalRun']['members'])==6;assert 'deployment' not in done['survivalRun']['members'][2];assert done['survivalRun']['members'][2]['partyRescueMemories'][0]['role']=='stranded';assert done['survivalRun']['members'][1]['partyRescueMemories'][0]['role']=='helper';assert page.locator('[data-delay-result]').count()==1;page.screenshot(path=f'/workspace/work/party-delay-return-{width}.png',full_page=True);load(page);assert page.locator('[data-delay-result]').count()==1
    # Reload the same unresolved campaign to independently verify another party's real deployment.
    load(page,pending);page.locator('#delay-backup-'+id).select_option('party-3');click(page,'survivalPartyDelay',id+'|backup');backup=save_slot(page);assert backup['survivalRun']['resources']['food']==pending['survivalRun']['resources']['food']-2;assert backup['survivalRun']['members'][4]['deployment']=='party-3';load(page);click(page,'survivalNextDay');backup=save_slot(page);assert backup['survivalRun']['parties']['delays'][0]['method']=='backup';assert all('deployment' not in m for m in backup['survivalRun']['members']);assert len(backup['survivalRun']['members'])==6
    load(page,pending);click(page,'survivalPartyDelay',id+'|recall');recalled=save_slot(page);assert recalled['survivalRun']['parties']['delays'][0]['method']=='recall';assert recalled['survivalRun']['members'][2]['injury']==2;assert not errors,errors;page.close();print(path,width,'passed',flush=True)
  browser.close()
finally:server.shutdown();server.server_close()
print('Party delay passed: real dispatch, radio, wait degradation, live four-turn rescue, saved midbattle, original residents, memories, backup rations/deployment, recall; web/offline mobile/desktop')
