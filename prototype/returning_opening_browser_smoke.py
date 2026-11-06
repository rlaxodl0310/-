import http.server,threading,subprocess,os
from playwright.sync_api import sync_playwright
class Quiet(http.server.SimpleHTTPRequestHandler):
 def log_message(self,*args):pass
server=http.server.ThreadingHTTPServer(('127.0.0.1',0),Quiet);threading.Thread(target=server.serve_forever,daemon=True).start()
try:
 base=f'http://127.0.0.1:{server.server_port}'
 with sync_playwright() as p:
  b=p.chromium.launch(headless=True,executable_path='/usr/bin/chromium')
  for path in ['/prototype/','/demo/campus-demo.html']:
   for width,height in [(320,720),(390,844),(1440,1000)]:
    page=b.new_page(viewport={'width':width,'height':height});errors=[];page.on('pageerror',lambda e:errors.append(str(e)));page.goto(base+path)
    assert page.locator('.opening-stage').is_visible();assert not page.locator('[data-action="courseConfirm"]').count()
    first=page.locator('.opening-copy').inner_text();page.keyboard.press('Space');assert page.locator('.opening-copy').inner_text()!=first
    page.locator('[data-action="openingNext"]').click();assert '휴대폰' in page.locator('.opening-copy').inner_text()
    page.locator('[data-action="openingNext"]').click();assert page.locator('[data-action="openingNext"]').inner_text()=='휴대폰에서 수강 계획을 확인한다.'
    panel=page.locator('.opening-panel').bounding_box();assert panel['x']>=0 and panel['x']+panel['width']<=width+1;assert panel['y']>=0 and panel['y']+panel['height']<=height+1
    if path=='/prototype/':page.screenshot(path=f'docs/assets/returning-opening-{width}.png',full_page=True)
    page.locator('[data-action="openingNext"]').click();assert page.get_by_role('heading',name='복학생 수강 계획').is_visible()
    page.locator('[data-action="courseConfirm"]').click();assert page.locator('.vn-stage').is_visible();assert '09:00' in page.locator('.scene-time').inner_text();assert not errors,errors;page.close()
  b.close()
 subprocess.run(['python3','prototype/vn_browser_smoke.py'],env=dict(os.environ,CAMPUS_TEST_URL=base),check=True)
finally:server.shutdown();server.server_close()
print('Opening passed: six viewports/builds, Space/click, no initial registration, phone-to-plan-to-campus, VN regression')
