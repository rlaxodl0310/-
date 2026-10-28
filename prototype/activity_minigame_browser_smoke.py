"""Real Space, mouse and touch input; repeat suppression, menu/save pause and scoring."""
import os
from playwright.sync_api import sync_playwright
from vn_browser_helpers import choose,finish_school_morning,read_to_choices
base=os.environ.get('CAMPUS_TEST_URL','http://127.0.0.1:8000')
def event_post(page,id):
 page.locator('.vn-toolbar [data-action="phone"]').click();page.get_by_role('button',name='학내 커뮤니티',exact=True).click();page.get_by_role('button',name='체험',exact=True).click();page.locator(f'[data-action="readPost"][data-value="{id}"]').click();page.locator('[data-action="communityEventView"]').click();choose(page,'eventBegin',id)
def on_target(page):
 page.wait_for_function("""()=>{const marker=document.querySelector('[data-mini-position]'),target=document.querySelector('.mini-target');if(!marker||!target)return false;return Math.abs(parseFloat(marker.style.left)-(parseFloat(target.style.left)+13))<2;}""",timeout=6000,polling='raf')
def hit(page,method='space'):
 on_target(page)
 if method=='space':page.keyboard.press('Space')
 elif method=='touch':page.locator('[data-action="miniHit"]').tap()
 else:page.locator('[data-action="miniHit"]').click()
def save_slot(page,n):
 page.locator('.vn-toolbar [data-action="openQuick"]').click();page.locator('[data-action="quickTab"][data-value="save"]').click();page.locator(f'[data-action="save"][data-value="{n}"]').click()
 return page.evaluate(f"JSON.parse(localStorage.getItem('campus.slot.{n}'))")
with sync_playwright() as p:
 browser=p.chromium.launch(headless=True,executable_path='/usr/bin/chromium')
 for path in ['/prototype/','/demo/campus-demo.html']:
  page=browser.new_page(viewport={'width':390,'height':844},has_touch=True);page.set_default_timeout(8000);errors=[];page.on('pageerror',lambda e:errors.append(str(e)))
  page.goto(base+path);finish_school_morning(page);event_post(page,'basketball-open');choose(page,'eventStep','passing');choose(page,'eventStep','shoot')
  assert page.locator('.mini-panel').count()==1;assert '13:10' in page.locator('.scene-time').inner_text()
  # Space starts the game even with body focus, and never skips dialogue or scrolls.
  page.locator('.vn-panel').focus();page.keyboard.press('Space');page.wait_for_function("parseFloat(document.querySelector('[data-mini-position]').style.left)>8")
  if path=='/prototype/':
   page.screenshot(path='/tmp/activity-minigame-mobile.png');page.set_viewport_size({'width':1440,'height':1000});page.screenshot(path='/tmp/activity-minigame-preview.png');page.set_viewport_size({'width':390,'height':844})
  hit(page);assert '점' in page.locator('.mini-feedback').inner_text();assert '13:10' in page.locator('.scene-time').inner_text()
  snapshot=save_slot(page,1);r=snapshot['activitySessions']['records']['1:basketball-open'];assert r['actionState']['round']==0;assert r['mini']['result']['score']>=85
  page.locator('[data-action="closeQuick"]').click();page.locator('[data-action="miniContinue"]').click()
  choose(page,'eventStep','pass');page.locator('[data-action="miniSkip"]').click();page.locator('[data-action="miniContinue"]').click()
  choose(page,'eventStep','shoot');page.keyboard.press('Space');hit(page);page.locator('[data-action="miniContinue"]').click();assert '13:40' in page.locator('.scene-time').inner_text();choose(page,'eventStep','cool');choose(page,'eventLeave')
  event_post(page,'cooking-open');choose(page,'eventStep','batch');choose(page,'eventStep','gentle');page.locator('[data-action="miniStart"]').click();on_target(page)
  # Repeated keydown while held cannot count as two presses.
  page.keyboard.down('Space');page.keyboard.down('Space');page.keyboard.up('Space');assert '2 / 3' in page.locator('.mini-heading').inner_text()
  snapshot=save_slot(page,2);mini=snapshot['activitySessions']['records']['1:cooking-open']['mini'];assert mini['phase']=='paused' and len(mini['hits'])==1;elapsed=mini['elapsed'];assert snapshot['clock']['minute']==850
  page.reload();page.locator('.vn-toolbar [data-action="openQuick"]').click();page.locator('[data-action="quickTab"][data-value="save"]').click();page.locator('[data-action="load"][data-value="2"]').click();page.locator('[data-action="quickTab"][data-value="tools"]').click();page.locator('[data-action="eventResume"]').click();assert '이어서' in page.locator('[data-action="miniStart"]').inner_text();assert '2 / 3' in page.locator('.mini-heading').inner_text()
  position=page.locator('[data-mini-position]').get_attribute('style');page.wait_for_timeout(200);assert position==page.locator('[data-mini-position]').get_attribute('style')
  page.keyboard.press('Space');hit(page,'mouse');hit(page,'mouse');page.locator('[data-action="miniContinue"]').click();choose(page,'eventStep','serve');assert '14:45' in page.locator('.scene-time').inner_text();choose(page,'eventLeave')
  event_post(page,'carry-open');choose(page,'eventStep','pair');choose(page,'eventStep','clear');page.locator('[data-action="miniStart"]').tap()
  for _ in range(3):hit(page,'touch')
  assert '점' in page.locator('.mini-feedback').inner_text();page.locator('[data-action="miniContinue"]').tap();choose(page,'eventStep','stack');assert '15:45' in page.locator('.scene-time').inner_text()
  final=save_slot(page,3);records=final['activitySessions']['records'];assert len(records['1:basketball-open']['miniGames'])==3;assert records['1:basketball-open']['miniGames'][1]['result']['mode']=='assisted';assert records['1:basketball-open']['actionState']['plays'][0]['success'];assert records['1:cooking-open']['actionState']['texture']=='soft';assert records['1:carry-open']['actionState']['balance']>=60
  page.locator('[data-action="closeQuick"]').click();assert page.evaluate('document.documentElement.scrollWidth<=innerWidth');assert not errors,errors;page.close()
 browser.close()
print('Activity minigames: both builds, real keyboard/mouse/touch, held Space, no early rewards, pause/save/load, score effects and batched time passed')
