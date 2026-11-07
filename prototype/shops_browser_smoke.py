import http.server,threading
from playwright.sync_api import sync_playwright
from vn_browser_helpers import read_to_choices,choose,open_tool
class Quiet(http.server.SimpleHTTPRequestHandler):
 def log_message(self,*args):pass
server=http.server.ThreadingHTTPServer(('127.0.0.1',0),Quiet);threading.Thread(target=server.serve_forever,daemon=True).start()
try:
 with sync_playwright() as p:
  b=p.chromium.launch(headless=True,executable_path='/usr/bin/chromium')
  for path in ['/prototype/','/demo/campus-demo.html']:
   for width,height in [(390,844),(1440,1000)]:
    page=b.new_page(viewport={'width':width,'height':height});errors=[];page.on('pageerror',lambda e:errors.append(str(e)))
    page.goto(f'http://127.0.0.1:{server.server_port}'+path)
    open_tool(page,'travel');page.locator('#travel-search').fill('대학가 편의점');page.locator('[data-action="visit"][data-value="market"]').click()
    choose(page,'openShop');assert '100,000원' in page.locator('.page-reading').inner_text()
    page.locator('[data-action="shopChoose"][data-value="water"]').click();page.locator('[data-action="shopPay"]').click()
    assert '99,000원' in page.locator('.page-reading').inner_text();assert page.locator('[data-action="shopChoose"]').count()==4
    if path=='/prototype/' and width==1440:page.screenshot(path='docs/assets/shop-purchase-preview.png',full_page=True)
    page.locator('[data-action="openQuick"]').first.click();page.locator('[data-action="go"][data-value="wallet"]').click()
    assert '생수 × 1' in page.locator('.page-reading').inner_text();page.locator('[data-action="consumePurchase"]').click();assert not page.locator('[data-action="consumePurchase"]').count()
    page.locator('[data-action="openQuick"]').first.click();page.locator('[data-action="quickTab"][data-value="save"]').click();page.locator('[data-action="save"][data-value="1"]').click()
    saved=page.evaluate("JSON.parse(localStorage.getItem('campus.slot.1'))");assert saved['wallet']['balance']==99000;assert len(saved['wallet']['ledger'])==1;assert saved['shopping']['draft'] is None
    assert not errors,errors;page.close()
  b.close()
finally:server.shutdown();server.server_close()
print('Shopping UI passed: web/standalone, desktop/mobile, travel/purchase/consume/save')
