"""Authored-mode snapshots: exercise encounters and capacity-dependent VN choices."""
import os
from playwright.sync_api import sync_playwright
from vn_browser_helpers import choose,open_tool,read_to_choices
base=os.environ.get('CAMPUS_TEST_URL','http://127.0.0.1:8000')
with sync_playwright() as p:
 browser=p.chromium.launch(headless=True,executable_path='/usr/bin/chromium')
 for path in ['/prototype/','/demo/campus-demo.html']:
  for minute,location,mood in [(560,'creative','rushed'),(790,'hall','resting'),(850,'hall','overwhelmed'),(1230,'hall','drained')]:
   page=browser.new_page(viewport={'width':390,'height':844});page.set_default_timeout(7000);errors=[]
   page.on('pageerror',lambda e:errors.append(str(e)))
   page.goto(base+path)
   page.evaluate('''async ({minute,mood})=>{
    const {newGame,save}=await import('/prototype/simulation.js');
    const {noteNpcExperience}=await import('/prototype/npc-state.js');
    const s=newGame('friend');s.dialogue.engine='authored';s.clock.minute=minute;s.phase=minute>=1080?'evening':'afternoon';
    if(mood==='overwhelmed')noteNpcExperience(s,'yeogyeong','test-pressure',{stress:60},'test-pressure');
    localStorage.setItem('campus.slot.1',save(s));
   }''',{'minute':minute,'mood':mood})
   page.locator('.vn-toolbar [data-action="openQuick"]').click()
   page.locator('[data-action="quickTab"][data-value="save"]').click()
   page.locator('[data-action="load"][data-value="1"]').click()
   page.locator('[data-action="quickTab"][data-value="tools"]').click()
   page.locator('[data-action="closeQuick"]').click()
   open_tool(page,'travel');page.locator(f'[data-action="visit"][data-value="{location}"]').click()
   choose(page,'encounter','engage');read_to_choices(page)
   text=page.locator('.vn-line').inner_text()
   expected={'rushed':'가기 직전','resting':'쉬는 중','overwhelmed':'한꺼번에','drained':'틀릴 것'}[mood]
   assert expected in text,(path,mood,text)
   assert page.locator('.vn-choices button').count()<=3
   if mood=='resting':
    choose(page,'answer','scene:ctxTopic');read_to_choices(page)
    assert '계산' in page.locator('.vn-line').inner_text()
   elif mood=='overwhelmed':
    choose(page,'answer','scene:ctxHelp');read_to_choices(page)
    assert '확인' in page.locator('.vn-line').inner_text()
    choose(page,'answer','scene:ctxInsist');read_to_choices(page)
    assert '빠른 게 문제가' in page.locator('.vn-line').inner_text()
   else:
    if path=='/prototype/' and mood=='drained':page.screenshot(path='/tmp/npc-state-preview.png',full_page=True)
    choose(page,'answer','scene:ctxBrief');choose(page,'answer','scene:ctxBye')
    assert page.locator('.vn-stage').get_attribute('data-vn-screen')=='place'
   assert not errors,errors
   assert page.evaluate('document.documentElement.scrollWidth<=innerWidth')
   page.close()
 browser.close()
print('NPC state browser smoke passed: both builds; before class, break, overload, fatigue and refusal')
