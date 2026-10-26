"""Scene continuity, real image loading, readable contrast and responsive choice results."""
import os
from playwright.sync_api import sync_playwright
from flow_browser_helpers import finish_morning
base=os.environ.get('CAMPUS_TEST_URL','http://127.0.0.1:8000')
with sync_playwright() as p:
 browser=p.chromium.launch(headless=True,executable_path='/usr/bin/chromium')
 for path in ['/prototype/','/demo/campus-demo.html']:
  for width,height in [(390,844),(1440,1000)]:
   page=browser.new_page(viewport={'width':width,'height':height});page.set_default_timeout(7000);errors=[]
   page.on('pageerror',lambda e:errors.append(str(e)))
   page.goto(base+path)
   page.get_by_role('button',name='수업 장소로 간다.',exact=True).click()
   assert page.locator('.scene-visual').is_visible()
   assert page.locator('.scene-feedback .discovery-notice').is_visible()
   page.get_by_role('button',name='입실해 수업을 듣는다.',exact=True).click()
   assert page.locator('.story-page[data-scene="classLesson"]').count()==1
   for selector in ['.scene-visual','.scene-visual .portrait']:
    assert page.locator(selector).evaluate(r'''async el=>{
     const url=getComputedStyle(el).backgroundImage.match(/url\(["']?([^"')]+)["']?\)/)?.[1];
     if(!url)return false;
     const img=new Image();img.src=url;await img.decode();return img.naturalWidth>0;
    }''')
   assert page.locator('.story-content').evaluate(r'''el=>{
    const c=getComputedStyle(el);const linear=x=>{x/=255;return x<=.04045?x/12.92:((x+.055)/1.055)**2.4};
    const lum=s=>{const a=s.match(/[\d.]+/g).slice(0,3).map(Number).map(linear);return .2126*a[0]+.7152*a[1]+.0722*a[2]};
    const a=lum(c.color),b=lum(c.backgroundColor);return (Math.max(a,b)+.05)/(Math.min(a,b)+.05)>=4.5;
   }''')
   if path=='/prototype/':page.screenshot(path=f'/tmp/readability-class-{width}.png',full_page=True)
   page.locator('[data-action="classChoice"]').first.click()
   assert page.evaluate('scrollY')==0
   assert '11:00' in page.locator('.lead').inner_text()
   assert page.locator('.story-content p.notice').is_visible()
   assert page.locator('.story-content p.notice').evaluate('el=>el===document.activeElement')
   assert '수업이 끝났다' in page.locator('.story-content p.notice').inner_text()
   finish_morning(page)
   page.get_by_role('button',name='자유관 쪽으로 걸어간다.',exact=True).click()
   assert page.locator('.story-page[data-scene="encounter"]').count()==1
   assert '차여경' not in page.locator('.scene-person').inner_text()
   assert '수첩' in page.locator('.scene-person').inner_text()
   page.get_by_role('button',name='하던 일을 계속하며 지나간다.',exact=True).click()
   page.get_by_role('button',name='예술동 쪽으로 걸어간다.',exact=True).click()
   page.locator('[data-action="select"][data-value="rehearsal"]').click()
   assert page.locator('.story-page[data-scene="detail"] .scene-visual').is_visible()
   page.get_by_role('button',name='이 활동 진행',exact=True).click()
   assert page.locator('.story-page[data-scene="result"] .scene-visual').is_visible()
   if path=='/prototype/':page.screenshot(path=f'/tmp/readability-result-{width}.png',full_page=True)
   page.get_by_role('button',name='하루 마무리하기',exact=True).click()
   page.get_by_role('button',name='오늘은 귀가한다.',exact=True).click()
   assert page.locator('.scene-location').inner_text()=='자취방'
   page.get_by_role('button',name='휴대폰',exact=True).click()
   assert page.locator('.utility-page').is_visible() and not page.locator('.scene-visual').count()
   page.get_by_role('button',name='학내 커뮤니티',exact=True).click()
   assert page.get_by_role('heading',name='캠퍼스톡',exact=True).is_visible()
   assert page.evaluate('document.documentElement.scrollWidth<=innerWidth')
   assert not errors,errors
   page.close()
 browser.close()
print('Readability browser smoke passed: both builds, mobile and desktop')
