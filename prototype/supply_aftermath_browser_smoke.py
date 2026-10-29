"""Yesterday's shared work creates today's actual proposal and a saved twenty-minute encounter."""
import os
from playwright.sync_api import sync_playwright
from vn_browser_helpers import choose,read_to_choices,finish_school_morning
base=os.environ.get('CAMPUS_TEST_URL','http://127.0.0.1:8000')
def load(page,n):
 page.locator('.vn-toolbar [data-action="openQuick"]').click();page.locator('[data-action="quickTab"][data-value="save"]').click();page.locator(f'[data-action="load"][data-value="{n}"]').click();page.locator('[data-action="quickTab"][data-value="tools"]').click()
def save(page,n):
 page.locator('.vn-toolbar [data-action="openQuick"]').click();page.locator('[data-action="quickTab"][data-value="save"]').click();page.locator(f'[data-action="save"][data-value="{n}"]').click();return page.evaluate(f"JSON.parse(localStorage.getItem('campus.slot.{n}'))")
with sync_playwright() as p:
 browser=p.chromium.launch(headless=True,executable_path='/usr/bin/chromium')
 for path in ['/prototype/','/demo/campus-demo.html']:
  page=browser.new_page(viewport={'width':390,'height':844});page.set_default_timeout(8000);errors=[];page.on('pageerror',lambda e:errors.append(str(e)));page.goto(base+path)
  page.evaluate("""async()=>{const {newGame,save}=await import('/prototype/simulation.js'),{advanceFreeTime}=await import('/prototype/free-roam.js'),{readCommunityPost}=await import('/prototype/community.js'),{beginCommunityActivity,progressCommunityActivity}=await import('/prototype/community-activities.js');let s=newGame();s.clock.minute=780;s=advanceFreeTime(s,0);s.location='hall';for(const id of Object.keys(s.npcs))s.supplyStory.plan[id]={attending:true,join:780,leave:960,role:'labels'};s=beginCommunityActivity(readCommunityPost(s,'volunteer-recruit'),'volunteer-recruit');for(const c of ['roles','labels','handover'])s=progressCommunityActivity(s,c);localStorage.setItem('campus.slot.1',save(s));}""")
  load(page,1);page.locator('[data-action="go"][data-value="travel"]').click();page.locator('[data-action="visit"][data-value="field"]').click();choose(page,'go','campus');choose(page,'go','dayEnd');choose(page,'freeHome');choose(page,'nextDay')
  page.locator('.vn-toolbar [data-action="phone"]').click();page.get_by_role('button',name='메시지',exact=True).click();assert '13:30' in page.locator('.page-reading').inner_text();page.get_by_role('button',name='← 뒤로',exact=True).click();page.get_by_role('button',name='일정',exact=True).click()
  offer=page.locator('[data-appointment-id^="supply-followup:"]');assert offer.count()==1;offer.locator('[data-action="acceptOffer"]').click()
  page.get_by_role('button',name='← 뒤로',exact=True).click();page.get_by_role('button',name='← 뒤로',exact=True).click();finish_school_morning(page)
  choose(page,'go','campus');choose(page,'visit','library');read_to_choices(page)
  if page.locator('.vn-choices [data-action="encounter"]').count():choose(page,'encounter','pass')
  choose(page,'wait');assert '13:30' in page.locator('.scene-time').inner_text();choose(page,'startSupplyAftermath','yeogyeong');assert page.locator('.vn-stage[data-vn-screen="supplyAftermath"]').count()==1
  choose(page,'stepSupplyAftermath','listen');assert '13:40' in page.locator('.scene-time').inner_text()
  snap=save(page,2);assert snap['supplyAftermath']['records']['yeogyeong']['spent']==10;assert next(a for a in snap['appointments'] if a['kind']=='supply-followup')['status']=='pending'
  page.reload();load(page,2);page.locator('[data-action="startSupplyAftermath"][data-value="yeogyeong"]').click();read_to_choices(page)
  if path=='/prototype/':page.screenshot(path='/tmp/supply-aftermath-preview.png')
  choose(page,'stepSupplyAftermath','share');assert '13:50' in page.locator('.scene-time').inner_text();choose(page,'leaveSupplyAftermath')
  final=save(page,3);assert final['supplyAftermath']['completed']['yeogyeong']['outcome']=='shared';assert next(a for a in final['appointments'] if a['kind']=='supply-followup')['status']=='kept';assert final['supplyAftermath']['records']['yeogyeong']['spent']==20
  assert page.evaluate('document.documentElement.scrollWidth<=innerWidth');assert not errors,errors;page.close()
 browser.close()
print('Supply aftermath: both builds, real next day, message/proposal acceptance, classes, actual meeting, saved midpoint and twenty-minute fulfillment passed')
