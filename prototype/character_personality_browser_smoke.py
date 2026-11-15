"""Confirmed personalities in actual character events and visible portraits."""
import http.server,threading,subprocess,json
from playwright.sync_api import sync_playwright
from vn_browser_helpers import confirm_returning_plan,choose,open_tool
class Quiet(http.server.SimpleHTTPRequestHandler):
 def log_message(self,*args):pass
server=http.server.ThreadingHTTPServer(('127.0.0.1',0),Quiet);threading.Thread(target=server.serve_forever,daemon=True).start()
def fixture():
 return json.loads(subprocess.check_output(['node','--input-type=module','-e',"import {newAfternoonScenario} from './prototype/simulation.js';const s=newAfternoonScenario('close');s.location='hall';s.clock.minute=780;console.log(JSON.stringify(s));"],text=True))
try:
 with sync_playwright() as p:
  browser=p.chromium.launch(headless=True,executable_path='/usr/bin/chromium')
  for path in ['/prototype/','/demo/campus-demo.html']:
   for width,height in [(390,844),(1440,1000)]:
    page=browser.new_page(viewport={'width':width,'height':height},reduced_motion='reduce');page.set_default_timeout(15000);page.set_default_navigation_timeout(60000);errors=[];page.on('pageerror',lambda e:errors.append(str(e)));page.goto(f'http://127.0.0.1:{server.server_port}'+path);confirm_returning_plan(page)
    for person in ['yeogyeong','seoyeon']:
     page.evaluate("s=>localStorage.setItem('campus.slot.1',JSON.stringify(s))",fixture());page.reload();page.locator('.opening-tools [data-action="openQuick"]').click();page.locator('[data-action="load"][data-value="1"]').click();page.locator('[data-navigation-back]').first.click();open_tool(page,'travel');page.locator('#travel-search').fill('자유관');page.locator('.map-building[data-value="hall"]').click()
     if page.locator('.vn-stage').get_attribute('data-vn-screen')=='encounter':choose(page,'encounter','pass')
     choose(page,'openPersonalEvent',person);seen=[];fear_seen=False
     for _ in range(12):
      seen.append(page.locator('.vn-line').inner_text())
      portrait=page.locator(f'.portrait[data-actor="{person}"]')
      if portrait.get_attribute('data-fear')=='visible':
       fear_seen=True;assert portrait.get_attribute('data-expression')!='neutral';assert '겁먹' in portrait.get_attribute('aria-label');assert portrait.evaluate("n=>getComputedStyle(n,'::after').content.includes('놀란')")
       if path=='/prototype/':page.screenshot(path=f'/workspace/work/personality-fear-{width}.png',full_page=True)
      if not page.locator('[data-action="vnNext"]').count():break
      page.locator('[data-action="vnNext"]').click()
     if person=='yeogyeong':assert fear_seen,seen
     else:assert any('레슨' in text and '피겨' in text and '양궁' in text for text in seen),seen
     assert page.evaluate('document.documentElement.scrollWidth<=innerWidth+1')
    assert not errors,errors;page.close();print(path,width,'passed',flush=True)
  browser.close()
finally:server.shutdown();server.server_close()
print('Personality passed: real character events, Yeogyeong visibly frightened portrait/caption, Seoyeon calm self-directed lesson dialogue; web/offline mobile/desktop')
