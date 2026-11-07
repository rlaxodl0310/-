import http.server,threading
from playwright.sync_api import sync_playwright
from vn_browser_helpers import confirm_returning_plan,choose,read_to_choices,open_tool
class Quiet(http.server.SimpleHTTPRequestHandler):
 def log_message(self,*args):pass
server=http.server.ThreadingHTTPServer(('127.0.0.1',0),Quiet);threading.Thread(target=server.serve_forever,daemon=True).start()
scenes=[('taei','sound','arts',0),('yeogyeong:2','taste','hall',1),('seoyeon:2','rock','cafeteria',2),('soyul','permission','library',3),('iseo:2','playful','field',4),('dogyeom','pass','outdoorCourt',5)]
try:
 with sync_playwright() as p:
  browser=p.chromium.launch(headless=True,executable_path='/usr/bin/chromium')
  for path in ['/prototype/','/demo/campus-demo.html']:
   for width in [390,1440]:
    page=browser.new_page(viewport={'width':width,'height':844 if width==390 else 900},reduced_motion='reduce');page.set_default_timeout(10000);errors=[];page.on('pageerror',lambda e:errors.append(str(e)));base=f'http://127.0.0.1:{server.server_port}';page.goto(base+path);confirm_returning_plan(page)
    for event,choice,place,index in scenes:
     fixture=page.evaluate("""async ({base,event,choice,place})=>{const sim=await import(base+'/prototype/simulation.js'),identity=await import(base+'/prototype/identity.js');let s=sim.newAfternoonScenario('close');s.day=event==='iseo:2'?9:8;s.clock.minute=['field','outdoorCourt'].includes(place)?1020:780;s.location=place;const person=event.split(':')[0];if(!['taei','dogyeom'].includes(person))identity.introduce(s,person);s.personalEvents={active:event,records:{}};if(event.includes(':'))s.personalEvents.records[person]={person,eventId:person,status:'completed',completedDay:s.day-1,choices:[]};s.personalEvents.records[event]={eventId:event,person,episode:event.includes(':')?2:1,status:'active',stage:1,day:s.day,location:place,until:s.clock.minute+30,choices:[choice],context:{mood:'steady',close:false,trusted:false},game:{result:'tie'},last:{player:'잠깐 함께 시간을 보낸다.',text:'하하. 이런 순간도 괜찮네요.'}};return s;}""",{'base':base,'event':event,'choice':choice,'place':place})
     page.evaluate("s=>localStorage.setItem('campus.slot.1',JSON.stringify(s))",fixture);page.reload();page.locator('.opening-tools [data-action="openQuick"]').click();page.locator('[data-action="load"][data-value="1"]').click();page.locator('[data-navigation-back]').first.click()
     open_tool(page,'travel');page.locator('#travel-search').fill({'arts':'예술동','hall':'자유관','cafeteria':'외식관','cafe':'대학가 카페','library':'창조관 · 도서관','field':'운동장','outdoorCourt':'야외 코트'}[place]);page.locator(f'[data-action="visit"][data-value="{place}"]').click()
     if page.locator('.vn-stage').get_attribute('data-vn-screen')=='encounter':choose(page,'encounter','pass')
     choose(page,'openPersonalEvent',event)
     # Player's line keeps standard portraits; the NPC reply reveals the SD CG.
     if event!='taei':assert page.locator('.event-cutscene').count()==0
     page.locator('[data-action="vnNext"]').click()
     layer=page.locator('.event-cutscene');assert layer.is_visible(),(event,path,width)
     assert layer.get_attribute('data-cutscene')=='chibi:'+event
     art=layer.locator('.event-cutscene-art');assert art.evaluate("async n=>{let i=new Image();i.src=getComputedStyle(n).backgroundImage.slice(5,-2);await i.decode();return i.naturalWidth>1000;}")
     assert art.evaluate('n=>getComputedStyle(n).backgroundPosition')==f'{index%2*100}% {index//2*50}%'
     box=art.bounding_box();panel=page.locator('.vn-panel').bounding_box();assert box['y']+box['height']<=panel['y']+2,(event,width,box,panel)
     assert page.evaluate('document.documentElement.scrollWidth<=innerWidth+1')
     if path=='/prototype/':page.screenshot(path=f'docs/assets/chibi-{event.replace(":","-")}-{width}-preview.png',full_page=True)
     # Back through the player's line hides it without changing the event's choices/time.
     if event!='taei':
      page.locator('[data-action="vnPrevious"]').click();assert page.locator('.event-cutscene').count()==0
      page.locator('[data-action="vnNext"]').click();assert layer.is_visible()
     read_to_choices(page)
     box=art.bounding_box();panel=page.locator('.vn-panel').bounding_box();assert box['y']+box['height']<=panel['y']+2,(event,width,box,panel)
    assert not errors,errors;page.close()
  browser.close()
finally:server.shutdown();server.server_close()
print('Six SD cutscenes passed: web/offline, mobile/desktop, correct panels, image decode, read/back and dialogue clearance')
