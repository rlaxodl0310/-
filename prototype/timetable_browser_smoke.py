"""Real fresh-game school day: attendance, shared classes, skipping and save/load."""
import os
from playwright.sync_api import sync_playwright
base=os.environ.get('CAMPUS_TEST_URL','http://127.0.0.1:8000')
with sync_playwright() as p:
 browser=p.chromium.launch(headless=True,executable_path='/usr/bin/chromium')
 for path in ['/prototype/','/demo/campus-demo.html']:
  page=browser.new_page(viewport={'width':390,'height':844});page.set_default_timeout(7000);errors=[]
  page.on('pageerror',lambda e:errors.append(str(e)))
  page.goto(base+path)
  assert '09:00' in page.locator('.badge').inner_text()
  assert '보컬 앙상블' in page.locator('.prompt').inner_text()
  assert not page.locator('.prompt [data-action="visit"]').count()
  if path=='/prototype/':page.screenshot(path='/tmp/school-arrival-preview.png',full_page=True)
  page.get_by_role('button',name='수업 장소로 간다.',exact=True).click()
  assert '4층 구석 대형 합주실' in page.locator('.school-summary').inner_text()
  page.get_by_role('button',name='입실해 수업을 듣는다.',exact=True).click()
  assert page.get_by_role('heading',name='보컬 앙상블',exact=True).is_visible()
  if path=='/prototype/':page.screenshot(path='/tmp/classroom-preview.png',full_page=True)
  page.get_by_role('button',name='다른 파트의 소리를 듣고 내 음량과 호흡을 맞춘다.',exact=True).click()
  assert '11:00' in page.locator('.lead').inner_text()
  page.get_by_role('button',name='수업 장소로 간다.',exact=True).click()
  page.get_by_role('button',name='입실해 수업을 듣는다.',exact=True).click()
  page.locator('[data-action="classChoice"]').first.click()
  assert '13:00' in page.locator('.lead').inner_text()
  page.get_by_role('button',name='휴대폰',exact=True).click()
  page.get_by_role('button',name='시간표 · 출석',exact=True).click()
  assert page.get_by_role('heading',name='시간표 · 출석',exact=True).is_visible()
  assert page.locator('.list').filter(has_text='출석').count()==2
  assert '전공 보컬 실기' in page.locator('.page').inner_text() and '채플' in page.locator('.page').inner_text()
  # Save the real attended courses through the ordinary menu.
  for _ in range(3):
   if page.locator('.explore').count():break
   page.get_by_role('button',name='← 뒤로',exact=True).click()
  page.get_by_role('button',name='메뉴',exact=True).click()
  page.get_by_role('button',name='저장',exact=True).first.click()
  saved=page.evaluate("JSON.parse(localStorage.getItem('campus.slot.1'))")
  assert len(saved['academics']['records'])==2
  assert saved['academics']['records']['1:taei:ensemble']['status']=='present'
  page.reload()
  page.get_by_role('button',name='메뉴',exact=True).click()
  page.get_by_role('button',name='불러오기',exact=True).first.click()
  assert '13:00' in page.locator('.page').inner_text()
  page.get_by_role('button',name='← 뒤로',exact=True).click()
  assert '공강' in page.locator('.prompt').inner_text()
  # A new day has courses again; going home early records absence, not attendance.
  page.get_by_role('button',name='오늘은 집으로 돌아간다.',exact=True).click()
  page.get_by_role('button',name='오늘은 귀가한다.',exact=True).click()
  page.get_by_role('button',name='2일차 시작하기',exact=True).click()
  assert '09:00' in page.locator('.badge').inner_text() and '이야기와 표현' in page.locator('.prompt').inner_text()
  page.get_by_role('button',name='오늘은 집으로 돌아간다.',exact=True).click()
  page.get_by_role('button',name='오늘은 귀가한다.',exact=True).click()
  page.get_by_role('button',name='휴대폰',exact=True).click()
  page.get_by_role('button',name='시간표 · 출석',exact=True).click()
  assert page.locator('.list').filter(has_text='결석').count()==2
  assert page.evaluate('document.documentElement.scrollWidth<=innerWidth')
  assert not errors,errors
  page.close()
  # Explicitly ignoring a displayed course conflict produces an actual absence.
  other=browser.new_page(viewport={'width':390,'height':844});other.set_default_timeout(7000)
  other.goto(base+path)
  other.get_by_role('button',name='수업 전에 다른 곳에 잠깐 들른다.',exact=True).click()
  other.locator('[data-action="visit"][data-value="arts"]').click()
  other.locator('[data-action="select"][data-value="rehearsal"]').click()
  assert '수업과 겹칩니다' in other.locator('.page').inner_text()
  other.get_by_role('button',name='수업과 겹치는 것을 알고 활동 진행',exact=True).click()
  other.get_by_role('button',name='휴대폰',exact=True).click()
  other.get_by_role('button',name='시간표 · 출석',exact=True).click()
  assert other.locator('.list').filter(has_text='결석').count()==1
  other.close()
 browser.close()
print('Timetable school-day browser smoke passed: fresh game in both builds')
