"""Outdoor exploration during class, premium activity CG and visible character acting."""
import os
from playwright.sync_api import sync_playwright
from vn_browser_helpers import choose,read_to_choices,open_tool
base=os.environ.get('CAMPUS_TEST_URL','http://127.0.0.1:8000')
with sync_playwright() as p:
 browser=p.chromium.launch(headless=True,executable_path='/usr/bin/chromium')
 for path in ['/prototype/','/demo/campus-demo.html']:
  page=browser.new_page(viewport={'width':390,'height':844});errors=[];page.on('pageerror',lambda e:errors.append(str(e)));page.goto(base+path)
  choose(page,'visit','field');assert page.locator('.outdoor-scene').count()==1
  choose(page,'outdoorActivity','jog');assert '09:30' in page.locator('.scene-time').inner_text();choose(page,'outdoorActivity','jog');assert '10:00' in page.locator('.scene-time').inner_text()
  if path=='/prototype/':page.screenshot(path='/tmp/outdoor-freedom-preview.png')
  open_tool(page,'travel');page.locator('[data-action="visit"][data-value="outdoorCourt"]').click();assert page.locator('.outdoor-scene').count()==1;choose(page,'outdoorActivity','shots')
  page.locator('.vn-toolbar [data-action="phone"]').click();page.get_by_role('button',name='학내 커뮤니티',exact=True).click();page.get_by_role('button',name='체험',exact=True).click();page.locator('[data-action="readPost"][data-value="basketball-open"]').click();page.locator('[data-action="communityEventView"]').click();choose(page,'eventBegin','basketball-open')
  assert page.locator('.activity-cg-main').count()==1
  assert page.locator('.activity-cg-main').evaluate("n=>getComputedStyle(n).backgroundImage").find('none')==-1
  choose(page,'eventStep','footwork');choose(page,'eventStep','shoot');page.keyboard.press('Space');assert page.locator('.mini-panel').count()==1
  if path=='/prototype/':page.screenshot(path='/tmp/premium-activity-preview.png')
  assert page.evaluate('document.documentElement.scrollWidth<=innerWidth');assert not errors,errors;page.close()
 # Authored fixtures vary observable mood while keeping the same real encounter path.
 for mood,row in [('bright','0'),('overwhelmed','1'),('focused','2')]:
  page=browser.new_page(viewport={'width':390,'height':844});page.goto(base+'/prototype/')
  page.evaluate("""async mood=>{const {newAfternoonScenario,save}=await import('/prototype/simulation.js');const s=newAfternoonScenario();s.clock.minute=mood==='focused'?840:780;s.npcLife={events:[],seen:{}};if(mood!=='focused')s.npcLife.events.push({person:'yeogyeong',day:1,minute:s.clock.minute,kind:'fixture',warmth:mood==='bright'?20:0,stress:mood==='overwhelmed'?80:0});localStorage.setItem('campus.slot.1',save(s));}""",mood)
  page.locator('.vn-toolbar [data-action="openQuick"]').click();page.locator('[data-action="quickTab"][data-value="save"]').click();page.locator('[data-action="load"][data-value="1"]').click();page.locator('[data-action="quickTab"][data-value="tools"]').click();page.locator('[data-action="go"][data-value="travel"]').click();page.locator('[data-action="visit"][data-value="hall"]').click()
  choose(page,'encounter','engage')
  assert page.locator(f'.portrait.expression-portrait[data-expression="{row}"]').count()==1
  if mood=='bright':page.screenshot(path='/tmp/character-acting-preview.png')
  before=page.locator('.portrait').get_attribute('data-expression');page.locator('.vn-toolbar [data-action="openQuick"]').click();page.locator('[data-action="closeQuick"]').click();assert page.locator('.portrait').get_attribute('data-expression')==before
  page.close()
 browser.close()
print('Freedom/art: both builds, morning outdoor activities and class skipping, premium CG, three actual mood poses and menu stability passed')
