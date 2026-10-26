"""Community post -> real staged activity, interruption, saved resume, rain and musical roles."""
import os
from playwright.sync_api import sync_playwright
from vn_browser_helpers import choose,open_tool,finish_school_morning,read_to_choices
base=os.environ.get('CAMPUS_TEST_URL','http://127.0.0.1:8000')
def open_event(page,post):
 page.locator('.vn-toolbar [data-action="phone"]').click()
 page.get_by_role('button',name='학내 커뮤니티',exact=True).click()
 page.get_by_role('button',name='모집',exact=True).click()
 page.locator(f'[data-action="readPost"][data-value="{post}"]').click()
 page.locator('[data-action="communityEventView"]').click()

with sync_playwright() as p:
 browser=p.chromium.launch(headless=True,executable_path='/usr/bin/chromium')
 for path in ['/prototype/','/demo/campus-demo.html']:
  page=browser.new_page(viewport={'width':390,'height':844});page.set_default_timeout(7000);errors=[]
  page.on('pageerror',lambda e:errors.append(str(e)))
  page.goto(base+path);finish_school_morning(page)
  # Reading tomorrow's event does not start it early.
  open_event(page,'football-recruit');read_to_choices(page)
  assert not page.locator('.vn-choices [data-action="eventBegin"]').count()
  choose(page,'go','communityPost')
  page.get_by_role('button',name='← 뒤로',exact=True).click()
  page.locator('[data-action="readPost"][data-value="volunteer-recruit"]').click()
  page.locator('[data-action="communityEventView"]').click()
  choose(page,'eventBegin','volunteer-recruit')
  assert '13:00' in page.locator('.scene-time').inner_text()
  choose(page,'eventStep','sort')
  assert '13:30' in page.locator('.scene-time').inner_text()
  read_to_choices(page)
  assert page.locator('.vn-choices button').count()<=3
  if path=='/prototype/':page.screenshot(path='/tmp/community-activity-preview.png',full_page=True)
  choose(page,'eventPause')
  page.locator('.vn-toolbar [data-action="openQuick"]').click()
  assert page.locator('[data-action="eventResume"]').count()==1
  page.locator('[data-action="quickTab"][data-value="save"]').click()
  page.locator('[data-action="save"][data-value="1"]').click()
  saved=page.evaluate("JSON.parse(localStorage.getItem('campus.slot.1'))")
  assert saved['freeDay']['completed']==[] and saved['memberships']=={}
  assert saved['activitySessions']['records']['1:volunteer-recruit']['step']==1
  assert saved['activitySessions']['records']['1:volunteer-recruit']['spent']==30
  page.reload();page.locator('.vn-toolbar [data-action="openQuick"]').click()
  page.locator('[data-action="quickTab"][data-value="save"]').click()
  page.locator('[data-action="load"][data-value="1"]').click()
  page.locator('[data-action="quickTab"][data-value="tools"]').click()
  page.locator('[data-action="eventResume"]').click()
  choose(page,'eventStep','carry');choose(page,'eventStep','handover')
  assert '16:00' in page.locator('.scene-time').inner_text()
  open_tool(page,'schedule')
  assert '봉사 활동' in page.locator('.page').inner_text()
  page.get_by_role('button',name='← 뒤로',exact=True).click()
  page.locator('[data-action="closeQuick"]').click()
  choose(page,'eventLeave')
  # A second posted activity can fit, but its completed public session cannot be farmed again.
  open_event(page,'music-recruit');choose(page,'eventBegin','music-recruit')
  choose(page,'eventStep','bass');choose(page,'eventStep','mark');choose(page,'eventStep','gear')
  assert '18:00' in page.locator('.scene-time').inner_text()
  read_to_choices(page)
  choose(page,'eventLeave');choose(page,'go','dayEnd');choose(page,'freeHome');choose(page,'nextDay')
  finish_school_morning(page)
  open_event(page,'football-recruit');choose(page,'eventBegin','football-recruit')
  assert '체력단련실' in page.locator('.scene-location').inner_text()
  choose(page,'eventStep','warm');read_to_choices(page)
  assert page.locator('.vn-choices [data-value="balance"]').count()==1
  assert not page.locator('.vn-choices [data-value="pass"]').count()
  choose(page,'eventStep','balance');choose(page,'eventStep','feedback')
  assert '14:30' in page.locator('.scene-time').inner_text()
  page.locator('.vn-toolbar [data-action="openQuick"]').click()
  page.locator('[data-action="quickTab"][data-value="save"]').click()
  page.locator('[data-action="save"][data-value="2"]').click()
  final=page.evaluate("JSON.parse(localStorage.getItem('campus.slot.2'))")
  assert len(final['activitySessions']['records'])==3
  assert all(r['status']=='completed' for r in final['activitySessions']['records'].values())
  assert final['memberships']=={} and not final['inventory']
  assert '축구 동아리 실내 운동 공간' in final['known'] and '운동장' not in final['known']
  assert page.evaluate('document.documentElement.scrollWidth<=innerWidth')
  assert not errors,errors
  page.close()
 browser.close()
print('Community activity browser smoke passed: both builds, three public events, paused save/load and rain')
