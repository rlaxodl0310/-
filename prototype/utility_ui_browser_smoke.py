"""Phone/menu navigation, notification state, save slots and responsive layouts."""
import os
from playwright.sync_api import sync_playwright
base=os.environ.get('CAMPUS_TEST_URL','http://127.0.0.1:8000')
with sync_playwright() as p:
 browser=p.chromium.launch(headless=True,executable_path='/usr/bin/chromium')
 for path in ['/prototype/','/demo/campus-demo.html']:
  for width,height in [(320,780),(390,844),(1440,1000)]:
   page=browser.new_page(viewport={'width':width,'height':height});page.set_default_timeout(7000);errors=[]
   page.on('pageerror',lambda e:errors.append(str(e)))
   page.goto(base+path)
   page.locator('.vn-toolbar [data-action="openQuick"]').click()
   assert page.locator('.menu-dashboard').is_visible()
   assert page.get_by_role('heading',name='지금 할 일',exact=True).is_visible()
   assert page.locator('.featured-shortcuts .utility-shortcut').count()==2
   if path=='/prototype/' and width in [390,1440]:page.screenshot(path=f'/tmp/utility-menu-{width}.png',full_page=True)
   assert page.evaluate('document.documentElement.scrollWidth<=innerWidth')
   page.locator('[data-action="quickTab"][data-value="save"]').click()
   assert page.locator('.save-slot button:disabled').count()==3
   assert not page.locator('.example-settings').get_attribute('open')
   page.locator('[data-action="save"][data-value="1"]').click()
   assert '09:00' in page.locator('.save-slot').first.inner_text()
   assert page.locator('[data-action="load"][data-value="1"]').is_enabled()
   page.locator('[data-action="closeQuick"]').click()
   page.locator('.vn-toolbar [data-action="phone"]').click()
   assert page.locator('.phone-home').is_visible()
   assert page.locator('.phone-clock strong').inner_text()=='09:00'
   assert page.locator('.phone-app-grid .utility-shortcut').count()>=8
   assert page.locator('.phone-app-grid').first.evaluate('el=>getComputedStyle(el).gridTemplateColumns.split(" ").length')==3
   if path=='/prototype/' and width in [390,1440]:page.screenshot(path=f'/tmp/utility-phone-{width}.png',full_page=True)
   assert page.evaluate('document.documentElement.scrollWidth<=innerWidth')
   page.get_by_role('button',name='학내 커뮤니티',exact=True).click()
   assert page.get_by_role('heading',name='캠퍼스톡',exact=True).is_visible()
   page.get_by_role('button',name='← 뒤로',exact=True).click()
   assert page.locator('.phone-clock strong').inner_text()=='09:00'
   assert not errors,errors
   page.close()
 # Real unread data: badge clears on reading, clock stays unchanged.
 page=browser.new_page(viewport={'width':390,'height':844});page.goto(base+'/prototype/')
 page.evaluate('''async()=>{
  const {newGame,save}=await import('/prototype/simulation.js');const s=newGame();
  s.messages=[{day:1,from:'교내 안내',text:'오늘 수업 장소를 확인해 주세요.'},{day:1,from:'동아리 모집 안내',text:'공개 모집 안내가 있습니다.'}];
  localStorage.setItem('campus.slot.2',save(s));
 }''')
 page.locator('.vn-toolbar [data-action="openQuick"]').click()
 page.locator('[data-action="quickTab"][data-value="save"]').click()
 page.locator('[data-action="load"][data-value="2"]').click()
 page.locator('[data-action="quickTab"][data-value="tools"]').click()
 page.locator('[data-action="closeQuick"]').click()
 page.locator('.vn-toolbar [data-action="phone"]').click()
 assert page.locator('.phone-app-grid [data-value="messages"] .shortcut-badge').inner_text()=='2'
 page.get_by_role('button',name='메시지',exact=True).click()
 page.get_by_role('button',name='← 뒤로',exact=True).click()
 assert page.locator('.phone-app-grid [data-value="messages"] .shortcut-badge').count()==0
 assert page.locator('.phone-clock strong').inner_text()=='09:00'
 page.close();browser.close()
print('Utility UI browser smoke passed: both builds at 320/390/1440px, app navigation, saves and unread badges')
