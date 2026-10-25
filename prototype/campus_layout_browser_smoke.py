"""Confirmed ten-building directory, floor exploration and the Creative library entrance."""
import os
from playwright.sync_api import sync_playwright
base=os.environ.get('CAMPUS_TEST_URL','http://127.0.0.1:8000')
with sync_playwright() as p:
 browser=p.chromium.launch(headless=True,executable_path='/usr/bin/chromium')
 for path in ['/prototype/','/demo/campus-demo.html']:
  page=browser.new_page(viewport={'width':390,'height':844});page.set_default_timeout(7000);errors=[]
  page.on('pageerror',lambda e:errors.append(str(e)))
  page.goto(base+path)
  def visit(id):
   page.get_by_role('button',name='휴대폰',exact=True).click()
   page.get_by_role('button',name='지도',exact=True).click()
   page.locator(f'[data-action="visit"][data-value="{id}"]').click()
  page.get_by_role('button',name='휴대폰',exact=True).click()
  page.get_by_role('button',name='지도',exact=True).click()
  assert page.locator('.grid').first.locator('[data-action="visit"]').count()==10
  main=page.locator('.grid').first.inner_text()
  for name in ['본부동','예술동','음악관','체육관','외식관','창조관','은혜관','자유관','조형관','백석홀']:assert name in main
  assert '학생회관' not in main and '음악 연습동' not in main
  if path=='/prototype/':page.screenshot(path='/tmp/campus-buildings-preview.png',full_page=True)
  page.locator('[data-action="visit"][data-value="arts"]').click()
  page.get_by_role('button',name='건물 안의 다른 공간으로 간다.',exact=True).click()
  for label in ['1층 · 시청각실','1층 · 뮤지컬홀·대형 무대','2~7층 · 강의실 구역','4층 구석 · 대형 합주실','7층 · 좁은 연습실 구역','8층 · 좁은 연습실 구역']:
   assert page.get_by_role('button',name=label,exact=True).is_visible()
  if path=='/prototype/':page.screenshot(path='/tmp/campus-layout-preview.png',full_page=True)
  page.get_by_role('button',name='4층 구석 · 대형 합주실',exact=True).click()
  assert '4층 구석' in page.locator('.page').inner_text()
  page.get_by_role('button',name='← 뒤로',exact=True).click()
  page.get_by_role('button',name='메뉴',exact=True).click()
  page.get_by_role('button',name='저장',exact=True).first.click()
  stored=page.evaluate("JSON.parse(localStorage.getItem('campus.slot.1'))")
  assert stored['buildingArea']=={'place':'arts','id':'band'}
  assert '예술동 4층 구석 대형 합주실' in stored['known']
  assert '예술동 8층 좁은 연습실 구역' not in stored['known']
  visit('creative')
  page.get_by_role('button',name='건물 안의 다른 공간으로 간다.',exact=True).click()
  page.get_by_role('button',name='도서관',exact=True).click()
  assert page.get_by_role('heading',name='창조관 · 도서관',exact=True).is_visible()
  visit('headquarters')
  page.get_by_role('button',name='건물 안의 다른 공간으로 간다.',exact=True).click()
  assert page.get_by_role('button',name='지하 · 지하 공간',exact=True).is_visible()
  assert page.get_by_role('button',name='은행',exact=True).is_visible()
  page.get_by_role('button',name='은행',exact=True).click()
  assert '은행 업무' in page.locator('p.notice').inner_text()
  visit('baekseok')
  assert '채플' in page.locator('.page').inner_text()
  assert page.evaluate('document.documentElement.scrollWidth<=innerWidth')
  assert not errors,errors
  page.close()
 browser.close()
print('Confirmed campus layout browser smoke passed: both builds')
