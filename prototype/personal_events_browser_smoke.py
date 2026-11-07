import http.server,threading
from playwright.sync_api import sync_playwright
from vn_browser_helpers import confirm_returning_plan,choose,read_to_choices,open_tool
class Quiet(http.server.SimpleHTTPRequestHandler):
 def log_message(self,*args):pass
server=http.server.ThreadingHTTPServer(('127.0.0.1',0),Quiet);threading.Thread(target=server.serve_forever,daemon=True).start()
try:
 with sync_playwright() as p:
  b=p.chromium.launch(headless=True,executable_path='/usr/bin/chromium')
  for path in ['/prototype/','/demo/campus-demo.html']:
   for width in [390,1440]:
    page=b.new_page(viewport={'width':width,'height':900});page.set_default_timeout(10000);errors=[];page.on('pageerror',lambda e:errors.append(str(e)));base=f'http://127.0.0.1:{server.server_port}';page.goto(base+path);confirm_returning_plan(page)
    for person,place,label,first,last in [('taei','cafe','대학가 카페','honest','record'),('yeogyeong','hall','자유관','compare','share'),('seoyeon','hall','자유관','ask','boundary'),('soyul','hall','자유관','permission','wait'),('iseo','gym','체육관','introduce','pace')]:
     page.locator('[data-action="openQuick"]').first.click();page.locator('[data-action="quickTab"][data-value="save"]').click()
     fixture=page.evaluate("async ({base,person,place})=>{const sim=await import(base+'/prototype/simulation.js');const s=sim.newAfternoonScenario('close');s.location=place;s.clock.minute=person==='iseo'?960:780;return s;}",{'base':base,'person':person,'place':place})
     page.evaluate("s=>localStorage.setItem('campus.slot.1',JSON.stringify(s))",fixture);page.reload();page.locator('.opening-tools [data-action="openQuick"]').click();page.locator('[data-action="load"][data-value="1"]').click();page.locator('[data-navigation-back]').first.click()
     open_tool(page,'travel');page.locator('#travel-search').fill(label);assert page.locator(f'.map-building[data-value="{place}"] .map-event-marker').is_visible();page.locator(f'.map-building[data-value="{place}"]').click()
     if page.locator('.vn-stage').get_attribute('data-vn-screen')=='encounter':choose(page,'encounter','pass')
     choose(page,'openPersonalEvent',person);assert page.locator('.vn-stage').get_attribute('data-vn-screen')=='personalEvent'
     assert page.locator('.cast-member').count()==(1 if person=='taei' else 2)
     if person=='iseo':
      assert '정이서' not in page.locator('.cast-member[data-cast-id="iseo"] figcaption').inner_text()
      assert page.locator('.portrait[data-actor="iseo"]').evaluate("async n=>{const im=new Image();im.src=getComputedStyle(n).backgroundImage.slice(5,-2);await im.decode();return im.naturalWidth>1000;}")
     choose(page,'personalEventChoice',first);read_to_choices(page)
     if person=='seoyeon':
      page.locator('[data-action="pausePersonalEvent"]').first.click();choose(page,'openPersonalEvent',person);read_to_choices(page)
     if path=='/prototype/' and width==1440:page.screenshot(path=f'docs/assets/personal-event-{person}-preview.png',full_page=True)
     if person=='iseo':assert '정이서' in page.locator('.cast-member[data-cast-id="iseo"] figcaption').inner_text()
     # Save and load the actual intermediate event; resume the existing stage.
     page.locator('[data-action="openQuick"]').first.click();page.locator('[data-action="quickTab"][data-value="save"]').click();page.locator('[data-action="save"][data-value="1"]').click();mid=page.evaluate("JSON.parse(localStorage.getItem('campus.slot.1'))");assert mid['personalEvents']['records'][person]['stage']==1
     page.locator('[data-action="load"][data-value="1"]').click();page.locator('[data-navigation-back]').first.click()
     open_tool(page,'travel');page.locator('#travel-search').fill(label);page.locator(f'.map-building[data-value="{place}"]').click()
     if page.locator('.vn-stage').get_attribute('data-vn-screen')=='encounter':choose(page,'encounter','pass')
     choose(page,'openPersonalEvent',person);choose(page,'personalEventChoice',last);read_to_choices(page);assert page.evaluate('document.documentElement.scrollWidth<=innerWidth+1')
     choose(page,'pausePersonalEvent')
     assert not page.locator(f'[data-action="openPersonalEvent"][data-value="{person}"]').count()
     page.locator('[data-action="openQuick"]').first.click();page.locator('[data-action="quickTab"][data-value="save"]').click();page.locator('[data-action="save"][data-value="1"]').click();end=page.evaluate("JSON.parse(localStorage.getItem('campus.slot.1'))");assert end['personalEvents']['records'][person]['status']=='completed';assert end['clock']['minute']==fixture['clock']['minute']+30
     if person=='iseo':assert end['contacts']['iseo']['details']['major']=='태권도과'
     page.locator('[data-navigation-back]').first.click()
    assert not errors,errors;page.close()
  b.close()
finally:server.shutdown();server.server_close()
print('Five personal events passed: real map entry, choices, 30 minutes, pause, intermediate save/load, completion, Iseo intro/art, both builds/mobile/desktop')
