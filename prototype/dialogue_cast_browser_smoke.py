import http.server,threading
from playwright.sync_api import sync_playwright
from vn_browser_helpers import confirm_returning_plan,finish_school_morning,choose,read_to_choices,open_tool
class Quiet(http.server.SimpleHTTPRequestHandler):
 def log_message(self,*args):pass
server=http.server.ThreadingHTTPServer(('127.0.0.1',0),Quiet);threading.Thread(target=server.serve_forever,daemon=True).start()
def assert_cast(page,actors):
 assert set(page.locator('.cast-member').evaluate_all('ns=>ns.map(n=>n.dataset.castId)'))==set(actors)
 assert page.locator('.dialogue-stage').is_visible()
 assert page.locator('.place-backdrop').count()==1
 assert page.locator('.cast-member .portrait').evaluate_all("async ns=>{for(const n of ns){const im=new Image();im.src=getComputedStyle(n).backgroundImage.slice(5,-2);await im.decode();if(!im.naturalWidth)return false;}return true;}")
 panel=page.locator('.vn-panel').bounding_box()
 for n in page.locator('.cast-member').all():
  box=n.bounding_box();assert box['y']+box['height']*.28<panel['y'],(box,panel)
 assert page.evaluate('document.documentElement.scrollWidth<=innerWidth+1')
try:
 with sync_playwright() as p:
  b=p.chromium.launch(headless=True,executable_path='/usr/bin/chromium')
  for path in ['/prototype/','/demo/campus-demo.html']:
   for width,height in [(320,720),(390,844),(1440,1000)]:
    page=b.new_page(viewport={'width':width,'height':height});page.set_default_timeout(10000);errors=[];page.on('pageerror',lambda e:errors.append(str(e)));page.goto(f'http://127.0.0.1:{server.server_port}'+path);confirm_returning_plan(page);finish_school_morning(page)
    open_tool(page,'travel');page.locator('#travel-search').fill('자유관');page.locator('[data-action="visit"][data-value="hall"]').click();assert '차여경' not in page.locator('.portrait[data-actor="yeogyeong"]').get_attribute('aria-label');choose(page,'encounter','engage')
    assert_cast(page,['taei','yeogyeong'])
    assert '차여경' in page.locator('.cast-member[data-cast-id="yeogyeong"] figcaption').inner_text()
    active=set()
    for _ in range(20):
     actor=page.locator('.dialogue-cast').get_attribute('data-active-actor')
     if actor:active.add(actor);assert page.locator('.cast-member[data-speaking="true"]').count()==1
     nxt=page.locator('[data-action="vnNext"]')
     if not nxt.count():break
     nxt.click()
    assert {'taei','yeogyeong'}<=active,active
    if path=='/prototype/' and width in [390,1440]:page.screenshot(path=f'docs/assets/dialogue-cast-{width}-preview.png',full_page=True)
    before=(page.locator('.vn-line').inner_text(),page.locator('.scene-time').inner_text())
    page.locator('[data-action="openQuick"]').first.click();page.locator('[data-action="closeQuick"]').click();assert (page.locator('.vn-line').inner_text(),page.locator('.scene-time').inner_text())==before;assert_cast(page,['taei','yeogyeong'])
    # Existing relationship example supplies an already introduced, afternoon group fixture.
    page.locator('[data-action="openQuick"]').first.click();page.locator('[data-action="quickTab"][data-value="save"]').click();page.locator('.example-settings summary').click();page.locator('[data-action="scenario"][data-value="close"]').click()
    choose(page,'encounter','pass');choose(page,'walk','lounge');choose(page,'encounter','engage')
    assert_cast(page,['taei','seoyeon','soyul']);speakers=set()
    for _ in range(5):
     read_to_choices(page)
     actor=page.locator('.dialogue-cast').get_attribute('data-active-actor')
     if actor:speakers.add(actor)
     if not page.locator('[data-action="groupNext"]').count():break
     choose(page,'groupNext')
    assert {'seoyeon','soyul'}<=speakers,speakers
    if path=='/prototype/' and width in [390,1440]:page.screenshot(path=f'docs/assets/group-cast-{width}-preview.png',full_page=True)
    assert not errors,errors;page.close()
  b.close()
finally:server.shutdown();server.server_close()
print('Dialogue cast passed: both builds, 320/390/1440, two/three characters, active speakers, unknown-name privacy, face clearance, image decode and menu return')
