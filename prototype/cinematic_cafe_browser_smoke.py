"""Reference art direction: coherent cafe CG, readable frame and working ordering."""
import os
from playwright.sync_api import sync_playwright
from vn_browser_helpers import open_tool,choose,read_to_choices
base=os.environ.get('CAMPUS_TEST_URL','http://127.0.0.1:8000')
with sync_playwright() as p:
 browser=p.chromium.launch(headless=True,executable_path='/usr/bin/chromium')
 for path in ['/prototype/','/demo/campus-demo.html']:
  for width,height in [(390,844),(1440,1000)]:
   page=browser.new_page(viewport={'width':width,'height':height});errors=[];page.on('pageerror',lambda e:errors.append(str(e)));page.goto(base+path)
   open_tool(page,'travel');page.locator('[data-action="visit"][data-value="cafe"]').click();choose(page,'walk','counter');read_to_choices(page)
   assert page.locator('.cafe-cinematic-art').count()==1;assert page.locator('.scene-visual .portrait').count()==0
   assert page.locator('.cafe-cinematic-art').evaluate(r'''async n=>{const url=getComputedStyle(n).backgroundImage.match(/url\(["']?([^"')]+)/)[1],image=new Image();image.src=url;await image.decode();return image.naturalWidth>=1500;}''')
   assert page.locator('.vn-panel').evaluate("n=>parseFloat(getComputedStyle(n).borderRadius)<=3")
   assert page.locator('.vn-choices [data-action="cafeChoose"]').count()>=1
   assert page.evaluate('document.documentElement.scrollWidth<=innerWidth')
   if path=='/prototype/':page.screenshot(path=f'/tmp/cinematic-cafe-{width}.png')
   choose(page,'cafeChoose','latte');choose(page,'cafeTemperature','hot');choose(page,'cafePay');choose(page,'cafeCollect');assert '받았다' in page.locator('.vn-line').inner_text() or page.locator('.cafe-cinematic-art').count()==1
   assert not errors,errors;page.close()
 browser.close()
print('Cinematic cafe: both builds mobile/desktop, decoded coherent CG, minimal frame, readable choices and ordering passed')
