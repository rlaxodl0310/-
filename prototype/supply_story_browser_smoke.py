"""A real multi-person work scene, saved decisions, burden branch and unseen resolution."""
import os
from playwright.sync_api import sync_playwright
from vn_browser_helpers import choose,read_to_choices
base=os.environ.get('CAMPUS_TEST_URL','http://127.0.0.1:8000')
def load_fixture(page):
 page.locator('.vn-toolbar [data-action="openQuick"]').click();page.locator('[data-action="quickTab"][data-value="save"]').click();page.locator('[data-action="load"][data-value="1"]').click();page.locator('[data-action="quickTab"][data-value="tools"]').click()
def save_slot(page,n):
 page.locator('.vn-toolbar [data-action="openQuick"]').click();page.locator('[data-action="quickTab"][data-value="save"]').click();page.locator(f'[data-action="save"][data-value="{n}"]').click();return page.evaluate(f"JSON.parse(localStorage.getItem('campus.slot.{n}'))")
with sync_playwright() as p:
 browser=p.chromium.launch(headless=True,executable_path='/usr/bin/chromium')
 for path in ['/prototype/','/demo/campus-demo.html']:
  page=browser.new_page(viewport={'width':390,'height':844});page.set_default_timeout(8000);errors=[];page.on('pageerror',lambda e:errors.append(str(e)));page.goto(base+path)
  # Bootstrap a genuine normal-game world with three explicit attendance windows.
  page.evaluate("""async()=>{const {newGame,save}=await import('/prototype/simulation.js'),{advanceFreeTime}=await import('/prototype/free-roam.js');let s=newGame();s.clock.minute=780;s=advanceFreeTime(s,0);s.location='hall';s.everydayLife={rng:1,history:[],pending:null,sequence:0};s.supplyStory.issue='departure';for(const id of ['yeogyeong','seoyeon','soyul'])s.supplyStory.plan[id]={attending:true,join:780,leave:960,role:'labels'};s.supplyStory.plan.seoyeon.leave=840;s.supplyStory.plan.soyul.join=810;localStorage.setItem('campus.slot.1',save(s));}""")
  load_fixture(page);page.locator('[data-action="go"][data-value="travel"]').click();page.locator('[data-action="visit"][data-value="hall"]').click();read_to_choices(page)
  if page.locator('.vn-choices [data-action="encounter"]').count():choose(page,'encounter','pass')
  # Local activity entry uses the same new scene as the posted public event.
  choose(page,'select','volunteer');choose(page,'act','volunteer');assert page.locator('.vn-stage[data-vn-screen="communityActivity"]').count()==1
  choose(page,'eventStep','roles');assert '13:30' in page.locator('.scene-time').inner_text()
  snap=save_slot(page,2);r=snap['activitySessions']['records']['1:volunteer-recruit'];assert r['supplyGroup'];assert not snap['everydayLife']['history'];assert snap['contacts']['yeogyeong']['introduced'];assert snap['contacts']['seoyeon']['introduced'];assert not snap['contacts'].get('soyul',{}).get('introduced',False)
  page.reload();page.locator('.vn-toolbar [data-action="openQuick"]').click();page.locator('[data-action="quickTab"][data-value="save"]').click();page.locator('[data-action="load"][data-value="2"]').click();page.locator('[data-action="quickTab"][data-value="tools"]').click();page.locator('[data-action="eventResume"]').click();choose(page,'eventStep','askHelp');read_to_choices(page)
  if path=='/prototype/':page.screenshot(path='/tmp/supply-group-preview.png')
  choose(page,'eventStep','handover');read_to_choices(page)
  final=save_slot(page,3);assert final['supplyStory']['status']=='resolved';assert final['supplyStory']['playerFinished'];assert final['contacts']['soyul']['introduced'];assert final['clock']['minute']==960;assert len([e for e in final['events'] if e['id']=='supplies'])==1
  assert not errors,errors;assert page.evaluate('document.documentElement.scrollWidth<=innerWidth');page.close()
 # Player chooses music instead; no hidden names or unseen world outcome leaks into the diary.
 page=browser.new_page(viewport={'width':390,'height':844});page.goto(base+'/prototype/')
 page.evaluate("""async()=>{const {newGame,save}=await import('/prototype/simulation.js'),{advanceFreeTime}=await import('/prototype/free-roam.js');let s=newGame();s.clock.minute=780;s=advanceFreeTime(s,0);s.location='arts';s=advanceFreeTime(s,180);localStorage.setItem('campus.slot.1',save(s));}""")
 load_fixture(page);page.locator('[data-action="go"][data-value="journal"]').click();assert '정리했다.' not in page.locator('.page-reading').inner_text();assert '수량과 남은 일을 서로 확인' not in page.locator('.page-reading').inner_text();page.close();browser.close()
print('Supply story: both builds, local entry, actual introductions/arrivals, saved role decision, group handover and unseen-outcome privacy passed')
