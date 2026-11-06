"""Audit every main utility destination at later dates in both distributions."""
import http.server,threading
from playwright.sync_api import sync_playwright
from vn_browser_helpers import confirm_returning_plan
class Quiet(http.server.SimpleHTTPRequestHandler):
 def log_message(self,*args):pass
server=http.server.ThreadingHTTPServer(('127.0.0.1',0),Quiet);threading.Thread(target=server.serve_forever,daemon=True).start()
try:
 with sync_playwright() as p:
  b=p.chromium.launch(headless=True,executable_path='/usr/bin/chromium')
  for path in ['/prototype/','/demo/campus-demo.html']:
   for width in [320,390,1440]:
    page=b.new_page(viewport={'width':width,'height':900});page.set_default_timeout(6000);errors=[];page.on('pageerror',lambda e:errors.append(str(e)));base=f'http://127.0.0.1:{server.server_port}';page.goto(base+path);confirm_returning_plan(page)
    page.locator('[data-action="openQuick"]').first.click();page.locator('[data-value="save"][data-action="quickTab"]').click();page.locator('[data-action="save"][data-value="1"]').click()
    fixture=page.evaluate('''async base=>{const sim=await import(base+'/prototype/simulation.js'),t=await import(base+'/prototype/timetable.js'),free=await import(base+'/prototype/free-roam.js');let s=t.confirmRegistration(sim.newReturningGame(),t.registeredCourseIds(sim.newReturningGame()));while(s.day<8){s=free.goHome(s);s=sim.nextDay(s);}return s;}''',base)
    page.evaluate("s=>localStorage.setItem('campus.slot.1',JSON.stringify(s))",fixture)
    page.locator('[data-action="load"][data-value="1"]').click();page.locator('[data-navigation-back]').first.click()
    for tool in ['travel','timetable','calendar','schedule','map','weather','wallet','discoveries','peopleRecord','messages','journal','characterArt']:
     page.locator('[data-action="openQuick"]').first.click()
     page.locator(f'.shortcut-grid [data-value="{tool}"]').click()
     assert page.locator('.utility-page').is_visible(),tool
     assert page.evaluate('document.documentElement.scrollWidth<=innerWidth+1'),(width,tool)
     assert page.locator('h1').inner_text().strip(),tool
     if tool=='timetable':
      assert page.locator('.timetable-day').count()==14
      assert page.locator('.timetable-day[open]').count()==1
      assert '오늘 · 8일차' in page.locator('.timetable-day').first.inner_text()
      if width==1440 and path=='/prototype/':page.screenshot(path='docs/assets/timetable-navigation-preview.png',full_page=True)
     if tool=='weather':assert page.locator('article.list').count()==4
     if tool=='travel':
      page.locator('#travel-search').fill('없는건물');assert page.locator('.travel-empty').is_visible();page.locator('#travel-search').fill('')
     if tool=='characterArt':page.locator('[data-navigation-back]').first.click()
     elif tool=='weather':page.locator('[data-navigation-back]').first.click()
     else:
      assert '학교생활 메뉴' in page.locator('[data-navigation-back]').first.inner_text(),tool
      page.locator('[data-navigation-back]').first.click()
     # Return to the reading scene; opening another menu must remain possible.
     if page.locator('[data-action="closeQuick"]').count():page.locator('[data-action="closeQuick"]').first.click()
    assert not errors,errors
    page.close()
  b.close()
finally:server.shutdown();server.server_close()
print('Navigation audit passed: 12 tools, day 8, both builds, 320/390/1440 widths, back routes, timetable, weather, search, no JS errors')
