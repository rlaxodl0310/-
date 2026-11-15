"""Real Iseo walk and volleyball choices show CGs only on their actual NPC reply."""
import http.server,threading,json,subprocess
from playwright.sync_api import sync_playwright
from vn_browser_helpers import confirm_returning_plan,choose,read_to_choices,open_tool
class Quiet(http.server.SimpleHTTPRequestHandler):
 def log_message(self,*args):pass
server=http.server.ThreadingHTTPServer(('127.0.0.1',0),Quiet);threading.Thread(target=server.serve_forever,daemon=True).start()
def fixture(volleyball):
 return json.loads(subprocess.check_output(['node','--input-type=module','-e',"import {newAfternoonScenario} from './prototype/simulation.js';import {introduce} from './prototype/identity.js';const s=newAfternoonScenario('close');s.day=6;s.location='gym';s.clock.minute=960;s.weather.days[6]={afternoon:'sunny',evening:'sunny'};if(process.argv[1]==='yes'){introduce(s,'iseo','fixture');s.personalEvents={active:null,records:{'iseo:3':{eventId:'iseo:3',person:'iseo',status:'completed',completedDay:5,choices:['music','thanks']}}};}console.log(JSON.stringify(s));",'yes' if volleyball else 'no'],text=True))
def click(p,a,v=None):p.locator(f'[data-action="{a}"]'+(f'[data-value="{v}"]' if v else '')).first.click()
def load(p,s):
 p.evaluate("s=>localStorage.setItem('campus.slot.1',JSON.stringify(s))",s);p.reload();p.locator('.opening-tools [data-action="openQuick"]').click();click(p,'load','1');p.locator('[data-navigation-back]').first.click();open_tool(p,'travel');p.locator('#travel-search').fill('체육관');p.locator('[data-action="visit"][data-value="gym"]').click()
 if p.locator('.vn-stage').get_attribute('data-vn-screen')=='encounter':choose(p,'encounter','pass')
def check_cg(p,id,width):
 layer=p.locator('.event-cutscene');assert layer.get_attribute('data-cutscene')==id;assert layer.get_attribute('data-composed')=='false'
 art=layer.locator('.illustrated-cutscene');assert art.evaluate("async n=>{const im=new Image();im.src=getComputedStyle(n).backgroundImage.slice(5,-2);await im.decode();return im.naturalWidth>=1000&&im.naturalWidth>im.naturalHeight;}")
 p.wait_for_timeout(100);box=art.bounding_box();panel=p.locator('.vn-panel').bounding_box();assert box['y']+box['height']<=panel['y']+1,(box,panel);assert p.evaluate('document.documentElement.scrollWidth<=innerWidth+1')
 p.screenshot(path=f'/workspace/work/{id}-{width}.png',full_page=True)
 click(p,'vnPrevious');assert not p.locator('.event-cutscene').count();click(p,'vnNext');assert p.locator('.event-cutscene').is_visible()
 read_to_choices(p)
 if art.count():
  box=art.bounding_box();panel=p.locator('.vn-panel').bounding_box();assert box['y']+box['height']<=panel['y']+1
try:
 with sync_playwright() as pw:
  browser=pw.chromium.launch(headless=True,executable_path='/usr/bin/chromium')
  for path in ['/prototype/','/demo/campus-demo.html']:
   for width,height in [(390,844),(1440,1000)]:
    p=browser.new_page(viewport={'width':width,'height':height},reduced_motion='reduce');p.set_default_timeout(15000);p.set_default_navigation_timeout(60000);errors=[];p.on('pageerror',lambda e:errors.append(str(e)));p.goto(f'http://127.0.0.1:{server.server_port}'+path);confirm_returning_plan(p)
    for volleyball in [False,True]:
     load(p,fixture(volleyball));choose(p,'openPersonalEvent','iseo:4' if volleyball else 'iseo');read_to_choices(p);assert not p.locator('.illustrated-cutscene').count()
     choose(p,'personalEventChoice','feed' if volleyball else 'introduce')
     if not volleyball:read_to_choices(p);choose(p,'personalEventChoice','chat')
     assert not p.locator('.event-cutscene').count();click(p,'vnNext');check_cg(p,'iseo-volleyball' if volleyball else 'iseo-walk',width)
     if volleyball:choose(p,'personalEventChoice','finish');read_to_choices(p);assert not p.locator('.illustrated-cutscene').count()
     choose(p,'pausePersonalEvent');assert not p.locator('.event-cutscene').count()
    open_tool(p,'characterArt');assert p.locator('.gym-student-art').count()==2
    for art in p.locator('.gym-student-art').all():assert art.evaluate("async n=>{const im=new Image();im.src=getComputedStyle(n).backgroundImage.slice(5,-2);await im.decode();return im.naturalWidth===1536;}")
    assert p.evaluate('document.documentElement.scrollWidth<=innerWidth+1');assert not errors,errors;p.close();print(path,width,'passed',flush=True)
  browser.close()
finally:server.shutdown();server.server_close()
print('Iseo CGs passed: real walk and volleyball choices, decoded art, reply-only display, back/next, completed cleanup, full picture above panel; web/offline mobile/desktop')
