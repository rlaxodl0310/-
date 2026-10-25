"""Play a real photo exchange, NPC sharing, and a later sourced conversation."""
from flow_browser_helpers import open_map, visit_place, open_schedule, choose_activity, open_recruitment, end_day, go_campus
from playwright.sync_api import sync_playwright
import os
base=os.environ.get('CAMPUS_TEST_URL','http://127.0.0.1:8000')
with sync_playwright() as p:
    browser=p.chromium.launch(headless=True,executable_path='/usr/bin/chromium')
    for path in ['/prototype/','/demo/campus-demo.html']:
        page=browser.new_page(viewport={'width':390,'height':844})
        page.set_default_timeout(7000)
        errors=[];page.on('pageerror',lambda error:errors.append(str(error)))
        page.goto(base+path)
        visit_place(page, 'hall')
        page.get_by_role('button',name='하던 일을 계속하며 지나간다.').click()
        page.get_by_role('button',name='창가 쪽 빈자리를 찾아본다').click()
        page.locator('[data-action="encounter"][data-value="engage"]').click()
        page.get_by_role('button',name='빈 의자 쪽. 다 끝났는데 누가 방금까지 있었던 것 같아요.',exact=True).click()
        assert not page.locator('.heard-report').count()
        page.get_by_role('button',name='← 대화 마치기',exact=True).click()
        assert '13:30' in page.locator('.lead').inner_text()
        page.get_by_role('button',name='게시판 쪽으로 걸어간다').click()
        page.locator('[data-action="encounter"][data-value="engage"]').click()
        report=page.locator('.heard-report').inner_text()
        assert '박소율한테 들었어요' in report and '사진' in report
        assert '빈 의자' not in report
        page.get_by_role('button',name='← 대화 마치기',exact=True).click()
        page.get_by_role('button',name='← 뒤로',exact=True).click()
        page.get_by_role('button',name='메뉴',exact=True).click()
        page.get_by_role('button',name='저장',exact=True).first.click()
        saved=page.evaluate("JSON.parse(localStorage.getItem('campus.slot.1'))")
        assert saved['social']['knowledge']['seoyeon'][0]['via']=='heard'
        assert not saved['social']['knowledge'].get('yeogyeong')
        assert any('한서연에게 전해 들음' in k for k in saved['known'])
        assert not saved['dialogue'].get('facts',{}).get('seoyeon',{}).get('photo')
        page.get_by_role('button',name='불러오기',exact=True).first.click()
        loaded=page.evaluate("JSON.parse(localStorage.getItem('campus.slot.1'))")
        assert loaded['social']==saved['social']
        assert page.evaluate('document.documentElement.scrollWidth<=innerWidth')
        assert not errors,errors
        page.close()
    browser.close()
print('Social sharing browser smoke passed: module and standalone')
