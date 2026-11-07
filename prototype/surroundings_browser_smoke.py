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
    page=b.new_page(viewport={'width':width,'height':900});page.set_default_timeout(8000);errors=[];page.on('pageerror',lambda e:errors.append(str(e)));page.goto(f'http://127.0.0.1:{server.server_port}'+path);confirm_returning_plan(page)
    for id,label,region in [('pocketPark','자취촌 작은 공원','housing'),('neighborhoodMart','서쪽 동네 마트','residential'),('footbridge','하천 보행교','riverside'),('busStop','대학가 버스 정류장','transit')]:
     open_tool(page,'travel');page.locator('#travel-search').fill(label)
     assert page.locator('.regional-map').get_attribute('data-region')==region
     assert page.locator('.regional-map-art').get_attribute('data-art-set')=='surroundings'
     page.locator('#travel-search').fill('')
     if page.locator('[data-action="dismissDiscoveries"]').count():page.locator('[data-action="dismissDiscoveries"]').click()
     assert page.locator('.map-building:visible').count()==3
     assert page.evaluate('document.documentElement.scrollWidth<=innerWidth+1')
     if path=='/prototype/' and width==1440:page.screenshot(path=f'docs/assets/surroundings-{region}-preview.png',full_page=True)
     page.locator(f'.map-building[data-value="{id}"]').click();read_to_choices(page)
     assert label in page.locator('.scene-location').inner_text()
     assert page.locator('.scene-visual').get_attribute('data-district')==region
     choose(page,'surroundingsAction','observe');read_to_choices(page)
     assert 'undefined' not in page.locator('.vn-line').inner_text()
     if id=='neighborhoodMart':
      choose(page,'openShop');page.locator('[data-action="shopChoose"][data-value="water"]').click();page.locator('[data-action="shopPay"]').click()
      page.locator('[data-navigation-back]').click()
    page.locator('[data-action="openQuick"]').first.click();page.locator('[data-action="quickTab"][data-value="save"]').click();page.locator('[data-action="save"][data-value="1"]').click()
    saved=page.evaluate("JSON.parse(localStorage.getItem('campus.slot.1'))");assert len(saved['surroundings'])==4;assert saved['wallet']['balance']==99000;assert any(x['shopGood']=='water' for x in saved['inventory'])
    assert not errors,errors;page.close()
  b.close()
finally:server.shutdown();server.server_close()
print('Surroundings passed: 4 new regions, search, arrival/backgrounds, observation, local mart purchase and saved facts, both builds/mobile/desktop')
