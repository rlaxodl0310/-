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
   for width in [320,390,1440]:
    page=b.new_page(viewport={'width':width,'height':900});errors=[];page.on('pageerror',lambda e:errors.append(str(e)));page.goto(f'http://127.0.0.1:{server.server_port}'+path)
    confirm_returning_plan(page)
    page.locator('[data-action="phone"]').first.click()
    assert page.locator('.phone-brand').is_visible()
    assert page.locator('.phone-priority [data-value="community"]').is_visible()
    assert page.locator('.phone-priority [data-value="messages"]').is_visible()
    assert page.evaluate('document.documentElement.scrollWidth<=innerWidth+1')
    if path=='/prototype/' and width==1440:page.screenshot(path='docs/assets/phone-ui-preview.png',full_page=True)
    page.locator('.phone-priority [data-value="community"]').click()
    assert page.locator('.community-feed').is_visible()
    page.locator('[data-action="phone"]').first.click()
    page.locator('.phone-home > header [data-action="go"]').first.click()
    page.locator('[data-action="openQuick"]').first.click()
    assert page.get_by_role('button',name='학교생활 메뉴',exact=True).is_visible()
    assert page.evaluate('document.documentElement.scrollWidth<=innerWidth+1')
    if path=='/prototype/' and width==1440:page.screenshot(path='docs/assets/menu-ui-preview.png',full_page=True)
    page.locator('[data-action="quickTab"][data-value="save"]').click()
    assert page.locator('[data-action="save"][data-value="1"]').is_visible()
    assert not errors,errors
    page.close()
  b.close()
finally:server.shutdown();server.server_close()
print('Phone/menu UI passed: both builds, three widths, app navigation, return, save tab, no overflow/errors')
