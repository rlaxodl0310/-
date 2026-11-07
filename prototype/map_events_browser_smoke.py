import http.server,threading
from playwright.sync_api import sync_playwright
from vn_browser_helpers import confirm_returning_plan,read_to_choices,choose,open_tool
class Quiet(http.server.SimpleHTTPRequestHandler):
 def log_message(self,*args):pass
server=http.server.ThreadingHTTPServer(('127.0.0.1',0),Quiet);threading.Thread(target=server.serve_forever,daemon=True).start()
try:
 with sync_playwright() as p:
  b=p.chromium.launch(headless=True,executable_path='/usr/bin/chromium')
  for path in ['/prototype/','/demo/campus-demo.html']:
   for width in [390,1440]:
    page=b.new_page(viewport={'width':width,'height':900});page.set_default_timeout(10000);errors=[];page.on('pageerror',lambda e:errors.append(str(e)));page.goto(f'http://127.0.0.1:{server.server_port}'+path);confirm_returning_plan(page)
    page.locator('[data-action="openQuick"]').first.click();page.locator('[data-action="quickTab"][data-value="save"]').click();page.locator('[data-action="save"][data-value="1"]').click()
    page.evaluate("()=>{let s=JSON.parse(localStorage.getItem('campus.slot.1'));s.clock.minute=780;s.flow.postsRead={'basketball-open':true};localStorage.setItem('campus.slot.1',JSON.stringify(s));}")
    page.locator('[data-action="load"][data-value="1"]').click();page.locator('[data-navigation-back]').first.click()
    open_tool(page,'travel');page.locator('#travel-search').fill('자취촌 작은 공원')
    assert page.locator('.map-building[data-value="pocketPark"] .map-event-marker').is_visible()
    if path=='/prototype/' and width==1440:page.screenshot(path='docs/assets/map-event-marker-preview.png',full_page=True)
    page.locator('.map-building[data-value="pocketPark"]').click();read_to_choices(page)
    bg=page.locator('.place-backdrop');assert bg.get_attribute('data-background')=='pocketPark'
    assert bg.evaluate("async n=>{const src=getComputedStyle(n).backgroundImage.slice(5,-2);const im=new Image();im.src=src;await im.decode();return im.naturalWidth>1000;}")
    if path=='/prototype/' and width==1440:page.screenshot(path='docs/assets/pocket-park-background-preview.png',full_page=True)
    choose(page,'openNeighborhood','parkNote');assert page.locator('.vn-stage').get_attribute('data-vn-screen')=='neighborhoodEvent'
    choose(page,'neighborhoodChoice','help');read_to_choices(page)
    assert '13:15' in page.locator('.scene-time').inner_text()
    page.locator('.vn-toolbar [data-value="travel"]').click();assert not page.locator('.map-building[data-value="pocketPark"] .map-event-marker').count()
    # Different locations in the same region must use different illustration tiles.
    page.locator('#travel-search').fill('自취촌 세탁소 앞'.replace('自','자'));page.locator('.map-building[data-value="laundry"]').click();read_to_choices(page)
    assert page.locator('.place-backdrop').get_attribute('data-background')=='laundry'
    assert page.locator('.place-backdrop').evaluate("n=>getComputedStyle(n).backgroundPosition")!='100% 0%'
    page.locator('.vn-toolbar [data-value="travel"]').click();page.locator('#travel-search').fill('창조관 · 도서관');page.locator('.map-building[data-value="library"]').click();read_to_choices(page)
    assert page.locator('.place-backdrop').get_attribute('data-set')=='campus'
    if path=='/prototype/' and width==1440:page.screenshot(path='docs/assets/library-background-preview.png',full_page=True)
    page.locator('.vn-toolbar [data-value="travel"]').click();page.locator('#travel-search').fill('체육관')
    assert page.locator('.map-building[data-value="gym"] .map-event-marker').is_visible()
    page.locator('.map-building[data-value="gym"]').click();choose(page,'knownPublicEvent','basketball-open')
    assert page.locator('.vn-stage').get_attribute('data-vn-screen')=='communityEvent'
    assert page.evaluate('document.documentElement.scrollWidth<=innerWidth+1');assert not errors,errors;page.close()
  b.close()
finally:server.shutdown();server.server_close()
print('Map events/backgrounds passed: live marker, arrival, real event/15 minutes, completed marker removed, distinct same-region backgrounds, web/offline mobile/desktop')
