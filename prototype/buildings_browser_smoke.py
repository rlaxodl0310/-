"""All added buildings via the visible phone map, local actions and save/load."""
import os
from playwright.sync_api import sync_playwright
base=os.environ.get('CAMPUS_TEST_URL','http://127.0.0.1:8000')
with sync_playwright() as p:
 browser=p.chromium.launch(headless=True,executable_path='/usr/bin/chromium')
 for path in ['/prototype/','/demo/campus-demo.html']:
  page=browser.new_page(viewport={'width':390,'height':844});page.set_default_timeout(7000);errors=[]
  page.on('pageerror',lambda e:errors.append(str(e)))
  page.goto(base+path)
  assert page.locator('.prompt [data-value="cafeteria"]').is_visible()
  for id,name,action in [('cafeteria','외식관','menu'),('dorm','기숙사','guide'),('academic','은혜관','rooms'),('music','음악관','voice'),('gym','체육관','stretch')]:
   page.get_by_role('button',name='휴대폰',exact=True).click()
   page.get_by_role('button',name='지도',exact=True).click()
   assert page.get_by_role('heading',name='교내 지도와 장소',exact=True).is_visible()
   assert page.locator('[data-action="visit"]').count()==13
   if id=='cafeteria' and path=='/prototype/':page.screenshot(path='/tmp/campus-buildings-preview.png',full_page=True)
   page.locator(f'[data-action="visit"][data-value="{id}"]').click()
   assert page.get_by_role('heading',name=name,exact=True).is_visible()
   assert 'undefined' not in page.locator('.page').inner_text()
   assert not page.locator('[data-action="encounter"]').count()
   page.locator(f'[data-action="buildingActivity"][data-value="{action}"]').click()
   if id=='cafeteria':
    page.get_by_role('button',name='배식대에서 식사를 받아 먹는다.',exact=True).click()
    assert not page.locator('[data-action="buildingActivity"][data-value="meal"]').count()
   if id=='dorm':assert '자취방' in page.locator('p.notice').inner_text()
   if id=='music':assert page.get_by_role('button',name='건물 안의 다른 공간으로 간다.',exact=True).is_visible()
   assert page.evaluate('document.documentElement.scrollWidth<=innerWidth')
  page.get_by_role('button',name='← 뒤로',exact=True).click()
  page.get_by_role('button',name='메뉴',exact=True).click()
  page.get_by_role('button',name='저장',exact=True).first.click()
  stored=page.evaluate("JSON.parse(localStorage.getItem('campus.slot.1'))")
  assert stored['location']=='gym' and len(stored['buildingLife']['history'])==6
  assert len(stored['buildingLife']['meals'])==1
  page.reload()
  page.get_by_role('button',name='메뉴',exact=True).click()
  page.get_by_role('button',name='불러오기',exact=True).first.click()
  page.get_by_role('button',name='휴대폰',exact=True).click()
  page.get_by_role('button',name='지도',exact=True).click()
  assert '현재 위치' in page.locator('[data-value="gym"]').inner_text()
  assert not errors,errors
  page.close()
 browser.close()
print('Campus buildings browser smoke passed: both builds, five buildings and save/load')
