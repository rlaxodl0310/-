"""Three actual school days through the sequential VN interface, plus deliberate absence."""
import os
from playwright.sync_api import sync_playwright
from vn_browser_helpers import choose,open_tool,finish_school_morning
base=os.environ.get('CAMPUS_TEST_URL','http://127.0.0.1:8000')
with sync_playwright() as p:
 browser=p.chromium.launch(headless=True,executable_path='/usr/bin/chromium')
 for path in ['/prototype/','/demo/campus-demo.html']:
  page=browser.new_page(viewport={'width':390,'height':844});page.set_default_timeout(7000);errors=[]
  page.on('pageerror',lambda e:errors.append(str(e)))
  page.goto(base+path)
  for day in range(1,4):
   assert '09:00' in page.locator('.scene-time').inner_text()
   finish_school_morning(page)
   assert ('13:00' if day<3 else '12:30') in page.locator('.scene-time').inner_text()
   open_tool(page,'timetable')
   assert page.locator('.list').filter(has_text='출석').count()==day*2
   page.get_by_role('button',name='← 뒤로',exact=True).click()
   page.locator('[data-action="closeQuick"]').click()
   choose(page,'go','campus');choose(page,'go','dayEnd');choose(page,'freeHome')
   assert page.locator('.scene-location').inner_text()=='자취방'
   if day<3:choose(page,'nextDay')
  page.locator('.vn-toolbar [data-action="openQuick"]').click()
  page.locator('[data-action="quickTab"][data-value="save"]').click()
  page.locator('[data-action="save"][data-value="3"]').click()
  saved=page.evaluate("JSON.parse(localStorage.getItem('campus.slot.3'))")
  assert saved['day']==3 and len(saved['academics']['records'])==6
  assert all(r['status']=='present' for r in saved['academics']['records'].values())
  page.locator('[data-action="load"][data-value="3"]').click()
  assert '18:00' in page.locator('.page').inner_text()
  page.locator('[data-action="quickTab"][data-value="tools"]').click()
  page.locator('[data-action="closeQuick"]').click()
  assert '18:00' in page.locator('.scene-time').inner_text()
  assert page.evaluate('document.documentElement.scrollWidth<=innerWidth')
  assert not errors,errors
  page.close()
  # Another run deliberately chooses a long activity instead of the first lesson.
  other=browser.new_page(viewport={'width':390,'height':844});other.set_default_timeout(7000)
  other.goto(base+path)
  open_tool(other,'travel');other.locator('[data-action="visit"][data-value="arts"]').click()
  choose(other,'select','rehearsal')
  warnings=[]
  for _ in range(20):
   warnings.append(other.locator('.vn-line').inner_text())
   button=other.locator('[data-action="vnNext"]')
   if not button.count():break
   button.click()
  assert any('수업과 겹칩니다' in t for t in warnings)
  choose(other,'act','rehearsal')
  open_tool(other,'timetable')
  assert other.locator('.list').filter(has_text='결석').count()==1
  other.close()
 browser.close()
print('Timetable VN browser smoke passed: both builds, three school days, save/load and absence')
