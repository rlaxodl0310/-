import http.server,threading
from playwright.sync_api import sync_playwright
class Quiet(http.server.SimpleHTTPRequestHandler):
 def log_message(self,*args):pass
server=http.server.ThreadingHTTPServer(('127.0.0.1',0),Quiet);threading.Thread(target=server.serve_forever,daemon=True).start()
try:
 with sync_playwright() as p:
  b=p.chromium.launch(headless=True,executable_path='/usr/bin/chromium')
  for path in ['/prototype/','/demo/campus-demo.html']:
   for w,h in [(390,844),(1440,1000)]:
    page=b.new_page(viewport={'width':w,'height':h});errors=[];page.on('pageerror',lambda e:errors.append(str(e)))
    page.goto(f'http://127.0.0.1:{server.server_port}'+path)
    if page.locator('[data-action="courseConfirm"]').count():page.locator('[data-action="courseConfirm"]').click()
    page.locator('[data-action="openQuick"]').first.click();page.locator('[data-action="quickTab"][data-value="save"]').click();page.locator('[data-action="save"][data-value="1"]').click()
    before=page.evaluate("JSON.parse(localStorage.getItem('campus.slot.1'))")
    page.locator('[data-action="quickTab"][data-value="tools"]').click();page.locator('[data-action="go"][data-value="characterArt"]').click()
    assert page.get_by_role('heading',name='정이서',exact=True).is_visible()
    for angle in ['front','side','back']:
     page.locator(f'[data-action="artAngle"][data-value="{angle}"]').click()
     art=page.locator('.iseo-art')
     assert art.evaluate('''async el=>{const u=getComputedStyle(el).backgroundImage.match(/url\\(["']?([^"')]+)/)[1],i=new Image();i.src=u;await i.decode();return i.width===1024&&i.height===1536}''')
     assert page.locator(f'[data-action="artAngle"][data-value="{angle}"]').get_attribute('aria-pressed')=='true'
    if path=='/prototype/' and w==1440:page.screenshot(path='docs/assets/iseo-web-gallery-preview.png',full_page=True)
    page.locator('[data-action="iseoTalk"]').click()
    assert page.locator('.iseo-talk-box>strong').inner_text()=='단발머리 학생'
    page.locator('[data-action="iseoChoice"][data-value="welcome"]').click()
    assert page.locator('.iseo-talk-art').evaluate("el=>el.style.getPropertyValue('--pose')")=='1'
    page.locator('[data-action="iseoChoice"][data-value="next"]').click()
    page.locator('[data-action="iseoChoice"][data-value="introduce"]').click()
    assert page.locator('.iseo-talk-box>strong').inner_text()=='정이서'
    page.locator('[data-action="iseoChoice"][data-value="next"]').click()
    page.locator('[data-action="iseoChoice"][data-value="tease"]').click()
    assert page.locator('.iseo-talk-art').evaluate("el=>el.style.getPropertyValue('--pose')")=='2'
    page.locator('[data-action="iseoChoice"][data-value="next"]').click()
    page.locator('[data-action="iseoChoice"][data-value="boundary"]').click()
    page.locator('[data-action="iseoChoice"][data-value="next"]').click()
    assert page.locator('[data-action="iseoRestart"]').is_visible()
    if path=='/prototype/' and w==1440:page.screenshot(path='docs/assets/iseo-dialogue-preview.png',full_page=True)
    page.get_by_role('button',name='← 뒤로',exact=True).click()
    page.get_by_role('button',name='← 뒤로',exact=True).click();page.locator('[data-action="quickTab"][data-value="save"]').click();page.locator('[data-action="save"][data-value="1"]').click()
    after=page.evaluate("JSON.parse(localStorage.getItem('campus.slot.1'))")
    assert after==before,repr({k:[before.get(k),after.get(k)] for k in set(before)|set(after) if before.get(k)!=after.get(k)})
    page.locator('[data-action="closeQuick"]').click();assert page.locator('.vn-stage').is_visible();assert not errors,errors
    page.close()
  b.close()
finally:server.shutdown();server.server_close()
print('Iseo gallery: web + standalone, desktop + mobile, all3assets, exact gameplay state unchanged')
