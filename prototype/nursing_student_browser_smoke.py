"""Jian outfits, three CGs, six SD states, real events and a genuinely extracted offline ZIP."""
import http.server,threading,json,subprocess,tempfile,zipfile,functools
from pathlib import Path
from playwright.sync_api import sync_playwright
from vn_browser_helpers import confirm_returning_plan,choose,read_to_choices,open_tool
class Quiet(http.server.SimpleHTTPRequestHandler):
 def log_message(self,*args):pass
server=http.server.ThreadingHTTPServer(('127.0.0.1',0),Quiet);threading.Thread(target=server.serve_forever,daemon=True).start()
def fixture(kind):
 return json.loads(subprocess.check_output(['node','--input-type=module','-e',"import {newAfternoonScenario} from './prototype/simulation.js';import {beginPersonalEvent,progressPersonalEvent} from './prototype/personal-events.js';let s=newAfternoonScenario('close');s.location='library';s.clock.minute=840;if(process.argv[1]==='break'){s=progressPersonalEvent(beginPersonalEvent(s,'nursing-student:book'),'names');s=progressPersonalEvent(s,'leave');s.day=2;s.clock.minute=960;s.location='cafe';}console.log(JSON.stringify(s));",kind],text=True))
def click(p,a,v=None):p.locator(f'[data-action="{a}"]'+(f'[data-value="{v}"]' if v else '')).first.click()
def load(p,s):
 p.evaluate("s=>localStorage.setItem('campus.slot.1',JSON.stringify(s))",s);p.reload();p.locator('.opening-tools [data-action="openQuick"]').click();click(p,'load','1');p.locator('[data-navigation-back]').first.click();open_tool(p,'travel');p.locator('#travel-search').fill('창조관 · 도서관' if s['location']=='library' else '대학가 카페');p.locator(f'[data-action="visit"][data-value="{s["location"]}"]').click()
 if p.locator('.vn-stage').get_attribute('data-vn-screen')=='encounter':choose(p,'encounter','pass')
def decode(n,pseudo=None):return n.evaluate("async (n,pseudo)=>{const im=new Image();im.src=getComputedStyle(n,pseudo).backgroundImage.slice(5,-2);await im.decode();return [im.naturalWidth,im.naturalHeight];}",pseudo)
try:
 with tempfile.TemporaryDirectory(prefix='campus-jian-offline-') as temp:
  with zipfile.ZipFile('demo/campus-demo.zip') as z:assert z.testzip() is None;z.extractall(temp)
  extracted=http.server.ThreadingHTTPServer(('127.0.0.1',0),functools.partial(Quiet,directory=temp));threading.Thread(target=extracted.serve_forever,daemon=True).start()
  with sync_playwright() as pw:
   b=pw.chromium.launch(headless=True,executable_path='/usr/bin/chromium')
   probe=b.new_page();probe.set_default_navigation_timeout(60000)
   try:
    probe.goto((Path(temp)/'campus-demo.html').as_uri());offline_mode='file';offline_url=(Path(temp)/'campus-demo.html').as_uri()
   except Exception as error:
    if 'ERR_BLOCKED_BY_ADMINISTRATOR' not in str(error):raise
    print('file:// navigation blocked by environment policy; verifying extracted ZIP over localhost',flush=True);offline_mode='extracted';offline_url=f'http://127.0.0.1:{extracted.server_port}/campus-demo.html'
   probe.close()
   for mode,url in [('web',f'http://127.0.0.1:{server.server_port}/prototype/'),('bundled',f'http://127.0.0.1:{server.server_port}/demo/campus-demo.html'),(offline_mode,offline_url)]:
    for width,height in [(390,844),(1440,1000)]:
     p=b.new_page(viewport={'width':width,'height':height},reduced_motion='reduce');p.set_default_timeout(15000);p.set_default_navigation_timeout(60000);errors=[];http=[];p.on('pageerror',lambda e:errors.append(str(e)));p.on('request',lambda r:http.append(r.url) if r.url.startswith(('http://','https://')) else None);p.goto(url);confirm_returning_plan(p)
     for kind in ['book','break']:
      load(p,fixture(kind));choose(p,'openPersonalEvent','nursing-student:'+kind);layer=p.locator('.event-cutscene');assert layer.is_visible();assert decode(layer.locator('.illustrated-cutscene'))==[1536,1024]
      if kind=='book':assert '백지안' not in p.locator('.vn-stage').inner_text()
      read_to_choices(p);choose(p,'personalEventChoice','names' if kind=='book' else 'rest');assert not p.locator('.event-cutscene').count();assert decode(p.locator('[data-actor="nursingStudent"]'))==[1024,1536];click(p,'vnNext');assert p.locator('.event-cutscene').is_visible()
      if kind=='book':assert p.locator('.vn-speaker').inner_text()=='백지안'
      p.wait_for_timeout(100);box=p.locator('.illustrated-cutscene').bounding_box();panel=p.locator('.vn-panel').bounding_box();assert box['y']+box['height']<=panel['y']+1
      if mode=='web':p.screenshot(path=f'/workspace/work/jian-{kind}-{width}.png',full_page=True)
      read_to_choices(p);choose(p,'personalEventChoice','leave' if kind=='book' else 'quiet');read_to_choices(p);assert not p.locator('.event-cutscene').count();choose(p,'pausePersonalEvent')
     open_tool(p,'characterArt');assert p.locator('.nursing-student-concept h2').inner_text()=='백지안'
     for outfit in ['jacket','plain']:click(p,'nursingOutfit',outfit);assert decode(p.locator('.nursing-student-art'))==[1024,1536]
     for cg in ['library','rest','home']:click(p,'nursingCg',cg);assert p.locator('.nursing-cg').get_attribute('data-cg')==cg;assert decode(p.locator('.nursing-cg'))==[1536,1024]
     for outfit in ['jacket','plain']:
      click(p,'nursingSdOutfit',outfit)
      for mood in ['neutral','happy','guarded']:click(p,'nursingSdMood',mood);assert decode(p.locator('.nursing-sd'))==[1536,1024]
     assert p.locator('.nursing-sd').evaluate("async n=>{const im=new Image();im.src=getComputedStyle(n).backgroundImage.slice(5,-2);await im.decode();const c=document.createElement('canvas');c.width=1536;c.height=1024;const x=c.getContext('2d');x.drawImage(im,0,0);for(let y=0;y<2;y++)for(let z=0;z<3;z++){const d=x.getImageData(z*512,y*512,512,512).data;let clear=0,solid=0;for(let i=3;i<d.length;i+=4){if(d[i]===0)clear++;if(d[i]>=240)solid++;}if(clear/262144<.5||solid/262144<.12)return false;}return true;}")
     assert p.locator('[data-height-character="nursingStudent"]').count();assert '22살' in p.locator('[data-height-character="nursingStudent"]').inner_text();assert p.evaluate('document.documentElement.scrollWidth<=innerWidth+1');assert not errors,errors
     if mode=='file':assert not http,http
     else:assert all(u.startswith('http://127.0.0.1:') for u in http),http
     if mode=='web':p.locator('.nursing-student-concept').screenshot(path=f'/workspace/work/jian-gallery-{width}.png')
     p.close();print(mode,width,'passed',flush=True)
   b.close()
  extracted.shutdown();extracted.server_close()
finally:server.shutdown();server.server_close()
print('Jian passed: 2 actual named events, 2 outfits, 3 CGs including home phone, 6 transparent SD cells, foot clearance, web and extracted ZIP, no external network; file URL tested when environment policy permits')
