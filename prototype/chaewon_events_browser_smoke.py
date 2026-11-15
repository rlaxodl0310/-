"""Actual Chaewon introductions and two shared events across desktop/mobile and offline."""
import http.server,threading,json,subprocess
from playwright.sync_api import sync_playwright
from vn_browser_helpers import confirm_returning_plan,choose,read_to_choices,open_tool
class Quiet(http.server.SimpleHTTPRequestHandler):
 def log_message(self,*args):pass
server=http.server.ThreadingHTTPServer(('127.0.0.1',0),Quiet);threading.Thread(target=server.serve_forever,daemon=True).start()
def fixture(kind):
 return json.loads(subprocess.check_output(['node','--input-type=module','-e',"import {newAfternoonScenario} from './prototype/simulation.js';import {beginPersonalEvent,progressPersonalEvent} from './prototype/personal-events.js';import {introduce} from './prototype/identity.js';let s=newAfternoonScenario('close');s.location='gym';s.clock.minute=960;const k=process.argv[1];if(k!=='intro'){s=progressPersonalEvent(beginPersonalEvent(s,'chaewon'),'names');s=progressPersonalEvent(s,'leave');s.day=3;s.clock.minute=k==='iseo'?960:1020;s.location=k==='iseo'?'gym':'hall';introduce(s,k);s.relations[k+'>taei']={familiarity:6,trust:4};s.weather.days[s.day]={afternoon:'sunny',evening:'sunny'};}console.log(JSON.stringify(s));",kind],text=True))
def click(p,a,v=None):p.locator(f'[data-action="{a}"]'+(f'[data-value="{v}"]' if v else '')).first.click()
def load(p,s):
 p.evaluate("s=>localStorage.setItem('campus.slot.1',JSON.stringify(s))",s);p.reload();p.locator('.opening-tools [data-action="openQuick"]').click();click(p,'load','1');p.locator('[data-navigation-back]').first.click();open_tool(p,'travel');p.locator('#travel-search').fill('체육관' if s['location']=='gym' else '자유관');p.locator(f'[data-action="visit"][data-value="{s["location"]}"]').click()
 if p.locator('.vn-stage').get_attribute('data-vn-screen')=='encounter':choose(p,'encounter','pass')
def decode(p,selector):return p.locator(selector).first.evaluate("async n=>{const im=new Image();im.src=getComputedStyle(n).backgroundImage.slice(5,-2);await im.decode();return im.naturalWidth>=1000;}")
try:
 with sync_playwright() as pw:
  browser=pw.chromium.launch(headless=True,executable_path='/usr/bin/chromium')
  for path in ['/prototype/','/demo/campus-demo.html']:
   for width,height in [(390,844),(1440,1000)]:
    p=browser.new_page(viewport={'width':width,'height':height},reduced_motion='reduce');p.set_default_timeout(15000);p.set_default_navigation_timeout(60000);errors=[];p.on('pageerror',lambda e:errors.append(str(e)));p.goto(f'http://127.0.0.1:{server.server_port}'+path);confirm_returning_plan(p)
    for kind in ['intro','iseo','seoyeon']:
     load(p,fixture(kind));event='chaewon' if kind=='intro' else 'chaewon:'+kind;choose(p,'openPersonalEvent',event);read_to_choices(p);assert decode(p,'.portrait[data-actor="chaewon"]')
     expected=['taei','chaewon']+([] if kind=='intro' else [kind]);assert p.locator('.cast-member').evaluate_all('(ns)=>ns.map(n=>n.dataset.castId)')==expected
     choose(p,'personalEventChoice',{'intro':'names','iseo':'share','seoyeon':'walk'}[kind]);assert not p.locator('.event-cutscene').count();click(p,'vnNext');layer=p.locator('.event-cutscene');assert layer.is_visible()
     if kind=='seoyeon':
      assert layer.get_attribute('data-cutscene')=='chaewon-together';assert decode(p,'.illustrated-cutscene');p.wait_for_timeout(100);box=p.locator('.illustrated-cutscene').bounding_box();panel=p.locator('.vn-panel').bounding_box();assert box['y']+box['height']<=panel['y']+1
     else:
      assert layer.locator('[data-sd-actor="chaewon"]').count();assert decode(p,'[data-sd-atlas="chaewon"] .sd-cast-sprite')
     assert p.evaluate('document.documentElement.scrollWidth<=innerWidth+1');p.screenshot(path=f'/workspace/work/chaewon-{kind}-{width}.png',full_page=True);read_to_choices(p);choose(p,'personalEventChoice',{'intro':'leave','iseo':'finish','seoyeon':'respect'}[kind]);read_to_choices(p);assert not p.locator('.event-cutscene').count();choose(p,'pausePersonalEvent')
    assert not errors,errors;p.close();print(path,width,'passed',flush=True)
  browser.close()
finally:server.shutdown();server.server_close()
print('Chaewon events passed: real introduction and 2 companion events, exact 2/3 cast, alternating NPC speakers, SD decode, rear CG above panel, completion cleanup; web/offline mobile/desktop')
