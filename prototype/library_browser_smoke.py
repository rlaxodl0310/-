"""Library life, batched time, continuity and local save: mobile in both builds."""
from flow_browser_helpers import finish_morning
import os
from playwright.sync_api import sync_playwright
base=os.environ.get('CAMPUS_TEST_URL','http://127.0.0.1:8000')
with sync_playwright() as p:
 browser=p.chromium.launch(headless=True,executable_path='/usr/bin/chromium')
 for path in ['/prototype/','/demo/campus-demo.html']:
  page=browser.new_page(viewport={'width':390,'height':844});errors=[]
  page.on('pageerror',lambda e:errors.append(str(e)))
  page.goto(base+path)
  finish_morning(page)
  page.get_by_role('button',name='도서관으로 이어지는 길을 따라간다.',exact=True).click()
  assert '점심시간' in page.locator('.page').inner_text()
  for label in ['서가에서 눈에 들어온 책을 읽는다.','조용한 자리에 앉아 코딩 공부를 한다.','로비 벤치에서 잠깐 쉰다.']:
   page.get_by_role('button',name=label,exact=True).click()
  assert '13:30' in page.locator('.lead').inner_text()
  page.get_by_role('button',name='서가에서 눈에 들어온 책을 읽는다.',exact=True).click()
  assert '책갈피' in page.locator('p.notice[role="status"]').inner_text()
  assert '13:30' in page.locator('.lead').inner_text()
  if path=='/prototype/':page.screenshot(path='/tmp/library-life-preview.png',full_page=True)
  page.get_by_role('button',name='← 뒤로',exact=True).click()
  page.get_by_role('button',name='메뉴',exact=True).click()
  page.get_by_role('button',name='저장',exact=True).first.click()
  stored=page.evaluate("JSON.parse(localStorage.getItem('campus.slot.1'))")
  assert len(stored['libraryLife']['history'])==4
  page.reload()
  page.get_by_role('button',name='메뉴',exact=True).click()
  page.get_by_role('button',name='불러오기',exact=True).first.click()
  assert '13:30' in page.locator('.page').inner_text()
  assert not errors,errors
  assert page.evaluate('document.documentElement.scrollWidth<=innerWidth')
  page.close()
 browser.close()
print('Library life browser smoke passed: module and standalone')
