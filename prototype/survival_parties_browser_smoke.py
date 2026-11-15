"""Consent scenes, solo/six-person combat, and simultaneous party operations."""
import http.server,threading,json,subprocess,copy,os
from playwright.sync_api import sync_playwright
from vn_browser_helpers import confirm_returning_plan
class Quiet(http.server.SimpleHTTPRequestHandler):
 def log_message(self,*args):pass
server=http.server.ThreadingHTTPServer(('127.0.0.1',0),Quiet);threading.Thread(target=server.serve_forever,daemon=True).start()
routes=json.loads(subprocess.check_output(['node','--input-type=module','-e',"import {soloPartyRoute,sixPartyRoute} from './prototype/survival-parties-fixtures.js';console.log(JSON.stringify({solo:soloPartyRoute,six:sixPartyRoute}))"],text=True))
def click(page,action,value=None):
 if action=='combatLoot' and page.locator('.shop-objectives').count():page.locator('.shop-objectives [data-action="combatLoot"]').click();return
 page.locator(f'[data-action="{action}"]'+(f'[data-value="{value}"]' if value is not None else '')).first.click()
def save_slot(page):
 click(page,'openQuick');click(page,'quickTab','save');click(page,'save','1');s=page.evaluate("JSON.parse(localStorage.getItem('campus.slot.1'))");click(page,'closeQuick');return s
def load(page,state=None,combat=False):
 if state is not None:page.evaluate("s=>localStorage.setItem('campus.slot.1',JSON.stringify(s))",state)
 page.reload();page.locator('.opening-tools [data-action="openQuick"]').click();click(page,'load','1');click(page,'quickTab','tools');click(page,'go','survival')
 if combat:click(page,'survivalResume')
def route(page,steps,resume=False):
 for i,(key,*args) in enumerate(steps):
  if os.environ.get('PARTY_DEBUG'):print('STEP',i,key,args,flush=True)
  if key=='end':click(page,'combatEndTurn')
  elif key=='packLeave':
   click(page,'combatPackLeave')
   if resume:save_slot(page);load(page,combat=True)
   continue
  else:
   action=args[0];target=args[1] if len(args)>1 else None;click(page,'combatActor',key)
   if action=='move':
    if os.environ.get('PARTY_DEBUG'):print('SELECTED',page.locator('.tactic-card.selected').inner_text(),flush=True)
    click(page,'combatMode','move');click(page,'combatTile',f'{target["x"]},{target["y"]}')
   elif action in ['strike','shove']:click(page,'combatMode',action);click(page,'combatEnemy',str(target['id']))
   else:click(page,{'door':'combatDoor','guard':'combatGuard','loot':'combatLoot'}[action])
  page.wait_for_function("document.querySelector('.tactical-board')?.dataset.busy==='false'");assert page.locator('.tactical-error').count()==0
  if page.locator('.supply-debate').count():click(page,'combatSupplyDecision','withdraw')
  if resume and key=='packLeave':save_slot(page);load(page,combat=True)
try:
 with sync_playwright() as p:
  browser=p.chromium.launch(headless=True,executable_path='/usr/bin/chromium')
  for path in ['/prototype/','/demo/campus-demo.html']:
   for width,height in [(390,844),(1440,1000)]:
    page=browser.new_page(viewport={'width':width,'height':height},reduced_motion='reduce');page.set_default_timeout(12000);errors=[];page.on('pageerror',lambda e:errors.append(str(e)));page.goto(f'http://127.0.0.1:{server.server_port}'+path);confirm_returning_plan(page);click(page,'openQuick');click(page,'go','survival');assert page.locator('#survival-companion').count()==0;click(page,'survivalStart');initial=save_slot(page);assert len(initial['survivalRun']['members'])==1
    click(page,'survivalSortie','escape');assert page.locator('.tactic-card').count()==1;route(page,routes['solo']);assert '파티 전원' in page.locator('.tactical-finish').inner_text();click(page,'survivalReturn');assert save_slot(page)['survivalRun']['escapes']==1
    # A known person's high affection is insufficient without trust. Real conversation/help follows.
    s=copy.deepcopy(initial);r=s['survivalRun'];r.update({'day':4,'stage':'base','actions':3,'base':{'site':'basement','integrity':90,'exposure':0,'facilities':['annex']},'resources':{'food':50,'water':50,'bandage':5,'parts':10}});s['contacts']['seoyeon']={'introduced':True,'nameLevel':'full'};s['characterSystem']['presence']['yeogyeong']=False;s['characterSystem']['presence']['seoyeon']=True;s['relations']['seoyeon>taei']={'familiarity':90,'trust':0,'affection':95,'tension':0};load(page,s);click(page,'survivalTab','parties');click(page,'survivalPartyMeet');seen=save_slot(page);assert seen['survivalRun']['parties']['meeting']=='seoyeon';click(page,'survivalPartyInvite');assert '믿고' in page.locator('.party-answer').inner_text();refused=save_slot(page);assert len(refused['survivalRun']['members'])==1;load(page);click(page,'survivalTab','parties');assert page.locator('[data-action="survivalPartyInvite"]').is_disabled()
    click(page,'survivalTab','overview');click(page,'survivalNextDay');click(page,'survivalTab','parties');page.locator('#party-revisit').select_option('seoyeon');click(page,'survivalPartyRevisit');click(page,'survivalPartyTalk','listen');click(page,'survivalPartyTalk','help');click(page,'survivalPartyInvite');joined=save_slot(page);assert len(joined['survivalRun']['members'])==2;assert joined['survivalRun']['members'][1]['partyConsent'];assert joined['survivalRun']['parties']['invites'][-1]['accepted']
    if path=='/prototype/':page.screenshot(path=f'/workspace/work/party-joined-{width}.png',full_page=True)
    # Extra previously consenting residents form six-person player squad and two separate teams.
    s=copy.deepcopy(joined);r=s['survivalRun'];r['day']=6;r['actions']=3;r['resources']={'food':50,'water':50,'bandage':5,'parts':10};r['kit']['pending']=None
    for i in range(2,8):
     m=copy.deepcopy(r['members'][0]);m.update({'key':'member-'+str(i),'character':'student','label':'학생 '+str(i),'partyConsent':True,'recruitId':'test-'+str(i)});r['members'].append(m)
    for m in r['members']:m.update({'attributes':{'strength':4,'agility':4,'vitality':4,'endurance':4,'mentality':4},'fatigue':15,'stress':20,'injury':0,'nutrition':80,'hydration':80})
    load(page,s);click(page,'survivalTab','parties')
    for i in range(2,6):page.locator('#party-destination-member-'+str(i)).select_option('party-1');click(page,'survivalPartyMove','member-'+str(i))
    assert page.locator('[data-party-id="party-1"] header strong').inner_text()=='6/6명';assert page.locator('#party-destination-member-6 option[value="party-1"]').is_disabled()
    for i,name in [(6,'보급팀'),(7,'경계팀')]:page.locator('#party-new-member').select_option('member-'+str(i));page.locator('#party-new-name').fill(name);click(page,'survivalPartyCreate')
    page.locator('#party-mission-party-2').select_option('supply');click(page,'survivalPartyDispatch','party-2');page.locator('#party-mission-party-3').select_option('guard');click(page,'survivalPartyDispatch','party-3');deployed=save_slot(page);assert len(deployed['survivalRun']['parties']['groups'])==3;assert sum(bool(g['mission']) for g in deployed['survivalRun']['parties']['groups'])==2
    if path=='/prototype/':page.screenshot(path=f'/workspace/work/party-management-{width}.png',full_page=True)
    click(page,'survivalTab','overview');click(page,'survivalShopBrief','kiosk');click(page,'survivalSortie','kiosk');assert page.locator('.tactic-card').count()==6
    if path=='/prototype/':page.screenshot(path=f'/workspace/work/party-six-{width}.png',full_page=True)
    route(page,routes['six'],resume=True);won=save_slot(page);assert won['combatTrial']['status']=='escaped';assert len(won['combatTrial']['actors'])==6;assert all(a['escaped'] for a in won['combatTrial']['actors'].values());load(page,combat=True);click(page,'survivalReturn');click(page,'survivalNextDay');done=save_slot(page);assert len(done['survivalRun']['parties']['reports'])==2;assert all(p['success'] for p in done['survivalRun']['parties']['reports']);assert all(not m.get('deployment') for m in done['survivalRun']['members']);click(page,'survivalTab','parties');assert '보급팀' in page.locator('.party-reports').inner_text();assert '경계팀' in page.locator('.party-reports').inner_text();assert page.evaluate('document.documentElement.scrollWidth<=innerWidth+1');assert not errors,errors;page.close();print(path,width,'passed',flush=True)
  browser.close()
finally:server.shutdown();server.server_close()
print('Parties passed: solo live escape, affection/trust refusal and saved answer, actual help/consent, 1–6 roster, three parties, six live actors escaping, saved combat, parallel team results; web/offline mobile/desktop')
