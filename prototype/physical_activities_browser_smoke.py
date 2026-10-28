"""Play real action loops, pause/save, and discover an event inside its room."""
import os
from playwright.sync_api import sync_playwright
from vn_browser_helpers import choose,read_to_choices,finish_school_morning,open_tool
base=os.environ.get('CAMPUS_TEST_URL','http://127.0.0.1:8000')
def event_post(page,id):
 page.locator('.vn-toolbar [data-action="phone"]').click();page.get_by_role('button',name='학내 커뮤니티',exact=True).click();page.get_by_role('button',name='체험',exact=True).click()
 page.locator(f'[data-action="readPost"][data-value="{id}"]').click();page.locator('[data-action="communityEventView"]').click();choose(page,'eventBegin',id)
def save_slot(page,n):
 page.locator('.vn-toolbar [data-action="openQuick"]').click();page.locator('[data-action="quickTab"][data-value="save"]').click();page.locator(f'[data-action="save"][data-value="{n}"]').click()
 return page.evaluate(f"JSON.parse(localStorage.getItem('campus.slot.{n}'))")
with sync_playwright() as p:
 browser=p.chromium.launch(headless=True,executable_path='/usr/bin/chromium')
 for path in ['/prototype/','/demo/campus-demo.html']:
  page=browser.new_page(viewport={'width':390,'height':844});page.set_default_timeout(8000);errors=[];page.on('pageerror',lambda e:errors.append(str(e)))
  page.goto(base+path);finish_school_morning(page);event_post(page,'basketball-open')
  assert page.locator('.physical-tableau[data-kind="basketball"]').count()==1
  choose(page,'eventStep','passing');choose(page,'eventStep','pass');assert '13:10' in page.locator('.scene-time').inner_text()
  saved=save_slot(page,1);record=saved['activitySessions']['records']['1:basketball-open'];assert record['actionState']['round']==1
  page.reload();page.locator('.vn-toolbar [data-action="openQuick"]').click();page.locator('[data-action="quickTab"][data-value="save"]').click();page.locator('[data-action="load"][data-value="1"]').click();page.locator('[data-action="quickTab"][data-value="tools"]').click();page.locator('[data-action="eventResume"]').click()
  read_to_choices(page);assert '2/3번째 공격' in page.locator('.vn-line').inner_text()
  choose(page,'eventStep','drive');assert '13:10' in page.locator('.scene-time').inner_text();choose(page,'eventStep','shoot');assert '13:40' in page.locator('.scene-time').inner_text()
  if path=='/prototype/':
   page.screenshot(path='/tmp/basketball-activity-mobile.png');page.set_viewport_size({'width':1440,'height':1000});page.screenshot(path='/tmp/basketball-activity-preview.png');page.set_viewport_size({'width':390,'height':844})
  choose(page,'eventStep','cool');assert '14:00' in page.locator('.scene-time').inner_text();choose(page,'eventLeave')
  event_post(page,'cooking-open');assert page.locator('.physical-tableau[data-kind="cooking"]').count()==1
  choose(page,'eventStep','batch');choose(page,'eventStep','gentle');choose(page,'eventStep','serve');assert '14:45' in page.locator('.scene-time').inner_text()
  if path=='/prototype/':page.set_viewport_size({'width':1440,'height':1000});page.screenshot(path='/tmp/cooking-activity-preview.png');page.set_viewport_size({'width':390,'height':844})
  choose(page,'eventLeave')
  # Reach the activity by actually entering its room, without reading its community post.
  choose(page,'visit','hall');read_to_choices(page)
  if page.locator('.vn-choices [data-action="encounter"]').count():choose(page,'encounter','pass')
  choose(page,'go','buildingDirectory');choose(page,'buildingFloor','2층');choose(page,'buildingArea','meeting');choose(page,'onsiteEvent','carry-open');choose(page,'eventBegin','carry-open')
  assert page.locator('.physical-tableau[data-kind="carry"]').count()==1
  choose(page,'eventStep','pair');choose(page,'eventStep','clear');choose(page,'eventStep','stack');read_to_choices(page)
  assert page.evaluate('document.documentElement.scrollWidth<=innerWidth')
  if path=='/prototype/':page.set_viewport_size({'width':1440,'height':1000});page.screenshot(path='/tmp/carry-activity-preview.png')
  final=save_slot(page,2);records=final['activitySessions']['records'];assert len(records)==3;assert all(r['status']=='completed' for r in records.values());assert [records['1:'+x]['spent'] for x in ['basketball-open','cooking-open','carry-open']]==[60,45,60]
  assert not final['flow'].get('postsRead',{}).get('carry-open');assert final['flow']['activitiesHeard']['carry-open'];assert not final['memberships'];assert not final['inventory']
  assert len(records['1:basketball-open']['actionState']['plays'])==3;assert not errors,errors
  page.close()
 browser.close()
print('Physical activities: both builds, basketball action loop, saved resume, cooking, real onsite carrying, time and no fabricated phone knowledge passed')
