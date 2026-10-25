"""Check immediate discovery feedback, collection UI, persistence and narrow layouts."""
from flow_browser_helpers import open_map, visit_place, open_schedule, choose_activity, open_recruitment, end_day, go_campus
from playwright.sync_api import sync_playwright
import os
base=os.environ.get('CAMPUS_TEST_URL','http://127.0.0.1:8000')
with sync_playwright() as p:
    browser=p.chromium.launch(headless=True,executable_path='/usr/bin/chromium')
    for path in ['/prototype/','/demo/campus-demo.html']:
        page=browser.new_page(viewport={'width':390,'height':844})
        page.set_default_timeout(7000)
        errors=[]
        page.on('pageerror',lambda error: errors.append(str(error)))
        page.goto(base+path)
        open_map(page)
        page.get_by_role('button',name='도서관 찾아가기').click()
        assert '도서관 층별 안내' in page.locator('.discovery-notice').inner_text()
        page.get_by_role('button',name='확인',exact=True).click()
        assert not page.locator('.discovery-notice').count()
        page.get_by_role('button',name='반납대와 자료실을 둘러본다').click()
        assert '도서관 공용 프린터 위치' in page.locator('.discovery-notice').inner_text()
        page.get_by_role('button',name='정보 · 소지품 확인',exact=True).click()
        assert page.get_by_role('heading',name='알게 된 정보 · 소지품',exact=True).is_visible()
        assert '1일차 · 오후 · 도서관에 확인' in page.locator('.page').inner_text()
        assert page.get_by_text('획득한 아이템이 없습니다.',exact=True).is_visible()
        page.get_by_role('button',name='확인',exact=True).click()
        page.get_by_role('button',name='← 뒤로',exact=True).click()
        page.get_by_role('button',name='← 뒤로',exact=True).click()
        page.get_by_role('button',name='반납대와 자료실을 둘러본다').click()
        assert not page.locator('.discovery-notice').count()
        page.get_by_role('button',name='← 뒤로',exact=True).click()
        page.get_by_role('button',name='메뉴',exact=True).click()
        page.get_by_role('button',name='저장',exact=True).first.click()
        saved=page.evaluate("JSON.parse(localStorage.getItem('campus.slot.1'))")
        assert len(saved['discoveries'])==2
        # A saved-item fixture validates the item list without inventing gameplay rewards.
        saved['inventory']=[{'id':'water','name':'생수','quantity':2}]
        page.evaluate("s=>localStorage.setItem('campus.slot.1',JSON.stringify(s))",saved)
        page.get_by_role('button',name='불러오기',exact=True).first.click()
        page.get_by_role('button',name='← 뒤로',exact=True).click()
        page.get_by_role('button',name='휴대폰',exact=True).click()
        page.get_by_role('button',name='알게 된 정보 · 소지품',exact=True).click()
        assert '생수 × 2' in page.locator('.page .item-text').all_text_contents()
        assert page.evaluate('document.documentElement.scrollWidth<=innerWidth')
        if path=='/prototype/':page.screenshot(path='/tmp/discoveries-ui.png',full_page=True)
        assert not errors,errors
        page.close()
    browser.close()
print('Discovery UI smoke passed: module and standalone at mobile width')
