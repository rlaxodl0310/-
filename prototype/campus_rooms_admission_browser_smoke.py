"""Concrete floor/room navigation and an on-site recruitment process, in both builds."""
import os
from playwright.sync_api import sync_playwright
from vn_browser_helpers import choose,open_tool,finish_school_morning,read_to_choices
base=os.environ.get('CAMPUS_TEST_URL','http://127.0.0.1:8000')
with sync_playwright() as p:
 browser=p.chromium.launch(headless=True,executable_path='/usr/bin/chromium')
 for path in ['/prototype/','/demo/campus-demo.html']:
  page=browser.new_page(viewport={'width':390,'height':844});page.set_default_timeout(7000);errors=[]
  page.on('pageerror',lambda e:errors.append(str(e)))
  page.goto(base+path);finish_school_morning(page)
  # The second actual class was in room 401, not a whole floor range.
  assert '401' in page.locator('.scene-location').inner_text()
  choose(page,'go','buildingDirectory');choose(page,'buildingFloor','4층');choose(page,'buildingArea','room402')
  assert '402' in page.locator('.scene-location').inner_text()
  # Club guide -> application; no membership shortcut.
  page.locator('.vn-toolbar [data-action="phone"]').click()
  page.get_by_role('button',name='학내 커뮤니티',exact=True).click()
  page.get_by_role('button',name='모집',exact=True).click()
  page.locator('[data-action="readPost"][data-value="volunteer-recruit"]').click()
  page.get_by_role('button',name='이 글의 모집 안내를 자세히 읽는다.',exact=True).click()
  choose(page,'openClubApply','volunteer');choose(page,'submitClubApply','interest')
  choose(page,'openInterview','volunteer');read_to_choices(page)
  assert not page.locator('[data-action="interviewAnswer"]').count()
  # Go to the actual building and room; early application needs real elapsed time.
  open_tool(page,'travel');page.locator('[data-action="visit"][data-value="hall"]').click()
  if page.locator('.vn-stage').get_attribute('data-vn-screen')=='encounter':choose(page,'encounter','pass')
  choose(page,'go','buildingDirectory');choose(page,'buildingFloor','2층');choose(page,'buildingArea','clubs')
  choose(page,'wait')
  choose(page,'openInterview','volunteer');choose(page,'interviewAnswer','honest');choose(page,'interviewAnswer','coordinate')
  choose(page,'go','place');choose(page,'wait')
  page.locator('.vn-toolbar [data-action="phone"]').click()
  page.get_by_role('button',name='읽어둔 동아리 안내',exact=True).click()
  page.locator('[data-action="clubDetail"][data-value="volunteer"]').click()
  choose(page,'joinClub','volunteer')
  page.locator('.vn-toolbar [data-action="openQuick"]').click()
  page.locator('[data-action="quickTab"][data-value="save"]').click()
  page.locator('[data-action="save"][data-value="1"]').click()
  data=page.evaluate("JSON.parse(localStorage.getItem('campus.slot.1'))")
  assert data['memberships']['volunteer'];assert data['clubApplications']['volunteer']['status']=='accepted'
  assert all(not c.get('introduced') for c in data['contacts'].values())
  assert all(c.get('nameLevel','unknown')=='unknown' for c in data['contacts'].values())
  assert not errors,errors
  page.close()
 browser.close()
print('Rooms and admissions browser smoke passed: both builds, specific rooms, application, physical interview, wait, acceptance, no roster leak')
