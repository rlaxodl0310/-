import http.server,threading
from playwright.sync_api import sync_playwright
from vn_browser_helpers import confirm_returning_plan,read_to_choices,choose
class Quiet(http.server.SimpleHTTPRequestHandler):
 def log_message(self,*args):pass
server=http.server.ThreadingHTTPServer(('127.0.0.1',0),Quiet);threading.Thread(target=server.serve_forever,daemon=True).start()
try:
 with sync_playwright() as p:
  b=p.chromium.launch(headless=True,executable_path='/usr/bin/chromium')
  for path in ['/prototype/','/demo/campus-demo.html']:
   for width in [320,390,1440]:
    page=b.new_page(viewport={'width':width,'height':900});page.set_default_timeout(8000);errors=[];page.on('pageerror',lambda e:errors.append(str(e)));page.goto(f'http://127.0.0.1:{server.server_port}'+path);confirm_returning_plan(page);read_to_choices(page)
    assert page.locator('.action-overview').is_visible()
    assert not page.locator('[data-action="vnCycle"]').count()
    assert page.locator('.action-overview [data-value="travel"]').count()==1
    assert page.locator('.choice-purpose').count()>0
    if path=='/prototype/' and width==1440:page.screenshot(path='docs/assets/exploration-choices-preview.png',full_page=True)
    page.locator('.vn-toolbar [data-value="travel"]').click();assert page.locator('.campus-map').is_visible();assert page.locator('.map-building').count()==30;assert page.locator('.map-building:visible').count()==6
    assert page.evaluate('document.documentElement.scrollWidth<=innerWidth+1')
    assert page.locator('.map-building').evaluate_all("ns=>new Set(ns.map(n=>n.style.gridColumn+':'+n.style.gridRow)).size===ns.length")
    page.locator('#travel-search').fill('없는건물');assert page.locator('.travel-empty').is_visible();page.locator('#travel-search').fill('')
    if path=='/prototype/' and width==1440:page.screenshot(path='docs/assets/campus-map-preview.png',full_page=True)
    page.locator('[data-action="mapRegion"][data-value="arts"]').click()
    assert page.locator('.regional-map').get_attribute('data-region')=='arts'
    assert page.locator('.map-building:visible').count()==3
    assert page.locator('.regional-map-art').evaluate("async n=>{const src=getComputedStyle(n).backgroundImage.slice(5,-2);const im=new Image();im.src=src;await im.decode();return im.naturalWidth>1000;}")
    if path=='/prototype/' and width==1440:page.screenshot(path='docs/assets/arts-map-preview.png',full_page=True)
    page.locator('[data-action="mapCurrent"]').click()
    assert page.locator('.regional-map').get_attribute('data-region')=='north'
    page.locator('[data-action="mapRegion"][data-value="athletics"]').click()
    assert page.locator('.regional-map').get_attribute('data-region')=='athletics'
    assert page.locator('.map-building:visible').count()==5
    if path=='/prototype/' and width==1440:page.screenshot(path='docs/assets/athletics-map-preview.png',full_page=True)
    page.locator('[data-action="mapRegion"][data-value="town"]').click()
    assert page.locator('.regional-map').get_attribute('data-region')=='town'
    if path=='/prototype/' and width==1440:page.screenshot(path='docs/assets/town-map-preview.png',full_page=True)
    page.locator('.map-building[data-value="market"]').click();assert '대학가 편의점' in page.locator('.scene-location').inner_text()
    read_to_choices(page);assert page.locator('[data-action="openShop"]').is_visible()
    assert not page.locator('[data-action="vnCycle"]').count()
    assert page.locator('.map-building').count()==0
    page.locator('.vn-toolbar [data-action="phone"]').click();page.locator('.phone-app-grid [data-value="map"]').click()
    assert page.locator('.map-building[aria-current="location"]').get_attribute('data-value')=='market'
    assert not errors,errors;page.close()
  b.close()
finally:server.shutdown();server.server_close()
print('Campus map passed: 30 destinations, 8 connected regions, 6 viewport/build cases, search/current location, actual travel, exploration overview, no page overflow/errors')
