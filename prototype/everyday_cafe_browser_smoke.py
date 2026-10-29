"""Actual counter ordering, collected ownership, a stranger boundary and a saved chance event."""
import os
from playwright.sync_api import sync_playwright
from vn_browser_helpers import choose,read_to_choices,open_tool
base=os.environ.get('CAMPUS_TEST_URL','http://127.0.0.1:8000')
def save_slot(page,n):
 page.locator('.vn-toolbar [data-action="openQuick"]').click();page.locator('[data-action="quickTab"][data-value="save"]').click();page.locator(f'[data-action="save"][data-value="{n}"]').click();return page.evaluate(f"JSON.parse(localStorage.getItem('campus.slot.{n}'))")
def load_slot(page,n):
 page.locator('.vn-toolbar [data-action="openQuick"]').click();page.locator('[data-action="quickTab"][data-value="save"]').click();page.locator(f'[data-action="load"][data-value="{n}"]').click();page.locator('[data-action="quickTab"][data-value="tools"]').click()
with sync_playwright() as p:
 browser=p.chromium.launch(headless=True,executable_path='/usr/bin/chromium')
 for path in ['/prototype/','/demo/campus-demo.html']:
  page=browser.new_page(viewport={'width':390,'height':844});errors=[];page.on('pageerror',lambda e:errors.append(str(e)));page.goto(base+path)
  open_tool(page,'travel');page.locator('[data-action="visit"][data-value="cafe"]').click();choose(page,'walk','counter');choose(page,'cafeChoose','latte');choose(page,'cafeTemperature','iced');choose(page,'cafePay');read_to_choices(page)
  if path=='/prototype/':page.screenshot(path='/tmp/cafe-order-preview.png')
  s=save_slot(page,1);assert s['cafeLife']['spent']==3800 and not s['inventory'];assert len(s['cafeLife']['orders'])==1;paid_time=s['clock']['minute']
  page.reload();load_slot(page,1);page.locator('[data-action="go"][data-value="travel"]').click();page.locator('[data-action="visit"][data-value="cafe"]').click();choose(page,'walk','counter');choose(page,'cafeCollect')
  s=save_slot(page,2);assert len(s['inventory'])==1 and s['cafeLife']['spent']==3800;assert s['clock']['minute']==paid_time
  page.locator('[data-action="closeQuick"]').click();choose(page,'cafeDrink');assert page.evaluate('document.documentElement.scrollWidth<=innerWidth');assert not errors,errors;page.close()
 # Seed a repeatable outdoor event without changing the UI's action outcome.
 page=browser.new_page(viewport={'width':390,'height':844});page.goto(base+'/prototype/')
 page.evaluate("""async()=>{const {newGame,save}=await import('/prototype/simulation.js'),{outdoorActivity}=await import('/prototype/outdoor-life.js'),{varyEverydayAction}=await import('/prototype/everyday-life.js');for(let seed=1;seed<200;seed++){const s=newGame();s.location='field';s.everydayLife={rng:seed,history:[],pending:null,sequence:0};const a=outdoorActivity(s,'jog'),r=varyEverydayAction(a.state,{action:'jog',text:a.text,minute:540});if(r.state.everydayLife.pending){localStorage.setItem('campus.slot.1',save(s));break;}}}""")
 load_slot(page,1);page.locator('[data-action="go"][data-value="travel"]').click();page.locator('[data-action="visit"][data-value="field"]').click();choose(page,'outdoorActivity','jog');read_to_choices(page)
 assert page.locator('.vn-choices [data-action="everydayChoice"]').count()==2;page.screenshot(path='/tmp/everyday-event-preview.png');s=save_slot(page,2);pending=s['everydayLife']['pending'];assert pending['id']=='rolling-ball'
 page.reload();load_slot(page,2);page.locator('[data-action="resumeEveryday"]').click();read_to_choices(page);assert page.locator('.vn-choices [data-action="everydayChoice"]').count()==2
 choose(page,'everydayChoice','return');choose(page,'outdoorActivity','jog');s=save_slot(page,3);history=s['everydayLife']['history'];assert history[0]['text']!=history[1]['text'];assert history[0]['eventOutcome']=='return';assert s['everydayLife']['pending'] is None;assert not s['inventory'];assert s['clock']['minute']==600
 page.close()
 page=browser.new_page(viewport={'width':390,'height':844});page.goto(base+'/prototype/');page.evaluate("""async()=>{const {newAfternoonScenario,save}=await import('/prototype/simulation.js');const s=newAfternoonScenario();s.day=2;s.clock.minute=840;localStorage.setItem('campus.slot.1',save(s));}""");load_slot(page,1);page.locator('[data-action="go"][data-value="travel"]').click();page.locator('[data-action="visit"][data-value="cafe"]').click();read_to_choices(page);assert '앉아도' not in page.locator('.vn-choices').inner_text();assert '주문 기다리는 줄' in page.locator('.vn-choices').inner_text();page.close();browser.close()
print('Everyday/cafe: both builds order/pay/save/collect/drink; actual chance event response and saved resume, changing repeat activity and stranger boundaries passed')
