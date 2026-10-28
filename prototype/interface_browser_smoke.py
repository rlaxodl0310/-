"""Shared interface, location filtering, keyboard search and no game-time cost."""
import os
from playwright.sync_api import sync_playwright
from vn_browser_helpers import open_tool
base=os.environ.get('CAMPUS_TEST_URL','http://127.0.0.1:8000')
with sync_playwright() as p:
 browser=p.chromium.launch(headless=True,executable_path='/usr/bin/chromium')
 for path in ['/prototype/','/demo/campus-demo.html']:
  for width,height in [(320,740),(390,844),(1440,1000)]:
   page=browser.new_page(viewport={'width':width,'height':height});errors=[];page.on('pageerror',lambda e:errors.append(str(e)));page.goto(base+path)
   assert page.locator('.vn-reading-progress').inner_text()=='1 / 1'
   open_tool(page,'travel');assert page.locator('.travel-card:visible').count()==15
   assert page.locator('.travel-grid').evaluate("n=>getComputedStyle(n).gridTemplateColumns.split(' ').length")== (3 if width>820 else 2)
   page.locator('[data-action="travelFilter"][data-value="outdoor"]').click();assert page.locator('.travel-card:visible').count()==2
   search=page.get_by_role('searchbox',name='장소 검색');search.fill('운동장');assert page.locator('.travel-card:visible').count()==1;assert page.locator('.travel-card:visible').get_attribute('data-value')=='field';assert search.evaluate('el=>el===document.activeElement')
   search.fill('없는장소');assert page.locator('.travel-empty').is_visible();assert page.locator('.travel-card:visible').count()==0
   search.fill('');page.locator('[data-action="travelFilter"][data-value="all"]').click();assert page.locator('.travel-card:visible').count()==15
   if path=='/prototype/' and width in [390,1440]:page.screenshot(path=f'/tmp/interface-travel-{width}.png',full_page=True)
   assert page.evaluate('document.documentElement.scrollWidth<=innerWidth')
   page.locator('[data-action="phone"]').click();assert page.locator('.phone-clock strong').inner_text()=='09:00'
   page.get_by_role('button',name='← 뒤로',exact=True).click();assert page.locator('.travel-card:visible').count()==15
   page.locator('[data-action="travelFilter"][data-value="outdoor"]').click();page.locator('[data-action="visit"][data-value="field"]').click();assert page.locator('.outdoor-scene').is_visible();assert page.locator('.scene-location').inner_text()=='운동장'
   assert page.locator('.scene-context').evaluate('el=>el.getBoundingClientRect().right')<=page.locator('.vn-toolbar').evaluate('el=>el.getBoundingClientRect().left')
   assert not errors,errors;page.close()
 # This managed Chromium forbids file:// navigation; verify the offline bundle has no CSS dependency.
 from pathlib import Path
 html=Path('demo/campus-demo.html').read_text();assert 'href="interface.css"' not in html;assert 'href="style.css"' not in html;assert 'class="travel-search"' in html
 browser.close()

print('Interface: both builds at 320/390/1440px, search/filter/empty state, keyboard focus, phone return, no clock cost, HUD spacing and standalone inline theme passed')
