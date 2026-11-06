import http.server,threading
from playwright.sync_api import sync_playwright
from vn_browser_helpers import read_returning_opening,choose,open_tool
class Quiet(http.server.SimpleHTTPRequestHandler):
 def log_message(self,*args):pass
server=http.server.ThreadingHTTPServer(('127.0.0.1',0),Quiet);threading.Thread(target=server.serve_forever,daemon=True).start()
try:
 with sync_playwright() as p:
  b=p.chromium.launch(headless=True,executable_path='/usr/bin/chromium')
  for path in ['/prototype/','/demo/campus-demo.html']:
   for width,height in [(390,844),(1440,1000)]:
    page=b.new_page(viewport={'width':width,'height':height});errors=[];page.on('pageerror',lambda e:errors.append(str(e)));base=f'http://127.0.0.1:{server.server_port}';page.goto(base+path);read_returning_opening(page);page.locator('[data-action="courseConfirm"]').click()
    open_tool(page,'calendar');assert page.locator('.page-reading article.list').count()==14
    if path=='/prototype/' and width==1440:page.screenshot(path='docs/assets/fortnight-calendar-preview.png',full_page=True)
    # Build later saves by actually advancing the domain from day1, then load via game UI.
    for target in [6,8,14]:
     fixture=page.evaluate('''async ({base,target})=>{const sim=await import(base+'/prototype/simulation.js'),t=await import(base+'/prototype/timetable.js'),free=await import(base+'/prototype/free-roam.js');let s=sim.newReturningGame();s=t.confirmRegistration(s,t.registeredCourseIds(s));while(s.day<target){s=free.goHome(s);s=sim.nextDay(s);}s=free.advanceFreeTime(s,800-s.clock.minute);return s;}''',{'base':base,'target':target})
     page.evaluate("s=>localStorage.setItem('campus.slot.1',JSON.stringify(s))",fixture)
     page.locator('[data-action="openQuick"]').first.click();page.locator('[data-action="quickTab"][data-value="save"]').click();page.locator('[data-action="load"][data-value="1"]').click();page.locator('[data-action="closeQuick"]').click() if page.locator('[data-action="closeQuick"]').count() else None
     if not page.locator('.vn-stage').count():page.locator('[data-action="go"][data-value="campus"]').first.click()
     if not page.locator('.vn-stage').count():page.locator('[data-action="go"][data-value="campus"]').first.click()
     open_tool(page,'calendar');page.locator('[data-action="visit"]').first.click()
     if page.locator('.vn-stage').get_attribute('data-vn-screen')=='encounter':choose(page,'encounter','pass')
     choose(page,'openFortnight')
     page.locator('[data-action="fortnightChoice"]').first.click();page.locator('[data-action="fortnightChoice"][data-value="finish"]').click();assert not page.locator('[data-action="fortnightChoice"]').count()
     page.locator('[data-action="openQuick"]').first.click();page.locator('[data-action="quickTab"][data-value="save"]').click();page.locator('[data-action="save"][data-value="2"]').click()
     saved=page.evaluate("JSON.parse(localStorage.getItem('campus.slot.2'))");assert saved['day']==target and saved['fortnightLife'][str(target)]['done'];page.locator('[data-action="closeQuick"]').click() if page.locator('[data-action="closeQuick"]').count() else None
    assert not errors,errors;page.close()
  b.close()
finally:server.shutdown();server.server_close()
print('Fortnight UI passed: both builds mobile/desktop,14day calendar, weekend/week2/day14 activities, saves')
