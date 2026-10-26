"""Normal game defaults to generated dialogue; seed changes speech, rendering never rerolls it."""
import os
from playwright.sync_api import sync_playwright
from vn_browser_helpers import choose,open_tool,read_to_choices
base=os.environ.get('CAMPUS_TEST_URL','http://127.0.0.1:8000')
def save_snapshot(page):
 page.locator('.vn-toolbar [data-action="openQuick"]').click()
 page.locator('[data-action="quickTab"][data-value="save"]').click()
 page.locator('[data-action="save"][data-value="2"]').click()
 data=page.evaluate("JSON.parse(localStorage.getItem('campus.slot.2'))")
 page.locator('[data-action="closeQuick"]').click()
 return data
with sync_playwright() as p:
 browser=p.chromium.launch(headless=True,executable_path='/usr/bin/chromium')
 for path in ['/prototype/','/demo/campus-demo.html']:
  texts=[]
  for seed in [176527,98271931,6281597]:
   page=browser.new_page(viewport={'width':390,'height':844});page.set_default_timeout(7000);errors=[]
   page.on('pageerror',lambda e:errors.append(str(e)))
   page.goto(base+path)
   page.evaluate('''async seed=>{
    const {newGame,save}=await import('/prototype/simulation.js');
    const s=newGame('friend');s.clock.minute=820;
    s.dialogue.generation={rng:seed,sequence:0,recent:{}};
    localStorage.setItem('campus.slot.1',save(s));
   }''',seed)
   page.locator('.vn-toolbar [data-action="openQuick"]').click()
   page.locator('[data-action="quickTab"][data-value="save"]').click()
   page.locator('[data-action="load"][data-value="1"]').click()
   page.locator('[data-action="quickTab"][data-value="tools"]').click()
   page.locator('[data-action="closeQuick"]').click()
   open_tool(page,'travel');page.locator('[data-action="visit"][data-value="hall"]').click()
   choose(page,'encounter','engage');read_to_choices(page)
   assert page.locator('.vn-choices button').count()<=3
   line=page.locator('.vn-line').inner_text();data=save_snapshot(page)
   session=data['dialogue']['sessions']['1:afternoon:yeogyeong'];assert session['generated']
   assert session['response']['plan']['topic']=='checking'
   texts.append(session['response']['text'])
   assert data['dialogue']['generation']['sequence']==1
   assert page.locator('.vn-line').inner_text()==line
   if path=='/prototype/' and seed==176527:page.screenshot(path='/tmp/generated-dialogue-preview.png',full_page=True)
   # First generated option is always a real follow-up, with leave explicitly last.
   choose(page,'answer');read_to_choices(page)
   next_data=save_snapshot(page)
   assert next_data['dialogue']['generation']['sequence']==2
   assert len(next_data['dialogue']['generation']['recent']['yeogyeong'])==2
   assert next_data['clock']==data['clock']
   assert next_data['appointments']==data['appointments']
   assert next_data['inventory']==data['inventory']
   assert not errors,errors
   assert page.evaluate('document.documentElement.scrollWidth<=innerWidth')
   page.close()
  assert len(set(texts))==3,(path,texts)
 browser.close()
print('Generated dialogue browser smoke passed: both builds, same world with three streams, stable rendering and new turns')
