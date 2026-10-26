"""Rainy lunch: genuine meeting -> names -> saved resume -> walk/meal -> later callback.
The second case has high affection but a real near-term commitment and must decline.
"""
import os
from playwright.sync_api import sync_playwright
from vn_browser_helpers import choose,open_tool,read_to_choices,finish_school_morning
base=os.environ.get('CAMPUS_TEST_URL','http://127.0.0.1:8000')
def load_slot(page,slot=1):
 page.locator('.vn-toolbar [data-action="openQuick"]').click()
 page.locator('[data-action="quickTab"][data-value="save"]').click()
 page.locator(f'[data-action="load"][data-value="{slot}"]').click()
 page.locator('[data-action="quickTab"][data-value="tools"]').click()
def save_slot(page,slot=2):
 page.locator('.vn-toolbar [data-action="openQuick"]').click()
 page.locator('[data-action="quickTab"][data-value="save"]').click()
 page.locator(f'[data-action="save"][data-value="{slot}"]').click()
 return page.evaluate(f"JSON.parse(localStorage.getItem('campus.slot.{slot}'))")
with sync_playwright() as p:
 browser=p.chromium.launch(headless=True,executable_path='/usr/bin/chromium')
 for path in ['/prototype/','/demo/campus-demo.html']:
  for busy in [False,True]:
   page=browser.new_page(viewport={'width':390,'height':844});page.set_default_timeout(8000);errors=[]
   page.on('pageerror',lambda e:errors.append(str(e)))
   page.goto(base+path)
   page.evaluate('''async busy=>{
    const {newGame,save}=await import('/prototype/simulation.js');
    const s=newGame(busy?'close':'acquaintance');s.day=2;s.clock.minute=540;s.campusVariation={seed:1,plans:{}};
    if(busy)s.appointments.push({person:'yeogyeong',day:2,minute:790,status:'pending',kind:'meeting',location:'hall',label:'미리 잡아둔 약속'});
    localStorage.setItem('campus.slot.1',save(s));
   }''',busy)
   load_slot(page);page.locator('[data-action="closeQuick"]').click()
   finish_school_morning(page)
   open_tool(page,'travel');page.locator('[data-action="visit"][data-value="hall"]').click()
   if not busy:assert '차여경' not in page.locator('.vn-stage').inner_text()
   choose(page,'encounter','engage');read_to_choices(page)
   assert page.locator('.vn-stage').get_attribute('data-vn-screen')=='rainLunch'
   if busy:
    choose(page,'lunchAction','invite');read_to_choices(page)
    data=save_slot(page)
    r=data['rainLunch']['episodes']['2:yeogyeong'];assert r['outcome']=='declined' and not r['walked'] and not r['ate']
    assert data['clock']['minute']==780
    assert not errors,errors;page.close();continue
   assert '차여경' not in page.locator('.vn-stage').inner_text()
   choose(page,'lunchAction','introduce');read_to_choices(page)
   assert page.locator('.vn-speaker').inner_text()=='차여경'
   data=save_slot(page);assert data['clock']['minute']==780
   assert data['contacts']['yeogyeong']['introduced'] and not data['contacts']['yeogyeong'].get('playerSeniorityKnown',False)
   page.reload();load_slot(page,2);page.locator('[data-action="resumeLunch"]').click()
   choose(page,'lunchAction','invite');choose(page,'lunchAction','covered');choose(page,'lunchAction','share');read_to_choices(page)
   assert '외식관' in page.locator('.scene-location').inner_text() and '101' in page.locator('.scene-location').inner_text()
   assert '13:15' in page.locator('.scene-time').inner_text()
   if path=='/prototype/':page.screenshot(path='/tmp/rain-lunch-preview.png',full_page=True)
   choose(page,'lunchAction','wait');read_to_choices(page)
   assert '13:40' in page.locator('.scene-time').inner_text()
   choose(page,'lunchAction','finish');choose(page,'lunchAction','leave')
   choose(page,'wait')
   open_tool(page,'travel');page.locator('[data-action="visit"][data-value="hall"]').click()
   choose(page,'encounter','engage');read_to_choices(page)
   data=save_slot(page)
   assert data['rainLunch']['episodes']['2:yeogyeong']['ate']
   assert data['dialogue']['sessions']['2:afternoon:yeogyeong']['response']['plan']['topic']=='shared-lunch'
   assert '2:lunch' in data['buildingLife']['meals']
   assert all(not data['contacts'].get(id,{}).get('introduced') for id in ['seoyeon','soyul'])
   assert page.evaluate('document.documentElement.scrollWidth<=innerWidth')
   assert not errors,errors
   page.close()
 browser.close()
print('Rain lunch browser smoke passed: both builds, real classes, unknown names, saved resume, shared meal, later memory and busy refusal')
