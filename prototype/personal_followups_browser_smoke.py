import http.server,threading,os
from playwright.sync_api import sync_playwright
from vn_browser_helpers import confirm_returning_plan,choose,read_to_choices,open_tool
class Quiet(http.server.SimpleHTTPRequestHandler):
 def log_message(self,*args):pass
server=http.server.ThreadingHTTPServer(('127.0.0.1',0),Quiet);threading.Thread(target=server.serve_forever,daemon=True).start()
try:
 with sync_playwright() as p:
  b=p.chromium.launch(headless=True,executable_path='/usr/bin/chromium')
  for path in ['/prototype/','/demo/campus-demo.html']:
   for width in [390,1440]:
    page=b.new_page(viewport={'width':width,'height':900});page.set_default_timeout(10000);errors=[];page.on('pageerror',lambda e:errors.append(str(e)));base=f'http://127.0.0.1:{server.server_port}';page.goto(base+path);confirm_returning_plan(page)
    for person in os.environ.get('CAMPUS_FOLLOWUP_PEOPLE','taei,yeogyeong,seoyeon,soyul,iseo').split(','):
     for episode in map(int,os.environ.get('CAMPUS_FOLLOWUP_EPISODES','2,3').split(',')):
      eventId=f'{person}:{episode}'
      fixture=page.evaluate("""async ({base,person,episode})=>{const sim=await import(base+'/prototype/simulation.js'),p=await import(base+'/prototype/personal-events.js'),days=await import(base+'/prototype/days.js');let s=sim.newAfternoonScenario('close');const set=d=>{s.day=d;s.clock.minute=person==='iseo'?960:780;s.location=person==='taei'?'cafe':person==='iseo'?'gym':days.currentSchedule(s)[person];};const complete=(id)=>{s=p.beginPersonalEvent(s,id);const first=person==='iseo'&&id==='iseo'?'introduce':p.personalEventView(s).options[0][0];s=p.progressPersonalEvent(s,first);s=p.progressPersonalEvent(s,p.personalEventView(s).options[0][0]);};set(1);complete(person);if(episode===3){set(2);complete(person+':2');}set(episode===2?8:9);return s;}""",{'base':base,'person':person,'episode':episode})
      page.evaluate("s=>localStorage.setItem('campus.slot.1',JSON.stringify(s))",fixture);page.reload();page.locator('.opening-tools [data-action="openQuick"]').click();page.locator('[data-action="load"][data-value="1"]').click();page.locator('[data-navigation-back]').first.click()
      open_tool(page,'travel');page.locator('#travel-search').fill({'cafe':'대학가 카페','gym':'체육관','hall':'자유관','cafeteria':'외식관','library':'창조관 · 도서관'}[fixture['location']]);page.locator(f'[data-action="visit"][data-value="{fixture["location"]}"]').click()
      if page.locator('.vn-stage').get_attribute('data-vn-screen')=='encounter':choose(page,'encounter','pass')
      choose(page,'openPersonalEvent',eventId);read_to_choices(page);assert page.locator('.cast-member').count()==(1 if person=='taei' else 2)
      button=page.locator('.vn-choices [data-action="personalEventChoice"]').first;first=button.get_attribute('data-value');choose(page,'personalEventChoice',first);read_to_choices(page)
      assert 'undefined' not in page.locator('.vn-line').inner_text()
      if path=='/prototype/' and width==1440:page.screenshot(path=f'docs/assets/personal-followup-{person}-{episode}.png',full_page=True)
      page.locator('[data-action="pausePersonalEvent"]').first.click();choose(page,'openPersonalEvent',eventId);read_to_choices(page)
      page.locator('[data-action="openQuick"]').first.click();page.locator('[data-action="quickTab"][data-value="save"]').click();page.locator('[data-action="save"][data-value="1"]').click();mid=page.evaluate("JSON.parse(localStorage.getItem('campus.slot.1'))");assert mid['personalEvents']['records'][eventId]['stage']==1
      page.locator('[data-action="load"][data-value="1"]').click();page.locator('[data-navigation-back]').first.click()
      open_tool(page,'travel');page.locator('#travel-search').fill({'cafe':'대학가 카페','gym':'체육관','hall':'자유관','cafeteria':'외식관','library':'창조관 · 도서관'}[fixture['location']]);page.locator(f'[data-action="visit"][data-value="{fixture["location"]}"]').click()
      if page.locator('.vn-stage').get_attribute('data-vn-screen')=='encounter':choose(page,'encounter','pass')
      choose(page,'openPersonalEvent',eventId);read_to_choices(page);last=page.locator('.vn-choices [data-action="personalEventChoice"]').first.get_attribute('data-value');choose(page,'personalEventChoice',last);read_to_choices(page);choose(page,'pausePersonalEvent')
      page.locator('[data-action="openQuick"]').first.click();page.locator('[data-action="quickTab"][data-value="save"]').click();page.locator('[data-action="save"][data-value="1"]').click();end=page.evaluate("JSON.parse(localStorage.getItem('campus.slot.1'))");assert end['personalEvents']['records'][eventId]['status']=='completed';assert len(end['personalEvents']['records'])==episode;assert end['clock']['minute']==fixture['clock']['minute']+30
      page.locator('[data-action="quickTab"][data-value="tools"]').click();page.locator('[data-value="personalStories"]').click();assert page.locator('.page-reading article.list').count()==episode;assert page.evaluate('document.documentElement.scrollWidth<=innerWidth+1')
    assert not errors,errors;page.close()
  b.close()
finally:server.shutdown();server.server_close()
print('Followups passed: people='+os.environ.get('CAMPUS_FOLLOWUP_PEOPLE','taei,yeogyeong,seoyeon,soyul,iseo')+'; chapters='+os.environ.get('CAMPUS_FOLLOWUP_EPISODES','2,3')+'; both builds/mobile/desktop, map entry, pause, save/load, 30 minutes, separate records')
