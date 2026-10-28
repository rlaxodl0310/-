"""Actual VN path to music performance in both distribution formats."""
from playwright.sync_api import sync_playwright
from vn_browser_helpers import choose,finish_school_morning,read_to_choices
import os
base=os.environ.get('CAMPUS_TEST_URL','http://127.0.0.1:8000')
with sync_playwright() as p:
 browser=p.chromium.launch(headless=True,executable_path='/usr/bin/chromium')
 for path in ['/prototype/','/demo/campus-demo.html']:
  page=browser.new_page(viewport={'width':390,'height':844});errors=[];page.on('pageerror',lambda e:errors.append(str(e)))
  page.goto(base+path);finish_school_morning(page)
  page.locator('.vn-toolbar [data-action="phone"]').click();page.get_by_role('button',name='학내 커뮤니티',exact=True).click();page.get_by_role('button',name='모집',exact=True).click()
  page.locator('[data-action="readPost"][data-value="music-recruit"]').click();page.locator('[data-action="communityEventView"]').click();choose(page,'eventBegin','music-recruit')
  assert page.locator('.activity-tableau[data-phase="setup"]').count()==1
  choose(page,'eventStep','vocal');assert page.locator('.activity-tableau[data-phase="practice"][data-role="vocal"]').count()==1
  choose(page,'eventStep','blend')
  page.locator('.vn-toolbar [data-action="openQuick"]').click();page.locator('[data-action="quickTab"][data-value="save"]').click();page.locator('[data-action="save"][data-value="1"]').click()
  page.reload();page.locator('.vn-toolbar [data-action="openQuick"]').click();page.locator('[data-action="quickTab"][data-value="save"]').click();page.locator('[data-action="load"][data-value="1"]').click();page.locator('[data-action="quickTab"][data-value="tools"]').click();page.locator('[data-action="eventResume"]').click()
  choose(page,'eventStep','perform');assert page.locator('.activity-tableau[data-phase="performance"]').count()==1
  assert '15:00' in page.locator('.scene-time').inner_text()
  assert page.evaluate('document.documentElement.scrollWidth<=innerWidth')
  if path=='/prototype/':
   page.screenshot(path='/tmp/music-scene-mobile.png')
   page.set_viewport_size({'width':1440,'height':1000});page.screenshot(path='/tmp/music-scene-preview.png')
  read_to_choices(page);assert not errors,errors
  page.close()
 browser.close()
print('Music scene: both builds, real school and phone route, visual phase/part, saved resume, performance timing passed')
