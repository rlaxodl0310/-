"""Local planning, generated dialogue, negotiated alternatives, real actions and save/load."""
import http.server,threading,subprocess,json,copy
from playwright.sync_api import sync_playwright
from vn_browser_helpers import confirm_returning_plan
class Quiet(http.server.SimpleHTTPRequestHandler):
 def log_message(self,*args):pass
server=http.server.ThreadingHTTPServer(('127.0.0.1',0),Quiet);threading.Thread(target=server.serve_forever,daemon=True).start()
def click(page,action,value=None):
 page.locator(f'[data-action="{action}"]'+(f'[data-value="{value}"]' if value is not None else '')).first.click()
def save_slot(page):
 click(page,'openQuick');click(page,'quickTab','save');click(page,'save','1');s=page.evaluate("JSON.parse(localStorage.getItem('campus.slot.1'))");click(page,'closeQuick');return s
def load(page,state=None):
 if state is not None:page.evaluate("s=>localStorage.setItem('campus.slot.1',JSON.stringify(s))",state)
 page.reload();page.locator('.opening-tools [data-action="openQuick"]').click();click(page,'load','1');click(page,'quickTab','tools');click(page,'go','survival');click(page,'survivalTab','thinking')
def fixture(base,mode):
 return json.loads(subprocess.check_output(['node','--input-type=module','-e',"import {thinkingCampaign} from './prototype/survival-thinking-fixtures.js';let v='';for await(const c of process.stdin)v+=c;const x=JSON.parse(v);console.log(JSON.stringify(thinkingCampaign(x.base,x.mode)));"],input=json.dumps({'base':base,'mode':mode}),text=True))
def plan(s,key='ally'):
 return next(p for p in s['survivalRun']['thinking']['plans'] if p['speaker']==key and p['status'] in ['proposed','accepted'])
def supply(s,id):
 r=s['survivalRun'];return r['resources'].get(id,0)+r['kit']['items'].get(id,0)+r['kit']['stock'].get(id,0)
try:
 with sync_playwright() as p:
  browser=p.chromium.launch(headless=True,executable_path='/usr/bin/chromium')
  for path in ['/prototype/','/demo/campus-demo.html']:
   for width,height in [(390,844),(1440,1000)]:
    page=browser.new_page(viewport={'width':width,'height':height},reduced_motion='reduce');page.set_default_timeout(15000);page.set_default_navigation_timeout(60000);errors=[];page.on('pageerror',lambda e:errors.append(str(e)));page.goto(f'http://127.0.0.1:{server.server_port}'+path);confirm_returning_plan(page);click(page,'openQuick');click(page,'go','survival');click(page,'survivalStart');base=save_slot(page)
    s=fixture(base,'recovery');load(page,s);id=plan(s)['id'];assert page.locator('[data-thinking-plan]').count()==2;click(page,'survivalThinkingReply',id+'|why');click(page,'survivalThinkingReply',id+'|risk');assert page.locator(f'[data-value="{id}|why"]').is_disabled();spoken=save_slot(page);load(page);assert plan(save_slot(page))['dialogue']==plan(spoken)['dialogue'];click(page,'survivalThinkingReply',id+'|accept');accepted=save_slot(page);assert supply(accepted,'water')==supply(s,'water');assert accepted['survivalRun']['members'][1]['hydration']==20;assert page.evaluate('document.documentElement.scrollWidth<=innerWidth+1');page.screenshot(path=f'/workspace/work/thinking-{width}.png',full_page=True)
    for step in range(3):
     click(page,'survivalThinkingAct',id)
     if step==0:save_slot(page);load(page)
    done=save_slot(page);record=next(p for p in done['survivalRun']['thinking']['plans'] if p['id']==id);assert record['status']=='completed';assert supply(done,'water')==supply(s,'water')-1;assert supply(done,'food')==supply(s,'food')-1;assert supply(done,'bandage')==supply(s,'bandage')-1;assert done['survivalRun']['members'][1]['injury']==1;assert page.locator(f'[data-thinking-result="{id}"]').count()==1
    # Different personalities choose different routes; the alternative survives saving.
    s=fixture(base,'supply');load(page,s);id=plan(s)['id'];assert plan(s)['goal']!=plan(s,'member-2')['goal'];click(page,'survivalThinkingReply',id+'|alternative');alt=save_slot(page);assert plan(alt)['goal']!=plan(s)['goal'];load(page);assert plan(save_slot(page))['goal']==plan(alt)['goal']
    load(page,s);click(page,'survivalThinkingReply',id+'|companions');click(page,'survivalThinkingReply',id+'|accept');click(page,'survivalThinkingAct',id);prepared=save_slot(page);blocked=copy.deepcopy(prepared);blocked['survivalRun']['members'][2]['injury']=3;load(page,blocked);assert page.locator(f'[data-action="survivalThinkingAct"][data-value="{id}"]').is_disabled();load(page,prepared);click(page,'survivalThinkingAct',id);assert page.locator('.tactical-shell').is_visible();assert '매점' in page.locator('.tactical-shell').inner_text();click(page,'openQuick');click(page,'quickTab','tools');click(page,'go','survival');click(page,'survivalAbort');click(page,'survivalTab','thinking');failed=save_slot(page);assert next(p for p in failed['survivalRun']['thinking']['plans'] if p['id']==id)['status']=='failed';assert failed['survivalRun']['members'][1]['thinkingLearning']['caution']==6
    # A plan also follows a real base role through the next night.
    s=fixture(base,'watch');load(page,s);id=plan(s)['id'];click(page,'survivalThinkingReply',id+'|accept');click(page,'survivalThinkingAct',id);watched=save_slot(page);assert watched['survivalRun']['members'][1]['job']=='watch';assert plan(watched)['status']=='accepted';click(page,'survivalThinkingAct',id);night=save_slot(page);assert next(p for p in night['survivalRun']['thinking']['plans'] if p['id']==id)['status']=='completed';assert night['survivalRun']['day']==5
    s=fixture(base,'search');load(page,s);id=plan(s)['id'];assert plan(s)['goal']=='search';click(page,'survivalThinkingReply',id+'|accept');click(page,'survivalThinkingAct',id);assert page.locator('[data-action="survivalPackLoot"][data-value="food"]').count();click(page,'survivalPackLoot','food');click(page,'survivalPackLeave');click(page,'survivalTab','thinking');searched=save_slot(page);assert next(p for p in searched['survivalRun']['thinking']['plans'] if p['id']==id)['status']=='completed';assert searched['survivalRun']['kit']['items']['food']==1;assert not errors,errors;page.close();print(path,width,'passed',flush=True)
  browser.close()
finally:server.shutdown();server.server_close()
print('Thinking passed: local goals and dialogue, questions/alternatives saved, consent rechecked, real three-step care, actual supply launch/failure memory, real watch/night outcome, nearby search with actual loot; web/offline mobile/desktop')
