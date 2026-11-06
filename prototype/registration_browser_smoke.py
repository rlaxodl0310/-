import http.server,threading
from playwright.sync_api import sync_playwright
from vn_browser_helpers import read_returning_opening,choose
class Quiet(http.server.SimpleHTTPRequestHandler):
 def log_message(self,*args):pass
server=http.server.ThreadingHTTPServer(('127.0.0.1',0),Quiet);threading.Thread(target=server.serve_forever,daemon=True).start()
try:
 with sync_playwright() as p:
  b=p.chromium.launch(headless=True,executable_path='/usr/bin/chromium')
  for path in ['/prototype/','/demo/campus-demo.html']:
   for width,height in [(320,720),(390,844),(1440,1000)]:
    page=b.new_page(viewport={'width':width,'height':height});errors=[];page.on('pageerror',lambda e:errors.append(str(e)));page.goto(f'http://127.0.0.1:{server.server_port}'+path)
    read_returning_opening(page)
    assert page.get_by_role('heading',name='공강에 어떤 수업을 넣을까?').is_visible()
    assert not page.locator('[data-action="courseToggle"][data-value="1:theory"]').count()
    assert page.locator('.week-course.fixed').count()==7
    assert page.evaluate('document.documentElement.scrollWidth <= innerWidth+1')
    page.locator('[data-action="courseToggle"][data-value="1:coding"]').click()
    assert page.locator('[data-action="courseConfirm"]').is_enabled()
    assert page.locator('.week-course.elective').count()==1
    assert not page.locator('[data-action="courseToggle"][data-value="1:media"]').count()
    page.locator('[data-action="courseToggle"][data-value="1:coding"]').click()
    assert page.locator('[data-action="courseToggle"][data-value="1:media"]').count()==1
    page.locator('[data-action="courseToggle"][data-value="1:coding"]').click()
    if path=='/prototype/' and width==1440:page.screenshot(path='docs/assets/registration-preview.png',full_page=True)
    page.locator('[data-action="courseConfirm"]').click();assert page.locator('.vn-stage').is_visible()
    choose(page,'classTravel');choose(page,'classPrepare');choose(page,'classChoice');assert '11:00' in page.locator('.scene-time').inner_text()
    choose(page,'classTravel');choose(page,'classPrepare');choose(page,'classChoice');assert '13:00' in page.locator('.scene-time').inner_text()
    choose(page,'classTravel');choose(page,'classPrepare');choose(page,'classChoice');assert '15:00' in page.locator('.scene-time').inner_text()
    page.locator('[data-action="openQuick"]').first.click();page.locator('[data-action="quickTab"][data-value="save"]').click();page.locator('[data-action="save"][data-value="1"]').click()
    saved=page.evaluate("JSON.parse(localStorage.getItem('campus.slot.1'))");assert '1:coding' in saved['academics']['courseIds'];assert saved['academics']['records']['1:taei:coding']['status']=='present';assert not errors,errors;page.close()
  b.close()
finally:server.shutdown();server.server_close()
print('Registration passed: required fixed, only eligible generals, live board, no viewport overflow, actual elective attendance/save')
