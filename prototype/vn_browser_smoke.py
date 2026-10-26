"""Sequential reading, few choices, menu return, real school and incidental conversation."""
import os
from playwright.sync_api import sync_playwright
from vn_browser_helpers import read_to_choices,choose,open_tool,finish_school_morning
base=os.environ.get('CAMPUS_TEST_URL','http://127.0.0.1:8000')
with sync_playwright() as p:
 browser=p.chromium.launch(headless=True,executable_path='/usr/bin/chromium')
 for path in ['/prototype/','/demo/campus-demo.html']:
  for width,height in [(390,844),(1440,1000)]:
   page=browser.new_page(viewport={'width':width,'height':height});page.set_default_timeout(7000);errors=[]
   page.on('pageerror',lambda e:errors.append(str(e)))
   page.goto(base+path)
   assert page.locator('.vn-stage').is_visible()
   for selector in ['.scene-visual','.scene-visual .portrait']:
    assert page.locator(selector).evaluate(r'''async el=>{
     const url=getComputedStyle(el).backgroundImage.match(/url\(["']?([^"')]+)["']?\)/)?.[1];if(!url)return false;
     const image=new Image();image.src=url;await image.decode();return image.naturalWidth>0;
    }''')
   assert page.locator('.vn-panel').evaluate(r'''el=>{
    const c=getComputedStyle(el),linear=x=>{x/=255;return x<=.04045?x/12.92:((x+.055)/1.055)**2.4};
    const lum=s=>{const a=s.match(/[\d.]+/g).slice(0,3).map(Number).map(linear);return .2126*a[0]+.7152*a[1]+.0722*a[2]};
    const a=lum(c.color),b=lum(c.backgroundColor);return (Math.max(a,b)+.05)/(Math.min(a,b)+.05)>=4.5;
   }''')
   assert not page.locator('.vn-choices').count()
   assert page.locator('.vn-controls button').count()==1
   before_time=page.locator('.scene-time').inner_text()
   before_text=page.locator('.vn-line').inner_text()
   if path=='/prototype/':page.screenshot(path=f'/tmp/vn-reading-{width}.png',full_page=True)
   page.locator('.vn-toolbar [data-action="openQuick"]').click()
   assert page.get_by_role('heading',name='메뉴',exact=True).is_visible()
   assert page.locator('[data-action="quickTab"]').count()==2
   if path=='/prototype/':page.screenshot(path=f'/tmp/vn-menu-{width}.png',full_page=True)
   page.locator('[data-action="quickTab"][data-value="save"]').click()
   page.locator('[data-action="save"][data-value="1"]').click()
   saved=page.evaluate("JSON.parse(localStorage.getItem('campus.slot.1'))")
   assert saved['clock']['minute']==540 and not saved['academics']['records']
   page.locator('[data-action="closeQuick"]').click()
   assert page.locator('.vn-line').inner_text()==before_text
   assert page.locator('.scene-time').inner_text()==before_time
   # Reading with the keyboard reveals answers; reading alone never attends a course.
   page.locator('.vn-panel').focus();page.keyboard.press('Space')
   read_to_choices(page)
   assert page.locator('.vn-choices button').count()<=3
   assert page.locator('.scene-time').inner_text()==before_time
   if path=='/prototype/':page.screenshot(path=f'/tmp/vn-choices-{width}.png',full_page=True)
   choose(page,'classTravel');choose(page,'classPrepare')
   assert not page.locator('.vn-choices').count()
   if path=='/prototype/':page.screenshot(path=f'/tmp/vn-class-{width}.png',full_page=True)
   page.locator('.vn-copy').click()
   assert '09:00' in page.locator('.scene-time').inner_text()
   choose(page,'classChoice')
   assert '11:00' in page.locator('.scene-time').inner_text()
   choose(page,'classTravel');choose(page,'classPrepare');choose(page,'classChoice')
   assert '13:00' in page.locator('.scene-time').inner_text()
   read_to_choices(page)
   at_choice=page.locator('.vn-choices').inner_text()
   open_tool(page,'timetable')
   assert page.locator('.list').filter(has_text='출석').count()==2
   page.get_by_role('button',name='← 뒤로',exact=True).click()
   page.locator('[data-action="closeQuick"]').click()
   assert page.locator('.vn-choices').inner_text()==at_choice
   # Physical travel is deliberately in the upper menu, not mixed with dialogue answers.
   open_tool(page,'travel');page.locator('[data-action="visit"][data-value="hall"]').click()
   assert page.locator('.vn-stage').get_attribute('data-vn-screen')=='encounter'
   assert '차여경' not in page.locator('.vn-line').inner_text()
   choose(page,'encounter','engage')
   assert page.locator('.vn-stage').get_attribute('data-vn-screen')=='dialogue'
   utterances=[]
   for _ in range(16):
    utterances.append((page.locator('.vn-speaker').inner_text(),page.locator('.vn-line').inner_text()))
    next_button=page.locator('[data-action="vnNext"]')
    if not next_button.count():break
    next_button.click()
   assert any(who=='김태이' for who,_ in utterances)
   assert any(who=='차여경' for who,_ in utterances)
   assert page.locator('.vn-choices button').count()<=3
   if path=='/prototype/':page.screenshot(path=f'/tmp/vn-dialogue-{width}.png',full_page=True)
   line=page.locator('.vn-line').inner_text();clock=page.locator('.scene-time').inner_text()
   page.locator('.vn-toolbar [data-action="phone"]').click()
   page.get_by_role('button',name='학내 커뮤니티',exact=True).click()
   assert page.get_by_role('heading',name='캠퍼스톡',exact=True).is_visible()
   # Reading a club notice opens another VN page without losing the original conversation.
   page.get_by_role('button',name='모집',exact=True).click()
   page.locator('[data-action="readPost"][data-value="volunteer-recruit"]').click()
   page.get_by_role('button',name='이 글의 모집 안내를 자세히 읽는다.',exact=True).click()
   choose(page,'go','communityPost')
   page.get_by_role('button',name='← 뒤로',exact=True).click()
   page.get_by_role('button',name='← 뒤로',exact=True).click()
   page.get_by_role('button',name='← 뒤로',exact=True).click()
   assert page.locator('.vn-line').inner_text()==line,(line,page.locator('.vn-line').inner_text())
   assert page.locator('.scene-time').inner_text()==clock
   choose(page,'answer')
   assert page.locator('.vn-speaker').inner_text()=='김태이'
   assert not page.locator('.vn-choices').count()
   read_to_choices(page)
   choose(page,'vnBranch','conversation');choose(page,'go','place')
   open_tool(page,'travel');page.locator('[data-action="visit"][data-value="library"]').click()
   choose(page,'libraryActivity','read')
   assert '소설' in page.locator('.vn-line').inner_text()
   assert page.locator('.vn-controls button').count()<=2
   assert page.evaluate('document.documentElement.scrollWidth<=innerWidth')
   assert not errors,errors
   page.close()
 browser.close()
print('Visual novel browser smoke passed: both builds, mobile and desktop')
