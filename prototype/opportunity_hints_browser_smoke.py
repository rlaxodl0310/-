import http.server,threading
from playwright.sync_api import sync_playwright
from vn_browser_helpers import confirm_returning_plan,open_tool
class Quiet(http.server.SimpleHTTPRequestHandler):
 def log_message(self,*args):pass
server=http.server.ThreadingHTTPServer(('127.0.0.1',0),Quiet);threading.Thread(target=server.serve_forever,daemon=True).start()
try:
 with sync_playwright() as p:
  b=p.chromium.launch(headless=True,executable_path='/usr/bin/chromium')
  for path in ['/prototype/','/demo/campus-demo.html']:
   for width in [390,1440]:
    page=b.new_page(viewport={'width':width,'height':900});errors=[];page.on('pageerror',lambda e:errors.append(str(e)));page.goto(f'http://127.0.0.1:{server.server_port}'+path)
    confirm_returning_plan(page)
    page.locator('[data-action="openQuick"]').first.click();page.locator('[data-action="quickTab"][data-value="save"]').click();page.locator('[data-action="save"][data-value="1"]').click()
    page.evaluate("""()=>{let s=JSON.parse(localStorage.getItem('campus.slot.1'));s.day=4;s.clock.minute=840;s.location='library';s.opportunityHints=null;localStorage.setItem('campus.slot.1',JSON.stringify(s));}""")
    page.locator('[data-action="load"][data-value="1"]').click()
    page.locator('[data-action="go"][data-value="campus"]').first.click()
    assert page.locator('.opportunity-hint').is_visible()
    assert page.evaluate('document.documentElement.scrollWidth<=innerWidth+1')
    if path=='/prototype/' and width==1440:page.screenshot(path='docs/assets/opportunity-hint-preview.png',full_page=True)
    page.locator('[data-action="hintExplore"]').click();assert page.locator('#travel-search').input_value()=='창조관 · 도서관'
    assert not errors,errors
    page.close()
  b.close()
finally:server.shutdown();server.server_close()
print('Opportunity hints passed: both builds, mobile/desktop, saved state, destination search, no overflow/errors')
