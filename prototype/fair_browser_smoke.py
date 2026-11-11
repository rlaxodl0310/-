import http.server, threading, sys
from pathlib import Path
from playwright.sync_api import sync_playwright
from vn_browser_helpers import confirm_returning_plan, choose, read_to_choices, open_tool
class Quiet(http.server.SimpleHTTPRequestHandler):
 def log_message(self,*args): pass
server=http.server.ThreadingHTTPServer(('127.0.0.1',0),Quiet)
threading.Thread(target=server.serve_forever,daemon=True).start()
base=f'http://127.0.0.1:{server.server_port}'
ids=['jihoo','naeun','dohyun','dayeon','chaerin','junseo']
places={'headquarters':'본부동','cafeteria':'외식관','arts':'예술동','gym':'체육관','creative':'창조관'}
try:
 with sync_playwright() as p:
  browser=p.chromium.launch(headless=True,executable_path='/usr/bin/chromium')
  seedpage=browser.new_page();seedpage.goto(base+'/prototype/')
  fixtures={}
  for actor in ids:
   fixtures[actor]=seedpage.evaluate("""async ({base,id})=>{const sim=await import(base+'/prototype/simulation.js'),fair=await import(base+'/prototype/fair-events.js');const s=sim.newAfternoonScenario();s.day=fair.fairVisitDay(s);s.clock.minute=610;s.location=fair.fairStudentLocation(s,id);return s;}""",{'base':base,'id':actor})
  seedpage.close()
  paths=['/prototype/','/demo/campus-demo.html']
  if '--local-file' in sys.argv:paths.append(Path('demo/campus-demo.html').resolve().as_uri())
  for path in paths:
   for width in [390,1440]:
    page=browser.new_page(viewport={'width':width,'height':844 if width==390 else 900},reduced_motion='reduce');errors=[];page.on('pageerror',lambda e:errors.append(str(e)));page.set_default_timeout(10000)
    for actor in ids:
     s=fixtures[actor];page.goto(path if path.startswith('file:') else base+path);confirm_returning_plan(page)
     page.evaluate("s=>localStorage.setItem('campus.slot.1',JSON.stringify(s))",s);page.reload();page.locator('.opening-tools [data-action="openQuick"]').click();page.locator('[data-action="load"][data-value="1"]').click();page.locator('[data-navigation-back]').first.click()
     open_tool(page,'travel');page.locator('#travel-search').fill(places[s['location']]);page.locator(f'[data-action="visit"][data-value="{s["location"]}"]').click()
     if page.locator('.vn-stage').get_attribute('data-vn-screen')=='encounter':choose(page,'encounter','pass')
     choose(page,'openPersonalEvent',actor+':fair:1')
     portrait=page.locator(f'.portrait[data-actor="{actor}"]');assert portrait.is_visible(),actor
     expected_art=('fair-'+actor+'-acting.png') if actor in ids[:3] else 'fair-extra-acting.png'
     if path=='/prototype/':assert expected_art in portrait.evaluate('n=>getComputedStyle(n).backgroundImage'),actor
     assert portrait.evaluate('n=>getComputedStyle(n).backgroundSize')==('300% 200%' if actor in ids[:3] else '300% 300%'),actor
     if actor in ids[3:]:assert portrait.evaluate('n=>getComputedStyle(n).backgroundPositionX')==str(ids[3:].index(actor)*50)+'%'
     assert portrait.evaluate("async n=>{let i=new Image();i.src=getComputedStyle(n).backgroundImage.slice(5,-2);await i.decode();return i.naturalWidth>1000;}")
     if path=='/prototype/' and width==390:page.screenshot(path=f'/tmp/fair-{actor}-portrait.png',full_page=True)
     choose(page,'personalEventChoice','dismiss' if actor=='junseo' else 'help');read_to_choices(page)
     layer=page.locator('.event-cutscene');assert layer.is_visible(),actor
     assert layer.locator('[data-sd-actor]').evaluate_all('(ns)=>ns.map(n=>n.dataset.sdActor)')==['taei',actor]
     assert layer.locator(f'[data-sd-actor="{actor}"]').get_attribute('data-sd-atlas')==('fair' if actor in ids[:3] else 'fair-extra')
     assert layer.locator('.sd-cast-sprite').last.evaluate("async n=>{let i=new Image();i.src=getComputedStyle(n).backgroundImage.slice(5,-2);await i.decode();return i.naturalWidth>900;}")
     if actor=='junseo':assert layer.get_attribute('data-tone')=='guarded'
     art=layer.locator('.event-cutscene-art').bounding_box();panel=page.locator('.vn-panel').bounding_box();assert art['y']+art['height']<=panel['y']+2
     assert page.evaluate('document.documentElement.scrollWidth<=innerWidth+1')
     if path=='/prototype/' and width==390:page.screenshot(path=f'/tmp/fair-{actor}-pixel.png',full_page=True)
     choose(page,'personalEventChoice','names');read_to_choices(page)
     open_tool(page,'peopleRecord');assert page.locator(f'[data-profile="{actor}"]').is_visible();assert '천안 해솔고등학교' in page.locator('#app').inner_text()
     if actor in ids[:3]:
      page.locator('[data-navigation-back]').first.click();page.locator('[data-action="go"][data-value="personalStories"]').click();assert page.locator('.fair-story-pixel').is_visible()
      assert page.locator('.fair-story-pixel').evaluate("async n=>{let i=new Image();i.src=getComputedStyle(n).backgroundImage.slice(5,-2);await i.decode();return i.naturalWidth>900;}")
     assert not errors,(actor,path,errors)
    page.close()
  browser.close()
finally: server.shutdown();server.server_close()
print('Six visitors passed web/offline mobile/desktop: actual meetings, portraits, introductions, guarded reaction, pixel banks, profiles and no overflow')
