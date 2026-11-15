"""Actual dialogue flow and uncropped native-ratio scenery at phone/desktop sizes."""
import http.server,threading,json,subprocess
from playwright.sync_api import sync_playwright
from vn_browser_helpers import confirm_returning_plan,finish_school_morning,choose,open_tool
class Quiet(http.server.SimpleHTTPRequestHandler):
 def log_message(self,*args):pass
server=http.server.ThreadingHTTPServer(('127.0.0.1',0),Quiet);threading.Thread(target=server.serve_forever,daemon=True).start()
try:
 with sync_playwright() as p:
  browser=p.chromium.launch(headless=True,executable_path='/usr/bin/chromium')
  for path in ['/prototype/','/demo/campus-demo.html']:
   for width,height in [(390,844),(1440,1000)]:
    page=browser.new_page(viewport={'width':width,'height':height},reduced_motion='reduce');page.set_default_timeout(15000);page.set_default_navigation_timeout(60000);errors=[];page.on('pageerror',lambda e:errors.append(str(e)));page.goto(f'http://127.0.0.1:{server.server_port}'+path);confirm_returning_plan(page);fixture=json.loads(subprocess.check_output(['node','--input-type=module','-e',"import {presentationScenario} from './prototype/presentation-fixtures.js';console.log(JSON.stringify(presentationScenario('first')));"],text=True));page.evaluate("s=>localStorage.setItem('campus.slot.1',JSON.stringify(s))",fixture);page.reload();page.locator('.opening-tools [data-action="openQuick"]').click();page.locator('[data-action="load"][data-value="1"]').click();page.locator('[data-navigation-back]').first.click();open_tool(page,'travel');page.locator('#travel-search').fill('자유관');page.locator('.map-building[data-value="hall"]').click();choose(page,'encounter','engage');lines=[]
    for _ in range(24):
     lines.append(page.locator('.vn-line').inner_text())
     if not page.locator('[data-action="vnNext"]').count():break
     page.locator('[data-action="vnNext"]').click()
    assert not any(any(bad in line for bad in ['하는 것부터','좋겠어요아서요','관찰 결과','실행 순서']) for line in lines),lines
    bg=page.locator('.place-backdrop');assert bg.count()==1
    measured=bg.evaluate("n=>{const r=n.getBoundingClientRect(),s=getComputedStyle(n);return {width:r.width,height:r.height,ratio:parseFloat(s.getPropertyValue('--scene-ratio')),maxWidth:parseFloat(s.getPropertyValue('--scene-max-width')),bg:s.backgroundSize,image:s.backgroundImage,transform:s.transform}}")
    assert abs(measured['width']/measured['height']-measured['ratio'])<.015,measured
    assert measured['width']<=measured['maxWidth']+1 and measured['width']<=width+1,measured
    assert measured['height']<=height*.72+1,measured
    assert bg.evaluate("async n=>{const im=new Image();im.src=getComputedStyle(n).backgroundImage.slice(5,-2);await im.decode();return im.naturalWidth>0;}")
    assert page.locator('.portrait[data-actor="yeogyeong"]').is_visible() or page.locator('.event-cutscene').is_visible();assert page.locator('.vn-panel').is_visible();body=page.locator('.portrait[data-actor="yeogyeong"]');assert body.get_attribute('data-portrait-mode')=='fullbody';page.wait_for_timeout(100);assert body.bounding_box()['y']+body.bounding_box()['height']<=page.locator('.vn-panel').bounding_box()['y']+1;assert page.evaluate('document.documentElement.scrollWidth<=innerWidth+1')
    page.screenshot(path=f'/workspace/work/natural-scene-{width}.png',full_page=True)
    # Opening and closing menus preserves the emitted line and the scenery framing.
    before=page.locator('.vn-line').inner_text();page.locator('[data-action="openQuick"]').first.click();page.locator('[data-action="closeQuick"]').click();assert page.locator('.vn-line').inner_text()==before
    assert not errors,errors;page.close();print(path,width,'passed',flush=True)
  browser.close()
finally:server.shutdown();server.server_close()
print('Natural presentation passed: real generated conversation, intact menu return, full-scene aspect ratio, 1.6x native ceiling, decoded images and readable cast; web/offline mobile/desktop')
