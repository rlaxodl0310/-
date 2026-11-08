import http.server,threading
from playwright.sync_api import sync_playwright
from vn_browser_helpers import confirm_returning_plan,choose
class Quiet(http.server.SimpleHTTPRequestHandler):
 def log_message(self,*args):pass
server=http.server.ThreadingHTTPServer(('127.0.0.1',0),Quiet);threading.Thread(target=server.serve_forever,daemon=True).start()
try:
 with sync_playwright() as p:
  browser=p.chromium.launch(headless=True,executable_path='/usr/bin/chromium')
  for path in ['/prototype/','/demo/campus-demo.html']:
   for width in [390,1440]:
    page=browser.new_page(viewport={'width':width,'height':900});errors=[];page.on('pageerror',lambda e:errors.append(str(e)));base=f'http://127.0.0.1:{server.server_port}';page.goto(base+path);confirm_returning_plan(page)
    for place,room,index in [('arts','classes',0),('arts','band',1),('gym','basement',2),('creative','fashion',3),('creative','nursing',4),('creative','art',5),('sculpture','dentalPractice',6),('gym','court',7),('gym','fitness',8),('academic','classes',9),('hall','clubs',13),('cafeteria','kitchen',14),('baekseok',None,15),('dorm',None,16),('library',None,17)]:
     fixture=page.evaluate("async ({base,place,room})=>{const m=await import(base+'/prototype/simulation.js');const s=m.newReturningGame();s.opening={step:3,done:true};s.academics.registrationPending=false;s.location=place;s.buildingArea=room?{place,id:room}:null;return s;}",{'base':base,'place':place,'room':room})
     page.evaluate("s=>localStorage.setItem('campus.slot.1',JSON.stringify(s))",fixture);page.reload();page.locator('.opening-tools [data-action="openQuick"]').click();page.locator('[data-action="load"][data-value="1"]').click();page.locator('[data-navigation-back="true"]').click()
     art=page.locator('.place-backdrop');assert art.get_attribute('data-interior')==str(index),(place,room);assert art.evaluate("async n=>{let i=new Image();i.src=getComputedStyle(n).backgroundImage.slice(5,-2);await i.decode();return i.naturalWidth>1000;}")
     assert page.evaluate('document.documentElement.scrollWidth<=innerWidth+1')
     if path=='/prototype/' and width==1440 and index in [0,3]:page.screenshot(path=f'docs/assets/interior-{place}-preview.png')
    assert not errors,errors;page.close()
  browser.close()
finally:server.shutdown();server.server_close()
print('Interior backgrounds passed: 15 room types, correct atlas loading, source/offline builds, mobile/desktop')
