import http.server,threading
from playwright.sync_api import sync_playwright
from vn_browser_helpers import confirm_returning_plan,open_tool
class Quiet(http.server.SimpleHTTPRequestHandler):
 def log_message(self,*args):pass
server=http.server.ThreadingHTTPServer(('127.0.0.1',0),Quiet);threading.Thread(target=server.serve_forever,daemon=True).start();base=f'http://127.0.0.1:{server.server_port}'
try:
 with sync_playwright() as p:
  browser=p.chromium.launch(executable_path='/usr/bin/chromium',headless=True)
  seed=browser.new_page();seed.goto(base+'/prototype/')
  fixture=seed.evaluate("""async base=>{const sim=await import(base+'/prototype/simulation.js'),stats=await import(base+'/prototype/character-stats.js');let s=sim.newAfternoonScenario();stats.initializeCharacterSystem(s,{seed:1});for(const id of stats.characterAbilityIds)s.characterSystem.presence[id]=id==='taei';return s;}""",base);seed.close()
  for path in ['/prototype/','/demo/campus-demo.html']:
   for width in [390,1440]:
    page=browser.new_page(viewport={'width':width,'height':900},reduced_motion='reduce');page.set_default_timeout(10000);errors=[];page.on('pageerror',lambda e:errors.append(str(e)));page.goto(base+path);confirm_returning_plan(page)
    page.evaluate("s=>localStorage.setItem('campus.slot.1',JSON.stringify(s))",fixture);page.reload();page.locator('.opening-tools [data-action="openQuick"]').click();page.locator('[data-action="load"][data-value="1"]').click();page.locator('[data-navigation-back]').first.click()
    open_tool(page,'characterStats');assert page.locator('[data-stats-character]').count()==1;assert page.locator('.ability-grid dt').all_text_contents()==['힘','민첩','체력','인내','정신력'];assert '정이서' not in page.locator('#app').inner_text();assert page.locator('.ability-grid small').all_text_contents()==['/18','/20','/46','/38','/42']
    assert page.evaluate('document.documentElement.scrollWidth<=innerWidth+1');page.locator('summary').click();assert '성인 남성 평균2~5' in page.locator('#app').inner_text();page.locator('summary').click()
    if path=='/prototype/':page.screenshot(path=f'/tmp/character-stats-{width}.png',full_page=True)
    page.locator('[data-navigation-back]').first.click();page.locator('[data-action="go"][data-value="combatSetup"]').click();page.locator('[data-action="combatStart"]').click()
    assert '최대 4칸' in page.locator('.tactical-command').inner_text();assert '스태미나 13' in page.locator('.tactical-command').inner_text();assert page.evaluate('document.documentElement.scrollWidth<=innerWidth+1');assert not errors,errors;page.close()
  browser.close()
finally:server.shutdown();server.server_close()
print('Ability UI and actual combat costs passed: web/offline, mobile/desktop, five stats, hidden unknown cast, 4-cell move and 13-cost attack.')
